"use client";

import { useEffect, useMemo, useState } from "react";

import type { StoredTransaction } from "../../lib/transactions-store";

import ShariahTab from './shariah-tab'

interface TxnWithAnalysis {
  txn_id:        string
  bank_code:     string
  amount_pkr:    number
  sender_iban:   string
  receiver_iban: string
  channel:       string
  location_city: string
  timestamp:     string
  status:        string
  fraud_analysis: {
    risk_score:   number
    risk_level:   string
    flags:        string[]
    explanation:  string
    sar_required: boolean
  } | null
}

type ApiResponse = {
  transactions: StoredTransaction[];
};

type TrendPoint = {
  x: number;
  y: number;
  riskScore: number;
  txnId: string;
};

export default function TransactionsDashboard() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<TrendPoint | null>(null);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fraud' | 'shariah'>('fraud');
  const [selected, setSelected] = useState<TxnWithAnalysis | null>(null);
  const [sarText, setSarText] = useState('');
  const [sarLoading, setSarLoading] = useState(false);

  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadTransactions() {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load transactions.');
      }
      const data = (await response.json()) as ApiResponse;
      setTransactions(data.transactions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }

  async function draftSAR(txn_id: string) {
    setSarLoading(true);
    setSarText('');
    try {
      const res = await fetch('/api/sar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id }),
      });
      const data = await res.json();
      setSarText(data.sar || 'Failed to generate SAR');
    } catch (err) {
      setSarText('Error generating SAR');
    } finally {
      setSarLoading(false);
    }
  }

  const riskColor = (level: string) =>
    level === 'critical' ? '#ef4444' :
    level === 'high'     ? '#f97316' :
    level === 'medium'   ? '#f59e0b' : '#22c55e';

  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount_pkr, 0);
    const highRiskCount = transactions.filter((tx) => tx.risk_level === "High").length;
    const avgRisk = transactions.length
      ? Math.round(
          transactions.reduce((sum, tx) => sum + tx.risk_score, 0) / transactions.length,
        )
      : 0;

    return {
      totalAmount,
      highRiskCount,
      avgRisk,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  const riskSeries = useMemo(() => {
    const recent = transactions.slice(0, 12).reverse();
    if (recent.length === 0) {
      return { points: "", pointData: [] as TrendPoint[] };
    }

    const width = 480;
    const height = 120;
    const max = Math.max(...recent.map((tx) => tx.risk_score), 1);

    const pointData = recent
      .map((tx, index) => {
        const x = (index / Math.max(recent.length - 1, 1)) * width;
        const y = height - (tx.risk_score / max) * height;
        return { x, y, riskScore: tx.risk_score, txnId: tx.txn_id };
      });

    const points = pointData.map((point) => `${point.x},${point.y}`).join(" ");

    return { points, pointData };
  }, [transactions]);

  const latestTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

  async function handleDelete(txnId: string) {
    setDeletingTxnId(txnId);
    setError(null);

    try {
      const response = await fetch(
        `/api/transactions?txn_id=${encodeURIComponent(txnId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete transaction.");
      }

      setTransactions((current) => current.filter((tx) => tx.txn_id !== txnId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction.");
    } finally {
      setDeletingTxnId(null);
    }
  }

  return (
    <main className="bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Insights
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Fraud Monitoring Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Real-time decisioning overview for incoming transaction streams.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Updated now • Status{" "}
              <span className="font-medium text-emerald-600">Running</span>
            </p>
          </div>
          <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => { setActiveTab('fraud'); setSelected(null); setSarText(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'fraud'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🚨 Fraud Detection
            </button>
            <button
              onClick={() => { setActiveTab('shariah'); setSelected(null); setSarText(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'shariah'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🕌 Shariah Compliance
            </button>
          </div>
        </section>

        {activeTab === 'fraud' && (
        <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Fraud Amount"
            value={`PKR ${stats.totalAmount.toLocaleString("en-PK")}`}
            tone="danger"
          />
          <MetricCard
            label="Balance at Risk"
            value={`${stats.highRiskCount} high-risk txns`}
            tone="neutral"
          />
          <MetricCard
            label="Average Risk Score"
            value={stats.avgRisk.toString()}
            tone="positive"
          />
          <MetricCard
            label="Transactions"
            value={stats.totalTransactions.toString()}
            tone="neutral"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Risk Trend</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                Last 12 records
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              {riskSeries.points ? (
                <svg
                  viewBox="0 0 480 120"
                  className="h-36 w-full"
                  preserveAspectRatio="none"
                  aria-label="Risk trend chart"
                  onMouseLeave={() => setActivePoint(null)}
                >
                  <polyline
                    fill="none"
                    stroke="rgb(15 23 42)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={riskSeries.points}
                  />
                  {riskSeries.pointData.map((point) => (
                    <circle
                      key={point.txnId}
                      cx={point.x}
                      cy={point.y}
                      r={6}
                      fill="transparent"
                      onMouseEnter={() => setActivePoint(point)}
                    />
                  ))}
                  {activePoint ? (
                    <g>
                      <line
                        x1={activePoint.x}
                        y1={0}
                        x2={activePoint.x}
                        y2={120}
                        stroke="rgb(148 163 184)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <circle cx={activePoint.x} cy={activePoint.y} r={4} fill="rgb(15 23 42)" />
                      <rect
                        x={Math.min(Math.max(activePoint.x - 92, 6), 310)}
                        y={8}
                        width={164}
                        height={40}
                        rx={8}
                        fill="rgb(15 23 42)"
                        opacity={0.96}
                      />
                      <text
                        x={Math.min(Math.max(activePoint.x - 84, 14), 318)}
                        y={24}
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                      >
                        Risk score: {activePoint.riskScore}
                      </text>
                      <text
                        x={Math.min(Math.max(activePoint.x - 84, 14), 318)}
                        y={38}
                        fill="rgb(203 213 225)"
                        fontSize={10}
                      >
                        {activePoint.txnId}
                      </text>
                    </g>
                  ) : null}
                </svg>
              ) : (
                <p className="p-8 text-center text-sm text-slate-500">
                  No trend data yet.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Health score</h2>
            <div className="mt-5 flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-emerald-200 bg-emerald-50">
                <span className="text-3xl font-semibold text-emerald-700">
                  {Math.max(100 - stats.avgRisk, 0)}
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              System health improves as average risk drops.
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
            <span className="text-xs text-slate-500">Fast table render enabled</span>
          </div>

          {loading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Loading transactions...
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
          ) : null}
          {!loading && !error && transactions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No transactions yet. Submit to <code>/api/transactions</code> and refresh.
            </p>
          ) : null}

          {!loading && !error && latestTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Txn ID</th>
                    <th className="px-3 py-2">Bank</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTransactions.map((transaction) => (
                    <tr key={transaction.txn_id} className="rounded-xl bg-slate-50 text-slate-700">
                      <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">
                        {transaction.txn_id}
                      </td>
                      <td className="px-3 py-3">
                        {transaction.bank_code} • {transaction.channel}
                      </td>
                      <td className="px-3 py-3">
                        PKR {transaction.amount_pkr.toLocaleString("en-PK")}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            transaction.risk_level === "High"
                              ? "bg-rose-100 text-rose-700"
                              : transaction.risk_level === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {transaction.risk_level} • {transaction.risk_score}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </td>
                      <td className="rounded-r-xl px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(transaction.txn_id)}
                          disabled={deletingTxnId === transaction.txn_id}
                          className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingTxnId === transaction.txn_id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        </>
        )}

        {activeTab === 'shariah' && <ShariahTab />}
      </div>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "danger";
};

function MetricCard({ label, value, tone }: MetricCardProps) {
  const toneClasses =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-rose-700"
        : "text-slate-800";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClasses}`}>{value}</p>
    </article>
  );
}
