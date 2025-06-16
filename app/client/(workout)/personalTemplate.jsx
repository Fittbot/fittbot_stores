import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import {
  addClientWrokoutTemplateAPI,
  deleteClientWorkoutTemplateAPI,
  editClientWorkoutTemplateNameAPI,
  getWorkoutTemplateClientAPI,
  getFittbotWorkoutAPI,
} from "../../../services/clientApi";
import { Ionicons } from "@expo/vector-icons";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import TemplateModal from "../../../components/ui/Workout/templateModal";
import TemplateList from "../../../components/ui/Workout/templateList";
import { showToast } from "../../../utils/Toaster";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const personalTemplate = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTemplateModal, setEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [exerciseData, setExerciseData] = useState({});
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState(null);
  const [gender, setGender] = useState(null);
  const router = useRouter();

  const fetchFittbotWorkouts = async () => {
    setIsLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
    try {
      const response = await getFittbotWorkoutAPI(clientId);

      if (response?.status === 200) {
        setExerciseData(response.data.exercise_data);
        setMuscleGroups(Object.keys(response.data.exercise_data));
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
      setIsLoading(false);
    }
  };

  const getGender = async () => {
    setGender(await AsyncStorage.getItem("gender"));
  };

  useEffect(() => {
    getGender();
  }, []);

  const createTemplate = async (templateName) => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter template name",
      });
      return;
    }
    const clientId = await AsyncStorage.getItem("client_id");
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
    const newTemplate = {
      template_name: templateName,
      exercise_data: {},
      client_id: clientId,
    };
    try {
      const response = await addClientWrokoutTemplateAPI(newTemplate);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message,
        });
        getTemplates();
        setModalVisible(false);
        router.push({
          pathname: "/client/AddExerciseToTemplate",
          params: {
            template: JSON.stringify(response?.data),
            workouts: JSON.stringify(exerciseData),
          },
        });
      } else {
        alert(
          response?.detail || "Something went wrong. Please try again later"
        );
        // showToast({
        //   type: "error",
        //   title: "Error",
        //   desc:
        //     response?.detail || "Something went wrong. Please try again later",
        // });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const editTemplate = async (templateName) => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter template name",
      });
      return;
    }
    const payload = {
      id: editingTemplate.id,
      template_name: templateName,
    };

    try {
      const response = await editClientWorkoutTemplateNameAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message,
        });
        getTemplates();
        setEditTemplateModal(false);
        setEditingTemplate(null);
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

  const deleteTemplate = (templateId) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this workout template?",
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
              const response = await deleteClientWorkoutTemplateAPI(templateId);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Success",
                  desc: "Template Deleted Successfully",
                });
                setCurrentTemplate(null);
                getTemplates();
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
      }
      const response = await getWorkoutTemplateClientAPI(clientId);

      if (response?.status === 200) {
        setTemplates(response?.data);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTemplates();
    fetchFittbotWorkouts();
  }, []);

  const handleTemplateSelect = (currentTemplate) => {
    if (currentTemplate && currentTemplate.exercise_data) {
      router.push({
        pathname: "/client/exercise",
        params: {
          templateId: currentTemplate.id,
          templateName: currentTemplate.name,
          templateExercises: JSON.stringify(
            Object.keys(currentTemplate.exercise_data)
          ),
          myTemplateExercise: JSON.stringify(currentTemplate.exercise_data),
          isTemplate: true,
          gender: gender,
        },
      });
    }
  };

  const handleAddWorkout = (newtemplate) => {
    if (Object.keys(newtemplate.exercise_data).length !== 0) {
      router.push({
        pathname: "/client/addExerciseTemplate",
        params: {
          template: JSON.stringify(newtemplate),
          workouts: JSON.stringify(exerciseData),
        },
      });
    } else {
      router.push({
        pathname: "/client/AddExerciseToTemplate",
        params: {
          template: JSON.stringify(newtemplate),
          workouts: JSON.stringify(exerciseData),
        },
      });
    }
  };

  if (isLoading) {
    return (
      <FitnessLoader
        page={gender?.toLocaleLowerCase() == "male" ? "workout2" : "workout1"}
      />
    );
  }

  if (templates.length === 0) {
    return (
      <SafeAreaView style={styles.sectionContainer}>
        <HardwareBackHandler routePath={"/client/workout"} enabled={true} />

        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            router.push("/client/(tabs)/workout");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Personal Workout</Text>
        </TouchableOpacity>
        <EmptyStateCard
          imageSource={require("../../../assets/images/workout/WORKOUT_CAT_V001.png")}
          onButtonPress={() => setModalVisible(true)}
          message={
            "You haven’t created any workout template yet! \nTap below to create your routine and own the day."
          }
          buttonText="Start Fresh"
        />

        <TemplateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={createTemplate}
          mode="create"
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <View style={styles.sectionContainer}>
        <HardwareBackHandler routePath={"/client/workout"} enabled={true} />

        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            router.push("/client/(tabs)/workout");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Personal Workout</Text>
        </TouchableOpacity>
        <Animated.ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: width * 0.04 }}>
            {templates.map((template) => (
              <TemplateList
                key={template.id}
                template={template}
                setCurrentTemplate={setCurrentTemplate}
                openEditModal={() => {
                  setEditTemplateModal(true);
                  setEditingTemplate(template);
                }}
                deleteTemplate={deleteTemplate}
                handleAddWorkout={() => handleAddWorkout(template)}
                handleTemplateSelect={() => handleTemplateSelect(template)}
              />
            ))}
          </View>
        </Animated.ScrollView>
        <TemplateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={createTemplate}
          mode="create"
        />

        <TemplateModal
          visible={editTemplateModal}
          onClose={() => setEditTemplateModal(false)}
          onSubmit={(newName) => {
            setEditTemplateModal(false);
            editTemplate(newName);
          }}
          initialValue={editingTemplate?.name}
          mode="edit"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={["#297DB3", "#183243"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveButton, { width: "60%" }]}
            >
              <Text style={styles.saveButtonText}>+ Add Template</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default personalTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  templateTitle: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: "#183243",
  },
  muscleGroupText: {
    marginTop: 8,
    color: "#888",
    fontSize: 13,
  },
  dropdown: {
    backgroundColor: "#f9f9f9",
    position: "absolute",
    top: 40,
    right: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 6,
    zIndex: 99,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: scale(15),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 8,
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    marginBottom: scale(15),
    textAlign: "center",
    color: "#FF5757",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    marginBottom: scale(10),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(10),
    fontSize: scale(14),
  },
  modalButton: {
    backgroundColor: "#FF5757",
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: scale(10),
  },
  modalButtonText: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "600",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
