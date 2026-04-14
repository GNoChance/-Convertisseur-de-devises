// HistoryChart.native.tsx — version iOS / Android (lightweight-charts via WebView)
// Metro Bundler / Expo charge automatiquement ce fichier sur native.

import { ActivityIndicator, View } from "react-native";
import { WebView as WebViewNative } from "react-native-webview";

interface Props {
  from:    string;
  to:      string;
  dark:    boolean;
  primary: string;
  height?: number;
}

function buildHtml(from: string, to: string, dark: boolean, primary: string): string {
  const bg        = dark ? "#0F0F14" : "#FFFFFF";
  const textColor = dark ? "#E5E5EA" : "#1C1C1E";
  const muted     = dark ? "#636366" : "#8E8E93";
  const grid      = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const areaTop   = primary + "55";
  const areaBot   = primary + "00";

  const safeFrom = from.replace(/[^A-Z]/g, "").slice(0, 3);
  const safeTo   = to.replace(/[^A-Z]/g, "").slice(0, 3);

  const now   = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString().split("T")[0];
  const endStr   = now.toISOString().split("T")[0];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <script src="https://unpkg.com/lightweight-charts@5.1.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    * { margin:0;padding:0;box-sizing:border-box; }
    html,body { width:100%;height:100%;background:${bg};overflow:hidden;touch-action:none;user-select:none;font-family:-apple-system,sans-serif; }
    #chart { width:100vw;height:100vh;touch-action:none; }
    #loader { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px; }
    #loader-txt { color:${muted};font-size:13px; }
    #err { display:none;position:absolute;inset:0;display:none;align-items:center;justify-content:center; }
    #err-txt { color:#FF3B30;font-size:13px; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <div id="loader"><div style="font-size:24px">📈</div><div id="loader-txt">Chargement…</div></div>
  <div id="err"><div id="err-txt">Données indisponibles</div></div>
  <script>
    const chart = LightweightCharts.createChart(document.getElementById('chart'), {
      width: window.innerWidth, height: window.innerHeight,
      layout: { background: { type:'solid', color:'${bg}' }, textColor:'${textColor}' },
      grid: { vertLines:{ color:'${grid}' }, horzLines:{ color:'${grid}' } },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      rightPriceScale: { borderColor:'${grid}' },
      timeScale: { borderColor:'${grid}', fixLeftEdge:true, fixRightEdge:true },
      handleScroll: { horzTouchDrag:true },
      handleScale:  { pinch:true },
    });
    const series = chart.addAreaSeries({
      lineColor:'${primary}', topColor:'${areaTop}', bottomColor:'${areaBot}',
      lineWidth:2, priceFormat:{ type:'price', precision:5, minMove:0.00001 },
    });
    window.addEventListener('resize', () => chart.applyOptions({ width:window.innerWidth, height:window.innerHeight }));

    fetch('https://api.frankfurter.app/${startStr}..${endStr}?from=${safeFrom}&to=${safeTo}')
      .then(r => { if(!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        document.getElementById('loader').style.display = 'none';
        const pts = Object.entries(data.rates||{})
          .map(([date, r]) => ({ time:date, value:r['${safeTo}'] }))
          .filter(p => p.value!=null)
          .sort((a,b) => a.time < b.time ? -1 : 1);
        series.setData(pts);
        chart.timeScale().fitContent();
      })
      .catch(() => {
        document.getElementById('loader').style.display = 'none';
        const e = document.getElementById('err');
        e.style.display = 'flex';
      });
  </script>
</body>
</html>`;
}

export default function HistoryChart({ from, to, dark, primary, height = 220 }: Props) {
  return (
    <View style={{ height, position: "relative" }}>
      <WebViewNative
        style={{ flex: 1 }}
        source={{ html: buildHtml(from, to, dark, primary) }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        overScrollMode="never"
      />
    </View>
  );
}
