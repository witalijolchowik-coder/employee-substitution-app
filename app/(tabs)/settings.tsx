import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmployeesScreen from "./employees";
import {
  AGENCIES_STORAGE_KEY,
  DEFAULT_EMAIL_TEMPLATE,
  EMAIL_TEMPLATE_STORAGE_KEY,
  type Agency,
  FALLBACK_AGENCIES,
  normalizeAgencies,
  normalizeEmailTemplate,
} from "@/lib/substitution-settings";

type SettingsTab = "employees" | "agencies" | "email";

const backgroundColor = "#0B1929";
const textColor = "#E8E8E8";
const surfaceColor = "#1A2F47";
const labelColor = "#A0A0A0";
const accentColor = "#2196F3";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<SettingsTab>("employees");

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Ustawienia</Text>
        <View style={styles.segmentedControl}>
          <SegmentButton label="Pracownicy" active={selectedTab === "employees"} onPress={() => setSelectedTab("employees")} />
          <SegmentButton label="Agencje" active={selectedTab === "agencies"} onPress={() => setSelectedTab("agencies")} />
          <SegmentButton label="Pismo" active={selectedTab === "email"} onPress={() => setSelectedTab("email")} />
        </View>
      </View>

      <View style={styles.content}>
        {selectedTab === "employees" && <EmployeesScreen />}
        {selectedTab === "agencies" && <AgenciesSettings />}
        {selectedTab === "email" && <EmailTemplateSettings />}
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.segmentButton,
        active && styles.segmentButtonActive,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AgenciesSettings() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [name, setName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const stored = await AsyncStorage.getItem(AGENCIES_STORAGE_KEY);
      if (stored) {
        setAgencies(normalizeAgencies(JSON.parse(stored)));
      } else {
        setAgencies(FALLBACK_AGENCIES);
        await AsyncStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(FALLBACK_AGENCIES));
      }
    } catch (error) {
      console.error("Error loading agencies:", error);
      setAgencies(FALLBACK_AGENCIES);
    }
  };

  const resetForm = () => {
    setName("");
    setCoordinatorName("");
    setCoordinatorEmail("");
    setEditingAgency(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (agency: Agency) => {
    setEditingAgency(agency);
    setName(agency.name);
    setCoordinatorName(agency.coordinatorName);
    setCoordinatorEmail(agency.coordinatorEmail);
    setShowModal(true);
  };

  const saveAgencies = async (nextAgencies: Agency[]) => {
    setAgencies(nextAgencies);
    await AsyncStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(nextAgencies));
  };

  const saveAgency = async () => {
    if (!name.trim()) {
      Alert.alert("Blad", "Podaj nazwe agencji");
      return;
    }

    if (!coordinatorEmail.trim()) {
      Alert.alert("Blad", "Podaj email koordynatora");
      return;
    }

    const nextAgency: Agency = {
      id: editingAgency?.id || `agency_${Date.now()}`,
      name: name.trim(),
      coordinatorName: coordinatorName.trim(),
      coordinatorEmail: coordinatorEmail.trim(),
    };

    const nextAgencies = editingAgency
      ? agencies.map((agency) => (agency.id === editingAgency.id ? nextAgency : agency))
      : [...agencies, nextAgency];

    await saveAgencies(nextAgencies);
    resetForm();
    setShowModal(false);
  };

  const deleteAgency = (agency: Agency) => {
    Alert.alert("Usun agencje", "Czy na pewno chcesz usunac te agencje?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usun",
        style: "destructive",
        onPress: async () => {
          await saveAgencies(agencies.filter((item) => item.id !== agency.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.screenBody}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.primaryButtonText}>Dodaj agencje</Text>
        </Pressable>

        <View style={styles.list}>
          {agencies.map((agency) => (
            <View key={agency.id} style={styles.itemCard}>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{agency.name}</Text>
                <Text style={styles.itemDetail}>
                  {agency.coordinatorName ? agency.coordinatorName : "Koordynator"}
                </Text>
                <Text style={styles.itemDetail}>{agency.coordinatorEmail}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable style={styles.iconButton} onPress={() => openEditModal(agency)}>
                  <Ionicons name="pencil-outline" size={20} color={accentColor} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => deleteAgency(agency)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingAgency ? "Edytuj agencje" : "Dodaj agencje"}</Text>
                <Pressable onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={textColor} />
                </Pressable>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Nazwa agencji</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nazwa" placeholderTextColor={labelColor} />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Imie koordynatora</Text>
                <TextInput
                  style={styles.input}
                  value={coordinatorName}
                  onChangeText={setCoordinatorName}
                  placeholder="Imie i nazwisko"
                  placeholderTextColor={labelColor}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email koordynatora</Text>
                <TextInput
                  style={styles.input}
                  value={coordinatorEmail}
                  onChangeText={setCoordinatorEmail}
                  placeholder="email@firma.pl"
                  placeholderTextColor={labelColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={styles.secondaryButton} onPress={() => setShowModal(false)}>
                  <Text style={styles.secondaryButtonText}>Anuluj</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={saveAgency}>
                  <Text style={styles.saveButtonText}>Zapisz</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EmailTemplateSettings() {
  const [subject, setSubject] = useState(DEFAULT_EMAIL_TEMPLATE.subject);
  const [body, setBody] = useState(DEFAULT_EMAIL_TEMPLATE.body);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const stored = await AsyncStorage.getItem(EMAIL_TEMPLATE_STORAGE_KEY);
      const template = stored ? normalizeEmailTemplate(JSON.parse(stored)) : DEFAULT_EMAIL_TEMPLATE;
      setSubject(template.subject);
      setBody(template.body);
    } catch (error) {
      console.error("Error loading email template:", error);
    }
  };

  const saveTemplate = async () => {
    await AsyncStorage.setItem(EMAIL_TEMPLATE_STORAGE_KEY, JSON.stringify({ subject, body }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetTemplate = () => {
    Alert.alert("Przywroc szablon", "Przywroc domyslna tresc pisma?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Przywroc",
        onPress: async () => {
          setSubject(DEFAULT_EMAIL_TEMPLATE.subject);
          setBody(DEFAULT_EMAIL_TEMPLATE.body);
          await AsyncStorage.setItem(EMAIL_TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_EMAIL_TEMPLATE));
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screenBody} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Temat pisma</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholderTextColor={labelColor} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Tresc pisma</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          placeholderTextColor={labelColor}
        />
      </View>

      <View style={styles.variablesBox}>
        <Text style={styles.variablesTitle}>Zmienne</Text>
        <Text style={styles.variablesText}>
          {"{date}, {shift}, {absentEmployee}, {absentDepartment}, {absentReason}, {substituteEmployee}, {substituteAgency}, {substituteDepartment}"}
        </Text>
      </View>

      {saved && <Text style={styles.savedText}>Zapisano</Text>}

      <View style={styles.modalButtons}>
        <Pressable style={styles.secondaryButton} onPress={resetTemplate}>
          <Text style={styles.secondaryButtonText}>Domyslne</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={saveTemplate}>
          <Text style={styles.saveButtonText}>Zapisz</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    color: textColor,
    fontSize: 28,
    fontWeight: "700",
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A4A5C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: accentColor,
    borderColor: accentColor,
  },
  segmentButtonText: {
    color: labelColor,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentButtonTextActive: {
    color: "#FFF",
  },
  content: {
    flex: 1,
  },
  screenBody: {
    flex: 1,
    backgroundColor,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: accentColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: surfaceColor,
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: textColor,
    fontSize: 16,
    fontWeight: "700",
  },
  itemDetail: {
    color: labelColor,
    fontSize: 13,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: surfaceColor,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: textColor,
    fontSize: 20,
    fontWeight: "700",
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    color: labelColor,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A4A5C",
    backgroundColor: "#10243A",
    color: textColor,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bodyInput: {
    minHeight: 220,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "rgba(160,160,160,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: labelColor,
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: accentColor,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  variablesBox: {
    borderRadius: 8,
    backgroundColor: surfaceColor,
    padding: 14,
    gap: 6,
  },
  variablesTitle: {
    color: textColor,
    fontSize: 14,
    fontWeight: "700",
  },
  variablesText: {
    color: labelColor,
    fontSize: 13,
    lineHeight: 19,
  },
  savedText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "700",
  },
});
