const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let posts = [];
let nextId = 1;

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', posts_count: posts.length });
});

app.post('/api/posts', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token !== 'firekyt_test_token_2024') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const { title, content, tags, status } = req.body;
  
  const post = {
    id: nextId++,
    title: title || 'Test Post',
    content: content || 'Test content',
    tags: tags || [],
    status: status || 'published',
    publishedAt: new Date().toISOString(),
    url: `http://localhost:${PORT}/posts/${nextId - 1}`
  };
  
  posts.push(post);
  console.log(`Published: ${post.title} (ID: ${post.id})`);
  
  res.status(201).json({
    success: true,
    post: post
  });
});

app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).send('Post not found');
  }
  
  res.send(`
    <html>
      <head><title>${post.title}</title></head>
      <body>
        <h1>${post.title}</h1>
        <p>Published: ${new Date(post.publishedAt).toLocaleString()}</p>
        <div>${post.content}</div>
        <p>Tags: ${post.tags.join(', ')}</p>
      </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.send(`
    <h1>FireKyt Sample Blog (${posts.length} posts)</h1>
    ${posts.map(p => `<p><a href="/posts/${p.id}">${p.title}</a></p>`).join('')}
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Blog server running on http://localhost:${PORT}`);
});