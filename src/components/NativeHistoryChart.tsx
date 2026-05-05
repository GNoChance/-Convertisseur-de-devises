import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useApp } from "../context/AppContext";

interface Props {
  from: string;
  to: string;
  height?: number;
  period?: string;
}

export default function NativeHistoryChart({ from, to, height = 220, period = "1M" }: Props) {
  const { theme } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    // Calcul de la date de début selon la période
    const now = new Date();
    const start = new Date(now);
    if      (period === "1W") start.setDate(now.getDate() - 7);
    else if (period === "1M") start.setMonth(now.getMonth() - 1);
    else if (period === "3M") start.setMonth(now.getMonth() - 3);
    else if (period === "6M") start.setMonth(now.getMonth() - 6);
    else                      start.setFullYear(now.getFullYear() - 1);

    const startStr = start.toISOString().split("T")[0];
    const endStr   = now.toISOString().split("T")[0];

    // Frankfurter API call
    const url = `https://api.frankfurter.app/${startStr}..?from=${from}&to=${to}`;

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.rates) throw new Error("No rates found");

        const chartData = Object.entries(res.rates).map(([date, rates]: any) => ({
          value: rates[to],
          label: date.split("-")[2], // Day of month
        }));

        if (chartData.length === 0) throw new Error("Empty data");
        
        setData(chartData);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, period]);

  if (loading) {
    return (
      <View style={[s.center, { height }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (error || data.length === 0) {
    return (
      <View style={[s.center, { height }]}>
        <Text style={{ color: theme.muted }}>Graphique indisponible pour cette paire</Text>
      </View>
    );
  }

  return (
    <View style={{ height, paddingRight: 0, paddingLeft: 0 }}>
      <LineChart
        data={data}
        height={height - 60}
        width={Dimensions.get("window").width - 40}
        initialSpacing={10}
        color={theme.primary}
        thickness={3}
        hideDataPoints
        noOfSections={4}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: theme.muted, fontSize: 10 }}
        areaChart
        startFillColor={theme.primary}
        startOpacity={0.2}
        endOpacity={0.05}
        curved
        animateOnDataChange
        animationDuration={1000}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
