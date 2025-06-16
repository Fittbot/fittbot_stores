// screens/FoodSearchScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { updateDietTemplateMeals } from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import { format } from "date-fns";
import GradientButton2 from "../../../components/ui/GradientButton2";
import { useLocalSearchParams } from "expo-router";
import MealsCategoryCard from "../../../components/ui/Diet/MealsCategoryCard";

import {
  getDefaultSingleDietTemplate,
  getSingleDietTemplateAPI,
} from "../../../services/clientApi";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const mockData = [
  {
    id: "1",
    title: "Early Morning Detox",
    timeRange: "6:00 am - 7:00 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "2",
    title: "Pre-Breakfast / Pre-Meal Starter",
    timeRange: "7:30 am - 8:00 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "3",
    title: "Breakfast",
    timeRange: "8:00 am - 9:30 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "4",
    title: "Mid-Morning Snack",
    timeRange: "10:30 am - 11:30 am",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "5",
    title: "Lunch",
    timeRange: "12:30 pm - 2:00 pm",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "6",
    title: "Evening Snack",
    timeRange: "4:00 pm - 6:00 pm",
    foodList: [],
    itemsCount: 0,
  },
  {
    id: "7",
    title: "Dinner",
    timeRange: "7:00 pm - 8:30 pm",
    foodList: [],
    itemsCount: 0,
  },
];

const AddTemplateCategoryPage = () => {
  const router = useRouter();
  const inputRef = useRef(null);
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [templateData, setTemplateData] = useState(mockData);

  const {
    date,
    mealId,
    mealTitle,
    mealTimeRange,
    templateTitle,
    templateId,
    selectedFoods: selectedFoodsParam,
    defaultTemplateId,
    defaultTemplateTitle,
    SingleTemplateData,
    trainerTemplateId,
    trainerTemplateTitle,
    method,
  } = useLocalSearchParams();

  useEffect(() => {
    if (SingleTemplateData) {
      let data = JSON.parse(SingleTemplateData);

      if (data) {
        setTemplateData(data?.diet_data);
      }
    }
  }, [SingleTemplateData]);

  // Parse foods from URL params only once when the component mounts or when the param changes
  // const parsedFoods = React.useMemo(() => {
  //   if (selectedFoodsParam) {
  //     try {
  //       return JSON.parse(selectedFoodsParam);
  //     } catch (e) {
  //       console.error('Error parsing selectedFoods param:', e);
  //       return [];
  //     }
  //   }
  //   return [];
  // }, [selectedFoodsParam]);

  // Fetch template data only when templateId changes and is defined
  useEffect(() => {
    const fetchParticularTemplateData = async (id) => {
      setLoading(true);
      try {
        const response = await getSingleDietTemplateAPI(id);
        if (response?.status === 200) {
          if (
            response?.data?.diet_data &&
            Array.isArray(response.data.diet_data)
          ) {
            setTemplateData(response.data.diet_data);
          } else {
          }
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

    if (templateId) {
      fetchParticularTemplateData(templateId);
    } else {
      // If no templateId, just set loading to false and use mock data
      setLoading(false);
    }
  }, [templateId]);

  // useEffect(() => {

  //   const fetchParticularTemplateData = async (id) => {
  //     setLoading(true);
  //     try {
  //       const response = await getDefaultSingleDietTemplate(id);
  //       if (response?.status === 200) {
  //         if (
  //           response?.data?.template_json &&
  //           Array.isArray(response.data.template_json)
  //         ) {
  //           setTemplateData(response.data.template_json);
  //         } else {
  //         }
  //       }
  //     } catch (error) {
  //       showToast({
  //         type: "error",
  //         title: "Error",
  //         desc: "Something went wrong. Please try again later",
  //       });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (defaultTemplateId) {

  //     fetchParticularTemplateData(defaultTemplateId);
  //   } else {
  //     // If no templateId, just set loading to false and use mock data
  //     setLoading(false);
  //   }
  // }, [defaultTemplateId]);

  const updateDietTemplate = async ({ mealId, categoryID }) => {
    let filterData = templateData?.map((cat) => {
      if (cat.id === categoryID) {
        return {
          ...cat,
          foodList: cat?.foodList?.filter((meal) => meal.id !== mealId),
        };
      } else {
        return cat;
      }
    });

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

      const newTemplate = {
        id: templateId,
        diet_data: filterData,
      };

      const response = await updateDietTemplateMeals(newTemplate);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response.message || "Template saved successfully",
        });
        setTemplateData(filterData);
        // router.push('client/personalTemplate');
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

  return (
    <View style={styles.container}>
      <HardwareBackHandler
        routePath={
          templateTitle || method
            ? "/client/personalTemplate"
            : "/client/sampleTemplate"
        }
        params={{
          method: method,
        }}
        enabled={true}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (templateTitle || method) {
              router.push({
                pathname: "/client/personalTemplate",
                params: {
                  method: method,
                },
              });
            } else {
              router.push("/client/sampleTemplate");
            }
          }}
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
          <Text style={{ fontWeight: "bold" }}>{templateTitle}</Text>
        </View>
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
            navigateTo="/client/todayFoodLogPage"
            containerStyle={{ marginTop: 0 }}
            textStyle={{ fontSize: 12 }}
            onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading template data...</Text>
        </View>
      ) : (
        <FlatList
          data={templateData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MealsCategoryCard
              title={item.title}
              timeRange={item.timeRange}
              itemsCount={item.foodList?.length || 0}
              foodList={item.foodList}
              onPress={() =>
                router.push({
                  pathname: "/client/addFoodListPage",
                  params: {
                    templateTitle: templateTitle,
                    mealTitle: item.title,
                    mealTimeRange: item.timeRange,
                    mealId: item.id,
                    templateId: templateId,
                    templateData: JSON.stringify(templateData),
                    method: method,
                  },
                })
              }
              templateTitle={templateTitle}
              templateId={templateId}
              updateDietTemplate={(mealId) =>
                updateDietTemplate({ mealId, categoryID: item.id })
              }
              defaultTemplateId={defaultTemplateId}
            />
          )}
          contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
        />
      )}

      {/* <View style={{ marginBottom: 0 }}>
        <GradientButton
          title="Save Daily Diet"
          fromColor="#28A745"
          toColor="#007BFF"
          containerStyle={{ marginTop: 0 }}
          textStyle={{ fontSize: 12 }}
          onPress={saveFoods}
          disabled={loading}
        />
      </View> */}
    </View>
  );
};

export default AddTemplateCategoryPage;

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
});
