const fetch = require('node-fetch');

async function testLinkInsertion() {
  try {
    // Get auth token from storage (simplified for test)
    const testData = {
      contentId: 78,
      insertions: [{
        linkId: 1,
        anchorText: 'grant writing tools',
        position: 500
      }]
    };

    console.log('Testing link insertion with data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:5000/api/links/bulk-insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLinkInsertion();