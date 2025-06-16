import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { getClientXpAPI } from "../../../services/clientApi";
import {
  BadgeDetailsModal,
  BadgeSummaryModal,
} from "../../../components/ui/badgedetails";
import DietSelection from "../../../components/ui/Diet/adddiet";
import DietAnalysis from "../../../components/ui/Diet/dietanalysis";
import DietReport from "../../../components/ui/Diet/dietreport";
import DietTemplate from "../../../components/ui/Diet/diettemplates";
import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import MenuItems from "../../../components/ui/Header/tabs";
import { useNavigation } from "../../../context/NavigationContext";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import { showToast } from "../../../utils/Toaster";

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 235;

const tabHeaders = [
  // {
  //   title: 'Add Diet',
  //   iconType: 'icon', // icon, png, or image
  //   iconLibrary: MaterialCommunityIcons,
  //   iconName: 'plus-circle',
  // },
  {
    title: "+Add",
    iconType: "png",
    iconSource: require("../../../assets/images/diet/diet_icon.png"),
  },
  {
    title: "Analysis",
    iconType: "png",
    iconSource: require("../../../assets/images/diet/analysis_icon.png"),
  },
  {
    title: "Reports",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/report.png"),
  },
  {
    title: "Desi Diet",
    iconType: "png",
    iconSource: require("../../../assets/images/header-icons/desi_diet.png"),
  },
];

const Diet = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState("");
  const [activeTabHeader, setActiveTabHeader] = useState("+Add");
  const [headerHeight, setHeaderHeight] = useState(HEADER_MAX_HEIGHT);
  const [showHeader, setShowHeader] = useState(true);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [profile, setProfile] = useState("");
  const [xp, setXp] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];
  const tabScrollViewRef = useRef(null);
  const [gender, setGender] = useState("");
  const [sideBarData, setSideBarData] = useState(null);
  const { selectedTab } = useLocalSearchParams();
  const [progress, setProgress] = useState(0);
  const [badge, setBadge] = useState(null);
  const [tag, setTag] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);

  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

  const getGymName = async () => {
    const current_name = await AsyncStorage.getItem("gym_name");
    setGender(await AsyncStorage.getItem("gender"));
    setGymName(current_name);
    setLoading(false);
  };
  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  useEffect(() => {
    getGymName();
    setActiveTabHeader("+Add");
    setHeaderHeight(HEADER_MAX_HEIGHT);
  }, []);

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

  const handleSectionChange = (section) => {
    setShowHeader(section === null);
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const renderContent = () => {
    if (activeTabHeader === "+Add") {
      return (
        <>
          <DietSelection
            scrollEventThrottle={16}
            gender={gender}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            headerHeight={HEADER_MAX_HEIGHT}
            onSectionChange={handleSectionChange}
          />
        </>
      );
    } else if (activeTabHeader === "Templates") {
      return (
        <DietTemplate
          onSectionChange={handleSectionChange}
          scrollEventThrottle={16}
          headerHeight={HEADER_MAX_HEIGHT}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      );
    } else if (activeTabHeader === "Analysis") {
      return <DietAnalysis />;
    } else if (activeTabHeader === "Reports") {
      return (
        <DietReport
          scrollEventThrottle={16}
          headerHeight={HEADER_MAX_HEIGHT}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      );
    } else if (activeTabHeader === "Desi Diet") {
      // setActiveTabHeader("+Add");
      // return null;
    }
    // else if (activeTabHeader === 'Desi Diet') {
    //   return null;
    // }
    else {
      return <DietSelection />;
    }
  };

  useEffect(() => {
    if (activeTabHeader === "Desi Diet") {
      router.push("/client/allfoods");
    }
  }, [activeTabHeader]);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      setShowHeader(true);
    }, [activeTabHeader])
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     setActiveTabHeader("+Add");
  //     const scrollToX = 0;
  //     if (tabScrollViewRef.current) {
  //       tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
  //     }
  //   }, [])
  // );

  // useEffect(() => {
  //   if (selectedTab) {
  //     setActiveTabHeader(selectedTab);
  //   }
  // }, [selectedTab]);

  useFocusEffect(
    useCallback(() => {
      if (selectedTab) {
        setActiveTabHeader(selectedTab);
      }
    }, [selectedTab])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (activeTabHeader !== "+Add") {
          setActiveTabHeader("+Add");
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
        <FitnessLoader page="diet" />
      ) : (
        <>
          <HeaderComponent
            userName={sideBarData?.userName}
            progress={progress}
            badge={badge}
            tag={tag}
            showHeader={showHeader}
            headerTranslateY={headerTranslateY}
            gymName={gymName}
            xp={xp}
            tabHeaders={tabHeaders}
            activeTabHeader={activeTabHeader}
            setActiveTabHeader={setActiveTabHeader}
            setShowHeader={setShowHeader}
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            setShowBadgeSummary={setShowBadgeSummary}
            menuItems={menuItems}
            profile={profile}
            width={width}
            tabScrollViewRef={tabScrollViewRef}
            bgImage={require("../../../assets/images/diet/Diet_bg.png")}
            const
            tabIndex={["+Add", "Analysis", "Reports", "Desi Diet"]}
            color1={"#007BFF"}
            color2={"#28A745"}
            toggleSideNav={toggleSideNav}
            headerName={"Diet"}
            gymDetails={gymDetails}
          />

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              userData={sideBarData}
              color1={"#28A745"}
              color2={"#007BFF"}
            />
          )}

          {activeTabHeader === "+Add" ? (
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
                { paddingTop: headerHeight + 20 },
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
    // paddingBottom: 16,
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

export default Diet;
