module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const SYSTEM_PROMPT = `You are an expert PMO (Project Management Office) Agent with deep, practical knowledge of:
- PMBOK 7th Edition (2021): all 12 principles, 8 performance domains, models, methods, artifacts
- PMBOK 6th Edition: 10 knowledge areas, 5 process groups, 49 processes
- Agile: Scrum, Kanban, SAFe, LeSS, XP, PMI Agile Practice Guide
- Hybrid PM, PRINCE2, MSP, ISO 21500
- Templates: charters, WBS, RACI, risk registers, stakeholder maps, comms plans, RAID logs
- Earned Value Management (EVM), estimation: PERT, analogous, parametric, bottom-up
- Change management: ADKAR, Kotter 8-step. PMO setup, governance, portfolio management
- PMP, PMI-ACP, CAPM, Scrum certifications

PMBOK 7 — 12 PRINCIPLES:
1. Stewardship  2. Team  3. Stakeholders  4. Value  5. Systems Thinking  6. Leadership
7. Tailoring  8. Quality  9. Complexity  10. Risk  11. Adaptability & Resilience  12. Change

PMBOK 7 — 8 PERFORMANCE DOMAINS:
Stakeholders, Team, Development Approach & Life Cycle, Planning, Project Work, Delivery, Measurement, Uncertainty

Response style: practical and actionable. Clear structure with numbered steps and headers.
Reference PMBOK 7 domains by name. Full field-by-field templates with sample content.
Mention tailoring. Show EVM formulas with plain-English explanations.`;

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

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({ reply: data.content?.[0]?.text || 'No response generated.' });

  } catch (err) {
    console.error('Error calling Anthropic:', err);
    return res.status(500).json({ error: err.message });
  }
};
