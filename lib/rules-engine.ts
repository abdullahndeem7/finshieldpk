type Transaction = {
  txn_id: string
  bank_code: string
  amount_pkr: number
  sender_iban: string
  receiver_iban: string
  channel: string
  location_city: string
  timestamp: string
  device_id?: string
}

type RuleFlag = {
  rule: string
  severity: 'low' | 'medium' | 'high'
  detail: string
}

export function runRulesEngine(
  txn: Transaction,
  history: Transaction[]
): RuleFlag[] {
  const flags: RuleFlag[] = []
  const now = new Date(txn.timestamp)
 
  // ── Rule 1: Velocity ─────────────────────────────────────
  const recentTxns = history.filter(t => {
    const diff = now.getTime() - new Date(t.timestamp).getTime()
    return diff < 10 * 60 * 1000
  })
  if (recentTxns.length >= 5) {
    flags.push({
      rule: 'VELOCITY',
      severity: 'high',
      detail: `${recentTxns.length} transactions in last 10 minutes`,
    })
  }
 
  // ── Rule 2: Geographic anomaly ────────────────────────────
  const lastTxn = history[0]
  if (
    lastTxn &&
    lastTxn.location_city &&
    txn.location_city &&
    lastTxn.location_city !== txn.location_city
  ) {
    const timeDiff = now.getTime() - new Date(lastTxn.timestamp).getTime()
    if (timeDiff < 3 * 60 * 60 * 1000) {
      flags.push({
        rule: 'GEO_ANOMALY',
        severity: 'high',
        detail: `${lastTxn.location_city} → ${txn.location_city} in ${Math.round(timeDiff / 3600000)}h`,
      })
    }
  }
 
  // ── Rule 3: Large Raast to new payee ─────────────────────
  const knownPayees = new Set(history.map(t => t.receiver_iban))
  if (
    txn.channel === 'RAAST' &&
    txn.amount_pkr > 50000 &&
    !knownPayees.has(txn.receiver_iban)
  ) {
    flags.push({
      rule: 'NEW_PAYEE_LARGE',
      severity: 'high',
      detail: `PKR ${txn.amount_pkr.toLocaleString()} to first-time payee via Raast`,
    })
  }
 
  // ── Rule 4: SIM swap risk ─────────────────────────────────
  // FIX: now triggers even without prior mobile history — new device alone is enough
  const lastMobileTxn = history.find(t => t.channel === 'MOBILE')
  const isNewDevice = txn.device_id && (
    !lastMobileTxn ||
    (lastMobileTxn.device_id && txn.device_id !== lastMobileTxn.device_id)
  )
  if (
    txn.channel === 'MOBILE' &&
    isNewDevice &&
    txn.amount_pkr > 20000
  ) {
    flags.push({
      rule: 'SIM_SWAP_RISK',
      severity: 'high',
      detail: `New device ID with large mobile transaction PKR ${txn.amount_pkr.toLocaleString()}`,
    })
  }
 
  // ── Rule 5: Round amount structuring ─────────────────────
  // FIX: lowered threshold to PKR 100,000 to catch more cases
  const isRound = txn.amount_pkr % 100000 === 0 && txn.amount_pkr >= 100000
  if (isRound) {
    flags.push({
      rule: 'ROUND_AMOUNT',
      severity: txn.amount_pkr >= 500000 ? 'high' : 'medium',
      detail: `Suspiciously round PKR ${txn.amount_pkr.toLocaleString()}`,
    })
  }
 
  // ── Rule 6: Late night ATM ────────────────────────────────
  const hour = now.getHours()
  if (txn.channel === 'ATM' && (hour < 5 || hour >= 23) && txn.amount_pkr > 25000) {
    flags.push({
      rule: 'LATE_ATM',
      severity: 'high',
      detail: `ATM withdrawal at ${hour}:00 above PKR 25,000`,
    })
  }
 
  // ── Rule 7: JazzCash rapid ───────────────────────────────
  const recentJazz = history.filter(t => {
    const diff = now.getTime() - new Date(t.timestamp).getTime()
    return t.channel === 'JAZZCASH' && diff < 30 * 60 * 1000
  })
  if (txn.channel === 'JAZZCASH' && recentJazz.length >= 3) {
    flags.push({
      rule: 'JAZZCASH_RAPID',
      severity: 'high',
      detail: `${recentJazz.length + 1} JazzCash transactions in 30 minutes`,
    })
  }
 
  // ── Rule 8: Off-hours large transfer (NEW) ────────────────
  // Any transfer above PKR 50,000 between midnight and 5am
  if (
    (hour >= 0 && hour < 5) &&
    txn.amount_pkr > 50000 &&
    txn.channel !== 'ATM'
  ) {
    flags.push({
      rule: 'OFF_HOURS_LARGE',
      severity: 'high',
      detail: `Large PKR ${txn.amount_pkr.toLocaleString()} transfer at ${hour}:${String(now.getMinutes()).padStart(2,'0')} (off-hours)`,
    })
  }
 
  // ── Rule 9: Raast off-hours (NEW) ────────────────────────
  // Raast at night is irreversible and extremely high risk
  if (
    txn.channel === 'RAAST' &&
    (hour >= 0 && hour < 5) &&
    txn.amount_pkr > 10000
  ) {
    flags.push({
      rule: 'RAAST_OFF_HOURS',
      severity: 'high',
      detail: `Raast transfer at ${hour}:${String(now.getMinutes()).padStart(2,'0')} — irreversible night transfer`,
    })
  }
 
  return flags
}
 
// FIX: quickScore thresholds lowered so more transactions reach HIGH/CRITICAL
export function quickScore(flags: RuleFlag[]): number | null {
  const highCount   = flags.filter(f => f.severity === 'high').length
  const mediumCount = flags.filter(f => f.severity === 'medium').length
 
  // 2+ high flags = critical (was already here)
  if (highCount >= 2)                        return 92
  // 1 high flag = high risk (was 78, now triggers)
  if (highCount === 1 && mediumCount >= 1)   return 82
  // 1 high flag alone = high risk (NEW — before this returned null)
  if (highCount === 1)                        return 75
  // Medium flags only = medium
  if (mediumCount >= 2)                      return 55
  if (mediumCount === 1)                     return 40
  // No flags = clean
  if (flags.length === 0)                    return 8
  return null
}
 