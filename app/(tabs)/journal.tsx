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
import { useRouter } from "expo-router";

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
  const router = useRouter();

  // Unified deep dark blue theme
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const labelColor = "#A0A0A0";
  const accentColor = "#2196F3";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

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
    <View style={[styles.entryCard, { backgroundColor: surfaceColor }]}>
      <View style={styles.entryHeader}>
        <View style={styles.entryDateSection}>
          <Text style={[styles.entryDate, { color: accentColor }]}>{item.date}</Text>
          <Text style={[styles.entryTime, { color: labelColor }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={styles.entryShift}>
          <Text style={[styles.shiftBadge, { backgroundColor: accentColor }]}>{item.shift}</Text>
        </View>
      </View>

      <View style={styles.entryBody}>
        <View style={styles.entryRow}>
          <Text style={[styles.entryLabel, { color: labelColor }]}>Nieobecny:</Text>
          <Text style={[styles.entryValue, { color: textColor }]}>
            {item.absentEmployee} ({item.absentDepartment})
          </Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={[styles.entryLabel, { color: labelColor }]}>Powód:</Text>
          <Text style={[styles.entryValue, { color: textColor }]}>{item.reason}</Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={[styles.entryLabel, { color: labelColor }]}>Zastępca:</Text>
          <Text style={[styles.entryValue, { color: textColor }]}>
            {item.substituteEmployee} ({item.substituteDepartment})
            {item.agency && ` - ${item.agency}`}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteEntry(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </Pressable>
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
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={accentColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>История замин</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        {loading ? (
          <Text style={[styles.emptyText, { color: labelColor }]}>Ładowanie...</Text>
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
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  entryCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  entryDateSection: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "700",
  },
  entryTime: {
    fontSize: 12,
    marginTop: 2,
  },
  entryShift: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shiftBadge: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  entryBody: {
    gap: 8,
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  entryLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 70,
  },
  entryValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  deleteButton: {
    alignSelf: "flex-end",
    padding: 8,
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
