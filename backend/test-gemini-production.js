// Test Gemini API with the actual implementation format
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

console.log('🔍 Testing Gemini API (Production Format)...\n');

async function testGemini() {
  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in .env file');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  try {
    // Initialize exactly like improved-ai-services.js does
    console.log('\n🚀 Initializing Gemini client...');
    const geminiClient = new GoogleGenAI({});
    console.log('✅ Client initialized');
    
    // Test exactly like the service does
    console.log('\n📤 Sending test request...');
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with: "Gemini API is working!"'
    });
    
    const text = response.text || '';
    console.log('📥 Response:', text);
    console.log('\n✅ SUCCESS! Gemini API is working!\n');
    
    // Test with task parsing (like the actual app)
    console.log('🧪 Testing task parsing...');
    const taskResponse = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse this task: "Call doctor tomorrow at 2pm urgently"
      
Return ONLY a JSON object:
{
  "title": "task title",
  "priority": "low|medium|high",
  "category": "work|personal|health",
  "dueDate": "ISO date or null"
}`
    });
    
    const taskText = taskResponse.text || '';
    console.log('📋 Task parsing response:', taskText.substring(0, 200));
    console.log('\n🎉 Task parsing is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 Your API key is invalid. Get a new one from: https://aistudio.google.com/');
    } else if (error.message.includes('quota')) {
      console.log('\n💡 API quota exceeded. Wait a bit and try again.');
    }
  }
}

testGemini();
