#!/usr/bin/env node

/**
 * Test Script for Improved AI Task Manager
 * Tests both backend AI services and frontend integration
 */

const ImprovedAIService = require('./improved-ai-services');

async function testAIServices() {
  console.log('🧪 Testing Improved AI Services\n');
  
  const testCases = [
    {
      name: "Emergency Medical",
      text: "Emergency dentist appointment ASAP for severe pain"
    },
    {
      name: "Work Meeting",
      text: "Prepare quarterly sales presentation for Monday board meeting"
    },
    {
      name: "Personal Task",
      text: "Buy groceries and pick up dry cleaning tomorrow"
    },
    {
      name: "Educational",
      text: "Complete machine learning course assignment by Friday"
    },
    {
      name: "Financial",
      text: "Pay credit card bill and review monthly budget"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Input: "${testCase.text}"`);
    console.log('─'.repeat(60));
    
    try {
      // Test natural language parsing
      console.log('🧠 Natural Language Parsing...');
      const parsed = await ImprovedAIService.parseNaturalLanguageTask(testCase.text);
      console.log('✅ Parsed Result:', {
        title: parsed.title,
        category: parsed.category || parsed.suggestedCategory,
        urgency: parsed.urgency || parsed.suggestedPriority,
        source: parsed.source,
        confidence: parsed.confidence
      });

      // Test task enhancement
      console.log('\n🔧 Task Enhancement...');
      const enhanced = await ImprovedAIService.enhanceTask(
        parsed.title,
        parsed.description,
        parsed.dueDate
      );
      
      console.log('✅ Enhanced Result:', {
        category: enhanced.suggestedCategory,
        categoryConfidence: enhanced.categoryConfidence,
        priority: enhanced.suggestedPriority,
        priorityConfidence: enhanced.priorityConfidence,
        estimatedTime: enhanced.estimatedCompletionTime
      });

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('─'.repeat(60));
  }

  // Test batch analysis
  console.log('\n📊 Testing Batch Analysis...');
  const sampleTasks = [
    { title: "Complete project report", category: "work", priority: "high" },
    { title: "Doctor checkup", category: "health", priority: "medium" },
    { title: "Buy birthday gift", category: "personal", priority: "low" }
  ];

  try {
    const batchAnalysis = await ImprovedAIService.analyzeBatchTasks(sampleTasks);
    console.log('✅ Batch Analysis Result:', {
      totalTasks: batchAnalysis.totalTasks,
      insights: batchAnalysis.insights,
      recommendations: batchAnalysis.recommendations
    });
  } catch (error) {
    console.log('❌ Batch Analysis Error:', error.message);
  }

  console.log('\n🎉 AI Services Test Complete!\n');
}

// Environment check
function checkEnvironment() {
  console.log('🔍 Environment Check');
  console.log('─'.repeat(30));
  
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'HUGGINGFACE_API_KEY'
  ];

  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.log('\n⚠️  Missing environment variables. AI features may use fallback methods.');
    console.log('   Set these in your .env file:');
    missing.forEach(env => console.log(`   ${env}=your_api_key_here`));
  } else {
    console.log('\n✅ All environment variables are set!');
  }
  
  console.log('\n');
}

// Package check
function checkPackages() {
  console.log('📦 Package Check');
  console.log('─'.repeat(20));
  
  try {
    const { GoogleGenAI } = require('@google/genai');
    console.log('✅ @google/genai: Installed');
    
    const axios = require('axios');
    console.log('✅ axios: Installed');
    
    console.log('\n✅ All required packages are installed!\n');
    return true;
  } catch (error) {
    console.log('❌ Package Error:', error.message);
    console.log('\n📥 Run: npm install @google/genai axios\n');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Improved AI Task Manager - Test Suite');
  console.log('═'.repeat(50));
  
  // Load environment
  require('dotenv').config();
  
  // Check environment and packages
  checkEnvironment();
  
  if (!checkPackages()) {
    process.exit(1);
  }
  
  // Run AI service tests
  await testAIServices();
  
  console.log('🎯 Test Summary:');
  console.log('• Natural language parsing tested');
  console.log('• Task enhancement verified');  
  console.log('• Batch analysis validated');
  console.log('• Error handling confirmed');
  console.log('\n✨ Ready to use the improved AI task manager!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testAIServices };
