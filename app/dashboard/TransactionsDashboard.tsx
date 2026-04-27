// "use client";

// import { useEffect, useMemo, useState } from "react";

// import type { StoredTransaction } from "../../lib/transactions-store";

// import ShariahTab from './shariah-tab'

// interface TxnWithAnalysis {
//   txn_id:        string
//   bank_code:     string
//   amount_pkr:    number
//   sender_iban:   string
//   receiver_iban: string
//   channel:       string
//   location_city: string
//   timestamp:     string
//   status:        string
//   fraud_analysis: {
//     risk_score:   number
//     risk_level:   string
//     flags:        string[]
//     explanation:  string
//     sar_required: boolean
//   } | null
// }

// type ApiResponse = {
//   transactions: StoredTransaction[];
// };

// type TrendPoint = {
//   x: number;
//   y: number;
//   riskScore: number;
//   txnId: string;
// };

// export default function TransactionsDashboard() {
//   const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [activePoint, setActivePoint] = useState<TrendPoint | null>(null);
//   const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<'fraud' | 'shariah'>('fraud');
//   const [selected, setSelected] = useState<TxnWithAnalysis | null>(null);
//   const [sarText, setSarText] = useState('');
//   const [sarLoading, setSarLoading] = useState(false);

//   useEffect(() => {
//     loadTransactions()
//     const interval = setInterval(loadTransactions, 30000)
//     return () => clearInterval(interval)
//   }, [])

//   async function loadTransactions() {
//     setLoading(true);
//     try {
//       const response = await fetch('/api/transactions', { cache: 'no-store' });
//       if (!response.ok) {
//         throw new Error('Failed to load transactions.');
//       }
//       const data = (await response.json()) as ApiResponse;
//       setTransactions(data.transactions);
//       setError(null);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load transactions.');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function draftSAR(txn_id: string) {
//     setSarLoading(true);
//     setSarText('');
//     try {
//       const res = await fetch('/api/sar', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ txn_id }),
//       });
//       const data = await res.json();
//       if (data.error) {
//         setSarText(`Error: ${data.error}`);
//       } else {
//         setSarText(data.sar || 'Failed to generate SAR');
//       }
//     } catch (err) {
//       setSarText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
//     } finally {
//       setSarLoading(false);
//     }
//   }

//   const riskColor = (level: string) =>
//     level === 'critical' ? '#ef4444' :
//     level === 'high'     ? '#f97316' :
//     level === 'medium'   ? '#f59e0b' : '#22c55e';

//   const stats = useMemo(() => {
//     const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount_pkr, 0);
//     const highRiskCount = transactions.filter((tx) => tx.risk_level === "High").length;
//     const avgRisk = transactions.length
//       ? Math.round(
//           transactions.reduce((sum, tx) => sum + tx.risk_score, 0) / transactions.length,
//         )
//       : 0;

//     return {
//       totalAmount,
//       highRiskCount,
//       avgRisk,
//       totalTransactions: transactions.length,
//     };
//   }, [transactions]);

//   const riskSeries = useMemo(() => {
//     const recent = transactions.slice(0, 12).reverse();
//     if (recent.length === 0) {
//       return { points: "", pointData: [] as TrendPoint[] };
//     }

//     const width = 480;
//     const height = 120;
//     const max = Math.max(...recent.map((tx) => tx.risk_score), 1);

//     const pointData = recent
//       .map((tx, index) => {
//         const x = (index / Math.max(recent.length - 1, 1)) * width;
//         const y = height - (tx.risk_score / max) * height;
//         return { x, y, riskScore: tx.risk_score, txnId: tx.txn_id };
//       });

//     const points = pointData.map((point) => `${point.x},${point.y}`).join(" ");

//     return { points, pointData };
//   }, [transactions]);

//   const latestTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

//   async function handleDelete(txnId: string) {
//     setDeletingTxnId(txnId);
//     setError(null);

//     try {
//       const response = await fetch(
//         `/api/transactions?txn_id=${encodeURIComponent(txnId)}`,
//         { method: "DELETE" },
//       );

//       if (!response.ok) {
//         const data = (await response.json()) as { error?: string };
//         throw new Error(data.error || "Failed to delete transaction.");
//       }

//       setTransactions((current) => current.filter((tx) => tx.txn_id !== txnId));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to delete transaction.");
//     } finally {
//       setDeletingTxnId(null);
//     }
//   }

//   return (
//     <main className="bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-6xl space-y-5">
//         <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//           <div className="flex flex-wrap items-end justify-between gap-4">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
//                 Insights
//               </p>
//               <h1 className="mt-2 text-3xl font-semibold text-slate-900">
//                 Fraud Monitoring Dashboard
//               </h1>
//               <p className="mt-2 text-sm text-slate-600">
//                 Real-time decisioning overview for incoming transaction streams.
//               </p>
//             </div>
//             <p className="text-sm text-slate-500">
//               Updated now • Status{" "}
//               <span className="font-medium text-emerald-600">Running</span>
//             </p>
//           </div>
//           <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
//             <button
//               onClick={() => { setActiveTab('fraud'); setSelected(null); setSarText(''); }}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                 activeTab === 'fraud'
//                   ? 'bg-blue-50 text-blue-700 border border-blue-200'
//                   : 'text-slate-600 hover:bg-slate-50'
//               }`}
//             >
//               🚨 Fraud Detection
//             </button>
//             <button
//               onClick={() => { setActiveTab('shariah'); setSelected(null); setSarText(''); }}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                 activeTab === 'shariah'
//                   ? 'bg-green-50 text-green-700 border border-green-200'
//                   : 'text-slate-600 hover:bg-slate-50'
//               }`}
//             >
//               🕌 Shariah Compliance
//             </button>
//           </div>
//         </section>

//         {activeTab === 'fraud' && (
//         <>
//         <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           <MetricCard
//             label="Fraud Amount"
//             value={`PKR ${stats.totalAmount.toLocaleString("en-PK")}`}
//             tone="danger"
//           />
//           <MetricCard
//             label="Balance at Risk"
//             value={`${stats.highRiskCount} high-risk txns`}
//             tone="neutral"
//           />
//           <MetricCard
//             label="Average Risk Score"
//             value={stats.avgRisk.toString()}
//             tone="positive"
//           />
//           <MetricCard
//             label="Transactions"
//             value={stats.totalTransactions.toString()}
//             tone="neutral"
//           />
//         </section>

//         <section className="grid gap-4 lg:grid-cols-3">
//           <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
//             <div className="mb-4 flex items-center justify-between">
//               <h2 className="text-base font-semibold text-slate-900">Risk Trend</h2>
//               <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
//                 Last 12 records
//               </span>
//             </div>
//             <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
//               {riskSeries.points ? (
//                 <svg
//                   viewBox="0 0 480 120"
//                   className="h-36 w-full"
//                   preserveAspectRatio="none"
//                   aria-label="Risk trend chart"
//                   onMouseLeave={() => setActivePoint(null)}
//                 >
//                   <polyline
//                     fill="none"
//                     stroke="rgb(15 23 42)"
//                     strokeWidth="3"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     points={riskSeries.points}
//                   />
//                   {riskSeries.pointData.map((point) => (
//                     <circle
//                       key={point.txnId}
//                       cx={point.x}
//                       cy={point.y}
//                       r={6}
//                       fill="transparent"
//                       onMouseEnter={() => setActivePoint(point)}
//                     />
//                   ))}
//                   {activePoint ? (
//                     <g>
//                       <line
//                         x1={activePoint.x}
//                         y1={0}
//                         x2={activePoint.x}
//                         y2={120}
//                         stroke="rgb(148 163 184)"
//                         strokeWidth={1}
//                         strokeDasharray="4 4"
//                       />
//                       <circle cx={activePoint.x} cy={activePoint.y} r={4} fill="rgb(15 23 42)" />
//                       <rect
//                         x={Math.min(Math.max(activePoint.x - 92, 6), 310)}
//                         y={8}
//                         width={164}
//                         height={40}
//                         rx={8}
//                         fill="rgb(15 23 42)"
//                         opacity={0.96}
//                       />
//                       <text
//                         x={Math.min(Math.max(activePoint.x - 84, 14), 318)}
//                         y={24}
//                         fill="white"
//                         fontSize={11}
//                         fontWeight={600}
//                       >
//                         Risk score: {activePoint.riskScore}
//                       </text>
//                       <text
//                         x={Math.min(Math.max(activePoint.x - 84, 14), 318)}
//                         y={38}
//                         fill="rgb(203 213 225)"
//                         fontSize={10}
//                       >
//                         {activePoint.txnId}
//                       </text>
//                     </g>
//                   ) : null}
//                 </svg>
//               ) : (
//                 <p className="p-8 text-center text-sm text-slate-500">
//                   No trend data yet.
//                 </p>
//               )}
//             </div>
//           </article>

//           <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <h2 className="text-base font-semibold text-slate-900">Health score</h2>
//             <div className="mt-5 flex items-center justify-center">
//               <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-emerald-200 bg-emerald-50">
//                 <span className="text-3xl font-semibold text-emerald-700">
//                   {Math.max(100 - stats.avgRisk, 0)}
//                 </span>
//               </div>
//             </div>
//             <p className="mt-4 text-center text-sm text-slate-600">
//               System health improves as average risk drops.
//             </p>
//           </article>
//         </section>

//         <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
//             <span className="text-xs text-slate-500">Fast table render enabled</span>
//           </div>

//           {loading ? (
//             <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
//               Loading transactions...
//             </p>
//           ) : null}
//           {error ? (
//             <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
//           ) : null}
//           {!loading && !error && transactions.length === 0 ? (
//             <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
//               No transactions yet. Submit to <code>/api/transactions</code> and refresh.
//             </p>
//           ) : null}

//           {!loading && !error && latestTransactions.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
//                 <thead>
//                   <tr className="text-xs uppercase tracking-wide text-slate-500">
//                     <th className="px-3 py-2">Txn ID</th>
//                     <th className="px-3 py-2">Bank</th>
//                     <th className="px-3 py-2">Amount</th>
//                     <th className="px-3 py-2">Risk</th>
//                     <th className="px-3 py-2">Time</th>
//                     <th className="px-3 py-2 text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {latestTransactions.map((transaction) => (
//                     <tr key={transaction.txn_id} className="rounded-xl bg-slate-50 text-slate-700">
//                       <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">
//                         {transaction.txn_id}
//                       </td>
//                       <td className="px-3 py-3">
//                         {transaction.bank_code} • {transaction.channel}
//                       </td>
//                       <td className="px-3 py-3">
//                         PKR {transaction.amount_pkr.toLocaleString("en-PK")}
//                       </td>
//                       <td className="px-3 py-3">
//                         <span
//                           className={`rounded-full px-2 py-1 text-xs font-medium ${
//                             transaction.risk_level === "High"
//                               ? "bg-rose-100 text-rose-700"
//                               : transaction.risk_level === "Medium"
//                                 ? "bg-amber-100 text-amber-700"
//                                 : "bg-emerald-100 text-emerald-700"
//                           }`}
//                         >
//                           {transaction.risk_level} • {transaction.risk_score}
//                         </span>
//                       </td>
//                       <td className="px-3 py-3 text-slate-500">
//                         {new Date(transaction.timestamp).toLocaleString()}
//                       </td>
//                       <td className="rounded-r-xl px-3 py-3 text-right">
//                         <div className="flex gap-2 justify-end">
//                           <button
//                             type="button"
//                             onClick={() => {
//                               setSelected(transaction as unknown as TxnWithAnalysis);
//                               setSarText('');
//                               draftSAR(transaction.txn_id);
//                             }}
//                             disabled={sarLoading}
//                             className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
//                           >
//                             📄 Generate SAR Report
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleDelete(transaction.txn_id)}
//                             disabled={deletingTxnId === transaction.txn_id}
//                             className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
//                           >
//                             {deletingTxnId === transaction.txn_id ? "Deleting..." : "Delete"}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : null}
//         </section>

//         {/* SAR Report Modal */}
//         {selected && (
//           <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="mb-4 flex items-center justify-between">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Suspicious Activity Report - {selected.txn_id}
//               </h2>
//               <button
//                 onClick={() => { setSelected(null); setSarText(''); }}
//                 className="text-sm text-slate-500 hover:text-slate-700"
//               >
//                 ✕ Close
//               </button>
//             </div>
//             {sarLoading ? (
//               <div className="rounded-xl bg-slate-50 p-8 text-center">
//                 <p className="text-sm text-slate-600">Generating SAR report...</p>
//               </div>
//             ) : sarText ? (
//               <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
//                 <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
//                   {sarText}
//                 </pre>
//               </div>
//             ) : (
//               <div className="rounded-xl bg-slate-50 p-8 text-center">
//                 <p className="text-sm text-slate-600">Click "SAR Report" on a transaction to generate the report.</p>
//               </div>
//             )}
//           </section>
//         )}
//         </>
//         )}

//         {activeTab === 'shariah' && <ShariahTab />}
//       </div>
//     </main>
//   );
// }

// type MetricCardProps = {
//   label: string;
//   value: string;
//   tone: "neutral" | "positive" | "danger";
// };

// function MetricCard({ label, value, tone }: MetricCardProps) {
//   const toneClasses =
//     tone === "positive"
//       ? "text-emerald-700"
//       : tone === "danger"
//         ? "text-rose-700"
//         : "text-slate-800";

//   return (
//     <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
//       <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
//       <p className={`mt-3 text-2xl font-semibold ${toneClasses}`}>{value}</p>
//     </article>
//   );
// }


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
  risk_score:    number
  risk_level:    string
  reasons:       string[]
  fraud_analysis: {
    review_action: string
    reviewed_by:   string
    reviewed_at:   string
  } | null
}
 
interface AuditLog {
  id:         string
  action:     string
  entity_id:  string
  user_email: string
  details:    string
  created_at: string
}
 
type ApiResponse = {
  transactions: (Omit<StoredTransaction, 'fraud_analysis'> & {
    fraud_analysis: {
      review_action: string
      reviewed_by:   string
      reviewed_at:   string
    } | null
  })[];
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
  const [activeTab, setActiveTab] = useState<'fraud' | 'shariah' | 'audit'>('fraud');
  const [selected, setSelected] = useState<TxnWithAnalysis | null>(null);
  const [sarText, setSarText] = useState('');
  const [sarLoading, setSarLoading] = useState(false);
  const [fraudFilter, setFraudFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
 
  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 60000) // 1 minute instead of 30 seconds
    return () => clearInterval(interval)
  }, [])
 
  useEffect(() => {
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);
 
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
 
  async function loadAuditLogs() {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  }
 
  async function submitReview(txn_id: string, action: 'cleared' | 'confirmed' | 'escalated') {
    setReviewLoading(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id, action, reviewed_by: 'compliance_officer' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Review failed');
        return;
      }
      setReviewDone(true);
      // Update selected transaction state immediately
      setSelected(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          fraud_analysis: prev.fraud_analysis ? {
            ...prev.fraud_analysis,
            review_action: action,
            reviewed_by: 'compliance_officer',
            reviewed_at: new Date().toISOString(),
          } : {
            risk_score: 0,
            risk_level: 'Low',
            flags: [],
            explanation: '',
            sar_required: false,
            review_action: action,
            reviewed_by: 'compliance_officer',
            reviewed_at: new Date().toISOString(),
          },
        };
      });
      // Refresh transactions list in background
      await loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setReviewLoading(false);
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
      if (data.error) {
        setSarText(`Error: ${data.error}`);
      } else {
        setSarText(data.sar || 'Failed to generate SAR');
      }
    } catch (err) {
      setSarText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSarLoading(false);
    }
  }
 
  const reviewColor = (action: string) =>
    action === 'confirmed' ? '#ef4444' :
    action === 'cleared'   ? '#22c55e' :
    action === 'escalated' ? '#8b5cf6' : '#6b7280';
 
  const reviewLabel = (action: string) =>
    action === 'confirmed' ? '🔴 Fraud Confirmed' :
    action === 'cleared'   ? '✅ Cleared' :
    action === 'escalated' ? '🟣 Escalated' : '⏳ Pending Review';
 
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount_pkr, 0);
    const highRiskCount = transactions.filter((tx) => tx.risk_level === "High").length;
    const avgRisk = transactions.length
      ? Math.round(
          transactions.reduce((sum, tx) => sum + tx.risk_score, 0) / transactions.length,
        )
      : 0;
    const pendingCount = transactions.filter(
      (t: any) => !t.fraud_analysis?.review_action || t.fraud_analysis.review_action === 'pending'
    ).length;
 
    return {
      totalAmount,
      highRiskCount,
      avgRisk,
      totalTransactions: transactions.length,
      pendingCount,
    };
  }, [transactions]);
 
  const filteredTxns = useMemo(() => {
    return transactions.filter((t: any) => {
      if (fraudFilter === 'pending')  return !t.fraud_analysis?.review_action || t.fraud_analysis.review_action === 'pending';
      if (fraudFilter === 'reviewed') return t.fraud_analysis?.review_action && t.fraud_analysis.review_action !== 'pending';
      return true;
    });
  }, [transactions, fraudFilter]);
 
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
 
  const latestTransactions = useMemo(() => filteredTxns.slice(0, 6), [filteredTxns]);
 
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
              {stats.pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {stats.pendingCount}
                </span>
              )}
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
            <button
              onClick={() => { setActiveTab('audit'); setSelected(null); setSarText(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'audit'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📋 Audit Log
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
 
          {/* Filter tabs */}
          <div className="mb-4 flex gap-2">
            {(['all', 'pending', 'reviewed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFraudFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md border transition ${
                  fraudFilter === f
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'All' : f === 'pending' ? `Pending Review${stats.pendingCount > 0 ? ` (${stats.pendingCount})` : ''}` : 'Reviewed'}
              </button>
            ))}
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
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTransactions.map((transaction) => {
                    const txnAny = transaction as any;
                    const reviewAction = txnAny.fraud_analysis?.review_action || 'pending';
                    return (
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
                        <td className="px-3 py-3">
                          <span className="text-xs font-medium" style={{ color: reviewColor(reviewAction) }}>
                            {reviewLabel(reviewAction)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </td>
                        <td className="rounded-r-xl px-3 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(transaction as unknown as TxnWithAnalysis);
                                setSarText('');
                                setReviewDone(false);
                                draftSAR(transaction.txn_id);
                              }}
                              disabled={sarLoading}
                              className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              📄 Generate SAR Report
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(transaction.txn_id)}
                              disabled={deletingTxnId === transaction.txn_id}
                              className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingTxnId === transaction.txn_id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
 
        {/* SAR Report Modal */}
        {selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Suspicious Activity Report - {selected.txn_id}
              </h2>
              <button
                onClick={() => { setSelected(null); setSarText(''); setReviewDone(false); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ✕ Close
              </button>
            </div>
 
            {/* Review action buttons */}
            {(!selected.fraud_analysis?.review_action || selected.fraud_analysis.review_action === 'pending') && !reviewDone && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  ⏳ Compliance Review Required
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => submitReview(selected.txn_id, 'cleared')}
                    disabled={reviewLoading}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    ✅ Mark as Cleared
                  </button>
                  <button
                    onClick={() => submitReview(selected.txn_id, 'confirmed')}
                    disabled={reviewLoading}
                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    🔴 Confirm Fraud
                  </button>
                  <button
                    onClick={() => submitReview(selected.txn_id, 'escalated')}
                    disabled={reviewLoading}
                    className="rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-60"
                  >
                    🟣 Escalate
                  </button>
                </div>
                {reviewLoading && (
                  <p className="mt-2 text-xs text-slate-500">Saving review...</p>
                )}
              </div>
            )}
 
            {/* Review done confirmation */}
            {(reviewDone || (selected.fraud_analysis?.review_action && selected.fraud_analysis.review_action !== 'pending')) && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                <span className="font-semibold">Review recorded. </span>
                Status: {reviewLabel(selected.fraud_analysis?.review_action || '')}
                {selected.fraud_analysis?.reviewed_by && ` · by ${selected.fraud_analysis.reviewed_by}`}
              </div>
            )}
 
            {sarLoading ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">Generating SAR report...</p>
              </div>
            ) : sarText ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
                  {sarText}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">Click "SAR Report" on a transaction to generate the report.</p>
              </div>
            )}
          </section>
        )}
        </>
        )}
 
        {activeTab === 'shariah' && <ShariahTab />}
 
        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-slate-900">Audit Log</h2>
            <p className="mb-4 text-xs text-slate-500">
              Complete record of all compliance actions taken on this platform.
            </p>
            {auditLogs.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No audit logs yet. Review transactions to see them here.
              </p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      log.action.includes('CONFIRMED') ? 'bg-rose-500' :
                      log.action.includes('CLEARED')   ? 'bg-emerald-500' :
                      log.action.includes('ESCALATED') ? 'bg-violet-500' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{log.details}</p>
                      <p className="text-xs text-slate-400">
                        by {log.user_email} · txn: {log.entity_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
 
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
 