import React from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { showToast } from "../../../utils/Toaster";

const MenuItems = ({ setIsMenuVisible = {} }) => {
  const menuItems = [
    {
      id: "profile",
      icon: "person-outline",
      text: "My Profile",
      onPress: () => {
        router.push("/client/profile");
        setIsMenuVisible(false);
      },
    },
    // Only show subscription on Android
    ...(Platform.OS === "android"
      ? [
          {
            id: "subscription",
            icon: "card-outline",
            text: "My Subscription",
            onPress: () => {
              router.push("/client/subscription");
              setIsMenuVisible(false);
            },
          },
        ]
      : []),
    {
      id: "preferences",
      icon: "notifications-outline",
      text: "Preferences",
      onPress: () => {
        router.push("/client/preferences");
        setIsMenuVisible(false);
      },
    },
    {
      id: "feedback",
      icon: "mail-outline",
      text: "Gym Feedback",
      onPress: () => {
        router.push("/client/clientfeedback");
        setIsMenuVisible(false);
      },
    },
    // {
    //   id: "refer",
    //   icon: "person-add",
    //   text: "Refer and Earn",
    //   onPress: () => {
    //     router.push("/client/referral");
    //     setIsMenuVisible(false);
    //   },
    // },
    {
      id: "manage_gym",
      icon: "cash-outline",
      text: "Manage Gym Membership",
      onPress: () => {
        router.push("/unpaid/activateaccount");
        setIsMenuVisible(false);
      },
    },
    {
      id: "support",
      icon: "help-circle-outline",
      text: "Help & Support",
      onPress: () => {
        router.push("/client/help");
        setIsMenuVisible(false);
      },
    },
    {
      id: "rate_us",
      icon: "star-outline",
      text: "Rate Us",
      onPress: () => {
        router.push("/client/ratenow");
        setIsMenuVisible(false);
      },
    },
    {
      id: "logout",
      icon: "log-out-outline",
      text: "Logout",
      onPress: async () => {
        try {
          await AsyncStorage.removeItem("gym_id");
          await AsyncStorage.removeItem("client_id");
          await AsyncStorage.removeItem("gym_name");
          await AsyncStorage.removeItem("role");
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          router.push("/");
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again later",
          });
        }
        setIsMenuVisible(false);
      },
    },
  ];

  return { menuItems };
};

export default MenuItems;
