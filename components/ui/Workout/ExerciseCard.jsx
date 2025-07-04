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
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
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
  const [prevSetsLength, setPrevSetsLength] = useState(0);
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    const currentSetsLength = exerciseState.sets?.length || 0;

    // Auto-expand when sets are added to an exercise that previously had no sets
    // This handles both play button (1 set added) and + button (multiple sets added)
    if (hasSets && !expanded && prevSetsLength === 0 && currentSetsLength > 0) {
      setExpanded(true);
      Animated.timing(expandAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // Update the previous sets length
    setPrevSetsLength(currentSetsLength);
  }, [hasSets, exerciseState.sets?.length, expanded, prevSetsLength]);

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
        ? responsiveHeight(13 + (exerciseState.sets?.length || 0) * 4 + 15)
        : responsiveHeight(18),
    ],
  });

  const getSetNumberColor = (index) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"];
    return colors[index % colors.length];
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}.${seconds.toString().padStart(2, "0")}`;
  };

  const renderSetItem = ({ item: set, index: setIndex }) => (
    <View style={styles.newSetItem}>
      <TouchableOpacity
        style={styles.deleteSetButton}
        onPress={() => onDeleteSet(exerciseName, setIndex)}
      >
        <Ionicons name="trash" size={16} color="#FF6B6B" />
      </TouchableOpacity>

      <View style={styles.setRowContent}>
        <View style={styles.setNumberContainer}>
          <View
            style={[
              styles.setNumberCircle,
              { backgroundColor: getSetNumberColor(setIndex) },
            ]}
          >
            <Text style={styles.setNumber}>{setIndex + 1}</Text>
          </View>
        </View>

        <View style={styles.setDataContainer}>
          {isCardioExercise ? (
            <>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>
                  {formatDuration(set.duration)}
                  <Text style={styles.setDataLabel}>&nbsp;min</Text>
                </Text>
                {/* <Text style={styles.setDataLabel}>minutes</Text> */}
              </View>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>{set.calories}</Text>
              </View>
            </>
          ) : isMuscleGroupExercise ? (
            <>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>
                  {formatDuration(set.duration)}
                  <Text style={styles.setDataLabel}>&nbsp;min</Text>
                </Text>
                {/* <Text style={styles.setDataLabel}>minutes</Text> */}
              </View>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>{set.reps}</Text>
              </View>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>
                  {set.calories}
                  <Text style={styles.setDataLabel}>kcal</Text>
                </Text>
              </View>
              {!isBodyWeightExercise && (
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {set.weight}
                    <Text style={styles.setDataLabel}>kg</Text>
                  </Text>
                  {/* <Text style={styles.setDataLabel}>kg</Text> */}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>
                  {formatDuration(set.duration)}
                  <Text style={styles.setDataLabel}>&nbsp;min</Text>
                </Text>
                {/* <Text style={styles.setDataLabel}>minutes</Text> */}
              </View>
              <View style={styles.setDataColumn}>
                <Text style={styles.setDataValue}>{set.calories}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderSetsHeader = () => {
    if (!hasSets) return null;

    const getHeaderColumns = () => {
      if (isCardioExercise) {
        return [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
        ];
      } else if (isMuscleGroupExercise) {
        const columns = [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "repeat", name: "Reps", unit: "", color: "#45B7D1" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
        ];
        if (!isBodyWeightExercise) {
          columns.push({
            icon: "weight-kilogram",
            name: "Weight",
            unit: "kg",
            color: "#9B59B6",
            isFA: true,
          });
        }
        return columns;
      } else {
        return [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
        ];
      }
    };

    const headerColumns = getHeaderColumns();

    // Check if weight column exists to determine font size
    const hasWeight = isMuscleGroupExercise && !isBodyWeightExercise;
    const headerFontSize = hasWeight ? 9 : 11;
    const unitFontSize = hasWeight ? 8 : 9;

    return (
      <View style={styles.setsHeaderContainer}>
        {/* First row - Icons and titles */}
        <View style={styles.setsHeaderRow}>
          <View style={styles.headerSetColumn}>
            <Ionicons name="fitness" size={16} color="#FF6B6B" />
            <Text
              style={[
                styles.headerText,
                { fontSize: responsiveFontSize(headerFontSize) },
              ]}
            >
              Sets
            </Text>
          </View>

          <View style={styles.headerDataContainer}>
            {headerColumns.map((column, index) => (
              <View key={index} style={styles.headerIconContainer}>
                <View style={styles.headerIconAndTitle}>
                  {column.isFA ? (
                    <MaterialCommunityIcons
                      name={column.icon}
                      size={14}
                      color={column.color}
                    />
                  ) : (
                    <Ionicons
                      name={column.icon}
                      size={14}
                      color={column.color}
                    />
                  )}
                  <Text
                    style={[
                      styles.headerText,
                      { fontSize: responsiveFontSize(headerFontSize) },
                    ]}
                  >
                    {column.name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Second row - Units only */}
        {/* <View style={styles.setsHeaderUnitsRow}>
          <View style={styles.headerSetColumn}></View>

          <View style={styles.headerDataContainer}>
            {headerColumns.map((column, index) => (
              <View key={index} style={styles.headerIconContainer}>
                {column.unit && (
                  <Text
                    style={[
                      styles.headerUnitText,
                      { fontSize: responsiveFontSize(unitFontSize) },
                    ]}
                  >
                    {column.unit}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View> */}
      </View>
    );
  };

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
              <View style={styles.setsDisplayContainer}>
                {renderSetsHeader()}
                <FlatList
                  data={exerciseState.sets}
                  renderItem={renderSetItem}
                  keyExtractor={(item, index) => `set-${index}`}
                  horizontal={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  style={styles.setsList}
                  contentContainerStyle={styles.setsContainer}
                  initialNumToRender={50}
                  maxToRenderPerBatch={50}
                />
              </View>
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
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
  },
  addButton: {
    marginRight: responsiveWidth(1),
    padding: responsiveWidth(1),
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
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
    paddingHorizontal: responsiveWidth(0),
    paddingBottom: responsiveWidth(6),
    zIndex: 2,
  },
  setsDisplayContainer: {
    // backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(3),
    marginTop: responsiveHeight(1),
  },
  setsHeaderContainer: {
    marginBottom: responsiveHeight(1),
  },
  setsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    // paddingBottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 8,
    // borderTopRightRadius: 8,
    marginBottom: 0,
  },
  headerSetColumn: {
    width: responsiveWidth(13),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDataContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: responsiveWidth(6),
  },
  headerIconContainer: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: responsiveWidth(1),
  },
  headerIconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "600",
    color: "#333",
    marginLeft: 1.5,
    textAlign: "center",
  },
  // setsList: {
  //   maxHeight: responsiveHeight(25),
  // },
  setsContainer: {
    paddingVertical: responsiveHeight(0.5),
  },
  newSetItem: {
    position: "relative",
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(0.5),
    marginBottom: responsiveHeight(0.5),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: responsiveWidth(2),
    borderLeftWidth: 3,
    borderLeftColor: "#E3F2FD",
  },
  deleteSetButton: {
    position: "absolute",
    top: responsiveHeight(1.2),
    right: responsiveWidth(1.5),
    padding: responsiveWidth(0.5),
    zIndex: 10,
  },
  setRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: responsiveWidth(6), // Space for delete button
  },
  setNumberContainer: {
    width: responsiveWidth(13),
    alignItems: "center",
  },
  setNumberCircle: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    borderRadius: responsiveWidth(4),
    justifyContent: "center",
    alignItems: "center",
  },
  setNumber: {
    color: "white",
    fontSize: responsiveFontSize(9),
    fontWeight: "bold",
  },
  setDataContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setDataColumn: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: responsiveWidth(1),
  },
  setDataValue: {
    fontSize: responsiveFontSize(11),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  setDataLabel: {
    fontSize: responsiveFontSize(9),
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  noSetsContainer: {
    alignItems: "center",
    paddingVertical: responsiveHeight(1),
    // backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: responsiveWidth(3),
    marginTop: responsiveHeight(0.5),
  },
  noSetsText: {
    color: "#666",
    fontSize: responsiveFontSize(14),
    fontStyle: "italic",
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
  headerTextContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 4,
  },
  headerUnitText: {
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
    marginLeft: 6,
    marginTop: -3,
    // marginTop: 1,
  },
  setsHeaderUnitsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.3),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default ExerciseCard;
