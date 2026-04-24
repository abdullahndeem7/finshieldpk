import { assessRisk } from "./risk";

export type StoredTransaction = {
  txn_id: string;
  bank_code: string;
  amount_pkr: number;
  sender_iban: string;
  receiver_iban: string;
  channel: string;
  location_city: string;
  timestamp: string;
  risk_score: number;
  risk_level: "Low" | "Medium" | "High";
  reasons: string[];
  created_at: string;
};

type TransactionInput = Omit<
  StoredTransaction,
  "risk_score" | "risk_level" | "reasons" | "created_at"
>;

const globalStore = globalThis as typeof globalThis & {
  __finshieldTransactions__?: StoredTransaction[];
};

const transactions = globalStore.__finshieldTransactions__ ?? [];
globalStore.__finshieldTransactions__ = transactions;

export function addTransaction(input: TransactionInput): StoredTransaction {
  const assessment = assessRisk(input);

  const transaction: StoredTransaction = {
    ...input,
    risk_score: assessment.score,
    risk_level: assessment.level,
    reasons: assessment.reasons,
    created_at: new Date().toISOString(),
  };

  const existingIndex = transactions.findIndex(
    (item) => item.txn_id === transaction.txn_id,
  );

  if (existingIndex >= 0) {
    transactions[existingIndex] = transaction;
  } else {
    transactions.unshift(transaction);
  }

  return transaction;
}

export function listTransactions(): StoredTransaction[] {
  return [...transactions];
}

export function deleteTransaction(txnId: string): boolean {
  const index = transactions.findIndex((item) => item.txn_id === txnId);
  if (index < 0) {
    return false;
  }

  transactions.splice(index, 1);
  return true;
}

export function getTransaction(txnId: string): StoredTransaction | undefined {
  return transactions.find((item) => item.txn_id === txnId);
}
