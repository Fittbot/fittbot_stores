import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const TemplateList = ({
  template,
  setCurrentTemplate,
  openEditModal,
  handleAddWorkout,
  deleteTemplate,
  handleTemplateSelect,
}) => {
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.8}
        onPress={handleAddWorkout}
      >
        <View style={styles.headerContainer}>
          <View style={styles.routineHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.routineTitle}>{template.name}</Text>
            </View>
            <Text style={styles.exerciseCount}>
              {Object.values(template.exercise_data).reduce(
                (sum, group) => sum + group.exercises.length,
                0
              )}{" "}
              Exercises
            </Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                setDropdownOpenId(
                  dropdownOpenId === template.id ? null : template.id
                )
              }
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
            </TouchableOpacity>
            {dropdownOpenId === template.id && (
              <View style={styles.dropdownModal}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    openEditModal(template);
                    setDropdownOpenId(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    deleteTemplate(template.id);
                    setDropdownOpenId(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>
              {Object.keys(template.exercise_data).length
                ? Object.keys(template.exercise_data).join(", ")
                : "No Exercises to show"}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          <View key={template.id} style={styles.workoutItemContainer}>
            <View style={styles.workoutItem}>
              <TouchableOpacity
                onPress={handleTemplateSelect}
                style={styles.actionButton}
              >
                <MaskedView
                  maskElement={
                    <View style={styles.buttonContentWrapper}>
                      <Ionicons name="add-circle" size={20} color="#000" />
                      <Text style={styles.buttonText}> Log Workout</Text>
                    </View>
                  }
                >
                  <LinearGradient
                    colors={["#297DB3", "#183243"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBackground}
                  >
                    <View style={styles.buttonContentWrapper}>
                      <Ionicons
                        name="add-circle"
                        size={20}
                        color="#000"
                        style={{ opacity: 0 }}
                      />
                      <Text style={[styles.buttonText, { opacity: 0 }]}>
                        {" "}
                        Log Workout
                      </Text>
                    </View>
                  </LinearGradient>
                </MaskedView>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddWorkout}
                style={styles.actionButton}
              >
                <MaskedView
                  maskElement={
                    <View style={styles.buttonContentWrapper}>
                      <Ionicons name="eye" size={20} color="#000" />
                      <Text style={styles.buttonText}> View Workout</Text>
                    </View>
                  }
                >
                  <LinearGradient
                    colors={["#297DB3", "#183243"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBackground}
                  >
                    <View style={styles.buttonContentWrapper}>
                      <Ionicons
                        name="eye"
                        size={20}
                        color="#000"
                        style={{ opacity: 0 }}
                      />
                      <Text style={[styles.buttonText, { opacity: 0 }]}>
                        {" "}
                        View Workout
                      </Text>
                    </View>
                  </LinearGradient>
                </MaskedView>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableOpacity>

      {/* Overlay to close dropdown when clicking outside */}
      {dropdownOpenId === template.id && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownOpenId(null)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 8,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 14,
    position: "relative",
  },
  titleSection: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    marginRight: 5,
    color: "#6B7280",
  },
  categoryContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 16,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  workoutItemContainer: {
    marginBottom: 12,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    padding: 4,
  },
  dropdownModal: {
    position: "absolute",
    right: 0,
    top: 30,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 10,
  },
  modalOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalOptionText: {
    fontSize: 14,
  },
  actionButton: {
    height: 40,
    justifyContent: "center",
  },
  buttonContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gradientBackground: {
    height: "100%",
    justifyContent: "center",
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: "30%",
    bottom: 0,
    zIndex: 5,
  },
});

export default TemplateList;
