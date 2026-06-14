import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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

type EmployeeStats = {
  zastepca: number;
  nieobecny: number;
};

type SummaryStats = {
  internal: number;
  external: number;
};

type JournalEntry = {
  date?: string;
  absentEmployee?: string;
  substituteEmployee?: string;
  agency?: string;
  timestamp?: number;
};

const HOURS_PER_REPLACEMENT = 12;

export default function StatystykaScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const accentColor = "#2196F3";
  const labelColor = "#A0A0A0";

  const [statistics, setStatistics] = useState<Record<string, EmployeeStats>>({});
  const [summary, setSummary] = useState<SummaryStats>({ internal: 0, external: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const parseEntryDate = (entry: JournalEntry) => {
    if (entry.date) {
      const [day, month, year] = entry.date.split(".").map(Number);
      if (day && month && year) {
        return new Date(year, month - 1, day, 12, 0, 0, 0);
      }
    }

    if (entry.timestamp) {
      return new Date(entry.timestamp);
    }

    return null;
  };

  const ensureEmployeeStats = (stats: Record<string, EmployeeStats>, name: string) => {
    if (!stats[name]) {
      stats[name] = { zastepca: 0, nieobecny: 0 };
    }
    return stats[name];
  };

  const loadEmployeeNames = async () => {
    const employeesList = await AsyncStorage.getItem("employees_list");
    if (!employeesList) {
      return FALLBACK_EMPLOYEES;
    }

    const parsed = JSON.parse(employeesList);
    const names = parsed
      .filter((employee: any) => !employee.isExternal && employee.name)
      .map((employee: any) => String(employee.name).trim())
      .filter(Boolean);

    return names.length > 0 ? names : FALLBACK_EMPLOYEES;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const employeeNames = await loadEmployeeNames();
      const employeeSet = new Set(employeeNames.map((name) => name.toLowerCase()));
      const journalEntries = (await AsyncStorage.getItem("journal_entries")) || "[]";
      const entries: JournalEntry[] = JSON.parse(journalEntries);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const nextStats: Record<string, EmployeeStats> = {};
      const nextSummary: SummaryStats = { internal: 0, external: 0 };

      entries.forEach((entry) => {
        const entryDate = parseEntryDate(entry);
        if (!entryDate) {
          return;
        }

        if (entryDate.getMonth() !== currentMonth || entryDate.getFullYear() !== currentYear) {
          return;
        }

        const absentEmployee = entry.absentEmployee?.trim();
        const substituteEmployee = entry.substituteEmployee?.trim();
        const absentIsOurs = Boolean(absentEmployee && employeeSet.has(absentEmployee.toLowerCase()));
        const substituteIsOurs = Boolean(substituteEmployee && employeeSet.has(substituteEmployee.toLowerCase()));

        if (absentEmployee && absentIsOurs) {
          ensureEmployeeStats(nextStats, absentEmployee).nieobecny += 1;
        }

        if (substituteEmployee && substituteIsOurs) {
          ensureEmployeeStats(nextStats, substituteEmployee).zastepca += 1;
        }

        if (absentIsOurs) {
          if (substituteIsOurs && !entry.agency) {
            nextSummary.internal += 1;
          } else {
            nextSummary.external += 1;
          }
        }
      });

      setStatistics(nextStats);
      setSummary(nextSummary);
    } catch (error) {
      console.error("[Statystyka] Error loading data:", error);
      setStatistics({});
      setSummary({ internal: 0, external: 0 });
    } finally {
      setLoading(false);
    }
  };

  const sortedEmployees = Object.entries(statistics)
    .filter(([, stats]) => stats.zastepca > 0 || stats.nieobecny > 0)
    .sort(([nameA, statsA], [nameB, statsB]) => {
      const balanceA = statsA.zastepca - statsA.nieobecny;
      const balanceB = statsB.zastepca - statsB.nieobecny;
      const totalA = statsA.zastepca + statsA.nieobecny;
      const totalB = statsB.zastepca + statsB.nieobecny;

      if (balanceA !== balanceB) {
        return balanceB - balanceA;
      }

      if (totalA !== totalB) {
        return totalB - totalA;
      }

      return nameA.localeCompare(nameB, "pl");
    });

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: accentColor }]}>Statystyka miesiaca</Text>
          <Text style={[styles.subtitle, { color: labelColor }]}>
            {new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Wewnatrz agencji"
                count={summary.internal}
                icon="people-outline"
                accentColor="#4CAF50"
              />
              <SummaryCard
                title="Na inne agencje"
                count={summary.external}
                icon="business-outline"
                accentColor="#FFB020"
              />
            </View>

            {sortedEmployees.length > 0 ? (
              <View style={styles.employeeList}>
                {sortedEmployees.map(([name, stats]) => (
                  <EmployeeStatCard key={name} name={name} stats={stats} />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: surfaceColor }]}>
                <Text style={[styles.emptyText, { color: labelColor }]}>
                  Brak danych dla tego miesiaca
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  title,
  count,
  icon,
  accentColor,
}: {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${accentColor}20` }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryValue}>
          {count} ({count * HOURS_PER_REPLACEMENT} h)
        </Text>
      </View>
    </View>
  );
}

function EmployeeStatCard({ name, stats }: { name: string; stats: EmployeeStats }) {
  const balance = stats.zastepca - stats.nieobecny;
  const balanceColor = balance >= 0 ? "#4CAF50" : "#FF3B30";

  return (
    <View style={styles.employeeCard}>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{name}</Text>
        <Text style={[styles.balanceText, { color: balanceColor }]}>
          Bilans: {balance > 0 ? `+${balance}` : balance}
        </Text>
      </View>

      <View style={styles.statsGroup}>
        {stats.zastepca > 0 && (
          <View style={[styles.statBadge, styles.greenBadge]}>
            <Ionicons name="caret-up" size={18} color="#4CAF50" />
            <Text style={[styles.statNumber, { color: "#4CAF50" }]}>{stats.zastepca}</Text>
          </View>
        )}
        {stats.nieobecny > 0 && (
          <View style={[styles.statBadge, styles.redBadge]}>
            <Ionicons name="caret-down" size={18} color="#FF3B30" />
            <Text style={[styles.statNumber, { color: "#FF3B30" }]}>{stats.nieobecny}</Text>
          </View>
        )}
      </View>
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
    paddingTop: 12,
    gap: 14,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: "#1A2F47",
    padding: 12,
    gap: 10,
    justifyContent: "space-between",
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    gap: 4,
  },
  summaryTitle: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#E8E8E8",
    fontSize: 19,
    fontWeight: "800",
  },
  employeeList: {
    gap: 10,
  },
  employeeCard: {
    minHeight: 74,
    borderRadius: 8,
    backgroundColor: "#1A2F47",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  employeeInfo: {
    flex: 1,
    gap: 5,
  },
  employeeName: {
    color: "#E8E8E8",
    fontSize: 16,
    fontWeight: "700",
  },
  balanceText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statsGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statBadge: {
    minWidth: 48,
    height: 38,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  greenBadge: {
    backgroundColor: "rgba(76,175,80,0.12)",
  },
  redBadge: {
    backgroundColor: "rgba(255,59,48,0.12)",
  },
  statNumber: {
    fontSize: 17,
    fontWeight: "800",
  },
  emptyContainer: {
    borderRadius: 8,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
