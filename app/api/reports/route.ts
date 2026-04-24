import { NextRequest, NextResponse } from "next/server";

type StoredTransaction = {
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

const globalStore = globalThis as typeof globalThis & {
  __finshieldTransactions__?: StoredTransaction[];
};

const transactions = globalStore.__finshieldTransactions__ ?? [];
globalStore.__finshieldTransactions__ = transactions;

function getTransaction(txnId: string): StoredTransaction | undefined {
  return transactions.find((item) => item.txn_id === txnId);
}

export async function POST(request: NextRequest) {
  try {
    const { txn_id } = (await request.json()) as { txn_id?: string };

    if (!txn_id) {
      return NextResponse.json({ error: "txn_id is required." }, { status: 400 });
    }

    const transaction = getTransaction(txn_id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Transaction found!", txn_id: transaction.txn_id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}