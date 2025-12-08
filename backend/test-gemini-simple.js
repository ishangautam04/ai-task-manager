#!/usr/bin/env node

/**
 * Simple Gemini API Test - Using correct API format
 */

require('dotenv').config();

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY not found or not set properly');
    console.log('💡 Please add your Gemini API key to the .env file');
    return;
  }
  
  console.log('✅ API key found');
  console.log(`🔑 Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  try {
    // Test using direct HTTP request like our AI service does
    const axios = require('axios');
    
    console.log('\n🧠 Testing Gemini API with HTTP request...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: 'Say "Hello! Gemini API is working!" and nothing else.'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini API Response:', text);
      
      if (text.toLowerCase().includes('hello') && text.toLowerCase().includes('working')) {
        console.log('\n🎉 SUCCESS: Gemini API is working perfectly!');
        console.log('✨ Your AI task manager will now use Gemini for parsing');
      } else {
        console.log('\n⚠️  API responded but format unexpected');
      }
    } else {
      console.log('❌ No valid response received');
    }
    
  } catch (error) {
    console.log('\n❌ Gemini API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 API key might be invalid or restricted');
    } else if (error.response?.status === 429) {
      console.log('💡 Rate limit exceeded. Wait a moment and try again');
    } else {
      console.log('💡 Check your API key and internet connection');
    }
  }
}

async function runTest() {
  console.log('🚀 Simple Gemini API Test');
  console.log('='.repeat(30));
  
  await testGeminiAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 After API test passes:');
  console.log('1. Start backend: npm run dev');
  console.log('2. Start frontend: npm start (in frontend folder)');
  console.log('3. Go to AI Assistant tab');
  console.log('4. Try: "Emergency doctor appointment tomorrow"');
  console.log('='.repeat(50));
}

runTest().catch(console.error);
