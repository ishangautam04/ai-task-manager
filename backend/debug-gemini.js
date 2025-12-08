#!/usr/bin/env node

require('dotenv').config();

async function debugGeminiService() {
  console.log('🔍 Debugging Gemini Service Integration\n');
  
  // Test 1: Check environment
  console.log('1. Environment Check:');
  console.log('   GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('   Key format:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'Not found');
  
  // Test 2: Test direct import
  console.log('\n2. Direct Import Test:');
  try {
    const { GoogleGenAI } = require('@google/genai');
    const client = new GoogleGenAI({});
    console.log('   ✅ Direct client creation successful');
    
    // Test simple call
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Reply with just: Working!',
    });
    
    console.log('   ✅ Direct API call successful:', response.text);
    
  } catch (error) {
    console.log('   ❌ Direct test failed:', error.message);
  }
  
  // Test 3: Test our service
  console.log('\n3. Our AI Service Test:');
  try {
    const ImprovedAIService = require('./improved-ai-services');
    console.log('   ✅ Service imported');
    
    console.log('   Gemini client exists:', !!ImprovedAIService.geminiClient);
    
    if (ImprovedAIService.geminiClient) {
      console.log('   🧠 Testing service parseNaturalLanguageTask...');
      const result = await ImprovedAIService.parseNaturalLanguageTask('Test emergency task');
      console.log('   Result source:', result.source);
      console.log('   Full result:', result);
    } else {
      console.log('   ❌ Gemini client not initialized in service');
    }
    
  } catch (error) {
    console.log('   ❌ Service test failed:', error.message);
  }
}

debugGeminiService().catch(console.error);
