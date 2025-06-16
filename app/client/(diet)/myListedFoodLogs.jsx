import { useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  SectionList,
  Image,
  Animated,
} from "react-native";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientReportAPI, getClientDietAPI } from "../../../services/clientApi";
import RenderFoodCards from "./todayFoodLogPage";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import { showToast } from "../../../utils/Toaster";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const myListedFoodLogs = (props) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [report, setReport] = useState(null);
  const [consumedFoods, setConsumedFoods] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const { scrollEventThrottle, onScroll, headerHeight } = props;

  const nutritionColors = {
    calories: "#FF5757",
    protein: "#4CAF50",
    carbs: "#2196F3",
    fat: "#FFC107",
  };

  const showDate = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    setSelectedDate(currentDate);
  };

  const calculateWidth = (value, max) => {
    if (!value || !max) return 0;
    return Math.min((value / max) * 100, 100);
  };

  const renderProgressBar = (consumed, target, color) => {
    const percentage = calculateWidth(consumed, target);
    return (
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    );
  };

  const getReportDetails = async () => {
    const dateString = selectedDate.toISOString();
    const clientId = await AsyncStorage.getItem("client_id");
    setIsLoading(true);
    try {
      const response = await clientReportAPI(
        clientId,
        dateString?.split("T")[0]
      );
      if (response?.status === 200) {
        setReport(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Could not fetch report data",
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

  const fetchTodayDiet = async () => {
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await getClientDietAPI(
        clientId,
        selectedDate?.toISOString().split("T")[0]
      );

      if (response?.status === 200) {
        setConsumedFoods(response?.data || []);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Could not fetch diet data",
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

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getReportDetails();
        await fetchTodayDiet();
      };
      fetchData();
    }, [selectedDate])
  );

  if (isLoading) {
    return <FitnessLoader page="diet" />;
  }

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler routePath="/client/diet" enabled={true} />

        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            router.push("/client/diet");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Diet</Text>
        </TouchableOpacity>

        {consumedFoods?.length > 0 && (
          <RenderFoodCards mockData={consumedFoods} />
        )}

        {consumedFoods?.length === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() => router.push("/client/addFoodListPage")}
            buttonText={"Add Food"}
            message={
              "Looks like you have not added anything today!\nTap below to add your favorite meals and track your intakes."
            }
            belowButtonText={"Forgot to Log? Tap Here "}
            onButtonPress2={() => {
              router.push({
                pathname: "/client/addFoodListPage",
                params: { date: new Date() },
              });
            }}
          />
        )}
      </View>
    </>
  );
};

export default myListedFoodLogs;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    // padding: width * 0.04,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
});
