import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useApp } from "../context/AppContext";

interface Props {
  from: string;
  to: string;
  height?: number;
}

export default function NativeHistoryChart({ from, to, height = 220 }: Props) {
  const { theme, twelveDataKey, darkMode } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const symbol = `${from}/${to}`;
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${twelveDataKey}`;

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.status === "error" || !res.values) {
          throw new Error(res.message);
        }

        const chartData = res.values
          .map((item: any) => ({
            value: parseFloat(item.close),
            label: item.datetime.split("-")[2], // Just the day
          }))
          .reverse();

        setData(chartData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, twelveDataKey]);

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
        <Text style={{ color: theme.muted }}>Graphique indisponible</Text>
      </View>
    );
  }

  return (
    <View style={{ height, paddingRight: 0, paddingLeft: 0 }}>
      <LineChart
        data={data}
        height={height - 60}
        width={Dimensions.get("window").width - 80}
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
        onDataChangeAnimationDuration={300}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
