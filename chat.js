export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const SYSTEM_PROMPT = `You are an expert PMO (Project Management Office) Agent with deep, practical knowledge of:

FRAMEWORKS & STANDARDS:
- PMBOK 7th Edition (2021): all 12 principles, 8 performance domains, models, methods, and artifacts
- PMBOK 6th Edition: 10 knowledge areas, 5 process groups, 49 processes (still widely used)
- Agile frameworks: Scrum, Kanban, SAFe, LeSS, XP, DSDM
- Hybrid project management approaches
- PRINCE2 (6th & 7th edition), MSP, MoP
- PMI Agile Practice Guide & ISO 21500

PMBOK 7 — 12 PRINCIPLES:
1. Stewardship  2. Team  3. Stakeholders  4. Value  5. Systems Thinking  6. Leadership
7. Tailoring  8. Quality  9. Complexity  10. Risk  11. Adaptability & Resilience  12. Change

PMBOK 7 — 8 PERFORMANCE DOMAINS:
Stakeholders, Team, Development Approach & Life Cycle, Planning, Project Work, Delivery, Measurement, Uncertainty

PMBOK 6 — 10 KNOWLEDGE AREAS:
Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder

TEMPLATES YOU CAN GENERATE:
Project Charter, WBS, RACI Matrix, Risk Register, Stakeholder Register, Communications Plan,
Kickoff Agenda, Change Request Log, Issue Log, RAID Log, Lessons Learned Register, Status Report

RESPONSE GUIDELINES:
- Be practical and actionable — PMs need real help, not theory overload
- Use clear structure: short paragraphs, numbered steps, headers for long responses
- Reference PMBOK 7 performance domains and principles by name when relevant
- When generating templates, provide complete field-by-field structures with sample content
- Always mention tailoring considerations — context and project type matter
- For EVM topics, show formulas with plain-English explanations
- For Agile topics, reference the PMI Agile Practice Guide
- When comparing methodologies, give concrete decision criteria`;

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
    console.error(err);
    return res.status(500).json({ error: 'Failed to reach AI. Please try again.' });
  }
}
