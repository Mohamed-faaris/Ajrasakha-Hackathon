import { loadEnamSnapshot } from "../runtime/snapshot.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderDashboardHtml(): Promise<string> {
  const snapshot = await loadEnamSnapshot();
  const sampleRows = snapshot?.sample ?? [];
  const updated = snapshot?.refreshedAt ? new Date(snapshot.refreshedAt).toLocaleString() : "Not refreshed yet";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>scraper-engine-ts stats</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --panel: rgba(10, 18, 33, 0.86);
      --panel-2: rgba(16, 26, 46, 0.92);
      --line: rgba(148, 163, 184, 0.18);
      --text: #e5eefc;
      --muted: #93a4bd;
      --accent: #7dd3fc;
      --accent-2: #22c55e;
      --warn: #fbbf24;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(125, 211, 252, 0.15), transparent 32%),
        radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 26%),
        linear-gradient(180deg, #07111f 0%, #081525 100%);
      color: var(--text);
      min-height: 100vh;
    }
    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    .hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0;
      font-size: clamp(28px, 4vw, 48px);
      letter-spacing: -0.04em;
    }
    .subtitle {
      margin-top: 8px;
      color: var(--muted);
      max-width: 680px;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(125, 211, 252, 0.16), rgba(125, 211, 252, 0.08));
      color: var(--text);
      padding: 12px 16px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 650;
      cursor: pointer;
    }
    .btn.secondary {
      background: rgba(255,255,255,0.03);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 18px;
      backdrop-filter: blur(18px);
      box-shadow: 0 14px 50px rgba(0, 0, 0, 0.24);
    }
    .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
    .value { margin-top: 12px; font-size: 32px; font-weight: 750; letter-spacing: -0.04em; }
    .small { color: var(--muted); font-size: 13px; margin-top: 8px; line-height: 1.5; }
    .panel {
      background: var(--panel-2);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 20px;
      margin-top: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      overflow: hidden;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      vertical-align: top;
      font-size: 14px;
    }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
      background: rgba(34, 197, 94, 0.12);
      color: #b8f2cb;
      border: 1px solid rgba(34, 197, 94, 0.22);
    }
    .muted { color: var(--muted); }
    @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <div>
        <div class="pill">ENAM refresh dashboard</div>
        <h1>scraper-engine-ts stats</h1>
        <p class="subtitle">A small live dashboard for the new ENAM TypeScript scraper. It shows the latest cached run, supports manual refresh, and updates automatically every 6 hours through the local scheduler.</p>
      </div>
      <div class="actions">
        <button class="btn" id="refresh">Refresh now</button>
        <a class="btn secondary" href="/api/stats" target="_blank" rel="noreferrer">View JSON</a>
      </div>
    </section>

    <section class="grid">
      <div class="card"><div class="label">Raw records</div><div class="value" id="rawCount">${snapshot?.rawCount ?? 0}</div><div class="small">Fetched from the live ENAM trade data API.</div></div>
      <div class="card"><div class="label">Mapped rows</div><div class="value" id="mappedCount">${snapshot?.mappedCount ?? 0}</div><div class="small">Intermediate site-specific shape.</div></div>
      <div class="card"><div class="label">Normalized rows</div><div class="value" id="normalizedCount">${snapshot?.normalizedCount ?? 0}</div><div class="small">Canonical output ready for downstream use.</div></div>
      <div class="card"><div class="label">Last refreshed</div><div class="value" style="font-size: 18px; line-height: 1.5;" id="refreshedAt">${escapeHtml(updated)}</div><div class="small">Auto refresh runs every 6 hours.</div></div>
    </section>

    <section class="panel">
      <div class="label">Latest source</div>
      <div style="margin-top: 8px; font-size: 18px; font-weight: 700;">${escapeHtml(snapshot?.sourceUrl ?? "No snapshot yet")}</div>
      <div class="small">Source date: <span id="sourceDate">${escapeHtml(snapshot?.sourceDate ?? "-")}</span> • fetched at: <span id="fetchedAt">${escapeHtml(snapshot?.fetchedAt ?? "-")}</span></div>
    </section>

    <section class="panel">
      <div class="label">Sample rows</div>
      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Mandi</th>
            <th>State</th>
            <th>Date</th>
            <th>Modal</th>
          </tr>
        </thead>
        <tbody id="sampleRows">
          ${sampleRows.length === 0 ? `<tr><td colspan="5" class="muted">No snapshot yet.</td></tr>` : sampleRows.map((row: any) => `<tr><td>${escapeHtml(row.cropName)}</td><td>${escapeHtml(row.mandiName)}</td><td>${escapeHtml(row.stateName)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.modalPrice)}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  </main>

  <script>
    const refreshButton = document.getElementById('refresh');
    async function loadStats() {
      const response = await fetch('/api/stats');
      const data = await response.json();
      document.getElementById('rawCount').textContent = data.rawCount ?? 0;
      document.getElementById('mappedCount').textContent = data.mappedCount ?? 0;
      document.getElementById('normalizedCount').textContent = data.normalizedCount ?? 0;
      document.getElementById('refreshedAt').textContent = data.refreshedAt ? new Date(data.refreshedAt).toLocaleString() : 'Not refreshed yet';
      document.getElementById('sourceDate').textContent = data.sourceDate ?? '-';
      document.getElementById('fetchedAt').textContent = data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : '-';
      document.getElementById('sampleRows').innerHTML = (data.sample || []).length === 0
        ? '<tr><td colspan="5" class="muted">No snapshot yet.</td></tr>'
        : data.sample.map((row) => '<tr><td>' + row.cropName + '</td><td>' + row.mandiName + '</td><td>' + row.stateName + '</td><td>' + row.date + '</td><td>' + row.modalPrice + '</td></tr>').join('');
    }
    refreshButton?.addEventListener('click', async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Refreshing...';
      try {
        await fetch('/api/refresh', { method: 'POST' });
        await loadStats();
      } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh now';
      }
    });
    setInterval(loadStats, 60_000);
  </script>
</body>
</html>`;
}
