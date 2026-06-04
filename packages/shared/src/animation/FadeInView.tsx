import { useEffect, useRef, type ReactNode } from "react";
import { Animated, type ViewStyle } from "react-native";

type FadeInViewProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  style?: ViewStyle | ViewStyle[];
};

/**
 * Wrapper d'animation d'entrée : fade (opacity 0->1) + translateY léger
 * + scale subtil (0.98->1). Utilise l'Animated natif (useNativeDriver: false
 * pour la compatibilité react-native-web). Le `delay` permet de créer un
 * effet de stagger entre plusieurs sections.
 */
export function FadeInView({ children, delay = 0, duration = 450, offsetY = 10, style }: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay, duration]);

  const opacity = progress;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}>
      {children}
    </Animated.View>
  );
}