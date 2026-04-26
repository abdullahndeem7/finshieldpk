# FinShield PK 🛡️
 
**AI-Powered Fraud Detection & Shariah Compliance Platform for Pakistani Banks**
 
FinShield PK is a full-stack AI compliance platform built specifically for Pakistan's banking sector. It provides real-time fraud detection with Pakistan-specific patterns and automated Shariah contract screening against SBP-adopted AAOIFI standards.
 
---
 
## What It Does
 
### 🚨 Fraud Detection Agent
- Analyzes every transaction in real time using a 9-rule Pakistan-specific rules engine
- AI agent (LangGraph + Claude) performs deep analysis on flagged transactions
- Auto-generates SBP-format Suspicious Activity Reports (SARs) in seconds
- Detects: SIM swap attacks, Raast payment abuse, JazzCash rapid fraud, mule account patterns, off-hours large transfers, round-amount structuring
### 🕌 Shariah Compliance Checker
- Screens Islamic finance contracts and products against 6 SBP-adopted AAOIFI standards
- Identifies Riba, Gharar, and structural violations with exact clause citations
- Provides corrected wording for every violation found
- Standards covered: No. 10 (Salam), 11 (Istisna'a), 20 (Commodity Sales), 25 (Combination of Contracts), 31 (Gharar Controls), 47 (Profit Rules)
---
 
## Demo
 
| Fraud Detection | Shariah Compliance |
|---|---|
| Real-time risk scoring (0-100) | Contract review with violation citations |
| 9 Pakistan-specific fraud rules | 6 SBP-adopted AAOIFI standards |
| One-click SAR generation | Riba & Gharar detection |
| PDF + web SAR export | Suggested fixes for every violation |
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| AI Agent | LangGraph + LangChain (ReAct) |
| AI Model | Anthropic Claude / OpenRouter |
| Styling | Tailwind CSS |
| Deployment | Vercel |
 
---
 
## Fraud Rules Engine
 
9 deterministic Pakistan-specific rules that run before the AI (zero API cost):
 
| Rule | Trigger |
|---|---|
| `VELOCITY` | 5+ transactions in 10 minutes |
| `GEO_ANOMALY` | Different city within 3 hours |
| `NEW_PAYEE_LARGE` | Raast transfer >PKR 50,000 to first-time payee |
| `SIM_SWAP_RISK` | New device ID + large mobile transaction |
| `ROUND_AMOUNT` | Round figures ≥ PKR 100,000 |
| `LATE_ATM` | ATM withdrawal midnight–5am above PKR 25,000 |
| `JAZZCASH_RAPID` | 3+ JazzCash transactions in 30 minutes |
| `OFF_HOURS_LARGE` | Any transfer >PKR 50,000 between midnight–5am |
| `RAAST_OFF_HOURS` | Any Raast transfer at night above PKR 10,000 |
 
---
 
## Shariah Standards
 
Knowledge base sourced directly from SBP circulars (adopted AAOIFI standards):
 
- **Standard 10** — Salam and Parallel Salam
- **Standard 11** — Istisna'a and Parallel Istisna'a
- **Standard 20** — Sale of Commodities in Organized Markets
- **Standard 25** — Combination of Contracts (Bay al-Inah, Riba stratagem detection)
- **Standard 31** — Controls on Gharar in Financial Transactions
- **Standard 47** — Rules for Calculating Profit in Financial Transactions
---
 
## Project Structure
 
```
finshield-pk/
├── app/
│   ├── api/
│   │   ├── transactions/route.ts   # Fraud detection webhook
│   │   ├── sar/route.ts            # SAR generation + PDF/web export
│   │   ├── shariah/route.ts        # Shariah compliance API
│   │   └── health/route.ts         # Connection health check
│   ├── dashboard/
│   │   ├── page.tsx                # Main dashboard (fraud + shariah tabs)
│   │   └── shariah-tab.tsx         # Shariah compliance UI
│   ├── login/page.tsx              # Auth page
│   └── auth/callback/route.ts      # Supabase auth callback
├── lib/
│   ├── fraud-agent.ts              # LangGraph ReAct fraud agent
│   ├── rules-engine.ts             # 9 Pakistan-specific fraud rules
│   ├── sar-generator.ts            # SBP-format SAR generation
│   ├── shariah-agent.ts            # AAOIFI Shariah compliance agent
│   └── supabase.ts                 # Database client + functions
├── types/
│   └── index.ts                    # TypeScript interfaces
└── middleware.ts                   # Route protection
```
 
---
 
## Database Schema
 
```sql
transactions      -- Incoming bank transaction webhooks
fraud_analysis    -- AI risk scores, flags, recommendations
sar_reports       -- Generated SAR drafts with audit trail
shariah_reviews   -- Shariah contract/product analysis history
```
 
---
 
## Getting Started
 
### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenRouter API key (free) or Anthropic API key
### Installation
 
```bash
git clone https://github.com/abdullahndeem7/finshieldpk.git
cd finshieldpk
npm install
```
 
### Environment Variables
 
Create a `.env.local` file in the root:
 
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=your-random-secret-string
```
 
### Supabase Setup
 
Run these in your Supabase SQL Editor:
 
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id TEXT UNIQUE, bank_code TEXT, amount_pkr NUMERIC,
  sender_iban TEXT, receiver_iban TEXT, channel TEXT,
  location_city TEXT, device_id TEXT, timestamp TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now()
);
 
CREATE TABLE fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id TEXT, risk_score INTEGER, risk_level TEXT,
  flags TEXT[], recommendation TEXT, explanation TEXT,
  sar_required BOOLEAN, created_at TIMESTAMPTZ DEFAULT now()
);
 
CREATE TABLE sar_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id TEXT, draft_text TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
 
CREATE TABLE shariah_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL, input_text TEXT, contract_type TEXT,
  overall_verdict TEXT NOT NULL, compliance_score INTEGER,
  issues_count INTEGER DEFAULT 0, result_json TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
 
### Run
 
```bash
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000)
 
---
 
## Testing
 
**Test fraud detection** (send a high-risk transaction):
 
```bash
curl -X POST http://localhost:3000/api/transactions \
-H "Content-Type: application/json" \
-d '{
  "txn_id": "TEST-001",
  "bank_code": "HBL",
  "amount_pkr": 285000,
  "sender_iban": "PK36HBL0000001234567890",
  "receiver_iban": "PK29UBL0009876543210123",
  "channel": "RAAST",
  "location_city": "Karachi",
  "timestamp": "2026-04-24T02:14:00Z"
}'
```
 
**Test Shariah compliance** — paste this into the Shariah tab:
```
This Murabaha Home Finance Agreement is entered between Meezan Bank and the Customer.
The Bank shall purchase the property and sell to Customer at cost plus profit margin
of 18% per annum. In case of late payment, a penalty of 2% per month will be charged
to Bank revenue. The profit rate may be revised upward if SBP policy rate increases.
```
Expected: 3 violations found — Riba (late payment penalty), Riba (variable profit rate), Gharar (unspecified property).
 
---
 
## Health Check
 
Visit `/api/health` to verify all connections:
 
```json
{
  "openrouter": "✅ connected",
  "supabase": "✅ connected",
  "env_openrouter": "✅ set",
  "env_supabase": "✅ set"
}
```
 
---
 
## Target Market
 
Built for Pakistani Islamic Banking Institutions (IBIs) facing:
- **SBP 2027 Shariah compliance mandate** — all banks must fully comply
- **Rising digital fraud** — SIM swap, Raast abuse, JazzCash agent fraud
- **Manual SAR burden** — compliance teams spending 2-3 hours per report
Primary targets: Meezan Bank, Khushhali Microfinance Bank, FINCA Pakistan, Bank Alfalah Islamic, Faysal Bank
 
---
 
## Roadmap
 
- [x] Real-time fraud detection webhook
- [x] 9-rule Pakistan-specific rules engine
- [x] LangGraph AI fraud agent
- [x] SBP-format SAR auto-generation
- [x] PDF + web SAR export
- [x] Shariah compliance checker (6 AAOIFI standards)
- [x] Supabase Auth login system
- [x] Vercel deployment
- [ ] BullMQ async transaction queue
- [ ] Mark as Reviewed workflow
- [ ] SBP Regulatory Sandbox application
- [ ] Multi-bank tenant support
---
 
## Built By
 
**Abdullah** — Founder, FinShield PK  
Pakistan | April 2026
 
---
 
## License
 
Private — All rights reserved. Not open for redistribution.
