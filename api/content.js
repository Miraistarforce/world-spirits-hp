// Turso HTTP API helper
async function tursoQuery(sql, args) {
  const url = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
  const body = {
    requests: [
      { type: 'execute', stmt: { sql, args: (args || []).map(a => ({ type: 'text', value: String(a) })) } },
      { type: 'close' }
    ]
  };
  const resp = await fetch(url + '/v2/pipeline', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.TURSO_AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error('Turso error: ' + resp.status);
  const data = await resp.json();
  const result = data.results && data.results[0];
  if (result && result.type === 'error') throw new Error(result.error.message);
  if (!result || !result.response || !result.response.result) return [];
  const cols = result.response.result.cols.map(c => c.name);
  return result.response.result.rows.map(row => {
    const obj = {};
    row.forEach((cell, i) => { obj[cols[i]] = cell.value; });
    return obj;
  });
}

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
    if (req.method === 'GET') {
      const rows = await tursoQuery('SELECT section_id, content, updated_at FROM ws_content');
      const result = rows.map(row => ({
        section_id: row.section_id,
        content: JSON.parse(row.content || '{}'),
        updated_at: row.updated_at
      }));
      return res.status(200).json(result);
    }

    if (req.method === 'PUT') {
      if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { section_id, content } = req.body || {};
      if (!section_id) return res.status(400).json({ error: 'section_id required' });

      await tursoQuery(
        "INSERT INTO ws_content (section_id, content, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(section_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at",
        [section_id, JSON.stringify(content)]
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Content API error:', e);
    return res.status(500).json({ error: e.message });
  }
};
