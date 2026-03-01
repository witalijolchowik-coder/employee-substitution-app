import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface CustomSplashScreenProps {
  onComplete?: () => void;
}

export function CustomSplashScreen({ onComplete }: CustomSplashScreenProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Fade out after 1.2 seconds (1000ms splash + 200ms delay before fade)
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        onComplete?.();
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={require("@/assets/images/header-combined.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1929",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
