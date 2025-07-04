import { Ionicons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
  Alert,
  ImageBackground,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import FitnessLoader from "../../components/ui/FitnessLoader";
import { addClientWorkoutAPI, getInStatusAPI } from "../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import XpRewardAnimation from "../../components/ui/RewardAnimation";
import ExerciseCard from "../../components/ui/Workout/ExerciseCard";
import { showToast } from "../../utils/Toaster";
import GrainConfettiAnimation from "../../components/ui/ConfettiAnimation";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import UnsavedChangesBackHandler from "../../components/WorkoutHardwareBackHandler";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const ExerciseScreen = () => {
  const {
    muscleGroup,
    templateId,
    exercises,
    myExercises,
    isQR,
    qrExercises,
    templateExercises,
    myTemplateExercise,
    isTemplate,
    isMuscleGroup,
    isCardio,
    isDefaultWorkouts,
    level,
    isTrainerTemplate,
  } = useLocalSearchParams();
  const parsedExercises = exercises ? JSON.parse(exercises) : [];
  const myTemplateExercises = myExercises ? JSON.parse(myExercises) : [];
  const parsedQRExercises = qrExercises ? JSON.parse(qrExercises) : [];
  const parsedTemplates = myTemplateExercise
    ? JSON.parse(myTemplateExercise)
    : [];
  const parsedtemplateMuscleGroups = templateExercises
    ? JSON.parse(templateExercises)
    : [];
  const [isInGym, setIsInGym] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeExercises, setActiveExercises] = useState({});
  const [currentExercise, setCurrentExercise] = useState(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [historicalInputVisible, setHistoricalInputVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSets, setCurrentSets] = useState([
    { reps: "", weight: "", duration: "" },
  ]);
  const [currentReps, setCurrentReps] = useState("");
  const [isBackConfirmModalVisible, setIsBackConfirmModalVisible] =
    useState(false);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentDuration, setCurrentDuration] = useState("");
  const [userWeight, setUserWeight] = useState(70);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [gifPath, setGifPath] = useState(null);
  const [xpAmount, setXpAmount] = useState(0);
  const startPosition = { x: width / 2, y: height * 0.7 };
  const endPosition = { x: width * 0.8, y: 40 };
  const [change, setChange] = useState(false);
  const tabScrollViewRef = useRef(null);
  const [MET, setMET] = useState(() => {
    if (parsedExercises && parsedExercises[muscleGroup]) {
      return parsedExercises[muscleGroup].isMuscleGroup ? 6 : 10;
    }
    return isMuscleGroup == "true" ? 6 : 10;
  });
  const [durationUnits, setDurationUnits] = useState({});
  const hasScrolledInitially = useRef(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[today.getDay()];
  });
  const [isDefaultWorkout, setIsDefaultWorkout] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserWeight = async () => {
      try {
        const weight = await AsyncStorage.getItem("user_weight");

        if (weight) {
          setUserWeight(parseFloat(weight));
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error Fetching User weight",
        });
      }
    };

    fetchUserWeight();
  }, []);

  useEffect(() => {
    const checkIfDefaultWorkout = () => {
      if (isDefaultWorkouts === "true") {
        setIsDefaultWorkout(true);
      }
    };

    checkIfDefaultWorkout();
  }, []);

  const calculateCalories = (met, duration, weight) => {
    return Math.round(met * weight * (duration / 3600) * 100) / 100;
  };

  const saveWorkout = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gym_id = await AsyncStorage.getItem("gym_id");

      let workoutData = {
        client_id: Number(clientId),
        date: selectedDate?.toISOString().split("T")[0],
        workout_details: [],
        live_status: isInGym,
        gym_id: Number(gym_id),
      };

      if (isQR === "true" && myTemplateExercises) {
        const groupedExercises = {};

        Object.entries(activeExercises).forEach(
          ([exerciseName, exerciseData]) => {
            for (const [group, groupData] of Object.entries(
              myTemplateExercises
            )) {
              if (groupData.exercises) {
                const foundExercise = groupData.exercises.find(
                  (ex) => ex.name === exerciseName
                );
                if (foundExercise) {
                  if (!groupedExercises[group]) {
                    groupedExercises[group] = [];
                  }
                  groupedExercises[group].push({
                    name: exerciseName,
                    sets: exerciseData.sets || [],
                  });
                  break;
                }
              }
            }
          }
        );

        workoutData.workout_details = [groupedExercises];
      } else if (isTemplate === "true" && parsedTemplates) {
        const groupedExercises = {};

        Object.entries(activeExercises).forEach(
          ([exerciseName, exerciseData]) => {
            for (const [group, groupData] of Object.entries(parsedTemplates)) {
              if (groupData.exercises) {
                const foundExercise = groupData.exercises.find(
                  (ex) => ex.name === exerciseName
                );
                if (foundExercise) {
                  if (!groupedExercises[group]) {
                    groupedExercises[group] = [];
                  }
                  groupedExercises[group].push({
                    name: exerciseName,
                    sets: exerciseData.sets || [],
                  });
                  break;
                }
              }
            }
          }
        );

        workoutData.workout_details = [groupedExercises];
      } else if (isDefaultWorkouts === "true" && parsedExercises) {
        const groupedExercises = {};

        Object.entries(activeExercises).forEach(
          ([exerciseName, exerciseData]) => {
            for (const [group, groupData] of Object.entries(parsedExercises)) {
              if (groupData.exercises) {
                const foundExercise = groupData.exercises.find(
                  (ex) => ex.name === exerciseName
                );
                if (foundExercise) {
                  if (!groupedExercises[group]) {
                    groupedExercises[group] = [];
                  }
                  groupedExercises[group].push({
                    name: exerciseName,
                    sets: exerciseData.sets || [],
                  });
                  break;
                }
              }
            }
          }
        );

        workoutData.workout_details = [groupedExercises];
      } else if (muscleGroup) {
        workoutData.workout_details = [
          {
            [muscleGroup]: Object.entries(activeExercises).map(
              ([exerciseName, exerciseData]) => ({
                name: exerciseName,
                sets: exerciseData.sets || [],
              })
            ),
          },
        ];
      } else if (myTemplateExercises) {
        let groupedExercises = {};

        Object.entries(activeExercises).forEach(
          ([exerciseName, exerciseData]) => {
            Object.entries(myTemplateExercises).forEach(
              ([group, exercises]) => {
                if (
                  Array.isArray(exercises) &&
                  exercises.includes(exerciseName)
                ) {
                  if (!groupedExercises[group]) {
                    groupedExercises[group] = [];
                  }
                  groupedExercises[group].push({
                    name: exerciseName,
                    sets: exerciseData.sets || [],
                  });
                } else if (
                  exercises.exercises &&
                  exercises.exercises.includes(exerciseName)
                ) {
                  if (!groupedExercises[group]) {
                    groupedExercises[group] = [];
                  }
                  groupedExercises[group].push({
                    name: exerciseName,
                    sets: exerciseData.sets || [],
                  });
                }
              }
            );
          }
        );

        workoutData.workout_details = [groupedExercises];
      }

      const response = await addClientWorkoutAPI(workoutData);

      if (response?.status === 200) {
        setActiveExercises({});

        const earnedXp = response?.reward_point || 0;
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
        }
        if (!earnedXp) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Reward is not available for Out of the Gym workout logs and for logs above 50Xp",
          });
          router.push({
            pathname: "/client/workout",
            params: { task: "exercise added" },
          });
          setIsBackConfirmModalVisible(false);
          setIsSaveModalVisible(false);
          setXpRewardVisible(false);
        } else {
          setTimeout(() => {
            router.push({
              pathname: "/client/workout",
              params: { task: "exercise added" },
            });
            setIsBackConfirmModalVisible(false);
            setIsSaveModalVisible(false);
            setXpRewardVisible(false);
          }, 3000);
        }
      } else {
        showToast({
          type: "error",
          title: "Save Failed",
          desc: "Unable to save workout. Please try again.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Save Failed",
        desc: "An error occurred while saving the workout.",
      });
    }
  };

  const handleAnimationComplete = () => {
    setXpRewardVisible(false);
  };

  useEffect(() => {
    checkGymPresence();
  }, []);

  const checkGymPresence = async () => {
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await getInStatusAPI(clientId);
      setIsInGym(
        response?.status === 200 ? response?.attendance_status : false
      );
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error checking Gym Presence",
      });
      setIsInGym(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = (exercise) => {
    setActiveExercises((prev) => ({
      ...prev,
      [exercise]: {
        ...prev[exercise],
        startTime: new Date(),
        isActive: true,
        sets: [...(prev[exercise]?.sets || [])],
      },
    }));
    showToast({
      type: "success",
      title: "Success",
      desc: "🎯 Workout Started! Let's crush it! 💪",
    });
  };

  const handleStopExercise = (exercise) => {
    const endTime = new Date();
    const exerciseState = activeExercises[exercise];
    const duration = Math.round((endTime - exerciseState.startTime) / 1000);
    setCurrentDuration(duration.toString());
    setCurrentExercise(exercise);

    let isCurrentExerciseCardio = false;
    let isCurrentExerciseBodyWeight = false;

    if (isQR === "true" && myTemplateExercises) {
      for (const [group, groupData] of Object.entries(myTemplateExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === exercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isTemplate === "true" && parsedTemplates) {
      for (const [group, groupData] of Object.entries(parsedTemplates)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === exercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isDefaultWorkouts === "true" && parsedExercises) {
      for (const [group, groupData] of Object.entries(parsedExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === exercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (parsedExercises && muscleGroup && parsedExercises[muscleGroup]) {
      isCurrentExerciseCardio =
        parsedExercises[muscleGroup].isCardio || isCardio === "true";
      isCurrentExerciseBodyWeight = parsedExercises[muscleGroup].isBodyWeight;
    }

    if (isCurrentExerciseCardio) {
      setMET(8);

      const caloriesBurned = calculateCalories(8, duration, userWeight);

      const newSet = {
        setNumber: (exerciseState?.sets?.length || 0) + 1,
        startTime: exerciseState.startTime,
        endTime: endTime,
        reps: 0,
        weight: 0,
        duration: duration,
        MET: 8,
        calories: caloriesBurned,
      };

      setActiveExercises((prev) => ({
        ...prev,
        [exercise]: {
          ...prev[exercise],
          isActive: false,
          sets: [...(prev[exercise]?.sets || []), newSet],
        },
      }));
      showToast({
        type: "success",
        title: "Success",
        desc: `🎯 Set completed! Burned ${caloriesBurned} calories! 💪`,
      });
    } else {
      setInputModalVisible(true);
    }
  };

  const validateInputs = (inputs) => {
    const errors = {};

    let isCurrentExerciseMuscleGroup = false;
    let isCurrentExerciseBodyWeight = false;

    if (isQR === "true" && myTemplateExercises) {
      for (const [group, groupData] of Object.entries(myTemplateExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseMuscleGroup = groupData.isMuscleGroup || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isTemplate === "true" && parsedTemplates) {
      for (const [group, groupData] of Object.entries(parsedTemplates)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseMuscleGroup = groupData.isMuscleGroup || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isDefaultWorkouts === "true" && parsedExercises) {
      for (const [group, groupData] of Object.entries(parsedExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseMuscleGroup = groupData.isMuscleGroup || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (parsedExercises && muscleGroup && parsedExercises[muscleGroup]) {
      isCurrentExerciseMuscleGroup =
        parsedExercises[muscleGroup].isMuscleGroup || isMuscleGroup === "true";
      isCurrentExerciseBodyWeight =
        parsedExercises[muscleGroup].isBodyWeight || false;
    }

    if (isCurrentExerciseMuscleGroup) {
      if (!inputs.reps || isNaN(inputs.reps) || inputs.reps <= 0) {
        errors.reps = "Please enter a valid number of reps";
      }
      if (!isCurrentExerciseBodyWeight) {
        if (!inputs.weight || isNaN(inputs.weight) || inputs.weight <= 0) {
          errors.weight = "Please enter a valid weight";
        }
      }
    }

    if (
      inputs.duration !== undefined &&
      (!inputs.duration || isNaN(inputs.duration) || inputs.duration <= 0)
    ) {
      errors.duration = "Please enter a valid duration";
    }

    return errors;
  };

  const handleSetComplete = () => {
    let isCurrentExerciseCardio = false;
    let isCurrentExerciseBodyWeight = false;

    if (isQR === "true" && myTemplateExercises) {
      for (const [group, groupData] of Object.entries(myTemplateExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isTemplate === "true" && parsedTemplates) {
      for (const [group, groupData] of Object.entries(parsedTemplates)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isDefaultWorkouts === "true" && parsedExercises) {
      for (const [group, groupData] of Object.entries(parsedExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (parsedExercises && muscleGroup && parsedExercises[muscleGroup]) {
      isCurrentExerciseCardio =
        parsedExercises[muscleGroup].isCardio || isCardio === "true";
      isCurrentExerciseBodyWeight =
        parsedExercises[muscleGroup].isBodyWeight || false;
    }

    const errors = isCurrentExerciseCardio
      ? {}
      : isCurrentExerciseBodyWeight
      ? validateInputs({ reps: currentReps })
      : validateInputs({ reps: currentReps, weight: currentWeight });
    if (Object.keys(errors).length > 0) {
      alert(
        Object.values(errors).join("\n") ||
          "Something went wrong. Please try again later"
      );

      return;
    }

    const endTime = new Date();
    const exerciseState = activeExercises[currentExercise];

    const selectedMET = MET || (isCurrentExerciseCardio ? 8 : 6);
    const duration = parseInt(currentDuration);
    const caloriesBurned = calculateCalories(selectedMET, duration, userWeight);

    const newSet = {
      setNumber: (exerciseState?.sets?.length || 0) + 1,
      startTime: exerciseState.startTime,
      endTime: endTime,
      reps: parseInt(currentReps) || 0,
      weight: parseFloat(currentWeight) || 0,
      duration: duration,
      MET: selectedMET,
      calories: caloriesBurned,
    };

    setActiveExercises((prev) => ({
      ...prev,
      [currentExercise]: {
        ...prev[currentExercise],
        isActive: false,
        sets: [...(prev[currentExercise]?.sets || []), newSet],
      },
    }));

    setInputModalVisible(false);
    resetInputs();
    showToast({
      type: "success",
      title: "Success",
      desc: `🎯 Set completed! Burned ${caloriesBurned} calories! 💪`,
    });
  };

  const deleteHistoricalSet = (setIndex) => {
    setCurrentSets((prev) => prev.filter((_, index) => index !== setIndex));
    const newUnits = {};
    Object.keys(durationUnits).forEach((key) => {
      const keyIndex = parseInt(key);
      if (keyIndex < setIndex) {
        newUnits[key] = durationUnits[key];
      } else if (keyIndex > setIndex) {
        newUnits[keyIndex - 1] = durationUnits[key];
      }
    });
    setDurationUnits(newUnits);
  };

  const handleHistoricalExercise = (exercise) => {
    setCurrentExercise(exercise);
    setSelectedDate(new Date());
    setCurrentSets([{ reps: "", weight: "", duration: "" }]);
    setDurationUnits({}); // Reset duration units
    setShowDatePicker(false);
    setHistoricalInputVisible(true);
  };

  const addHistoricalSet = () => {
    setCurrentSets((prev) => [...prev, { reps: "", weight: "", duration: "" }]);
    setTimeout(() => {
      if (scrollViewRef) {
        scrollViewRef.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const updateHistoricalSet = (index, field, value) => {
    const updatedSets = [...currentSets];
    updatedSets[index] = { ...updatedSets[index], [field]: value };
    setCurrentSets(updatedSets);
  };

  const handleHistoricalSave = () => {
    let isCurrentExerciseCardio = false;
    let isCurrentExerciseBodyWeight = false;

    if (isQR === "true" && myTemplateExercises) {
      for (const [group, groupData] of Object.entries(myTemplateExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isTemplate === "true" && parsedTemplates) {
      for (const [group, groupData] of Object.entries(parsedTemplates)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (isDefaultWorkouts === "true" && parsedExercises) {
      for (const [group, groupData] of Object.entries(parsedExercises)) {
        if (groupData.exercises) {
          const foundExercise = groupData.exercises.find(
            (ex) => ex.name === currentExercise
          );
          if (foundExercise) {
            isCurrentExerciseCardio = groupData.isCardio || false;
            isCurrentExerciseBodyWeight = groupData.isBodyWeight || false;
            break;
          }
        }
      }
    } else if (parsedExercises && muscleGroup && parsedExercises[muscleGroup]) {
      isCurrentExerciseCardio =
        parsedExercises[muscleGroup].isCardio || isCardio === "true";
      isCurrentExerciseBodyWeight =
        parsedExercises[muscleGroup].isBodyWeight || false;
    }

    let hasErrors = false;
    const errors = currentSets.map((set) => {
      if (isCurrentExerciseCardio) {
        return validateInputs({
          duration: set.duration,
        });
      } else if (isCurrentExerciseBodyWeight) {
        return validateInputs({
          reps: set.reps,
          duration: set.duration,
        });
      }
      return validateInputs({
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
      });
    });

    errors.forEach((error, index) => {
      if (Object.keys(error).length > 0) {
        hasErrors = true;
        alert(
          `Set ${index + 1} has the following errors:\n${Object.values(
            error
          ).join("\n")}`
        );
      }
    });

    if (hasErrors) return;

    const formattedSets = currentSets.map((set, index) => {
      // Convert duration to seconds if unit is minutes
      let durationInSeconds = parseInt(set.duration) || 0;
      const unit = durationUnits[index] || "seconds";
      if (unit === "minutes") {
        durationInSeconds = durationInSeconds * 60;
      }

      const selectedMET = parseInt(MET);
      const caloriesBurned = calculateCalories(
        selectedMET,
        durationInSeconds,
        userWeight
      );

      return {
        setNumber: index + 1,
        startTime: selectedDate,
        endTime: new Date(selectedDate.getTime() + durationInSeconds * 1000),
        reps: parseInt(set.reps) || 0,
        weight: parseFloat(set.weight) || 0,
        duration: durationInSeconds, // Always store in seconds
        MET: selectedMET,
        calories: caloriesBurned,
      };
    });

    setActiveExercises((prev) => ({
      ...prev,
      [currentExercise]: {
        sets: [...(prev[currentExercise]?.sets || []), ...formattedSets],
      },
    }));

    setHistoricalInputVisible(false);
    resetInputs();
  };

  const resetInputs = () => {
    setCurrentReps("");
    setCurrentWeight("");
    setCurrentDuration("");
    setCurrentSets([{ reps: "", weight: "", duration: "" }]);
    setDurationUnits({}); // Reset duration units
  };

  const deleteSet = (exerciseName, setIndex) => {
    setActiveExercises((prev) => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        sets: prev[exerciseName].sets.filter((_, index) => index !== setIndex),
      },
    }));
  };

  const prepareExercises = () => {
    if (isQR === "true" && myTemplateExercises) {
      const allExercises = [];

      Object.entries(myTemplateExercises).forEach(([group, groupData]) => {
        if (groupData.exercises) {
          const filteredExercises = isDefaultWorkout
            ? groupData.exercises.filter(
                (exercise) => exercise.day === selectedDay
              )
            : groupData.exercises;
          filteredExercises.forEach((exercise) => {
            allExercises.push({
              name: exercise.name,
              muscleGroup: group,
              gifPath: exercise.gifPath || null,
              imgPath: exercise.imgPath || null, // Add imgPath here
              isCardio: groupData.isCardio || false,
              isMuscleGroup: groupData.isMuscleGroup || false,
              isBodyWeight: groupData.isBodyWeight || false,
            });
          });
        }
      });

      return allExercises;
    }

    if (isTemplate === "true" && parsedTemplates) {
      const allExercises = [];
      Object.entries(parsedTemplates).forEach(([group, groupData]) => {
        if (groupData.exercises) {
          const filteredExercises = isDefaultWorkout
            ? groupData.exercises.filter(
                (exercise) => exercise.day === selectedDay
              )
            : groupData.exercises;
          filteredExercises.forEach((exercise) => {
            allExercises.push({
              name: exercise.name,
              muscleGroup: group,
              gifPath: exercise.gifPath || null,
              imgPath: exercise.imgPath || null, // Add imgPath here
              isCardio: groupData.isCardio || false,
              isMuscleGroup: groupData.isMuscleGroup || false,
              isBodyWeight: groupData.isBodyWeight || false,
            });
          });
        }
      });

      return allExercises;
    }

    if (isDefaultWorkouts === "true" && parsedExercises) {
      const allExercises = [];

      Object.entries(parsedExercises).forEach(([group, groupData]) => {
        if (groupData.exercises) {
          const filteredExercises = isDefaultWorkout
            ? groupData.exercises.filter(
                (exercise) => exercise.day === selectedDay
              )
            : groupData.exercises;
          filteredExercises.forEach((exercise) => {
            allExercises.push({
              name: exercise.name,
              muscleGroup: group,
              gifPath: exercise.gifPath || null,
              imgPath: exercise.imgPath || null, // Add imgPath here
              isCardio: groupData.isCardio || false,
              isMuscleGroup: groupData.isMuscleGroup || false,
              isBodyWeight: groupData.isBodyWeight || false,
            });
          });
        }
      });

      return allExercises;
    }

    if (
      parsedExercises &&
      muscleGroup &&
      parsedExercises[muscleGroup] &&
      parsedExercises[muscleGroup].exercises
    ) {
      const filteredExercises = isDefaultWorkout
        ? parsedExercises[muscleGroup].exercises.filter(
            (exercise) => exercise.day === selectedDay
          )
        : parsedExercises[muscleGroup].exercises;
      return filteredExercises.map((exercise) => ({
        name: exercise.name,
        muscleGroup: muscleGroup,
        gifPath: exercise.gifPath || null,
        imgPath: exercise.imgPath || null, // Add imgPath here
        isCardio: parsedExercises[muscleGroup].isCardio || false,
        isMuscleGroup: parsedExercises[muscleGroup].isMuscleGroup || false,
        isBodyWeight: parsedExercises[muscleGroup].isBodyWeight || false,
      }));
    }

    return parsedExercises;
  };

  const renderDayTabs = () => {
    if (!isDefaultWorkout) return null;

    const { width } = Dimensions.get("window");

    const days = [
      { name: "Monday", value: "monday" },
      { name: "Tuesday", value: "tuesday" },
      { name: "Wednesday", value: "wednesday" },
      { name: "Thursday", value: "thursday" },
      { name: "Friday", value: "friday" },
      { name: "Saturday", value: "saturday" },
      { name: "Sunday", value: "sunday" },
    ];

    const scrollToTab = (tabName) => {
      const index = days.findIndex((day) => day.value === tabName);
      if (index !== -1 && tabScrollViewRef.current) {
        const approximateTabWidth = 100;
        const scrollToX = Math.max(
          0,
          index * approximateTabWidth - width / 2 + approximateTabWidth / 2
        );
        tabScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    };

    const handleTabPress = (tabValue) => {
      setSelectedDay(tabValue);
      scrollToTab(tabValue);
    };

    return (
      <ScrollView
        ref={tabScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsContainer}
        contentContainerStyle={styles.dayTabsContent}
        onLayout={() => {
          if (
            !hasScrolledInitially.current &&
            isDefaultWorkout &&
            tabScrollViewRef.current
          ) {
            const days = [
              { name: "Monday", value: "monday" },
              { name: "Tuesday", value: "tuesday" },
              { name: "Wednesday", value: "wednesday" },
              { name: "Thursday", value: "thursday" },
              { name: "Friday", value: "friday" },
              { name: "Saturday", value: "saturday" },
              { name: "Sunday", value: "sunday" },
            ];

            const index = days.findIndex((day) => day.value === selectedDay);
            if (index !== -1) {
              const { width } = Dimensions.get("window");
              const approximateTabWidth = 100;
              const scrollToX = Math.max(
                0,
                index * approximateTabWidth -
                  width / 2 +
                  approximateTabWidth / 2
              );

              tabScrollViewRef.current.scrollTo({
                x: scrollToX,
                animated: true,
              });
              hasScrolledInitially.current = true;
            }
          }
        }}
      >
        {days.map((day) => (
          <TouchableOpacity
            key={day.value}
            style={[
              styles.dayTab,
              selectedDay === day.value && styles.selectedDayTab,
            ]}
            onPress={() => handleTabPress(day.value)}
          >
            <Text
              style={[
                styles.dayTabText,
                selectedDay === day.value && styles.selectedDayTabText,
              ]}
            >
              {day.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const getHeaderTitle = () => {
    if (isTrainerTemplate === "true") {
      return "Trainer Workout";
    } else if (templateId) {
      return isQR === "true" ? "QR Workout" : "Template Workout";
    } else if (isDefaultWorkouts == "true") {
      return `${level.toUpperCase()}`;
    } else {
      return `${muscleGroup} Exercises`;
    }
  };

  const getBackNavigation = () => {
    if (isTrainerTemplate === "true") {
      return "/client/gymTemplate";
    } else if (isDefaultWorkouts == "true") {
      return "/client/workout";
    } else if (isTemplate == "true") {
      return "/client/(workout)/personalTemplate";
    } else {
      return "/client/fittbotWorkoutPage";
    }
  };

  const hasUnsavedSets = () => {
    return Object.values(activeExercises).some(
      (exercise) => exercise.sets && exercise.sets.length > 0
    );
  };

  const handleBackNavigation = () => {
    if (hasUnsavedSets()) {
      setIsBackConfirmModalVisible(true);
    } else {
      router.push(getBackNavigation());
    }
  };

  const handleConfirmBackNavigation = () => {
    setActiveExercises({});
    setIsBackConfirmModalVisible(false);
    router.push(getBackNavigation());
  };

  useEffect(() => {
    if (isDefaultWorkout && tabScrollViewRef.current) {
      const days = [
        { name: "Monday", value: "monday" },
        { name: "Tuesday", value: "tuesday" },
        { name: "Wednesday", value: "wednesday" },
        { name: "Thursday", value: "thursday" },
        { name: "Friday", value: "friday" },
        { name: "Saturday", value: "saturday" },
        { name: "Sunday", value: "sunday" },
      ];

      const index = days.findIndex((day) => day.value === selectedDay);
      if (index !== -1) {
        const { width } = Dimensions.get("window");
        const approximateTabWidth = 100;
        const scrollToX = Math.max(
          0,
          index * approximateTabWidth - width / 2 + approximateTabWidth / 2
        );

        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            tabScrollViewRef.current?.scrollTo({
              x: scrollToX,
              animated: true,
            });
          }, 200); // Increased delay
        });
      }
    }
  }, [selectedDay, isDefaultWorkout, tabScrollViewRef]);

  if (loading) {
    return <FitnessLoader page="workout2" />;
  }

  const exercisesToDisplay = prepareExercises();

  return (
    <View style={styles.container}>
      <UnsavedChangesBackHandler
        hasUnsavedChanges={hasUnsavedSets()}
        enabled={true}
        onShowConfirmModal={() => setIsBackConfirmModalVisible(true)}
        routePath={getBackNavigation()}
      />

      {toast.visible && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBackNavigation} // Changed from direct router.push
        >
          <Ionicons
            name="arrow-back"
            size={responsiveFontSize(20)}
            color="#000"
          />
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </TouchableOpacity>
        <View style={styles.gymStatus}>
          <View
            style={[styles.statusDot, isInGym ? styles.inGym : styles.outGym]}
          />
          <Text style={styles.statusText}>
            {isInGym ? "In Gym" : "Out of Gym"}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 15 }}>{renderDayTabs()}</View>

      {/* <View style={styles.headerInfoContainer}>
                <LinearGradient
                    colors={['#FF5757', '#8C52FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.promoHeader}
                >
                    <View style={styles.promoTextContainer}>
                        <Text style={styles.promoTitle}>Track Your Workout</Text>
                        <Text style={styles.promoSubtitle}>Push your limits & earn rewards</Text>
                    </View>
                    <View style={styles.promoIconContainer}>
                        <FontAwesome5 name="dumbbell" size={responsiveFontSize(24)} color="#FFF" />
                    </View>
                </LinearGradient>
            </View> */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          backgroundColor: "#f8f8f8",
          borderRadius: 8,
        }}
      >
        {isInGym ? (
          <Text style={{ fontSize: 12, textAlign: "center" }}>
            Press ▶ to start your workout now .
          </Text>
        ) : (
          <Text style={{ fontSize: 12, textAlign: "center" }}>
            Press ▶ to start your workout now or Press + to enter your past
            workout data
          </Text>
        )}
      </View>

      {exercisesToDisplay && exercisesToDisplay.length > 0 ? (
        <>
          <FlatList
            data={exercisesToDisplay}
            renderItem={({ item, index }) => (
              <ExerciseCard
                exercise={item}
                index={index}
                isInGym={isInGym}
                activeExercises={activeExercises}
                onStartExercise={handleStartExercise}
                onStopExercise={handleStopExercise}
                onHistoricalExercise={handleHistoricalExercise}
                onViewGif={(exerciseName, gifPath) => {
                  setCurrentExercise(exerciseName);
                  setGifPath(gifPath);
                  setInfoModalVisible(true);
                }}
                onDeleteSet={deleteSet}
              />
            )}
            keyExtractor={(item, index) => {
              const name = typeof item === "string" ? item : item.name;
              return `exercise-item-${name || index}-${index}`;
            }}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity
            style={styles.saveWorkoutButton}
            onPress={() => {
              const hasSets = Object.values(activeExercises).some(
                (exercise) => exercise.sets && exercise.sets.length > 0
              );

              if (hasSets) {
                setIsSaveModalVisible(true);
              } else {
                showToast({
                  type: "error",
                  title: "No Workout Data",
                  desc: "Please log at least one set before saving.",
                });
              }
            }}
          >
            <Text style={styles.saveWorkoutButtonText}>SAVE WORKOUT</Text>
            <Ionicons
              name="save-outline"
              size={20}
              color="#fff"
              style={styles.saveButtonIcon}
            />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome5
            name="dumbbell"
            size={responsiveFontSize(50)}
            color="#CCCCCC"
          />
          <Text style={styles.emptyTitle}>
            {isDefaultWorkouts == "true"
              ? "Rest day"
              : "No Exercises Available"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isDefaultWorkouts == "true"
              ? "Come back tomorrow for new exercises"
              : " Check back soon for new exercises"}
          </Text>
        </View>
      )}

      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View style={exerciseVisualModalStyles.exrMdlBackdropOverlay}>
          <View style={exerciseVisualModalStyles.exrMdlMainContainerWrapper}>
            <View style={exerciseVisualModalStyles.exrMdlHeaderRegion}>
              <Text style={exerciseVisualModalStyles.exrMdlTitleElement}>
                {currentExercise}
              </Text>
              <TouchableOpacity
                style={exerciseVisualModalStyles.exrMdlDismissButtonArea}
                onPress={() => setInfoModalVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={responsiveFontSize(20)}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            <View style={exerciseVisualModalStyles.exrMdlContentSection}>
              {gifPath ? (
                <View
                  style={exerciseVisualModalStyles.exrMdlAnimationEnclosure}
                >
                  <Image
                    source={gifPath}
                    style={exerciseVisualModalStyles.exrMdlDynamicVisualization}
                    contentFit="cover"
                    isAnimated={true}
                  />
                </View>
              ) : (
                <View
                  style={exerciseVisualModalStyles.exrMdlPlaceholderEnclosure}
                >
                  <FontAwesome5
                    name="dumbbell"
                    size={responsiveFontSize(20)}
                    color="#A0A0A0"
                  />
                  <Text
                    style={
                      exerciseVisualModalStyles.exrMdlPlaceholderNotification
                    }
                  >
                    Animation Coming Soon!
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={exerciseVisualModalStyles.exrMdlAcknowledgementButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Text
                  style={
                    exerciseVisualModalStyles.exrMdlAcknowledgementButtonLabel
                  }
                >
                  Got It
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Input Modal - for entering set details */}
      <Modal visible={inputModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContentSave}>
                <Text style={styles.modalTitle2}>Enter Set Details</Text>
                <Text style={styles.exerciseSubtitle}>{currentExercise}</Text>

                {(() => {
                  let isMuscleGroupExercise = false;
                  let isBodyWeightExercise = false;

                  if (
                    isQR === "true" &&
                    myTemplateExercises &&
                    currentExercise
                  ) {
                    for (const [group, groupData] of Object.entries(
                      myTemplateExercises
                    )) {
                      if (groupData.exercises) {
                        const foundExercise = groupData.exercises.find(
                          (ex) => ex.name === currentExercise
                        );
                        if (foundExercise) {
                          isMuscleGroupExercise =
                            groupData.isMuscleGroup || false;
                          isBodyWeightExercise =
                            groupData.isBodyWeight || false;
                          break;
                        }
                      }
                    }
                  }
                  if (
                    isTemplate === "true" &&
                    parsedTemplates &&
                    currentExercise
                  ) {
                    for (const [group, groupData] of Object.entries(
                      parsedTemplates
                    )) {
                      if (groupData.exercises) {
                        const foundExercise = groupData.exercises.find(
                          (ex) => ex.name === currentExercise
                        );
                        if (foundExercise) {
                          isMuscleGroupExercise =
                            groupData.isMuscleGroup || false;
                          isBodyWeightExercise =
                            groupData.isBodyWeight || false;
                          break;
                        }
                      }
                    }
                  }
                  if (
                    isDefaultWorkouts === "true" &&
                    parsedExercises &&
                    currentExercise
                  ) {
                    for (const [group, groupData] of Object.entries(
                      parsedExercises
                    )) {
                      if (groupData.exercises) {
                        const foundExercise = groupData.exercises.find(
                          (ex) => ex.name === currentExercise
                        );
                        if (foundExercise) {
                          isMuscleGroupExercise =
                            groupData.isMuscleGroup || false;
                          isBodyWeightExercise =
                            groupData.isBodyWeight || false;
                          break;
                        }
                      }
                    }
                  } else if (
                    parsedExercises &&
                    muscleGroup &&
                    parsedExercises[muscleGroup]
                  ) {
                    isMuscleGroupExercise =
                      parsedExercises[muscleGroup].isMuscleGroup ||
                      isMuscleGroup === "true";
                    isBodyWeightExercise =
                      parsedExercises[muscleGroup].isBodyWeight || false;
                  }

                  return isMuscleGroupExercise ? (
                    <View style={styles.inputFieldsContainer}>
                      <View style={styles.inputField}>
                        <Ionicons
                          name="repeat"
                          size={20}
                          color="#297DB3"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Number of Reps"
                          keyboardType="phone-pad"
                          value={currentReps}
                          onChangeText={setCurrentReps}
                          placeholderTextColor="#999"
                        />
                      </View>

                      {!isBodyWeightExercise && (
                        <View style={styles.inputField}>
                          <FontAwesome5
                            name="weight"
                            size={18}
                            color="#297DB3"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Weight (kg)"
                            keyboardType="phone-pad"
                            value={currentWeight}
                            onChangeText={setCurrentWeight}
                            placeholderTextColor="#999"
                          />
                        </View>
                      )}
                    </View>
                  ) : null;
                })()}

                <View>
                  <Text style={styles.intensityLabel}>Workout Intensity</Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: "Select Intensity", value: null }}
                      onValueChange={(value) => setMET(value)}
                      value={MET}
                      pickerProps={{
                        itemStyle: {
                          color: "#000000",
                        },
                      }}
                      style={pickerSelectStyles}
                      items={
                        (() => {
                          let isMuscleGroupExercise = false;
                          let isBodyWeightExercise = false;

                          if (
                            isQR === "true" &&
                            myTemplateExercises &&
                            currentExercise
                          ) {
                            for (const [group, groupData] of Object.entries(
                              myTemplateExercises
                            )) {
                              if (groupData.exercises) {
                                const foundExercise = groupData.exercises.find(
                                  (ex) => ex.name === currentExercise
                                );
                                if (foundExercise) {
                                  isMuscleGroupExercise =
                                    groupData.isMuscleGroup || false;
                                  isBodyWeightExercise =
                                    groupData.isBodyWeight || false;
                                  break;
                                }
                              }
                            }
                          }
                          if (
                            isTemplate === "true" &&
                            parsedTemplates &&
                            currentExercise
                          ) {
                            for (const [group, groupData] of Object.entries(
                              parsedTemplates
                            )) {
                              if (groupData.exercises) {
                                const foundExercise = groupData.exercises.find(
                                  (ex) => ex.name === currentExercise
                                );
                                if (foundExercise) {
                                  isMuscleGroupExercise =
                                    groupData.isMuscleGroup || false;
                                  isBodyWeightExercise =
                                    groupData.isBodyWeight || false;
                                  break;
                                }
                              }
                            }
                          }

                          if (
                            isDefaultWorkouts === "true" &&
                            parsedExercises &&
                            currentExercise
                          ) {
                            for (const [group, groupData] of Object.entries(
                              parsedExercises
                            )) {
                              if (groupData.exercises) {
                                const foundExercise = groupData.exercises.find(
                                  (ex) => ex.name === currentExercise
                                );
                                if (foundExercise) {
                                  isMuscleGroupExercise =
                                    groupData.isMuscleGroup || false;
                                  isBodyWeightExercise =
                                    groupData.isBodyWeight || false;
                                  break;
                                }
                              }
                            }
                          } else if (
                            parsedExercises &&
                            muscleGroup &&
                            parsedExercises[muscleGroup]
                          ) {
                            isMuscleGroupExercise =
                              parsedExercises[muscleGroup].isMuscleGroup ||
                              isMuscleGroup === "true";
                            isBodyWeightExercise =
                              parsedExercises[muscleGroup].isBodyWeight ||
                              false;
                          }

                          return isMuscleGroupExercise;
                        })()
                          ? [
                              { label: "Low Intensity", value: 4 },
                              { label: "Moderate Intensity", value: 6 },
                              { label: "High Intensity", value: 8 },
                            ]
                          : [
                              { label: "Low Intensity", value: 8 },
                              { label: "Moderate Intensity", value: 10 },
                              { label: "High Intensity", value: 12 },
                            ]
                      }
                      Icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#666666"
                        />
                      )}
                      useNativeAndroidPickerStyle={false}
                      fixAndroidTouchableBug={true}
                    />
                  </View>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setInputModalVisible(false);
                      resetInputs();
                    }}
                  >
                    <Text style={styles.modalButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSetComplete}
                  >
                    <Text style={styles.modalButtonText}>SAVE SET</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Historical Input Modal */}
      <Modal visible={historicalInputVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
                setShowDatePicker(false);
              }}
            >
              <View style={styles.modalContentSave}>
                <Text style={styles.modalTitle}>Log Historical Workout</Text>
                <Text style={styles.exerciseSubtitle}>{currentExercise}</Text>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#297DB3"
                    style={styles.dateIcon}
                  />
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    themeVariant="light"
                    textColor="#000000"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                    maximumDate={new Date()}
                  />
                )}

                <ScrollView
                  ref={(ref) => setScrollViewRef(ref)}
                  style={styles.setsContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  {currentSets.map((set, index) => {
                    let showMuscleGroupInputs = false;
                    let isBodyWeightExercise = false;

                    if (
                      isQR === "true" &&
                      myTemplateExercises &&
                      currentExercise
                    ) {
                      for (const [group, groupData] of Object.entries(
                        myTemplateExercises
                      )) {
                        if (groupData.exercises) {
                          const foundExercise = groupData.exercises.find(
                            (ex) => ex.name === currentExercise
                          );
                          if (foundExercise) {
                            showMuscleGroupInputs =
                              groupData.isMuscleGroup || false;
                            isBodyWeightExercise =
                              groupData.isBodyWeight || false;
                            break;
                          }
                        }
                      }
                    } else if (
                      isTemplate === "true" &&
                      parsedTemplates &&
                      currentExercise
                    ) {
                      for (const [group, groupData] of Object.entries(
                        parsedTemplates
                      )) {
                        if (groupData.exercises) {
                          const foundExercise = groupData.exercises.find(
                            (ex) => ex.name === currentExercise
                          );
                          if (foundExercise) {
                            showMuscleGroupInputs =
                              groupData.isMuscleGroup || false;
                            isBodyWeightExercise =
                              groupData.isBodyWeight || false;
                            break;
                          }
                        }
                      }
                    } else if (
                      isDefaultWorkouts === "true" &&
                      parsedExercises &&
                      currentExercise
                    ) {
                      for (const [group, groupData] of Object.entries(
                        parsedExercises
                      )) {
                        if (groupData.exercises) {
                          const foundExercise = groupData.exercises.find(
                            (ex) => ex.name === currentExercise
                          );
                          if (foundExercise) {
                            showMuscleGroupInputs =
                              groupData.isMuscleGroup || false;
                            isBodyWeightExercise =
                              groupData.isBodyWeight || false;
                            break;
                          }
                        }
                      }
                    } else if (
                      parsedExercises &&
                      muscleGroup &&
                      parsedExercises[muscleGroup]
                    ) {
                      showMuscleGroupInputs =
                        parsedExercises[muscleGroup].isMuscleGroup ||
                        isMuscleGroup === "true";
                      isBodyWeightExercise =
                        parsedExercises[muscleGroup].isBodyWeight || false;
                    }

                    return (
                      <View
                        key={`set-input-${index}`}
                        style={styles.setInputContainer}
                      >
                        <View style={styles.setHeaderRow}>
                          <Text style={styles.setLabel}>Set {index + 1}</Text>
                          {index > 0 && (
                            <TouchableOpacity
                              onPress={() => deleteHistoricalSet(index)}
                              style={styles.deleteSetIcon}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={24}
                                color="#FF5757"
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        {showMuscleGroupInputs && (
                          <>
                            <View style={styles.inputField}>
                              <Ionicons
                                name="repeat"
                                size={20}
                                color="#297DB3"
                                style={styles.inputIcon}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="Number of Reps"
                                keyboardType="phone-pad"
                                value={set.reps}
                                onChangeText={(value) =>
                                  updateHistoricalSet(index, "reps", value)
                                }
                                placeholderTextColor="#999"
                              />
                            </View>

                            {!isBodyWeightExercise && (
                              <View style={styles.inputField}>
                                <FontAwesome5
                                  name="weight"
                                  size={18}
                                  color="#297DB3"
                                  style={styles.inputIcon}
                                />
                                <TextInput
                                  style={styles.input}
                                  placeholder="Weight (kg)"
                                  keyboardType="phone-pad"
                                  value={set.weight}
                                  onChangeText={(value) =>
                                    updateHistoricalSet(index, "weight", value)
                                  }
                                  placeholderTextColor="#999"
                                />
                              </View>
                            )}
                          </>
                        )}

                        <View style={styles.durationContainer}>
                          <View style={styles.durationHeader}>
                            <Text style={styles.durationLabel}>Duration</Text>
                          </View>

                          <View style={styles.radioButtonContainer}>
                            <TouchableOpacity
                              style={styles.radioButton}
                              onPress={() => {
                                const newUnits = { ...durationUnits };
                                newUnits[index] = "seconds";
                                setDurationUnits(newUnits);
                              }}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  (durationUnits[index] || "seconds") ===
                                    "seconds" && styles.radioCircleSelected,
                                ]}
                              >
                                {(durationUnits[index] || "seconds") ===
                                  "seconds" && (
                                  <View style={styles.radioInnerCircle} />
                                )}
                              </View>
                              <Text style={styles.radioLabel}>Seconds</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.radioButton}
                              onPress={() => {
                                const newUnits = { ...durationUnits };
                                newUnits[index] = "minutes";
                                setDurationUnits(newUnits);
                              }}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  durationUnits[index] === "minutes" &&
                                    styles.radioCircleSelected,
                                ]}
                              >
                                {durationUnits[index] === "minutes" && (
                                  <View style={styles.radioInnerCircle} />
                                )}
                              </View>
                              <Text style={styles.radioLabel}>Minutes</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.inputField}>
                            <Ionicons
                              name="stopwatch-outline"
                              size={20}
                              color="#297DB3"
                              style={styles.inputIcon}
                            />

                            <TextInput
                              style={styles.input}
                              placeholder={`Enter ${
                                durationUnits[index] || "seconds"
                              }`}
                              keyboardType="phone-pad"
                              value={set.duration}
                              onChangeText={(value) =>
                                updateHistoricalSet(index, "duration", value)
                              }
                              placeholderTextColor="#999"
                            />
                          </View>
                        </View>
                        <View>
                          <Text style={styles.intensityLabel}>
                            Workout Intensity
                          </Text>
                          <View style={styles.pickerContainer}>
                            <RNPickerSelect
                              placeholder={{
                                label: "Select Intensity",
                                value: null,
                              }}
                              onValueChange={(value) => setMET(value)}
                              value={MET}
                              pickerProps={{
                                itemStyle: {
                                  color: "#000000",
                                },
                              }}
                              style={pickerSelectStyles}
                              items={
                                (() => {
                                  let isMuscleGroupExercise = false;
                                  let isBodyWeightExercise = false;

                                  if (
                                    isQR === "true" &&
                                    myTemplateExercises &&
                                    currentExercise
                                  ) {
                                    for (const [
                                      group,
                                      groupData,
                                    ] of Object.entries(myTemplateExercises)) {
                                      if (groupData.exercises) {
                                        const foundExercise =
                                          groupData.exercises.find(
                                            (ex) => ex.name === currentExercise
                                          );
                                        if (foundExercise) {
                                          isMuscleGroupExercise =
                                            groupData.isMuscleGroup || false;
                                          isBodyWeightExercise =
                                            groupData.isBodyWeight || false;
                                          break;
                                        }
                                      }
                                    }
                                  }
                                  if (
                                    isTemplate === "true" &&
                                    parsedTemplates &&
                                    currentExercise
                                  ) {
                                    for (const [
                                      group,
                                      groupData,
                                    ] of Object.entries(parsedTemplates)) {
                                      if (groupData.exercises) {
                                        const foundExercise =
                                          groupData.exercises.find(
                                            (ex) => ex.name === currentExercise
                                          );
                                        if (foundExercise) {
                                          isMuscleGroupExercise =
                                            groupData.isMuscleGroup || false;
                                          isBodyWeightExercise =
                                            groupData.isBodyWeight || false;
                                          break;
                                        }
                                      }
                                    }
                                  }

                                  if (
                                    isDefaultWorkouts === "true" &&
                                    parsedExercises &&
                                    currentExercise
                                  ) {
                                    for (const [
                                      group,
                                      groupData,
                                    ] of Object.entries(parsedExercises)) {
                                      if (groupData.exercises) {
                                        const foundExercise =
                                          groupData.exercises.find(
                                            (ex) => ex.name === currentExercise
                                          );
                                        if (foundExercise) {
                                          isMuscleGroupExercise =
                                            groupData.isMuscleGroup || false;
                                          isBodyWeightExercise =
                                            groupData.isBodyWeight || false;
                                          break;
                                        }
                                      }
                                    }
                                  } else if (
                                    parsedExercises &&
                                    muscleGroup &&
                                    parsedExercises[muscleGroup]
                                  ) {
                                    isMuscleGroupExercise =
                                      parsedExercises[muscleGroup]
                                        .isMuscleGroup ||
                                      isMuscleGroup === "true";
                                    isBodyWeightExercise =
                                      parsedExercises[muscleGroup]
                                        .isBodyWeight || false;
                                  }

                                  return isMuscleGroupExercise;
                                })()
                                  ? [
                                      { label: "Low Intensity", value: 4 },
                                      { label: "Moderate Intensity", value: 6 },
                                      { label: "High Intensity", value: 8 },
                                    ]
                                  : [
                                      { label: "Low Intensity", value: 8 },
                                      {
                                        label: "Moderate Intensity",
                                        value: 10,
                                      },
                                      {
                                        label: "High Intensity",
                                        value: 12,
                                      },
                                    ]
                              }
                              Icon={() => (
                                <Ionicons
                                  name="chevron-down"
                                  size={20}
                                  color="#666666"
                                />
                              )}
                              useNativeAndroidPickerStyle={false}
                              fixAndroidTouchableBug={true}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={addHistoricalSet}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#FFF"
                    style={styles.addButtonIcon}
                  />
                  <Text style={styles.addSetButtonText}>ADD SET</Text>
                </TouchableOpacity>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setHistoricalInputVisible(false);
                      resetInputs();
                    }}
                  >
                    <Text style={styles.modalButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleHistoricalSave}
                  >
                    <Text style={styles.modalButtonText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Save Workout Modal */}
      <Modal visible={isSaveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlaySave}>
          <View style={styles.modalContentSave}>
            <View style={styles.saveModalHeader}>
              <FontAwesome5
                name="check-circle"
                size={responsiveFontSize(40)}
                color="#FF5757"
              />
              <Text style={styles.saveModalTitle}>Save Workout</Text>
            </View>

            <Text style={styles.saveModalText}>
              Ready to save your workout? Your progress will be recorded{" "}
              {isInGym ? "and you'll earn XP rewards!" : "for your analysis"}
            </Text>

            {xpRewardVisible ? (
              <GrainConfettiAnimation
                numberOfPieces={150}
                xpPoints={xpAmount}
              />
            ) : (
              ""
            )}
            {/* <XpRewardAnimation
              xpAmount={xpAmount}
              visible={xpRewardVisible}
              onAnimationComplete={handleAnimationComplete}
              startPosition={startPosition}
              endPosition={endPosition}
              color="#4CAF50"
            /> */}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsSaveModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveWorkout}
              >
                <Text style={styles.modalButtonText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isBackConfirmModalVisible}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback
          onPress={() => setIsBackConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlaySave}>
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <View style={styles.modalContentSave}>
                {/* Header with X button */}
                <View style={styles.modalHeaderDiscard}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsBackConfirmModalVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={responsiveFontSize(20)}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.saveModalHeader}>
                  <Ionicons
                    name="warning-outline"
                    size={responsiveFontSize(40)}
                    color="#FF9500"
                  />
                  <Text style={styles.saveModalTitle}>Unsaved Changes</Text>
                </View>

                <Text style={styles.saveModalText}>
                  You have unsaved workout data. Do you want to save your
                  progress before leaving?
                </Text>

                {/* Action buttons */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleConfirmBackNavigation}
                  >
                    <Text style={styles.modalButtonText}>DISCARD</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={saveWorkout}
                  >
                    <Text style={styles.modalButtonText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    marginBottom: Platform.OS === "ios" ? 60 : 0,
  },
  header: {
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveWidth(1),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(5),
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#000000",
    marginLeft: responsiveWidth(2),
  },
  gymStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: responsiveWidth(5),
  },
  statusDot: {
    width: responsiveWidth(2.5),
    height: responsiveWidth(2.5),
    borderRadius: responsiveWidth(1.25),
    marginRight: responsiveWidth(2),
  },
  inGym: {
    backgroundColor: "#4CAF50",
  },
  outGym: {
    backgroundColor: "#FF5757",
  },
  statusText: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  headerInfoContainer: {
    marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  promoSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
  },
  promoIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: responsiveWidth(4),
    paddingBottom: responsiveHeight(10),
  },
  exerciseCard: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: "auto",
    minHeight: responsiveHeight(20),
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  gradientBackground: {
    width: "100%",
    height: "100%",
    padding: responsiveWidth(4),
    borderRadius: responsiveWidth(3),
  },
  exerciseTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  exerciseTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  exerciseContent: {
    flex: 1,
    marginTop: responsiveHeight(3),
  },
  exerciseIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  exerciseHeaderContainer: {
    marginBottom: responsiveHeight(1.5),
  },
  exerciseName: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
  },
  exerciseSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
  },
  watchDemoButton: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  watchDemoText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    marginRight: responsiveWidth(1),
  },
  setInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: responsiveWidth(3),
    borderRadius: responsiveWidth(2),
    marginVertical: responsiveHeight(0.6),
  },
  setContent: {
    flex: 1,
  },
  setText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
  },
  setNumber: {
    fontWeight: "bold",
  },
  deleteSetButton: {
    padding: responsiveWidth(1),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: responsiveWidth(5),
  },
  actionButtonsContainer: {
    marginTop: responsiveHeight(2),
    flexDirection: "row",
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(5),
    borderRadius: responsiveWidth(5),
    minWidth: responsiveWidth(40),
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  historicalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(5),
    borderRadius: responsiveWidth(5),
    backgroundColor: "#1E293B",
    minWidth: responsiveWidth(40),
  },
  buttonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: responsiveWidth(2),
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "#999",
  },
  saveWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#297DB3",
    // backgroundColor: 'rgba(76, 175, 80, 0.8)',
    padding: responsiveWidth(3),
    marginHorizontal: responsiveWidth(4),
    marginVertical: responsiveHeight(1.5),
    borderRadius: responsiveWidth(3),
    shadowColor: "#374151",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveWorkoutButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
  saveButtonIcon: {
    marginLeft: responsiveWidth(2),
  },
  toastContainer: {
    position: "absolute",
    top: responsiveHeight(12),
    left: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    margin: responsiveWidth(4),
    padding: responsiveWidth(4),
    borderRadius: responsiveWidth(3),
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlaySave: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentSave: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(75),
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(4),
    backgroundColor: "#FF5757",
  },
  modalHeaderDiscard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // backgroundColor: "#FF5757",
  },
  modalTitle: {
    color: "#000",
    fontSize: responsiveFontSize(16),
    fontWeight: 400,
    textAlign: "center",
  },
  modalTitle2: {
    color: "#000",
    fontSize: responsiveFontSize(16),
    fontWeight: 400,
    textAlign: "center",
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentContainer: {
    flex: 1,
    padding: responsiveWidth(4),
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseGif: {
    width: "100%",
    height: responsiveHeight(40),
    marginVertical: responsiveHeight(2),
  },
  noGifContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(6),
  },
  noGifText: {
    fontSize: responsiveFontSize(16),
    color: "#666",
    marginTop: responsiveHeight(2),
  },
  closeModalButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(1.5),
    borderRadius: responsiveWidth(3),
    marginTop: responsiveHeight(2),
  },
  closeModalButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  inputModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    padding: responsiveWidth(5),
    maxHeight: responsiveHeight(70),
  },
  inputFieldsContainer: {
    marginVertical: responsiveHeight(0.5),
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: responsiveWidth(2),
    marginBottom: responsiveHeight(1.5),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    paddingHorizontal: responsiveWidth(3),
  },
  inputIcon2: {
    paddingRight: responsiveWidth(3),
  },
  input: {
    flex: 1,
    paddingVertical: responsiveHeight(1.5),
    fontSize: responsiveFontSize(16),
    color: "#333",
  },
  intensityLabel: {
    fontSize: responsiveFontSize(15),
    color: "#333",
    marginBottom: responsiveHeight(1),
    fontWeight: "400",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(2),
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },

  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: responsiveHeight(1.5),
    alignItems: "center",
    borderRadius: responsiveWidth(3),
    marginHorizontal: responsiveWidth(2),
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  confirmButton: {
    backgroundColor: "#297DB3",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  historicalModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    padding: responsiveWidth(5),
    maxHeight: responsiveHeight(80),
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: responsiveWidth(3),
    borderRadius: responsiveWidth(2),
    marginVertical: responsiveHeight(2),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateIcon: {
    marginRight: responsiveWidth(2),
  },
  dateButtonText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
  },
  setsContainer: {
    maxHeight: responsiveHeight(40),
  },
  setInputContainer: {
    marginBottom: responsiveHeight(2),
    padding: responsiveWidth(3),
    backgroundColor: "#F8F8F8",
    borderRadius: responsiveWidth(2),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  setHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  setLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
  },
  deleteSetIcon: {
    padding: responsiveWidth(1),
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4299E1",
    paddingVertical: responsiveHeight(1.5),
    borderRadius: responsiveWidth(3),
    marginVertical: responsiveHeight(2),
  },
  addButtonIcon: {
    marginRight: responsiveWidth(2),
  },
  addSetButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  saveModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    padding: responsiveWidth(5),
  },
  saveModalHeader: {
    alignItems: "center",
    marginVertical: responsiveHeight(2),
  },
  saveModalTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(1),
  },
  saveModalText: {
    fontSize: responsiveFontSize(16),
    color: "#555",
    textAlign: "center",
    marginVertical: responsiveHeight(2),
    lineHeight: responsiveFontSize(22),
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(6),
    marginTop: responsiveHeight(10),
  },
  emptyTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(2),
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#999",
    marginTop: responsiveHeight(1),
    textAlign: "center",
  },
  exerciseCard: {
    marginBottom: responsiveHeight(2),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#ffffff",
  },
  exerciseImage: {
    width: "100%",
    flex: 1,
  },
  exerciseImageStyle: {
    borderRadius: responsiveWidth(3),
    opacity: 0.8,
  },
  gradientBackground: {
    width: "100%",
    padding: responsiveWidth(4),
    paddingBottom: responsiveWidth(2),
    borderRadius: responsiveWidth(3),
    opacity: 0.9,
  },
  exerciseContent: {
    padding: responsiveWidth(1),
  },

  setInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: responsiveWidth(2.5),
    borderRadius: responsiveWidth(2),
    marginVertical: responsiveHeight(0.4),
  },
  setContent: {
    flex: 1,
  },
  setText: {
    color: "#FFF",
    fontSize: responsiveFontSize(13),
  },

  actionButtonsContainer: {
    marginTop: responsiveHeight(1.5),
    marginBottom: responsiveHeight(0.5),
    flexDirection: "row",
    justifyContent: "center",
  },

  exerciseHeaderContainer: {
    marginBottom: responsiveHeight(1),
  },
  exerciseName: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
  },
  exerciseSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
  },
  dayTabsContainer: {
    marginBottom: 10,
  },
  dayTabsContent: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  dayTab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#f0f0f0",
  },
  selectedDayTab: {
    backgroundColor: "#297DB3",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
  selectedDayTabText: {
    color: "#FFF",
  },
  durationContainer: {
    marginTop: 10,
  },

  durationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  durationLabel: {
    fontSize: 16,
    color: "#333",
    // marginLeft: 8,
    fontWeight: "500",
  },

  radioButtonContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  radioCircleSelected: {
    borderColor: "#297DB3",
  },

  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#297DB3",
  },

  radioLabel: {
    fontSize: 14,
    color: "#333",
  },

  durationInput: {
    height: 45,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F5F5F5",
  },
});

const exerciseVisualModalStyles = StyleSheet.create({
  exrMdlBackdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  exrMdlMainContainerWrapper: {
    width: "85%",
    maxWidth: 450,
    backgroundColor: "rgb(203, 205, 215)",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  exrMdlHeaderRegion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#297DB3",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  exrMdlTitleElement: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    flex: 1,
  },
  exrMdlDismissButtonArea: {
    padding: 4,
  },
  exrMdlContentSection: {
    padding: 24,
    alignItems: "center",
  },
  exrMdlAnimationEnclosure: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fcfcfc",
    marginBottom: 24,
  },
  exrMdlDynamicVisualization: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  exrMdlPlaceholderEnclosure: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#2A2A3A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  exrMdlPlaceholderNotification: {
    color: "#A0A0A0",
    fontSize: responsiveFontSize(16),
    marginTop: 16,
    fontWeight: "500",
  },
  exrMdlAcknowledgementButton: {
    backgroundColor: "#297DB3",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: "center",
    minWidth: 150,
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  exrMdlAcknowledgementButtonLabel: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    letterSpacing: 1,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: responsiveFontSize(16),
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: responsiveWidth(2),
    color: "#333",
    paddingRight: 40, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 50,
  },
  inputAndroid: {
    fontSize: responsiveFontSize(16),
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: responsiveWidth(2),
    color: "#333",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: 50,
  },
  placeholder: {
    color: "#999",
    fontSize: responsiveFontSize(16),
  },
  iconContainer: {
    top: 3,
    right: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ExerciseScreen;
