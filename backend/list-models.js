#!/usr/bin/env node

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
  console.log('🔍 Listing available Gemini models...\n');
  
  try {
    const client = new GoogleGenAI({});
    
    // Try to list models
    const models = await client.models.list();
    console.log('✅ Available models:');
    console.log(JSON.stringify(models, null, 2));
    
  } catch (error) {
    console.log('❌ Error listing models:', error.message);
    console.log('\n💡 Trying direct REST API...');
    
    // Try direct REST API
    const fetch = require('node-fetch');
    const apiKey = process.env.GEMINI_API_KEY;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log('\n✅ Available models from REST API:');
      data.models.forEach(model => {
        console.log(`  - ${model.name} (${model.displayName})`);
        console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      });
    } else {
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  }
}

listModels().catch(console.error);
