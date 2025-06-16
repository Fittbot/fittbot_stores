import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteClientDietTemplateAPI,
  editClientDietTemplateNameAPI,
  getDietTemplateClientAPI,
} from "../../../services/clientApi";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import CreateTemplateModal from "../../../components/ui/Diet/createTemplateModal";
import { FlatList } from "react-native-gesture-handler";
import TemplateFoodCard from "../../../components/ui/Diet/TemplateFoodCard";
import GradientButton from "../../../components/ui/GradientButton";
import EditTemplateNameModal from "../../../components/ui/Diet/EditTemplateNameModal";
import { showToast } from "../../../utils/Toaster";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const personalTemplate = (props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateTemplateModal, setOpenCreateTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [templateId, setTemplateId] = useState(null);

  const { method } = useLocalSearchParams();

  const getTemplates = async () => {
    setIsLoading(true);

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

      const response =
        method === "personal"
          ? await getDietTemplateClientAPI(clientId, "personal")
          : await getDietTemplateClientAPI(clientId, "gym");

      if (response?.status === 200) {
        const processedTemplates = response?.data.map((template) => {
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          template?.diet_data?.forEach((meal) => {
            meal.foodList.forEach((food) => {
              totalCalories += food.calories * food.quantity || 0;
              totalProtein += food.protein * food.quantity || 0;
              totalCarbs += food.carbs * food.quantity || 0;
              totalFat += food.fat * food.quantity || 0;
            });
          });

          return {
            ...template,
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
          };
        });

        setTemplates(processedTemplates);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail ||
            response?.message ||
            "Something went wrong. Please try again later",
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

  useEffect(() => {
    getTemplates();
  }, []);

  const handleDeleteTemplate = (templateId) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this diet template?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteClientDietTemplateAPI(templateId);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Success",
                  desc: "Template deleted Successfully",
                });
                // setCurrentTemplate(null);
                await getTemplates();
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
          },
        },
      ]
    );
  };

  const handleEditName = async () => {
    if (!newTemplateName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter a template name",
      });
      return;
    }

    // Check if template name already exists (excluding the current template being edited)
    if (isDuplicateTemplateName(newTemplateName, templateId)) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Template name already exists",
      });
      return;
    }

    if (newTemplateName.trim()) {
      const payload = {
        id: templateId,
        template_name: newTemplateName,
      };

      try {
        const response = await editClientDietTemplateNameAPI(payload);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: response?.message,
          });
          await getTemplates();
          setEditNameModalVisible(false);
          setNewTemplateName("");
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
    }
  };

  const isDuplicateTemplateName = (name, currentTemplateId = null) => {
    // When editing, exclude the current template from the check
    return templates.some(
      (template) =>
        template.name === name &&
        (currentTemplateId === null || template.id !== currentTemplateId)
    );
  };

  if (isLoading) {
    return <FitnessLoader page="diet" />;
  }

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler
          routePath={method === "personal" ? "/client/diet" : "/client/home"}
          enabled={true}
        />

        <TouchableOpacity
          style={[styles.backButtonContainer, { padding: width * 0.04 }]}
          onPress={() => {
            method === "personal"
              ? router.push("/client/diet")
              : router.push("/client/home");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {method === "personal"
              ? "Personal Template"
              : "Trainer Assigned Diet Plan"}
          </Text>
        </TouchableOpacity>

        {templates?.length === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() =>
              setOpenCreateTemplateModal(!openCreateTemplateModal)
            }
            buttonText={method === "personal" ? "Start Fresh" : ""}
            message={
              "Looks like you have not created any template yet!\nTap below to Create your own Template and add food in a single tap!"
            }
            belowButtonText={""}
            onButtonPress2={() => {}}
          />
        )}

        {templates.length > 0 && (
          <View style={styles.foodList}>
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                // <TouchableOpacity
                //   onPress={() => {
                //     if (method !== 'personal') {
                //       router.push({
                //         pathname: '/client/trainerAssignedTemplateLogDietPage',
                //         params: { method: 'gym' },
                //       });
                //     }
                //   }}
                // >
                <TemplateFoodCard
                  templateData={item}
                  id={item.id}
                  image={item.image}
                  title={item.name}
                  calories={item.calories}
                  carbs={item.carbs}
                  fat={item.fat}
                  protein={item.protein}
                  quantity={item.diet_data.length}
                  onEdit={() => {
                    setTemplateId(item.id);
                    setEditNameModalVisible(!isEditNameModalVisible);
                    setNewTemplateName(item.name);
                  }}
                  onDelete={() => {
                    handleDeleteTemplate(item.id);
                  }}
                  method={method}
                  defaultTemplate={method === "personal" ? false : true}

                  //   onAdd={() => toggleFoodSelection(item)}
                  //   updateFoodQuantity={updateFoodQuantity}
                />
                // </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
            />
          </View>
        )}

        {method !== "gym" && (
          <View style={{ marginBottom: 0 }}>
            <GradientButton
              title="Add Templates"
              fromColor="#28A745"
              toColor="#007BFF"
              // navigateTo="/client/todayFoodLogPage"
              containerStyle={{ marginTop: 0 }}
              textStyle={{ fontSize: 12 }}
              onPress={() =>
                setOpenCreateTemplateModal(!openCreateTemplateModal)
              }
            />
          </View>
        )}

        <CreateTemplateModal
          onClose={() => setOpenCreateTemplateModal(!openCreateTemplateModal)}
          value={templateName}
          visible={openCreateTemplateModal}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={async () => {
            // setTemplateName(templateName);
            if (templateName) {
              if (!isDuplicateTemplateName(templateName)) {
                router.push({
                  pathname: "/client/addTemplateCategoryPage",
                  params: { templateTitle: templateName, method: method },
                });
              } else {
                showToast({
                  type: "error",
                  title: "Error",
                  desc: "Template name already exists",
                });
              }
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
        />

        <EditTemplateNameModal
          visible={isEditNameModalVisible}
          newTemplateName={newTemplateName}
          setNewTemplateName={setNewTemplateName}
          onClose={() => setEditNameModalVisible(false)}
          onSave={handleEditName}
        />
      </View>
    </>
  );
};

export default personalTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
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
  foodList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
});
