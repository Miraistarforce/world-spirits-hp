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
  if (!resp.ok) return [];
  const data = await resp.json();
  const result = data.results && data.results[0];
  if (!result || !result.response || !result.response.result) return [];
  const cols = result.response.result.cols.map(c => c.name);
  return result.response.result.rows.map(row => {
    const obj = {};
    row.forEach((cell, i) => { obj[cols[i]] = cell.value; });
    return obj;
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};

  // DBに設定があればそちらを優先、なければ環境変数を使用
  let adminEmail = process.env.ADMIN_EMAIL;
  let adminPassword = process.env.ADMIN_PASSWORD;

  try {
    const rows = await tursoQuery("SELECT key, value FROM ws_settings WHERE key IN ('admin_email', 'admin_password')");
    rows.forEach(row => {
      if (row.key === 'admin_email') adminEmail = row.value;
      if (row.key === 'admin_password') adminPassword = row.value;
    });
  } catch (e) {
    // DB読み込み失敗時は環境変数にフォールバック
  }

  if (email === adminEmail && password === adminPassword) {
    return res.status(200).json({ token: process.env.ADMIN_TOKEN, email });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};
