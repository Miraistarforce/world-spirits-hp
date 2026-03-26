const { createClient } = require('@libsql/client/web');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  return token === process.env.ADMIN_TOKEN;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: public - return all content
    if (req.method === 'GET') {
      const result = await client.execute('SELECT section_id, content, updated_at FROM ws_content');
      const rows = result.rows.map(row => ({
        section_id: row.section_id,
        content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
        updated_at: row.updated_at
      }));
      return res.status(200).json(rows);
    }

    // PUT: requires auth - upsert content
    if (req.method === 'PUT') {
      if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

      const { section_id, content } = req.body || {};
      if (!section_id) return res.status(400).json({ error: 'section_id required' });

      await client.execute({
        sql: "INSERT INTO ws_content (section_id, content, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(section_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at",
        args: [section_id, JSON.stringify(content)]
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Content API error:', e);
    return res.status(500).json({ error: e.message });
  }
};
