import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// In-memory storage for blog posts
let blogPosts = [];
let nextId = 1;

// Valid access tokens
const VALID_TOKENS = {
  'firekyt_test_token_2024': {
    name: 'FireKyt Test Blog',
    permissions: ['read', 'write', 'delete']
  }
};

app.use(cors());
app.use(express.json());

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!VALID_TOKENS[token]) {
    return res.status(403).json({ error: 'Invalid access token' });
  }

  req.tokenInfo = VALID_TOKENS[token];
  next();
};

// Get all blog posts
app.get('/api/posts', (req, res) => {
  res.json({
    posts: blogPosts.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.content.substring(0, 200) + '...',
      publishedAt: post.publishedAt,
      status: post.status
    })),
    total: blogPosts.length
  });
});

// Get specific blog post
app.get('/api/posts/:id', (req, res) => {
  const post = blogPosts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// Create new blog post (requires authentication)
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, excerpt, tags, status = 'draft' } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newPost = {
    id: nextId++,
    title,
    content,
    excerpt: excerpt || content.substring(0, 200) + '...',
    tags: tags || [],
    status,
    publishedAt: status === 'published' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'FireKyt'
  };

  blogPosts.push(newPost);

  res.status(201).json({
    success: true,
    post: newPost,
    message: `Post ${status === 'published' ? 'published' : 'created'} successfully`
  });
});

// Update blog post (requires authentication)
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const postIndex = blogPosts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, content, excerpt, tags, status } = req.body;
  const post = blogPosts[postIndex];

  blogPosts[postIndex] = {
    ...post,
    title: title || post.title,
    content: content || post.content,
    excerpt: excerpt || post.excerpt,
    tags: tags || post.tags,
    status: status || post.status,
    publishedAt: status === 'published' && !post.publishedAt ? new Date().toISOString() : post.publishedAt,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    post: blogPosts[postIndex],
    message: 'Post updated successfully'
  });
});

// Delete blog post (requires authentication)
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postIndex = blogPosts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const deletedPost = blogPosts.splice(postIndex, 1)[0];
  res.json({
    success: true,
    message: 'Post deleted successfully',
    post: deletedPost
  });
});

// WordPress-style XML-RPC endpoint for compatibility
app.post('/xmlrpc.php', authenticateToken, (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
      <value>
        <array>
          <data>
            <value><string>blogger.newPost</string></value>
            <value><string>blogger.editPost</string></value>
            <value><string>blogger.deletePost</string></value>
          </data>
        </array>
      </value>
    </param>
  </params>
</methodResponse>`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    postsCount: blogPosts.length
  });
});

// Serve a simple blog frontend
app.get('/', (req, res) => {
  const postsHtml = blogPosts
    .filter(post => post.status === 'published')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map(post => `
      <article style="margin-bottom: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333;">${post.title}</h2>
        <p style="color: #666; font-size: 0.9rem;">
          Published: ${new Date(post.publishedAt).toLocaleDateString()} | Source: ${post.source}
        </p>
        <div style="line-height: 1.6;">${post.content}</div>
        ${post.tags && post.tags.length > 0 ? `
          <div style="margin-top: 1rem;">
            <strong>Tags:</strong> ${post.tags.map(tag => `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; margin-right: 5px;">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </article>
    `).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Blog - FireKyt Publishing Demo</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f9f9f9; }
        .header { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; text-align: center; }
        .api-info { background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
        .no-posts { text-align: center; color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Test Blog</h1>
        <p>FireKyt Publishing Demo Site</p>
      </div>
      
      <div class="api-info">
        <h3>API Information</h3>
        <p><strong>Base URL:</strong> http://localhost:3001</p>
        <p><strong>Access Token:</strong> <code>firekyt_test_token_2024</code></p>
        <p><strong>Endpoints:</strong></p>
        <ul>
          <li>GET /api/posts - List all posts</li>
          <li>POST /api/posts - Create new post (requires auth)</li>
          <li>PUT /api/posts/:id - Update post (requires auth)</li>
          <li>DELETE /api/posts/:id - Delete post (requires auth)</li>
        </ul>
      </div>

      <div>
        <h2>Published Posts (${blogPosts.filter(p => p.status === 'published').length})</h2>
        ${postsHtml || '<p class="no-posts">No published posts yet. Use FireKyt to publish your first post!</p>'}
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Test Blog Server running on http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Access Token: firekyt_test_token_2024`);
  console.log('Ready to receive published content from FireKyt!');
});

export default app;