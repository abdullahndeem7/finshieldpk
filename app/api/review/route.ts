import { NextRequest, NextResponse } from 'next/server'
import { supabase }                  from '@/lib/supabase'
 
export async function POST(req: NextRequest) {
  try {
    const { txn_id, action, reviewed_by, bank_id } = await req.json()
 
    // action must be one of: cleared, confirmed, escalated
    const validActions = ['cleared', 'confirmed', 'escalated']
    if (!txn_id || !action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'txn_id and valid action (cleared/confirmed/escalated) required' },
        { status: 400 }
      )
    }
 
    // Update fraud_analysis with review decision
    const { error: reviewError } = await supabase
      .from('fraud_analysis')
      .update({
        review_action: action,
        reviewed_by:   reviewed_by || 'compliance_officer',
        reviewed_at:   new Date().toISOString(),
      })
      .eq('txn_id', txn_id)
 
    if (reviewError) throw reviewError
 
    // Update transaction status
    const newStatus =
      action === 'cleared'   ? 'clear' :
      action === 'confirmed' ? 'blocked' :
      'flagged' // escalated stays flagged
 
    await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('txn_id', txn_id)
 
    // Write to audit log
    await supabase.from('audit_logs').insert({
      bank_id:     bank_id || 'default',
      user_email:  reviewed_by || 'compliance_officer',
      action:      `TRANSACTION_${action.toUpperCase()}`,
      entity_type: 'transaction',
      entity_id:   txn_id,
      details:     `Transaction ${txn_id} marked as ${action} by ${reviewed_by || 'compliance_officer'}`,
    })
 
    return NextResponse.json({
      success: true,
      txn_id,
      action,
      new_status: newStatus,
    }, { status: 200 })
 
  } catch (error: any) {
    console.error('Review error:', error)
    return NextResponse.json(
      { error: 'Review failed', message: error.message },
      { status: 500 }
    )
  }
}
 