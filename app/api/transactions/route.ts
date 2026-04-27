import { NextRequest, NextResponse } from "next/server";

import {
  addTransaction,
  deleteTransaction,
  listTransactions,
} from "../../../lib/transaction-storage";
import { supabase } from "@/lib/supabase";

type IncomingTransaction = {
  txn_id: string;
  bank_code: string;
  amount_pkr: number;
  sender_iban: string;
  receiver_iban: string;
  channel: string;
  location_city: string;
  timestamp: string;
};

function isValidPayload(payload: Partial<IncomingTransaction>): payload is IncomingTransaction {
  return Boolean(
    payload.txn_id &&
      payload.bank_code &&
      typeof payload.amount_pkr === "number" &&
      payload.sender_iban &&
      payload.receiver_iban &&
      payload.channel &&
      payload.location_city &&
      payload.timestamp,
  );
}

export async function GET() {
  const localTxns = listTransactions();

  // Fetch fraud_analysis data from Supabase for all transactions
  const txnIds = localTxns.map(t => t.txn_id);
  const { data: analyses } = await supabase
    .from('fraud_analysis')
    .select('txn_id, review_action, reviewed_by, reviewed_at')
    .in('txn_id', txnIds);

  // Join fraud_analysis with transactions
  const transactionsWithReview = localTxns.map(txn => {
    const analysis = analyses?.find(a => a.txn_id === txn.txn_id);
    return {
      ...txn,
      fraud_analysis: analysis ? {
        review_action: analysis.review_action,
        reviewed_by: analysis.reviewed_by,
        reviewed_at: analysis.reviewed_at,
      } : null,
    };
  });

  return NextResponse.json({ transactions: transactionsWithReview });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<IncomingTransaction>;

    if (!isValidPayload(payload)) {
      return NextResponse.json(
        { error: "Invalid transaction payload." },
        { status: 400 },
      );
    }

    const transaction = addTransaction(payload);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const txnId = request.nextUrl.searchParams.get("txn_id");

  if (!txnId) {
    return NextResponse.json({ error: "txn_id is required." }, { status: 400 });
  }

  const removed = deleteTransaction(txnId);
  if (!removed) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
