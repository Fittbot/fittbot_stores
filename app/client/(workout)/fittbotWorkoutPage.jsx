import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  ImageBackground,
  Alert,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFittbotWorkoutAPI } from "../../../services/clientApi";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import { LinearGradient } from "expo-linear-gradient";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const FittbotWorkoutPage = ({
  onScroll,
  scrollEventThrottle = 16,
  onSectionChange,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fittbotWorkouts, setFittbotWorkouts] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [gender, setGender] = useState("male");

  useEffect(() => {
    fetchFittbotWorkouts();
  }, []);

  const handleSetActiveSection = (section) => {
    setActiveSection(section);
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const handleMuscleGroupSelect = (group) => {
    if (fittbotWorkouts && fittbotWorkouts[group]) {
      router.push({
        pathname: "/client/exercise",
        params: {
          muscleGroup: group,
          exercises: JSON.stringify(fittbotWorkouts),
          isMuscleGroup: fittbotWorkouts[group].isMuscleGroup,
          isCardio: fittbotWorkouts[group].isCardio,
          gender: gender,
        },
      });
    }
  };

  const fetchFittbotWorkouts = async () => {
    setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    const gender = await AsyncStorage.getItem("gender");
    if (!clientId || !gender) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error fetching fittbot workouts",
      });
    }
    try {
      setGender(gender);
      const response = await getFittbotWorkoutAPI(clientId);
      if (response?.status === 200) {
        setFittbotWorkouts(response?.data?.exercise_data);
        await AsyncStorage.setItem(
          "user_weight",
          String(response?.data?.client_weight)
        );
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error fetching fittbot workouts",
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

  const renderHeader = () => (
    <TouchableOpacity
      style={styles.listHeader}
      onPress={() => {
        router.push("/client/workout");
      }}
    >
      <Ionicons name="arrow-back" size={20} color="#333" />
      <Text style={styles.headerTitle}>Fittbot Workouts</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <View style={styles.workoutCardContainer}>
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => handleMuscleGroupSelect(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#5299DB66", "#FFFFFF"]}
          style={styles.imageBackground}
        >
          <ImageBackground
            source={{
              uri:
                gender?.toLocaleLowerCase() === "male"
                  ? fittbotWorkouts[item]?.imagePath
                  : fittbotWorkouts[item]?.imagepath_female ||
                    "https://via.placeholder.com/300x300",
            }}
            style={styles.imageBackground}
            resizeMode="contain"
            imageStyle={styles.backgroundImage}
          >
            <View style={styles.overlay} />
          </ImageBackground>
        </LinearGradient>
      </TouchableOpacity>
      <LinearGradient
        colors={["#FFFFFF", "#DCEFFF"]}
        style={styles.labelContainer}
      >
        <Text style={styles.workoutLabel}>{item.toUpperCase()}</Text>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <FitnessLoader
        page={gender.toLowerCase() === "male" ? "workout2" : "workout1"}
      />
    );
  }

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/client/workout" enabled={true} />
      <FlatList
        data={Object.keys(fittbotWorkouts || {})}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

export default FittbotWorkoutPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  flatListContent: {
    padding: 20,
    paddingBottom: height * 0.1,
  },
  listHeader: {
    marginBottom: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 15,
  },
  row: {
    justifyContent: "space-between",
  },
  workoutCardContainer: {
    width: (width - 60) / 2,
    marginBottom: 15,
  },
  workoutCard: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    // marginBottom: 5,
  },
  imageBackground: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  labelContainer: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,

    // borderRadius: 12,
    // marginTop: 5,
  },
  workoutLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
