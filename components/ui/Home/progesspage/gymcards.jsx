import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const InfoCard = ({
  type,
  title,
  description,
  value,
  total,
  secondaryValue,
  onPress,
  gender,
  liveDescription,
  onChangeTab,
  liveCount,
  liveDes,
}) => {
  const [des, setDes] = useState(null);
  const percentage = (Number(liveDes) / Number(total)) * 100;
  // if (percentage <= 30) {
  //   setDes("Perfect time to hit the gym – not too crowded!");
  // } else if (percentage > 30 && percentage <= 60) {
  //   setDes("Moderate Crowd, Maximum Momentum – Own Every Rep!");
  // } else {
  //   setDes("Full house, No worries - turn the buzz into gains");
  // }
  const isLive = type === "live";
  const [socket, setSocket] = useState(null);
  // const [liveCount, setLiveCount] = useState(null);
  // const [liveDes, setLiveDes] = useState(null);
  const [user, setUser] = useState(null);
  const ws = useRef(null);

  // useEffect(() => {
  //   let isMounted = true;
  //   let wsConnection = null;

  //   const connectWebSocket = async () => {
  //     try {
  //       const gymId = await AsyncStorage.getItem("gym_id");
  //       const id = await AsyncStorage.getItem("client_id");

  //       if (!gymId || !isMounted || !id) {
  //         if (isMounted) {
  //           alert("Something went wrong. Please try again later");
  //         }
  //         return;
  //       }

  //       wsConnection = await websocketConfig.createWebSocketConnection(
  //         "/live",
  //         gymId
  //       );

  //       if (wsConnection) {
  //         setSocket(wsConnection);

  //         wsConnection.onopen = () => {
  //           // console.log("Connected to live count WebSocket");
  //         };

  //         wsConnection.onmessage = (event) => {
  //           if (!isMounted) return;
  //           try {
  //             const message = JSON.parse(event.data);

  //             if (message.status === 500) {
  //               if (isMounted) {
  //                 Alert.alert(
  //                   "Server Error",
  //                   "Could not fetch live count data. Please try again later."
  //                 );
  //               }
  //               return;
  //             }

  //             if (
  //               message.action === "get_initial_data" ||
  //               message.action === "update_live_count"
  //             ) {
  //               if (message.live_count !== undefined) {
  //                 setLiveCount(message.live_count);

  //                 const percentage =
  //                   (Number(message.live_count) / Number(total)) * 100;
  //                 if (percentage <= 30) {
  //                   setLiveDes(
  //                     "Perfect time to hit the gym – not too crowded!"
  //                   );
  //                 } else if (percentage > 30 && percentage <= 60) {
  //                   setLiveDes(
  //                     "Moderate Crowd, Maximum Momentum – Own Every Rep!"
  //                   );
  //                 } else {
  //                   setLiveDes(
  //                     "Full house, No worries - turn the buzz into gains"
  //                   );
  //                 }
  //               } else {
  //                 setLiveCount(0);
  //               }
  //             } else if (message.action === "error") {
  //               Alert.alert(
  //                 "Error",
  //                 message.message || "Unknown error occurred"
  //               );
  //             } else {
  //               alert("Error parsing WS message");
  //               console.log("socket attendance", message);
  //             }
  //           } catch (error) {
  //             alert("Error parsing WS message");
  //           } finally {
  //             if (isMounted) {
  //             }
  //           }
  //         };

  //         wsConnection.onerror = (error) => {
  //           if (isMounted) {
  //             // Alert.alert(
  //             //   "Connection Error",
  //             //   "Failed to connect to the server. Please try again later."
  //             // );
  //           }
  //         };

  //         wsConnection.onclose = (e) => {
  //           console.log("WebSocket closed:", e.reason || "No reason provided");
  //           if (isMounted) {
  //           }
  //         };

  //         if (ws && typeof ws.current !== "undefined") {
  //           ws.current = wsConnection;
  //         }
  //       }
  //     } catch (error) {
  //       if (isMounted) {
  //         alert("Failed to connect. Please try again later.");
  //       }
  //     }
  //   };

  //   const fetchUserId = async () => {
  //     try {
  //       const userId = await AsyncStorage.getItem("client_id");
  //       if (isMounted) {
  //         setUser(userId);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user ID:", error);
  //     }
  //   };

  //   connectWebSocket();
  //   fetchUserId();

  //   return () => {
  //     isMounted = false;
  //     if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
  //       wsConnection.close();
  //     }
  //     if (ws && typeof ws.current !== "undefined") {
  //       ws.current = null;
  //     }
  //   };
  // }, []);

  const goTo = (live) => {
    if (live) {
      onChangeTab("My Gym");
    } else {
      onChangeTab("Leaderboard");
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => goTo(isLive)}>
      <LinearGradient
        colors={["rgba(91, 43, 155, 0.09)", "rgba(255, 60, 123, 0.09)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardHeader}
      >
        <MaskedView maskElement={<Text style={styles.cardTitle}>{title}</Text>}>
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 20 }}
          >
            <Text style={[styles.cardTitle, { opacity: 0 }]}>{title}</Text>
          </LinearGradient>
        </MaskedView>
      </LinearGradient>

      {/* Card description */}
      <Text style={styles.cardDescription}>
        {liveDescription
          ? percentage <= 30
            ? "Perfect time to hit the gym – not too crowded!"
            : percentage > 30 && percentage <= 60
            ? "Moderate Crowd, Maximum Momentum – Own Every Rep!"
            : "Full house, No worries - turn the buzz into gains"
          : description}
      </Text>

      {/* Card content based on type */}
      <View style={styles.cardContent}>
        {isLive ? (
          // Live Update Card Content
          <View style={styles.liveContainer}>
            <View style={styles.liveStatusContainer}>
              <View style={styles.liveIndicator} />
              <View style={styles.cardBottom}>
                <Text style={styles.valueText}>{liveCount}</Text>
                <Text style={styles.valueTextComplete}>/{total}</Text>

                <View style={styles.iconContainer}>
                  <Image
                    source={require("../../../../assets/images/live_gym.png")}
                    style={styles.peopleIcon}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          // {/* // </View> */}
          // Leaderboard Card Content
          <View style={styles.cardBottom}>
            <View style={styles.leaderboardContainer}>
              <Text style={styles.rankLabel}>Your Rank</Text>
              <Text style={styles.rankValue}>
                <Text style={styles.rankNumber}>{value}</Text>
                {secondaryValue ? (
                  <Text style={styles.rankTotal}>/{secondaryValue}</Text>
                ) : (
                  <Text style={styles.rankTotal}>/{"NA"}</Text>
                )}
              </Text>
            </View>
            <View style={styles.podiumContainer}>
              <Image
                source={
                  gender.toLowerCase() === "male"
                    ? require("../../../../assets/images/leaderboard_home.png")
                    : require("../../../../assets/images/leaderboard-home-female.png")
                }
                style={styles.podiumIcon}
              />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Main component that renders both cards
const FitnessInfoCards = ({
  liveTitle = "Gym Live Update",
  liveValue = 0,
  totalValue = 0,
  leaderboardTitle = "Leaderboard",
  leaderboardValue = "NA",
  leaderboardTotal = "NA",
  gender,
  onLivePress,
  onLeaderboardPress,
  onChangeTab,
  liveCount,
  liveDes,
}) => {
  const getLeaderboardDescription = () => {
    if (leaderboardValue == 1) {
      return "On top today – push harder for tomorrow!";
    } else if (leaderboardValue == "NA") {
      return "Your name belongs here—log today, lead tomorrow";
    } else {
      return "Start logging your diet and workout, start climbing!";
    }
  };

  return (
    <View style={styles.container}>
      {/* Live Update Card */}
      <InfoCard
        type="live"
        title={liveTitle}
        total={totalValue}
        value={liveValue || 0}
        onPress={onLivePress}
        gender={gender}
        liveDescription
        onChangeTab={onChangeTab}
        liveCount={liveCount}
        liveDes={liveDes}
      />

      {/* Leaderboard Card */}
      <InfoCard
        type="leaderboard"
        title={leaderboardTitle}
        description={getLeaderboardDescription()}
        value={leaderboardValue}
        secondaryValue={leaderboardTotal}
        onPress={onLeaderboardPress}
        gender={gender}
        onChangeTab={onChangeTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    position: "relative",
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
  cardDescription: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 50,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: 10,
  },
  // Live card styles
  liveContainer: {
    alignItems: "center",
  },
  liveStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0000",
    marginRight: 4,
  },
  liveText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
    // marginVertical: 8,
  },

  valueTextComplete: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#66666",
    // marginVertical: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginLeft: 5,
    // position: "absolute",
    // bottom: 0,
  },
  // wifiIcon: {
  //   marginBottom: 5,
  // },
  peopleIcon: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  leaderboardContainer: {
    alignItems: "center",
  },
  rankLabel: {
    fontSize: 12,
    color: "#333333",
    // marginBottom: 4,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankValue: {
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
  },
  rankTotal: {
    fontSize: 14,
    color: "#333333",
  },
  podiumContainer: {
    marginTop: 4,
  },
  podiumIcon: {
    width: 80,
    height: 80,
    marginLeft: 5,
    resizeMode: "contain",
  },
});

export default FitnessInfoCards;
