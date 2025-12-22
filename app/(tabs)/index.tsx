import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
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

interface Agency {
  name: string;
  email: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // Data state
  const [employees, setEmployees] = useState<string[]>(FALLBACK_EMPLOYEES);
  const [agencies, setAgencies] = useState<Agency[]>(FALLBACK_AGENCIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [absentEmployee, setAbsentEmployee] = useState("");
  const [absentEmployeeInput, setAbsentEmployeeInput] = useState("");
  const [shift, setShift] = useState("D");
  const [substituteEmployee, setSubstituteEmployee] = useState("");
  const [substituteEmployeeInput, setSubstituteEmployeeInput] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI state
  const [showAbsentDropdown, setShowAbsentDropdown] = useState(false);
  const [showSubstituteDropdown, setShowSubstituteDropdown] = useState(false);
  const [showAgencyField, setShowAgencyField] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
    fetchData();
  }, []);

  // Check if substitute is from external agency
  useEffect(() => {
    const isFromList = employees.includes(substituteEmployeeInput);
    setShowAgencyField(!isFromList && substituteEmployeeInput.length > 0);
    if (isFromList) {
      setSelectedAgency("");
    }
  }, [substituteEmployeeInput, employees]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const employeesResponse = await fetch(EMPLOYEES_URL);
      const employeesData = await employeesResponse.json();
      setEmployees(employeesData);
      await AsyncStorage.setItem("employee_list_cache", JSON.stringify(employeesData));

      // Fetch agencies
      const agenciesResponse = await fetch(AGENCIES_URL);
      const agenciesData = await agenciesResponse.json();
      setAgencies(agenciesData);
      await AsyncStorage.setItem("agency_list_cache", JSON.stringify(agenciesData));
    } catch (error) {
      console.error("Error fetching data:", error);
      // Keep fallback or cached data
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
    // Validate required fields
    if (!absentEmployeeInput || !shift || !substituteEmployeeInput) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (showAgencyField && !selectedAgency) {
      alert("Proszę wybrać agencję");
      return;
    }

    // Build email
    const formattedDate = formatDate(date);
    const subject = `Informacje o zastępstwie / ${formattedDate} / ${shift} / Personnel Service`;

    // Build substitute name with agency if applicable
    let substituteName = substituteEmployeeInput;
    let agencyEmail = "";

    if (showAgencyField && selectedAgency) {
      const agency = agencies.find((a) => a.name === selectedAgency);
      if (agency) {
        substituteName = `${substituteEmployeeInput} (${agency.name})`;
        agencyEmail = agency.email;
      }
    }

    const body = `Dzień dobry

Chciałbym poinformować, że ${absentEmployeeInput} nie będzie obecny (-a) w pracy ${formattedDate} na zmianie ${shift}. Na jego (-ej) miejsce wejdzie ${substituteName}.

Proszę o uwzględnienie tej zmiany i wprowadzenie odpowiedniej korekty do harmonogramu.

Pozdrawiam,`;

    // Build recipient lists
    const toRecipients = [
      "xdr1-lead-out@id-logistics.com",
      "xdr1-flowcontrol@id-logistics.com",
    ];
    const ccRecipients = ["mcal@id-logistics.com"];
    if (agencyEmail) {
      ccRecipients.push(agencyEmail);
    }

    // Create mailto URL
    const mailtoUrl = `mailto:${toRecipients.join(",")}?cc=${ccRecipients.join(",")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    Linking.openURL(mailtoUrl).catch((err) => {
      console.error("Error opening email client:", err);
      alert("Nie można otworzyć klienta poczty");
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Informacje o zastępstwie
          </ThemedText>
          <Pressable onPress={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : (
              <Ionicons name="refresh" size={24} color={textColor} />
            )}
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Absent Employee */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Nieobecny pracownik</ThemedText>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={absentEmployeeInput}
              onChangeText={setAbsentEmployeeInput}
              placeholder="Wybierz lub wpisz..."
              placeholderTextColor="#6B6B6B"
            />
          </View>

          {/* Shift */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Zmiana</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={shift}
                onValueChange={setShift}
                style={[styles.picker, { color: textColor }]}
                dropdownIconColor={textColor}
              >
                <Picker.Item label="D" value="D" />
                <Picker.Item label="M" value="M" />
                <Picker.Item label="N" value="N" />
              </Picker>
            </View>
          </View>

          {/* Substitute Employee */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Zastępca</ThemedText>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={substituteEmployeeInput}
              onChangeText={setSubstituteEmployeeInput}
              placeholder="Wybierz lub wpisz..."
              placeholderTextColor="#6B6B6B"
            />
          </View>

          {/* Agency (conditional) */}
          {showAgencyField && (
            <View style={[styles.fieldContainer, styles.agencyFieldHighlight]}>
              <ThemedText style={styles.label}>Agencja</ThemedText>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAgency}
                  onValueChange={setSelectedAgency}
                  style={[styles.picker, { color: textColor }]}
                  dropdownIconColor={textColor}
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
            <ThemedText style={styles.label}>Data</ThemedText>
            <Pressable
              style={[styles.input, styles.dateInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={{ color: textColor }}>{formatDate(date)}</ThemedText>
              <Ionicons name="calendar-outline" size={20} color={textColor} />
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
            <ThemedText style={styles.sendButtonText}>Wyślij e-mail</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#B3B3B3",
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 56,
  },
  agencyFieldHighlight: {
    borderWidth: 2,
    borderColor: "#FF6F00",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#2A2416",
  },
  sendButton: {
    backgroundColor: "#2196F3",
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
