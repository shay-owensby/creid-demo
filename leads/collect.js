#!/usr/bin/env node
/**
 * Lead collector — tails Vercel runtime logs for the deployed landing page
 * and appends every LEAD_SUBMISSION to leads/leads.md (plus leads/leads.jsonl
 * as a raw machine-readable record used for de-duplication).
 *
 * Uses the locally authenticated Vercel CLI (read-only `vercel logs`).
 * The log stream caps out after ~5 minutes, so the tail is respawned
 * automatically whenever it exits.
 *
 * Usage:  node leads/collect.js
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SITE = 'https://creid-demo.vercel.app';
const LEADS_DIR = __dirname;
const MD_FILE = path.join(LEADS_DIR, 'leads.md');
const JSONL_FILE = path.join(LEADS_DIR, 'leads.jsonl');

// ----------------------------------------------------------------- state ---

const seen = new Set();
const leadKey = l => `${l.email}|${l.at}`;

if (fs.existsSync(JSONL_FILE)) {
  for (const line of fs.readFileSync(JSONL_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { seen.add(leadKey(JSON.parse(line))); } catch {}
  }
}

if (!fs.existsSync(MD_FILE)) {
  fs.writeFileSync(MD_FILE, `# Event Leads — ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

Contacts collected from the landing page at ${SITE}.
The pack of agents, skills, and toolsets goes out to everyone below.

| # | Name | Email | Phone | Submitted |
|---|------|-------|-------|-----------|
`);
}

let count = fs.readFileSync(MD_FILE, 'utf8').split('\n').filter(l => /^\| \d+ \|/.test(l)).length;

// ---------------------------------------------------------------- record ---

function record(lead) {
  const key = leadKey(lead);
  if (seen.has(key)) return;
  seen.add(key);
  count++;
  fs.appendFileSync(JSONL_FILE, JSON.stringify(lead) + '\n');
  const when = new Date(lead.at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const cell = v => String(v || '—').replace(/\|/g, '\\|');
  fs.appendFileSync(MD_FILE, `| ${count} | ${cell(lead.name)} | ${cell(lead.email)} | ${cell(lead.phone)} | ${when} |\n`);
  console.log(`[${new Date().toLocaleTimeString()}] #${count} ${lead.name} <${lead.email}>`);
}

function scanLine(line) {
  // Each line from `vercel logs --json` is itself a JSON envelope whose
  // message field contains our LEAD_SUBMISSION payload.
  let text = line;
  try {
    const env = JSON.parse(line);
    text = env.message || env.text || line;
  } catch {}
  const m = text.match(/LEAD_SUBMISSION (\{.*?\})/);
  if (!m) return;
  try { record(JSON.parse(m[1])); } catch (e) {
    console.error('Could not parse lead:', m[1], e.message);
  }
}

// ------------------------------------------------------------------ tail ---

function tail() {
  console.log(`[${new Date().toLocaleTimeString()}] Attaching to runtime logs for ${SITE}…`);
  const child = spawn('npx', ['--yes', 'vercel@latest', 'logs', SITE, '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let buf = '';
  child.stdout.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      scanLine(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  });
  child.stderr.on('data', chunk => {
    const text = String(chunk).trim();
    // The CLI prints status info to stderr; surface errors only.
    if (/error/i.test(text)) console.error(text);
  });
  child.on('close', code => {
    // The CLI returns recent logs and exits, so this loop is effectively a
    // poller; dedupe via `seen` makes re-reading the same window harmless.
    setTimeout(tail, 20000);
  });
}

console.log(`Lead collector running — appending to ${MD_FILE}`);
console.log(`${seen.size} lead(s) already on file.`);
tail();
