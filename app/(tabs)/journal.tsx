import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
  Animated,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

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

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
    const unsubscribe = setInterval(loadEntries, 1000); // Refresh every second
    return () => clearInterval(unsubscribe);
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

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const panX = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
        onPanResponderMove: (evt, gestureState) => {
          if (gestureState.dx < 0) {
            panX.setValue(Math.max(gestureState.dx, -80));
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx < -40) {
            Animated.timing(panX, {
              toValue: -80,
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.timing(panX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current;

    return (
      <Animated.View style={[{ transform: [{ translateX: panX }] }]} {...panResponder.panHandlers}>
        <View style={[styles.entryCard, { backgroundColor: surfaceColor, borderColor: accentColor }]}>
          {/* Header with date and shift */}
          <View style={styles.entryHeader}>
            <View style={styles.headerLeft}>
              <Text style={[styles.entryDate, { color: accentColor }]}>{item.date}</Text>
              <Text style={[styles.entryTime, { color: labelColor }]}>
                <Ionicons name="time-outline" size={12} color={labelColor} /> {formatTime(item.timestamp)}
              </Text>
            </View>
        <View style={[styles.shiftBadge, { backgroundColor: accentColor }]}>
          <Text style={[styles.shiftText, { fontSize: 28, fontWeight: "bold" }]}>{item.shift}</Text>
        </View>
          </View>

          {/* Main content */}
          <View style={styles.entryContent}>
            {/* Absent employee */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: labelColor }]}>Nieobecny pracownik</Text>
              <Text style={[styles.employeeName, { color: textColor }]}>{item.absentEmployee}</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: labelColor }]}>Dział:</Text>
                <Text style={[styles.detailValue, { color: accentColor }]}>{item.absentDepartment}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: labelColor }]}>Powód:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{item.reason}</Text>
              </View>
            </View>

            {/* Substitute employee */}
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: labelColor + "30", paddingTop: 12, marginTop: 12 }]}>
              <Text style={[styles.sectionLabel, { color: labelColor }]}>Zastępca</Text>
              <Text style={[styles.employeeName, { color: textColor }]}>{item.substituteEmployee}</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: labelColor }]}>Dział:</Text>
                <Text style={[styles.detailValue, { color: accentColor }]}>{item.substituteDepartment}</Text>
              </View>
              {item.agency && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: labelColor }]}>Agencja:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{item.agency}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Swipe delete background */}
        <View
          style={[styles.swipeDeleteBackground, { position: "absolute", right: 0, top: 0, bottom: 0 }]}
        >
          <Pressable
            onPress={() => deleteEntry(item.id)}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="trash-outline" size={24} color="#FFF" />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

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
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Historia zamian</Text>
          <Text style={[styles.headerSubtitle, { color: labelColor }]}>
            {entries.length} {entries.length === 1 ? "wpis" : entries.length < 5 ? "wpisy" : "wpisów"}
          </Text>
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
  headerSection: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    position: "relative",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 12,
  },
  shiftBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  shiftText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  entryContent: {
    marginBottom: 12,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  swipeDeleteBackground: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
});
