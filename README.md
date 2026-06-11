# creid-demo — AI Real Estate Analyst

**AI-powered property research and investment analysis** for Claude Code.
Analyze properties, estimate rental income, evaluate investment opportunities, write listings, and produce client-ready PDF reports — all from the command line.

This project is a **project-scoped installation** of the AI Real Estate Analyst skill pack: all 25 skills and 5 subagents live under `.claude/`, so they activate automatically whenever Claude Code is opened in this directory — no global install required.

> Based on [zubair-trabzada/ai-realestate-claude](https://github.com/zubair-trabzada/ai-realestate-claude) (MIT License).

---

## What It Does

The AI Real Estate Analyst turns Claude Code into a comprehensive property research system. It runs **5 parallel AI agents** to analyze any property across value, income potential, neighborhood quality, investment upside, and market conditions — then produces a composite **Property Score (0-100)** with a clear buy/hold/pass signal.

---

## Getting Started

```bash
git clone https://github.com/shay-owensby/creid-demo.git
cd creid-demo
pip3 install reportlab beautifulsoup4 requests   # needed for PDF reports
claude
```

Then try:

```
/realestate analyze 123 Main St, Austin TX 78701
/realestate quick 456 Oak Ave, Denver CO 80202
/realestate invest 789 Pine Dr, Tampa FL 33602
```

### Requirements

- Claude Code CLI
- Python 3.8+ with `reportlab` (PDF reports), `beautifulsoup4`, `requests`

---

## Skill Breakdown

Each skill is a self-contained `SKILL.md` under [.claude/skills/](.claude/skills/). Here's what each one does:

| Skill | Command | What It Does |
|-------|---------|-------------|
| **realestate** | `/realestate <subcommand>` | Main orchestrator — routes subcommands, enforces scoring methodology and output standards across all skills |
| **realestate-analyze** | `/realestate analyze <address>` | Full property analysis — launches all 5 agents in parallel and produces the composite Property Score (0-100), investment grade, and actionable recommendations |
| **realestate-quick** | `/realestate quick <address>` | 60-second property snapshot without subagents — price, score, signal, top 3 factors, estimated rent and cap rate |
| **realestate-comps** | `/realestate comps <address>` | Finds and analyzes 5-10 comparable recent sales to estimate fair market value, calculate price adjustments, and score the value proposition |
| **realestate-rental** | `/realestate rental <address>` | Estimates rental income from comparable rentals, builds a full expense model, and projects cash flow across conservative, moderate, and optimistic scenarios |
| **realestate-invest** | `/realestate invest <address>` | Evaluates three investment strategies — Buy & Hold, BRRRR, and Fix & Flip — with feasibility scores, multi-year projections, tax benefits, and break-even analysis |
| **realestate-neighborhood** | `/realestate neighborhood <address>` | Schools, crime, walkability, demographics, amenities, growth trajectory, and natural disaster risk with a Neighborhood Score (0-100) |
| **realestate-flip** | `/realestate flip <address>` | Fix-and-flip analysis — purchase price, ARV, rehab budget breakdown, holding/selling costs, profit margin, ROI, timeline, and risk with a Flip Score (0-100) |
| **realestate-commercial** | `/realestate commercial <address>` | Commercial property analysis — NOI, cap rate, expense ratio, tenant mix, vacancy, debt coverage, replacement cost, and lease terms with a Commercial Score (0-100) |
| **realestate-mortgage** | `/realestate mortgage <price>` | Mortgage calculator and affordability analysis — monthly payments, amortization, loan comparison, rent vs buy, and refinance break-even with rate tables |
| **realestate-market** | `/realestate market <city/zip>` | Local market analysis — median prices, inventory, days on market, price trends, rental conditions, and economic drivers with a Market Score (0-100) |
| **realestate-compare** | `/realestate compare <addr1> <addr2>` | Side-by-side comparison of two properties across price, specs, rental income, neighborhood, and investment potential — with a winner per category |
| **realestate-screen** | `/realestate screen <criteria>` | Property screener with pre-built screens for Cash Flow, Appreciation, BRRRR, First-Time Buyer, and Short-Term Rental strategies plus custom criteria |
| **realestate-listing** | `/realestate listing <address>` | MLS-ready listing descriptions with attention-grabbing headlines, feature highlights, neighborhood context, and SEO keywords across multiple buyer-persona styles |
| **realestate-report-pdf** | `/realestate report-pdf` | Compiles all `PROPERTY-*.md` analysis files into a polished, client-ready PDF with score gauges, comparison tables, financial projections, and recommendations |

### Commercial Real Estate Suite

Ten skills for institutional-grade CRE work — underwriting, lease analysis, development, and deal execution. They chain through report files: `dcf` reuses a `PROPERTY-COMMERCIAL` analysis when present, `waterfall` runs off `PROPERTY-DCF` cash flows, `om` and `loi` build from prior analyses.

| Skill | Command | What It Does |
|-------|---------|-------------|
| **realestate-dcf** | `/realestate dcf <address> [hold] [price]` | Multi-year DCF underwriting — year-by-year pro forma with lease rollover, exit value, levered/unlevered IRR, equity multiple, NPV, and sensitivity matrices with a DCF Score (0-100) |
| **realestate-waterfall** | `/realestate waterfall <deal terms>` | LP/GP equity waterfall modeling — preferred returns, promote tiers, catch-up, European vs American structures, fee drag, and scenario testing with a Waterfall Score (0-100) |
| **realestate-debt** | `/realestate debt <address>` | CRE debt sizing across LTV/DSCR/debt-yield constraints, lender program comparison (agency, CMBS, bank, bridge, SBA), negative leverage check, stress tests, and refinance analysis with a Debt Score (0-100) |
| **realestate-lease-abstract** | `/realestate lease-abstract <lease file>` | Abstracts a commercial lease document — rent schedule, escalations, expense recovery, options, security, assignment — with red-flag analysis and a Lease Risk Score (0-100) |
| **realestate-ner** | `/realestate ner <proposals>` | Net effective rent comparison of competing lease proposals — normalizes free rent, TI, escalations, and term to straight-line and PV-based NER with negotiation levers |
| **realestate-develop** | `/realestate develop <parcel> [type]` | Ground-up development feasibility — buildable program, construction budget, yield-on-cost, development spread, land residual value, and lease-up timeline with a Development Score (0-100) |
| **realestate-hbu** | `/realestate hbu <address>` | Highest & best use analysis — the four-tests framework, zoning capacity, use-scenario value matrix, and entitlement upside with an HBU Score (0-100) per scenario |
| **realestate-om** | `/realestate om <address>` | Offering memorandum generator — broker-quality sell-side marketing package with investment highlights, rent roll, financials, market story, and cap-rate pricing guidance |
| **realestate-loi** | `/realestate loi <address> <terms>` | Drafts non-binding purchase or lease LOIs with market-norm annotations, term aggressiveness ratings, and negotiation alternatives (not legal advice — attorney review required) |
| **realestate-1031** | `/realestate 1031 <property details>` | 1031 exchange analysis — deferral math, boot, depreciation recapture, 45/180-day timelines, replacement scenarios, and DST/TIC alternatives with an Exchange Score (0-100) |

In addition to its primary output (markdown report, terminal scorecard, or PDF), **every skill also exports a styled, self-contained HTML version** of its report — same base name with an `.html` extension — using the shared template at [.claude/skills/realestate/references/html-report-template.md](.claude/skills/realestate/references/html-report-template.md).

---

## The 5 Parallel Agents

The full analysis (`/realestate analyze`) fans out to 5 subagents in [.claude/agents/](.claude/agents/), each owning one scoring dimension:

| Agent | Dimension | What It Analyzes |
|-------|-----------|------------------|
| **realestate-comps** | Value & Comps (25%) | Recent comparable sales, price per sq ft, market value estimate — is the property overpriced, fairly priced, or underpriced? |
| **realestate-rental** | Income Potential (20%) | Rental income potential, cash flow projections, expense estimates, and return metrics |
| **realestate-neighborhood** | Neighborhood Quality (20%) | School quality, safety, walkability, amenities, demographics, and growth trajectory |
| **realestate-invest** | Investment Upside (20%) | Viability across buy-and-hold, BRRRR, fix-and-flip, and STR strategies — best approach, ROI, risk, and exit strategy |
| **realestate-market** | Market Conditions (15%) | Supply/demand dynamics, price trends, economic drivers, and whether the market favors buyers or sellers |

---

## Scoring Methodology

The **Property Score (0-100)** is the weighted composite of the 5 agent dimensions above.

| Score | Grade | Signal |
|-------|-------|--------|
| 85-100 | A+ | **Strong Buy** — excellent value across all dimensions |
| 70-84 | A | **Buy** — favorable fundamentals with manageable risks |
| 55-69 | B | **Hold/Watch** — mixed signals, deeper due diligence needed |
| 40-54 | C | **Caution** — significant concerns in one or more areas |
| 25-39 | D | **Pass** — unfavorable risk/reward at current pricing |
| 0-24 | F | **Avoid** — major red flags, walk away |

---

## Project Structure

```
creid-demo/
└── .claude/
    ├── skills/
    │   ├── realestate/                 # Main orchestrator
    │   │   ├── SKILL.md
    │   │   ├── references/
    │   │   │   └── html-report-template.md      # Shared HTML export template (all skills)
    │   │   └── scripts/
    │   │       └── generate_realestate_pdf.py   # PDF report generator (ReportLab)
    │   ├── realestate-analyze/         # Full analysis (launches 5 agents)
    │   ├── realestate-quick/           # 60-second snapshot
    │   ├── realestate-comps/           # Comparable sales
    │   ├── realestate-rental/          # Rental income & cash flow
    │   ├── realestate-invest/          # Investment strategies
    │   ├── realestate-neighborhood/    # Schools, crime, walkability
    │   ├── realestate-flip/            # Fix-and-flip
    │   ├── realestate-commercial/      # Commercial analysis
    │   ├── realestate-mortgage/        # Mortgage calculator
    │   ├── realestate-market/          # Local market conditions
    │   ├── realestate-compare/         # Side-by-side comparison
    │   ├── realestate-screen/          # Property screener
    │   ├── realestate-listing/         # MLS listing writer
    │   ├── realestate-report-pdf/      # PDF report generation
    │   ├── realestate-dcf/             # Multi-year DCF underwriting (CRE)
    │   ├── realestate-waterfall/       # LP/GP equity waterfall (CRE)
    │   ├── realestate-debt/            # Debt sizing & lender comparison (CRE)
    │   ├── realestate-lease-abstract/  # Lease document abstraction (CRE)
    │   ├── realestate-ner/             # Net effective rent comparison (CRE)
    │   ├── realestate-develop/         # Development feasibility (CRE)
    │   ├── realestate-hbu/             # Highest & best use (CRE)
    │   ├── realestate-om/              # Offering memorandum generator (CRE)
    │   ├── realestate-loi/             # LOI drafter (CRE)
    │   └── realestate-1031/            # 1031 exchange analysis (CRE)
    └── agents/
        ├── realestate-comps.md         # Comparable sales agent
        ├── realestate-rental.md        # Rental income agent
        ├── realestate-neighborhood.md  # Neighborhood agent
        ├── realestate-invest.md        # Investment agent
        └── realestate-market.md        # Market conditions agent
```

---

## Report Output

Each skill writes its reports (`PROPERTY-*.md`, `PROPERTY-*.html`, and PDFs) to the project root. These exports contain client and property data and are **git-ignored — they stay local and are never committed to the repo**.

---

## PDF Reports

`/realestate report-pdf` generates a professional 6-page report with a color-coded Property Score gauge, score dashboard, comp tables, cash flow projections, neighborhood charts, and a recommendation section with suggested offer and risk matrix.

```bash
# Generate a sample PDF report
python3 .claude/skills/realestate/scripts/generate_realestate_pdf.py --demo
```

---

## Disclaimer

This tool is for **educational and research purposes only**. It is **NOT** financial or investment advice. Real estate values, rental estimates, and investment projections are AI-generated approximations based on publicly available data. Always verify all information with licensed professionals — real estate agents, appraisers, inspectors, and financial advisors — before making any purchase or investment decisions.

---

## Credits

Skill pack by [Zubair Trabzada](https://github.com/zubair-trabzada) — [ai-realestate-claude](https://github.com/zubair-trabzada/ai-realestate-claude), MIT License.
