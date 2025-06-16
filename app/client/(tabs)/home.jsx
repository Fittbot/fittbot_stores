import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import useBackHandler from "../../../components/UseBackHandler ";
import ProgressTab from "../../../components/ui/Home/myprogress";
import GymTab from "../../../components/ui/Home/mygym";
import Buddy from "../../../components/ui/Home/buddy";
import GeneralAnalysis from "../../../components/ui/Home/generalanalysis";
import MyLeaderboard from "../../../components/ui/Home/myleaderboard";
import OnboardingModal from "../../../components/ui/Home/OnboardingModal";
import Rewards from "../../../components/ui/Home/rewards";
import WaterTracker from "../../../components/ui/Home/watertracker";
import { registerForPushNotificationsAsync } from "../../../components/usePushNotifications";
import { useNavigation } from "../../../context/NavigationContext";
import {
  caloriesCalculateAPI,
  checkClientTargetsAPI,
  ClientWeightUpdateAPI,
  ClientWeightUpdateNewAPI,
  getClientXpAPI,
} from "../../../services/clientApi";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { showToast } from "../../../utils/Toaster";
import { BackHandler } from "react-native";
import Reminders from "../../../components/ui/Home/reminder";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import apiConfig from "../../../services/apiConfig";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 235;
const baseURL = apiConfig.API_URL;

const tabHeaders = [
  {
    title: "My Progress",
    bgImage: require("../../../assets/images/background/home.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/progress.png"),
  },
  {
    title: "My Gym",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/my_gym.png"),
    bgImage: require("../../../assets/images/background/mygym.png"),
  },
  {
    title: "Gym Buddy",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/buddy.png"),
    bgImage: require("../../../assets/images/background/buddy.png"),
  },
  {
    title: "Water",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/water.png"),
    bgImage: require("../../../assets/images/background/water_bg.png"),
  },
  {
    title: "Reminders",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/remind.png"),
    bgImage: require("../../../assets/images/background/reminder.png"),
  },
  {
    title: "Analysis",
    iconType: "png",
    iconSource: require("../../../assets/images/diet/analysis_icon.png"),
    bgImage: require("../../../assets/images/background/buddy.png"),
  },
  {
    title: "My Rewards",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/rewards.png"),
    bgImage: require("../../../assets/images/feed/feed_bg.png"),
  },
  {
    title: "Leaderboard",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/leaderboard.png"),
    bgImage: require("../../../assets/images/background/leaderboard_bg.png"),
  },
];

const bgColors = {
  "My Progress": {
    color1: "#7b2cbf",
    color2: "#e5383b",
  },
  "My Gym": {
    color1: "#0E364E",
    color2: "#03A3FA",
  },
  "Gym Buddy": {
    color1: "#006FAD",
    color2: "#A7C6DB",
  },
  Water: {
    color1: "#006FAD",
    color2: "#8EF4C2",
  },
  Reminders: {
    color1: "#1595A3",
    color2: "#699FA5",
  },
  Analysis: {
    color1: "#0E364E",
    color2: "#ADD1E5",
  },
  "My Rewards": {
    color1: "#0154A0",
    color2: "#022950",
  },
  Leaderboard: {
    color1: "#00B4DB",
    color2: "#0E364E",
  },
};

const App = () => {
  const { tab, notif_timestamp } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [gymName, setGymName] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("My Progress");
  const [headerHeight, setHeaderHeight] = useState(HEADER_MAX_HEIGHT);
  const [xp, setXp] = useState(null);
  const [profile, setProfile] = useState("");
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(true);
  const [completeSetup, setCompleteSetup] = useState(false);
  const [targetCaloriesConfigured, setTargetCaloriesConfigured] =
    useState(false);
  const [targetWeightConfigured, setTargetWeightConfigured] = useState(false);
  const [myParams, setMyParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const [boxValues, setBoxValues] = useState({
    actual_weight: "",
    height: "",
    age: "",
    lifestyle: "",
    goals: "",
    start_weight: "",
    target_weight: "",
  });
  const [targets, setTargets] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [lastNotifTimestamp, setLastNotifTimestamp] = useState(null);
  const [sideBarData, setSideBarData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [badge, setBadge] = useState(null);
  const [tag, setTag] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);
  const router = useRouter();
  useEffect(() => {
    if (notif_timestamp && notif_timestamp !== lastNotifTimestamp) {
      setLastNotifTimestamp(notif_timestamp);
      scrollY.setValue(0);

      const checkNotificationData = async () => {
        try {
          const storedTab = await AsyncStorage.getItem("notification_tab");
          if (storedTab) {
            handleTabChange(storedTab);

            await AsyncStorage.removeItem("notification_tab");
          }
        } catch (error) {
          console.error("Error reading notification data:", error);
        }
      };

      checkNotificationData();
    }
  }, [notif_timestamp]);

  // useEffect(() => {
  //   if (tab) {
  //     handleTabChange(tab);
  //   }
  // }, [tab]);

  const handleTabChange = (newTab) => {
    setActiveTabHeader(newTab);
    scrollToTab(newTab);
  };

  const scrollToTab = (tabName) => {
    const tabIndex = [
      "My Progress",
      "My Gym",
      "Gym Buddy",
      "Water",
      "Reminders",
      "Analysis",
      "My Rewards",
      "Leaderboard",
    ].indexOf(tabName);
    if (tabIndex !== -1 && tabScrollViewRef.current) {
      const approximateTabWidth = 100;
      const scrollToX = Math.max(
        0,
        tabIndex * approximateTabWidth - width / 2 + approximateTabWidth / 2
      );
      tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
    }
  };

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const getGymName = async () => {
    const current_name = await AsyncStorage.getItem("gym_name");
    setGymName(current_name);
    setLoading(false);
  };

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  useEffect(() => {
    getGymName();
    if (!tab) {
      setActiveTabHeader("My Progress");
      setHeaderHeight(HEADER_MAX_HEIGHT);
    }
    setActiveTabHeader("My Progress");
  }, []);

  const fetchXp = async () => {
    setLoading(true);
    try {
      setXp("...");
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getClientXpAPI(client_id);
      if (response?.status === 200) {
        setProfile(response?.profile);
        setTag(response?.tag);
        setXp(response?.data?.xp);
        setBadge(response?.badge);
        setProgress(response?.progress);
        setSideBarData({
          profile: response?.profile,
          userName: response?.name,
          userEmail: response?.email,
        });
        setGymDetails(response?.gym);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching rewards",
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

  const checkClientStatus = async () => {
    setIsLoading(true);
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      await registerForPushNotificationsAsync(client_id);
      const response = await checkClientTargetsAPI(client_id);
      if (response?.status === 200) {
        setTargetCaloriesConfigured(response?.calories);
        setTargetWeightConfigured(response?.weight);
        setBoxValues(response?.data?.client);
        if (response?.calories === false || response?.weight === false) {
          setShowOnboardingModal(true);
        } else {
          setShowOnboardingModal(false);
          fetchXp();
        }

        setTargets({
          calories: response?.data?.target_actual?.calories?.target || "",
          protein: response?.data?.target_actual?.protein?.target || "",
          carbs: response?.data?.target_actual?.carbs?.target || "",
          fat: response?.data?.target_actual?.fat?.target || "",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (activeTabHeader !== "My Progress") {
          setActiveTabHeader("My Progress");
          scrollToTab("My Progress");
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [activeTabHeader])
  );

  const changeTab = (path, params) => {
    setActiveTabHeader(path);
    scrollToTab(path);
    setMyParams(params);
  };
  const onNullTab = () => {
    setMyParams("");
  };

  const renderContent = () => {
    if (activeTabHeader === "My Gym") {
      return <GymTab />;
    } else if (activeTabHeader === "My Progress") {
      return <ProgressTab onChangeTab={changeTab} />;
    } else if (activeTabHeader === "Gym Buddy") {
      return <Buddy scrollY={scrollY} />;
    } else if (activeTabHeader === "Reminders") {
      return <Reminders scrollY={scrollY} />;
    } else if (activeTabHeader === "Analysis") {
      return <GeneralAnalysis />;
    } else if (activeTabHeader === "Water") {
      return <WaterTracker />;
    } else if (activeTabHeader === "My Rewards") {
      return <Rewards />;
    } else if (activeTabHeader === "Leaderboard") {
      return <MyLeaderboard tab={myParams} onNullTab={onNullTab} />;
    } else {
      return <ProgressTab />;
    }
  };

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      const checkNotificationData = async () => {
        try {
          const storedTab = await AsyncStorage.getItem("notification_tab");
          if (storedTab) {
            handleTabChange(storedTab);
            await AsyncStorage.removeItem("notification_tab");
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Error reading notification data",
          });
        }
      };

      checkNotificationData();
    }, [activeTabHeader])
  );

  const clearTokens = async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      checkAuthentication();
    } catch (error) {}
  };

  const checkAuthentication = async () => {
    try {
      setInitializing(true);
      const accessToken = await SecureStore.getItemAsync("access_token");
      const clientId = await AsyncStorage.getItem("client_id");
      const role = (await AsyncStorage.getItem("role")) || "client";

      if (!accessToken) {
        setInitializing(false);
        router.replace("/");
        return;
      }

      try {
        const response = await axios.get(`${baseURL}/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200) {
          const subscriptionResponse = await axios.get(
            `${baseURL}/auth/subscription-status`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (subscriptionResponse.status === 200) {
            const subscriptionData = subscriptionResponse.data?.data;
            const isSubscribed = subscriptionData?.subscribed === true;

            if (isSubscribed) {
              checkClientStatus();
            } else {
              router.replace("/unpaid/home");
            }
            return;
          } else {
            router.replace("/unpaid/home");
            return;
          }
        }
      } catch (error) {
        if (clientId) {
          try {
            const refreshResponse = await axios.post(
              `${baseURL}/auth/refresh`,
              {
                id: clientId,
                role: role,
              }
            );

            if (refreshResponse?.status === 200) {
              await SecureStore.setItemAsync(
                "access_token",
                refreshResponse.data.access_token
              );
              return checkAuthentication();
            } else {
              await clearTokens();
            }
          } catch (refreshError) {
            await clearTokens();
          }
        } else {
          await clearTokens();
        }
      }

      setInitializing(false);
    } catch (error) {
      await clearTokens();
      setInitializing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkAuthentication();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (tab) {
        handleTabChange(tab);
      }
    }, [tab])
  );

  const handleCompleteSetup = () => {
    setShowOnboardingModal(false);
    checkClientStatus();
  };

  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

  const calculateCalories = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        client_id: clientId,
        height: boxValues.height,
        weight: boxValues.actual_weight,
        age: boxValues.age,
        goals: boxValues.goals,
        lifestyle: boxValues.lifestyle,
      };
      const response = await caloriesCalculateAPI(payload);
      if (response?.status === 200) {
        setTargets({
          calories: response?.data?.calories || "",
          protein: response?.data?.protein || "",
          carbs: response?.data?.carbs || "",
          fat: response?.data?.fat || "",
        });
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
        desc: "An error occured. Please try again later",
      });
    }
  };

  const saveTrackingData = async (type) => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        client_id: clientId,
        target_weight: boxValues?.target_weight
          ? boxValues?.target_weight
          : null,
        actual_weight: boxValues?.actual_weight
          ? boxValues?.actual_weight
          : null,
        type: type,
        calories: targets?.calories || null,
        protein: targets?.protein || null,
        carbs: targets?.carbs || null,
        fat: targets?.fat || null,
        start_weight: boxValues?.start_weight ? boxValues?.start_weight : null,
      };

      const response = await ClientWeightUpdateNewAPI(payload);

      if (response?.status === 200) {
        setCompleteSetup(true);
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
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <FitnessLoader />
      ) : (
        <>
          {showOnboardingModal ? (
            <OnboardingModal
              visible={showOnboardingModal}
              onClose={() => {
                if (targetCaloriesConfigured && targetWeightConfigured) {
                  setShowOnboardingModal(false);
                }
              }}
              onCompleteSetup={handleCompleteSetup}
              targetCaloriesConfigured={targetCaloriesConfigured}
              targetWeightConfigured={targetWeightConfigured}
              calculateCalories={calculateCalories}
              saveTrackingData={saveTrackingData}
              targets={targets}
              setTargets={setTargets}
              boxValues={boxValues}
              setBoxValues={setBoxValues}
              completeSetup={completeSetup}
            />
          ) : (
            <>
              {loading ? (
                <FitnessLoader />
              ) : (
                <>
                  <HeaderComponent
                    userName={sideBarData?.userName}
                    progress={progress}
                    tag={tag}
                    badge={badge}
                    showHeader={true}
                    headerTranslateY={headerTranslateY}
                    gymName={gymName}
                    xp={xp}
                    tabHeaders={tabHeaders}
                    activeTabHeader={activeTabHeader}
                    setActiveTabHeader={setActiveTabHeader}
                    setShowHeader={() => {}}
                    isMenuVisible={isMenuVisible}
                    setIsMenuVisible={setIsMenuVisible}
                    setShowBadgeSummary={setShowBadgeSummary}
                    menuItems={menuItems}
                    profile={profile}
                    width={width}
                    tabScrollViewRef={tabScrollViewRef}
                    tabIndex={[
                      "My Progress",
                      "My Gym",
                      "Gym Buddy",
                      "Water",
                      "Reminders",
                      "Analysis",
                      "My Rewards",
                      "Leaderboard",
                    ]}
                    color1={bgColors[activeTabHeader]?.color1 || "#0E364E"}
                    color2={bgColors[activeTabHeader]?.color2 || "#03A3FA"}
                    toggleSideNav={toggleSideNav}
                    gymDetails={gymDetails}
                  />

                  {isSideNavVisible && (
                    <SideNavigation
                      isVisible={isSideNavVisible}
                      onClose={closeSideNav}
                      userData={sideBarData}
                      color1={bgColors[activeTabHeader]?.color1 || "#0E364E"}
                      color2={bgColors[activeTabHeader]?.color2 || "#03A3FA"}
                    />
                  )}

                  {activeTabHeader === "Gym Buddy" ||
                  activeTabHeader === "Reminders" ? (
                    renderContent()
                  ) : (
                    <Animated.ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={[
                        styles.scrollViewContent,
                        { paddingTop: headerHeight },
                      ]}
                      onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                      )}
                      scrollEventThrottle={16}
                    >
                      {renderContent()}
                    </Animated.ScrollView>
                  )}
                  <BadgeSummaryModal
                    visible={showBadgeSummary}
                    onClose={() => setShowBadgeSummary(false)}
                    userXP={parseInt(xp) || 0}
                    currentBadge={""}
                    onMoreDetails={handleMoreDetailsClick}
                  />

                  <BadgeDetailsModal
                    visible={showBadgeDetails}
                    onClose={() => setShowBadgeDetails(false)}
                    currentBadge={""}
                    currentLevel={""}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    marginBottom: Platform.OS === "ios" ? 60 : 0,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "column",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeContainer: {
    alignItems: "flex-end",
    marginRight: 10,
  },
  badgeText: {
    color: "#FFA500",
    fontSize: 14,
    fontWeight: "bold",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  xpText: {
    color: "#bbbbbb",
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    // Style for profile button if needed
  },
  profileIconWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badgeIcon: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeInitial: {
    width: 35,
    height: 35,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 0.5,
    gap: 30,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  tabItem: {
    paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  tabIconContainerActive: {
    // Style for active tab icon if needed
  },
  tabTextHeader: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  tabDescription: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
    backgroundColor: "#000",
    paddingHorizontal: 6,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#FFFFFF",
  },
  profileButtonInitial: {
    marginRight: 10,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5757",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 70,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: 250,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999, // Ensure it stays on top of other content
  },
});

export default App;
