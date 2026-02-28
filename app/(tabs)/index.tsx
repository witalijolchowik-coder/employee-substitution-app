import { useState, useEffect } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

interface Agency {
  name: string;
  email: string;
}

// Autocomplete dropdown component
function AutocompleteDropdown({
  value,
  onChangeText,
  placeholder,
  data,
  onSelect,
  surfaceColor,
  textColor,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  data: string[];
  onSelect: (item: string) => void;
  surfaceColor: string;
  textColor: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter data based on input
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
        style={[styles.input, { color: textColor, backgroundColor: surfaceColor }]}
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
        <View style={[styles.dropdownList, { backgroundColor: surfaceColor }]}>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.dropdownItem}
                onPress={() => handleSelectItem(item)}
              >
                <Text style={{ color: textColor, fontSize: 16 }}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

// Department Toggle Component
function DepartmentToggle({
  value,
  onValueChange,
  textColor,
  surfaceColor,
}: {
  value: "Outbound" | "Inbound";
  onValueChange: (value: "Outbound" | "Inbound") => void;
  textColor: string;
  surfaceColor: string;
}) {
  return (
    <View style={styles.toggleContainer}>
      <Pressable
        style={[
          styles.toggleButton,
          value === "Outbound" && styles.toggleButtonActive,
          { backgroundColor: value === "Outbound" ? "#2196F3" : surfaceColor },
        ]}
        onPress={() => onValueChange("Outbound")}
      >
        <Text style={[styles.toggleText, { color: value === "Outbound" ? "#FFF" : textColor }]}>
          Outbound
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.toggleButton,
          value === "Inbound" && styles.toggleButtonActive,
          { backgroundColor: value === "Inbound" ? "#2196F3" : surfaceColor },
        ]}
        onPress={() => onValueChange("Inbound")}
      >
        <Text style={[styles.toggleText, { color: value === "Inbound" ? "#FFF" : textColor }]}>
          Inbound
        </Text>
      </Pressable>
    </View>
  );
}

// Reason Selection Component
function ReasonSelector({
  value,
  onValueChange,
  textColor,
  surfaceColor,
}: {
  value: string;
  onValueChange: (value: string) => void;
  textColor: string;
  surfaceColor: string;
}) {
  const reasons = ["sprawy prywatne", "złe samopoczucie"];

  return (
    <View style={styles.reasonContainer}>
      {reasons.map((reason) => (
        <Pressable
          key={reason}
          style={[
            styles.reasonButton,
            value === reason && styles.reasonButtonActive,
            {
              backgroundColor: value === reason ? "#2196F3" : surfaceColor,
              borderColor: value === reason ? "#2196F3" : "#2C2C2C",
            },
          ]}
          onPress={() => onValueChange(reason)}
        >
          <Text style={[styles.reasonText, { color: value === reason ? "#FFF" : textColor }]}>
            {reason}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Force dark theme colors - unified deep dark blue
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const labelColor = "#A0A0A0";
  const accentColor = "#2196F3";

  // Data state
  const [employees, setEmployees] = useState<string[]>(FALLBACK_EMPLOYEES);
  const [agencies, setAgencies] = useState<Agency[]>(FALLBACK_AGENCIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [absentEmployee, setAbsentEmployee] = useState("");
  const [absentDepartment, setAbsentDepartment] = useState<"Outbound" | "Inbound">("Outbound");
  const [absentReason, setAbsentReason] = useState("sprawy prywatne");
  const [shift, setShift] = useState("D");
  const [substituteEmployee, setSubstituteEmployee] = useState("");
  const [substituteDepartment, setSubstituteDepartment] = useState<"Outbound" | "Inbound">("Outbound");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI state
  const [showAgencyField, setShowAgencyField] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
    fetchData();
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
      console.log("[Cache] Loading cached data from AsyncStorage...");
      const cachedEmployees = await AsyncStorage.getItem("employee_list_cache");
      const cachedAgencies = await AsyncStorage.getItem("agency_list_cache");

      if (cachedEmployees) {
        const parsed = JSON.parse(cachedEmployees);
        console.log("[Cache] Loaded employees from cache:", parsed.length, "items");
        setEmployees(parsed);
      } else {
        console.log("[Cache] No cached employees, using fallback");
        setEmployees(FALLBACK_EMPLOYEES);
      }

      if (cachedAgencies) {
        const parsed = JSON.parse(cachedAgencies);
        console.log("[Cache] Loaded agencies from cache:", parsed.length, "items");
        setAgencies(parsed);
      } else {
        console.log("[Cache] No cached agencies, using fallback");
        setAgencies(FALLBACK_AGENCIES);
      }
    } catch (error) {
      console.error("[Cache] Error loading cached data:", error);
      setEmployees(FALLBACK_EMPLOYEES);
      setAgencies(FALLBACK_AGENCIES);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("[Fetch] Starting data sync from Gist...");

      // Fetch employees
      const employeesResponse = await fetch(EMPLOYEES_URL);
      if (!employeesResponse.ok) {
        throw new Error(`Employees fetch failed: ${employeesResponse.status}`);
      }
      const employeesData = await employeesResponse.json();
      console.log("[Fetch] Employees loaded from Gist:", employeesData.length, "items");
      setEmployees(employeesData);
      await AsyncStorage.setItem("employee_list_cache", JSON.stringify(employeesData));
      console.log("[Fetch] Employees saved to cache");

      // Fetch agencies
      const agenciesResponse = await fetch(AGENCIES_URL);
      if (!agenciesResponse.ok) {
        throw new Error(`Agencies fetch failed: ${agenciesResponse.status}`);
      }
      const agenciesData = await agenciesResponse.json();
      console.log("[Fetch] Agencies loaded from Gist:", agenciesData.length, "items");
      setAgencies(agenciesData);
      await AsyncStorage.setItem("agency_list_cache", JSON.stringify(agenciesData));
      console.log("[Fetch] Agencies saved to cache");

      console.log("[Fetch] Data sync completed successfully");
    } catch (error) {
      console.error("[Fetch] Error fetching data:", error);
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
    if (!absentEmployee || !shift || !substituteEmployee) {
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
    let substituteName = substituteEmployee;
    let agencyEmail = "";

    if (showAgencyField && selectedAgency) {
      const agency = agencies.find((a) => a.name === selectedAgency);
      if (agency) {
        substituteName = `${substituteEmployee} (${agency.name})`;
        agencyEmail = agency.email;
      }
    }

    // Build email body with selected reason
    const body = `Dzień dobry,  

W dniu ${formattedDate} proszę o udzielenie dnia wolnego dla ${absentEmployee}, dział ${absentDepartment} – powód: ${absentReason}. Na zastępstwo przyjdzie do pracy ${substituteName}, dział ${substituteDepartment}. 

Pozdrawiam, `;

    // Build recipient lists
    const toRecipients = [
      "xdr1-lead-out@id-logistics.com",
      "xdr1-flowcontrol@id-logistics.com",
    ];
    const ccRecipients = ["mcal@id-logistics.com"];

    // Add xdr1-in@id-logistics.com if either employee is Inbound
    if (absentDepartment === "Inbound" || substituteDepartment === "Inbound") {
      toRecipients.push("xdr1-in@id-logistics.com");
    }

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Logo and Slogan - Unified Background */}
        <View style={[styles.headerSection, { backgroundColor: backgroundColor }]}>
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
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Ionicons name="refresh" size={24} color={textColor} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* SECTION 1: Absent Employee */}
          <View style={[styles.section, { borderColor: accentColor, backgroundColor: surfaceColor }]}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Nieobecny pracownik</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Imię i nazwisko</Text>
              <AutocompleteDropdown
                value={absentEmployee}
                onChangeText={setAbsentEmployee}
                placeholder="Wybierz lub wpisz..."
                data={employees}
                onSelect={setAbsentEmployee}
                surfaceColor={surfaceColor}
                textColor={textColor}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Dział</Text>
              <DepartmentToggle
                value={absentDepartment}
                onValueChange={setAbsentDepartment}
                textColor={textColor}
                surfaceColor={surfaceColor}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Powód nieobecności</Text>
              <ReasonSelector
                value={absentReason}
                onValueChange={setAbsentReason}
                textColor={textColor}
                surfaceColor={surfaceColor}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Zmiana</Text>
              <View style={styles.segmentedControl}>
                {["D", "M", "N"].map((shiftOption) => (
                  <Pressable
                    key={shiftOption}
                    style={[
                      styles.segmentButton,
                      shift === shiftOption && styles.segmentButtonActive,
                      {
                        backgroundColor: shift === shiftOption ? accentColor : surfaceColor,
                        borderColor: shift === shiftOption ? accentColor : "#2C2C2C",
                      },
                    ]}
                    onPress={() => setShift(shiftOption)}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        shift === shiftOption && styles.segmentButtonTextActive,
                        { color: shift === shiftOption ? "#FFF" : labelColor },
                      ]}
                    >
                      {shiftOption}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* SECTION 2: Substitute Employee */}
          <View style={[styles.section, { borderColor: accentColor, backgroundColor: surfaceColor }]}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Zastępca</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Imię i nazwisko</Text>
              <AutocompleteDropdown
                value={substituteEmployee}
                onChangeText={setSubstituteEmployee}
                placeholder="Wybierz lub wpisz..."
                data={employees}
                onSelect={setSubstituteEmployee}
                surfaceColor={surfaceColor}
                textColor={textColor}
              />
            </View>

            {showAgencyField && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: labelColor }]}>Agencja</Text>
                <View style={[styles.pickerContainer, { backgroundColor: surfaceColor }]}>
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

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Dział</Text>
              <DepartmentToggle
                value={substituteDepartment}
                onValueChange={setSubstituteDepartment}
                textColor={textColor}
                surfaceColor={surfaceColor}
              />
            </View>
          </View>

          {/* SECTION 3: Date and Send Button */}
          <View style={[styles.section, { borderColor: accentColor, backgroundColor: surfaceColor }]}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Data</Text>
              <Pressable
                style={[styles.input, styles.dateInput, { backgroundColor: surfaceColor, borderColor: accentColor }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: textColor, fontSize: 16 }}>{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={accentColor} />
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
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.sendButtonPressed,
                { backgroundColor: accentColor },
              ]}
              onPress={handleSendEmail}
            >
              <Ionicons name="mail-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.sendButtonText}>Wyślij e-mail</Text>
            </Pressable>
          </View>
        </View>
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
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  logo: {
    width: 180,
    height: 70,
  },
  headerTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  headerTitle: {
    flex: 1,
    height: 100,
    width: "100%",
  },
  refreshButton: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  form: {
    gap: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 1,
  },
  dropdownList: {
    borderRadius: 10,
    marginTop: -4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    borderTopWidth: 0,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  toggleButtonActive: {
    borderColor: "#2196F3",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reasonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  reasonButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  reasonButtonActive: {
    borderColor: "#2196F3",
  },
  reasonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerContainer: {
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 50,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  picker: {
    height: 50,
    color: "#FFFFFF",
  },
  agencyFieldHighlight: {
    borderWidth: 2,
    borderColor: "#2196F3",
    borderRadius: 10,
    padding: 8,
  },
  sendButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    marginTop: 12,
    flexDirection: "row",
  },
  sendButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  journalButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    flexDirection: "row",
    borderWidth: 2,
  },
  journalButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  journalButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  segmentButtonActive: {
    borderColor: "#2196F3",
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  segmentButtonTextActive: {
    color: "#FFFFFF",
  },
});
