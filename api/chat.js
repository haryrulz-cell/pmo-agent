const https = require('https');

// Log usage to Google Sheets via Apps Script webhook
function logToSheet(userName, userTeam, question, topic) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
  if (!webhookUrl) return; // silently skip if not configured

  try {
    const url = new URL(webhookUrl);
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      userName: userName || 'Unknown',
      userTeam: userTeam || 'Unknown',
      question: question ? question.substring(0, 300) : '',
      topic: topic || 'General'
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options);
    req.on('error', () => {}); // silent fail — never block the main response
    req.write(payload);
    req.end();
  } catch (e) {
    // never block main response due to logging failure
  }
}

// Detect topic category from the question
function detectTopic(question) {
  const q = (question || '').toLowerCase();
  if (/pmbok|principle|domain|knowledge area|process group/i.test(q)) return 'PMBOK';
  if (/agile|scrum|sprint|kanban|safe|backlog|velocity/i.test(q)) return 'Agile';
  if (/d365|dynamics|f&o|business central|finance.*operations|bc/i.test(q)) return 'D365';
  if (/ado|azure devops|work item|user story|developer|qa |functional/i.test(q)) return 'ADO';
  if (/template|charter|wbs|raci|risk register|raid|cutover|stakeholder|timesheet|fit.gap|checklist/i.test(q)) return 'Template';
  if (/risk|issue|escalat/i.test(q)) return 'Risk';
  if (/schedule|timeline|gantt|critical path|milestone/i.test(q)) return 'Schedule';
  if (/cost|budget|evm|earned value|variance/i.test(q)) return 'Cost/EVM';
  if (/cutover|go.live|migration|data migration|cutover plan/i.test(q)) return 'Cutover';
  if (/certif|pmp|pmi|capm|scrum master/i.test(q)) return 'Certification';
  return 'General';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userName, userTeam } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured on server' });

  // Log this request to Google Sheets (fire and forget)
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
  const question = lastUserMsg ? lastUserMsg.content : '';
  const topic = detectTopic(question);
  logToSheet(userName, userTeam, question, topic);

  const SYSTEM_PROMPT = `You are an expert PMO & Technology Agent with deep knowledge across:

PROJECT MANAGEMENT:
- PMBOK 7th Edition: 12 principles, 8 performance domains
- PMBOK 6th Edition: 10 knowledge areas, 5 process groups, 49 processes
- Agile: Scrum, Kanban, SAFe, LeSS, XP | Hybrid PM | PRINCE2 | MSP | ISO 21500
- EVM, estimation techniques (PERT, analogous, parametric, bottom-up)
- Change management: ADKAR, Kotter 8-step | PMO setup & governance

MICROSOFT DYNAMICS 365:
- D365 Finance & Operations (F&O): GL, AP, AR, Fixed Assets, Budgeting, Cash & Bank, Project Accounting
- D365 Business Central (BC): Finance, Sales, Purchase, Inventory, Manufacturing, Service
- D365 architecture, data model, integrations (OData, DIXF, Power Platform, Azure)
- D365 implementation methodology (Sure Step, FastTrack, Agile)
- D365 cutover planning, data migration, go-live readiness
- D365 security roles, workflows, alerts, batch jobs

AZURE DEVOPS (ADO):
- Work item types: Epics, Features, User Stories, Tasks, Bugs, Test Cases
- Role responsibilities: Developer, Project Manager, QA, Functional Consultant
- Sprint ceremonies, velocity tracking, burndown charts, pipelines

TIMESHEET MANAGEMENT:
- Best practices, approval workflows, utilisation tracking, variance analysis
- Integration with D365 Project Accounting and ADO

TEMPLATES: Project Charter, WBS, RACI, Risk Register, Stakeholder Map, RAID Log,
Comms Plan, Kickoff Agenda, Cutover Plan, Go-Live Checklist, ADO Sprint Plan,
Timesheet, D365 Fit-Gap Analysis, D365 Test Script, D365 Data Migration Plan

RESPONSE STYLE: practical, structured, numbered steps and headers.
Reference PMBOK 7 domains by name. Full field-by-field templates with sample content.
For D365 be version-specific (F&O vs BC). For ADO reference specific work item types.`;

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            res.status(500).json({ error: parsed.error.message });
          } else {
            res.status(200).json({ reply: parsed.content?.[0]?.text || 'No response generated.' });
          }
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse API response: ' + e.message });
        }
        resolve();
      });
    });

    apiReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    apiReq.write(payload);
    apiReq.end();
  });
};
