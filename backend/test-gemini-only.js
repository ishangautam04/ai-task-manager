#!/usr/bin/env node

/**
 * Simple Gemini API Test
 * Tests the Gemini API key directly
 */

require('dotenv').config();

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API Key...\n');
  
  // Check if API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY not found or not set properly');
    console.log('💡 Please add your Gemini API key to the .env file:');
    console.log('   GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('\n🔗 Get a free API key from: https://aistudio.google.com/');
    return;
  }
  
  console.log('✅ API key found in environment');
  console.log(`🔑 Key format: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  try {
    // Test the Gemini API
    const { GoogleGenAI } = require('@google/genai');
    console.log('\n🧪 Initializing Gemini client...');
    
    const client = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini client created successfully');
    
    // Test a simple request
    console.log('\n🧠 Testing Gemini API with simple request...');
    
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Say hello and confirm you are working. Respond with just: "Hello! Gemini API is working perfectly."');
    
    const response = result.response?.text() || 'No response received';
    console.log('✅ Gemini API Response:', response);
    
    if (response.toLowerCase().includes('hello') && response.toLowerCase().includes('working')) {
      console.log('\n🎉 SUCCESS: Gemini API is working perfectly!');
      console.log('✨ You can now use the full AI features in your task manager');
    } else {
      console.log('\n⚠️  Unexpected response format. API might be working but response is unusual.');
    }
    
  } catch (error) {
    console.log('\n❌ Gemini API Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('💡 This looks like an API key issue. Please check:');
      console.log('   1. The API key is correct');
      console.log('   2. The API key is enabled for Gemini');
      console.log('   3. You have quota remaining');
    } else if (error.message.includes('quota')) {
      console.log('💡 Quota exceeded. Wait a moment and try again.');
    } else if (error.message.includes('network')) {
      console.log('💡 Network issue. Check your internet connection.');
    } else {
      console.log('💡 Unknown error. Try regenerating your API key.');
    }
  }
}

// Test streaming as well
async function testGeminiStreaming() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return;
  }
  
  try {
    console.log('\n🌊 Testing Gemini Streaming...');
    const { GoogleGenAI } = require('@google/genai');
    const client = new GoogleGenAI({ apiKey });
    
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContentStream('Count from 1 to 5, each number on a new line.');
    
    let fullResponse = '';
    console.log('📡 Streaming response:');
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      process.stdout.write(chunkText);
    }
    
    console.log('\n✅ Streaming test completed!');
    
  } catch (error) {
    console.log('\n❌ Streaming Error:', error.message);
  }
}

// Run tests
async function runTest() {
  await testGeminiAPI();
  await testGeminiStreaming();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Next Steps:');
  console.log('1. If tests passed: Start your task manager app');
  console.log('2. If tests failed: Check your API key');
  console.log('3. Navigate to "AI Assistant" tab in the app');
  console.log('4. Try: "Emergency doctor appointment tomorrow"');
  console.log('='.repeat(50));
}

runTest().catch(console.error);
