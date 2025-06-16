import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform, Image } from "react-native";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { HapticTab } from "@/components/HapticTab";
import { LogBox } from "react-native";

// Ignore specific warnings that might be causing crashes
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
]);

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const segments = pathname.split("/");
    const currentTab = segments[1];

    if (
      ["home", "feed", "workout", "diet", "marketplace"].includes(currentTab)
    ) {
      setActiveTab(currentTab);
    } else if (segments[1] === "client") {
      // Your client logic here
    } else {
      setActiveTab("home");
    }
  }, [pathname]);

  const getTabColor = (routeName) => {
    const tabColors = {
      home: "#A1338E",
      feed: "#1DA1F2",
      workout: "#297DB3",
      diet: "#28A745",
      marketplace: "#D11AFF",
      default: "#A1338E",
    };

    if (routeName === activeTab) {
      return tabColors[routeName] || tabColors.default;
    }

    return "#979797";
  };

  // Custom tab icon generator function
  const getTabIcon = (routeName, isActive) => {
    // Define your image paths
    const icons = {
      home: {
        active: require("@/assets/images/icons/home-active.png"),
        inactive: require("@/assets/images/icons/home-inactive.png"),
      },
      feed: {
        active: require("@/assets/images/icons/feed-active.png"),
        inactive: require("@/assets/images/icons/feed-inactive.png"),
      },
      workout: {
        active: require("@/assets/images/icons/workout-active.png"),
        inactive: require("@/assets/images/icons/workout-inactive.png"),
      },
      diet: {
        active: require("@/assets/images/icons/diet-active.png"),
        inactive: require("@/assets/images/icons/diet-inactive.png"),
      },
      marketplace: {
        active: require("@/assets/images/icons/shop-active.png"),
        inactive: require("@/assets/images/icons/shop-inactive.png"),
      },
    };

    // Return the appropriate image based on active state
    return (
      <Image
        source={isActive ? icons[routeName].active : icons[routeName].inactive}
        style={{ width: icons[routeName] == "workout" ? 27 : 45, height: 27 }}
        resizeMode="contain"
      />
    );
  };

  // Navigation handler to reset parameters
  const handleTabPress = (routeName) => {
    setActiveTab(routeName);
    // Navigate to the base route without parameters
    router.push({
      pathname: `/client/${routeName}`,
      params: {
        tab: "My Progress",
        workoutTab: "Add Workout",
        selectedTab: "+Add",
      },
    });
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: getTabColor(route.name),
          tabBarInactiveTintColor: "#000000",
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "#FFFFFF",
              borderTopWidth: 0,
              paddingTop: 5,
              height: 70,
              display: pathname.includes("/marketplace") ? "none" : "flex",
            },
            default: {
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderColor: "#FFDDDD",
              paddingTop: 5,
              height: 70,
              display: pathname.includes("/marketplace") ? "none" : "flex",
            },
          }),
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 5,
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 2,
          },
        })}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => getTabIcon("home", focused),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default behavior
              e.preventDefault();
              handleTabPress("home");
            },
          }}
        />

        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ focused }) => getTabIcon("feed", focused),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleTabPress("feed");
            },
          }}
        />

        <Tabs.Screen
          name="workout"
          options={{
            title: "Workout",
            tabBarIcon: ({ focused }) => getTabIcon("workout", focused),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleTabPress("workout");
            },
          }}
        />

        <Tabs.Screen
          name="diet"
          options={{
            title: "Diet",
            tabBarIcon: ({ focused }) => getTabIcon("diet", focused),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleTabPress("diet");
            },
          }}
        />

        <Tabs.Screen
          name="marketplace"
          options={{
            title: "Shop",
            tabBarIcon: ({ focused }) => getTabIcon("marketplace", focused),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation behavior
              e.preventDefault();

              // Set active tab state
              setActiveTab("marketplace");

              // Navigate directly to the marketplace page
              router.push("/client/marketplace");
            },
          }}
        />
      </Tabs>
    </>
  );
}
