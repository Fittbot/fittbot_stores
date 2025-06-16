// HeaderComponent.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ImageBackground,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import DietHeader from "./DietHeader";
import XpCard from "./XpCard";
import { useNavigation } from "../../../context/NavigationContext";
import { useRouter } from "expo-router";

const HeaderComponent = ({
  userName,
  progress,
  tag,
  badge,
  showHeader = false,
  headerTranslateY,
  gymName,
  xp,
  tabHeaders,
  activeTabHeader,
  setActiveTabHeader,
  setShowHeader,
  isMenuVisible,
  setIsMenuVisible,
  setShowBadgeSummary,
  menuItems,
  profile,
  width,
  tabScrollViewRef,
  bgImage,
  tabIndex,
  color1,
  color2,
  toggleSideNav,
  headerName,
  gymDetails,
}) => {
  if (!showHeader) return null;

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const index = tabHeaders.findIndex((tab) => tab.title === activeTabHeader);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [activeTabHeader, tabHeaders]);

  const topRowOpacity = headerTranslateY.interpolate({
    inputRange: [-20, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const descriptionOpacity = headerTranslateY.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const titleTopPosition = headerTranslateY.interpolate({
    inputRange: [-30, 0],
    outputRange: [-10, 0],
    extrapolate: "clamp",
  });

  const radius = 25;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = 80;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  const handleTabSelection = (tab, index) => {
    setActiveTabHeader(tab);
    setShowHeader(true);
    setSelectedIndex(index);
    scrollToTab(tab);
  };

  const scrollToTab = (tabName) => {
    const index = tabIndex.indexOf(tabName);
    if (index !== -1 && tabScrollViewRef.current) {
      const approximateTabWidth = 100;
      const scrollToX = Math.max(
        0,
        index * approximateTabWidth - width / 2 + approximateTabWidth / 2
      );
      tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
    }
  };

  const getBackgroundImage = () => {
    if (bgImage) return bgImage;

    const activeTab = tabHeaders.find((tab) => tab.title === activeTabHeader);
    if (activeTab && activeTab.bgImage) {
      return activeTab.bgImage;
    }

    return tabHeaders[selectedIndex]?.bgImage;
  };
  const router = useRouter();

  const goToGymDetails = () => {
    router.push({
      pathname: "/client/profile",
      params: {
        tab: "gym",
      },
    });
  };

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: showHeader ? 1 : 0,
          height: showHeader ? "auto" : 0,
        },
      ]}
    >
      <ImageBackground
        source={getBackgroundImage()}
        style={styles.headerGradient}
        contentFit="cover"
      >
        <View style={styles.headerContent}>
          <Animated.View style={[styles.topRow]}>
            <View style={styles.companyContainer}>
              <TouchableOpacity onPress={toggleSideNav}>
                <Ionicons
                  name="menu-outline"
                  size={28}
                  color={"#fff"}
                ></Ionicons>
              </TouchableOpacity>
              <Text style={styles.logoText}>
                <Text style={styles.logoFirstPart}>Fitt</Text>
                <Text style={styles.logoSecondPart}>bot</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={goToGymDetails}
            >
              <Text style={{ color: "white", marginRight: 10 }}>
                {gymDetails?.name}
              </Text>
              <View style={styles.profileButtonInitial}>
                <View style={styles.profileIcon}>
                  <Image
                    source={
                      gymDetails?.logo ||
                      require("../../../assets/images/header/gym_logo.png")
                    }
                    style={{ width: 30, height: 30, borderRadius: 15 }}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.tabDescription,
              {
                opacity: descriptionOpacity,
                height: descriptionOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
                marginTop: descriptionOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0],
                }),
              },
            ]}
          >
            <XpCard
              userName={userName}
              profileImage={profile}
              xp={xp}
              quote={tag}
              progress={progress}
              badgeImage={badge}
              color1={color1}
              color2={color2}
              onBadgePress={() => setShowBadgeSummary(true)}
            />
          </Animated.View>

          <DietHeader
            ref={tabScrollViewRef}
            tabHeaders={tabHeaders}
            activeTabHeader={activeTabHeader}
            handleTabSelection={handleTabSelection}
            headerName={headerName}
          />
        </View>
      </ImageBackground>

      {/* Original Modal - Keep this for profile menu */}
      {/* <Modal
        transparent={true}
        visible={isMenuVisible}
        animationType="slide"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          // onPressOut={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={24} color="#FF5757" />
                <Text style={styles.menuItemText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal> */}
    </Animated.View>
  );
};

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
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
    fontSize: 17,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
    paddingLeft: 8,
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
  // Side Navigation Styles
  sideNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  sideNavBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sideNavContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sideNavHeader: {
    padding: 20,
    backgroundColor: "#F5E7FF",
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: "#9B4DEE",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  sideNavContent: {
    paddingTop: 15,
  },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E7FF",
  },
  sideNavItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideNavIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sideNavItemText: {
    fontSize: 16,
    color: "#333",
  },
  // Side Navigation Styles
  sideNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  sideNavBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sideNavContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sideNavHeader: {
    padding: 20,
    backgroundColor: "#F5E7FF",
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: "#9B4DEE",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  sideNavContent: {
    paddingTop: 15,
  },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E7FF",
  },
  sideNavItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideNavIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sideNavItemText: {
    fontSize: 16,
    color: "#333",
  },
});
