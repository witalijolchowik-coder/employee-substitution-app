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
    // Fade out after 1.5 seconds (fixed delay, no waiting for image load)
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        onComplete?.();
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/header-combined.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
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
  logoContainer: {
    width: 280,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logo: {
    width: 280,
    height: 140,
  },
});
