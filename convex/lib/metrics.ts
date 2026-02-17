/** Safe division: returns 0 when denominator is 0 */
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/** Click-through rate: (clicks / impressions) * 100 → % */
export function calcCTR(clicks: number, impressions: number): number {
  return safeDivide(clicks, impressions) * 100;
}

/** Cost per click: spend / clicks → currency */
export function calcCPC(spend: number, clicks: number): number {
  return safeDivide(spend, clicks);
}

/** Cost per mille: (spend / impressions) * 1000 → currency */
export function calcCPM(spend: number, impressions: number): number {
  return safeDivide(spend, impressions) * 1000;
}

/** Cost per lead: spend / leads → currency */
export function calcCPL(spend: number, leads: number): number {
  return safeDivide(spend, leads);
}

/** Cost per result: spend / results → currency */
export function calcCPR(spend: number, results: number): number {
  return safeDivide(spend, results);
}

/** Cost per sale: spend / sales → currency */
export function calcCPS(spend: number, sales: number): number {
  return safeDivide(spend, sales);
}

/** Cost per qualified lead: spend / qualifiedLeads → currency */
export function calcCPqL(spend: number, qualifiedLeads: number): number {
  return safeDivide(spend, qualifiedLeads);
}

/** Average order value: totalIncome / salesCount → currency */
export function calcAOV(totalIncome: number, salesCount: number): number {
  return safeDivide(totalIncome, salesCount);
}

/** Return on ad spend: ((income - expense) / expense) * 100 → % */
export function calcROAS(income: number, expense: number): number {
  return safeDivide(income - expense, expense) * 100;
}

/** Cost per show (attended appointment): spend / appointmentsAttended → currency */
export function calcCPShow(spend: number, appointmentsAttended: number): number {
  return safeDivide(spend, appointmentsAttended);
}
