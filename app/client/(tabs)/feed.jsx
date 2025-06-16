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
  BackHandler,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import useBackHandler from "../../../components/UseBackHandler ";
import { Image, ImageBackground } from "expo-image";
import Svg, { Circle } from "react-native-svg";
import AllFeed from "../../../components/ui/Feed/allfeeds";
import GymAnnouncements from "../../../components/ui/Feed/announcements";
import GymOffers from "../../../components/ui/Feed/gymoffers";
import { getClientXpAPI } from "../../../services/clientApi";
import { Modal } from "react-native";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import BlockedUsersScreen from "../../../components/ui/Feed/blockedusers";
import * as SecureStore from "expo-secure-store";
import MenuItems from "../../../components/ui/Header/tabs";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import { useNavigation } from "../../../context/NavigationContext";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { showToast } from "../../../utils/Toaster";

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 245;

const tabHeaders = [
  {
    title: "My Feed",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/feed.png"),
  },
  {
    title: "Gym Announcements",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/announcements.png"),
  },
  {
    title: "Gym Offers",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/offfer.png"),
  },
  {
    title: "Blocked Users",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/blocked.png"),
  },
];

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState("");
  const [xp, setXp] = useState(null);
  const [profile, setProfile] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("My Feed");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [sideBarData, setSideBarData] = useState(null);
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const { menuItems } = MenuItems({ setIsMenuVisible });
  const [progress, setProgress] = useState(0);
  const [badge, setBadge] = useState(null);
  const [tag, setTag] = useState(null);
  const { isSideNavVisible, closeSideNav } = useNavigation();
  const { toggleSideNav } = useNavigation();
  const [gymDetails, setGymDetails] = useState(null);
  const router = useRouter();

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  const scrollToTab = (tabName) => {
    const tabIndex = [
      "My Feed",
      "Gym Announcements",
      "Gym Offers",
      "Blocked Users",
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
  const getGymName = async () => {
    const current_name = await AsyncStorage.getItem("gym_name");
    setGymName(current_name);
    setLoading(false);
  };

  useEffect(() => {
    getGymName();
    setActiveTabHeader("My Feed");
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
          desc: response?.detail || "Error fetching rewards",
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

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const renderContent = () => {
    if (activeTabHeader === "My Feed") {
      return (
        <AllFeed
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
          scrollY={scrollY}
        />
      );
    } else if (activeTabHeader === "Gym Announcements") {
      return (
        <GymAnnouncements
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
        />
      );
    } else if (activeTabHeader === "Gym Offers") {
      return (
        <GymOffers
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
        />
      );
    } else if (activeTabHeader === "Blocked Users") {
      return (
        <BlockedUsersScreen
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
        />
      );
    } else {
      return (
        <AllFeed
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          headerHeight={HEADER_MAX_HEIGHT}
          scrollY={scrollY}
        />
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchXp();
      setActiveTabHeader("My Feed");
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
    }, [activeTabHeader])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (activeTabHeader !== "My Feed") {
          setActiveTabHeader("My Feed");
          scrollToTab("My Feed");
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
    <View style={styles.container}>
      {loading ? (
        <FitnessLoader page="feed" />
      ) : (
        <>
          {/* {renderHeader()} */}

          <HeaderComponent
            userName={sideBarData?.userName}
            tag={tag}
            progress={progress}
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
            bgImage={require("../../../assets/images/feed/feed_bg_2.png")}
            tabIndex={[
              "My Feed",
              "Gym Announcements",
              "Gym Offers",
              "Blocked Users",
            ]}
            color1={"#1DA1F2"}
            color2={"#52BAF9"}
            toggleSideNav={toggleSideNav}
            gymDetails={gymDetails}
            headerName={"Feed"}
          />

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              userData={sideBarData}
              color1={"#1DA1F2"}
              color2={"#52BAF9"}
            />
          )}

          {/* {activeTabHeader === "My Feed" ? ( */}
          {renderContent()}
          {/* ) : (
                        <Animated.ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.scrollViewContent,
                                { paddingTop: HEADER_MAX_HEIGHT }
                            ]}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: false }
                            )}
                            scrollEventThrottle={16}
                        >
                            {renderContent()}
                        </Animated.ScrollView>
                    )} */}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
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

export default Feed;
