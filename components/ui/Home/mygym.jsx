import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientHomeAPI } from "../../../services/clientApi";
import FitnessLoader from "../FitnessLoader";
import { DietModal, FeeHistoryModal, WorkoutModal } from "./modals";
import websocketConfig from "../../../services/websocketconfig";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import LiveDistribution from "./LiveDistribution";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardScreenWidth = 392;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const imageMapping = {
  fees: require("../../../assets/images/mygym/fees.png"),
  diet: require("../../../assets/images/mygym/diet.png"),
  workout: require("../../../assets/images/mygym/workout.png"),
};

export default function myGym(props) {
  const [gymId, setGymId] = React.useState(null);
  React.useEffect(() => {
    AsyncStorage.getItem("gym_id").then((id) => setGymId(Number(id)));
  }, []);
  if (!gymId) return null;
  const url1 = "websocket_live";
  const url2 = "live";
  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <GymTab {...props} />
    </WebSocketProvider>
  );
}

const GymTab = () => {
  const router = useRouter();
  const [gymData, setGymData] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState(null);
  const [dietModal, setDietModal] = useState(false);
  const [feeModal, setFeeModal] = useState(false);
  const [workoutModal, setWorkoutModal] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [topMuscle, setTopMuscle] = useState(null);
  const [muscleSummary, setMuscleSummary] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [liveCount, setLiveCount] = useState(0);
  const [presentClient, setPresentClient] = useState(null);
  const [url, setUrl] = useState(null);
  const [user, setUser] = useState(null);
  const ws = useRef(null);
  const quickActions = [
    {
      id: "fee history",
      icon: "cash-outline",
      onPress: () => setFeeModal(true),
      imageName: "fees",
    },
    {
      id: "diet plan",
      icon: "nutrition-outline",
      onPress: () => {
        router.push({
          pathname: "/client/personalTemplate",
          params: { method: "gym" },
        });
      },
      imageName: "diet",
    },
    {
      id: "workout plan",
      icon: "barbell-outline",
      onPress: () => {
        router.push("/client/gymTemplate");
      },

      imageName: "workout",
    },
  ];
  const getGender = async () => {
    const gender = await AsyncStorage.getItem("gender");
    setUser(gender);
  };

  useFeedSocket(async (message) => {
    if (
      message.action === "update_live_count" ||
      message.action === "get_initial_data"
    ) {
      if (message.live_count !== undefined) {
        setLiveCount(message.live_count);
        setMuscleSummary(message?.muscle_summary);
        setTopMuscle(message?.top_muscle);
        setPresentClient(message?.present_clients);
        setUrl(
          user?.toLowerCase() === "male"
            ? message?.male_url
            : message?.female_url
        );
      } else {
        setLiveCount(0);
      }
    } else {
      setLiveCount(0);
    }
  });

  // useEffect(() => {
  //   getGender();
  // }, [liveCount]);

  useFocusEffect(
    useCallback(() => {
      getGender();
    }, [])
  );

  const actionAnimations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(50))
  ).current;

  useEffect(() => {
    getGymData();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    actionAnimations.forEach((animation, index) => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 500,
        delay: 100 * index,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const getGymData = async () => {
    setLoading(true);

    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");

      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        client_id: clientId,
      };

      const response = await clientHomeAPI(payload);

      if (response?.status === 200) {
        console.log(response?.data);
        setTrainer(response?.data?.assigned_plans?.trainer_name);
        setDietPlan([]);
        setWorkoutPlan([]);
        setFeeHistory(response?.data?.client?.fee_history);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error Fetching data",
      });
    } finally {
      setLoading(false);
    }
  };

  const PresentMembersModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showMembersModal}
      onRequestClose={() => setShowMembersModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowMembersModal(false)}>
        <View style={styles.gymModalContainer}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.gymModalContent}>
              <View style={styles.gymModalHeader}>
                <Text style={styles.gymModalTitle}>Active Members</Text>
                <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                  <Ionicons name="close" size={20} color="#000000" />
                </TouchableOpacity>
              </View>
              {presentClient && presentClient.length > 0 ? (
                <ScrollView style={styles.gymModalBody}>
                  {presentClient?.map((member, index) => (
                    <View key={index} style={styles.gymMemberItem}>
                      <View style={styles.gymMemberIcon}>
                        {/* <Ionicons name="person" size={20} color="#FF5757" /> */}
                        <Image
                          source={{ uri: member?.profile }}
                          style={{
                            width: responsiveWidth(8),
                            height: responsiveWidth(8),
                            borderRadius: responsiveWidth(5),
                            marginRight: responsiveWidth(0),
                          }}
                        />
                      </View>
                      <Text style={styles.gymMemberName}>{member.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                ""
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (loading) {
    return <FitnessLoader />;
  }

  // if (!gymData) {
  //     return (
  //         <View style={styles.noDataContainer}>
  //             <Text style={styles.noDataText}>No gym data available</Text>
  //         </View>
  //     );
  // }

  const labels =
    muscleSummary && typeof muscleSummary === "object"
      ? Object.keys(muscleSummary)
      : [];
  const counts =
    labels.length > 0
      ? labels.map((muscle) => muscleSummary[muscle]?.count)
      : [];

  const chartWidth = width * 1.5;

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(31, 144, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
  };

  const data = {
    labels: labels,
    datasets: [
      {
        data: counts,
      },
    ],
  };

  const dynamicStyles = StyleSheet.create({
    gymChartLabel: {
      fontSize: 12,
      color: "#4b5563",
      textAlign: "center",
      width: chartWidth / labels.length,
    },
  });

  return (
    <ScrollView style={styles.gymScrollContainer}>
      <View style={styles.gymStatsContainer}>
        <TouchableOpacity
          style={styles.gymStatCard}
          onPress={() => setShowMembersModal(true)}
          disabled={liveCount === 0}
          activeOpacity={1}
        >
          <LinearGradient
            colors={["#1F90CE0F", "#1F90CE0F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gymStatGradient}
          >
            <View style={styles.gymStatIconContainer}>
              <Image
                source={require("../../../assets/images/mygym/active_members.png")}
                style={styles.topImage}
              />
            </View>
            <Text style={styles.gymStatNumber}>{liveCount}</Text>
            <Text style={styles.gymStatLabel}>Active Members</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.gymStatCard}>
          <LinearGradient
            colors={["#1F90CE0F", "#1F90CE0F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gymStatGradient}
          >
            <View style={styles.gymStatIconContainer}>
              <Image
                source={url ? url : require("../../../assets/images/noone.png")}
                style={styles.topImage}
              />
            </View>
            <Text style={styles.gymStatNumber}>{topMuscle || "NA"}</Text>
            <Text style={styles.gymStatLabel}>Popular Today</Text>
          </LinearGradient>
        </View>
      </View>

      {liveCount > 0 ? (
        <>
          <LiveDistribution
            USERS={presentClient}
            onPress={() => {
              setShowMembersModal(true);
            }}
          />
        </>
      ) : null}

      {/* Workout Distribution Chart */}
      {liveCount > 0 ? (
        <View style={styles.gymSectionContainer}>
          <Text style={styles.gymSectionTitle}>Workout Distribution</Text>
          <View style={styles.gymChartCard}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              style={{ maxHeight: 350 }}
            >
              <View>
                <BarChart
                  data={data}
                  width={chartWidth}
                  height={250}
                  chartConfig={chartConfig}
                  verticalLabelRotation={0}
                  showValuesOnTopOfBars={true}
                  fromZero={true}
                  showBarTops={true}
                  style={{
                    marginVertical: 2,
                    borderRadius: 16,
                  }}
                />
                <View style={styles.gymChartLabels}>
                  {labels.map((muscle, index) => (
                    <Text key={muscle} style={dynamicStyles.gymChartLabel}>
                      {muscle}: {counts[index]}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}

      <View style={styles.gymTrainerCard}>
        <View style={styles.gymTrainerInfo}>
          <View style={styles.gymTrainerIconContainer}>
            <Image
              source={require("../../../assets/images/mygym/trainer.png")}
              style={styles.topImage}
            />
          </View>
          <View style={styles.gymTrainerDetails}>
            <Text style={styles.gymTrainerTitle}>Your Trainer</Text>
            <Text style={styles.gymTrainerName}>
              {trainer || "Not Assigned"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Personalized Gym Overview</Text>
        <View style={styles.actionButtonsContainer}>
          {quickActions?.map((action, index) => (
            <Animated.View
              key={action.id}
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: actionAnimations[index] }],
              }}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={action.onPress}
              >
                {/* <LinearGradient
                  colors={["#1F90CE0F", "#1F90CE0F"]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                > */}
                <View style={styles.actionGradient}>
                  <Image
                    source={imageMapping[action.imageName]}
                    style={styles.bottomImage}
                    contentFit="contain"
                  />
                  <Text style={styles.actionButtonText}>
                    {action.id.charAt(0).toUpperCase() + action.id.slice(1)}
                  </Text>
                </View>

                {/* </LinearGradient> */}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      <PresentMembersModal />

      <WorkoutModal
        visible={workoutModal}
        onClose={() => setWorkoutModal(false)}
        workoutPlan={workoutPlan}
      />

      <DietModal
        visible={dietModal}
        onClose={() => setDietModal(false)}
        dietPlan={dietPlan}
      />

      <FeeHistoryModal
        visible={feeModal}
        onClose={() => setFeeModal(false)}
        feeHistory={feeHistory}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  gymScrollContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: 20,
  },
  gymTrainerCard: {
    marginHorizontal: 16,
    // marginVertical: 10,
    padding: 20,
    backgroundColor: "#1F90CE0F",
    borderRadius: 15,
    // elevation: 3,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
  },
  gymTrainerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gymTrainerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  gymTrainerDetails: {
    marginLeft: 15,
  },
  gymTrainerTitle: {
    fontSize: 12,
    color: "#666",
  },
  gymTrainerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  gymStatsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 15,
    marginTop: 10,
  },
  gymStatCard: {
    width: width * 0.43,
    height: 140,
    borderRadius: 15,
    overflow: "hidden",
  },
  gymStatGradient: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gymStatIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  gymStatNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  gymStatLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  gymSectionContainer: {
    padding: 20,
    // backgroundColor: '#FFFFFF',
  },
  gymSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  gymChartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gymChartLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: width * 1.5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  gymModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  gymModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  gymModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  gymModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gymModalBody: {
    padding: 20,
  },
  gymMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingVertical: 5,
    backgroundColor: "#1F90CE0F",
    borderRadius: 10,
    marginBottom: 10,
  },
  gymMemberIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gymMemberName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  quickActions: {
    paddingBottom: 15,
    marginTop: 10,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  actionButton: {
    width: width * 0.28,
    borderRadius: 15,
    backgroundColor: "#1F90CE0F",
  },
  actionGradient: {
    borderRadius: 15,
    // paddingVertical: 12,
    height: 100,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // marginVertical: 10,
  },
  actionButtonText: {
    color: "#000000",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
    marginBottom: 15,
  },
  topImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  bottomImage: {
    width: "50%",
    height: "50%",
  },
});
