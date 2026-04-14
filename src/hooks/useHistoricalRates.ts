import { useEffect, useState } from "react";

export interface RatePoint {
  date:  string;   // "YYYY-MM-DD"
  value: number;
  label: string;   // "MM-DD" — prêt pour les axes Recharts
}

export interface HistoricalRatesResult {
  data:    RatePoint[];
  loading: boolean;
  error:   boolean;
  // Stats dérivées
  current:   number | null;
  open:      number | null;
  min:       number | null;
  max:       number | null;
  changePct: number | null;
}

export function useHistoricalRates(
  from: string,
  to:   string,
  days  = 30,
): HistoricalRatesResult {
  const [data,    setData]    = useState<RatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!from || !to || from === to) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setData([]);

    const now   = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split("T")[0];
    const endStr   = now.toISOString().split("T")[0];

    fetch(
      `https://api.frankfurter.app/${startStr}..${endStr}?from=${from}&to=${to}`,
      { headers: { Accept: "application/json" } }
    )
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => {
        if (cancelled) return;
        const points: RatePoint[] = Object.entries(json.rates ?? {})
          .map(([date, rates]: [string, any]) => ({
            date,
            value: rates[to] as number,
            label: date.slice(5),   // MM-DD
          }))
          .filter((p) => p.value != null)
          .sort((a, b) => (a.date < b.date ? -1 : 1));
        setData(points);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [from, to, days]);

  // Stats dérivées
  const values    = data.map((p) => p.value);
  const current   = values.length > 0 ? values[values.length - 1] : null;
  const open      = values.length > 0 ? values[0]                  : null;
  const min       = values.length > 0 ? Math.min(...values)        : null;
  const max       = values.length > 0 ? Math.max(...values)        : null;
  const changePct = current !== null && open !== null && open !== 0
    ? ((current - open) / open) * 100
    : null;

  return { data, loading, error, current, open, min, max, changePct };
}
