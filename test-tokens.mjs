import fetch from 'node-fetch';

async function testTokens() {
  console.log('Testing platform access tokens...\n');
  
  const tokens = [
    {
      platform: 'WordPress',
      token: 'wp_sample_token_n8amwfiqd',
      url: 'https://public-api.wordpress.com/rest/v1.1/me'
    },
    {
      platform: 'Medium',
      token: 'medium_token_7rs3tnsqy',
      url: 'https://api.medium.com/v1/me'
    },
    {
      platform: 'LinkedIn',
      token: 'linkedin_token_c2rxh089s',
      url: 'https://api.linkedin.com/v2/me'
    },
    {
      platform: 'Local Test Server',
      token: 'firekyt_test_token_2024',
      url: 'http://localhost:3002/api/auth/validate',
      method: 'POST'
    }
  ];

  for (const { platform, token, url, method = 'GET' } of tokens) {
    try {
      console.log(`Testing ${platform}...`);
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await fetch(url, options);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${platform}: Token valid`);
        if (platform === 'Local Test Server') {
          console.log(`   Server response:`, data);
        }
      } else {
        console.log(`❌ ${platform}: Status ${response.status} - ${response.statusText}`);
        if (response.status === 401) {
          console.log(`   Token expired or invalid`);
        }
      }
    } catch (error) {
      console.log(`❌ ${platform}: Connection error - ${error.message}`);
    }
    console.log('');
  }
}

testTokens().catch(console.error);