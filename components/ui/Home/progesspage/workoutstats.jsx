import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const WorkoutSummaryCard = ({
  title = "Workout",
  message = "You crushed it! That's one step closer to your strongest self.",
  duration,
  calories,
  points,
  gender,
  onStartPress = () => {},
  onKnowMorePress = () => {},
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Left side: Title, message and stats */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>
            "
            {calories || points
              ? message
              : "Every champion starts with a single step—take yours now!"}
            "
          </Text>

          <View style={styles.statsContainer}>
            {/* Duration */}
            <View style={styles.statItem}>
              <View style={styles.durationIcon}>
                <Image
                  source={require("../../../../assets/images/clock.png")}
                  style={styles.icons}
                />
              </View>
              <Text style={styles.statValue}>{duration ? duration : "NA"}</Text>
            </View>

            {/* Calories */}
            <View style={styles.statItem}>
              <View style={styles.caloriesIcon}>
                <Image
                  source={require("../../../../assets/images/calories.png")}
                  style={styles.iconsCalories}
                />
              </View>
              <Text style={styles.statValue}>
                {calories ? calories : "0"} Cals
              </Text>
            </View>

            {/* Points */}
            <View style={styles.statItem}>
              <View style={styles.pointsIcon}>
                <Image
                  source={require("../../../../assets/images/kgs.png")}
                  style={styles.icons}
                />
              </View>
              <Text style={styles.statValue}>{points ? points : "0"} kg</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onKnowMorePress}
            style={styles.knowMoreButton}
          >
            <Text style={styles.knowMoreText}>Know More</Text>
            <Ionicons name="chevron-forward" size={14} color="#0066FF" />
          </TouchableOpacity>
        </View>

        {/* Right side: Image and button */}
        <View style={styles.actionContainer}>
          {gender.toLowerCase() === "male" ? (
            <Image
              source={require("../../../../assets/images/tire-flip.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require("../../../../assets/images/tire-flip-female.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    paddingVertical: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 3,
    paddingRight: 10,
    justifyContent: "space-between",
  },
  actionContainer: {
    flex: 2,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  message: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 7,
    lineHeight: 20,
    fontStyle: "normal",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "column",
    gap: 2,
    alignItems: "center",
    marginRight: 7,
    marginBottom: 8,
  },
  icons: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  iconsCalories: {
    width: 16,
    height: 22,
  },
  durationIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  caloriesIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  pointsIcon: {
    width: 20,
    height: 20,
    borderRadius: 15,
    // backgroundColor: 'rgba(94, 53, 177, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  statValue: {
    fontSize: 10,
    color: "#333333",
    fontWeight: "500",
  },
  knowMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  knowMoreText: {
    color: "#0066FF",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 4,
  },
  illustration: {
    width: 150,
    height: 170,
    position: "absolute",
    right: -18,
    bottom: -27,
  },
});

export default WorkoutSummaryCard;
