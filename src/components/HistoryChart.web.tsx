// HistoryChart.web.tsx — version WEB uniquement (Recharts)
// Metro Bundler / Expo charge automatiquement ce fichier sur le web.

import { ActivityIndicator, Text, View } from "react-native";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useHistoricalRates } from "../hooks/useHistoricalRates";

interface Props {
  from:    string;
  to:      string;
  dark:    boolean;
  primary: string;
  height?: number;
}

export default function HistoryChart({ from, to, dark, primary, height = 220 }: Props) {
  const { data, loading, error } = useHistoricalRates(from, to, 30);

  const bg      = dark ? "#0F0F14" : "#FFFFFF";
  const muted   = dark ? "#636366" : "#8E8E93";
  const border  = dark ? "#2C2C3A" : "#E5E5EA";
  const tooltip = dark ? "#1C1C28" : "#FFFFFF";

  if (loading) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center", backgroundColor: bg }}>
        <ActivityIndicator color={primary} size="large" />
      </View>
    );
  }

  if (error || data.length === 0) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center", backgroundColor: bg }}>
        <Text style={{ fontSize: 28, marginBottom: 8 }}>📉</Text>
        <Text style={{ color: muted, fontSize: 13 }}>Données indisponibles</Text>
      </View>
    );
  }

  // Recharts need plain objects — our RatePoint already qualifies
  return (
    <View style={{ height, backgroundColor: bg, paddingRight: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={primary} stopOpacity={0.35} />
              <stop offset="95%" stopColor={primary} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fill: muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={52}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => v.toFixed(3)}
          />

          <Tooltip
            contentStyle={{
              background:   tooltip,
              border:       `1px solid ${border}`,
              borderRadius: 10,
              fontSize:     12,
            }}
            labelStyle={{ color: muted, marginBottom: 4 }}
            itemStyle={{ color: primary, fontWeight: 700 }}
            formatter={(v: number) => [v.toFixed(5), to]}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={primary}
            strokeWidth={2}
            fill={`url(#grad-${from}-${to})`}
            dot={false}
            activeDot={{ r: 4, fill: primary }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </View>
  );
}
