import { NextResponse } from 'next/server'
// import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: Record<string, string> = {}

  // Test 1: OpenAI API
  try {
    const client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      })
    await client.models.list()
    results.openrouter = '✅ connected'
  } catch (e: any) {
    results.openrouter = `❌ ${e.message}`
  }

  // Test 2: Supabase
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await sb.from('transactions').select('id').limit(1)
    results.supabase = error ? `❌ ${error.message}` : '✅ connected'
  } catch (e: any) {
    results.supabase = `❌ ${e.message}`
  }

  // Test 3: Env vars present
  results.env_openrouter = process.env.OPENROUTER_API_KEY ? '✅ set' : '❌ missing'
  results.env_supabase  = process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ missing'

  return NextResponse.json(results)
}