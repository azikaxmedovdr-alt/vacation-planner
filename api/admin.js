export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { password, action, id, status } = req.body || {};

  if (!password || password !== process.env.MANAGER_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Проверка пароля — если просто открываем вкладку руководителя
  if (action === 'verify') {
    return res.status(200).json({ ok: true });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'server not configured' });
  }

  if (!id) {
    return res.status(400).json({ error: 'id required' });
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/requests?id=eq.${encodeURIComponent(id)}`;
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };

  let resp;
  if (action === 'delete') {
    resp = await fetch(endpoint, { method: 'DELETE', headers });
  } else if (action === 'setStatus') {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'bad status' });
    }
    resp = await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
  } else {
    return res.status(400).json({ error: 'unknown action' });
  }

  if (!resp.ok) {
    const text = await resp.text();
    return res.status(500).json({ error: text });
  }

  return res.status(200).json({ ok: true });
}
