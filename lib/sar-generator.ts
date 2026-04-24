import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY
if (!apiKey) {
  throw new Error('Missing OpenRouter API key. Set OPENAI_API_KEY or OPENROUTER_API_KEY.')
}

const client = new OpenAI({
  apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

export async function generateSAR(sarPrompt: string) {
  const response = await client.chat.completions.create({
    model: 'openrouter/auto',
    max_tokens: 1500,
    messages: [
      { role: 'system', content: 'You are a compliance officer...' },
      { role: 'user', content: sarPrompt },
    ],
  })

  return response.choices?.[0]?.message?.content ?? ''
}

// lib/sar-generator.ts
// Generates SBP-format Suspicious Activity Reports automatically
// Compliance officer reviews + approves — never auto-files

// import Anthropic from '@anthropic-ai/sdk'

// const client = new Anthropic()

// export async function generateSAR(
//   txn: Transaction,
//   analysis: FraudAnalysis,
//   accountInfo: AccountInfo
// ): Promise<string> {

//   const response = await client.messages.create({
//     model:'claude-sonnet-4-6',
//     max_tokens:1500,
//     system:`You are a compliance officer at a Pakistani bank.
// Write a Suspicious Activity Report (SAR) following SBP's
// Financial Monitoring Unit (FMU) reporting format.
// Be factual, specific, and professional. No speculation.
// Use formal Pakistani banking regulatory language.`,
//     messages: [{
//       role:'user',
//       content:`Generate a SAR for this flagged transaction.

// TRANSACTION DETAILS:
// - Reference No: ${txn.txn_id}
// - Date/Time: ${txn.timestamp}
// - Amount: PKR ${txn.amount_pkr.toLocaleString()}
// - Sender IBAN: ${txn.sender_iban}
// - Receiver IBAN: ${txn.receiver_iban}
// - Channel: ${txn.channel}
// - Location: ${txn.location_city}

// ACCOUNT HOLDER:
// - Name: ${accountInfo.name}
// - CNIC: ${accountInfo.cnic_masked}
// - Account Type: ${accountInfo.account_type}
// - Account Since: ${accountInfo.opened_date}

// AI ANALYSIS:
// - Risk Score: ${analysis.risk_score}/100
// - Risk Level: ${analysis.risk_level}
// - Flags: ${analysis.flags.join(', ')}
// - AI Assessment: ${analysis.explanation}

// Format the SAR with these sections:
// 1. Subject Information
// 2. Suspicious Activity Description
// 3. Transaction Details
// 4. Basis for Suspicion
// 5. Action Taken / Recommended
// 6. Reporting Officer Declaration (leave name/signature blank)`
//     }]
//   })

//   return response.content[0].text
// }

// // API route for SAR generation button in dashboard
// // app/api/sar/generate/route.ts
// export async function POST(req: NextRequest) {
//   const { txn_id } = await req.json()
//   const txn = await getTransaction(txn_id)
//   const analysis = await getAnalysis(txn_id)
//   const account = await getAccountInfo(txn.sender_iban)
//   const sar = await generateSAR(txn, analysis, account)
//   await logSARGeneration(txn_id, sar)  // audit trail
//   return NextResponse.json({ sar })
// }