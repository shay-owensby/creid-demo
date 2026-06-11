# Shared HTML Report Export Guide

Every realestate-* skill that produces a report must ALSO export a styled, self-contained HTML version of that report. This guide defines the shared template and conversion rules so all HTML reports look identical across skills.

The visual language is **Notion-style**: a clean white page, a large emoji page icon above a bold plain title, soft pastel tag pills for headline metrics, flat sections separated by hairline dividers (no card shadows or gradients), emoji callout blocks, and quiet minimal tables.

## Rules

1. **Same base name** — The HTML file uses the same base name as the primary output, with an `.html` extension (e.g., `PROPERTY-COMPS-123-Oak-St.md` → `PROPERTY-COMPS-123-Oak-St.html`). For `realestate-quick` (no markdown file), use `PROPERTY-QUICK-[ADDRESS].html`.
2. **Full content** — Render EVERY section of the report into the HTML. Never abbreviate or summarize content in the HTML version.
3. **Self-contained** — All CSS inline in a `<style>` block. No external stylesheets, fonts, scripts, or images. The file must render offline.
4. **Same directory** — Save the HTML next to the markdown file in the current working directory.
5. **Color-coded scores** — Scores 70-100 green, 40-69 amber, 0-39 red (same thresholds as the PDF generator).
6. **Disclaimer** — The disclaimer must appear in the page-header meta area and in the footer.
7. **Page icon** — Pick one emoji that fits the report type (🏠 analysis, 📊 market, 🔍 comps, 💰 rental/invest, 🔨 flip, 🏢 commercial, 🏘️ neighborhood, 📋 listing, ⚖️ compare, 🧮 mortgage, ⚡ quick, 🎯 screen).

## HTML Skeleton

Use this exact skeleton, replacing the `<!-- ... -->` placeholders:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><!-- REPORT TITLE — e.g. Property Analysis: 123 Oak St --></title>
<style>
  :root {
    --ink: #37352F; --ink-light: #787774; --ink-faint: #9B9A97;
    --bg: #FFFFFF; --line: #E9E9E7; --hover: #F7F6F4;
    --green: #448361; --amber: #CB912F; --red: #D44C47; --blue: #337EA9;
    --tag-gray-bg: #F1F1EF;   --tag-gray-ink: #50514C;
    --tag-green-bg: #DBEDDB;  --tag-green-ink: #1C3829;
    --tag-yellow-bg: #FDECC8; --tag-yellow-ink: #402C1B;
    --tag-red-bg: #FFE2DD;    --tag-red-ink: #5D1715;
    --tag-blue-bg: #D3E5EF;   --tag-blue-ink: #183347;
    --callout-gray: #F1F1EF; --callout-green: #EDF3EC; --callout-yellow: #FBF3DB; --callout-red: #FDEBEC; --callout-blue: #E7F3F8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: var(--ink); background: var(--bg); line-height: 1.6; font-size: 16px; -webkit-font-smoothing: antialiased; }
  .page { max-width: 760px; margin: 0 auto; padding: 64px 32px 96px; }
  header.report .page-icon { font-size: 60px; line-height: 1; margin-bottom: 16px; }
  header.report h1 { font-size: 36px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; margin-bottom: 10px; }
  header.report .meta { font-size: 14px; color: var(--ink-light); margin-bottom: 4px; }
  header.report .disclaimer { font-size: 12px; color: var(--ink-faint); margin-top: 10px; }
  .tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
  .tag { display: inline-flex; align-items: baseline; gap: 6px; border-radius: 4px; padding: 3px 10px; font-size: 13px; background: var(--tag-gray-bg); color: var(--tag-gray-ink); }
  .tag .label { font-size: 12px; opacity: 0.7; }
  .tag .value { font-weight: 600; }
  .tag.score-high { background: var(--tag-green-bg); color: var(--tag-green-ink); }
  .tag.score-mid { background: var(--tag-yellow-bg); color: var(--tag-yellow-ink); }
  .tag.score-low { background: var(--tag-red-bg); color: var(--tag-red-ink); }
  .tag.info { background: var(--tag-blue-bg); color: var(--tag-blue-ink); }
  hr.divider, header.report { border: none; border-bottom: 1px solid var(--line); padding-bottom: 28px; }
  section.block { padding: 28px 0; border-bottom: 1px solid var(--line); }
  section.block:last-of-type { border-bottom: none; }
  section.block h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 14px; }
  section.block h3 { font-size: 17px; font-weight: 600; margin: 20px 0 8px; }
  p { margin-bottom: 10px; }
  ul, ol { margin: 0 0 12px 24px; }
  li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 14px; }
  th { color: var(--ink-light); font-weight: 500; text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); }
  td { padding: 7px 10px; border-bottom: 1px solid var(--line); }
  tr:hover td { background: var(--hover); }
  .pos { color: var(--green); font-weight: 600; }
  .neg { color: var(--red); font-weight: 600; }
  .scorebar { background: var(--tag-gray-bg); border-radius: 3px; height: 6px; overflow: hidden; margin: 6px 0 14px; }
  .scorebar .fill { height: 100%; border-radius: 3px; }
  .fill.high { background: var(--green); } .fill.mid { background: var(--amber); } .fill.low { background: var(--red); }
  .callout { display: flex; gap: 12px; align-items: flex-start; background: var(--callout-gray); border-radius: 6px; padding: 16px; margin: 14px 0; font-size: 15px; }
  .callout .icon { font-size: 18px; line-height: 1.4; }
  .callout.good { background: var(--callout-green); }
  .callout.warn { background: var(--callout-yellow); }
  .callout.danger { background: var(--callout-red); }
  .callout.info { background: var(--callout-blue); }
  footer.report { font-size: 12px; color: var(--ink-faint); margin-top: 48px; border-top: 1px solid var(--line); padding-top: 20px; }
  @media print { .page { padding: 0; } section.block { break-inside: avoid; } }
</style>
</head>
<body>
<div class="page">

  <header class="report">
    <div class="page-icon"><!-- One emoji per report type, e.g. 🏠 --></div>
    <h1><!-- Report title: e.g. Property Analysis Report — 123 Oak St, Austin, TX --></h1>
    <div class="meta">Generated: <!-- DATE --> · AI Real Estate Analyst</div>
    <div class="tags">
      <!-- One tag per headline metric. Example:
      <span class="tag score-mid"><span class="label">Property Score</span><span class="value">48/100</span></span>
      <span class="tag"><span class="label">Grade</span><span class="value">C</span></span>
      <span class="tag info"><span class="label">Signal</span><span class="value">Caution</span></span>
      -->
    </div>
    <div class="disclaimer">For educational/research purposes only. Not financial or investment advice. Always consult licensed real estate professionals.</div>
  </header>

  <!-- One <section class="block"> per report section, in the same order as the markdown report. -->

  <footer class="report">
    Report generated by AI Real Estate Analyst on <!-- DATE -->. For educational and research purposes only.
    Not financial or investment advice. Always verify all data and consult licensed real estate professionals before making any decisions.
  </footer>

</div>
</body>
</html>
```

## Conversion Rules (markdown → HTML)

| Markdown element | HTML rendering |
|------------------|----------------|
| `## Section` | `<section class="block"><h2>Section</h2>...</section>` |
| `### Subsection` | `<h3>` inside the parent block |
| Tables | `<table>` with `<th>` header row (styles handle the rest) |
| Headline scores/grades/signals | Header `.tag` pills; add `score-high`/`score-mid`/`score-low` per the 70/40 thresholds, `info` for neutral signals |
| Sub-scores (e.g., "Data Quality 15/20") | A `.scorebar` with `.fill` width = percentage and `high`/`mid`/`low` class |
| Positive money/metrics (cash flow +, under-priced) | wrap value in `<span class="pos">` |
| Negative money/metrics (cash flow –, over-priced) | wrap value in `<span class="neg">` |
| Recommendations / verdicts | `.callout good` (buy), `.callout warn` (watch/caution), `.callout danger` (pass/avoid) |
| Critical data corrections or warnings | `.callout danger` near the top |
| Blockquotes (`> **Generated:** ...`) | Fold into the header `.meta` line |

Every `.callout` starts with an emoji icon div: `<div class="icon">💡</div>` (good ✅, warn ⚠️, danger ❌, info 💡, neutral 📌), followed by a `<div>` wrapping the text.

Example callout:

```html
<div class="callout warn"><div class="icon">⚠️</div><div><strong>Caution:</strong> Negative cash flow at current rates — only viable as an appreciation play.</div></div>
```

## Severity colors for risk tables

In risk-matrix tables, color the Severity cell text: High → `class="neg"`, Medium → plain, Low → `class="pos"`.
