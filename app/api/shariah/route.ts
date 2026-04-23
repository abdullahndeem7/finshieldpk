import { NextRequest, NextResponse }   from 'next/server'
import { analyzeShariahCompliance,
         analyzeProduct }              from '@/lib/shariah-agent'
import { supabase }                    from '@/lib/supabase'
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, contract_text, contract_type,
            product_name, product_description } = body
 
    // Mode 1: analyze a contract text
    if (mode === 'contract') {
      if (!contract_text) {
        return NextResponse.json(
          { error: 'contract_text is required' },
          { status: 400 }
        )
      }
      const analysis = await analyzeShariahCompliance(
        contract_text, contract_type
      )
      await supabase.from('shariah_reviews').insert({
        mode:             'contract',
        input_text:       contract_text.slice(0, 500),
        contract_type:    analysis.contract_type,
        overall_verdict:  analysis.overall_verdict,
        compliance_score: analysis.compliance_score,
        issues_count:     analysis.issues.length,
        result_json:      JSON.stringify(analysis),
      })
      return NextResponse.json({ analysis }, { status: 200 })
    }
 
    // Mode 2: analyze a product structure
    if (mode === 'product') {
      if (!product_name || !product_description) {
        return NextResponse.json(
          { error: 'product_name and product_description required' },
          { status: 400 }
        )
      }
      const analysis = await analyzeProduct(
        product_name, product_description
      )
      await supabase.from('shariah_reviews').insert({
        mode:             'product',
        input_text:       product_name,
        contract_type:    'Product Structure',
        overall_verdict:  analysis.overall_verdict,
        compliance_score: analysis.compliance_score,
        issues_count:     analysis.issues.length,
        result_json:      JSON.stringify(analysis),
      })
      return NextResponse.json({ analysis }, { status: 200 })
    }
 
    return NextResponse.json(
      { error: 'mode must be contract or product' },
      { status: 400 }
    )
 
  } catch (error: any) {
    console.error('Shariah error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', message: error.message },
      { status: 500 }
    )
  }
}
 
export async function GET() {
  return NextResponse.json({
    status:  'ok',
    message: 'Shariah compliance agent is running',
  })
}
