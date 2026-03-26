function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  return token === process.env.ADMIN_TOKEN;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { filename, contentType, data } = req.body || {};
    if (!data || !filename) return res.status(400).json({ error: 'filename and data required' });

    // Vercel Blobが設定されている場合はそちらを使用
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      const buffer = Buffer.from(data, 'base64');
      const ext = filename.split('.').pop();
      const uniqueName = 'ws/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const blob = await put(uniqueName, buffer, {
        access: 'public',
        contentType: contentType || 'image/jpeg',
      });
      return res.status(200).json({ url: blob.url });
    }

    // Blobが未設定の場合はdata URLを返す
    const dataUrl = 'data:' + (contentType || 'image/jpeg') + ';base64,' + data;
    return res.status(200).json({ url: dataUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: e.message });
  }
};
