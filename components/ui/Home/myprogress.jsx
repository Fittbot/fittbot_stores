import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientProgressAPI } from "../../../services/clientApi";
import { useRouter } from "expo-router";
import FitnessLoader from "../FitnessLoader";
import HomeWaterTrackerCard from "./wateradd";
import Carousel from "./progesspage/carousel";
import Footer from "./progesspage/footer";
import TopPerformers from "./progesspage/leaderboard";
import GiftBar from "./progesspage/progressbar";
import WorkoutStreak from "./progesspage/streak";
import WorkoutSummaryCard from "./progesspage/workoutstats";
import FitnessInfoCards from "./progesspage/gymcards";
import HealthDashboard from "./progesspage/healthdashboard";
import CalorieCardsComponent from "./progesspage/calculatecalories";
import DietProgressTracker from "./progesspage/dietprogress";
import HomeBMICard from "./progesspage/bmicard";
import WeightProgressCard from "./progesspage/weightprogress";
import { showToast } from "../../../utils/Toaster";
import useBackHandler from "../../UseBackHandler ";
import useHomeBackHandler from "../../useHomeBackHandler";
import { WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";

const { width, height } = Dimensions.get("window");

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

export default function progress(props) {
  const [gymId, setGymId] = React.useState(null);
  React.useEffect(() => {
    AsyncStorage.getItem("gym_id").then((id) => setGymId(Number(id)));
  }, []);
  if (!gymId) return null;
  const url1 = "websocket_live";
  const url2 = "live";
  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <ProgressTab {...props} />
    </WebSocketProvider>
  );
}

const ProgressTab = ({ onChangeTab }) => {
  const [weightProgress, setWeightProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [generalData, setGeneralData] = useState(null);
  const [targets, setTargets] = useState(null);
  const [gender, setGender] = useState(null);
  const [difference, setdifference] = useState(0);
  const [goal, setGoal] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [liveDes, setLiveDes] = useState(null);
  const [totalMem, setTotalMem] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-100)).current;

  const deviceIsTablet = isTablet();

  const statsAnimations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(50))
  ).current;

  const actionAnimations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(50))
  ).current;

  const [dietStats, setDietStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [boxValues, setBoxValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posters, setPosters] = useState(null);

  const router = useRouter();

  useFeedSocket(async (message) => {
    if (
      message.action === "get_initial_data" ||
      message.action === "update_live_count"
    ) {
      if (message.live_count !== undefined) {
        setLiveCount(message.live_count);
        setLiveDes(message.live_count);
      } else {
        setLiveCount(0);
      }
    }
  });

  useEffect(() => {
    const mainAnimations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: clientInfo.progress,
        duration: 1500,
        useNativeDriver: false,
      }),
    ];

    const statsAnims = statsAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    );

    const actionAnims = actionAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      ...mainAnimations,
      ...statsAnims,
      ...actionAnims,
    ]).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: width,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getHomeData();
    }, [])
  );

  useBackHandler();

  const clientInfo = {
    name: boxValues?.name,
    profileImage: boxValues?.profile,
    progress: 0.75,
  };

  const getHomeData = async () => {
    setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      let gender = await AsyncStorage.getItem("gender");
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

      const response = await clientProgressAPI(payload);

      if (response?.status === 200) {
        setGender(gender);
        setdifference(Math.abs(response?.data?.difference));
        setGoal(response?.data?.goals);
        setWeightProgress(response?.data?.weight_progress);
        setPosters(response?.data?.posters);
        setTotalMem(response?.data?.gym_count);
        setLeaderboard(response?.data?.leaderboard);
        setBmi(response?.data?.bmi);
        setDietStats(response?.data?.diet_progress);
        setTargets({
          calories: response?.data?.diet_progress?.calories?.target || "",
          protein: response?.data?.diet_progress?.protein?.target || "",
          carbs: response?.data?.diet_progress?.carbs?.target || "",
          fat: response?.data?.diet_progress?.fat?.target || "",
        });
        setRewardInfo(response?.data?.reward_info);
        setWorkoutData(response?.data?.workout_data);
        setGeneralData(response?.data?.general_data);
        try {
          const parsedHealthDashboard = JSON.parse(
            response?.data?.health_dashboard
          );
          setChartData(parsedHealthDashboard);
        } catch (parseError) {
          setChartData({
            weight: [],
            calories: [],
            calories_burnt: [],
            protein: [],
            fat: [],
            carbs: [],
            water_intake: [],
          });
        }
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
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FitnessLoader />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flex: 1 }}>
        <WeightProgressCard
          targetWeight={weightProgress?.target_weight || 0}
          currentWeight={weightProgress?.actual_weight || 0}
          initialWeight={weightProgress?.start_weight || 0}
          progress={weightProgress?.progress || 0}
          getHomeData={getHomeData}
          gender={gender || "male"}
          goal={goal}
          difference={difference}
        />
      </View>

      <View style={{ flex: 1 }}>
        <FitnessInfoCards
          liveValue
          totalValue={totalMem || 0}
          leaderboardValue={leaderboard?.rank || 0}
          leaderboardTotal={leaderboard?.total || 0}
          onLivePress={() => console.log("Live card pressed")}
          onLeaderboardPress={() => console.log("Leaderboard card pressed")}
          gender={gender || "male"}
          onChangeTab={onChangeTab}
          liveCount={liveCount}
          liveDes={liveDes}
        />
      </View>

      <View style={styles.cardRow}>
        <View style={styles.cardContainer}>
          <HomeBMICard bmi={bmi} />
        </View>

        <View style={styles.cardContainer}>
          <HomeWaterTrackerCard onChangeTab={onChangeTab} />
        </View>
      </View>
      {posters ? (
        <View
          style={{ height: deviceIsTablet ? 300 : 200, marginVertical: 20 }}
        >
          <Carousel data={posters} onChangeTab={onChangeTab} gender={gender} />
        </View>
      ) : (
        ""
      )}

      <DietProgressTracker
        calories={dietStats?.calories}
        protein={dietStats?.protein}
        carbs={dietStats?.carbs}
        fat={dietStats?.fat}
      />

      <View style={{ flex: 1 }}>
        <CalorieCardsComponent
          calculate={generalData}
          target={targets}
          getHomeData={getHomeData}
          gender={gender || "male"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <WorkoutSummaryCard
          duration={workoutData?.total_time}
          calories={workoutData?.total_calories}
          points={workoutData?.total_volume}
          onStartPress={() => console.log("Start pressed")}
          onKnowMorePress={() =>
            router.push({
              pathname: "/client/workout",
              params: "Reports",
            })
          }
          gender={gender || "male"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <WorkoutStreak workoutData={workoutData?.attendance} />
      </View>

      <View style={{ flex: 1 }}>
        <GiftBar
          progress={
            rewardInfo?.client_xp && rewardInfo?.next_reward
              ? rewardInfo?.client_xp / rewardInfo?.next_reward
              : 0
          }
          message={rewardInfo?.message}
          title="Gift Bar"
        />
      </View>

      <View style={{ flex: 1 }}>
        <TopPerformers
          performers={leaderboard?.top_performers}
          onChangeTab={onChangeTab}
        />
      </View>

      <View style={{ flex: 1 }}>
        <HealthDashboard
          onButtonPress={() =>
            router.push({
              pathname: "/client/allcharts",
              params: { chartDatas: JSON.stringify(chartData) },
            })
          }
        />
      </View>

      <View style={{ flex: 1 }}>
        <Footer />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    marginTop: 30,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  profileInfo: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  weightCard: {
    margin: 20,
    marginTop: 6,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  weightGradient: {
    borderRadius: 20,
    padding: 20,
  },
  weightContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weightInfo: {
    flex: 1,
  },
  weightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  weightSubtitle: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
  },
  weightNumbers: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  currentWeight: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  weightDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#111",
    marginHorizontal: 10,
  },
  targetWeight: {
    fontSize: 14,
    color: "#111",
  },
  progressCircle: {
    marginLeft: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5757",
  },
  statsSection: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitleStatistics: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsContainer: {
    paddingHorizontal: 15,
  },
  statsCard: {
    width: width * 0.28,
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statsGradient: {
    borderRadius: 15,
    padding: 15,
    height: 110,
    alignItems: "center",
    justifyContent: "space-between",
  },
  gif: {
    height: 30,
  },
  statsContent: {
    alignItems: "center",
  },
  statsTitle: {
    color: "#111",
    fontSize: 11,
  },
  statsValue: {
    color: "#000",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 5,
  },
  quickActions: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  actionButton: {
    width: width * 0.28,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionGradient: {
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FF5757",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  viewChartsContainer: {
    margin: 20,
    marginTop: 10,
  },
  viewChartsButton: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewChartsGradient: {
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewChartsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  dietSection: {
    marginTop: 4,
    paddingVertical: 15,
  },
  dietCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  dietCard: {
    width: width * 0.44,
    marginBottom: 12,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dietGradient: {
    borderRadius: 15,
    padding: 15,
  },
  dietHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dietLabel: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  dietPercentage: {
    color: "#ff5757",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 8,
  },
  dietValues: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentValue: {
    color: "#ff5757",
    fontSize: 18,
    fontWeight: "bold",
  },
  targetValue: {
    color: "#111",
    fontSize: 14,
    marginLeft: 4,
  },
  targetDietHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    flexDirection: "row",
  },
  targetDietEditButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5757",
  },
  modalBody: {
    padding: 20,
  },
  feeCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeDetails: {
    flex: 1,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 5,
  },
  feeDate: {
    fontSize: 14,
    color: "#666",
  },
  receiptIcon: {
    marginLeft: 15,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
  },
  muscleGroups: {
    color: "#666",
    fontSize: 14,
    marginVertical: 5,
  },
  setInfo: {
    color: "#333",
    fontSize: 14,
    marginTop: 3,
  },
  variantContainer: {
    marginBottom: 20,
  },
  variantTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  mealContainer: {
    marginBottom: 15,
  },
  mealTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5757",
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  nutritionInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nutritionItem: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
    marginTop: 5,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noFeedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 6,
    zIndex: 1,
  },
  modalTitleWeight: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  inputLabelNew: {
    fontSize: 12,
    color: "#cdcdcd",
    marginVertical: 7,
  },
  inputLabelStart: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
  },
  picker: {
    height: 50,
  },
  targetDietModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  targetDietModalContent: {
    width: width * 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  targetDietModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  targetDietModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
  },
  targetDietCloseButton: {
    padding: 5,
  },
  targetDietCloseButtonText: {
    fontSize: 22,
    color: "#999",
  },
  targetDietInputContainer: {
    marginBottom: 15,
  },
  targetDietInputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  targetDietInput: {
    height: 45,
  },
  targetDietSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noteContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,

    margin: 10,
  },
  noteText: {
    fontSize: 11,
    color: "#333",
    lineHeight: 20,
  },
  buttonDisabled: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    height: 50,
    opacity: 0.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cardRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 8,
  },
  cardContainer: {
    width: "50%",
  },
});
