'use client'
 
import { useState } from 'react'
import type { ShariahAnalysis } from '@/lib/shariah-agent'
 
export default function ShariahTab() {
  const [mode,         setMode]         = useState<'contract' | 'product'>('contract')
  const [contractText, setContractText] = useState('')
  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [analysis,     setAnalysis]     = useState<ShariahAnalysis | null>(null)
  const [error,        setError]        = useState('')
 
  async function runAnalysis() {
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const body = mode === 'contract'
        ? { mode: 'contract', contract_text: contractText }
        : { mode: 'product',  product_name: productName,
            product_description: productDesc }
      const res  = await fetch('/api/shariah', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
      else setError(data.error || 'Analysis failed')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
 
  const verdictColor = (v: string) =>
    v === 'compliant'     ? 'text-emerald-700' :
    v === 'non_compliant' ? 'text-rose-700' : 'text-amber-700'
 
  const verdictBgColor = (v: string) =>
    v === 'compliant'     ? 'border-emerald-200 bg-emerald-50' :
    v === 'non_compliant' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
 
  const severityColor = (s: string) =>
    s === 'critical' ? 'text-rose-700' :
    s === 'major'    ? 'text-orange-600' : 'text-amber-600'
 
  const severityBgColor = (s: string) =>
    s === 'critical' ? 'bg-rose-50 border-rose-200 border-l-rose-700' :
    s === 'major'    ? 'bg-orange-50 border-orange-200 border-l-orange-600' : 'bg-amber-50 border-amber-200 border-l-amber-600'
 
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Shariah Compliance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Compliance Checker
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Based on SBP-adopted AAOIFI Standards No. 10, 11, 20, 25, 31, 47
            </p>
          </div>
 
          {/* Contract / Product toggle */}
          <div className="flex gap-3 border-t border-slate-200 pt-4">
            {(['contract', 'product'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  mode === m
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m === 'contract' ? '📄 Contract Review' : '🏦 Product Review'}
              </button>
            ))}
          </div>
        </section>
 
        {/* Input area */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {mode === 'contract' ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Paste Contract Text
              </label>
              <textarea
                value={contractText}
                onChange={e => setContractText(e.target.value)}
                rows={8}
                placeholder="Paste the full contract text here — Murabaha, Ijarah, Musharakah, Salam, Istisna'a..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Product Name
              </label>
              <input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Home Finance Murabaha Product"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 mb-4 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Product Description
              </label>
              <textarea
                value={productDesc}
                onChange={e => setProductDesc(e.target.value)}
                rows={5}
                placeholder="Describe the product structure in detail..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          )}
        </section>
 
        {/* Analyze button */}
        <div className="mt-3">
          <button
            onClick={runAnalysis}
            disabled={loading || (mode === 'contract' ? !contractText.trim() : !productName.trim())}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '⏳ Analyzing...' : '✓ Run Shariah Analysis'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <section className="inline-flex w-fit rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <p className="text-sm text-rose-700">❌ {error}</p>
          </section>
        )}
 
        {/* Results */}
        {analysis && (
          <>
            {/* Verdict card */}
            <section className={`rounded-2xl border shadow-sm p-6 ${verdictBgColor(analysis.overall_verdict)}`}>
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Overall Verdict</p>
                  <p className={`text-2xl font-bold ${verdictColor(analysis.overall_verdict)}`}>
                    {analysis.overall_verdict === 'compliant'
                      ? '✅ Shariah Compliant'
                      : analysis.overall_verdict === 'non_compliant'
                      ? '❌ Non-Compliant'
                      : '⚠️ Needs Review'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Compliance Score</p>
                  <p className={`text-4xl font-bold ${verdictColor(analysis.overall_verdict)}`}>
                    {analysis.compliance_score}<span className="text-lg">/100</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700">
                {analysis.summary}
              </p>
            </section>
 
            {/* Issues */}
            {analysis.issues.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
                  Violations Found ({analysis.issues.length})
                </p>
                <div className="space-y-3">
                  {analysis.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border-l-4 p-4 ${severityBgColor(issue.severity)}`}
                    >
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          issue.severity === 'critical' ? 'bg-rose-200 text-rose-700' :
                          issue.severity === 'major' ? 'bg-orange-200 text-orange-700' :
                          'bg-amber-200 text-amber-700'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-200 text-slate-700">
                          {issue.type}
                        </span>
                        <span className="px-2.5 py-1 rounded text-xs text-slate-600">
                          {issue.standard_violated}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 mb-2">
                        <strong>Found: </strong>
                        "{issue.clause_found}"
                      </div>
                      <div className="text-sm text-slate-700 mb-2">
                        <strong>Issue: </strong>
                        {issue.explanation}
                      </div>
                      <div className="text-sm text-emerald-700">
                        <strong>Fix: </strong>{issue.suggested_fix}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
 
            {/* Compliant elements */}
            {analysis.compliant_elements.length > 0 && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
                  Compliant Elements
                </p>
                <div className="space-y-2">
                  {analysis.compliant_elements.map((el, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{el}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

 