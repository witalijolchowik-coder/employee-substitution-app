import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const FALLBACK_EMPLOYEES = [
  "Dzina Siarbolina",
  "Robel Daniel Eticha",
  "Oleksandr Osetynskyi",
  "Nataliia Sira",
  "Iryna Podakina",
  "Denys Pidrivnyi",
  "Tetiana Holovchenko",
  "Ivan Panasiuk",
  "Valeriia Mysniaieva",
  "Andrii Potiiev",
  "Kateryna Naumchuk",
  "Karyna Nelina",
  "Andrii Stovbchatyi",
  "Artem Fedoreikov",
];

export default function StatystykaScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const accentColor = "#2196F3";
  const labelColor = "#A0A0A0";

  const [statistics, setStatistics] = useState<Record<string, { zastepca: number; nieobecny: number }>>({});
  const [employees, setEmployees] = useState<string[]>(FALLBACK_EMPLOYEES);
  const [loading, setLoading] = useState(true);

  // Load statistics when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesList = await AsyncStorage.getItem("employees_list");
      if (employeesList) {
        const parsed = JSON.parse(employeesList);
        const names = parsed.map((emp: any) => emp.name);
        setEmployees(names);
      } else {
        setEmployees(FALLBACK_EMPLOYEES);
      }

      // Load and calculate statistics
      const journalEntries = await AsyncStorage.getItem("journal_entries") || "[]";
      const entries = JSON.parse(journalEntries);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const stats: Record<string, { zastepca: number; nieobecny: number }> = {};
      
      entries.forEach((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
          // Count substitute employee if they are in our employee list
          if (entry.substituteEmployee) {
            const isInList = FALLBACK_EMPLOYEES.includes(entry.substituteEmployee) || 
                           employees.includes(entry.substituteEmployee);
            if (isInList) {
              if (!stats[entry.substituteEmployee]) {
                stats[entry.substituteEmployee] = { zastepca: 0, nieobecny: 0 };
              }
              stats[entry.substituteEmployee].zastepca++;
            }
          }
          
          // Count absent employee if they are in our employee list
          if (entry.absentEmployee) {
            const isInList = FALLBACK_EMPLOYEES.includes(entry.absentEmployee) || 
                           employees.includes(entry.absentEmployee);
            if (isInList) {
              if (!stats[entry.absentEmployee]) {
                stats[entry.absentEmployee] = { zastepca: 0, nieobecny: 0 };
              }
              stats[entry.absentEmployee].nieobecny++;
            }
          }
        }
      });
      
      setStatistics(stats);
    } catch (error) {
      console.error("[Statystyka] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: accentColor }]}>Statystyka miesiąca</Text>
          <Text style={[styles.subtitle, { color: labelColor }]}>
            {new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : Object.keys(statistics).length > 0 ? (
          <View style={[styles.statisticsCard, { backgroundColor: surfaceColor }]}>
            {Object.entries(statistics)
              .sort((a, b) => b[1].zastepca + b[1].nieobecny - (a[1].zastepca + a[1].nieobecny))
              .map(([name, stats]) => (
                (stats.zastepca > 0 || stats.nieobecny > 0) && (
                  <View key={name} style={styles.statisticsRow}>
                    <Text style={[styles.employeeName, { color: textColor }]}>{name}</Text>
                    <View style={styles.statisticsValues}>
                      {stats.zastepca > 0 && (
                        <View style={styles.statItem}>
                          <Text style={styles.greenTriangle}>▲</Text>
                          <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
                            {stats.zastepca}
                          </Text>
                        </View>
                      )}
                      {stats.nieobecny > 0 && (
                        <View style={styles.statItem}>
                          <Text style={styles.redTriangle}>▼</Text>
                          <Text style={[styles.statNumber, { color: "#FF3B30" }]}>
                            {stats.nieobecny}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              ))}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.emptyText, { color: labelColor }]}>
              Brak danych dla tego miesiąca
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  statisticsCard: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statisticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  statisticsValues: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greenTriangle: {
    fontSize: 18,
    color: "#4CAF50",
  },
  redTriangle: {
    fontSize: 18,
    color: "#FF3B30",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
