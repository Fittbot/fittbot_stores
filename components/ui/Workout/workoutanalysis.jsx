import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import FitnessLoader from "../../../components/ui/FitnessLoader";
import { clientWorkoutAnalysisAPI } from "../../../services/clientApi";
import ComparisonComments from "./comparisionComments";
import { showToast } from "../../../utils/Toaster";
import { Ionicons } from "@expo/vector-icons";
const { width } = Dimensions.get("window");

const WorkoutAnalysis = ({ headerHeight, gender }) => {
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [workoutAnalysisData, setWorkoutAnalysisData] = useState(null);
  const [dropdownItems, setDropdownItems] = useState(null);
  const [selectedInsightType, setSelectedInsightType] = useState(null);
  const [selectedMuscleChartType, setSelectedMuscleChartType] = useState(null);

  // Refs for horizontal scrolling
  const insightTabsScrollViewRef = useRef(null);
  const muscleChartTabsScrollViewRef = useRef(null);
  const overallChartScrollViewRef = useRef(null);
  const aggregatedChartScrollViewRef = useRef(null);
  const muscleChartScrollViewRef = useRef(null);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(41, 125, 179, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
    // Hide the default Y-axis
    propsForYLabels: {
      opacity: 0,
    },
  };

  const barChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(41, 125, 179, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
    fillShadowGradient: "#297DB3",
    fillShadowGradientOpacity: 1,
    // Hide the default Y-axis
    propsForYLabels: {
      opacity: 0,
    },
  };

  const getWorkOutAnalysis = async () => {
    setLoading(true);
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await clientWorkoutAnalysisAPI(clientId);

      if (response?.status === 200) {
        setDropdownItems(response.data?.muscle_group_list);
        setWorkoutAnalysisData(response.data);
        if (
          response.data?.muscle_group_list &&
          response.data.muscle_group_list.length > 0
        ) {
          setSelectedMuscle(response.data.muscle_group_list[0].name);

          if (
            response.data?.muscle_insights &&
            response.data.muscle_insights[
              response.data.muscle_group_list[0].name
            ] &&
            response.data.muscle_insights[
              response.data.muscle_group_list[0].name
            ].weekly_data
          ) {
            const chartTypes = Object.keys(
              response.data.muscle_insights[
                response.data.muscle_group_list[0].name
              ].weekly_data
            );
            if (chartTypes.length > 0) {
              setSelectedMuscleChartType(chartTypes[0]);
            }
          }
        }

        if (
          response.data?.aggregated_muscle_insights &&
          Object.keys(response.data.aggregated_muscle_insights).length > 0
        ) {
          setSelectedInsightType(
            Object.keys(response.data.aggregated_muscle_insights)[0]
          );
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to load workout analysis",
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

  useFocusEffect(
    useCallback(() => {
      getWorkOutAnalysis();
    }, [])
  );

  useEffect(() => {
    if (
      selectedMuscle &&
      workoutAnalysisData?.muscle_insights &&
      workoutAnalysisData.muscle_insights[selectedMuscle] &&
      workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data
    ) {
      const chartTypes = Object.keys(
        workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data
      );
      if (chartTypes.length > 0) {
        setSelectedMuscleChartType(chartTypes[0]);
      } else {
        setSelectedMuscleChartType(null);
      }
    }
  }, [selectedMuscle, workoutAnalysisData]);

  useEffect(() => {
    if (
      selectedInsightType &&
      workoutAnalysisData?.aggregated_muscle_insights
    ) {
      const insightTypes = Object.keys(
        workoutAnalysisData.aggregated_muscle_insights
      ).filter(
        (key) =>
          workoutAnalysisData.aggregated_muscle_insights[key] &&
          workoutAnalysisData.aggregated_muscle_insights[key].length > 0
      );

      scrollToTab(selectedInsightType, insightTypes, insightTabsScrollViewRef);
    }
  }, [selectedInsightType, workoutAnalysisData]);

  useEffect(() => {
    if (
      selectedMuscleChartType &&
      selectedMuscle &&
      workoutAnalysisData?.muscle_insights &&
      workoutAnalysisData.muscle_insights[selectedMuscle]?.weekly_data
    ) {
      const chartTypes = Object.keys(
        workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data
      ).filter((key) => {
        const data =
          workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data[key];
        return data && data.length > 0;
      });

      scrollToTab(
        selectedMuscleChartType,
        chartTypes,
        muscleChartTabsScrollViewRef
      );
    }
  }, [selectedMuscleChartType, selectedMuscle, workoutAnalysisData]);

  useEffect(() => {
    const scrollDelay = 300;
    const safeScrollTo = (ref, scrollX) => {
      if (ref && ref.current) {
        try {
          ref.current.scrollTo({
            x: scrollX,
            animated: false,
          });
        } catch (error) {
          console.log("Scroll error:", error);
        }
      }
    };

    if (hasOverallData && workoutAnalysisData?.overall_data) {
      setTimeout(() => {
        const scrollWidth = width * 1.5;
        safeScrollTo(overallChartScrollViewRef, scrollWidth);
      }, scrollDelay);
    }

    if (
      selectedInsightType &&
      workoutAnalysisData?.aggregated_muscle_insights &&
      workoutAnalysisData.aggregated_muscle_insights[selectedInsightType]
    ) {
      setTimeout(() => {
        const itemCount =
          workoutAnalysisData.aggregated_muscle_insights[selectedInsightType]
            .length;
        const scrollWidth = Math.max(width * 1.5, itemCount * 80);
        safeScrollTo(aggregatedChartScrollViewRef, scrollWidth);
      }, scrollDelay);
    }

    if (
      selectedMuscle &&
      selectedMuscleChartType &&
      workoutAnalysisData?.muscle_insights &&
      workoutAnalysisData.muscle_insights[selectedMuscle]?.weekly_data &&
      workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data[
        selectedMuscleChartType
      ]
    ) {
      setTimeout(() => {
        const scrollWidth = width * 1.5;
        safeScrollTo(muscleChartScrollViewRef, scrollWidth);
      }, scrollDelay);
    }
  }, [
    workoutAnalysisData,
    selectedInsightType,
    selectedMuscle,
    selectedMuscleChartType,
  ]);

  const scrollToTab = (tabName, tabOptions, scrollViewRef) => {
    const index = tabOptions.indexOf(tabName);
    if (index !== -1 && scrollViewRef && scrollViewRef.current) {
      try {
        const approximateTabWidth = 100;
        const scrollToX = Math.max(
          0,
          index * approximateTabWidth - width / 2 + approximateTabWidth / 2
        );
        scrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
      } catch (error) {
        console.log("Error scrolling to tab:", error);
      }
    }
  };

  if (loading || !workoutAnalysisData) {
    return (
      <FitnessLoader
        page={gender.toLocaleLowerCase() == "male" ? "workout2" : "workout1"}
      />
    );
  }

  const hasOverallData =
    workoutAnalysisData?.overall_data &&
    workoutAnalysisData.overall_data.length > 0;

  const hasMuscleInsights =
    workoutAnalysisData?.muscle_insights &&
    Object.keys(workoutAnalysisData.muscle_insights).length > 0;

  const hasAggregatedInsights =
    workoutAnalysisData?.aggregated_muscle_insights &&
    Object.values(workoutAnalysisData.aggregated_muscle_insights).some(
      (arr) => arr.length > 0
    );

  const validDropdownItems =
    dropdownItems?.filter((item) => item && item.name) || [];

  const renderInsightTabs = () => {
    if (!hasAggregatedInsights) return null;

    const insightTypes = Object.keys(
      workoutAnalysisData.aggregated_muscle_insights
    ).filter(
      (key) =>
        workoutAnalysisData.aggregated_muscle_insights[key] &&
        workoutAnalysisData.aggregated_muscle_insights[key].length > 0
    );

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={insightTabsScrollViewRef}
        >
          {insightTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tabButton,
                selectedInsightType === type ? styles.tabButtonActive : null,
              ]}
              onPress={() => {
                setSelectedInsightType(type);
                scrollToTab(type, insightTypes, insightTabsScrollViewRef);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedInsightType === type
                    ? styles.tabButtonTextActive
                    : null,
                ]}
              >
                {type.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMuscleChartTypeTabs = () => {
    if (
      !selectedMuscle ||
      !workoutAnalysisData?.muscle_insights ||
      !workoutAnalysisData.muscle_insights[selectedMuscle] ||
      !workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data
    ) {
      return null;
    }

    const chartTypes = Object.keys(
      workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data
    ).filter((key) => {
      const data =
        workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data[key];
      return data && data.length > 0;
    });

    if (chartTypes.length === 0) return null;

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={muscleChartTabsScrollViewRef}
        >
          {chartTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tabButton,
                selectedMuscleChartType === type
                  ? styles.tabButtonActive
                  : null,
              ]}
              onPress={() => {
                setSelectedMuscleChartType(type);
                scrollToTab(type, chartTypes, muscleChartTabsScrollViewRef);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedMuscleChartType === type
                    ? styles.tabButtonTextActive
                    : null,
                ]}
              >
                {type.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Improved StickyYAxis component that aligns properly with the chart
  const StickyYAxis = ({ data, height, chartConfig }) => {
    // Find max value for scaling
    const maxValue = Math.max(...data);
    const yAxisSteps = 5;
    const stepSize = maxValue / yAxisSteps;

    // Calculate correct positioning
    const chartHeight = height - 40; // Account for chart padding
    const labelOffset = 15; // Adjust for proper vertical alignment

    return (
      <View style={[styles.stickyYAxis, { height }]}>
        {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
          const value = maxValue - i * stepSize;
          // Position calculation that properly aligns with chart
          const position = (i * chartHeight) / yAxisSteps + labelOffset;

          return (
            <Text
              key={i}
              style={[
                styles.yAxisLabel,
                {
                  top: position, // Use top instead of bottom for proper alignment
                  color: chartConfig.labelColor(1),
                },
              ]}
            >
              {Math.round(value)}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]}>
      <Animated.ScrollView contentContainerStyle={[styles.scrollViewContent]}>
        <LinearGradient
          colors={["rgba(41,125,179,0.09)", "rgba(41,125,179,0.09)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.linearHeader}
        >
          <Text style={styles.insightsHeader}>Hey Buddy,</Text>
          <Text style={styles.insightsSubHeader}>
            Here's a Quick Look at your Progress!
          </Text>
          <View>
            {workoutAnalysisData?.comparison_comment &&
            workoutAnalysisData.comparison_comment.length > 0 ? (
              <ComparisonComments
                comments={workoutAnalysisData.comparison_comment}
              />
            ) : (
              <Text style={styles.commentText}>
                Start logging your workouts to see insights and comparisons
                here.
              </Text>
            )}
          </View>
        </LinearGradient>

        <LinearGradient
          colors={["rgba(41,125,179,0.09)", "rgba(41,125,179,0.09)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.linearHeader}
        >
          <Text style={styles.mainHeader}>Overall Workout Data</Text>
        </LinearGradient>

        {hasOverallData ? (
          <View style={styles.chartContainer}>
            {/* Sticky Y-axis for overall chart */}
            <StickyYAxis
              data={workoutAnalysisData.overall_data.map(
                (item) => item.total_volume
              )}
              height={250}
              chartConfig={chartConfig}
            />

            <ScrollView
              horizontal
              ref={overallChartScrollViewRef}
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollView}
            >
              <LineChart
                data={{
                  labels: workoutAnalysisData.overall_data.map((item) =>
                    new Date(item.week_start).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  ),
                  datasets: [
                    {
                      data: workoutAnalysisData.overall_data.map(
                        (item) => item.total_volume
                      ),
                      color: () => "#297DB3",
                    },
                  ],
                }}
                width={width * 1.5}
                height={250}
                chartConfig={chartConfig}
                withInnerLines={true}
                withHorizontalLines={true}
                withVerticalLines={true}
                withDots={true}
                bezier={false}
                withShadow={false}
                withVerticalLabels={true}
                withHorizontalLabels={false} // Hide default horizontal labels
                fromZero={true}
              />
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No workout data available yet.
            </Text>
            <Text style={styles.emptyStateSubText}>
              Complete your first workout to see your progress.
            </Text>
          </View>
        )}

        <LinearGradient
          colors={["rgba(231, 240, 248, 1)", "rgba(231, 240, 248, 1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.linearHeader}
        >
          <Text style={styles.mainHeader}>Aggregated Muscle Insights</Text>
        </LinearGradient>

        {hasAggregatedInsights ? (
          <View style={styles.chartSectionContainer}>
            {renderInsightTabs()}

            {selectedInsightType &&
            workoutAnalysisData.aggregated_muscle_insights[
              selectedInsightType
            ] ? (
              <View style={styles.barChartCard}>
                <Text style={styles.cardHeader}>
                  {selectedInsightType === "total_volume"
                    ? `${selectedInsightType.replace("_", " ")} `
                    : selectedInsightType.replace("_", " ")}
                </Text>

                <View style={styles.chartContainer}>
                  {/* Sticky Y-axis for bar chart */}
                  <StickyYAxis
                    data={workoutAnalysisData.aggregated_muscle_insights[
                      selectedInsightType
                    ].map((item) => item.value)}
                    height={220}
                    chartConfig={barChartConfig}
                  />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    ref={aggregatedChartScrollViewRef}
                    style={styles.chartScrollView}
                  >
                    <View style={styles.barChartWrapper}>
                      <BarChart
                        data={{
                          labels:
                            workoutAnalysisData.aggregated_muscle_insights[
                              selectedInsightType
                            ].map((item) => item.label),
                          datasets: [
                            {
                              data: workoutAnalysisData.aggregated_muscle_insights[
                                selectedInsightType
                              ].map((item) => item.value),
                            },
                          ],
                        }}
                        width={Math.max(
                          width * 1.5,
                          workoutAnalysisData.aggregated_muscle_insights[
                            selectedInsightType
                          ].length * 80
                        )}
                        height={220}
                        chartConfig={barChartConfig}
                        fromZero
                        showValuesOnTopOfBars
                        withInnerLines={true}
                        style={{ marginLeft: 15 }}
                        withHorizontalLabels={false} // Hide default horizontal labels
                      />
                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Please select an insight type.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No muscle insights available yet.
            </Text>
            <Text style={styles.emptyStateSubText}>
              Track more workouts to see muscle insights.
            </Text>
          </View>
        )}

        <LinearGradient
          colors={["rgba(41,125,179,0.09)", "rgba(41,125,179,0.09)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.linearHeader}
        >
          <Text style={styles.mainHeader}>Muscle Group Insights</Text>
        </LinearGradient>

        {validDropdownItems.length > 0 ? (
          <View style={styles.chartSectionContainer}>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={(value) => setSelectedMuscle(value)}
                value={selectedMuscle}
                items={validDropdownItems.map((item) => ({
                  label: item.name,
                  value: item.name,
                }))}
                placeholder={{
                  label: "Select a Muscle Group",
                  value: null,
                }}
                pickerProps={{
                  itemStyle: {
                    color: "#000000",
                  },
                }}
                style={pickerSelectStyles}
                Icon={() => (
                  <Ionicons name="chevron-down" size={20} color="#297DB3" />
                )}
                useNativeAndroidPickerStyle={false}
                fixAndroidTouchableBug={true}
              />
            </View>

            {selectedMuscle &&
            hasMuscleInsights &&
            workoutAnalysisData.muscle_insights[selectedMuscle] ? (
              <>
                {renderMuscleChartTypeTabs()}

                {/* Rest of your existing code remains the same */}
                {selectedMuscleChartType &&
                workoutAnalysisData.muscle_insights[selectedMuscle].weekly_data[
                  selectedMuscleChartType
                ] ? (
                  <View style={styles.card}>
                    <Text style={styles.cardHeader}>
                      {selectedMuscleChartType.replace("_", " ").toUpperCase()}{" "}
                      for {selectedMuscle}
                    </Text>

                    <View style={styles.chartContainer}>
                      {/* Sticky Y-axis for muscle chart */}
                      <StickyYAxis
                        data={workoutAnalysisData.muscle_insights[
                          selectedMuscle
                        ].weekly_data[selectedMuscleChartType].map(
                          (item) => item.value
                        )}
                        height={250}
                        chartConfig={chartConfig}
                      />

                      <ScrollView
                        horizontal
                        ref={muscleChartScrollViewRef}
                        showsHorizontalScrollIndicator={true}
                        style={styles.chartScrollView}
                      >
                        <LineChart
                          data={{
                            labels: workoutAnalysisData.muscle_insights[
                              selectedMuscle
                            ].weekly_data[selectedMuscleChartType].map((item) =>
                              new Date(item.week_start).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            ),
                            datasets: [
                              {
                                data: workoutAnalysisData.muscle_insights[
                                  selectedMuscle
                                ].weekly_data[selectedMuscleChartType].map(
                                  (item) => item.value
                                ),
                                color: () => "#297DB3",
                              },
                            ],
                          }}
                          width={width * 1.5}
                          height={250}
                          chartConfig={chartConfig}
                          withInnerLines={true}
                          withHorizontalLines={true}
                          withVerticalLines={true}
                          withDots={true}
                          bezier={false}
                          withShadow={false}
                          withVerticalLabels={true}
                          withHorizontalLabels={false}
                          fromZero={true}
                        />
                      </ScrollView>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      No chart data available.
                    </Text>
                    <Text style={styles.emptyStateSubText}>
                      Please select a different chart type.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  No data available for {selectedMuscle || "selected muscle"}.
                </Text>
                <Text style={styles.emptyStateSubText}>
                  Complete workouts targeting this muscle to see insights.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No muscle groups available yet.
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    marginTop: Platform.OS === "ios" ? 20 : 0,
  },
  scrollViewContent: {
    padding: 15,
    paddingBottom: 10,
  },
  insightsHeader: {
    fontSize: 14,
    fontWeight: "400",
    color: "#297DB3",
    marginBottom: 5,
  },
  insightsSubHeader: {
    fontSize: 16,
    color: "#297DB3",
    fontWeight: "bold",
    marginBottom: 15,
  },
  commentText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    lineHeight: 22,
  },
  mainHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#070707",
  },
  insightHeaderContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 5,
  },
  insightHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  linearHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 15,
    borderRadius: 5,
  },
  chartSectionContainer: {
    borderRadius: 12,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "center",
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: "#F0F0F0",
  },
  tabButtonActive: {
    backgroundColor: "#297DB3",
  },
  tabButtonText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 12,
    textTransform: "capitalize",
  },
  tabButtonTextActive: {
    color: "#FFF",
  },
  barChartCard: {
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
  },
  barChartWrapper: {
    paddingLeft: 10,
    paddingVertical: 20,
  },
  cardHeader: {
    fontSize: 16,
    color: "black",
    marginVertical: 15,
    fontWeight: "500",
    textAlign: "center",
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    marginVertical: 10,
  },
  emptyStateContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 20,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
    height: 200,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  // Updated styles for chart container and sticky Y-axis
  chartContainer: {
    flexDirection: "row",
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  chartScrollView: {
    flex: 1,
    marginLeft: 35, // Make space for the sticky Y-axis
  },
  stickyYAxis: {
    position: "absolute",
    left: 25,
    top: 0,
    bottom: 0,
    width: 35,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    justifyContent: "flex-start",
    paddingTop: 10,
  },
  yAxisLabel: {
    position: "absolute",
    left: 5,
    fontSize: 10,
    textAlign: "right",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#297DB3",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 8,
    color: "#000",
    paddingRight: 40, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 50,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 8,
    color: "#000",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: 50,
  },
  placeholder: {
    color: "#9EA0A4",
    fontSize: 16,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 3 : 3,
    right: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WorkoutAnalysis;
