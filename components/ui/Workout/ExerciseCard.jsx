import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  ImageBackground,
  AppState,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const BACKGROUND_TIME_KEY = "app_background_timestamp";
const ACCUMULATED_TIME_KEY = "accumulated_background_time";

const ExerciseCard = ({
  exercise,
  index,
  isInGym,
  activeExercises,
  onStartExercise,
  onStopExercise,
  onHistoricalExercise,
  onViewGif,
  onDeleteSet,
}) => {
  const exerciseName = typeof exercise === "string" ? exercise : exercise.name;
  const exerciseState = activeExercises[exerciseName] || {};
  const hasSets = exerciseState.sets && exerciseState.sets.length > 0;

  const [expanded, setExpanded] = useState(hasSets);
  const [expandAnimation] = useState(new Animated.Value(hasSets ? 1 : 0));
  const initialRenderRef = useRef(true);

  const [timer, setTimer] = useState(0);

  const timerIntervalRef = useRef(null);

  const muscleGroup = exercise.muscleGroup || "";
  const gifPath = exercise.gifPath || null;
  const isCardioExercise = exercise.isCardio || false;
  const isMuscleGroupExercise = exercise.isMuscleGroup || false;
  const isBodyWeightExercise = exercise.isBodyWeight || false;
  const imagePath = exercise?.imgPath || null;
  const isActive = exerciseState.isActive;
  const isAnyExerciseActive = Object.values(activeExercises).some(
    (ex) => ex.isActive
  );

  const [appState, setAppState] = useState(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(0);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (hasSets && !expanded && exerciseState.sets?.length === 1) {
      setExpanded(true);
      Animated.timing(expandAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [hasSets, exerciseState.sets?.length]);

  const handleAppStateChange = useCallback(
    async (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/) &&
        isActive
      ) {
        const now = Date.now();
        try {
          await AsyncStorage.setItem(BACKGROUND_TIME_KEY, now.toString());
        } catch (error) {
          console.error("Failed to save background timestamp:", error);
        }
      }
      // App coming back to foreground
      else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isActive
      ) {
        try {
          // Get the timestamp when app went to background
          const backgroundTimestamp = await AsyncStorage.getItem(
            BACKGROUND_TIME_KEY
          );

          if (backgroundTimestamp !== null) {
            const backgroundTime = parseInt(backgroundTimestamp, 10);
            const now = Date.now();
            const timeInBackground = Math.floor((now - backgroundTime) / 1000); // Time difference in seconds

            // Update timer by adding the background time
            setTimer((prevTimer) => prevTimer + timeInBackground);

            // Store the background time for future reference if needed
            backgroundTimeRef.current = timeInBackground;
          }
        } catch (error) {
          console.error("Failed to calculate background time:", error);
        }
      }

      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    },
    [isActive]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isActive) {
      setTimer(0);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isActive]);

  const getCardColorGradient = (index) => {
    const colorSets = [
      ["#1E293B", "#334155"],
      ["#0F172A", "#1E293B"],
      ["#374151", "#4B5563"],
      ["#18181B", "#27272A"],
    ];

    return colorSets[index % colorSets.length];
  };

  const colorGradient = getCardColorGradient(index);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.timing(expandAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Function to handle image click for GIF viewing
  const handleImageClick = (e) => {
    e.stopPropagation();
    if (gifPath) {
      onViewGif(exerciseName, gifPath);
    }
  };

  const maxHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      responsiveHeight(13),
      hasSets
        ? responsiveHeight(13 + (exerciseState.sets?.length || 0) * 7 + 5)
        : responsiveHeight(18),
    ],
  });

  const renderSetItem = ({ item: set, index: setIndex }) => (
    <View style={styles.setItem}>
      {isCardioExercise ? (
        <View style={styles.setContent}>
          <Text style={styles.setNumber}>{setIndex + 1}</Text>
          <View style={styles.setDetails}>
            <View style={styles.setMetric}>
              <Ionicons name="stopwatch-outline" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.duration}s</Text>
            </View>
            <View style={styles.setMetric}>
              <Ionicons name="flame-outline" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.calories} cal</Text>
            </View>
          </View>
        </View>
      ) : isMuscleGroupExercise ? (
        <View style={styles.setContent}>
          <Text style={styles.setNumber}>{setIndex + 1}</Text>
          <View style={styles.setDetails}>
            <View style={styles.setMetric}>
              <Ionicons name="repeat" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.reps}</Text>
            </View>
            {!isBodyWeightExercise && (
              <View style={styles.setMetric}>
                <FontAwesome5 name="weight" size={14} color="#183243" />
                <Text style={styles.setMetricText}>{set.weight}kg</Text>
              </View>
            )}
            <View style={styles.setMetric}>
              <Ionicons name="flame-outline" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.calories} cal</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.setContent}>
          <Text style={styles.setNumber}>{setIndex + 1}</Text>
          <View style={styles.setDetails}>
            <View style={styles.setMetric}>
              <Ionicons name="stopwatch-outline" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.duration}s</Text>
            </View>
            <View style={styles.setMetric}>
              <Ionicons name="flame-outline" size={16} color="#183243" />
              <Text style={styles.setMetricText}>{set.calories} cal</Text>
            </View>
          </View>
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteSetButton}
        onPress={() => onDeleteSet(exerciseName, setIndex)}
      >
        <Ionicons name="close-circle" size={20} color="#183243" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.cardContainer, { height: maxHeight }]}>
      <LinearGradient
        colors={[
          "rgba(236, 236, 236, 0.9)",
          "rgba(74, 162, 244, 0.31)",
        ].reverse()}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleExpand}
          style={styles.cardTouchable}
        >
          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={styles.exerciseImageContainer}
              onPress={handleImageClick}
              activeOpacity={0.8}
            >
              <Image source={imagePath} style={styles.exerciseImage} />
              {gifPath && (
                <View style={styles.gifIndicator}>
                  <Ionicons name="play-circle" size={12} color="#000000" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <View>
                <Text style={styles.exerciseName}>{exerciseName}</Text>
                {muscleGroup ? (
                  <Text style={styles.muscleGroupText}>{muscleGroup}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.rightContainer}>
              {isInGym ? (
                // Existing in-gym logic
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !isActive && isAnyExerciseActive && styles.disabledButton,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      onStopExercise(exerciseName);
                    } else if (!isAnyExerciseActive) {
                      onStartExercise(exerciseName);
                    }
                  }}
                  disabled={!isActive && isAnyExerciseActive}
                >
                  <Ionicons
                    name={isActive ? "stop-circle" : "play-circle"}
                    size={28}
                    color={
                      isActive
                        ? "#FF3B30"
                        : !isActive && isAnyExerciseActive
                        ? "#999"
                        : "#183243"
                    }
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionIconButton,
                      !isActive && isAnyExerciseActive && styles.disabledButton,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        onStopExercise(exerciseName);
                      } else if (!isAnyExerciseActive) {
                        onStartExercise(exerciseName);
                      }
                    }}
                    disabled={!isActive && isAnyExerciseActive}
                  >
                    <Ionicons
                      name={isActive ? "stop-circle" : "play-circle"}
                      size={28}
                      color={
                        isActive
                          ? "#FF3B30"
                          : !isActive && isAnyExerciseActive
                          ? "#999"
                          : "#183243"
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      onHistoricalExercise(exerciseName);
                    }}
                  >
                    <Ionicons name="add-circle" size={28} color="#183243" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.expandButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
              >
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#183243"
                />
              </TouchableOpacity>
            </View>
          </View>

          {hasSets && !expanded && (
            <View style={styles.setsIndicator}>
              <Text style={styles.setsIndicatorText}>
                {exerciseState.sets.length}{" "}
                {exerciseState.sets.length === 1 ? "set" : "sets"}
              </Text>
            </View>
          )}

          {/* stopwatch */}

          {isActive && (
            <View
              style={[
                styles.timerContainer,
                !isInGym && styles.timerContainerOutGym,
              ]}
            >
              <Ionicons name="time-outline" size={16} color="#FFF" />
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
          )}
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            {hasSets ? (
              <FlatList
                data={exerciseState.sets}
                renderItem={renderSetItem}
                keyExtractor={(item, index) => `set-${index}`}
                horizontal={false}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                style={styles.setsList}
                contentContainerStyle={styles.setsContainer}
                initialNumToRender={50}
                maxToRenderPerBatch={50}
              />
            ) : (
              <View style={styles.noSetsContainer}>
                <Text style={styles.noSetsText}>No sets recorded</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: responsiveWidth(3),
    marginBottom: responsiveHeight(1.5),
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  backgroundImageStyle: {
    borderRadius: responsiveWidth(3),
    opacity: 0.7,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: responsiveWidth(3),
    opacity: 0.9,
  },
  cardTouchable: {
    paddingHorizontal: responsiveWidth(3),
    justifyContent: "center",
    paddingVertical: responsiveHeight(1.5),
    height: responsiveHeight(13),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  exerciseImageContainer: {
    width: responsiveWidth(18),
    height: "100%",
    borderRadius: responsiveWidth(2),
    overflow: "hidden",
    position: "relative",
    marginRight: responsiveWidth(3),
    backgroundColor: "#FFFFFF",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  gifIndicator: {
    position: "absolute",
    right: 5,
    bottom: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  exerciseName: {
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    color: "#00000",
  },
  muscleGroupText: {
    fontSize: responsiveFontSize(11),
    color: "rgba(0, 0, 0, 0.9)",
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: responsiveWidth(0.5),
  },
  actionIconButton: {
    padding: responsiveWidth(1),
    marginHorizontal: responsiveWidth(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  addButton: {
    marginRight: responsiveWidth(1),
    padding: responsiveWidth(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  expandButton: {
    padding: responsiveWidth(1),
  },
  setsIndicator: {
    position: "absolute",
    top: responsiveHeight(0.5),
    right: responsiveWidth(4),
    backgroundColor: "#183243",
    paddingVertical: responsiveHeight(0.3),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: responsiveWidth(5),
    zIndex: 5,
  },
  setsIndicatorText: {
    color: "white",
    fontSize: responsiveFontSize(10),
    fontWeight: "bold",
  },
  expandedContent: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveWidth(6),
    zIndex: 2,
  },
  setsList: {
    marginBottom: responsiveHeight(1),
  },
  setsContainer: {
    paddingBottom: responsiveHeight(1),
  },
  setItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: responsiveWidth(2),
    padding: responsiveWidth(2),
    marginBottom: responsiveHeight(0.8),
    alignItems: "center",
    justifyContent: "space-between",
  },
  setContent: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  setNumber: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: responsiveWidth(3),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    textAlign: "center",
    lineHeight: responsiveWidth(6),
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
    color: "#183243",
    marginRight: responsiveWidth(2),
  },
  setDetails: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  setMetric: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  setMetricText: {
    color: "#183243",
    fontSize: responsiveFontSize(12),
    marginLeft: 4,
  },
  deleteSetButton: {
    padding: 4,
  },
  noSetsContainer: {
    alignItems: "center",
    paddingVertical: responsiveHeight(1),
  },
  noSetsText: {
    color: "#183243",
    fontSize: responsiveFontSize(14),
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: responsiveHeight(1),
    marginBottom: responsiveHeight(2),
    zIndex: 3,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(0.8),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: responsiveWidth(5),
    minWidth: responsiveWidth(30),
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
    paddingVertical: responsiveHeight(0.8),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: responsiveWidth(5),
    backgroundColor: "#1E293B",
    minWidth: responsiveWidth(30),
  },
  buttonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(13),
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: responsiveWidth(1),
  },
  disabledButton: {
    opacity: 0.5,
  },
  timerContainer: {
    position: "absolute",
    bottom: responsiveHeight(0.5),
    right: responsiveWidth(4),
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(0.4),
    paddingHorizontal: responsiveWidth(2.5),
    borderRadius: responsiveWidth(4),
    zIndex: 5,
  },
  timerContainerOutGym: {
    right: responsiveWidth(12),
  },
  timerText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: responsiveFontSize(12),
    marginLeft: responsiveWidth(1),
  },
});

export default ExerciseCard;
