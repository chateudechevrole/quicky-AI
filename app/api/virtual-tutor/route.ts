import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // action: 'START' | 'CHAT' | 'SUMMARIZE'
    // theme: string (required for START/CHAT/SUMMARIZE context)
    // message: string (user's message for CHAT)
    // history: array of { role: string, text: string }
    const { action, theme, message, history } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.0-flash for speed and JSON capabilities
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    let systemInstructions = `You are Quicky, a friendly and enthusiastic English tutor for Malaysian primary school kids.
You speak simple, clear English suitable for 7-12 year olds.
Your goal is to help them practice speaking about specific topics.

JSON Output Format (for START and CHAT actions):
{
  "spoken_response": "String (The main response text to speak)",
  "correction": "String (Optional: specific grammar correction if needed, or null)",
  "vocabulary": ["Word1", "Word2", "Word3"],
  "hints": ["Hint phrase 1...", "Hint phrase 2..."]
}

JSON Output Format (for SUMMARIZE action ONLY):
{
  "summary": "String (A friendly paragraph summarizing what the student did well and what they talked about)",
  "stars": Number (An integer 1-5 based on their performance: 1=poor, 2=needs improvement, 3=good, 4=very good, 5=excellent),
  "badge": "String (A short fun title like 'Grammar Guru', 'Chatty Cathy', 'Word Wizard', 'Story Star', etc.)"
}`;

    let userPrompt = "";

    if (action === 'START') {
      userPrompt = `Start a conversation about the theme: "${theme}".
      Ask an engaging opening question.
      Vocabulary: Provide 3 simple vocabulary words that will help the user answer this question.
      Hints: Provide 2 sentence starters (incomplete sentences) to help them answer. Example: 'I think that...', 'It reminds me of...'.`;
    } else if (action === 'CHAT') {
      userPrompt = `Theme: "${theme}".
      Student said: "${message}".
      
      1. Check grammar. If there's a mistake, put a gentle correction in the "correction" field (e.g., "Good try! We say 'I *went* to KLCC', not 'I go'.").
      2. Reply naturally to the student's message in "spoken_response". Keep it encouraging and brief (1-2 sentences). Ask a follow-up question.
      3. Vocabulary: Provide 3 simple vocabulary words that will help the user answer your specific follow-up question.
      4. Hints: Provide 2 sentence starters (incomplete sentences) for their next turn. They should NOT be full answers. Example: 'I like...', 'My favorite is...'.`;
      
      // Include recent history context if available
      if (history && history.length > 0) {
        // Limit history to last 6 turns to save context window, though 2.0 flash has plenty
        const historyText = history.slice(-6).map((h: any) => `${h.role}: ${h.text}`).join('\n');
        userPrompt = `Previous Context:\n${historyText}\n\n${userPrompt}`;
      }
    } else if (action === 'SUMMARIZE') {
      const historyText = history ? history.map((h: any) => `${h.role}: ${h.text}`).join('\n') : '';
      userPrompt = `Conversation History:\n${historyText}\n\n
      Task: Generate a summary of the student's performance.
      
      1. "summary": Write a friendly paragraph (2-3 sentences) summarizing what the student did well and what they talked about during this chat about "${theme}". End with an encouraging remark.
      
      2. "stars": Rate their performance as an integer from 1 to 5:
         - 1 = Poor (many mistakes, very short answers)
         - 2 = Needs Improvement (some mistakes, short answers)
         - 3 = Good (few mistakes, decent answers)
         - 4 = Very Good (minimal mistakes, good answers)
         - 5 = Excellent (no mistakes, detailed and creative answers)
      
      3. "badge": Give them a fun, encouraging title based on their performance. Examples: "Grammar Guru", "Chatty Cathy", "Word Wizard", "Story Star", "Confident Communicator", "Language Learner", "Speaking Superstar", etc.
      
      IMPORTANT: Do NOT include "spoken_response", "correction", "vocabulary", or "hints" in your response. Only return "summary", "stars", and "badge".`;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const fullPrompt = `${systemInstructions}\n\nTask:\n${userPrompt}`;

    console.log(`Sending request to Gemini API (Action: ${action})...`);
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('Received response length:', text.length);

    // Parse JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error", text);
      if (action === 'SUMMARIZE') {
        jsonResponse = {
          summary: "Great job practicing English today! Keep up the good work!",
          stars: 3,
          badge: "Language Learner"
        };
      } else {
        jsonResponse = {
          spoken_response: "I'm having a little trouble thinking right now. Let's try again!",
          correction: null,
          vocabulary: [],
          hints: []
        };
      }
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error('Error in virtual tutor API:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
