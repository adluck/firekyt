# Blog API Setup Guide

## Problem Identified
Your blog server at `https://313c3284-2b69-4193-9df0-24692020a5bc-00-1iku5wt5el7o1.janeway.replit.dev/blog` is returning HTML instead of JSON for all API endpoints. This means the backend API isn't configured to handle POST requests to `/api/posts`.

## Solution Required
Add a backend API server to your blog that can:
1. Accept POST requests to `/api/posts`
2. Validate Bearer token authentication
3. Create new blog posts from JSON data
4. Return JSON responses

## Required API Endpoint

Your blog needs this exact endpoint:

```javascript
POST /api/posts
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "title": "Post Title",
  "slug": "post-title", 
  "content": "Full post content...",
  "excerpt": "Brief summary...",
  "author": "Author Name",
  "category": "Category",
  "readTime": 5,
  "published": true,
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "featured": false
}
```

## Expected Response Format

```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": 123,
    "title": "Post Title",
    "slug": "post-title",
    "url": "https://your-blog.com/posts/post-title",
    "status": "published",
    "createdAt": "2025-06-19T21:00:00.000Z"
  }
}
```

## Implementation Options

### Option 1: Express.js Backend (Recommended)
Add this to your blog server:

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');

app.post('/api/posts', verifyToken, (req, res) => {
  const { title, slug, content, excerpt, author, category, published } = req.body;
  
  // Your blog's post creation logic here
  const newPost = createBlogPost({
    title,
    slug: slug || generateSlug(title),
    content,
    excerpt,
    author,
    category,
    status: published ? 'published' : 'draft'
  });
  
  res.json({
    success: true,
    message: 'Post created successfully',
    post: {
      id: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      url: `https://your-blog.com/posts/${newPost.slug}`,
      status: newPost.status,
      createdAt: newPost.createdAt
    }
  });
});
```

### Option 2: Next.js API Route
Create `/pages/api/posts.js`:

```javascript
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Verify Bearer token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Create post logic
    const post = createPost(req.body);
    res.json({ success: true, post });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

## Testing Your API

Once implemented, test with:

```bash
curl -X POST "https://your-blog.com/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Post",
    "content": "Test content",
    "published": true
  }'
```

## Next Steps

1. Add the API endpoint to your blog server
2. Ensure it handles Bearer token authentication
3. Test the endpoint returns JSON (not HTML)
4. Update your FireKyt connection if needed
5. Try publishing from FireKyt again

The FireKyt publishing system is working correctly - it just needs your blog to have the proper API endpoint configured.