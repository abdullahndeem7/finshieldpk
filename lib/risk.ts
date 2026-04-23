export type RiskAssessment = {
  score: number;
  level: "Low" | "Medium" | "High";
  reasons: string[];
};

type TransactionForScoring = {
  amount_pkr: number;
  channel: string;
  location_city: string;
  timestamp: string;
};

export function assessRisk(transaction: TransactionForScoring): RiskAssessment {
  let score = 18;
  const reasons: string[] = [];

  if (transaction.amount_pkr >= 250000) {
    score += 32;
    reasons.push("High-value transfer above PKR 250,000.");
  }

  if (transaction.channel.toUpperCase() === "RAAST") {
    score += 18;
    reasons.push("Instant Raast transfer needs tighter monitoring.");
  }

  const hour = new Date(transaction.timestamp).getUTCHours();
  if (hour >= 0 && hour < 5) {
    score += 14;
    reasons.push("Transaction occurred during off-hours.");
  }

  if (transaction.location_city.toLowerCase() === "karachi") {
    score += 8;
    reasons.push("Karachi is marked as a high-volume watch city.");
  }

  score = Math.min(score, 99);

  let level: RiskAssessment["level"] = "Low";
  if (score >= 70) {
    level = "High";
  } else if (score >= 40) {
    level = "Medium";
  }

  if (reasons.length === 0) {
    reasons.push("No strong anomaly indicators detected.");
  }

  return { score, level, reasons };
}
