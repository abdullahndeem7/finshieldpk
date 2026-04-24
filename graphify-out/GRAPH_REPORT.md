# Graph Report - .  (2026-04-24)

## Corpus Check
- 71 files · ~14,815 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 55 nodes · 52 edges · 19 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes|API Routes]]
- [[_COMMUNITY_Shariah Compliance UI|Shariah Compliance UI]]
- [[_COMMUNITY_Shariah Analysis Engine|Shariah Analysis Engine]]
- [[_COMMUNITY_Fraud Detection Dashboard|Fraud Detection Dashboard]]
- [[_COMMUNITY_Database & Auth Middleware|Database & Auth Middleware]]
- [[_COMMUNITY_Risk Assessment & Storage|Risk Assessment & Storage]]
- [[_COMMUNITY_App Layout|App Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Authentication Page|Authentication Page]]
- [[_COMMUNITY_SAR Report Generator|SAR Report Generator]]
- [[_COMMUNITY_Code Linting Config|Code Linting Config]]
- [[_COMMUNITY_TypeScript Environment Types|TypeScript Environment Types]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_CSS Processing Config|CSS Processing Config]]
- [[_COMMUNITY_SAR API Endpoint|SAR API Endpoint]]
- [[_COMMUNITY_Fraud Detection Agent|Fraud Detection Agent]]
- [[_COMMUNITY_Business Rules Engine|Business Rules Engine]]
- [[_COMMUNITY_Type Definitions|Type Definitions]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 9 edges
2. `GET()` - 7 edges
3. `analyzeShariahCompliance()` - 5 edges
4. `analyzeProduct()` - 4 edges
5. `createSupabaseServerClient()` - 4 edges
6. `DELETE()` - 3 edges
7. `retryWithBackoff()` - 3 edges
8. `fallback()` - 3 edges
9. `addTransaction()` - 3 edges
10. `middleware()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `listTransactions()`  [INFERRED]
  app\auth\callback\route.ts → lib\transactions-store.ts
- `GET()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app\auth\callback\route.ts → lib\supabase.ts
- `POST()` --calls--> `analyzeShariahCompliance()`  [INFERRED]
  app\auth\logout\route.ts → lib\shariah-agent.ts
- `POST()` --calls--> `analyzeProduct()`  [INFERRED]
  app\auth\logout\route.ts → lib\shariah-agent.ts
- `POST()` --calls--> `addTransaction()`  [INFERRED]
  app\auth\logout\route.ts → lib\transactions-store.ts

## Communities

### Community 0 - "API Routes"
Cohesion: 0.29
Nodes (5): DELETE(), GET(), isValidPayload(), POST(), deleteTransaction()

### Community 1 - "Shariah Compliance UI"
Cohesion: 0.33
Nodes (0): 

### Community 2 - "Shariah Analysis Engine"
Cohesion: 0.67
Nodes (5): analyzeProduct(), analyzeShariahCompliance(), detectType(), fallback(), retryWithBackoff()

### Community 3 - "Fraud Detection Dashboard"
Cohesion: 0.4
Nodes (0): 

### Community 4 - "Database & Auth Middleware"
Cohesion: 0.4
Nodes (2): middleware(), createSupabaseServerClient()

### Community 5 - "Risk Assessment & Storage"
Cohesion: 0.4
Nodes (3): assessRisk(), addTransaction(), listTransactions()

### Community 6 - "App Layout"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Authentication Page"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "SAR Report Generator"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Code Linting Config"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "TypeScript Environment Types"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Next.js Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "CSS Processing Config"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "SAR API Endpoint"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Fraud Detection Agent"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Business Rules Engine"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Type Definitions"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `App Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Page`** (2 nodes): `page.tsx`, `DashboardPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Authentication Page`** (2 nodes): `page.tsx`, `LoginPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SAR Report Generator`** (2 nodes): `sar-generator.ts`, `generateSAR()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Code Linting Config`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TypeScript Environment Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Configuration`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CSS Processing Config`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SAR API Endpoint`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Fraud Detection Agent`** (1 nodes): `fraud-agent.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Business Rules Engine`** (1 nodes): `rules-engine.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Definitions`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `API Routes` to `Shariah Analysis Engine`, `Database & Auth Middleware`, `Risk Assessment & Storage`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `createSupabaseServerClient()` connect `Database & Auth Middleware` to `API Routes`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `GET()` connect `API Routes` to `Database & Auth Middleware`, `Risk Assessment & Storage`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `POST()` (e.g. with `analyzeShariahCompliance()` and `analyzeProduct()`) actually correct?**
  _`POST()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `GET()` (e.g. with `listTransactions()` and `createSupabaseServerClient()`) actually correct?**
  _`GET()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `createSupabaseServerClient()` (e.g. with `middleware()` and `GET()`) actually correct?**
  _`createSupabaseServerClient()` has 3 INFERRED edges - model-reasoned connections that need verification._