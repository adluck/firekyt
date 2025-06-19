const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

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
  
  if (token === 'firekyt_test_token_2024') {
    req.user = { id: 1, username: 'firekyt_test' };
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'FireKyt Sample Blog Server is running',
    timestamp: new Date().toISOString(),
    posts_count: posts.length
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
        <head><title>Post Not Found</title></head>
        <body>
          <h1>Post Not Found</h1>
          <p>Post ID ${postId} not found.</p>
          <a href="/api/posts/list">View all posts</a>
        </body>
      </html>
    `);
  }
  
  res.send(`
    <html>
      <head>
        <title>${post.title} - FireKyt Sample Blog</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
          .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .meta { color: #666; font-size: 0.9em; margin-top: 10px; }
          .content { margin: 30px 0; }
          .tags { margin-top: 20px; }
          .tag { background: #f0f0f0; padding: 4px 8px; margin: 2px; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${post.title}</h1>
          <div class="meta">
            Published: ${new Date(post.publishedAt).toLocaleString()} | ID: ${post.id} | Status: ${post.status}
          </div>
        </div>
        <div class="content">${post.content}</div>
        ${post.tags && post.tags.length > 0 ? `
          <div class="tags">
            <strong>Tags:</strong> ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        <p><a href="/api/posts/list">← Back to all posts</a></p>
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

// List all posts
app.get('/api/posts/list', (req, res) => {
  const postsHtml = posts.map(post => `
    <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px;">
      <h3><a href="/posts/${post.id}" style="color: #007bff;">${post.title}</a></h3>
      <p style="color: #666;">${post.excerpt}</p>
      <small>Published: ${new Date(post.publishedAt).toLocaleString()} | ID: ${post.id}</small>
    </div>
  `).join('');
  
  res.send(`
    <html>
      <head><title>FireKyt Sample Blog</title></head>
      <body style="font-family: Arial; max-width: 800px; margin: 20px auto; padding: 20px;">
        <h1>FireKyt Sample Blog</h1>
        <p>Published Posts (${posts.length} total)</p>
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
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📝 Posts: http://localhost:${PORT}/api/posts/list`);
});

module.exports = app;