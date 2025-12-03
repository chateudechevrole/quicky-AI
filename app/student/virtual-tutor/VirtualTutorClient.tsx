'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// --- Types ---
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface AIResponse {
  spoken_response: string;
  correction?: string | null;
  vocabulary: string[];
  hints: string[];
  summary?: string | null;
  stars?: number;
  badge?: string;
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

type ViewState = 'SELECTION' | 'CHAT' | 'SUMMARY';

// --- Constants ---
const ALL_THEMES = [
  "Trip to KLCC", "Balik Kampung", "Ordering Roti Canai", "My School Holiday", "Visit to Zoo Negara",
  "My Favorite Nasi Lemak", "Playing Badminton", "Hari Raya Celebration", "Chinese New Year", "Deepavali Open House",
  "Buying Ice Cream", "At the Night Market (Pasar Malam)", "My Pet Cat", "A Rainy Day", "Recess Time at School",
  "My Best Friend", "Helping Mom Cook", "Watching Upin & Ipin", "My Dream Job", "Visiting the Dentist"
];

const MAX_TURNS = 8;

export default function VirtualTutorClient() {
  // --- State ---
  const [view, setView] = useState<ViewState>('SELECTION');
  const [themes, setThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  
  // Chat State
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  
  // Device State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  // Refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Refs for solving stale closures in Event Listeners
  const historyRef = useRef<ChatHistoryItem[]>([]);
  const turnCountRef = useRef(0);
  const processMessageRef = useRef<(msg: string) => void>(() => {});

  // --- Setup & Effects ---

  // 1. Sync refs
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    turnCountRef.current = turnCount;
    console.log("Current Turn:", turnCount); // Debug
  }, [turnCount]);

  // 2. Initialize Themes
  useEffect(() => {
    const shuffled = [...ALL_THEMES].sort(() => 0.5 - Math.random());
    setThemes(shuffled.slice(0, 3));
  }, []);

  // 3. Initialize Speech
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
      const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText("Listening...");
        };
        recognition.onend = () => {
          setIsListening(false);
          setStatusText("Processing...");
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          // CRITICAL: Increment turn count IMMEDIATELY when user finishes speaking
          setTurnCount((prev) => {
            const newCount = prev + 1;
            turnCountRef.current = newCount; // Update ref immediately
            console.log("Turn count incremented to:", newCount);
            return newCount;
          });
          // Then process the message
          processMessageRef.current(transcript);
        };
        recognition.onerror = (event: any) => {
          console.error('Speech error', event.error);
          setIsListening(false);
          setStatusText("Error listening. Try again.");
        };
        recognitionRef.current = recognition;
      } else {
        setStatusText("Mic not supported.");
      }
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // 3. Summary Trigger Effect - Listen to turnCount
  useEffect(() => {
    if (turnCount > MAX_TURNS && view === 'CHAT') {
      console.log("Triggering summary - turnCount exceeded limit");
      finishSession();
    }
  }, [turnCount, view]);

  // --- Logic ---

  const startTheme = async (theme: string) => {
    setSelectedTheme(theme);
    setView('CHAT');
    setHistory([]);
    setTurnCount(0);
    turnCountRef.current = 0; // Reset ref
    setResponse(null);
    
    // Send START action
    await callAPI('START', theme, '', []);
  };

  // Define the chat handler
  const handleChat = async (message: string) => {
    if (!message.trim() || loading) return;
    
    // Update local history with user message
    const newHistory = [...historyRef.current, { role: 'user' as const, text: message }];
    setHistory(newHistory);
    
    // Check turnCountRef (immediate value) to decide which API action to call
    // Note: turnCount was already incremented in the onresult handler
    const currentTurn = turnCountRef.current;
    
    if (currentTurn < MAX_TURNS) {
      // Continue chatting
      console.log(`Turn ${currentTurn}: Calling CHAT API`);
      await callAPI('CHAT', selectedTheme, message, newHistory);
    } else if (currentTurn >= MAX_TURNS) {
      // Trigger summary
      console.log(`Turn ${currentTurn}: Limit reached, calling finishSession`);
      finishSession();
    }
  };

  // Keep ref updated
  useEffect(() => {
    processMessageRef.current = handleChat;
  });

  const callAPI = async (action: string, theme: string, message: string, currentHistory: ChatHistoryItem[]) => {
    setLoading(true);
    setStatusText(action === 'SUMMARIZE' ? "Generating your report..." : "Quicky is thinking...");
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);

    try {
      const res = await fetch('/api/virtual-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, theme, message, history: currentHistory }),
      });

      if (!res.ok) throw new Error('API Error');
      const data: AIResponse = await res.json();
      setResponse(data);
      
      // If action is SUMMARIZE, switch to SUMMARY view
      if (action === 'SUMMARIZE') {
        setView('SUMMARY');
        return; // Don't speak or add to history for summary
      }
      
      // Add model response to history (only for CHAT/START)
      if (data.spoken_response) {
        setHistory(prev => [...prev, { role: 'model', text: data.spoken_response }]);
      }

      // Speak (only for CHAT/START)
      if (synthRef.current && data.spoken_response) {
        const utterance = new SpeechSynthesisUtterance(data.spoken_response);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onstart = () => {
          setIsSpeaking(true);
          setStatusText("Quicky is speaking...");
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          setStatusText("Your turn!");
        };
        synthRef.current.speak(utterance);
      }

    } catch (e) {
      console.error(e);
      setStatusText("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const finishSession = async () => {
    // Only trigger if we are not already summarizing or loading
    if (loading || view === 'SUMMARY') return; 
    
    console.log("finishSession called - calling SUMMARIZE API");
    // Use callAPI which will handle view switching automatically
    await callAPI('SUMMARIZE', selectedTheme, '', historyRef.current);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !loading && !isSpeaking) {
      try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
  };

  const resetApp = () => {
    setView('SELECTION');
    const shuffled = [...ALL_THEMES].sort(() => 0.5 - Math.random());
    setThemes(shuffled.slice(0, 3));
    setSelectedTheme("");
    setResponse(null);
    setHistory([]);
    setTurnCount(0);
    turnCountRef.current = 0; // Reset ref
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center font-sans">
      {view === 'SELECTION' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl">
          <h1 className="text-4xl font-extrabold text-indigo-900 mb-2 text-center">Welcome to Quicky! 🤖</h1>
          <p className="text-xl text-indigo-600 mb-12 text-center">Pick a topic to start speaking English.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {themes.map((theme, idx) => (
              <button
                key={idx}
                onClick={() => startTheme(theme)}
                className="bg-white p-8 rounded-3xl shadow-lg border-b-8 border-indigo-100 active:border-b-0 active:translate-y-2 hover:scale-105 transition-all flex flex-col items-center gap-6 group h-full justify-center"
              >
                <div className="text-6xl group-hover:animate-bounce">
                  {idx === 0 ? '🐯' : idx === 1 ? '🏙️' : '🍜'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center leading-tight">{theme}</h3>
                <span className="text-sm text-indigo-500 font-bold uppercase tracking-wider">Start Chat →</span>
              </button>
            ))}
          </div>
          
          <button 
             onClick={() => {
               const shuffled = [...ALL_THEMES].sort(() => 0.5 - Math.random());
               setThemes(shuffled.slice(0, 3));
             }}
             className="mt-12 text-indigo-400 hover:text-indigo-600 text-sm font-semibold"
          >
            🔄 Shuffle Topics
          </button>
        </div>
      )}

      {view === 'SUMMARY' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-8 border-4 border-indigo-50">
            <div className="flex flex-col items-center mb-8">
               <div className="text-7xl mb-4 animate-bounce">🌟</div>
               <h2 className="text-3xl font-bold text-indigo-900">Great Job!</h2>
               <p className="text-indigo-500 font-medium mt-2">You finished your chat about <span className="font-bold text-indigo-700">{selectedTheme}</span></p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 mb-8 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-200"></div>
              <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span>📝</span> Conversation Report
              </h3>
              {loading ? (
                <div className="flex flex-col items-center py-8 gap-4">
                   <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-blue-400 font-medium animate-pulse">Quicky is writing your report...</p>
                </div>
              ) : (
                <>
                  {/* Stars and Badge */}
                  {response?.stars && (
                    <div className="flex flex-col items-center mb-6 gap-3">
                      <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-3xl ${i < (response.stars || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      {response?.badge && (
                        <div className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-full font-bold text-lg border-2 border-indigo-300">
                          🏆 {response.badge}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {response?.summary || "Summary not available."}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={resetApp}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Play Again 🔄
            </button>
          </div>
        </div>
      )}

      {view === 'CHAT' && (
        <div className="w-full max-w-5xl flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={resetApp} className="flex items-center text-indigo-400 hover:text-indigo-600 font-bold text-sm transition-colors">
              <span className="mr-1">←</span> EXIT
            </button>
            <div className="flex flex-col items-center">
              <h2 className="font-bold text-indigo-900 text-lg truncate max-w-[200px] md:max-w-md">{selectedTheme}</h2>
              <div className="text-sm font-bold text-indigo-600 mt-1 mb-1">
                Turn {turnCount}/{MAX_TURNS}
              </div>
              <div className="flex gap-1">
                 {Array.from({ length: MAX_TURNS }).map((_, i) => (
                   <div key={i} className={`h-2 w-6 rounded-full transition-colors ${i < turnCount ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                 ))}
              </div>
            </div>
            <div className="w-12"></div> {/* Spacer */}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start flex-grow">
            
            {/* Left: Avatar */}
            <div className="w-full lg:w-5/12 flex flex-col items-center">
              {/* Square Avatar */}
              <div className="relative w-full max-w-[320px] aspect-square mb-6 transition-transform duration-300 hover:scale-105">
                <div className={`absolute inset-0 bg-blue-400 rounded-3xl blur-2xl opacity-20 ${isSpeaking ? 'animate-pulse' : ''}`}></div>
                <div className={`relative w-full h-full bg-white rounded-3xl shadow-2xl border-[6px] border-white overflow-hidden flex items-center justify-center transition-all ${
                  isListening ? 'ring-8 ring-red-100 border-red-50' : ''
                }`}>
                   <Image
                    src={isSpeaking ? '/tutor-talking.gif' : '/tutor-idle.png'}
                    alt="Quicky"
                    fill
                    className="object-contain"
                    priority
                    unoptimized={true}
                  />
                </div>
              </div>

              {/* Speech Bubble */}
              <div className="w-full bg-white rounded-3xl p-6 shadow-lg border border-indigo-50 relative min-h-[120px] transition-all">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-t border-l border-indigo-50"></div>
                {response?.correction && (
                   <div className="mb-3 p-3 bg-yellow-50 rounded-xl text-yellow-800 text-sm font-bold border border-yellow-100 flex items-start gap-2 animate-fade-in-down">
                     <span className="text-lg">🛠️</span> 
                     <span>{response.correction}</span>
                   </div>
                )}
                <p className="text-xl text-gray-800 leading-relaxed font-medium">
                  {response?.spoken_response || (loading ? "Thinking..." : "Ready when you are!")}
                </p>
              </div>
            </div>

            {/* Right: Helper Panel */}
            <div className="w-full lg:w-7/12 flex flex-col gap-6 h-full">
              
              {/* Vocabulary */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-50">
                <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  ✨ New Words
                </h3>
                <div className="flex flex-wrap gap-3">
                  {response?.vocabulary && response.vocabulary.length > 0 ? (
                    response.vocabulary.map((word, idx) => (
                      <span key={idx} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-lg font-bold border border-indigo-100 shadow-sm hover:scale-105 transition-transform cursor-default">
                        {word}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 text-base italic pl-2">Listen to Quicky for new words...</p>
                  )}
                </div>
              </div>

              {/* Hints */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-50 flex-grow">
                <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  💡 SENTENCE STARTERS (Try saying...)
                </h3>
                <div className="flex flex-col gap-3">
                  {response?.hints && response.hints.length > 0 ? (
                    response.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="text-left px-6 py-4 bg-gray-50 rounded-2xl text-gray-700 border border-gray-100 cursor-default opacity-90"
                      >
                        <span className="font-bold text-lg block">{hint}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-base italic pl-2">Hints will appear here!</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Mic Button */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3">
             {(statusText || turnCount >= MAX_TURNS) && (
              <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
                turnCount >= MAX_TURNS ? 'bg-yellow-500 text-white' :
                isListening ? 'bg-red-500 text-white' : 'bg-white text-indigo-400'
              }`}>
                {turnCount >= MAX_TURNS ? 'Session Complete!' : statusText}
              </div>
            )}
            
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              disabled={loading || isSpeaking || turnCount >= MAX_TURNS}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${
                turnCount >= MAX_TURNS ? 'bg-gray-400 cursor-not-allowed opacity-50' :
                loading ? 'bg-gray-300 cursor-wait scale-90' :
                isListening ? 'bg-red-500 ring-8 ring-red-200 scale-110' : 
                'bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:scale-105'
              }`}
            >
              {loading ? (
                 <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
