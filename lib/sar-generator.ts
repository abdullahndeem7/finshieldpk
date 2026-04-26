// export async function generateSAR(sarPrompt: string) {
//   const openRouterKey = process.env.OPENROUTER_API_KEY
//   const openAiKey = process.env.OPENAI_API_KEY

//   if (!openRouterKey && !openAiKey) {
//     throw new Error('Missing API key. Set OPENROUTER_API_KEY or OPENAI_API_KEY.')
//   }

//   // Use OpenRouter (preferred for cost)
//   if (openRouterKey) {
//     const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${openRouterKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'mistralai/mistral-7b-instruct-v0.1',
//         max_tokens: 1500,
//         messages: [
//           { role: 'system', content: 'You are a compliance officer at a Pakistani bank. Generate professional SAR reports in formal banking language following SBP guidelines.' },
//           { role: 'user', content: sarPrompt },
//         ],
//       }),
//     })

//     if (!response.ok) {
//       const errorText = await response.text()
//       throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
//     }

//     const data = await response.json()
//     return data.choices?.[0]?.message?.content ?? ''
//   }

//   // Fallback to OpenAI
//   throw new Error('OpenAI integration not yet implemented. Please use OPENROUTER_API_KEY.')
// }

// // lib/sar-generator.ts
// // Generates SBP-format Suspicious Activity Reports automatically
// // Compliance officer reviews + approves — never auto-files

// // import Anthropic from '@anthropic-ai/sdk'

// // const client = new Anthropic()

// // export async function generateSAR(
// //   txn: Transaction,
// //   analysis: FraudAnalysis,
// //   accountInfo: AccountInfo
// // ): Promise<string> {

// //   const response = await client.messages.create({
// //     model:'claude-sonnet-4-6',
// //     max_tokens:1500,
// //     system:`You are a compliance officer at a Pakistani bank.
// // Write a Suspicious Activity Report (SAR) following SBP's
// // Financial Monitoring Unit (FMU) reporting format.
// // Be factual, specific, and professional. No speculation.
// // Use formal Pakistani banking regulatory language.`,
// //     messages: [{
// //       role:'user',
// //       content:`Generate a SAR for this flagged transaction.

// // TRANSACTION DETAILS:
// // - Reference No: ${txn.txn_id}
// // - Date/Time: ${txn.timestamp}
// // - Amount: PKR ${txn.amount_pkr.toLocaleString()}
// // - Sender IBAN: ${txn.sender_iban}
// // - Receiver IBAN: ${txn.receiver_iban}
// // - Channel: ${txn.channel}
// // - Location: ${txn.location_city}

// // ACCOUNT HOLDER:
// // - Name: ${accountInfo.name}
// // - CNIC: ${accountInfo.cnic_masked}
// // - Account Type: ${accountInfo.account_type}
// // - Account Since: ${accountInfo.opened_date}

// // AI ANALYSIS:
// // - Risk Score: ${analysis.risk_score}/100
// // - Risk Level: ${analysis.risk_level}
// // - Flags: ${analysis.flags.join(', ')}
// // - AI Assessment: ${analysis.explanation}

// // Format the SAR with these sections:
// // 1. Subject Information
// // 2. Suspicious Activity Description
// // 3. Transaction Details
// // 4. Basis for Suspicion
// // 5. Action Taken / Recommended
// // 6. Reporting Officer Declaration (leave name/signature blank)`
// //     }]
// //   })

// //   return response.content[0].text
// // }

// // // API route for SAR generation button in dashboard
// // // app/api/sar/generate/route.ts
// // export async function POST(req: NextRequest) {
// //   const { txn_id } = await req.json()
// //   const txn = await getTransaction(txn_id)
// //   const analysis = await getAnalysis(txn_id)
// //   const account = await getAccountInfo(txn.sender_iban)
// //   const sar = await generateSAR(txn, analysis, account)
// //   await logSARGeneration(txn_id, sar)  // audit trail
// //   return NextResponse.json({ sar })
// // }

import OpenAI from 'openai'
import { supabase } from './supabase'

type Transaction = {
  txn_id: string
  bank_code: string
  amount_pkr: number
  sender_iban: string
  receiver_iban: string
  channel: string
  location_city: string
  timestamp: string
  device_id?: string
}

type FraudAnalysis = {
  risk_score: number
  risk_level: string
  flags: string[]
  explanation: string
}
 
const openRouterKey = process.env.OPENROUTER_API_KEY
const client = openRouterKey
  ? new OpenAI({ apiKey: openRouterKey, baseURL: 'https://openrouter.ai/api/v1' })
  : null
 
// This is the STRICT SBP-format template the AI must follow every time
const SAR_TEMPLATE = `
SUSPICIOUS ACTIVITY REPORT (SAR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
REPORT REFERENCE: {{REPORT_REF}}
DATE OF REPORT: {{REPORT_DATE}}
SUBMITTED TO: Financial Monitoring Unit (FMU), State Bank of Pakistan
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — SUBJECT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
Account Holder (Sender): [To be completed by compliance officer]
CNIC: [To be completed by compliance officer]
Sender IBAN: {{SENDER_IBAN}}
Receiver IBAN: {{RECEIVER_IBAN}}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — TRANSACTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
Transaction Reference: {{TXN_ID}}
Date and Time: {{TXN_TIME}}
Amount: PKR {{AMOUNT}}
Channel: {{CHANNEL}}
Location: {{CITY}}
AI Risk Score: {{RISK_SCORE}} / 100
Risk Level: {{RISK_LEVEL}}
Flags Triggered: {{FLAGS}}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — SUSPICIOUS ACTIVITY DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
{{AI_DESCRIPTION}}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — BASIS FOR SUSPICION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
{{AI_BASIS}}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — ACTION TAKEN / RECOMMENDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
{{AI_ACTION}}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — REPORTING OFFICER DECLARATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
I declare that the information provided in this SAR is accurate to the
best of my knowledge and is being filed in accordance with the AML/CFT
regulations of the State Bank of Pakistan.
 
Name: ________________________________
Designation: Compliance Officer
Bank: ________________________________
Signature: ________________________________
Date: ________________________________
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: This SAR draft was generated by FinShield PK AI.
It must be reviewed and approved by a qualified compliance officer before submission to the SBP Financial Monitoring Unit.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
 
export async function generateSAR(
  txn: Transaction,
  analysis: FraudAnalysis
): Promise<string> {

  const amount = Number(txn.amount_pkr ?? 0)
  const flags = Array.isArray(analysis.flags) ? analysis.flags : []
  const explanation = analysis.explanation ?? 'No additional analysis provided.'
  const transactionTime = txn.timestamp ? new Date(txn.timestamp) : new Date()

  const reportRef  = `SAR-${txn.txn_id}-${new Date().getFullYear()}`
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  const riskLevel = analysis.risk_level ? analysis.risk_level.toUpperCase() : 'UNKNOWN'
  const flagsText = flags.length ? flags.join(', ') : 'None'

  const buildSarText = (description: string, basis: string, action: string) => {
    return SAR_TEMPLATE
      .replace('{{REPORT_REF}}',  reportRef)
      .replace('{{REPORT_DATE}}', reportDate)
      .replace('{{SENDER_IBAN}}', txn.sender_iban)
      .replace('{{RECEIVER_IBAN}}', txn.receiver_iban)
      .replace('{{TXN_ID}}',      txn.txn_id)
      .replace('{{TXN_TIME}}',    transactionTime.toLocaleString('en-GB'))
      .replace('{{AMOUNT}}',      amount.toLocaleString())
      .replace('{{CHANNEL}}',     txn.channel)
      .replace('{{CITY}}',        txn.location_city || 'Not recorded')
      .replace('{{RISK_SCORE}}',  String(analysis.risk_score ?? 0))
      .replace('{{RISK_LEVEL}}',  riskLevel)
      .replace('{{FLAGS}}',       flagsText)
      .replace('{{AI_DESCRIPTION}}', description)
      .replace('{{AI_BASIS}}',    basis)
      .replace('{{AI_ACTION}}',   action)
  }

  const fallbackDesc = `The transaction from ${txn.sender_iban} to ${txn.receiver_iban} on ${transactionTime.toLocaleString('en-GB')} is flagged as suspicious based on the score ${analysis.risk_score}.`
  const fallbackBasis = `This transaction triggered the bank's internal monitoring because of multiple risk indicators, including a risk score of ${analysis.risk_score} and flagged reasons: ${flagsText}.`
  const fallbackAction = `Recommend escalation to the compliance team, transaction review, and possible account monitoring until confirmation of legitimacy.`
  const fallbackSar = buildSarText(fallbackDesc, fallbackBasis, fallbackAction)

  const aiPrompt = `You are a compliance officer at a Pakistani commercial bank.
Write exactly 3 sections for a Suspicious Activity Report.
Be factual, formal, and specific. Use Pakistani banking/SBP terminology.

TRANSACTION:
- Reference: ${txn.txn_id}
- Amount: PKR ${amount.toLocaleString()}
- Channel: ${txn.channel}
- From: ${txn.sender_iban}
- To: ${txn.receiver_iban}
- City: ${txn.location_city || 'Not recorded'}
- Time: ${txn.timestamp}
- Risk Score: ${analysis.risk_score}/100
- Flags: ${flags.join(', ')}
- AI Assessment: ${explanation}

Write exactly these 3 sections and nothing else:
 
SECTION_3_DESCRIPTION:
[2-3 sentences describing what the suspicious activity is, factually]
 
SECTION_4_BASIS:
[2-3 sentences explaining WHY each flag triggered suspicion, citing the specific risk indicators]
 
SECTION_5_ACTION:
[2-3 sentences recommending specific actions: freeze, investigate, escalate, etc.]`

  if (!client) {
    await supabase.from('sar_reports').insert({
      txn_id:     txn.txn_id,
      draft_text: fallbackSar,
      status:     'draft',
    })
    return fallbackSar
  }

  try {
    const response = await client.chat.completions.create({
      model:      'meta-llama/llama-3.3-70b-instruct:free',
      max_tokens: 600,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You are a compliance officer. Return only the 3 sections requested, no preamble.' },
        { role: 'user', content: aiPrompt },
      ],
    })

    const aiContent = response.choices?.[0]?.message?.content || ''
    const desc   = extractSection(aiContent, 'SECTION_3_DESCRIPTION')
    const basis  = extractSection(aiContent, 'SECTION_4_BASIS')
    const action = extractSection(aiContent, 'SECTION_5_ACTION')

    const sarText = buildSarText(desc, basis, action)
    await supabase.from('sar_reports').insert({
      txn_id:     txn.txn_id,
      draft_text: sarText,
      status:     'draft',
    })

    return sarText
  } catch (error: any) {
    console.error('SAR AI generation failed:', error)
    await supabase.from('sar_reports').insert({
      txn_id:     txn.txn_id,
      draft_text: fallbackSar,
      status:     'draft',
    })
    return fallbackSar
  }
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(sectionName + ':?\\s*([\\s\\S]*?)(?=SECTION_\\d|$)', 'i')
  const match = text.match(regex)
  if (match && match[1]) return match[1].trim()
  // Fallback if AI doesn't follow format
  return 'Please complete this section manually based on the transaction details above.'
}