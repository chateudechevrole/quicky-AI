const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Please provide GOOGLE_API_KEY env var");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Accessing the API directly via a fetch to list models if the SDK doesn't expose it easily in this version,
  // but the SDK usually does. Let's try to use the error hint "Call ListModels".
  // The JS SDK doesn't expose listModels directly on the top level usually, let's try a raw fetch.
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();



