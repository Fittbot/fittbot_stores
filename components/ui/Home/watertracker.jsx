import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from "react-native";
import {
  clientWaterTrackerAPI,
  ClientWeightUpdateAPI,
} from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import FitnessLoader from "../FitnessLoader";
import GradientButton3 from "../GradientButton3";
import GradientOutlineButton2 from "../GradientOutlineButton2";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const MAX_WATER_GOAL_ML = 5000;
const GLASS_VOLUME = 200;

const WaterTracker = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const [fillAnimation] = useState(new Animated.Value(0));
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  const [targetWater, setTargetWater] = useState(null);
  const [remainingWater, setRemainingWater] = useState(null);
  const [newGoalML, setNewGoalML] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [inputError, setInputError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateWater = async (payload) => {
    try {
      const response = await ClientWeightUpdateAPI(payload);
      if (response?.status === 200) {
        loadData();
        // showToast({
        //   type: 'success',
        //   title: 'hello world',
        //   desc:
        //     response?.detail || response?.message,
        // });
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

  const handleAddWater = async (water, type) => {
    if (type === "remove" && currentWaterIntake - water < 0) {
      showToast({
        type: "error",
        title: "Invalid Amount",
        desc: "Cannot remove more water than consumed",
      });
      return;
    }

    if (type === "add" && currentWaterIntake + water > targetWater) {
      showToast({
        type: "error",
        title: "Invalid Amount",
        desc: "Cannot add more water than goal",
      });
      return;
    }

    let newValue = 0;

    // Calculate new water value based on action type
    if (type === "add") {
      newValue = ((currentWaterIntake + water) / 1000).toFixed(2);
    } else {
      newValue = ((currentWaterIntake - water) / 1000).toFixed(2);
    }

    setCurrentWaterIntake(newValue * 1000);

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: "water",
        actual_water: newValue,
      };

      await updateWater(payload);

      showToast({
        type: "success",
        title: type === "add" ? "Water Added" : "Water Removed",
        desc:
          type === "add"
            ? `Added ${water} ml to your intake`
            : `Removed ${water} ml from your intake`,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");

      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error Loading Page",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        client_id: clientId,
      };

      const response = await clientWaterTrackerAPI(payload);

      const { actual, target } = response.data.target_actual.water_intake;

      if (response?.status === 200) {
        setCurrentWaterIntake(actual * 1000);
        setTargetWater(target * 1000);

        // Ensure remaining water isn't negative
        const remaining = Math.max(0, (target - actual) * 1000);
        setRemainingWater(remaining.toFixed(2));
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentWaterIntake !== null && targetWater !== null) {
      const fillPercentage = Math.min(currentWaterIntake / targetWater, 1);

      Animated.timing(fillAnimation, {
        toValue: fillPercentage,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();

      // Update remaining water
      const remaining = Math.max(0, targetWater - currentWaterIntake);
      setRemainingWater(remaining.toFixed(2));
    }
  }, [currentWaterIntake, targetWater]);

  // if(loading){
  //   return <FitnessLoader />
  // }

  const updateWaterGoal = async () => {
    if (!newGoalML || isNaN(parseInt(newGoalML))) {
      setInputError("Please enter a valid number");
      return;
    }

    const value = parseInt(newGoalML);
    if (value > MAX_WATER_GOAL_ML) {
      alert(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
      return;
    }

    if (value <= 0) {
      alert(`Goal must be greater than 0`);
      return;
    }

    setSubmitting(true);

    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");
      if (!clientId) {
        alert("Error Setting Water Goal");
        return;
      }
      const floatValue = (newGoalML / 1000).toFixed(2);
      const type = "water";

      const payload = {
        client_id: clientId,
        gym_id: gymId,
        type: type,
        target_water: floatValue,
      };

      const response = await updateWater(payload);

      setTargetWater(newGoalML);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setSubmitting(false);
      setNewGoalML("");
      setInputError("");
      setSelectedPreset(null);
    }
  };

  const validateGoalInput = (text) => {
    setNewGoalML(text);

    if (!text) {
      setInputError("");
      return;
    }

    const value = parseInt(text);
    if (isNaN(value)) {
      setInputError("Please enter a valid number");
    } else if (value > MAX_WATER_GOAL_ML) {
      setInputError(`Maximum goal is ${MAX_WATER_GOAL_ML}ml`);
    } else if (value <= 0) {
      setInputError("Goal must be greater than 0");
    } else {
      setInputError("");
    }
  };

  const handlePresetSelect = (value) => {
    setSelectedPreset(value);
    validateGoalInput(value.toString());
  };

  const isGoalReached = currentWaterIntake >= targetWater;
  const isGoalInputValid =
    newGoalML &&
    !isNaN(parseInt(newGoalML)) &&
    parseInt(newGoalML) <= MAX_WATER_GOAL_ML &&
    parseInt(newGoalML) > 0;

  const presetValues = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={["rgba(0, 123, 255, 0)", "rgba(40, 167, 70, 0)"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.cardContainer}
          >
            <View
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.title}>Stay Hydrated!</Text>
            </View>

            <View style={styles.container2}>
              <LinearGradient
                colors={["#006FAD", "#129BC0", "#23C6D3"].reverse()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.outerCircle}
              >
                <LinearGradient
                  colors={["rgba(0, 123, 255, 0)", "rgba(40, 167, 70, 0)"]}
                  start={{ x: 1, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.innerCircle]}
                >
                  <View style={styles.centerSection}>
                    <View style={styles.waterBottleContainer}>
                      <View style={styles.bottleTop}>
                        <View style={styles.bottleCap} />
                        <View style={styles.bottleNeck} />
                      </View>

                      <View style={styles.waterBottle}>
                        <View style={[styles.bottleLine, { top: "15%" }]} />
                        <View style={[styles.bottleLine, { top: "30%" }]} />
                        <View style={[styles.bottleLine, { top: "45%" }]} />
                        <View style={[styles.bottleLine, { top: "60%" }]} />
                        <View style={[styles.bottleLine, { top: "75%" }]} />

                        <Animated.View
                          style={[
                            styles.waterFill,
                            {
                              height: fillAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                              }),
                            },
                          ]}
                        >
                          <View style={styles.waterFillTop}>
                            <View style={styles.wave} />
                            <View style={styles.wave} />
                            <View style={styles.wave} />
                          </View>
                          <View style={styles.waterFillBody} />
                        </Animated.View>
                      </View>
                    </View>

                    <Text style={styles.currentIntakeText}>
                      {currentWaterIntake} ml
                    </Text>
                  </View>
                </LinearGradient>
              </LinearGradient>
            </View>

            <View
              style={{
                width: "100%",
                // backgroundColor: 'pink',
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 20,
              }}
            >
              <GradientButton3
                title={"Daily Goal"}
                span={`${targetWater} ml`}
                mainContainerStyle={{ width: "45%" }}
                colors={["#23C6D3", "#129BC0", "#006FAD"]}
                edit
                onPress={() => setModalVisible(true)}
              />
              <GradientButton3
                title={"Remaining"}
                span={`${remainingWater} ml`}
                mainContainerStyle={{ width: "45%" }}
                colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
                textStyle={{
                  color: "#006FAD",
                }}
                spanStyle={{
                  color: "#006FAD",
                }}
                borderStyle={{
                  borderColor: "#006FAD",
                  borderWidth: 1,
                  borderRadius: 8,
                }}
              />
            </View>

            {/* </View> */}
          </LinearGradient>

          <View
            style={{
              width: "100%",
              paddingVertical: 10,
              textAlign: "left",
              backgroundColor: "rgba(40, 199, 210, 0.1)",
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 14, paddingLeft: 20 }}>
              Add Daily Water Intake
            </Text>
          </View>

          <View
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              width: "100%",
              // backgroundColor: 'red',
              paddingTop: 15,
              paddingHorizontal: 15,
            }}
          >
            {[50, 100, 200, 250]?.map((item, index) => {
              return (
                <View key={index}>
                  <GradientOutlineButton2
                    title={`${item} ml`}
                    onPress={() => handleAddWater(item, "add")}
                  />
                </View>
              );
            })}
          </View>

          <View
            style={{
              alignItems: "center",
              justifyContent: "space-between",

              flexDirection: "row",
              width: "100%",
              // backgroundColor: 'red',
              paddingTop: 15,
              paddingHorizontal: 15,
            }}
          >
            {[50, 100, 200, 250]?.map((item, index) => {
              return (
                <View key={index}>
                  <GradientOutlineButton2
                    title={`${Math.abs(item)} ml`}
                    onPress={() => handleAddWater(item, "remove")}
                    icon="remove-circle"
                    colors={["#eb3b3b", "#fa8787"]}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
            <Text style={{ color: "#979797", fontSize: 12 }}>
              The recommended daily water intake for adults typically falls
              between 2 to 3 liters, with men generally needing around 3.5
              liters and women needing 2.5 liters
            </Text>
          </View>
        </View>

        {/* Updated Modal Design */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setNewGoalML("");
            setInputError("");
            setSelectedPreset(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.glassIcon}>🥤</Text>
                  <Text style={styles.modalTitle}>Set Daily Water Goal</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setModalVisible(false);
                    setNewGoalML("");
                    setInputError("");
                    setSelectedPreset(null);
                  }}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Enter target amount in milliliters (ml)
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.modalInput,
                    inputError ? styles.inputError : null,
                  ]}
                  keyboardType="numeric"
                  placeholder=""
                  value={newGoalML}
                  onChangeText={(text) => {
                    validateGoalInput(text);
                    setSelectedPreset(null);
                  }}
                />
                <Text style={styles.inputUnit}>ml</Text>
              </View>

              <Text style={styles.modalLimit}>
                Maximum: {MAX_WATER_GOAL_ML}ml
              </Text>

              {inputError ? (
                <Text style={styles.errorText}>{inputError}</Text>
              ) : null}

              <View style={styles.presetSection}>
                <Text style={styles.presetLabel}>Quick Select:</Text>
                <View style={styles.presetGrid}>
                  {presetValues?.map((value) => (
                    <TouchableOpacity
                      key={`preset-${value}`}
                      style={[
                        styles.presetButton,
                        (selectedPreset === value ||
                          parseInt(newGoalML) === value) &&
                          styles.presetButtonActive,
                      ]}
                      onPress={() => handlePresetSelect(value)}
                    >
                      {selectedPreset === value ||
                      parseInt(newGoalML) === value ? (
                        <LinearGradient
                          colors={["#23C6D3", "#006FAD"]}
                          style={styles.presetButtonGradient}
                        >
                          <Text style={styles.presetButtonTextActive}>
                            {value} ml
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.presetButtonText}>{value} ml</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (!isGoalInputValid || submitting) &&
                    styles.modalSubmitButtonDisabled,
                ]}
                onPress={updateWaterGoal}
                disabled={!isGoalInputValid || submitting}
              >
                {isGoalInputValid && !submitting ? (
                  <LinearGradient
                    colors={["#23C6D3", "#006FAD"]}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.modalSubmitButtonText}>Set Goal</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.modalSubmitButtonTextDisabled}>
                    {submitting ? "Updating..." : "Set Goal"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    // paddingHorizontal: isSmallScreen ? 16 : 24,
    // paddingTop: 10,
  },

  //---------------------- new design start from here -------------------------------------------

  cardContainer: {
    // backgroundColor: '#F8FCFF',
    borderRadius: 20,
    padding: 10,
    // marginVertical: 10,
    width: width * 0.92,
    alignSelf: "center",
    alignItems: "center",
  },
  title: {
    width: "100%",
    fontSize: 16,
    // fontWeight: '700',
    color: "#0A0A0A",
    // marginBottom: 8,
    textAlign: "left",
  },
  chartStyle: {
    marginTop: 8,
  },
  centerTextContainer: {
    position: "absolute",
    top: 80,
    alignItems: "center",
  },
  consumedCalories: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  totalCalories: {
    fontSize: 14,
    color: "#777",
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  macroIconLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  macroIcon: {
    // width: 12,
    height: 21,
    marginRight: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  macroValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    color: "#0A0A0A",
  },

  //////////////

  container2: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  outerCircle: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: (width * 0.5) / 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  innerCircle: {
    backgroundColor: "#fff",
    width: "92%",
    height: "92%",
    borderRadius: (width * 0.5 * 0.92) / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  progressBackground: {
    width: "100%",
    height: 6,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    marginTop: 5,
    marginBottom: 5,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  // ------------- water bottle section -------------------

  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'green',
  },
  rightSection: {
    width: 40,
    alignItems: "center",
  },
  waterBottleContainer: {
    height: 85,
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: 10,
  },
  bottleTop: {
    alignItems: "center",
    height: 15,
    marginBottom: -1,
    zIndex: 1,
  },
  bottleCap: {
    width: 12,
    height: 6,
    backgroundColor: "#D0D0D0",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bottleNeck: {
    width: 20,
    height: 8,
    backgroundColor: "#D0D0D0",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  waterBottle: {
    height: 60,
    width: 44,
    borderRadius: 6,
    backgroundColor: "#F8F8F8",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  bottleLine: {
    position: "absolute",
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    left: 0,
    zIndex: 1,
  },
  waterFill: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    backgroundColor: "#23C6D3",
    // borderTopLeftRadius: 6,
    // borderTopRightRadius: 6,
    overflow: "hidden",
  },
  waterFillTop: {
    flexDirection: "row",
    height: 5,
    position: "absolute",
    top: -2,
    left: 0,
    right: 0,
  },
  wave: {
    height: 5,
    width: 12,
    backgroundColor: "#23C6D3",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  waterFillBody: {
    flex: 1,
    backgroundColor: "#23C6D3",
  },
  waterAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF5757",
    marginBottom: 2,
    textAlign: "center",
  },
  waterLabel: {
    fontSize: 14,
    width: "100%",
    color: "#FF5757",
    textAlign: "center",
    // color: "#666",
    fontWeight: "500",
  },
  currentIntakeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#006FAD",
    marginTop: 8,
  },

  //------ Updated modal styles ---------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  glassIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
  },
  inputUnit: {
    position: "absolute",
    right: 15,
    top: 12,
    color: "#999",
    fontSize: 16,
  },
  modalLimit: {
    fontSize: 10,
    color: "#006FAD",
    marginBottom: 10,
  },
  inputError: {
    borderColor: "#FF5757",
  },
  errorText: {
    color: "#FF5757",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  presetSection: {
    marginBottom: 24,
  },
  presetLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    fontWeight: "500",
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  presetButton: {
    width: "48%",
    height: 35,
    marginBottom: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  presetButtonActive: {
    backgroundColor: "transparent",
  },
  presetButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  presetButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  presetButtonTextActive: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  modalSubmitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  submitButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubmitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSubmitButtonTextDisabled: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
});

export default WaterTracker;
