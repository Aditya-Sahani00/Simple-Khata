import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, G, Line, Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BarData {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: BarData[];
  isDark: boolean;
  height?: number;
}

export default function BarChart({ data, isDark, height = 180 }: Props) {
  const textColor = isDark ? "#90CAF9" : "#546E7A";
  const gridColor = isDark ? "rgba(144,202,249,0.1)" : "rgba(84,110,122,0.1)";
  const incomeColor = "#00C853";
  const expenseColor = "#F44336";

  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = height;
  const paddingLeft = 0;
  const paddingBottom = 28;
  const usableHeight = chartHeight - paddingBottom - 10;

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const barGroupWidth = (chartWidth - paddingLeft) / data.length;
  const barWidth = Math.max(8, barGroupWidth * 0.3);
  const gap = 2;

  const gridLines = 4;

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = 10 + (usableHeight / gridLines) * i;
          return (
            <Line
              key={i}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
          const incomeH = (d.income / maxVal) * usableHeight;
          const expenseH = (d.expense / maxVal) * usableHeight;

          return (
            <G key={i}>
              {/* Income bar */}
              <Rect
                x={x - barWidth - gap}
                y={10 + usableHeight - incomeH}
                width={barWidth}
                height={Math.max(incomeH, 2)}
                rx={3}
                fill={incomeColor}
                opacity={0.9}
              />
              {/* Expense bar */}
              <Rect
                x={x + gap}
                y={10 + usableHeight - expenseH}
                width={barWidth}
                height={Math.max(expenseH, 2)}
                rx={3}
                fill={expenseColor}
                opacity={0.9}
              />
              {/* Label */}
              <SvgText
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize={10}
                fill={textColor}
                fontFamily="Inter_400Regular"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
          <Text style={[styles.legendText, { color: textColor }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
          <Text style={[styles.legendText, { color: textColor }]}>Expense</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
