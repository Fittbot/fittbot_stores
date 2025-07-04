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
import PieChart from "react-native-pie-chart";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  allowDataSharingAPI,
  clientHomeAPI,
  clientMyGymAPI,
} from "../../../services/clientApi";
import FitnessLoader from "../FitnessLoader";
import { DietModal, FeeHistoryModal, WorkoutModal } from "./modals";
import websocketConfig from "../../../services/websocketconfig";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import LiveDistribution from "./LiveDistribution";
import { useFocusEffect } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
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

// Color palette for the pie chart - based on GymTab colors
const muscleGroupColors = [
  "#1F90CE", // Primary blue
  "#21A065", // Green
  "#38B59C", // Teal
  "#108CB6", // Dark blue
  "#FF5757", // Red
  "#FFA726", // Orange
  "#AB47BC", // Purple
  "#26C6DA", // Cyan
  "#66BB6A", // Light green
  "#FFCA28", // Amber
  "#EC407A", // Pink
  "#8D6E63", // Brown
];

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
  const [dataShareEnabled, setDataShareEnabled] = useState(false);
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

  const toggleDataSharing = async (enabled) => {
    try {
      setDataShareEnabled(enabled);
      const clientId = await AsyncStorage.getItem("client_id");
      const payload = {
        client_id: clientId,
        data_sharing: enabled,
      };

      const response = await allowDataSharingAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Settings Updated",
          desc: `Data sharing ${enabled ? "enabled" : "disabled"} successfully`,
        });
      } else {
        setDataShareEnabled(!enabled);
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to update data sharing settings",
        });
      }
    } catch (error) {
      setDataShareEnabled(!enabled);
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to update data sharing settings",
      });
    }
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

      const response = await clientMyGymAPI(payload);

      if (response?.status === 200) {
        setTrainer(response?.data?.trainer_details);
        setDietPlan([]);
        setWorkoutPlan([]);
        setFeeHistory(response?.data?.fee_history);
        setDataShareEnabled(response?.data?.data_sharing);
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

  // Prepare data for pie chart
  const preparePieChartData = () => {
    if (!muscleSummary || typeof muscleSummary !== "object") {
      return { chartData: [], series: [], sliceColors: [], totalCount: 0 };
    }

    const muscleGroups = Object.keys(muscleSummary);
    const totalCount = muscleGroups.reduce(
      (sum, muscle) => sum + (muscleSummary[muscle]?.count || 0),
      0
    );

    if (totalCount === 0) {
      return { chartData: [], series: [], sliceColors: [], totalCount: 0 };
    }

    const chartData = muscleGroups.map((muscle, index) => ({
      name: muscle,
      count: muscleSummary[muscle]?.count || 0,
      percentage: Math.round(
        ((muscleSummary[muscle]?.count || 0) / totalCount) * 100
      ),
      color: muscleGroupColors[index % muscleGroupColors.length],
    }));

    const series = chartData.map((item) => item.percentage);
    const sliceColors = chartData.map((item) => item.color);

    return { chartData, series, sliceColors, totalCount };
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

  const { chartData, series, sliceColors, totalCount } = preparePieChartData();

  return (
    <ScrollView
      style={styles.gymScrollContainer}
      contentContainerStyle={{ flexGrow: 1 }}
      nestedScrollEnabled={true}
    >
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
            <Text style={styles.gymStatLabel}>Popular Now</Text>
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

      {/* Workout Distribution Pie Chart */}
      {liveCount > 0 ? (
        <View style={styles.gymSectionContainer}>
          <Text style={styles.gymSectionTitle}>Workout Distribution</Text>
          <View style={styles.gymChartCard}>
            {totalCount > 0 ? (
              <View style={styles.chartContainer}>
                <View style={styles.chartRow}>
                  <View style={styles.chartWrapper}>
                    <Animated.View style={[styles.rotatingChartContainer]}>
                      <PieChart
                        widthAndHeight={160}
                        series={series}
                        sliceColor={sliceColors}
                        doughnut={true}
                        coverRadius={0.75}
                        coverFill={"#fff"}
                        padAngle={0.12}
                        strokeWidth={4}
                        stroke={"#fff"}
                        innerRadius={60}
                      />
                      <View style={styles.centerLabelOverlay}>
                        <Text style={styles.centerValue}>{liveCount}</Text>
                        <Text style={styles.centerSubtext}>Active</Text>
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.legendContainer}>
                    <ScrollView
                      style={styles.legendScrollView}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      scrollEnabled={true}
                      bounces={false}
                      overScrollMode="never"
                      keyboardShouldPersistTaps="handled"
                      removeClippedSubviews={false}
                      contentContainerStyle={{
                        paddingVertical: 2,
                        minHeight: 140, // Ensure content is scrollable
                      }}
                    >
                      {chartData?.map((item, index) => (
                        <View
                          key={`${item?.name}-${index}`}
                          style={[
                            styles.legendItem,
                            { backgroundColor: item?.color },
                          ]}
                        >
                          <Text style={styles.legendText}>
                            {item?.name}: {item?.count}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                    {chartData?.length > 4 && (
                      <View style={styles.scrollIndicator}>
                        <Text style={styles.scrollIndicatorText}>
                          Scroll for more
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={12}
                          color="#999"
                          style={styles.scrollIcon}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No workout data available</Text>
                <Text style={styles.noDataSubText}>
                  Workout distribution will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.gymTrainerCard}>
        <View style={styles.gymTrainerInfo}>
          <View style={styles.gymTrainerIconContainer}>
            <Image
              source={
                trainer?.trainer_dp ||
                require("../../../assets/images/mygym/trainer.png")
              }
              style={styles.topImageTrainer}
            />
          </View>
          <View style={styles.gymTrainerDetails}>
            <Text style={styles.gymTrainerTitle}>Your Trainer</Text>
            <Text style={styles.gymTrainerName}>
              {trainer?.trainer_name || "Not Assigned"}
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
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.dataSharingCard}>
        <View style={styles.dataSharingContainer}>
          <View style={styles.dataSharingRowHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={styles.gradientBackground}>
                <View style={styles.dataSharingIconContainer}>
                  <Image
                    source={require("../../../assets/images/mygym/transfer.png")}
                    style={styles.dataSharingImage}
                  />
                </View>
              </View>

              <MaskedView
                maskElement={
                  <Text style={styles.dataSharingTitle}>Data Sharing</Text>
                }
              >
                <LinearGradient
                  colors={["#297DB3", "#183243"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientTextBackground}
                >
                  <Text style={[styles.dataSharingTitle, { opacity: 0 }]}>
                    Data Sharing
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            <TouchableOpacity
              style={[
                styles.toggleContainer,
                { backgroundColor: dataShareEnabled ? "#096497" : "#E5E5E5" },
              ]}
              onPress={() => toggleDataSharing(!dataShareEnabled)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleCircle,
                  {
                    transform: [
                      {
                        translateX: dataShareEnabled ? 22 : 2,
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.dataSharingSubtitle}>
            Allow your gym administrator to access your workout and diet data
            for personalized training
          </Text>
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
  noDataSubText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },
  gymScrollContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: 20,
  },
  gymTrainerCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: "#1F90CE0F",
    borderRadius: 15,
  },
  gymTrainerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gymTrainerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
  // Enhanced Pie Chart Styles
  chartContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
    width: "100%",
    alignSelf: "center",
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rotatingChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerLabelOverlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
  },
  centerValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  centerSubtext: {
    fontSize: 12,
    color: "#999",
  },
  // Enhanced Legend Styles
  legendContainer: {
    justifyContent: "flex-start",
    paddingLeft: 10,
    height: 160, // Fixed height for scrolling
    width: 110,
  },
  legendScrollView: {
    flex: 1,
    maxHeight: 180,
  },
  legendItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 100,
    justifyContent: "center",
  },
  legendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
  },
  scrollIndicator: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 5,
    flexDirection: "row",
  },
  scrollIndicatorText: {
    fontSize: 10,
    color: "#999",
    marginRight: 4,
  },
  scrollIcon: {
    marginTop: 1,
  },
  // Rotation hint styles
  rotationHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  rotationHintText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 6,
    fontStyle: "italic",
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
    height: 100,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
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
    contentFit: "contain",
  },
  topImageTrainer: {
    width: 50,
    height: 50,
    contentFit: "contain",
  },
  bottomImage: {
    width: "50%",
    height: "50%",
  },
  dataSharingCard: {
    marginHorizontal: 16,
    marginVertical: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dataSharingGradient: {
    padding: 20,
  },
  dataSharingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  dataSharingIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  dataSharingImage: {
    width: 30,
    height: 30,
  },
  dataSharingContent: {
    flex: 1,
    paddingRight: 10,
  },
  dataSharingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  dataSharingSubtitle: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  toggleContainer: {
    width: 40,
    height: 20,
    borderRadius: 14,
    justifyContent: "center",
    position: "relative",
  },
  toggleCircle: {
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dataSharingContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataSharingRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gradientBackground: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientTextBackground: {
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  dataSharingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  dataSharingSubtitle: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
});
