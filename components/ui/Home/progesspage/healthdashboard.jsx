import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const HealthDashboard = ({
  title = "Health Dashboard",
  subtitle = "Consistency, Strength, and Growth",
  description = "Consistency & Strength. Your Monthly Wellness Recap.",
  buttonLabel = "View All Charts",
  onButtonPress = () => {},
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity onPress={onButtonPress}>
          <LinearGradient
            colors={["#FF3C7B", "#5B2B9B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationContainer}>
        <Image
          source={require("../../../../assets/images/health-dashboard-image.png")}
          style={styles.illustration}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
    height: 120,
    paddingHorizontal: 10,
  },
  textContainer: {
    width: "50%",
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginVertical: 3,
  },
  subtitle: {
    fontSize: 12,
    color: "#555555",
  },
  description: {
    fontSize: 10,
    color: "#555555",
    marginBottom: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 5,
  },
  illustrationContainer: {
    position: "absolute",
    right: 0,
    bottom: -15,
    width: "50%",
    height: "100%",
    justifyContent: "flex-end",
  },
  illustration: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});

export default HealthDashboard;
