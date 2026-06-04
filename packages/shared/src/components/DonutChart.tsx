import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, spacing, radius } from "../theme/tokens";
import { Text } from "./Text";

export type DonutSegment = { label: string; value: number; color: string };

type DonutChartProps = {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Donut chart en SVG : segments colorés, hover pour mettre en avant + centre dynamique.
export function DonutChart({ data, size = 200, thickness = 28 }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  // Calcul des angles cumulés
  let angle = 0;
  const segments = data.map((seg) => {
    const sweep = (seg.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...seg, start, end, sweep };
  });

  // Au centre : total, ou détail du segment survolé
  const centerLabel = hovered !== null ? data[hovered].label : "Total";
  const centerValue = hovered !== null ? String(data[hovered].value) : String(total);

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* piste de fond */}
          <Circle cx={cx} cy={cy} r={r} stroke={colors.surfaceAlt} strokeWidth={thickness} fill="none" />
          {segments.map((seg, i) => {
            const isHovered = hovered === i;
            // léger agrandissement du trait au survol
            const sw = isHovered ? thickness + 4 : thickness;
            // éviter un arc de 360° exact (bug de rendu) -> on plafonne
            const end = seg.sweep >= 359.9 ? seg.start + 359.9 : seg.end;
            return (
              <Path
                key={i}
                d={arcPath(cx, cy, r, seg.start, end)}
                stroke={seg.color}
                strokeWidth={sw}
                strokeLinecap="butt"
                fill="none"
                opacity={hovered === null || isHovered ? 1 : 0.4}
                // @ts-expect-error events web (hover) supportés sur RN Web
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </Svg>
        {/* Centre */}
        <View style={[styles.center, { pointerEvents: "none" }]}>
          <Text variant="caption" tone="muted">{centerLabel}</Text>
          <Text variant="title" weight="bold">{centerValue}</Text>
        </View>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        {data.map((seg, i) => (
          <Pressable
            key={i}
            style={styles.legendItem}
            onHoverIn={() => setHovered(i)}
            onHoverOut={() => setHovered(null)}
          >
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text variant="caption" tone={hovered === i ? "default" : "muted"} weight={hovered === i ? "semibold" : "regular"}>
              {seg.label}
            </Text>
            <Text variant="caption" tone="subtle">{seg.value}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: spacing["2xl"], flexWrap: "wrap" },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  legend: { gap: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  legendDot: { width: 12, height: 12, borderRadius: radius.full },
});