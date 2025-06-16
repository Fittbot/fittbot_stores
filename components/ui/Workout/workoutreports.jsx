import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import {
  clientReportAPI,
  getClientWorkoutAPI,
} from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import WorkoutCompletionModal from "./workoutcompletionmodal";

const { width, height } = Dimensions.get("window");

const isTablet = () => {
  const aspectRatio = height / width;
  return width >= 768 || (width >= 600 && aspectRatio < 1.6);
};

const DeleteConfirmationModal = ({ visible, onClose, onConfirm, photoUri }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmModalTitle}>Delete Photo?</Text>
          <Text style={styles.confirmModalMessage}>
            Are you sure you want to delete this photo? This action cannot be
            undone.
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.deleteButton]}
              onPress={() => onConfirm(photoUri)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const WeekdayButton = ({ day, date, isActive, onPress, fullDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buttonDate = new Date(fullDate);
  buttonDate.setHours(0, 0, 0, 0);
  const isFutureDate = buttonDate > today;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 7,
      }}
      disabled={isFutureDate}
    >
      <View
        style={[
          styles.weekdayButton,
          isActive && styles.activeWeekdayButton,
          isFutureDate && styles.disabledWeekdayButton,
        ]}
      >
        <Text
          style={[
            styles.weekdayText,
            isActive && styles.activeWeekdayText,
            isFutureDate && styles.disabledWeekdayText,
          ]}
        >
          {date}
        </Text>
      </View>
      <Text
        style={[
          styles.weekdayLabel,
          isActive && styles.activeWeekdayLabel,
          isFutureDate && styles.disabledWeekdayLabel,
        ]}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

const WorkoutReports = (props) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPhotos, setSavedPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [clientId, setClientId] = useState(null);
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const router = useRouter();
  const [workoutCompletionVisible, setWorkoutCompletionVisible] =
    useState(false);
  const [image, setImage] = useState(null);
  const {
    onSectionChange,
    scrollEventThrottle,
    onScroll,
    headerHeight,
    gender,
  } = props;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const deviceIsTablet = isTablet();

  // Fetch client ID from AsyncStorage on component mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const storedClientId = await AsyncStorage.getItem("client_id");
        if (storedClientId) {
          setClientId(storedClientId);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: "Client ID not found. Please login again.",
          });
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        showToast({
          type: "error",
          title: "Error",
          desc: "Failed to fetch user information",
        });
      }
    };

    fetchClientId();
  }, []);

  const formatHeaderDate = (date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${month} ${day}`;
    }
    return `${month} ${day}`;
  };

  const generateWeekDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDate = new Date(selectedDate);
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 3);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isSelected = date.toDateString() === selectedDate.toDateString();

      weekDays.push({
        day: days[date.getDay()],
        date: date.getDate(),
        fullDate: new Date(date),
        isActive: isSelected,
      });
    }

    return weekDays;
  };

  const selectDayFromStrip = (fullDate) => {
    const newSelectedDate = new Date(fullDate);
    newSelectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newSelectedDate > today) {
      return;
    }
    setSelectedDate(newSelectedDate);
  };

  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);

    if (newDate > today) return;
    setSelectedDate(newDate);
  };

  const getSavedPhotosByDate = async (date) => {
    if (!clientId) return [];

    try {
      const dirUri = `${FileSystem.documentDirectory}FittbotImages/`;
      const dirInfo = await FileSystem.getInfoAsync(dirUri);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(dirUri);
      const formattedDate = formatDateForAPI(date);

      // Filter files by client ID and date
      const dateFiles = files.filter((filename) => {
        // Check if file belongs to current client
        if (!filename.startsWith(`${clientId}_`)) {
          return false;
        }

        // Extract date from filename (format is clientId_randomId_date.jpg)
        const parts = filename.split("_");
        if (parts.length < 3) return false;

        const dateStr = parts[2]?.split(".")[0];
        return dateStr && dateStr === formattedDate;
      });

      if (dateFiles.length === 0) {
        return [];
      }

      const imagePaths = dateFiles.map((file) => `${dirUri}${file}`);
      return imagePaths;
    } catch (error) {
      console.error("Error fetching photos:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: `Failed to load images: ${error.message}`,
      });
      return [];
    }
  };

  const generateFilename = () => {
    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Client ID not found. Cannot save image.",
      });
      return null;
    }

    const randomId = Math.random().toString().slice(2, 10);
    const date = new Date().toISOString().split("T")[0];
    return `${clientId}_${randomId}_${date}.jpg`;
  };

  const setupImageDirectory = async () => {
    const dirUri = `${FileSystem.documentDirectory}FittbotImages/`;
    const dirInfo = await FileSystem.getInfoAsync(dirUri);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }

    return dirUri;
  };

  const handleDeletePhoto = async (photoUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(photoUri);
        const updatedPhotos = await getSavedPhotosByDate(selectedDate);
        setSavedPhotos(updatedPhotos);
        setDeleteModalVisible(false);
        if (selectedPhoto === photoUri) {
          setPhotoModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to delete the photo. Please try again later",
      });
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const confirmDeletePhoto = (photoUri) => {
    setPhotoToDelete(photoUri);
    setDeleteModalVisible(true);
  };

  const handleImageUpload = async () => {
    setWorkoutCompletionVisible(false);

    if (!clientId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "User not authenticated. Please login again.",
      });
      return;
    }

    try {
      // Request camera permissions with proper error handling
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (cameraStatus !== "granted") {
        showToast({
          type: "error",
          title: "Camera Permission Required",
          desc: "Please enable camera permissions in your device settings to take photos.",
        });
        setWorkoutCompletionVisible(true);
        return;
      }

      // For iOS, also request media library permissions
      if (Platform.OS === "ios") {
        const { status: mediaLibraryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== "granted") {
          console.log(
            "Media library permission not granted, but proceeding with camera only"
          );
        }
      }

      const dirUri = await setupImageDirectory();
      const newFilename = generateFilename();

      if (!newFilename) {
        setWorkoutCompletionVisible(true);
        return;
      }

      const newFileUri = `${dirUri}${newFilename}`;

      // Enhanced camera options for better iOS compatibility
      const cameraOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Set to false for better iOS compatibility
        aspect: [4, 3],
        quality: Platform.OS === "ios" ? 0.7 : 0.8,
        base64: false, // Set to false to reduce memory usage
        exif: false, // Disable EXIF data for faster processing
      };

      // Add iOS-specific options
      if (Platform.OS === "ios") {
        cameraOptions.presentationStyle =
          ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN;
      }

      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Delete previous image if exists
        if (image) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(image);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(image);
            }
          } catch (deleteError) {
            console.log("Error deleting previous image:", deleteError);
          }
        }

        // Copy the image to our directory
        try {
          await FileSystem.copyAsync({
            from: selectedAsset.uri,
            to: newFileUri,
          });

          setImage(newFileUri);

          showToast({
            type: "success",
            title: "Success",
            desc: "Photo captured successfully!",
          });
        } catch (copyError) {
          console.error("Error copying image:", copyError);
          showToast({
            type: "error",
            title: "Error",
            desc: "Failed to save the image. Please try again.",
          });
        }
      } else {
        console.log("Camera was cancelled or no image selected");
      }
    } catch (error) {
      console.error("Camera error:", error);

      let errorMessage = "Failed to open camera. Please try again.";

      // Provide specific error messages based on the error
      if (error.message?.includes("permission")) {
        errorMessage =
          "Camera permission is required. Please enable it in Settings.";
      } else if (error.message?.includes("unavailable")) {
        errorMessage = "Camera is not available on this device.";
      } else if (error.message?.includes("cancelled")) {
        errorMessage = "Camera was cancelled.";
      }

      showToast({
        type: "error",
        title: "Camera Error",
        desc: errorMessage,
      });
    } finally {
      setWorkoutCompletionVisible(true);
    }
  };

  const showDate = (event, selected) => {
    // On iOS, the picker stays open until explicitly closed
    // On Android, it closes automatically after selection
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // Update the date if one was selected (not cancelled)
    if (selected) {
      if (selected > today) return;
      setSelectedDate(selected);
      // Close the picker on iOS after selection
      if (Platform.OS === "ios") {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === "ios" && event.type === "dismissed") {
      // Handle iOS dismissal
      setShowDatePicker(false);
    }
  };

  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    setPhotoModalVisible(true);
  };

  const getReportDetails = async () => {
    if (!clientId) return;

    const formattedDate = formatDateForAPI(selectedDate);
    setIsLoading(true);

    try {
      const response = await clientReportAPI(clientId, formattedDate);

      if (response?.status === 200) {
        setReport(response?.data);
        const photos = await getSavedPhotosByDate(selectedDate);
        setSavedPhotos(photos);
        await fetchWorkoutDetails(formattedDate);
      } else {
        setWorkoutDetails([]);
        setReport(null);
      }
    } catch (error) {
      setWorkoutDetails([]);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkoutDetails = async (formattedDate) => {
    if (!clientId) return;

    try {
      const response = await getClientWorkoutAPI(clientId, formattedDate);

      if (response?.status === 200) {
        const workoutData = response?.data?.workout_details || [];
        setWorkoutDetails(workoutData);

        if (workoutData && workoutData.length > 0) {
          setSelectedTab(Object.keys(workoutData[0])[0] || "");
        } else {
          setSelectedTab(null);
        }
      } else {
        console.log("Error fetching workouts:", response?.detail);
        setWorkoutDetails([]);
        setSelectedTab(null);
      }
    } catch (error) {
      console.log("Error fetching workouts:", error);
      setWorkoutDetails([]);
      setSelectedTab(null);
    }
  };

  useEffect(() => {
    if (clientId) {
      getReportDetails();
    }
  }, [selectedDate, clientId]);

  const renderSetRow = (set, setIndex) => {
    return (
      <View key={setIndex} style={styles.setRow}>
        <Text style={styles.setText}>Set {set.setNumber}</Text>
        {set.reps > 0 && <Text style={styles.setText}>{set.reps} reps</Text>}
        {set.weight > 0 && <Text style={styles.setText}>{set.weight} kg</Text>}
        {set.duration > 0 && (
          <Text style={styles.setText}>{set.duration} sec</Text>
        )}
        <Text style={styles.setText}>{set.calories.toFixed(2)} kcal</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <FitnessLoader
        page={gender.toLocaleLowerCase() == "male" ? "workout2" : "workout1"}
      />
    );
  }

  const availableTabs = workoutDetails
    ? [
        ...new Set(
          workoutDetails.flatMap((workout) => Object.keys(workout || {}))
        ),
      ]
    : [];
  const getExercisesForSelectedTab = () => {
    if (!workoutDetails || workoutDetails.length === 0) return [];

    const allExercises = workoutDetails
      .flatMap((workout) =>
        Object.entries(workout || {})
          .filter(([muscleGroup]) => muscleGroup === selectedTab)
          .map(([_, exercises]) => exercises)
      )
      .flat();

    return allExercises;
  };

  const totalCalories = workoutDetails?.reduce((total, muscleGroup) => {
    const exercises = Object.values(muscleGroup).flat();
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        total += set.calories;
      });
    });
    return total;
  }, 0);

  const totalVolume = workoutDetails?.reduce((total, muscleGroup) => {
    const exercises = Object.values(muscleGroup).flat();
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        total += set.weight * set.reps;
      });
    });
    return total;
  }, 0);

  const getCurrentExercises = getExercisesForSelectedTab();

  return (
    <View style={styles.container}>
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant="light"
            textColor="#000000"
            onChange={showDate}
            maximumDate={today}
            style={Platform.OS === "ios" ? styles.iosDatePicker : {}}
          />
          {Platform.OS === "ios" && (
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.confirmButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ padding: 15 }}
        >
          <View style={styles.dateHeader}>
            <View style={styles.dateNavigator}>
              <TouchableOpacity onPress={() => navigateDate(-1)}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateHeaderText}>
                  {formatHeaderDate(selectedDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateDate(1)}
                disabled={selectedDate.toDateString() === today.toDateString()}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    selectedDate.toDateString() === today.toDateString()
                      ? "#ccc"
                      : "#000"
                  }
                />
              </TouchableOpacity>
            </View>
            {deviceIsTablet ? (
              // For tablets: Center the days without scrolling
              <View style={styles.weekDayStripTablet}>
                {generateWeekDays().map((item, index) => (
                  <WeekdayButton
                    key={index}
                    day={item.day}
                    date={item.date}
                    isActive={item.isActive}
                    onPress={() => selectDayFromStrip(item.fullDate)}
                    fullDate={item.fullDate}
                  />
                ))}
              </View>
            ) : (
              // For mobile: Keep scrollable horizontal strip
              <ScrollView
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.days}
                style={styles.weekDayStrip}
              >
                {generateWeekDays().map((item, index) => (
                  <WeekdayButton
                    key={index}
                    day={item.day}
                    date={item.date}
                    isActive={item.isActive}
                    onPress={() => selectDayFromStrip(item.fullDate)}
                    fullDate={item.fullDate}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.entryExitContainer}>
            <View style={styles.entryTimeContainer}>
              <Image
                source={
                  gender.toLowerCase() === "male"
                    ? require("../../../assets/images/workout/LOG_IN 3.png")
                    : require("../../../assets/images/workout/LOG_IN 3_female.png")
                }
                resizeMode="contain"
                style={{ width: 100, height: 100 }}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.entryTime}>
                  {report?.attendance?.in_time || "N/A"}
                </Text>
                {report?.attendance?.in_time_2 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.in_time_2 || "N/A"}
                  </Text>
                )}
                {report?.attendance?.in_time_3 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.in_time_3 || "N/A"}
                  </Text>
                )}
                <Text style={styles.entryLabel}>Gym Entry</Text>
              </View>
            </View>

            <View style={styles.workoutDuration}>
              <Text style={styles.durationText}>
                Duration: {report?.time_spent || "N/A"}
              </Text>
            </View>

            <View style={styles.exitTimeContainer}>
              <Image
                source={
                  gender.toLowerCase() === "male"
                    ? require("../../../assets/images/workout/LOG_OUT 1.png")
                    : require("../../../assets/images/workout/LOG_OUT 1_female.png")
                }
                resizeMode="contain"
                style={{ width: 100, height: 100 }}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.exitTime}>
                  {report?.attendance?.out_time || "N/A"}
                </Text>
                {report?.attendance?.in_time_2 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.out_time_2 || "N/A"}
                  </Text>
                )}
                {report?.attendance?.in_time_3 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.out_time_3 || "N/A"}
                  </Text>
                )}
                <Text style={styles.exitLabel}>Gym Exit</Text>
              </View>
            </View>
          </View>

          <View style={styles.workoutDetailsSection}>
            <Text style={styles.sectionTitle}>Workout Details</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
            >
              {availableTabs.map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tabButton,
                    selectedTab === tab && styles.activeTabButton,
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exerciseList}>
              {getCurrentExercises.length > 0 ? (
                getCurrentExercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <TouchableOpacity
                      onPress={() =>
                        toggleExerciseExpand(`${selectedTab}_${idx}`)
                      }
                      style={styles.exerciseHeader}
                    >
                      <View style={styles.exerciseNameContainer}>
                        <Text
                          style={styles.exerciseName}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {exercise.name}
                        </Text>
                        <Text style={styles.setDetails}>
                          {exercise.sets ? `${exercise.sets.length} sets` : ""}
                          {exercise.sets &&
                          exercise.sets.some((set) => set.reps > 0)
                            ? ` • ${Object.values(exercise.sets).reduce(
                                (sum, group) => sum + group.reps,
                                0
                              )} reps`
                            : ""}
                          {exercise.sets &&
                          exercise.sets.some((set) => set.weight > 0)
                            ? ` • ${Object.values(exercise.sets).reduce(
                                (sum, group) => sum + group.weight,
                                0
                              )} kg`
                            : ""}
                        </Text>
                      </View>
                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseCalories}>
                          {exercise.sets
                            ? `${Object.values(exercise.sets)
                                .reduce((sum, group) => sum + group.calories, 0)
                                .toFixed(2)} kcal`
                            : ""}
                        </Text>
                        <Ionicons
                          name={
                            expandedExercise === `${selectedTab}_${idx}`
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#555"
                        />
                      </View>
                    </TouchableOpacity>

                    {expandedExercise === `${selectedTab}_${idx}` &&
                      exercise.sets && (
                        <View style={styles.setsContainer}>
                          {exercise.sets.map((set, setIdx) =>
                            renderSetRow(set, setIdx)
                          )}
                        </View>
                      )}
                  </View>
                ))
              ) : (
                <Text style={styles.noExercisesText}>
                  No exercise Data found
                </Text>
              )}
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>

            <View style={styles.progressStatsContainer}>
              <View style={styles.progressStat}>
                <Image
                  source={require("../../../assets/images/calories.png")}
                  resizeMode="contain"
                  style={styles.progressImage}
                />
                <Text style={styles.statValue}>
                  {totalCalories
                    ? `${totalCalories.toFixed(2)} kcal`
                    : "0 kcal"}
                </Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>

              <View style={styles.progressStat}>
                <Image
                  source={require("../../../assets/images/kgs.png")}
                  resizeMode="contain"
                  style={styles.progressImage}
                />
                <Text style={styles.statValue}>
                  {totalVolume ? `${totalVolume.toFixed(2)} kg` : "0 kg"}
                </Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>

              <View style={styles.progressStat}>
                <Image
                  source={
                    gender.toLowerCase() === "male"
                      ? require("../../../assets/images/workout/Group 5 1.png")
                      : require("../../../assets/images/workout/Group 5 1_female.png")
                  }
                  resizeMode="contain"
                  style={{ width: 80, height: 80 }}
                />
                <Text style={styles.statValue}>
                  {report?.workout?.count} Exercises
                </Text>
                <Text style={styles.statLabel}> Completed</Text>
              </View>
            </View>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Progress Photos</Text>

            <View style={styles.photoGrid}>
              {isToday && (
                <TouchableOpacity
                  style={styles.uploadPhotoTile}
                  onPress={() => {
                    if (isToday) {
                      setWorkoutCompletionVisible(true);
                    }
                  }}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="camera" size={32} color="#000" />
                    <View style={styles.plusIconOverlay}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </View>
                  </View>
                  <Text style={styles.uploadPhotoText}>Upload pictures</Text>
                </TouchableOpacity>
              )}
              {savedPhotos.length === 0 ? (
                <Text style={styles.noPhotosText}>
                  No photos found for this date.
                </Text>
              ) : (
                savedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <TouchableOpacity
                      onPress={() => openPhotoModal(photo)}
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: photo }} style={styles.photo} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteIconContainer}
                      onPress={() => confirmDeletePhoto(photo)}
                    >
                      <Ionicons name="close-circle" size={24} color="#297DB3" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={photoModalVisible}
          transparent={true}
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.photoModalOverlay}>
            <TouchableOpacity
              style={styles.photoCloseButton}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullScreenPhoto}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.photoDeleteButton}
              onPress={() => {
                setPhotoModalVisible(false);
                confirmDeletePhoto(selectedPhoto);
              }}
            >
              <Ionicons name="trash-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>

        <DeleteConfirmationModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={handleDeletePhoto}
          photoUri={photoToDelete}
        />

        <WorkoutCompletionModal
          visible={workoutCompletionVisible}
          onClose={async () => {
            setWorkoutCompletionVisible(false);
            setImage(null);
            setSavedPhotos(await getSavedPhotosByDate(selectedDate));
          }}
          onAddImage={handleImageUpload}
          image={image}
          type={"reports"}
        />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    // paddingTop: 10,
  },
  scrollContent: {
    // paddingHorizontal: 15,
    paddingBottom: 20,
  },

  // Date picker styles (same as DietReport)
  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "absolute",
    top: 300,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  iosDatePicker: {
    height: 200,
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 10,
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  confirmButton: {
    backgroundColor: "#FF5757",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  dateNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: "white",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 15,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weekDayStrip: {
    paddingLeft: 8,
    paddingTop: 10,
    paddingBottom: 16,
  },

  weekDayStripTablet: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  weekdayButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "rgba(0, 123, 255, 0.06)",
  },

  weekdayButtonTablet: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  activeWeekdayButton: {
    backgroundColor: "#007BFF",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "400",
  },
  weekdayLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  activeWeekdayText: {
    color: "white",
  },
  activeWeekdayLabel: {
    color: "#007BFF",
  },
  entryExitContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderRadius: 15,
    paddingVertical: 15,
  },
  entryTimeContainer: {
    width: "33%",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: "white",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "visible",
  },
  exitTimeContainer: {
    width: "33%",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
    elevation: 3,
    overflow: "visible",
  },
  timeContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  exitTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  entryLabel: {
    fontSize: 12,
    color: "#777",
  },
  exitLabel: {
    fontSize: 12,
    color: "#777",
  },
  workoutDuration: {
    width: "33%",
    padding: 5,
  },
  durationText: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
    elevation: 3,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  workoutDetailsSection: {
    backgroundColor: "white",
    borderRadius: 15,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#D9D9D9",
  },
  activeTabButton: {
    backgroundColor: "#007BFF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "400",
  },
  activeTabText: {
    color: "white",
  },
  exerciseList: {
    marginTop: 10,
  },
  exerciseItem: {
    marginBottom: 12,
    backgroundColor: "rgba(217, 217, 217, 0.25)",
    borderRadius: 8,
    overflow: "hidden",
  },
  exerciseHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  exerciseMeta: {
    alignItems: "flex-end",
  },
  exerciseCalories: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  setText: {
    fontSize: 12,
    color: "#555",
  },
  setDetails: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.80)",
  },
  noExercisesText: {
    textAlign: "center",
    color: "#777",
    padding: 20,
  },
  progressSection: {
    marginVertical: 10,
  },
  progressStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  progressStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    justifyContent: "flex-end",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 5,
    shadowColor: "rgba(0, 0, 0, 0.50)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressImage: {
    width: 70,
    height: 70,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  photoSection: {
    backgroundColor: "white",
    marginVertical: 10,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 5,
  },
  uploadPhotoTile: {
    width: "32%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  plusIconOverlay: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "#000",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPhotoText: {
    fontSize: 12,
    color: "#777",
  },
  photoContainer: {
    position: "relative",
    width: "32%",
    height: width / 3.5,
    marginBottom: 10,
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  deleteIconContainer: {
    position: "absolute",
    top: -12,
    right: -5,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  noPhotosText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
    width: "100%",
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenPhoto: {
    width: width,
    height: width,
  },
  photoCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  photoDeleteButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    zIndex: 10,
  },
  disabledWeekdayButton: {
    backgroundColor: "#D9D9D9",
  },
  disabledWeekdayText: {
    color: "#999",
  },
  disabledWeekdayLabel: {
    color: "#999",
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  confirmModalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#297DB3",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default WorkoutReports;
