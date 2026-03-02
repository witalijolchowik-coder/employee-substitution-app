import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface Employee {
  id: string;
  name: string;
  department: string;
  agency?: string; // For external employees
  isExternal: boolean;
}

const DEPARTMENTS = ["Outbound", "Inbound"];
const FALLBACK_EMPLOYEES = [
  { name: "Dzina Siarbolina", department: "Outbound" },
  { name: "Robel Daniel Eticha", department: "Outbound" },
  { name: "Oleksandr Osetynskyi", department: "Inbound" },
  { name: "Nataliia Sira", department: "Inbound" },
  { name: "Iryna Podakina", department: "Outbound" },
  { name: "Denys Pidrivnyi", department: "Outbound" },
  { name: "Tetiana Holovchenko", department: "Inbound" },
  { name: "Ivan Panasiuk", department: "Outbound" },
  { name: "Valeriia Mysniaieva", department: "Inbound" },
  { name: "Andrii Potiiev", department: "Outbound" },
  { name: "Kateryna Naumchuk", department: "Inbound" },
  { name: "Karyna Nelina", department: "Outbound" },
  { name: "Andrii Stovbchatyi", department: "Inbound" },
  { name: "Artem Fedoreikov", department: "Outbound" },
];

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();

  // Unified deep dark blue theme
  const backgroundColor = "#0B1929";
  const textColor = "#E8E8E8";
  const surfaceColor = "#1A2F47";
  const labelColor = "#A0A0A0";
  const accentColor = "#2196F3";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState("Outbound");
  const [selectedEmployeeForMenu, setSelectedEmployeeForMenu] = useState<Employee | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, { zastepca: number; nieobecny: number }>>({});

  useEffect(() => {
    loadEmployees();
    loadStatistics();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStatistics();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadEmployees = async () => {
    try {
      const stored = await AsyncStorage.getItem("employees_list");
      if (stored) {
        const parsed = JSON.parse(stored);
        setEmployees(parsed);
      } else {
        // Initialize with fallback employees
        const initialEmployees = FALLBACK_EMPLOYEES.map((emp, idx) => ({
          id: `emp_${idx}`,
          name: emp.name,
          department: emp.department,
          isExternal: false,
        }));
        setEmployees(initialEmployees);
        await AsyncStorage.setItem("employees_list", JSON.stringify(initialEmployees));
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async () => {
    if (!newEmployeeName.trim()) {
      Alert.alert("Błąd", "Podaj imię pracownika");
      return;
    }

    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      name: newEmployeeName.trim(),
      department: newEmployeeDepartment,
      isExternal: false,
    };

    const updated = [...employees, newEmployee];
    setEmployees(updated);
    await AsyncStorage.setItem("employees_list", JSON.stringify(updated));

    setNewEmployeeName("");
    setNewEmployeeDepartment("Outbound");
    setShowAddModal(false);
  };

  const editEmployee = async () => {
    if (!editingEmployee || !newEmployeeName.trim()) {
      Alert.alert("Błąd", "Podaj imię pracownika");
      return;
    }

    const updated = employees.map((e) =>
      e.id === editingEmployee.id
        ? { ...e, name: newEmployeeName.trim(), department: newEmployeeDepartment }
        : e
    );
    setEmployees(updated);
    await AsyncStorage.setItem("employees_list", JSON.stringify(updated));

    setNewEmployeeName("");
    setNewEmployeeDepartment("Outbound");
    setEditingEmployee(null);
    setShowEditModal(false);
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployeeName(employee.name);
    setNewEmployeeDepartment(employee.department);
    setShowEditModal(true);
  };

    const deleteEmployee = (id: string) => {
    Alert.alert(
      "Usuń pracownika",
      "Czy na pewno chcesz usunąć tego pracownika?",
      [
        { text: "Anuluj", onPress: () => {}, style: "cancel" },
        {
          text: "Usuń",
          onPress: async () => {
            const updated = employees.filter((e) => e.id !== id);
            setEmployees(updated);
            await AsyncStorage.setItem("employees_list", JSON.stringify(updated));
            setShowContextMenu(false);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEditFromMenu = () => {
    if (selectedEmployeeForMenu) {
      startEdit(selectedEmployeeForMenu);
      setShowContextMenu(false);
    }
  };

  const handleDeleteFromMenu = () => {
    if (selectedEmployeeForMenu) {
      deleteEmployee(selectedEmployeeForMenu.id);
    }
  };

  const loadStatistics = async () => {
    try {
      const journalData = await AsyncStorage.getItem("journal_entries");
      if (!journalData) {
        setStatistics({});
        return;
      }

      const entries = JSON.parse(journalData);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const stats: Record<string, { zastepca: number; nieobecny: number }> = {};

      entries.forEach((entry: any) => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
          if (entry.substituteEmployee && entry.substituteEmployee.trim()) {
            if (!stats[entry.substituteEmployee]) {
              stats[entry.substituteEmployee] = { zastepca: 0, nieobecny: 0 };
            }
            stats[entry.substituteEmployee].zastepca++;
          }

          if (entry.absentEmployee && entry.absentEmployee.trim()) {
            if (!stats[entry.absentEmployee]) {
              stats[entry.absentEmployee] = { zastepca: 0, nieobecny: 0 };
            }
            stats[entry.absentEmployee].nieobecny++;
          }
        }
      });

      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const getEmployeeStats = (employeeName: string) => {
    return statistics[employeeName] || { zastepca: 0, nieobecny: 0 };
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <Pressable
      onLongPress={() => {
        setSelectedEmployeeForMenu(item);
        setShowContextMenu(true);
      }}
      delayLongPress={500}
      style={({ pressed }) => [styles.employeeCard, { backgroundColor: surfaceColor }, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.employeeInfo}>
        <Text style={[styles.employeeName, { color: textColor }]}>{item.name}</Text>
        <View style={styles.departmentBadge}>
          <Text style={[styles.departmentText, { color: accentColor }]}>{item.department}</Text>
        </View>
        {item.agency && (
          <Text style={[styles.agencyText, { color: labelColor }]}>Agencja: {item.agency}</Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        {(() => {
          const stats = getEmployeeStats(item.name);
          if (stats.zastepca === 0 && stats.nieobecny === 0) {
            return null;
          }
          return (
            <View style={styles.statsContainer}>
              {stats.zastepca > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.greenTriangle}>▲</Text>
                  <Text style={styles.statNumber}>{stats.zastepca}</Text>
                </View>
              )}
              {stats.nieobecny > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.redTriangle}>▼</Text>
                  <Text style={styles.statNumber}>{stats.nieobecny}</Text>
                </View>
              )}
            </View>
          );
        })()}
      </View>
    </Pressable>
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
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Pracownicy</Text>
          <Text style={[styles.headerSubtitle, { color: labelColor }]}>
            Personnel Service - {employees.filter((e) => !e.isExternal).length} pracowników
          </Text>
        </View>

        {/* Add button */}
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Dodaj pracownika</Text>
        </Pressable>

        {/* Employee list */}
        {loading ? (
          <Text style={[styles.emptyText, { color: labelColor }]}>Ładowanie...</Text>
        ) : employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={labelColor} />
            <Text style={[styles.emptyText, { color: labelColor }]}>Brak pracowników</Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id}
            renderItem={renderEmployee}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>

      {/* Add Employee Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Dodaj pracownika</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={textColor} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: labelColor }]}>Imię i nazwisko</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { color: textColor, backgroundColor: backgroundColor, borderColor: accentColor },
                  ]}
                  placeholder="Wpisz imię..."
                  placeholderTextColor={labelColor}
                  value={newEmployeeName}
                  onChangeText={setNewEmployeeName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: labelColor }]}>Dział</Text>
                <View style={[styles.pickerContainer, { backgroundColor: backgroundColor, borderColor: accentColor }]}>
                  <Picker
                    selectedValue={newEmployeeDepartment}
                    onValueChange={setNewEmployeeDepartment}
                    style={{ color: textColor }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <Picker.Item key={dept} label={dept} value={dept} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    { backgroundColor: labelColor + "20", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.buttonText, { color: labelColor }]}>Anuluj</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={addEmployee}
                >
                  <Text style={[styles.buttonText, { color: "#FFF" }]}>Dodaj</Text>
                </Pressable>
              </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Edytuj pracownika</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: labelColor }]}>Imię i nazwisko</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { color: textColor, backgroundColor: backgroundColor, borderColor: accentColor },
                  ]}
                  placeholder="Wpisz imię..."
                  placeholderTextColor={labelColor}
                  value={newEmployeeName}
                  onChangeText={setNewEmployeeName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: labelColor }]}>Dział</Text>
                <View style={[styles.pickerContainer, { backgroundColor: backgroundColor, borderColor: accentColor }]}>
                  <Picker
                    selectedValue={newEmployeeDepartment}
                    onValueChange={setNewEmployeeDepartment}
                    style={{ color: textColor }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <Picker.Item key={dept} label={dept} value={dept} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    { backgroundColor: labelColor + "20", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.buttonText, { color: labelColor }]}>Anuluj</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={editEmployee}
                >
                  <Text style={[styles.buttonText, { color: "#FFF" }]}>Zapisz</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Context Menu Modal */}
      <Modal
        visible={showContextMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContextMenu(false)}
      >
        <Pressable
          style={styles.contextMenuOverlay}
          onPress={() => setShowContextMenu(false)}
        >
          <View style={[styles.contextMenu, { backgroundColor: surfaceColor }]}>
            <Pressable
              style={({ pressed }) => [styles.contextMenuItem, pressed && styles.contextMenuItemPressed]}
              onPress={handleEditFromMenu}
            >
              <Ionicons name="pencil-outline" size={20} color={accentColor} />
              <Text style={[styles.contextMenuText, { color: textColor }]}>Edytuj</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.contextMenuItem, pressed && styles.contextMenuItemPressed]}
              onPress={handleDeleteFromMenu}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.contextMenuText, { color: "#FF3B30" }]}>Usuń</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  employeeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  employeeInfo: {
    flex: 1,
    gap: 6,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  departmentBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  departmentText: {
    fontSize: 12,
    fontWeight: "500",
  },
  agencyText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  editBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  editBtnPressed: {
    backgroundColor: "rgba(33, 150, 243, 0.2)",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  deleteBtnPressed: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalForm: {
    gap: 16,
    marginBottom: 20,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  formInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  contextMenuItemPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  contextMenuText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greenTriangle: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  redTriangle: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "bold",
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0A0A0",
  },
});
