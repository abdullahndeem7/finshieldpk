import { NextRequest, NextResponse }  from 'next/server'
import { supabase }                   from '@/lib/supabase'
import { generateSAR }                from '@/lib/sar-generator'
import { getTransaction }             from '../../../lib/transaction-storage'

// POST — generate a new SAR draft
export async function POST(req: NextRequest) {
  try {
    const { txn_id } = await req.json()

    if (!txn_id) {
      return NextResponse.json({ error: 'txn_id required' }, { status: 400 })
    }

    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('txn_id', txn_id)
      .single()

    const transaction = txnError || !txn ? getTransaction(txn_id) : txn
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('fraud_analysis')
      .select('*')
      .eq('txn_id', txn_id)
      .single()

    const effectiveAnalysis = analysis && !analysisError ? analysis : {
      risk_score: (transaction as any)?.risk_score ?? 0,
      risk_level: (transaction as any)?.risk_level ?? 'Unknown',
      flags: (transaction as any)?.reasons ?? [],
      explanation: (transaction as any)?.reasons
        ? `Generated from local risk assessment: ${(transaction as any).reasons.join(', ')}`
        : 'Generated from transaction data because no fraud_analysis record was found.',
    }

    const sarText = await generateSAR(transaction, effectiveAnalysis)
    return NextResponse.json({ sar: sarText, txn_id }, { status: 200 })

  } catch (error: any) {
    console.error('SAR generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate SAR', message: error.message },
      { status: 500 }
    )
  }
}

// GET — retrieve an existing SAR + support ?format=pdf or ?format=html
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const txn_id = searchParams.get('txn_id')
    const format = searchParams.get('format') || 'text'

    if (!txn_id) {
      return NextResponse.json({ error: 'txn_id required' }, { status: 400 })
    }

    const { data: sar, error } = await supabase
      .from('sar_reports')
      .select('*')
      .eq('txn_id', txn_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !sar) {
      return NextResponse.json({ error: 'SAR not found' }, { status: 404 })
    }

    // Return as HTML web page
    if (format === 'html') {
      const html = sarToHTML(sar.draft_text, txn_id)
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Return as plain text for PDF printing
    if (format === 'pdf') {
      const html = sarToPrintHTML(sar.draft_text, txn_id)
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return NextResponse.json({ sar: sar.draft_text, txn_id }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function sarToHTML(text: string, txnId: string): string {
  const lines = text.split('\n')
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SAR — ${txnId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; color: #111827; }
    .container { max-width: 820px; margin: 32px auto; background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #1e3a5f; color: white; padding: 24px 32px; }
    .header h1 { font-size: 20px; font-weight: 700; letter-spacing: .05em; }
    .header p { font-size: 12px; color: #93c5fd; margin-top: 4px; }
    .body { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: .1em; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; }
    .field-row { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .field-label { color: #6b7280; width: 180px; flex-shrink: 0; }
    .field-value { color: #111827; font-weight: 500; }
    .risk-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .risk-high { background: #fee2e2; color: #dc2626; }
    .risk-medium { background: #fef3c7; color: #d97706; }
    .risk-critical { background: #dc2626; color: white; }
    .narrative { font-size: 13px; color: #374151; line-height: 1.7; padding: 12px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #1e3a5f; }
    .signature-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-top: 8px; font-size: 13px; color: #374151; line-height: 2; }
    .disclaimer { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 24px; }
    .actions { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; }
    .btn { padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
    .btn-print { background: #1e3a5f; color: white; }
    .btn-pdf { background: #dc2626; color: white; }
    @media print { .actions { display: none; } }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>SUSPICIOUS ACTIVITY REPORT (SAR)</h1>
    <p>FinShield PK — AI Compliance Platform &nbsp;|&nbsp; For FMU Submission</p>
  </div>
  <div class="body" id="sar-content">
`

  // Parse sections from the SAR text
  const sections = parseSARSections(text)

  // Section 1: Report Info
  html += `<div class="section">
    <div class="section-title">Report Information</div>
    <div class="field-row"><span class="field-label">Report Reference</span><span class="field-value">${sections.reportRef}</span></div>
    <div class="field-row"><span class="field-label">Date of Report</span><span class="field-value">${sections.reportDate}</span></div>
    <div class="field-row"><span class="field-label">Submitted To</span><span class="field-value">Financial Monitoring Unit (FMU), State Bank of Pakistan</span></div>
  </div>`

  // Section 2: Transaction Details
  html += `<div class="section">
    <div class="section-title">Transaction Details</div>
    ${sections.txnDetails}
  </div>`

  // Section 3: Description
  html += `<div class="section">
    <div class="section-title">Suspicious Activity Description</div>
    <div class="narrative">${sections.description}</div>
  </div>`

  // Section 4: Basis
  html += `<div class="section">
    <div class="section-title">Basis for Suspicion</div>
    <div class="narrative">${sections.basis}</div>
  </div>`

  // Section 5: Action
  html += `<div class="section">
    <div class="section-title">Action Taken / Recommended</div>
    <div class="narrative">${sections.action}</div>
  </div>`

  // Section 6: Signature
  html += `<div class="section">
    <div class="section-title">Reporting Officer Declaration</div>
    <div class="signature-box">
      Name: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
      Designation: Compliance Officer<br>
      Bank: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
      Signature: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
      Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
    <div class="disclaimer" style="margin-top:12px;">
      ⚠️ This SAR draft was generated by FinShield PK AI and must be reviewed and approved by a qualified compliance officer before submission to the SBP Financial Monitoring Unit.
    </div>
  </div>`

  html += `</div><!-- body -->
  <div class="actions">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print SAR</button>
    <button class="btn btn-pdf" onclick="printPDF()">📄 Save as PDF</button>
  </div>
</div>
<script>
function printPDF() {
  window.print();
}
</script>
</body></html>`

  return html
}

function sarToPrintHTML(text: string, txnId: string): string {
  // Print-optimized version — clean, no buttons, auto-triggers print
  return sarToHTML(text, txnId).replace(
    '<div class="actions">',
    '<div class="actions" style="display:none">'
  ) + '<script>window.onload = function() { window.print(); }</script>'
}

function parseSARSections(text: string) {
  // Extract key info from the structured SAR text
  const reportRefMatch  = text.match(/REPORT REFERENCE:\s*(.+)/i)
  const reportDateMatch = text.match(/DATE OF REPORT:\s*(.+)/i)

  // Build txn details HTML from the Transaction Details section
  const txnSection = extractBetween(text, 'SECTION 2 — TRANSACTION DETAILS', 'SECTION 3')
  const txnLines = txnSection.split('\n').filter(l => l.includes(':') && !l.includes('━'))
  const txnDetailsHTML = txnLines.map(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return ''
    const label = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (!label || !value) return ''
    const isRisk = label.toLowerCase().includes('risk level')
    const riskClass = value.toLowerCase().includes('critical') ? 'risk-critical' :
                      value.toLowerCase().includes('high') ? 'risk-high' : 'risk-medium'
    return `<div class="field-row">
      <span class="field-label">${label}</span>
      <span class="field-value">${isRisk ? `<span class="risk-badge ${riskClass}">${value}</span>` : value}</span>
    </div>`
  }).join('')

  return {
    reportRef:   reportRefMatch?.[1]?.trim() || 'N/A',
    reportDate:  reportDateMatch?.[1]?.trim() || new Date().toLocaleDateString(),
    txnDetails:  txnDetailsHTML,
    description: extractBetween(text, 'SECTION 3 — SUSPICIOUS ACTIVITY DESCRIPTION', 'SECTION 4').replace(/━+/g,'').trim(),
    basis:       extractBetween(text, 'SECTION 4 — BASIS FOR SUSPICION', 'SECTION 5').replace(/━+/g,'').trim(),
    action:      extractBetween(text, 'SECTION 5 — ACTION TAKEN / RECOMMENDED', 'SECTION 6').replace(/━+/g,'').trim(),
  }
}

function extractBetween(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start)
  if (startIdx === -1) return ''
  const afterStart = text.slice(startIdx + start.length)
  const endIdx = afterStart.indexOf(end)
  return endIdx === -1 ? afterStart.trim() : afterStart.slice(0, endIdx).trim()
}
 
// // POST — generate a new SAR draft
// export async function POST(req: NextRequest) {
//   try {
//     const { txn_id } = await req.json()
 
//     if (!txn_id) {
//       return NextResponse.json({ error: 'txn_id required' }, { status: 400 })
//     }
 
//     const { data: txn, error: txnError } = await supabase
//       .from('transactions')
//       .select('*')
//       .eq('txn_id', txn_id)
//       .single()
 
//     if (txnError || !txn) {
//       return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
//     }
 
//     const { data: analysis, error: analysisError } = await supabase
//       .from('fraud_analysis')
//       .select('*')
//       .eq('txn_id', txn_id)
//       .single()
 
//     if (analysisError || !analysis) {
//       return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
//     }
 
//     const sarText = await generateSAR(txn, analysis)
//     return NextResponse.json({ sar: sarText, txn_id }, { status: 200 })
 
//   } catch (error: any) {
//     console.error('SAR generation error:', error)
//     return NextResponse.json(
//       { error: 'Failed to generate SAR', message: error.message },
//       { status: 500 }
//     )
//   }
// }
 
// // GET — retrieve an existing SAR + support ?format=pdf or ?format=html
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const txn_id = searchParams.get('txn_id')
//     const format = searchParams.get('format') || 'text'
 
//     if (!txn_id) {
//       return NextResponse.json({ error: 'txn_id required' }, { status: 400 })
//     }
 
//     const { data: sar, error } = await supabase
//       .from('sar_reports')
//       .select('*')
//       .eq('txn_id', txn_id)
//       .order('created_at', { ascending: false })
//       .limit(1)
//       .single()
 
//     if (error || !sar) {
//       return NextResponse.json({ error: 'SAR not found' }, { status: 404 })
//     }
 
//     // Return as HTML web page
//     if (format === 'html') {
//       const html = sarToHTML(sar.draft_text, txn_id)
//       return new NextResponse(html, {
//         headers: { 'Content-Type': 'text/html' }
//       })
//     }
 
//     // Return as plain text for PDF printing
//     if (format === 'pdf') {
//       const html = sarToPrintHTML(sar.draft_text, txn_id)
//       return new NextResponse(html, {
//         headers: { 'Content-Type': 'text/html' }
//       })
//     }
 
//     return NextResponse.json({ sar: sar.draft_text, txn_id }, { status: 200 })
 
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }
 
// function sarToHTML(text: string, txnId: string): string {
//   const lines = text.split('\n')
//   let html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <title>SAR — ${txnId}</title>
//   <style>
//     * { box-sizing: border-box; margin: 0; padding: 0; }
//     body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; color: #111827; }
//     .container { max-width: 820px; margin: 32px auto; background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); overflow: hidden; }
//     .header { background: #1e3a5f; color: white; padding: 24px 32px; }
//     .header h1 { font-size: 20px; font-weight: 700; letter-spacing: .05em; }
//     .header p { font-size: 12px; color: #93c5fd; margin-top: 4px; }
//     .body { padding: 32px; }
//     .section { margin-bottom: 28px; }
//     .section-title { font-size: 11px; font-weight: 700; letter-spacing: .1em; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; }
//     .field-row { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
//     .field-label { color: #6b7280; width: 180px; flex-shrink: 0; }
//     .field-value { color: #111827; font-weight: 500; }
//     .risk-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
//     .risk-high { background: #fee2e2; color: #dc2626; }
//     .risk-medium { background: #fef3c7; color: #d97706; }
//     .risk-critical { background: #dc2626; color: white; }
//     .narrative { font-size: 13px; color: #374151; line-height: 1.7; padding: 12px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #1e3a5f; }
//     .signature-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-top: 8px; font-size: 13px; color: #374151; line-height: 2; }
//     .disclaimer { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 24px; }
//     .actions { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; }
//     .btn { padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
//     .btn-print { background: #1e3a5f; color: white; }
//     .btn-pdf { background: #dc2626; color: white; }
//     @media print { .actions { display: none; } }
//   </style>
// </head>
// <body>
// <div class="container">
//   <div class="header">
//     <h1>SUSPICIOUS ACTIVITY REPORT (SAR)</h1>
//     <p>FinShield PK — AI Compliance Platform &nbsp;|&nbsp; For FMU Submission</p>
//   </div>
//   <div class="body" id="sar-content">
// `
 
//   // Parse sections from the SAR text
//   const sections = parseSARSections(text)
 
//   // Section 1: Report Info
//   html += `<div class="section">
//     <div class="section-title">Report Information</div>
//     <div class="field-row"><span class="field-label">Report Reference</span><span class="field-value">${sections.reportRef}</span></div>
//     <div class="field-row"><span class="field-label">Date of Report</span><span class="field-value">${sections.reportDate}</span></div>
//     <div class="field-row"><span class="field-label">Submitted To</span><span class="field-value">Financial Monitoring Unit (FMU), State Bank of Pakistan</span></div>
//   </div>`
 
//   // Section 2: Transaction Details
//   html += `<div class="section">
//     <div class="section-title">Transaction Details</div>
//     ${sections.txnDetails}
//   </div>`
 
//   // Section 3: Description
//   html += `<div class="section">
//     <div class="section-title">Suspicious Activity Description</div>
//     <div class="narrative">${sections.description}</div>
//   </div>`
 
//   // Section 4: Basis
//   html += `<div class="section">
//     <div class="section-title">Basis for Suspicion</div>
//     <div class="narrative">${sections.basis}</div>
//   </div>`
 
//   // Section 5: Action
//   html += `<div class="section">
//     <div class="section-title">Action Taken / Recommended</div>
//     <div class="narrative">${sections.action}</div>
//   </div>`
 
//   // Section 6: Signature
//   html += `<div class="section">
//     <div class="section-title">Reporting Officer Declaration</div>
//     <div class="signature-box">
//       Name: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
//       Designation: Compliance Officer<br>
//       Bank: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
//       Signature: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
//       Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
//     </div>
//     <div class="disclaimer" style="margin-top:12px;">
//       ⚠️ This SAR draft was generated by FinShield PK AI and must be reviewed and approved by a qualified compliance officer before submission to the SBP Financial Monitoring Unit.
//     </div>
//   </div>`
 
//   html += `</div><!-- body -->
//   <div class="actions">
//     <button class="btn btn-print" onclick="window.print()">🖨️ Print SAR</button>
//     <button class="btn btn-pdf" onclick="printPDF()">📄 Save as PDF</button>
//   </div>
// </div>
// <script>
// function printPDF() {
//   window.print();
// }
// </script>
// </body></html>`
 
//   return html
// }
 
// function sarToPrintHTML(text: string, txnId: string): string {
//   // Print-optimized version — clean, no buttons, auto-triggers print
//   return sarToHTML(text, txnId).replace(
//     '<div class="actions">',
//     '<div class="actions" style="display:none">'
//   ) + '<script>window.onload = function() { window.print(); }</script>'
// }
 
// function parseSARSections(text: string) {
//   // Extract key info from the structured SAR text
//   const reportRefMatch  = text.match(/REPORT REFERENCE:\s*(.+)/i)
//   const reportDateMatch = text.match(/DATE OF REPORT:\s*(.+)/i)
 
//   // Build txn details HTML from the Transaction Details section
//   const txnSection = extractBetween(text, 'SECTION 2 — TRANSACTION DETAILS', 'SECTION 3')
//   const txnLines = txnSection.split('\n').filter(l => l.includes(':') && !l.includes('━'))
//   const txnDetailsHTML = txnLines.map(line => {
//     const colonIdx = line.indexOf(':')
//     if (colonIdx === -1) return ''
//     const label = line.slice(0, colonIdx).trim()
//     const value = line.slice(colonIdx + 1).trim()
//     if (!label || !value) return ''
//     const isRisk = label.toLowerCase().includes('risk level')
//     const riskClass = value.toLowerCase().includes('critical') ? 'risk-critical' :
//                       value.toLowerCase().includes('high') ? 'risk-high' : 'risk-medium'
//     return `<div class="field-row">
//       <span class="field-label">${label}</span>
//       <span class="field-value">${isRisk ? `<span class="risk-badge ${riskClass}">${value}</span>` : value}</span>
//     </div>`
//   }).join('')
 
//   return {
//     reportRef:   reportRefMatch?.[1]?.trim() || 'N/A',
//     reportDate:  reportDateMatch?.[1]?.trim() || new Date().toLocaleDateString(),
//     txnDetails:  txnDetailsHTML,
//     description: extractBetween(text, 'SECTION 3 — SUSPICIOUS ACTIVITY DESCRIPTION', 'SECTION 4').replace(/━+/g,'').trim(),
//     basis:       extractBetween(text, 'SECTION 4 — BASIS FOR SUSPICION', 'SECTION 5').replace(/━+/g,'').trim(),
//     action:      extractBetween(text, 'SECTION 5 — ACTION TAKEN / RECOMMENDED', 'SECTION 6').replace(/━+/g,'').trim(),
//   }
// }
 
// function extractBetween(text: string, start: string, end: string): string {
//   const startIdx = text.indexOf(start)
//   if (startIdx === -1) return ''
//   const afterStart = text.slice(startIdx + start.length)
//   const endIdx = afterStart.indexOf(end)
//   return endIdx === -1 ? afterStart.trim() : afterStart.slice(0, endIdx).trim()
// }
 