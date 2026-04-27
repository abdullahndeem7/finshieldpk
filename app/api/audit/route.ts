import { NextRequest, NextResponse } from 'next/server'
import { supabase }                  from '@/lib/supabase'
 
// GET — fetch audit logs for a bank
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bank_id = searchParams.get('bank_id') || 'default'
    const limit   = parseInt(searchParams.get('limit') || '50')
 
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('bank_id', bank_id)
      .order('created_at', { ascending: false })
      .limit(limit)
 
    if (error) throw error
 
    return NextResponse.json({ logs: data || [] }, { status: 200 })
 
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
 
// POST — write a manual audit log entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bank_id, user_email, action, entity_type, entity_id, details } = body
 
    const { error } = await supabase.from('audit_logs').insert({
      bank_id:     bank_id || 'default',
      user_email:  user_email || 'system',
      action,
      entity_type,
      entity_id,
      details,
    })
 
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
 
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
 