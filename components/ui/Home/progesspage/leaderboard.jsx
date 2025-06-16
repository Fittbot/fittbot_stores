import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

const TopPerformers = ({ performers, onChangeTab }) => {
  const imageUrl = {
    1: require("../../../../assets/images/home/leaderboard1.png"),
    2: require("../../../../assets/images/home/leaderboard2.png"),
    3: require("../../../../assets/images/home/leaderboard3.png"),
  };

  const renderPerformerItem = (performer, index) => {
    return (
      <View key={index} style={styles.itemContainer}>
        <Image source={performer?.dp_url} style={styles.profileImage} />

        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{performer.name}</Text>
          <Text style={styles.pointsText}>
            {performer.points} <Text style={styles.xpText}>xp</Text>
          </Text>
        </View>

        <View style={styles.badgeContainer}>
          <Image
            source={imageUrl[performer.position]}
            style={styles.medalImage}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Top Performers of the Month!</Text>
      {performers && performers?.length > 0 ? (
        <>{performers.map(renderPerformerItem)}</>
      ) : (
        <View>
          <Text style={styles.noData}>No Data found</Text>
        </View>
      )}
      {performers && performers?.length > 0 ? (
        <TouchableOpacity
          style={styles.viewMoreContainer}
          onPress={() => onChangeTab("Leaderboard", "This Month")}
        >
          <Text style={styles.viewMoreText}>View More</Text>
          <Ionicons name="chevron-forward-outline" size={12} color="#2196F3" />
        </TouchableOpacity>
      ) : (
        ""
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    // marginHorizontal: 16,
    marginVertical: 8,
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    color: "red",
    marginTop: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nameText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 2,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  xpText: {
    color: "#FF5757",
    fontWeight: "normal",
  },
  badgeContainer: {
    alignItems: "center",
    position: "absolute",
    top: 0,
    right: 10,
  },
  medalImage: {
    width: 30,
    height: 35,
    // marginBottom: 4,
  },
  percentageText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  viewMoreText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    marginLeft: 4,
    tintColor: "#2196F3",
  },
});

export default TopPerformers;
