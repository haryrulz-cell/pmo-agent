module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const SYSTEM_PROMPT = `You are an expert PMO Agent with deep knowledge of PMBOK 7, PMBOK 6, Agile, Hybrid PM, PRINCE2, EVM, risk management, all PM templates, and certifications. Be practical, structured, and reference PMBOK 7 domains by name. Provide full templates with sample content when asked.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ reply: data.content?.[0]?.text || 'No response generated.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
```

**Step 3 — Commit and wait**
- Click **Commit changes** → Vercel auto-redeploys in ~30 seconds

After this your repo should look like:
```
api/
  chat.js   ✅
index.html  ✅
package.json ✅
vercel.json  ✅
