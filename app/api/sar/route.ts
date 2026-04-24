import { NextRequest, NextResponse } from "next/server";
import { getTransaction } from "../../../lib/transactions-store";
import { generateSAR } from "../../../lib/sar-generator";

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

    const sarPrompt = `Generate a Suspicious Activity Report (SAR) for this flagged transaction.

Transaction details:
- Reference No: ${transaction.txn_id}
- Date/Time: ${transaction.timestamp}
- Amount: PKR ${transaction.amount_pkr}
- Sender IBAN: ${transaction.sender_iban}
- Receiver IBAN: ${transaction.receiver_iban}
- Channel: ${transaction.channel}
- Location: ${transaction.location_city}

Risk assessment:
- Risk Score: ${transaction.risk_score}
- Risk Level: ${transaction.risk_level}
- Flags: ${transaction.reasons.join(", ")}

Write the SAR in formal Pakistani banking compliance language, with a clear Suspicious Activity Description, Transaction Details, Basis for Suspicion, and Recommended Action.`;

    const sar = await generateSAR(sarPrompt);
    return NextResponse.json({ sar });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate SAR. Ensure the request is valid and the AI key is configured." },
      { status: 500 },
    );
  }
}
