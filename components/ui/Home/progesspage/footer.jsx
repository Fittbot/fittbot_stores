import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const Footer = () => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#f5f7fa", "#f0f2f5"]} style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.title}>Your Personal Fitness Companion</Text>

          <View style={styles.taglineContainer}>
            <View style={styles.taglineItem}>
              <Text style={styles.taglineText}>Built With Passion</Text>
              <Text style={styles.heartIcon}>❤️</Text>
            </View>

            <View style={styles.taglineItem}>
              <Text style={styles.taglineText}>Powered in INDIA</Text>
              <Text style={styles.flagIcon}>🇮🇳</Text>
            </View>
          </View>
        </View>

        <View style={styles.curve} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    paddingVertical: 40,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4a4a4a",
    marginBottom: 10,
    textAlign: "center",
  },
  taglineContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 15,
  },
  taglineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  taglineText: {
    fontSize: 14,
    color: "#6b6b6b",
    fontWeight: "500",
    marginRight: 2,
  },
  heartIcon: {
    fontSize: 20,
  },
  flagIcon: {
    fontSize: 20,
  },
});

export default Footer;
