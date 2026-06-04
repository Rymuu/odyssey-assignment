import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Link, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, Text } from "@odyssey/shared";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Feather.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/", icon: "home" },
  { label: "Commandes", href: "/orders", icon: "shopping-bag" },
  { label: "Clients", href: "/crm", icon: "users" },
  { label: "Menu", href: "/menu", icon: "book-open" },
  { label: "Paramètres", href: "/settings", icon: "settings" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const bg = active ? colors.primaryLight : hovered ? colors.surfaceAlt : "transparent";
  const fg = active ? colors.primaryText : colors.text;

  // IMPORTANT : <Link asChild> passe par un Slot qui refuse les styles en tableau.
  // On aplatit donc le style avant de le passer au Pressable enfant.
  const pressableStyle = StyleSheet.flatten([styles.navItem, { backgroundColor: bg }]);

  return (
    <Link href={item.href} asChild>
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={pressableStyle}
      >
        <Feather name={item.icon} size={18} color={fg} />
        <Text style={{ color: fg }} weight={active ? "semibold" : "regular"}>
          {item.label}
        </Text>
      </Pressable>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          <Feather name="coffee" size={20} color={colors.white} />
        </View>
        <Text variant="heading" weight="bold">Odyssey</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <NavLink key={item.href} item={item} active={active} />;
        })}
      </View>

      <View style={styles.footer}>
        <NavLink
          item={{ label: "Design System", href: "/ui", icon: "grid" }}
          active={pathname.startsWith("/ui")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
    gap: spacing["2xl"],
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { gap: spacing.xs, flex: 1 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
});