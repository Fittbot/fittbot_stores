import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const WorkoutStreak = ({ workoutData }) => {
  // Function to get day number from date string
  const getDayFromDate = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  // Function to get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "#4CAF50";
      case "red":
        return "#F44336";
      case "grey":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Streak</Text>

      <View style={styles.weekContainer}>
        {workoutData && workoutData?.length > 0 ? (
          <>
            {workoutData.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayText}>{day.day_initial}</Text>
                <View
                  style={[
                    styles.circleContainer,
                    { backgroundColor: getStatusColor(day.status) },
                  ]}
                >
                  <Text style={styles.dayNumber}>
                    {getDayFromDate(day.date)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View>
            <Text style={styles.noData}>No Workout Data found</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    color: "red",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
  },
  weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayContainer: {
    alignItems: "center",
    width: (width - 80) / 7,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555555",
    marginBottom: 8,
  },
  circleContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default WorkoutStreak;
