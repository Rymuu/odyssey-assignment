import { Platform } from "react-native";
export const colors = {
  background: "#FBF8F5", surface: "#FFFFFF", surfaceAlt: "#F6F1EC",
  text: "#2A2521", textMuted: "#9A918B", textSubtle: "#C7BEB6",
  border: "#EFE9E3", borderStrong: "#E2D9D1",
  primary: "#EF8268", primaryHover: "#E06A4E", primaryLight: "#FBEDE7", primaryText: "#C2563B",
  successBg: "#E3F6EA", successFg: "#3E9D6B", successBorder: "#A8E2C0",
  warningBg: "#FCF0D9", warningFg: "#C68A2E", warningBorder: "#F2D596",
  errorBg: "#FDE7E1", errorFg: "#D65F45", errorBorder: "#F7C2B4",
  infoBg: "#E6EFFA", infoFg: "#5683C4", infoBorder: "#BFD5F0",
  white: "#FFFFFF",
} as const;
export const typography = {
  // Famille de police. Police système par OS (pas de dépendance externe).
  fontFamily: {
    base: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    }) as string,
  },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, "2xl": 28, display: 36 },
  fontWeight: { regular: "400" as const, medium: "500" as const, semibold: "600" as const, bold: "700" as const },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
} as const;
export const spacing = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40, "5xl": 48, "6xl": 64 } as const;
export const radius = { none: 0, sm: 6, md: 10, lg: 14, xl: 20, full: 9999 } as const;
export const shadows = {
  none: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: "#2A2521", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: "#2A2521", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  lg: { shadowColor: "#2A2521", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
} as const;
export const theme = { colors, typography, spacing, radius, shadows } as const;
export type Theme = typeof theme;