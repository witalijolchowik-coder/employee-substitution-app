import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";

interface JournalEntry {
  id: string;
  date: string;
  absentEmployee: string;
  absentDepartment: string;
  shift: string;
  substituteEmployee: string;
  substituteDepartment: string;
  reason: string;
  agency?: string;
  timestamp: number;
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();

  // Unified deep dark blue theme
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const labelColor = "#A0A0A0";
  const accentColor = "#2196F3";
  const dangerColor = "#FF3B30";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload entries when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem("journal_entries");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by timestamp descending (newest first)
        const sorted = parsed.sort((a: JournalEntry, b: JournalEntry) => b.timestamp - a.timestamp);
        setEntries(sorted);
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    Alert.alert(
      "Usuń wpis",
      "Czy na pewno chcesz usunąć ten wpis?",
      [
        { text: "Anuluj", onPress: () => {}, style: "cancel" },
        {
          text: "Usuń",
          onPress: async () => {
            try {
              const updated = entries.filter((e) => e.id !== id);
              setEntries(updated);
              await AsyncStorage.setItem("journal_entries", JSON.stringify(updated));
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Błąd", "Nie udało się usunąć wpisu");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const [day, month, year] = dateString.split(".");
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <View style={[styles.entryCard, { backgroundColor: surfaceColor, borderColor: accentColor }]}>
      {/* Top Row: Date, Time, Shift */}
      <View style={styles.entryHeader}>
        <View style={styles.dateTimeSection}>
          <Text style={[styles.entryDate, { color: accentColor }]}>{item.date}</Text>
          <Text style={[styles.entryTime, { color: labelColor }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={[styles.shiftBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.shiftText}>{item.shift}</Text>
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteEntry(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={dangerColor} />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: "#2C2C2C" }]} />

      {/* Absent Employee Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: labelColor }]}>Nieobecny</Text>
        <Text style={[styles.employeeName, { color: textColor }]}>{item.absentEmployee}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: labelColor }]}>Dział:</Text>
            <Text style={[styles.detailValue, { color: accentColor }]}>{item.absentDepartment}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: labelColor }]}>Powód:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{item.reason}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: "#2C2C2C" }]} />

      {/* Substitute Employee Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: labelColor }]}>Zastępca</Text>
        <Text style={[styles.employeeName, { color: textColor }]}>{item.substituteEmployee}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: labelColor }]}>Dział:</Text>
            <Text style={[styles.detailValue, { color: accentColor }]}>{item.substituteDepartment}</Text>
          </View>
          {item.agency && (
            <View style={styles.detail}>
              <Text style={[styles.detailLabel, { color: labelColor }]}>Agencja:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{item.agency}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 80),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="document-text-outline" size={28} color={accentColor} />
          <Text style={[styles.headerTitle, { color: textColor }]}>Historia zamian</Text>
          {entries.length > 0 && (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{entries.length}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: labelColor }]}>Ładowanie...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={labelColor} />
            <Text style={[styles.emptyText, { color: labelColor }]}>Brak wpisów w historii</Text>
            <Text style={[styles.emptySubtext, { color: labelColor }]}>
              Tutaj pojawią się Twoje zamiany
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateTimeSection: {
    flex: 1,
  },
  entryDate: {
    fontSize: 15,
    fontWeight: "700",
  },
  entryTime: {
    fontSize: 12,
    marginTop: 2,
  },
  shiftBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    minWidth: 44,
    alignItems: "center",
  },
  shiftText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
