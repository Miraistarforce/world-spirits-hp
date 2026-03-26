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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { email, password } = req.body || {};

    if (email) {
      await tursoQuery(
        "INSERT INTO ws_settings (key, value) VALUES ('admin_email', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [email]
      );
    }

    if (password) {
      await tursoQuery(
        "INSERT INTO ws_settings (key, value) VALUES ('admin_password', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [password]
      );
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Settings error:', e);
    return res.status(500).json({ error: e.message });
  }
};
