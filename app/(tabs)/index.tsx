import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  FlatList,
  Animated,
  PanResponder,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Colors } from "@/constants/theme";

// GitHub Gist URLs
const EMPLOYEES_URL =
  "https://gist.githubusercontent.com/witalijolchowik-coder/3f56631351c945b27d54f05239ecd7ea/raw/44aa34f8ca86c46927214a259ec981e05621304c/gistfile1.txt";
const AGENCIES_URL =
  "https://gist.githubusercontent.com/witalijolchowik-coder/3f56631351c945b27d54f05239ecd7ea/raw/44aa34f8ca86c46927214a259ec981e05621304c/gistfile2.txt";

// Fallback data
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

const FALLBACK_AGENCIES = [
  { name: "OPUS", email: "olena.opusapt@gmail.com" },
  { name: "Fast Service", email: "v.shepel@fast-service.com.pl" },
  { name: "Topping Work", email: "veranika.dubrouskaya@topping-work.pl" },
  { name: "Work Unit", email: "koordynator-idl@workunit.pl" },
  { name: "MadMax", email: "k.volkova@madmaxwork.pl" },
  { name: "MS Group", email: "v.mutovchy@msgroup.hr" },
];

// Design colors from mockup
const COLORS = {
  background: "#0B1929", // Dark blue background
  surface: "#0B1929", // Same as background for seamless look
  surfaceAlt: "#0B1929", // For input fields
  border: "#1E3A52", // Thin border for inputs
  text: "#FFFFFF", // White text
  textSecondary: "#B3B3B3", // Gray text for labels
  textMuted: "#666666", // Muted gray for absent employee
  accent: "#2196F3", // Blue accent
  accentRed: "#FF3B30", // Red for delete
};

interface Agency {
  name: string;
  email: string;
}

interface JournalEntry {
  id: string;
  date: Date;
  shift: string;
  absentEmployee: string;
  substituteEmployee: string;
  agency?: string;
}

// Autocomplete dropdown component
function AutocompleteDropdown({
  value,
  onChangeText,
  placeholder,
  data,
  onSelect,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  data: string[];
  onSelect: (item: string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredData = data.filter((item) =>
    item.toLowerCase().includes(value.toLowerCase())
  );

  const handleSelectItem = (item: string) => {
    onChangeText(item);
    onSelect(item);
    setShowDropdown(false);
  };

  return (
    <View style={styles.autocompleteContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowDropdown(text.length > 0);
        }}
        placeholder={placeholder}
        placeholderTextColor="#6B6B6B"
        onFocus={() => setShowDropdown(value.length > 0 || data.length > 0)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && filteredData.length > 0 && (
        <View style={styles.dropdownList}>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.dropdownItem}
                onPress={() => handleSelectItem(item)}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Data state
  const [employees, setEmployees] = useState<string[]>(FALLBACK_EMPLOYEES);
  const [agencies, setAgencies] = useState<Agency[]>(FALLBACK_AGENCIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [absentEmployee, setAbsentEmployee] = useState("");
  const [shift, setShift] = useState("D");
  const [substituteEmployee, setSubstituteEmployee] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI state
  const [showAgencyField, setShowAgencyField] = useState(false);
  const [currentPage, setCurrentPage] = useState<"form" | "journal">("form");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
    fetchData();
    loadJournalEntries();
  }, []);

  // Check if substitute is from external agency
  useEffect(() => {
    const isFromList = employees.includes(substituteEmployee);
    setShowAgencyField(!isFromList && substituteEmployee.length > 0);
    if (isFromList) {
      setSelectedAgency("");
    }
  }, [substituteEmployee, employees]);

  const loadCachedData = async () => {
    try {
      const cachedEmployees = await AsyncStorage.getItem("employee_list_cache");
      const cachedAgencies = await AsyncStorage.getItem("agency_list_cache");

      if (cachedEmployees) {
        setEmployees(JSON.parse(cachedEmployees));
      }
      if (cachedAgencies) {
        setAgencies(JSON.parse(cachedAgencies));
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const cached = await AsyncStorage.getItem("journal_entries");
      if (cached) {
        const entries = JSON.parse(cached).map((e: any) => ({
          ...e,
          date: new Date(e.date),
        }));
        setJournalEntries(entries);
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  const saveJournalEntries = async (entries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem("journal_entries", JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving journal entries:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const employeesResponse = await fetch(EMPLOYEES_URL);
      const employeesData = await employeesResponse.json();
      setEmployees(employeesData);
      await AsyncStorage.setItem("employee_list_cache", JSON.stringify(employeesData));

      const agenciesResponse = await fetch(AGENCIES_URL);
      const agenciesData = await agenciesResponse.json();
      setAgencies(agenciesData);
      await AsyncStorage.setItem("agency_list_cache", JSON.stringify(agenciesData));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleSendEmail = () => {
    if (!absentEmployee || !shift || !substituteEmployee) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (showAgencyField && !selectedAgency) {
      alert("Proszę wybrać agencję");
      return;
    }

    const formattedDate = formatDate(date);
    const subject = `Informacje o zastępstwie / ${formattedDate} / ${shift} / Personnel Service`;

    let substituteName = substituteEmployee;
    let agencyEmail = "";

    if (showAgencyField && selectedAgency) {
      const agency = agencies.find((a) => a.name === selectedAgency);
      if (agency) {
        substituteName = `${substituteEmployee} (${agency.name})`;
        agencyEmail = agency.email;
      }
    }

    const body = `Dzień dobry

Chciałbym poinformować, że ${absentEmployee} nie będzie obecny (-a) w pracy ${formattedDate} na zmianie ${shift}. Na jego (-ej) miejsce wejdzie ${substituteName}.

Proszę o uwzględnienie tej zmiany i wprowadzenie odpowiedniej korekty do harmonogramu.

Pozdrawiam,`;

    const toRecipients = [
      "xdr1-lead-out@id-logistics.com",
      "xdr1-flowcontrol@id-logistics.com",
    ];
    const ccRecipients = ["mcal@id-logistics.com"];
    if (agencyEmail) {
      ccRecipients.push(agencyEmail);
    }

    const mailtoUrl = `mailto:${toRecipients.join(",")}?cc=${ccRecipients.join(",")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch((err) => {
      console.error("Error opening email client:", err);
      alert("Nie można otworzyć klienta poczty");
    });

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: date,
      shift: shift,
      absentEmployee: absentEmployee,
      substituteEmployee: substituteEmployee,
      agency: selectedAgency,
    };

    const updatedEntries = [newEntry, ...journalEntries];
    setJournalEntries(updatedEntries);
    saveJournalEntries(updatedEntries);

    setAbsentEmployee("");
    setShift("D");
    setSubstituteEmployee("");
    setSelectedAgency("");
    setDate(new Date());
  };

  const deleteJournalEntry = (id: string) => {
    const updatedEntries = journalEntries.filter((e) => e.id !== id);
    setJournalEntries(updatedEntries);
    saveJournalEntries(updatedEntries);
  };

  if (currentPage === "journal") {
    return (
      <JournalScreen
        entries={journalEntries}
        onDeleteEntry={deleteJournalEntry}
        onBack={() => setCurrentPage("form")}
        insets={insets}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/id-logistics-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header Title */}
        <View style={styles.headerTitleContainer}>
          <Image
            source={require("@/assets/images/header-title.png")}
            style={styles.headerTitle}
            resizeMode="contain"
          />
          <Pressable onPress={handleRefresh} disabled={loading || refreshing} style={styles.refreshButton}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Ionicons name="refresh" size={24} color={COLORS.text} />
            )}
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Absent Employee */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nieobecny pracownik</Text>
            <AutocompleteDropdown
              value={absentEmployee}
              onChangeText={setAbsentEmployee}
              placeholder="Wybierz lub wpisz..."
              data={employees}
              onSelect={setAbsentEmployee}
            />
          </View>

          {/* Shift */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zmiana</Text>
            <View style={styles.segmentedControl}>
              {["D", "M", "N"].map((shiftOption) => (
                <Pressable
                  key={shiftOption}
                  style={[
                    styles.segmentButton,
                    shift === shiftOption && styles.segmentButtonActive,
                  ]}
                  onPress={() => setShift(shiftOption)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      shift === shiftOption && styles.segmentButtonTextActive,
                    ]}
                  >
                    {shiftOption}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Substitute Employee */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zastępca</Text>
            <AutocompleteDropdown
              value={substituteEmployee}
              onChangeText={setSubstituteEmployee}
              placeholder="Wybierz lub wpisz..."
              data={employees}
              onSelect={setSubstituteEmployee}
            />
          </View>

          {/* Agency (conditional) */}
          {showAgencyField && (
            <View style={[styles.fieldContainer, styles.agencyFieldHighlight]}>
              <Text style={styles.label}>Agencja</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAgency}
                  onValueChange={setSelectedAgency}
                  style={styles.picker}
                  dropdownIconColor={COLORS.text}
                >
                  <Picker.Item label="Wybierz agencję..." value="" />
                  {agencies.map((agency) => (
                    <Picker.Item key={agency.name} label={agency.name} value={agency.name} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Data</Text>
            <Pressable
              style={[styles.input, styles.dateInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {/* Send Button */}
          <Pressable
            style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
            onPress={handleSendEmail}
          >
            <Text style={styles.sendButtonText}>Wyślij e-mail</Text>
          </Pressable>

          {/* Journal Button */}
          <Pressable
            style={({ pressed }) => [styles.journalButton, pressed && styles.journalButtonPressed]}
            onPress={() => setCurrentPage("journal")}
          >
            <Text style={styles.journalButtonText}>Dziennik</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// Journal Screen Component
function JournalScreen({
  entries,
  onDeleteEntry,
  onBack,
  insets,
}: {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => void;
  onBack: () => void;
  insets: any;
}) {
  const getMonthName = (date: Date): string => {
    const months = [
      "STYCZEŃ", "LUTY", "MARZEC", "KWIECIEŃ", "MAJ", "CZERWIEC",
      "LIPIEC", "SIERPIEŃ", "WRZESIEŃ", "PAŹDZIERNIK", "LISTOPAD", "GRUDZIEŃ"
    ];
    return months[date.getMonth()];
  };

  const sortedEntries = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <View style={[styles.journalContainer, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={[styles.journalHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.journalHeaderMonth}>
          {sortedEntries.length > 0 ? getMonthName(sortedEntries[0].date) : "LISTOPAD"}
        </Text>
        <Text style={styles.journalHeaderYear}>
          {sortedEntries.length > 0 ? sortedEntries[0].date.getFullYear() : new Date().getFullYear()}
        </Text>
      </View>

      {/* Entries List */}
      <FlatList
        data={sortedEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalEntryCard
            entry={item}
            onDelete={onDeleteEntry}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 20) + 100,
        }}
        scrollEnabled={true}
      />

      {/* Footer Button */}
      <View style={[styles.journalFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={({ pressed }) => [styles.exitButton, pressed && styles.exitButtonPressed]}
          onPress={onBack}
        >
          <Text style={styles.exitButtonText}>Wyjście</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Journal Entry Card Component with Swipe to Delete
function JournalEntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const swipeX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          swipeX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe left - delete
          Animated.timing(swipeX, {
            toValue: -100,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            onDelete(entry.id);
          });
        } else {
          // Reset
          Animated.timing(swipeX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.journalEntryWrapper}>
      {/* Delete background */}
      <View style={styles.journalEntryDeleteBackground}>
        <Ionicons name="trash" size={24} color="#FFFFFF" />
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[
          styles.journalEntryCard,
          {
            transform: [{ translateX: swipeX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.journalEntryContent}>
          <View style={styles.journalEntryLeft}>
            <Text style={styles.journalEntryDate}>
              {entry.date.getDate()}
            </Text>
            <Text style={styles.journalEntryShift}>{entry.shift}</Text>
          </View>
          <View style={styles.journalEntryRight}>
            <Text style={styles.journalEntryAbsent}>
              {entry.absentEmployee}
            </Text>
            <Text style={styles.journalEntrySubstitute}>
              {entry.substituteEmployee}
              {entry.agency ? ` (${entry.agency})` : ""}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  headerTitle: {
    flex: 1,
    height: 120,
    width: "100%",
  },
  refreshButton: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 8,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.text,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 1,
  },
  dropdownList: {
    borderRadius: 8,
    marginTop: -4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
    backgroundColor: COLORS.surfaceAlt,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: "hidden",
    minHeight: 56,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  picker: {
    height: 56,
    color: COLORS.text,
  },
  agencyFieldHighlight: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 8,
    padding: 8,
    backgroundColor: COLORS.surfaceAlt,
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    marginTop: 8,
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  sendButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  journalButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    marginTop: 8,
  },
  journalButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  journalButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  segmentButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  segmentButtonTextActive: {
    color: COLORS.text,
  },
  // Journal Screen Styles
  journalContainer: {
    flex: 1,
  },
  journalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  journalHeaderMonth: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  journalHeaderYear: {
    fontSize: 14,
    marginTop: 4,
    color: COLORS.text,
  },
  journalEntryWrapper: {
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  journalEntryCard: {
    backgroundColor: "#1A2A3F",
    borderRadius: 12,
    overflow: "hidden",
  },
  journalEntryDeleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: COLORS.accentRed,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  journalEntryContent: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  journalEntryLeft: {
    alignItems: "center",
    minWidth: 60,
  },
  journalEntryDate: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  journalEntryShift: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.accent,
    marginTop: 4,
  },
  journalEntryRight: {
    flex: 1,
    justifyContent: "center",
  },
  journalEntryAbsent: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.textMuted,
  },
  journalEntrySubstitute: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  journalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  exitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  exitButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  exitButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
});
