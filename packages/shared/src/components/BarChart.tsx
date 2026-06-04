import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";
import { colors, spacing, radius } from "../theme/tokens";
import { Text } from "./Text";

export type BarDatum = { label: string; value: number };

type BarChartProps = {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function BarChart({ data, height = 240, formatValue = (v) => String(v) }: BarChartProps) {
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  // progression d'animation 0->1, pilotée par requestAnimationFrame
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 700;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padding = 32;
  const chartW = Math.max(width - padding * 2, 0);
  const chartH = height - padding * 2;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barGap = 10;
  const barWidth = data.length > 0 ? (chartW - barGap * (data.length - 1)) / data.length : 0;

  const tooltipFor = (i: number) => {
    const fullHeight = (data[i].value / maxValue) * chartH;
    const x = padding + i * (barWidth + barGap) + barWidth / 2;
    const y = padding + (chartH - fullHeight);
    return { x, y };
  };

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={padding} y1={padding + chartH} x2={width - padding} y2={padding + chartH} stroke={colors.border} strokeWidth={1} />
          {data.map((d, i) => {
            const fullHeight = (d.value / maxValue) * chartH;
            const h = fullHeight * progress;
            const x = padding + i * (barWidth + barGap);
            const y = padding + chartH - h;
            const isHovered = hovered === i;
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={6}
                fill={isHovered ? colors.primaryHover : colors.primary}
                // @ts-expect-error events web (hover) supportés sur RN Web
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </Svg>
      ) : null}

      {hovered !== null && width > 0 ? (
        <View
          style={[styles.tooltip, { left: Math.max(0, Math.min(tooltipFor(hovered).x - 50, width - 100)), top: Math.max(0, tooltipFor(hovered).y - 48) }]}
          pointerEvents="none"
        >
          <Text variant="caption" tone="muted">{data[hovered].label}</Text>
          <Text variant="label" weight="bold">{formatValue(data[hovered].value)}</Text>
        </View>
      ) : null}

      <View style={[styles.labels, { paddingHorizontal: padding }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.labelCol}>
            <Text variant="caption" tone={hovered === i ? "primary" : "muted"} weight={hovered === i ? "semibold" : "regular"}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  labelCol: { flex: 1, alignItems: "center" },
  tooltip: {
    position: "absolute", width: 100,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    alignItems: "center", zIndex: 10,
  },
});