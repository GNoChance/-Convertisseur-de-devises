import { ComponentType } from "react";

interface HistoryChartProps {
  from:    string;
  to:      string;
  dark:    boolean;
  primary: string;
  height?: number;
}

declare const HistoryChart: ComponentType<HistoryChartProps>;
export default HistoryChart;
