#!/usr/bin/env node

/**
 * Official Gemini API Test - Using exact format from official docs
 */

require('dotenv').config();

async function testOfficialAPI() {
  console.log('🔍 Testing Official Gemini API Format...\n');
  
  try {
    // Import the official way
    const { GoogleGenAI } = require("@google/genai");
    
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    const ai = new GoogleGenAI({});
    
    console.log('✅ GoogleGenAI client created');
    
    console.log('🧠 Testing with official format...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Using the model we have access to
      contents: "Say 'Hello! Official Gemini API is working!' and nothing else",
    });
    
    console.log('✅ Raw response received');
    console.log('📝 Response text:', response.text);
    
    if (response.text && response.text.toLowerCase().includes('hello')) {
      console.log('\n🎉 SUCCESS: Official Gemini API format is working!');
      console.log('✨ This is the correct way to use the SDK');
    } else {
      console.log('\n⚠️  Response received but unexpected format');
      console.log('Full response:', response);
    }
    
  } catch (error) {
    console.log('\n❌ Official API Error:', error.message);
    
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('💡 Environment variable GEMINI_API_KEY not found');
      console.log('   Make sure it\'s set in your .env file');
    } else if (error.message.includes('generateContent')) {
      console.log('💡 Method generateContent not available');
      console.log('   Package version might be different');
    } else {
      console.log('💡 Check if the package version matches the docs');
    }
    
    // Let's also check what methods are available
    try {
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({});
      console.log('\n🔍 Available methods on ai object:');
      console.log(Object.getOwnPropertyNames(ai));
      console.log('\n🔍 Available methods on ai.models:');
      console.log(Object.getOwnPropertyNames(ai.models || {}));
    } catch (inspectError) {
      console.log('Could not inspect object methods');
    }
  }
}

// Alternative test with different model
async function testWithDifferentModel() {
  try {
    console.log('\n🔄 Trying with gemini-1.5-flash model...');
    
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({});
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Say 'Hello from Gemini 1.5!' briefly",
    });
    
    console.log('✅ Gemini 1.5 Response:', response.text);
    
  } catch (error) {
    console.log('❌ Gemini 1.5 Error:', error.message);
  }
}

async function runOfficialTest() {
  console.log('🚀 Official Gemini SDK Test');
  console.log('='.repeat(40));
  
  // Check environment first
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY not set properly in .env file');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY found in environment');
  console.log(`🔑 Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  await testOfficialAPI();
  await testWithDifferentModel();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 If this works, your AI features will be fully functional!');
  console.log('='.repeat(50));
}

runOfficialTest().catch(console.error);
