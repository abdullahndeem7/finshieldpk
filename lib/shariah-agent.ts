import OpenAI from 'openai'

const client = new OpenAI({
  apiKey:  process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Retry with exponential backoff for rate limits
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      const isRateLimit = status === 429
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
 
const SHARIAH_KNOWLEDGE = `
You are a Shariah compliance expert for Pakistani Islamic Banking Institutions.
You know the following SBP-adopted AAOIFI Shariah Standards:
 
STANDARD 10 — Salam:
- Capital must be paid immediately at contract conclusion (max 2-3 days delay)
- Tradable Salam Sukuk are NOT permitted
- Subject matter must be fungible and commonly available at delivery time
- Parallel Salam contracts must be fully independent
 
STANDARD 11 — Istisna'a:
- Price must be known at contract conclusion
- Price CANNOT be increased in lieu of extending payment period (Clause 4/1/3)
- Penalty clause on purchaser for delayed payment is NOT permitted
- Parallel Istisna'a contracts must be independent
 
STANDARD 20 — Commodity Sales:
- Futures contracts are NOT permitted in Shariah
- Commodity must be possessed before resale
- Forward contracts with both counter-values deferred are NOT permitted
 
STANDARD 25 — Combination of Contracts:
- PROHIBITED: combining loan with commutative contract
- PROHIBITED: Bay al-Inah (sell asset then buy back at different price)
- PROHIBITED: combining contradictory contracts on same asset
- Traditional hire-purchase is NOT permitted
- PERMITTED: Ijarah Muntahia Bittamleek, Murabaha to Purchase Orderer, Diminishing Musharakah
 
STANDARD 31 — Controls on Gharar:
- Excessive Gharar in exchange contracts invalidates the contract
- Selling goods not in seller ownership is invalid (except Salam and Istisna'a)
- Selling commodity before taking possession is IMPERMISSIBLE
- Lease for unspecified period is invalid
- Conventional insurance contains Gharar — only Takaful is permitted
 
STANDARD 47 — Rules for Calculating Profit:
- Profit must not use Riba-based methods
- Misleading profit calculation is PROHIBITED
- Profit rate increase in lieu of payment extension is PROHIBITED
 
KEY RIBA VIOLATIONS — always flag these:
- Late payment penalty going to institution (must go to charity)
- Price increase for extending payment period
- Fixed return regardless of business outcome
- Predetermined profit on loans
 
KEY GHARAR VIOLATIONS — always flag these:
- Subject matter not specified at contract conclusion
- Price not determined at contract conclusion
- Delivery period unknown
- Commodity not in seller possession
`
 
function detectType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('murabaha'))   return 'Murabaha'
  if (t.includes('ijarah') || t.includes('ijara')) return 'Ijarah'
  if (t.includes('musharakah')) return 'Musharakah'
  if (t.includes('mudarabah'))  return 'Mudarabah'
  if (t.includes('salam'))      return 'Salam'
  if (t.includes('istisna'))    return "Istisna'a"
  if (t.includes('sukuk'))      return 'Sukuk'
  if (t.includes('takaful'))    return 'Takaful'
  return 'Islamic Finance Contract'
}
 
export async function analyzeShariahCompliance(
  contractText: string,
  contractType?: string
): Promise<ShariahAnalysis> {
  const detectedType = contractType || detectType(contractText)
 
  const prompt = `${SHARIAH_KNOWLEDGE}
 
Analyze this ${detectedType} contract for Shariah compliance.
Check against ALL AAOIFI standards listed above.
 
CONTRACT TEXT:
${contractText.slice(0, 4000)}
 
Return ONLY this JSON — no other text before or after:
{
  "overall_verdict": "compliant",
  "compliance_score": 85,
  "contract_type": "${detectedType}",
  "issues": [
    {
      "severity": "critical",
      "type": "Riba",
      "clause_found": "exact text from contract",
      "standard_violated": "AAOIFI Standard 11, Clause 4/1/3",
      "explanation": "why this violates Shariah",
      "suggested_fix": "corrected wording"
    }
  ],
  "compliant_elements": ["list of compliant things"],
  "summary": "2-3 sentence plain English summary"
}`
 
  const response = await retryWithBackoff(() =>
    client.chat.completions.create({
      model:       'openrouter/auto',
      max_tokens:  2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
  )
 
  const raw = response.choices[0].message.content || ''
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return fallback(detectedType)
  } catch {
    return fallback(detectedType)
  }
}
 
export async function analyzeProduct(
  name: string,
  description: string
): Promise<ShariahAnalysis> {
  const prompt = `${SHARIAH_KNOWLEDGE}
 
Analyze this Islamic banking product for Shariah compliance.
 
Product Name: ${name}
Description: ${description}
 
Check for: hidden Riba, prohibited contract combinations (Standard 25),
excessive Gharar (Standard 31), profit rule violations (Standard 47).
 
Return ONLY this JSON — no other text:
{
  "overall_verdict": "compliant",
  "compliance_score": 70,
  "contract_type": "Product Structure",
  "issues": [
    {
      "severity": "critical",
      "type": "Riba",
      "clause_found": "problematic element",
      "standard_violated": "AAOIFI Standard number",
      "explanation": "why non-compliant",
      "suggested_fix": "how to fix"
    }
  ],
  "compliant_elements": ["compliant aspects"],
  "summary": "2-3 sentence summary"
}`
 
  const response = await retryWithBackoff(() =>
    client.chat.completions.create({
      model:       'openrouter/auto',
      max_tokens:  1500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
  )
 
  const raw = response.choices[0].message.content || ''
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return fallback('Product')
  } catch {
    return fallback('Product')
  }
}
 
function fallback(type: string): ShariahAnalysis {
  return {
    overall_verdict:    'needs_review',
    compliance_score:   50,
    contract_type:      type,
    issues:             [],
    compliant_elements: [],
    summary:            'Analysis inconclusive. Manual Shariah board review required.',
  }
}
 
export interface ShariahIssue {
  severity:          'critical' | 'major' | 'minor'
  type:              'Riba' | 'Gharar' | 'Structural' | 'Missing_Clause'
  clause_found:      string
  standard_violated: string
  explanation:       string
  suggested_fix:     string
}
 
export interface ShariahAnalysis {
  overall_verdict:    'compliant' | 'non_compliant' | 'needs_review'
  compliance_score:   number
  contract_type:      string
  issues:             ShariahIssue[]
  compliant_elements: string[]
  summary:            string
}
