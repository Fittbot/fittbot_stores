import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const TemplateViewCard = ({ template, handleTemplateSelect }) => {
  const getTotalExercises = () => {
    if (!template.exercise_data) return 0;
    
    return Object.values(template.exercise_data).reduce((total, group) => {
      if (group && group.exercises) {
        return total + group.exercises.length;
      }
      return total;
    }, 0);
  };

  const getMuscleGroups = () => {
    if (!template.exercise_data) return "No exercises";
    
    const muscleGroups = Object.keys(template.exercise_data).filter(
      key => template.exercise_data[key] && 
             template.exercise_data[key].exercises && 
             template.exercise_data[key].exercises.length > 0
    );
    
    return muscleGroups.length > 0 ? muscleGroups.join(", ") : "No exercises";
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={handleTemplateSelect}
    >
      <View style={styles.headerContainer}>
        <View style={styles.routineHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.routineTitle}>{template.name}</Text>
            <Text style={styles.exerciseCount}>
              {getTotalExercises()} Exercises
            </Text>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>
            {getMuscleGroups()}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
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
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  titleSection: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#183243",
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  categoryContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  actionButton: {
    height: 40,
    justifyContent: "center",
    minWidth: 140,
  },
  buttonContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
  },
  gradientBackground: {
    height: "100%",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default TemplateViewCard;