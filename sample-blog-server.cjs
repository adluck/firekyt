const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for posts
let posts = [];
let nextId = 1;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Accept the FireKyt test token
  if (token === 'firekyt_test_token_2024') {
    req.user = { id: 1, username: 'firekyt_test' };
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'FireKyt Sample Blog Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get all posts
app.get('/api/posts', (req, res) => {
  res.json({ 
    posts: posts.map(post => ({
      ...post,
      url: `http://localhost:${PORT}/posts/${post.id}`
    }))
  });
});

// Get single post
app.get('/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.status(404).send(`
      <html>
        <head>
          <title>Post Not Found - FireKyt Sample Blog</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">Post Not Found</h1>
          <p>The requested post (ID: ${postId}) could not be found.</p>
          <a href="/api/posts">View all posts</a>
        </body>
      </html>
    `);
  }
  
  // Return HTML view of the post
  res.send(`
    <html>
      <head>
        <title>${post.title} - FireKyt Sample Blog</title>
        <meta name="description" content="${post.excerpt || 'Published via FireKyt'}">
        <style>
          body { 
            font-family: Georgia, serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .title { 
            color: #007bff; 
            margin: 0;
          }
          .meta { 
            color: #666; 
            font-size: 0.9em; 
            margin-top: 10px;
          }
          .content { 
            margin: 30px 0;
            font-size: 1.1em;
          }
          .tags { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee;
          }
          .tag { 
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            padding: 4px 8px; 
            margin: 2px; 
            border-radius: 4px; 
            font-size: 0.8em;
            display: inline-block;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${post.title}</h1>
          <div class="meta">
            Published: ${new Date(post.publishedAt).toLocaleDateString()} at ${new Date(post.publishedAt).toLocaleTimeString()}
            | Status: ${post.status}
            | Post ID: ${post.id}
          </div>
        </div>
        
        <div class="content">
          ${post.content}
        </div>
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="tags">
            <strong>Tags:</strong><br>
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>Published via FireKyt Content Publishing System</strong></p>
          <a href="/api/posts">← View All Posts</a>
        </div>
      </body>
    </html>
  `);
});

// Create new post (WordPress-style API)
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, excerpt, tags, status = 'published' } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const post = {
    id: nextId++,
    title,
    content,
    excerpt: excerpt || content.substring(0, 200) + '...',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    status,
    publishedAt: new Date().toISOString(),
    author: req.user.username,
    url: `http://localhost:${PORT}/posts/${nextId - 1}`
  };
  
  posts.push(post);
  
  console.log(`📝 New post published: "${title}" (ID: ${post.id})`);
  
  res.status(201).json({
    success: true,
    message: 'Post published successfully',
    post: {
      id: post.id,
      title: post.title,
      url: post.url,
      status: post.status,
      publishedAt: post.publishedAt
    }
  });
});

// WordPress-style posts endpoint
app.post('/wp-json/wp/v2/posts', authenticateToken, (req, res) => {
  const { title, content, excerpt, tags, status = 'publish' } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const post = {
    id: nextId++,
    title: typeof title === 'object' ? title.rendered || title.raw : title,
    content: typeof content === 'object' ? content.rendered || content.raw : content,
    excerpt: excerpt || content.substring(0, 200) + '...',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    status: status === 'publish' ? 'published' : status,
    publishedAt: new Date().toISOString(),
    author: req.user.username,
    link: `http://localhost:${PORT}/posts/${nextId - 1}`
  };
  
  posts.push(post);
  
  console.log(`📝 WordPress-style post published: "${post.title}" (ID: ${post.id})`);
  
  res.status(201).json({
    id: post.id,
    title: { rendered: post.title },
    content: { rendered: post.content },
    excerpt: { rendered: post.excerpt },
    status: post.status,
    link: post.link,
    date: post.publishedAt
  });
});

// List all posts as HTML
app.get('/api/posts/list', (req, res) => {
  const postsHtml = posts.map(post => `
    <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px;">
      <h3><a href="/posts/${post.id}" style="color: #007bff; text-decoration: none;">${post.title}</a></h3>
      <p style="color: #666; margin: 5px 0;">${post.excerpt}</p>
      <small style="color: #999;">
        Published: ${new Date(post.publishedAt).toLocaleString()} | 
        Status: ${post.status} | 
        ID: ${post.id}
      </small>
    </div>
  `).join('');
  
  res.send(`
    <html>
      <head>
        <title>All Posts - FireKyt Sample Blog</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FireKyt Sample Blog</h1>
          <p>All Published Posts (${posts.length} total)</p>
        </div>
        ${posts.length > 0 ? postsHtml : '<p>No posts published yet.</p>'}
      </body>
    </html>
  `);
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/api/posts/list');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FireKyt Sample Blog Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📝 View Posts: http://localhost:${PORT}/api/posts/list`);
  console.log(`🔑 Test Token: firekyt_test_token_2024`);
});

module.exports = app;