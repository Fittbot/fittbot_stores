// screens/FoodSearchScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Keyboard,
  Alert,
} from "react-native";
import FoodCard from "../../../components/ui/Diet/FoodCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GradientButton from "../../../components/ui/GradientButton";
import {
  addClientDietAPI,
  addClientDietTemplateAPI,
  getCommonFooodAPI,
  searchClientFoodAPI,
  updateDietTemplateMeals,
} from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import { format } from "date-fns";
import GradientButton2 from "../../../components/ui/GradientButton2";
import MissedMealsModal from "../../../components/ui/Diet/MissedMealsModal";
import { useLocalSearchParams } from "expo-router";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const FoodSearchScreen = () => {
  const router = useRouter();
  const inputRef = useRef(null);

  // Params from the previous screen
  const {
    date,
    templateTitle,
    mealTitle,
    mealTimeRange,
    mealId,
    templateId,
    templateData,
    method,
  } = useLocalSearchParams();

  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [parsedTemplateData, setParsedTemplateData] = useState([]);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  // Handle date selection
  const handleDateSelect = (date) => {
    setDateAdd(date);
    setSelectedDate(date);
  };

  // Parse template data when available
  useEffect(() => {
    if (templateData) {
      try {
        const parsed = JSON.parse(templateData);
        setParsedTemplateData(parsed);
      } catch (error) {
        console.error("Error parsing template data:", error);
      }
    }
  }, [templateData]);

  // Set initial date if provided
  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
      setMissedMealsModalVisible(true);
    }
  }, [date]);

  // Fetch common food items
  const fetchCommonDiet = async () => {
    setLoading(true);
    try {
      const response = await getCommonFooodAPI();

      if (response?.status === 200) {
        setAllFoods(response?.data || []);
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
    } finally {
      setLoading(false);
    }
  };

  // Search for foods
  const searchFoods = async (query) => {
    if (query.length > 1) {
      try {
        const response = await searchClientFoodAPI(query);
        if (response?.status === 200) {
          setAllFoods(response?.data);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } else {
      await fetchCommonDiet();
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchFoods(query);
  };

  const filteredData = allFoods?.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSearchQuery("");
    searchFoods("");
    Keyboard.dismiss();
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Initial data load
  useEffect(() => {
    fetchCommonDiet();
  }, []);

  // Handle food selection
  const toggleFoodSelection = (food) => {
    if (selectedFoods.find((f) => f.id === food.id)) {
      setSelectedFoods(selectedFoods.filter((f) => f.id !== food.id));
    } else {
      setSelectedFoods([...selectedFoods, { ...food, quantity: "1" }]);
    }
  };

  // Update food quantity
  const updateFoodQuantity = (foodId, quantity) => {
    setSelectedFoods(
      selectedFoods.map((food) =>
        food.id === foodId ? { ...food, quantity } : food
      )
    );
  };

  // Handle template update
  const handleDietAPI = async () => {
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

      // Process the selected foods with quantities
      const processedFoods = selectedFoods.map((food) => {
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

      // Update the template data with the selected foods for the specific meal
      const updatedTemplateData = parsedTemplateData.map((meal) => {
        if (meal.id === mealId) {
          // Add new foods to the existing foodList or create a new one
          const existingFoodList = meal.foodList || [];
          return {
            ...meal,
            foodList: [...existingFoodList, ...processedFoods],
            itemsCount: (existingFoodList.length || 0) + processedFoods.length,
          };
        }
        return meal;
      });

      const payload = templateId
        ? {
            id: templateId,
            diet_data: updatedTemplateData,
          }
        : {
            template_name: templateTitle,
            diet_data: updatedTemplateData,
            client_id: clientId,
          };

      const response = templateId
        ? await updateDietTemplateMeals(payload)
        : await addClientDietTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response.message || "Template saved successfully",
        });

        // Navigate back to the template category page with updated data
        router.push({
          pathname: "/client/addTemplateCategoryPage",
          params: {
            templateTitle,
            templateId: response?.data?.id || templateId,
            mealId,
            mealTitle,
            mealTimeRange,
            // selectedFoods: JSON.stringify(processedFoods),
            date: dateAdd?.toISOString().split("T")[0],
            method: method,
          },
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
      console.error("Error saving template:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  // Save foods (either to template or as regular diet log)
  const saveFoods = async () => {
    if (!dateAdd) {
      return;
    }

    if (selectedFoods.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    // If we're working with a template, handle appropriately
    if (templateTitle || templateId) {
      handleDietAPI();
      return;
    }

    // Handle regular diet log
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const newFoods = selectedFoods.map((food) => {
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
        const earnedXp = response?.reward_point || 0;

        setSelectedFoods([]);
        setDateAdd(new Date());
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
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

        // setTimeout(() => {
        //   router.push({
        //     pathname: "/client/myListedFoodLogs",
        //   });
        // }, 1000);

        return response;
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
      {/* templateId */}
      <HardwareBackHandler
        routePath={
          templateId
            ? "/client/(diet)/personalTemplate"
            : "/client/myListedFoodLogs"
        }
        enabled={true}
        params={{
          method: "personal",
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: templateId
                ? "/client/(diet)/personalTemplate"
                : "/client/myListedFoodLogs",
              params: {
                method: "personal",
              },
            })
          }
        >
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <View
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 30,
          }}
        >
          {date && <Text>Log Your Food</Text>}
          {templateTitle && mealTitle && (
            <Text numberOfLines={1} style={styles.headerText}>
              Add Food To {mealTitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.search_bar}>
        <TouchableOpacity onPress={focusInput}>
          <Ionicons name="search-outline" size={20} color="#888" />
        </TouchableOpacity>

        <TextInput
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Type here..."
          style={styles.searchInput}
          ref={inputRef}
        />

        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {selectedDate && (
        <View
          style={{
            marginTop: 10,
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
            onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading foods...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodCard
              id={item.id}
              image={item.image}
              title={item.name}
              calories={item.calories}
              carbs={item.carbs}
              fat={item.fat}
              protein={item.protein}
              quantity={item?.quantity}
              isSelected={selectedFoods.some((f) => f.id === item.id)}
              onAdd={() => toggleFoodSelection(item)}
              updateFoodQuantity={updateFoodQuantity}
            />
          )}
          contentContainerStyle={styles.foodListContainer}
        />
      )}

      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""}{" "}
          selected
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton
          title={
            templateTitle || templateId ? "Add to Meal" : "Add Food to Logs"
          }
          fromColor="#28A745"
          toColor="#007BFF"
          containerStyle={{ marginTop: 0 }}
          textStyle={{ fontSize: 12 }}
          onPress={saveFoods}
          disabled={loading || selectedFoods.length === 0}
        />
      </View>

      {xpRewardVisible ? (
        <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
      ) : (
        ""
      )}

      <MissedMealsModal
        onClose={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
        visible={missedMealsModalVisible}
        date={selectedDate}
        onChangeDate={(date) => setSelectedDate(date)}
        onSubmit={handleDateSelect}
      />
    </View>
  );
};

export default FoodSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 40,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 5,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  foodListContainer: {
    paddingBottom: 10,
    paddingTop: 0,
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
