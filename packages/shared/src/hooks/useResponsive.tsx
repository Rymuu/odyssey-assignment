import { useWindowDimensions } from "react-native";
import { spacing } from "../theme/tokens";

export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * Hook responsive : expose la largeur, le breakpoint courant, et des
 * valeurs adaptatives (padding) pour construire des layouts qui respirent
 * sur petit écran sans comprimer le contenu.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();

  const breakpoint: Breakpoint = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  const isMobile = breakpoint === "mobile";

  // Padding de page adaptatif : plus serré sur mobile pour gagner de l'espace
  const pagePadding = isMobile ? spacing.lg : spacing["3xl"];

  return { width, breakpoint, isMobile, pagePadding };
}