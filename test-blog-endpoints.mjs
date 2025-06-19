#!/usr/bin/env node

import fetch from 'node-fetch';

const blogUrl = 'https://313c3284-2b69-4193-9df0-24692020a5bc-00-1iku5wt5el7o1.janeway.replit.dev/blog';
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRsdWNrNzIiLCJpYXQiOjE3NTAzNjQwMjJ9.Xh8gfyJGqQzqWMZKGdqF5mCOvFKBVLsE3nZ4pT2gFj8';

const commonEndpoints = [
  '/api/posts',
  '/api/v1/posts', 
  '/wp-json/wp/v2/posts',
  '/api/content',
  '/posts',
  '/admin/api/posts',
  '/blog/api/posts',
  '/' // Check root
];

console.log('🔍 Testing blog endpoints...\n');

for (const endpoint of commonEndpoints) {
  try {
    const testUrl = `${blogUrl}${endpoint}`;
    console.log(`Testing: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || 'unknown';
    const isJson = contentType.includes('application/json');
    
    // Get response preview
    const responseText = await response.text();
    const preview = responseText.substring(0, 100).replace(/\n/g, ' ');
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Content-Type: ${contentType}`);
    console.log(`  Is JSON: ${isJson}`);
    console.log(`  Preview: ${preview}...\n`);
    
  } catch (error) {
    console.log(`  ERROR: ${error.message}\n`);
  }
}

console.log('🔍 Testing POST capability on /api/posts...\n');

try {
  const testData = {
    title: 'Test Post',
    content: 'Test content for diagnostic purposes',
    status: 'draft'
  };
  
  const postResponse = await fetch(`${blogUrl}/api/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });
  
  const postContentType = postResponse.headers.get('content-type') || 'unknown';
  const postResponseText = await postResponse.text();
  const postPreview = postResponseText.substring(0, 200).replace(/\n/g, ' ');
  
  console.log(`POST Status: ${postResponse.status} ${postResponse.statusText}`);
  console.log(`POST Content-Type: ${postContentType}`);
  console.log(`POST Response: ${postPreview}...\n`);
  
} catch (error) {
  console.log(`POST ERROR: ${error.message}\n`);
}