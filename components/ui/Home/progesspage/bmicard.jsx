import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const HomeBMICard = ({ bmi }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <LinearGradient
          colors={["rgba(91, 43, 155, 0.09)", "rgba(255, 60, 123, 0.09)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <MaskedView maskElement={<Text style={styles.cardTitle}>BMI</Text>}>
            <LinearGradient
              colors={["#5B2B9B", "#FF3C7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 20 }}
            >
              <Text style={[styles.cardTitle, { opacity: 0 }]}>BMI</Text>
            </LinearGradient>
          </MaskedView>
        </LinearGradient>
        <View style={styles.contentContainer}>
          <View style={styles.gaugeContainer}>
            <Image
              source={require("../../../../assets/images/bmi.gif")}
              style={styles.gaugeImage}
              contentFit="contain"
            />
          </View>
        </View>
        <Text style={styles.waterAmount}>{bmi ? bmi : "NA"}</Text>
        {/* <Text style={styles.waterLabel}>BMI</Text> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 7,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    // padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 170,
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeContainer: {
    height: 85,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  gaugeImage: {
    width: "100%",
    height: "100%",
  },
  waterAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF5757",
    marginBottom: 10,
    textAlign: "center",
  },
  waterLabel: {
    fontSize: 14,
    width: "100%",
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  cardHeader: {
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default HomeBMICard;
