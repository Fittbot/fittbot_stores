import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GiftBar = ({
  progress,
  message = "Start Your Journey today for exciting rewards!",
  title = "Gift Bar",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={["#7b2cbf", "#e5383b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <View style={styles.giftIconContainer}>
          <Image
            source={require("../../../../assets/images/home/gift.png")}
            style={styles.giftIcon}
          />
        </View>
      </View>

      <Text style={styles.message}>"{message}"</Text>
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
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  progressContainer: {
    position: "relative",
    height: 10,
    marginBottom: 16,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  giftIconContainer: {
    position: "absolute",
    right: -10,
    top: -15,
    zIndex: 10,
  },
  giftIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  message: {
    fontSize: 12,
    color: "#555555",
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default GiftBar;
