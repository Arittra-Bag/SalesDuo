import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3000';

// Test data
const sampleText = `Team Sync – May 26

- We'll launch the new product on June 10.
- Ravi to prepare onboarding docs by June 5.
- Priya will follow up with logistics team on packaging delay.
- Beta users requested a mobile-first dashboard.`;

async function testAPI() {
  console.log('🧪 Testing Meeting Minutes Extractor API\n');

  try {
    // Test 1: Raw text processing
    console.log('Test 1: Processing raw text...');
    const response1 = await fetch(`${BASE_URL}/process-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: sampleText })
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Raw text test passed');
      console.log('Summary:', result1.data.summary);
      console.log('Decisions:', result1.data.decisions);
      console.log('Action Items:', result1.data.actionItems);
    } else {
      const error1 = await response1.json();
      console.log('❌ Raw text test failed:', error1);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Test 2: File upload simulation (using form data)
    console.log('Test 2: Processing file content...');
    
    const formData = new FormData();
    const fileContent = readFileSync(join(__dirname, 'samples', 'meeting2.txt'), 'utf-8');
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'meeting2.txt');

    const response2 = await fetch(`${BASE_URL}/process-meeting`, {
      method: 'POST',
      body: formData
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ File upload test passed');
      console.log('Summary:', result2.data.summary);
      console.log('Decisions:', result2.data.decisions);
      console.log('Action Items:', result2.data.actionItems);
    } else {
      const error2 = await response2.json();
      console.log('❌ File upload test failed:', error2);
    }

  } catch (error) {
    console.log('❌ File test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Test 3: Error handling - empty input
    console.log('Test 3: Testing error handling (empty input)...');
    
    const response3 = await fetch(`${BASE_URL}/process-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: '' })
    });

    if (!response3.ok) {
      const error3 = await response3.json();
      console.log('✅ Error handling test passed:', error3.message);
    } else {
      console.log('❌ Error handling test failed: Should have returned an error');
    }

  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
  }

  console.log('\n🎉 API testing completed!');
}

// Check if server is running before testing
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('✅ Server is running, starting tests...\n');
      await testAPI();
    } else {
      console.log('❌ Server responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm start');
    console.log('   Then run tests with: npm test');
  }
}

checkServer();
