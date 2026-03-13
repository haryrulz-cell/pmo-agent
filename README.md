# PMO Agent — Vercel Deployment

Deploy in ~5 minutes. Anyone with the URL can use it — no signup, no API key needed by users.

---

## Deploy to Vercel (Free)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-`)

### Step 2 — Deploy

**Option A: GitHub (recommended)**
1. Upload this folder to a new GitHub repo
2. Go to https://vercel.com → **Add New Project**
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here`
5. Click **Deploy**
6. Share your `.vercel.app` URL — done ✅

**Option B: Vercel CLI (no GitHub needed)**
```bash
npm install -g vercel
cd pmo-agent
vercel
# Follow prompts, then add the env variable:
vercel env add ANTHROPIC_API_KEY
# Paste your key when prompted, select all environments
vercel --prod
```

---

## Project Structure

```
pmo-agent/
├── api/
│   └── chat.js        ← Serverless function (holds API key, proxies to Anthropic)
├── public/
│   └── index.html     ← Full PMO Agent UI
├── vercel.json        ← Routing config
├── package.json
└── README.md
```

## How it works

- User visits your Vercel URL → gets `public/index.html`
- User asks a question → browser POSTs to `/api/chat`
- Vercel runs `api/chat.js` server-side with your secret API key
- Response sent back to browser
- **Your API key is never exposed to users**
