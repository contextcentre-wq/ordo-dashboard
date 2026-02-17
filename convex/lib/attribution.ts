// Sales attribution engine
//
// Internal helper functions (not exported as Convex endpoints).
// These are pure TypeScript functions imported by aggregation queries.

// Given ad daily stats and sales data, compute attribution per ad per date.
// This replicates the SQL CTE: sales_attributed_by_registration

export interface AdActivePeriod {
  adId: string;
  firstDate: string; // "YYYY-MM-DD"
  lastDate: string; // "YYYY-MM-DD"
}

export interface SaleForAttribution {
  _id: string;
  adId: string | null;
  amount: number;
  registrationDateStr: string;
  saleDateStr: string;
  clientName?: string;
  dealStatus: string;
  dealLink?: string;
}

export interface AttributionResult {
  salesAmount: number;
  salesCount: number;
  lateSalesAmount: number;
  lateSalesCount: number;
  details: Array<{
    client?: string;
    amount: number;
    status: string;
    link?: string;
    saleDate: string;
    registrationDate: string;
    isLateSale: boolean;
  }>;
}

// Get active periods for each ad from stats data.
// Returns a map from adId to the first and last date that ad has stats entries.
export function getAdActivePeriods(
  statsData: Array<{ adId: string; date: string }>
): Map<string, { firstDate: string; lastDate: string }> {
  const map = new Map<string, { firstDate: string; lastDate: string }>();
  for (const stat of statsData) {
    const existing = map.get(stat.adId);
    if (!existing) {
      map.set(stat.adId, { firstDate: stat.date, lastDate: stat.date });
    } else {
      if (stat.date < existing.firstDate) existing.firstDate = stat.date;
      if (stat.date > existing.lastDate) existing.lastDate = stat.date;
    }
  }
  return map;
}

// Add days to a "YYYY-MM-DD" string, returning a new "YYYY-MM-DD" string.
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// Attribute sales to an ad on a specific stat date.
//
// Direct sales: sales whose registrationDateStr matches the stat date exactly.
// Late sales: if statDate is the ad's last active date, sales whose
//   registrationDateStr falls within 7 days after statDate are attributed as
//   late sales (captures conversions from the ad's final days of activity).
export function attributeSalesForAd(
  adId: string,
  statDate: string,
  lastActiveDate: string,
  salesForAd: SaleForAttribution[]
): AttributionResult {
  const directSales: SaleForAttribution[] = [];
  const lateSales: SaleForAttribution[] = [];

  for (const sale of salesForAd) {
    if (sale.registrationDateStr === statDate) {
      directSales.push(sale);
    } else if (
      statDate === lastActiveDate &&
      sale.registrationDateStr > statDate &&
      sale.registrationDateStr <= addDays(statDate, 7)
    ) {
      lateSales.push(sale);
    }
  }

  const allAttributed = [...directSales, ...lateSales];
  const directAmount = directSales.reduce((sum, s) => sum + s.amount, 0);
  const lateAmount = lateSales.reduce((sum, s) => sum + s.amount, 0);

  return {
    salesAmount: directAmount + lateAmount,
    salesCount: allAttributed.length,
    lateSalesAmount: lateAmount,
    lateSalesCount: lateSales.length,
    details: allAttributed.map((s) => ({
      client: s.clientName,
      amount: s.amount,
      status: s.dealStatus,
      link: s.dealLink,
      saleDate: s.saleDateStr,
      registrationDate: s.registrationDateStr,
      isLateSale: lateSales.includes(s),
    })),
  };
}
