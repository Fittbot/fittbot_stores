import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";
import { ScrollView } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  caloriesCalculateAPI,
  ClientWeightUpdateAPI,
} from "../../../../services/clientApi";
import { showToast } from "../../../../utils/Toaster";

const { width, height } = Dimensions.get("window");

const CalorieCard = ({
  title,
  subtitle,
  buttonText,
  imageSource,
  gradientColors,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.mainContent}>
          <View style={styles.leftContent}>
            <View style={styles.subtitleContainer}>
              <Text
                style={styles.subtitle}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            </View>

            <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.rightContent}>
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CalorieCalculatorModal = ({
  visible,
  onClose,
  calculateCalories,
  saveTrackingData,
  calculate,
  getHomeData,
}) => {
  const [isCalculated, setIsCalculated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targets, setTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [boxValues, setBoxValues] = useState({
    actual_weight: calculate?.actual_weight,
    height: calculate?.height,
    age: calculate?.age,
    lifestyle: calculate?.lifestyle,
    goals: calculate?.goals,
    start_weight: "",
    target_weight: "",
  });

  const handleCalculateCalories = async () => {
    setIsLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        gym_id: gymId,
        client_id: clientId,
        height: boxValues.height,
        weight: boxValues.actual_weight,
        age: boxValues.age,
        goals: boxValues.goals,
        lifestyle: boxValues.lifestyle,
      };

      const response = await caloriesCalculateAPI(payload);

      if (response?.status === 200) {
        setTargets({
          calories: response?.data?.calories || "",
          protein: response?.data?.protein || "",
          carbs: response?.data?.carbs || "",
          fat: response?.data?.fat || "",
        });
        setIsCalculated(true);
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

  const handleSaveTargets = async () => {
    try {
      showToast({
        type: "success",
        title: "Success",
        desc: "Caloris targets saved Successfully",
      });
      setIsCalculated(false);
      getHomeData();
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const renderCalculateCaloriesStep = () => (
    <View style={styles.stepContainer}>
      {isCalculated ? (
        <View style={styles.calculatedResultsContainer}>
          <MaskedView
            maskElement={<Text style={styles.title}>Calculated Results</Text>}
          >
            <LinearGradient
              colors={["#5B2B9B", "#FF3C7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 30, justifyContent: "center" }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>
                Calculated Results
              </Text>
            </LinearGradient>
          </MaskedView>
          <View style={styles.resultsGrid}>
            <View style={styles.resultItem}>
              <Image
                source={require("../../../../assets/images/calories.png")}
                style={styles.calorieImages}
              />
              <Text style={styles.resultText}>{targets.calories} kcal</Text>
              <Text style={styles.resultLabel}>Calories</Text>
            </View>

            <View style={styles.resultItem}>
              <Image
                source={require("../../../../assets/images/PROTEIN.png")}
                style={styles.proteinImages}
              />
              <Text style={styles.resultText}>{targets.protein} g</Text>
              <Text style={styles.resultLabel}>Protein</Text>
            </View>

            <View style={styles.resultItem}>
              <Image
                source={require("../../../../assets/images/CARBS.png")}
                style={styles.macroImages}
              />
              <Text style={styles.resultText}>{targets.carbs} g</Text>
              <Text style={styles.resultLabel}>Carbs</Text>
            </View>

            <View style={styles.resultItem}>
              <Image
                source={require("../../../../assets/images/FAT.png")}
                style={styles.fatImages}
              />
              <Text style={styles.resultText}>{targets.fat} g</Text>
              <Text style={styles.resultLabel}>Fat</Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => {
                setIsCalculated(false);
              }}
            >
              <Text style={styles.adjustButtonText}>Adjust</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSaveTargets}
            >
              <LinearGradient
                colors={["#673ab7", "#e91e63"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>Save & Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.stepTitle}>
              <MaskedView
                maskElement={
                  <Text
                    style={[
                      styles.stepTitleText,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    Calculate Your Target Calories
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#5B2B9B", "#FF3C7B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 20, justifyContent: "center" }}
                >
                  <Text style={[styles.stepTitleText, { opacity: 0 }]}>
                    Calculate Your Target Calories
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            <View style={styles.compactForm}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Weight (kg)*</Text>
                  <LinearGradient
                    colors={["#9c27b01A", "#e91e631A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radius}
                  >
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(boxValues.actual_weight)}
                      onChangeText={(text) =>
                        setBoxValues({ ...boxValues, actual_weight: text })
                      }
                      placeholder="Enter weight"
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      returnKeyType="next"
                    />
                  </LinearGradient>
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Height (cm)*</Text>
                  <LinearGradient
                    colors={["#9c27b01A", "#e91e631A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radius}
                  >
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(boxValues.height)}
                      onChangeText={(text) =>
                        setBoxValues({ ...boxValues, height: text })
                      }
                      placeholder="Enter height"
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      returnKeyType="next"
                    />
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Age*</Text>
                  <LinearGradient
                    colors={["#9c27b01A", "#e91e631A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radius}
                  >
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(boxValues.age)}
                      onChangeText={(text) =>
                        setBoxValues({ ...boxValues, age: text })
                      }
                      placeholder="Enter age"
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      returnKeyType="next"
                    />
                  </LinearGradient>
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Lifestyle*</Text>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <LinearGradient
                      colors={["#9c27b01A", "#e91e631A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.radius}
                    >
                      <View style={styles.pickerContainer}>
                        <RNPickerSelect
                          value={boxValues.lifestyle}
                          onValueChange={(value) =>
                            setBoxValues({ ...boxValues, lifestyle: value })
                          }
                          placeholder={{
                            label: "Select lifestyle",
                            value: null,
                          }}
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          items={[
                            { label: "Sedentary", value: "sedentary" },
                            {
                              label: "Lightly Active",
                              value: "lightly_active",
                            },
                            {
                              label: "Moderately Active",
                              value: "moderately_active",
                            },
                            { label: "Very Active", value: "very_active" },
                            { label: "Super Active", value: "super_active" },
                          ]}
                          Icon={() => (
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#666666"
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableWithoutFeedback>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Goal*</Text>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <LinearGradient
                    colors={["#9c27b01A", "#e91e631A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radius}
                  >
                    <View style={styles.pickerContainer}>
                      <RNPickerSelect
                        value={boxValues.goals}
                        onValueChange={(value) =>
                          setBoxValues({ ...boxValues, goals: value })
                        }
                        placeholder={{ label: "Select your goal", value: null }}
                        pickerProps={{
                          itemStyle: {
                            color: "#000000",
                          },
                        }}
                        style={pickerSelectStyles}
                        items={[
                          { label: "Weight Loss", value: "weight_loss" },
                          { label: "Weight Gain", value: "weight_gain" },
                          { label: "Maintain", value: "maintain" },
                        ]}
                        Icon={() => (
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#666666"
                          />
                        )}
                        useNativeAndroidPickerStyle={false}
                        fixAndroidTouchableBug={true}
                      />
                    </View>
                  </LinearGradient>
                </TouchableWithoutFeedback>
              </View>
            </View>

            <TouchableOpacity
              disabled={
                boxValues.actual_weight === "" ||
                boxValues.height === "" ||
                boxValues.age === "" ||
                boxValues.goals === "" ||
                boxValues.lifestyle === ""
              }
              onPress={handleCalculateCalories}
            >
              <LinearGradient
                colors={
                  boxValues.actual_weight === "" ||
                  boxValues.height === "" ||
                  boxValues.age === "" ||
                  boxValues.goals === "" ||
                  boxValues.lifestyle === ""
                    ? ["#d3d3d3", "#a9a9a9"]
                    : ["#9c27b0", "#e91e63"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.calculateButton,
                  (boxValues.actual_weight === "" ||
                    boxValues.height === "" ||
                    boxValues.age === "" ||
                    boxValues.goals === "" ||
                    boxValues.lifestyle === "") &&
                    styles.buttonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.calculateButtonText}>Calculate</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setIsCalculated(false);
        onClose();
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          setIsCalculated(false);
          onClose();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => {
                  setIsCalculated(false);
                  onClose();
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              {renderCalculateCaloriesStep()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const ManualCalorieModal = ({
  visible,
  onClose,
  saveTrackingData,
  target,
  getHomeData,
  calculate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [manualTargets, setManualTargets] = useState({
    calories: target?.calories || "",
    protein: target?.protein || "",
    carbs: target?.carbs || "",
    fat: target?.fat || "",
  });

  const handleSaveTargets = async () => {
    setIsLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!clientId || !gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        client_id: clientId,
        gym_id: gym_id,
        type: "calories",
        calories: manualTargets?.calories ? manualTargets?.calories : null,
        protein: manualTargets?.protein ? manualTargets?.protein : null,
        carbs: manualTargets?.carbs ? manualTargets?.carbs : null,
        fat: manualTargets?.fat ? manualTargets?.fat : null,
      };

      const response = await ClientWeightUpdateAPI(payload);

      if (response?.status === 200) {
        await getHomeData();
        showToast({
          type: "success",
          title: "Success",
          desc: "Target Macros Set Successfully",
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
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAnyFieldEmpty = () => {
    return (
      manualTargets.calories === "" ||
      manualTargets.protein === "" ||
      manualTargets.carbs === "" ||
      manualTargets.fat === ""
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>

              <View style={styles.stepContainer}>
                <MaskedView
                  maskElement={
                    <Text style={styles.stepTitleText}>
                      Set Your Daily Calorie & Macro Targets
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["#5B2B9B", "#FF3C7B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 30, justifyContent: "center" }}
                  >
                    <Text style={[styles.stepTitleText, { opacity: 0 }]}>
                      Set Your Daily Calorie & Macro Targets
                    </Text>
                  </LinearGradient>
                </MaskedView>

                <View style={styles.compactForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Target Calories (kcal)*
                    </Text>
                    <LinearGradient
                      colors={["#9c27b01A", "#e91e631A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.radius}
                    >
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={manualTargets.calories?.toString()}
                        onChangeText={(text) =>
                          setManualTargets({ ...manualTargets, calories: text })
                        }
                        placeholder="Enter target calories"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      />
                    </LinearGradient>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Target Protein (g)*</Text>
                      <LinearGradient
                        colors={["#9c27b01A", "#e91e631A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.radius}
                      >
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={manualTargets.protein?.toString()}
                          onChangeText={(text) =>
                            setManualTargets({
                              ...manualTargets,
                              protein: text,
                            })
                          }
                          placeholder="Enter protein"
                          placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        />
                      </LinearGradient>
                    </View>

                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Target Carbs (g)*</Text>
                      <LinearGradient
                        colors={["#9c27b01A", "#e91e631A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.radius}
                      >
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={manualTargets.carbs?.toString()}
                          onChangeText={(text) =>
                            setManualTargets({ ...manualTargets, carbs: text })
                          }
                          placeholder="Enter carbs"
                          placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        />
                      </LinearGradient>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Target Fat (g)*</Text>
                    <LinearGradient
                      colors={["#9c27b01A", "#e91e631A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.radius}
                    >
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={manualTargets.fat?.toString()}
                        onChangeText={(text) =>
                          setManualTargets({ ...manualTargets, fat: text })
                        }
                        placeholder="Enter fat"
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      />
                    </LinearGradient>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isAnyFieldEmpty()}
                  onPress={handleSaveTargets}
                >
                  <LinearGradient
                    colors={
                      isAnyFieldEmpty()
                        ? ["#d3d3d3", "#a9a9a9"]
                        : ["#673ab7", "#e91e63"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.calculateButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.calculateButtonText}>
                        Set Targets
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const CalorieCardsComponent = ({ calculate, target, getHomeData, gender }) => {
  const [calculatorModalVisible, setCalculatorModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const calculateCalories = async () => {};

  const saveTrackingData = async (type, data) => {
    console.log(`Saving ${type} data:`, data);
  };

  return (
    <View style={styles.container}>
      <CalorieCard
        title="Calculate Your Daily Calories Needs"
        subtitle="Smart calorie goals from your body stats"
        buttonText="Calculate"
        imageSource={
          gender.toLowerCase() === "male"
            ? require("../../../../assets/images/automatic-calculator.png")
            : require("../../../../assets/images/automatic-calculator-female.png")
        }
        gradientColors={["#9c27b0", "#e91e63"]}
        onPress={() => setCalculatorModalVisible(true)}
      />

      <CalorieCard
        title="Set Your Daily Calories Needs"
        subtitle="Know your targets already? Set it yourself"
        buttonText="Set"
        imageSource={
          gender.toLowerCase() === "male"
            ? require("../../../../assets/images/manual-calculator.png")
            : require("../../../../assets/images/manual-calculator-female.png")
        }
        gradientColors={["#673ab7", "#e91e63"]}
        onPress={() => setManualModalVisible(true)}
      />

      <CalorieCalculatorModal
        visible={calculatorModalVisible}
        onClose={() => {
          setCalculatorModalVisible(false);
        }}
        calculateCalories={calculateCalories}
        saveTrackingData={saveTrackingData}
        calculate={calculate}
        getHomeData={getHomeData}
      />

      <ManualCalorieModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        saveTrackingData={saveTrackingData}
        target={target}
        getHomeData={getHomeData}
        calculate={calculate}
      />
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#333",
    paddingRight: 35, // Increased for icon space
    backgroundColor: "transparent",
    minHeight: 38,
    color: "#000000",
  },
  inputAndroid: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#333",
    paddingRight: 35, // Increased for icon space
    backgroundColor: "transparent",
    minHeight: 38,
  },
  placeholder: {
    color: "rgba(0, 0, 0, 0.3)",
    fontSize: 12,
  },
  iconContainer: {
    top: 3,
    right: 10,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "49%",
    height: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
    paddingBottom: 0,
    flexDirection: "column",
    position: "relative",
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  leftContent: {
    width: "55%",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  subtitleContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  rightContent: {
    width: "45%",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "relative",
    height: "100%",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#AAAAAA",
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 10,
    width: "90%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 5,
  },
  image: {
    width: "130%",
    height: 110,
    position: "absolute",
    bottom: -10,
    right: -18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: 100,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  // CalorieCalculatorModal styles
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  closeModalButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
    padding: 5,
  },
  stepContainer: {
    marginTop: 5,
  },
  stepTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: "600",
    // color: "#000000",
  },
  compactForm: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  halfWidth: {
    width: "48%",
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 7,
  },
  input: {
    // backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#9c27b01A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  radius: {
    borderRadius: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#9c27b01A",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    overflow: "hidden",
  },

  calculatedResultsContainer: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  adjustButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  adjustButtonText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 14,
  },

  continueButton: {
    flex: 1.5,
  },
  continueButtonGradient: {
    backgroundColor: "#FF5757",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  calculateButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  calculateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  macroImages: {
    width: 25,
    height: 20,
  },
  fatImages: {
    width: 18,
    height: 22,
  },
  proteinImages: {
    width: 20,
    height: 20,
  },
  calorieImages: {
    width: 16,
    height: 22,
  },
});

export default CalorieCardsComponent;
