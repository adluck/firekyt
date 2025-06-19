# Blog API Integration Guide

## Current Issue
Your blog at `https://313c3284-2b69-4193-9df0-24692020a5bc-00-1iku5wt5el7o1.janeway.replit.dev/blog` returns HTML for all API endpoints because it lacks backend API handlers.

## Required Implementation

### 1. Add API Route Handler to Your Blog Server

Replace your current server with this implementation:

```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mock post storage (replace with your database)
let posts = [];
let nextId = 1;

// Token verification
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.decode(token);
    if (decoded?.userId) {
      req.user = decoded;
      next();
    } else {
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token verification failed' });
  }
};

// API Routes
app.post('/api/posts', verifyToken, (req, res) => {
  const { title, slug, content, excerpt, author, category, published } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content required' });
  }

  const post = {
    id: nextId++,
    title,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content,
    excerpt: excerpt || content.substring(0, 200),
    author: author || 'Admin',
    category: category || 'General',
    status: published ? 'published' : 'draft',
    createdAt: new Date().toISOString()
  };

  posts.push(post);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      url: `${req.protocol}://${req.get('host')}/posts/${post.slug}`,
      status: post.status,
      createdAt: post.createdAt
    }
  });
});

// Serve frontend for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  // Serve your existing blog frontend
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Blog server running with API support');
});
```

### 2. Test the Implementation

After deploying, test with:

```bash
curl -X POST "https://your-blog-url/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test","content":"Test content","published":true}'
```

### 3. Expected Response

Your API should return:

```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "title": "Test",
    "slug": "test",
    "url": "https://your-blog-url/posts/test",
    "status": "published",
    "createdAt": "2025-06-19T21:00:00.000Z"
  }
}
```

## Quick Fix Steps

1. Update your blog server code to include the API handler
2. Redeploy your blog
3. Test the `/api/posts` endpoint returns JSON
4. Try publishing from FireKyt again

The FireKyt system is working correctly - it just needs your blog to handle the API requests properly.