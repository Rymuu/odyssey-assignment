import { useRef, type ReactNode } from "react";
import { Animated, Pressable, type ViewStyle, type GestureResponderEvent } from "react-native";

type PressableScaleProps = {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  scaleTo?: number;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
};

/**
 * Pressable avec retour visuel au press : un léger scale (0.98 par défaut)
 * animé en douceur. Donne une sensation tactile "premium" aux éléments
 * cliquables. Animated natif, useNativeDriver: false pour le web.
 */
export function PressableScale({
  children,
  onPress,
  onHoverIn,
  onHoverOut,
  scaleTo = 0.98,
  style,
  disabled = false,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) => {
    Animated.spring(scale, { toValue: to, useNativeDriver: false, speed: 50, bounciness: 4 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}