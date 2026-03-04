import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

interface CustomSplashScreenProps {
  onComplete?: () => void;
}

export function CustomSplashScreen({ onComplete }: CustomSplashScreenProps) {
  useEffect(() => {
    // Simple timeout - no animations, no state changes
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/header-combined.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
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
    width: 280,
    height: 140,
  },
});
