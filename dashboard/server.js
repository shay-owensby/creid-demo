#!/usr/bin/env node
/**
 * AI Real Estate Analyst — Demo Dashboard Server
 *
 * Zero-dependency Node server that:
 *  - Auto-discovers skills from .claude/skills/<name>/SKILL.md
 *  - Triggers headless Claude Code runs (`claude -p "/skill <input>"`)
 *  - Streams run activity to the browser via Server-Sent Events
 *  - Watches the repo for PROPERTY-* report files and serves them
 *
 * Usage:  node dashboard/server.js   →  http://localhost:4750
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const AGENTS_DIR = path.join(ROOT, '.claude', 'agents');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 4750;
const REPORT_RE = /^PROPERTY-.*\.(md|pdf)$/;

// ---------------------------------------------------------------- skills ---

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function listSkills() {
  const skills = [];
  for (const dir of fs.readdirSync(SKILLS_DIR)) {
    const file = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text);
    const id = fm.skill || dir;
    let name = fm.name || '';
    if (!name || name === id) {
      const h1 = text.match(/^# (.+)$/m);
      name = h1 ? h1[1].trim() : id;
    }
    skills.push({ id, dir, name, description: fm.description || '' });
  }
  // Orchestrator first, then alphabetical
  skills.sort((a, b) =>
    (a.id === 'realestate') ? -1 : (b.id === 'realestate') ? 1 : a.id.localeCompare(b.id));
  return skills;
}

// ----------------------------------------------------------------- agents ---

function listAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  const agents = [];
  for (const file of fs.readdirSync(AGENTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const id = file.replace(/\.md$/, '');
    const h1 = text.match(/^# (.+)$/m);
    // First paragraph after the H1 is the agent's role description
    const para = text.match(/^# .+\n+([^\n#*].+)/m);
    const weight = text.match(/## Agent Weight\s+\*\*(\d+%)\*\*/);
    agents.push({
      id,
      name: h1 ? h1[1].trim() : id,
      description: para ? para[1].trim() : '',
      weight: weight ? weight[1] : null,
    });
  }
  agents.sort((a, b) => a.id.localeCompare(b.id));
  return agents;
}

// ------------------------------------------------------------------- SSE ---

const sseClients = new Set();

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) res.write(msg);
}

// ------------------------------------------------------------------ runs ---

const runs = new Map(); // id -> { id, skill, input, status, events[], startedAt }
let runCounter = 0;

function addEvent(run, ev) {
  ev.t = Date.now();
  run.events.push(ev);
  broadcast('run-event', { runId: run.id, ...ev });
}

function summarizeToolUse(block) {
  const i = block.input || {};
  const detail = i.description || i.file_path || i.path || i.command || i.query ||
    i.url || i.pattern || (typeof i.prompt === 'string' ? i.prompt.slice(0, 120) : '') || '';
  return { tool: block.name, detail: String(detail).slice(0, 160) };
}

function startRun(skill, input) {
  const id = `run-${++runCounter}-${Date.now().toString(36)}`;
  const run = { id, skill, input, status: 'running', events: [], startedAt: Date.now() };
  runs.set(id, run);

  const prompt = `/${skill} ${input}`.trim();
  const env = { ...process.env };
  delete env.CLAUDECODE; // allow nested headless runs
  delete env.CLAUDE_CODE_ENTRYPOINT;

  const child = spawn('claude', [
    '-p', prompt,
    '--dangerously-skip-permissions',
    '--output-format', 'stream-json',
    '--verbose',
  ], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });

  run.child = child;
  addEvent(run, { kind: 'status', text: `Launching ${prompt}` });
  broadcast('runs-changed', publicRun(run));

  let buf = '';
  child.stdout.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      handleStreamEvent(run, obj);
    }
  });

  child.stderr.on('data', chunk => {
    const text = String(chunk).trim();
    if (text) addEvent(run, { kind: 'stderr', text: text.slice(0, 300) });
  });

  child.on('close', code => {
    if (run.status === 'running') {
      run.status = code === 0 ? 'done' : 'error';
      addEvent(run, { kind: 'status', text: code === 0 ? 'Run complete' : `Exited with code ${code}` });
    }
    broadcast('runs-changed', publicRun(run));
    broadcast('reports-changed', {});
  });

  return run;
}

function handleStreamEvent(run, obj) {
  if (obj.type === 'system' && obj.subtype === 'init') {
    addEvent(run, { kind: 'status', text: `Session started (model: ${obj.model || 'claude'})` });
  } else if (obj.type === 'assistant' && obj.message && Array.isArray(obj.message.content)) {
    for (const block of obj.message.content) {
      if (block.type === 'text' && block.text && block.text.trim()) {
        addEvent(run, { kind: 'text', text: block.text.trim().slice(0, 600) });
      } else if (block.type === 'tool_use') {
        addEvent(run, { kind: 'tool', ...summarizeToolUse(block) });
      }
    }
  } else if (obj.type === 'result') {
    run.status = obj.subtype === 'success' ? 'done' : 'error';
    const secs = obj.duration_ms ? ` in ${(obj.duration_ms / 1000).toFixed(0)}s` : '';
    addEvent(run, { kind: 'result', text: `Finished${secs}` });
  }
}

function publicRun(run) {
  return { id: run.id, skill: run.skill, input: run.input, status: run.status, startedAt: run.startedAt };
}

// --------------------------------------------------------------- reports ---

function listReports() {
  return fs.readdirSync(ROOT)
    .filter(f => REPORT_RE.test(f))
    .map(f => {
      const st = fs.statSync(path.join(ROOT, f));
      return { name: f, mtime: st.mtimeMs, size: st.size };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

let reportDebounce = null;
fs.watch(ROOT, (event, filename) => {
  if (filename && REPORT_RE.test(filename)) {
    clearTimeout(reportDebounce);
    reportDebounce = setTimeout(() => broadcast('reports-changed', {}), 400);
  }
});

// ---------------------------------------------------------------- server ---

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(fs.readFileSync(path.join(PUBLIC_DIR, 'index.html')));
  }

  if (p === '/api/skills') return json(res, 200, listSkills());

  if (p === '/api/skill-md') {
    const id = url.searchParams.get('id') || '';
    if (!/^[\w-]+$/.test(id)) return json(res, 400, { error: 'bad id' });
    const file = path.join(SKILLS_DIR, id, 'SKILL.md');
    if (!fs.existsSync(file)) return json(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
    return res.end(fs.readFileSync(file));
  }

  if (p === '/api/agents') return json(res, 200, listAgents());

  if (p === '/api/agent-md') {
    const id = url.searchParams.get('id') || '';
    if (!/^[\w-]+$/.test(id)) return json(res, 400, { error: 'bad id' });
    const file = path.join(AGENTS_DIR, id + '.md');
    if (!fs.existsSync(file)) return json(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
    return res.end(fs.readFileSync(file));
  }

  if (p === '/api/runs') return json(res, 200, [...runs.values()].map(publicRun));

  if (p === '/api/run' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { skill, input } = JSON.parse(body);
        if (!skill || !/^[\w-]+$/.test(skill)) return json(res, 400, { error: 'bad skill' });
        const run = startRun(skill, String(input || ''));
        json(res, 200, publicRun(run));
      } catch (e) {
        json(res, 400, { error: String(e.message) });
      }
    });
    return;
  }

  if (p.startsWith('/api/run-events/')) {
    const run = runs.get(p.split('/').pop());
    if (!run) return json(res, 404, { error: 'not found' });
    return json(res, 200, { ...publicRun(run), events: run.events });
  }

  if (p === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (p === '/api/reports') return json(res, 200, listReports());

  if (p === '/api/report') {
    const name = path.basename(url.searchParams.get('name') || '');
    if (!REPORT_RE.test(name)) return json(res, 400, { error: 'bad name' });
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) return json(res, 404, { error: 'not found' });
    if (req.method === 'DELETE') {
      fs.unlinkSync(file);
      broadcast('reports-changed', {});
      return json(res, 200, { deleted: name });
    }
    const types = { '.md': 'text/markdown; charset=utf-8', '.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf' };
    res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'text/plain' });
    return res.end(fs.readFileSync(file));
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`\n  AI Real Estate Analyst dashboard  →  http://localhost:${PORT}\n`);
});
