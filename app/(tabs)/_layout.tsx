import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        // Ensure tab bar respects bottom safe area for devices with home indicators
        tabBarStyle: {
          paddingBottom: insets.bottom,
          height: 49 + insets.bottom, // Default tab bar height (49) + safe area
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: "#2C2C2C",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Formularz",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Historia",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: "Pracownicy",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
