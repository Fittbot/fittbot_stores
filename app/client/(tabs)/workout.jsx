import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  BackHandler,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import AddWorkout from "../../../components/ui/Workout/addworkout";
import WorkoutAnalysis from "../../../components/ui/Workout/workoutanalysis";
import WorkoutReports from "../../../components/ui/Workout/workoutreports";
import { getClientXpAPI } from "../../../services/clientApi";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import TransformationPage from "../transformation";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { useNavigation } from "../../../context/NavigationContext";
import { showToast } from "../../../utils/Toaster";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 210;

const tabHeaders = [
  {
    title: "Add Workout",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/add_workout.png"),
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
  },
  {
    title: "Analysis",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/diet/analysis_icon.png"),
  },
  {
    title: "Reports",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/report.png"),
  },
  {
    title: "Transformation",
    bgImage: require("../../../assets/images/workout/Workout_bg.png"),
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/transformation.png"),
  },
];

const Workout = () => {
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState("");
  const { task, workoutTab } = useLocalSearchParams();
  const [activeTabHeader, setActiveTabHeader] = useState("Add Workout");
  const [headerHeight, setHeaderHeight] = useState(HEADER_MAX_HEIGHT);
  const [showHeader, setShowHeader] = useState(true);
  const [profile, setProfile] = useState("");
  const [xp, setXp] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [sideBarData, setSideBarData] = useState(null);
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [badge, setBadge] = useState(null);
  const [tag, setTag] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);
  const router = useRouter();

  const [gender, setGender] = useState("");
  const getGymName = async () => {
    const current_name = await AsyncStorage.getItem("gym_name");
    setGender(await AsyncStorage.getItem("gender"));
    setGymName(current_name);
    setLoading(false);
  };
  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

  const {
    panHandlers,
    SwipeIndicator,
    isSwipeActive,
    isEnabled: swipeEnabled,
    swipeAnimatedValue,
    resetSwipe,
    debug,
    temporarilyDisableSwipe,
  } = useEdgeSwipe({
    onSwipeComplete: toggleSideNav,
    isEnabled: true,
    isBlocked: isSideNavVisible,
    config: {
      edgeSwipeThreshold: 30,
      swipeMinDistance: 50,
      swipeMinVelocity: 0.3,
      preventIOSBackSwipe: true,
    },
  });

  useEffect(() => {
    getGymName();
    setActiveTabHeader("Add Workout");
    setHeaderHeight(HEADER_MAX_HEIGHT);
  }, []);

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  const { menuItems } = MenuItems({ setIsMenuVisible });

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
          desc: response?.detail || "Error Fetching Rewards",
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

  useFocusEffect(
    useCallback(() => {
      fetchXp();
    }, [])
  );

  const handleTabChange = (path) => {
    setActiveTabHeader(path);
    temporarilyDisableSwipe();
  };

  useFocusEffect(
    useCallback(() => {
      if (workoutTab) {
        handleTabChange(workoutTab);
      }
    }, [workoutTab])
  );

  const handleSectionChange = (section) => {
    setShowHeader(section === null);
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const renderContent = () => {
    if (activeTabHeader === "Add Workout") {
      return (
        <AddWorkout
          gender={gender}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
          onSectionChange={handleSectionChange}
          fetchXp={fetchXp}
        />
      );
    } else if (activeTabHeader === "Analysis") {
      return <WorkoutAnalysis headerHeight={35} gender={gender} />;
    } else if (activeTabHeader === "Reports") {
      return (
        <WorkoutReports
          gender={gender}
          onSectionChange={handleSectionChange}
          scrollEventThrottle={16}
          headerHeight={240}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      );
    } else if (activeTabHeader === "Transformation") {
      return <TransformationPage headerHeight={35} gender={gender} />;
    } else {
      return <AddWorkout />;
    }
  };

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      setShowHeader(true);
    }, [activeTabHeader])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (activeTabHeader !== "Add Workout") {
          setActiveTabHeader("Add Workout");
          return true;
        } else {
          router.push("/client/home");
          return true;
        }
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

  return (
    <View style={styles.container} {...panHandlers}>
      {loading ? (
        <FitnessLoader
          page={gender.toLowerCase() === "male" ? "workout2" : "workout1"}
        />
      ) : (
        <>
          <HeaderComponent
            userName={sideBarData?.userName}
            progress={progress}
            badge={badge}
            tag={tag}
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
            tabIndex={["Add Workout", "Analysis", "Reports", "Transformation"]}
            color1={"#006dadde"}
            color2={"#006dad48"}
            toggleSideNav={toggleSideNav}
            gymDetails={gymDetails}
            headerName={"Workout"}
          />

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              userData={sideBarData}
              color2={"#006dadde"}
              color1={"#006dad48"}
            />
          )}

          {activeTabHeader === "Add Workout" ? (
            <View
              style={[
                styles.contentContainer,
                { paddingTop: showHeader ? headerHeight : 0 },
              ]}
            >
              {renderContent()}
            </View>
          ) : activeTabHeader === "Reports" ||
            activeTabHeader === "Templates" ? (
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
          <SwipeIndicator />
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
  contentContainer: {
    flex: 1,
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
    overflow: "hidden",
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
    color: "#AAAAAA",
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
});

export default Workout;
