# PMO Agent — Usage Tracking Setup

## How it works
Every time a PM uses the agent, it sends their name, team, question, and topic
to a Google Sheet via a free Google Apps Script webhook. Your boss can view
the sheet any time for a live usage report.

---

## Step 1 — Create the Google Sheet

1. Go to sheets.google.com → Create a new blank sheet
2. Name it: **PMO Agent Usage Log**
3. In Row 1, add these headers in columns A–F:
   - A1: Timestamp
   - B1: Name
   - C1: Team
   - D1: Topic
   - E1: Question
   - F1: Session Date

---

## Step 2 — Add the Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete everything in the editor and paste this code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var timestamp = new Date(data.timestamp);
    var sessionDate = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd/MM/yyyy");
    var timeStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "HH:mm");

    sheet.appendRow([
      timeStr,
      data.userName || "Unknown",
      data.userTeam || "Unknown",
      data.topic || "General",
      data.question || "",
      sessionDate
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "PMO Agent Logger is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (the floppy disk icon)
4. Click **Deploy → New deployment**
5. Click the gear icon next to "Type" → select **Web app**
6. Set:
   - Description: PMO Agent Logger
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**
8. Click **Authorize access** → choose your Google account → Allow
9. **Copy the Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 3 — Add the webhook URL to Vercel

1. Go to vercel.com → your PMO Agent project
2. Click **Settings → Environment Variables**
3. Add a new variable:
   - Key: `GOOGLE_SHEET_WEBHOOK`
   - Value: paste your Apps Script URL from Step 2
4. Click **Save**
5. Go to **Deployments → Redeploy**

That's it! Every question asked in the PMO Agent will now appear in your
Google Sheet within seconds.

---

## What gets logged

| Column | Example |
|--------|---------|
| Timestamp | 09:34 |
| Name | Sarah Johnson |
| Team | PMO |
| Topic | D365 |
| Question | Explain D365 cutover planning... |
| Session Date | 09/04/2026 |

## Tips for your boss

- **Filter by Team** to see which teams use it most
- **Filter by Topic** to see what subjects PMs need help with most
- **Sort by Date** to track adoption over time
- Add a **pivot table** to summarise usage by person or team per week
- Share the sheet (view only) with your boss so they always have live access
