import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MealsCategoryCard from "../../../components/ui/Diet/MealsCategoryCard";
import MissedLogCard from "../../../components/ui/Diet/MissedLogCard";
import MissedMealsModal from "../../../components/ui/Diet/MissedMealsModal";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import GradientButton from "../../../components/ui/GradientButton";
import GradientButton2 from "../../../components/ui/GradientButton2";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { getSingleDietTemplateAPI } from "../../../services/clientApi";
import { addClientDietAPI } from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
const { width, height } = Dimensions.get("window");

const mockData = [
  {
    id: "1",
    title: "Early Morning Detox",
    timeRange: "6:00 am - 7:00 am",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "2",
    title: "Pre-Breakfast / Pre-Meal Starter",
    timeRange: "7:30 am - 8:00 am",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "3",
    title: "Breakfast",
    timeRange: "8:00 am - 9:30 am",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "4",
    title: "Mid-Morning Snack",
    timeRange: "10:30 am - 11:30 am",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "5",
    title: "Lunch",
    timeRange: "12:30 pm - 2:00 pm",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "6",
    title: "Evening Snack",
    timeRange: "4:00 pm - 6:00 pm",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "7",
    title: "Dinner",
    timeRange: "7:00 pm - 8:30 pm",
    selected: false,
    foodList: [],
    itemsCount: 0,
  },
];

const trainerAssignedTemplateLogDietPage = (props) => {
  const router = useRouter();
  const [templateData, setTemplateData] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });

  const {
    templateTitle,
    templateId,
    defaultTemplateId,
    defaultTemplateTitle,
    method,
    templateData: templateData2,
  } = useLocalSearchParams();

  // Handle date selection
  const handleDateSelect = (date) => {
    setDateAdd(date);
    setSelectedDate(date);
    setMissedMealsModalVisible(true);
  };

  useEffect(() => {
    if (templateData2) {
      setTemplateData(JSON.parse(templateData2).diet_data);
      setNutrition({
        calories: JSON.parse(templateData2).calories,
        protein: JSON.parse(templateData2).protein,
        fat: JSON.parse(templateData2).fat,
        carbs: JSON.parse(templateData2).carbs,
      });
    }

    return () => {};
  }, [templateData2]);

  useEffect(() => {
    const fetchParticularTemplateData = async (id) => {
      setIsLoading(true);
      try {
        const response = await getSingleDietTemplateAPI(id);

        if (response?.status === 200) {
          if (
            response?.data?.diet_data &&
            Array.isArray(response.data.diet_data)
          ) {
            // Make sure each category and meal has a selected property
            const formattedData = response.data.diet_data.map((category) => ({
              ...category,
              selected: false,
              foodList: category.foodList.map((meal) => ({
                ...meal,
                selected: false,
              })),
            }));
            setTemplateData(formattedData);
          } else {
            console.log(
              "API response structure is different than expected, using mock data"
            );
          }
        }
      } catch (error) {
        const errorMessage = "Something went wrong, please try again.";
        Alert.alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      fetchParticularTemplateData(templateId);
    } else {
      setIsLoading(false);
    }
  }, [templateId]);

  const handleSelection = ({ mealId, catId }) => {
    let updatedTemplateData = [...templateData];

    // Case 1: Category selection (toggle all meals in a category)
    if (catId && !mealId) {
      const categoryIndex = updatedTemplateData.findIndex(
        (cat) => cat.id === catId
      );

      if (categoryIndex !== -1) {
        // Toggle the category's selection state
        const isCategorySelected = !updatedTemplateData[categoryIndex].selected;

        // Update category and all its meals
        updatedTemplateData[categoryIndex] = {
          ...updatedTemplateData[categoryIndex],
          selected: isCategorySelected,
          foodList: updatedTemplateData[categoryIndex].foodList.map((meal) => ({
            ...meal,
            selected: isCategorySelected,
          })),
        };
      }
    }
    // Case 2: Individual meal selection
    else if (catId && mealId) {
      const categoryIndex = updatedTemplateData.findIndex(
        (cat) => cat.id === catId
      );

      if (categoryIndex !== -1) {
        const mealIndex = updatedTemplateData[categoryIndex].foodList.findIndex(
          (meal) => meal.id === mealId
        );

        if (mealIndex !== -1) {
          // Toggle the meal's selection state
          const isMealSelected =
            !updatedTemplateData[categoryIndex].foodList[mealIndex].selected;

          // Update the meal
          updatedTemplateData[categoryIndex].foodList[mealIndex] = {
            ...updatedTemplateData[categoryIndex].foodList[mealIndex],
            selected: isMealSelected,
          };

          // Check if all meals in the category are now selected
          const areAllMealsSelected = updatedTemplateData[
            categoryIndex
          ].foodList.every((meal) => meal.selected);

          // Update the category selection state
          updatedTemplateData[categoryIndex] = {
            ...updatedTemplateData[categoryIndex],
            selected: areAllMealsSelected,
          };
        }
      }
    }

    setTemplateData(updatedTemplateData);
    updateSelectedMealsList(updatedTemplateData);
  };

  // Helper function to update the list of selected meals
  const updateSelectedMealsList = (updatedTemplateData) => {
    const allSelectedMeals = [];

    updatedTemplateData.forEach((category) => {
      category.foodList.forEach((meal) => {
        if (meal.selected) {
          allSelectedMeals.push({
            ...meal,
            categoryId: category.id,
            categoryTitle: category.title,
          });
        }
      });
    });

    setSelectedMeals(allSelectedMeals);
  };

  const saveFoods = async () => {
    if (!dateAdd) {
      return;
    }

    if (selectedMeals.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    // Handle regular diet log
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const newFoods = selectedMeals.map((food) => {
        const quantity = parseInt(food.quantity) || 1;
        return {
          ...food,
          id: `${food.id}-${Date.now()}-${Math.random()}`,
          quantity,
          calories: food.calories * quantity,
          protein: food.protein * quantity,
          carbs: food.carbs * quantity,
          fat: food.fat * quantity,
          date: format(dateAdd, "yyyy-MM-dd"),
          timeAdded: format(new Date(), "HH:mm"),
        };
      });

      const payload = {
        client_id: clientId,
        date: dateAdd?.toISOString().split("T")[0],
        diet_data: newFoods,
        gym_id: gymId,
      };

      const response = await addClientDietAPI(payload);

      if (response?.status === 200) {
        // setSelectedFoods([]);
        setDateAdd(new Date());
        const earnedXp = response?.reward_point || 0;
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
        } else {
          setXpRewardVisible(false);
        }

        if (!earnedXp) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Diet Added Successfully.",
          });
          router.push({
            pathname: "/client/myListedFoodLogs",
          });

          setXpRewardVisible(false);
        } else {
          setTimeout(() => {
            router.push({
              pathname: "/client/myListedFoodLogs",
            });

            setXpRewardVisible(false);
          }, 3000);
        }

        return response;
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error adding diet",
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

  if (isLoading) {
    return <FitnessLoader page="diet" />;
  }

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler
          routePath="/client/(diet)/personalTemplate"
          params={{ method: "gym" }}
          enabled={true}
        />
        {xpRewardVisible ? (
          <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
        ) : (
          ""
        )}

        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            if (templateTitle) {
              router.push({
                pathname: "/client/personalTemplate",
                params: { method: method },
              });
            } else {
              if (method === "gym") {
                router.push({
                  pathname: "/client/personalTemplate",
                  params: { method: method },
                });
              } else {
                router.push({
                  pathname: "/client/sampleTemplate",
                  params: { method: method },
                });
              }
            }
            // router.push('/client/personalTemplate');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {templateTitle || defaultTemplateTitle}
          </Text>
        </TouchableOpacity>

        {/* <MissedLogCard
          onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
        /> */}

        {selectedDate && (
          <View
            style={{
              marginTop: 5,
              marginBottom: 5,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GradientButton2
              title={
                selectedDate
                  ? format(selectedDate, "MMMM dd, yyyy")
                  : "yyyy-MM-dd"
              }
              fromColor="#28A745"
              toColor="#007BFF"
              containerStyle={{ marginTop: 0 }}
              textStyle={{ fontSize: 12 }}
              onPress={() =>
                setMissedMealsModalVisible(!missedMealsModalVisible)
              }
            />
          </View>
        )}

        {nutrition?.calories > 0 && (
          <FlatList
            data={templateData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.foodList && item.foodList.length > 0) {
                return (
                  <MealsCategoryCard
                    title={item.title}
                    timeRange={item.timeRange}
                    itemsCount={item.foodList?.length || 0}
                    foodList={item.foodList}
                    onPress={() => {
                      router.push({
                        pathname: "/client/addFoodListPage",
                        params: {
                          templateTitle: templateTitle,
                          mealTitle: item.title,
                          mealTimeRange: item.timeRange,
                          mealId: item.id,
                          templateId: templateId,
                          templateData: JSON.stringify(templateData),
                        },
                      });
                    }}
                    catSelected={item.selected}
                    categoryId={item.id}
                    templateTitle={templateTitle}
                    templateId={templateId}
                    updateDietTemplate={() => {}}
                    logFood={true}
                    handleSelection={(params) =>
                      handleSelection({
                        ...params,
                        catId: item.id,
                      })
                    }
                    defaultTemplateId={defaultTemplateId}
                    method={method}
                  />
                );
              }
              return null;
            }}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
          />
        )}

        {nutrition?.calories > 0 && (
          <>
            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {`Log ${selectedMeals.length} selected meal${
                  selectedMeals.length !== 1 ? "s" : ""
                }`}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <GradientButton
                title={"Add to Food logs"}
                fromColor="#28A745"
                toColor="#007BFF"
                containerStyle={{ marginTop: 0 }}
                textStyle={{ fontSize: 12 }}
                onPress={saveFoods}
                disabled={isLoading || selectedMeals.length === 0}
              />
            </View>
          </>
        )}

        {nutrition?.calories === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() => router.push("/client/addFoodListPage")}
            // buttonText={'Add Food'}
            message={
              "Looks like you have not added anything today!\nTap below to add your favorite meals and track your intakes."
            }
            // belowButtonText={'Forgot to Log? Tap Here '}
            onButtonPress2={() => {}}
          />
        )}

        <MissedMealsModal
          onClose={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          visible={missedMealsModalVisible}
          date={selectedDate}
          onChangeDate={(date) => setSelectedDate(date)}
          onSubmit={handleDateSelect}
        />
      </View>
    </>
  );
};

export default trainerAssignedTemplateLogDietPage;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#FFF",
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
  logButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: width * 0.05,
    marginVertical: 10,
    alignItems: "center",
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginBottom: 0,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 0,
  },
});
