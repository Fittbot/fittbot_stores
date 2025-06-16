import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Color, linearGradientColors } from "../../GlobalStyles";
import { LinearGradient } from "expo-linear-gradient";
import MobileLogo from "../../components/ui/Register/MobileLogo";
import CardTitle from "../../components/ui/Register/CardTitle";
import ContinueButton from "../../components/ui/Register/ContinueButton";
import { calculateScientificBMI } from "../../components/ui/Register/calculateScientificBMI";
import { registerUserCompleteRegistration } from "../../services/clientApi";
import RNPickerSelect from "react-native-picker-select";
import { capitalizer } from "../../utils/basicUtilFunctions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import ToastNotification from "../../components/ui/SuccessPopup";
import { registerForPushNotificationsAsync } from "../../components/usePushNotifications";

const SixthStepRegistration = ({ route }) => {
  const params = useLocalSearchParams();

  const { fullName, gender, height, heightUnit, weight, age, unit, contact } =
    params;

  const [selectedLifestyle, setSelectedLifestyle] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [medicalIssues, setMedicalIssues] = useState("");
  const [isLifestyleDropdownOpen, setIsLifestyleDropdownOpen] = useState(false);
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);
  const [bmi, setBmi] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState({
    message: "",
    type: "",
  });
  const navigation = useNavigation();
  const router = useRouter();

  const bmiData = calculateScientificBMI({
    weight,
    height,
    heightUnit,
    age,
    gender,
  });

  // const lifestyleOptions = [
  //   'Sedentary',
  //   'Lightly Active',
  //   'Moderately Active',
  //   'Very Active',
  //   'Extremely Active',
  // ];

  const lifestyleOptions = [
    { label: "Sedentary", value: "sedentary" },
    { label: "Lightly Active", value: "lightly_active" },
    { label: "Moderately Active", value: "moderately_active" },
    { label: "Very Active", value: "very_active" },
    { label: "Super Active", value: "super_active" },
  ];

  // const goalOptions = [
  //   'Weight Loss',
  //   'Muscle Gain',
  //   'Maintain Weight',
  //   'Improve Fitness',
  //   'Better Nutrition',
  // ];

  const goalOptions = [
    { label: "Weight Loss", value: "weight_loss" },
    { label: "Weight Gain", value: "weight_gain" },
    { label: "Body Recomp", value: "maintain" },
  ];

  // LIFESTYLE_CHOICES = {
  //   sedentary: 'Sedentary',
  //   lightly_active: 'Lightly Active',
  //   moderately_active: 'Moderately Active',
  //   very_active: 'Very Active',
  //   super_active: 'Super Active',
  // };

  // GOALS_CHOICES = {
  //   weight_loss: 'Weight Loss',
  //   weight_gain: 'Weigth Gain',
  //   maintain: 'Body Recomposition',
  // };

  const handleContinue = async () => {
    // Validate mandatory selections
    if (!selectedLifestyle || !selectedGoal) {
      Alert.alert(
        "Incomplete Selection",
        "Please select both Lifestyle and Goal before continuing.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      let data = {
        // bmi: parseFloat(bmiData.interpretation.adjustedValue),
        bmi: parseFloat(bmiData.interpretation.rawValue),
        contact,
        dob: params.dateOfBirth,
        gender,
        height: parseFloat(params.height),
        weight: parseFloat(params.weight),
        lifestyle: selectedLifestyle,
        goals: selectedGoal,
        medicalIssues: medicalIssues,
      };

      const response = await registerUserCompleteRegistration(data);

      if (response?.status === 200) {
        await AsyncStorage.setItem(
          "client_id",
          JSON.stringify(response?.data?.client_id)
        );
        await AsyncStorage.setItem("role", "client");
        await SecureStore.setItemAsync(
          "access_token",
          response.data.access_token
        );
        ``;
        await SecureStore.setItemAsync(
          "refresh_token",
          response?.data?.refresh_token
        );
        await AsyncStorage.setItem("gender", response?.data?.gender.toString());
        await registerForPushNotificationsAsync(response.data.client_id);
        setSuccessMsg({
          message:
            "Registration Successful.  Let's start your fitness journey with Fittbot!",
          type: "success",
        });
        setShowSuccess(true);
        setTimeout(() => {
          router.push({
            pathname: "/unpaid/home",
          });
        }, 2000);
      } else {
        if (response?.errors) {
          Object.keys(response.errors).forEach((field) => {
            setFieldError(field, response.errors[field]);
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
    }

    // router.push({
    //   pathname: '/register/final-step',
    //   params: {
    //     ...params,
    //     bmi: bmiData,
    //     lifestyle: selectedLifestyle,
    //     goal: selectedGoal,
    //     medicalIssues,
    //   },
    // });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const toggleLifestyleDropdown = () => {
    dismissKeyboard();
    setIsLifestyleDropdownOpen(!isLifestyleDropdownOpen);
    setIsGoalDropdownOpen(false);
  };

  const toggleGoalDropdown = () => {
    dismissKeyboard();
    setIsGoalDropdownOpen(!isGoalDropdownOpen);
    setIsLifestyleDropdownOpen(false);
  };

  const selectLifestyle = (option) => {
    setSelectedLifestyle(option);
    setIsLifestyleDropdownOpen(false);
  };

  const selectGoal = (option) => {
    setSelectedGoal(option);
    setIsGoalDropdownOpen(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient
        style={{ flex: 1, width: "100%", height: "100%" }}
        colors={["#0A0A0A", "#0A0A0A", "#0A0A0A"]}
      >
        {/* <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        > */}
        <ToastNotification
          visible={showSuccess}
          message={successMsg?.message}
          onClose={() => setShowSuccess(false)}
          type={successMsg?.type}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <MobileLogo />

            <View style={styles.formContainer}>
              <View style={styles.bmiContainer}>
                <CardTitle title={`Lifestyle & Goals`} />
              </View>

              {/* Lifestyle Dropdown - MANDATORY */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  Your BMI :
                  <Text style={styles.bmiLabel}>
                    {" " + bmiData.interpretation.rawValue}
                  </Text>{" "}
                  <Text style={[styles.bmiLabel, { color: Color.rgPrimary }]}>
                    {" (" + bmiData.interpretation.healthCategory + ")"}
                  </Text>{" "}
                </Text>

                {/* <Text style={styles.sectionTitle}>
                    BMI classification :
                    <Text style={styles.bmiLabel}>
                      {' ' + bmiData.interpretation.healthCategory}
                    </Text>{' '}
                  </Text> */}

                {/* ///////////// */}

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
                  Select Your Lifestyle
                  <Text style={styles.mandatoryMark}>*</Text>
                </Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      !selectedLifestyle && styles.incompleteDropdown,
                    ]}
                    onPress={toggleLifestyleDropdown}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedLifestyle && styles.placeholderText,
                      ]}
                    >
                      {capitalizer(selectedLifestyle) || "Choose Lifestyle"}
                    </Text>
                    <Feather
                      name={
                        isLifestyleDropdownOpen ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      color={Color.rgDisable}
                    />
                  </TouchableOpacity>
                </View>

                <Modal
                  transparent={true}
                  visible={isLifestyleDropdownOpen}
                  animationType="fade"
                  onRequestClose={() => setIsLifestyleDropdownOpen(false)}
                >
                  <TouchableWithoutFeedback
                    onPress={() => setIsLifestyleDropdownOpen(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <ScrollView>
                          {lifestyleOptions.map((option, index) => (
                            <TouchableOpacity
                              key={option + index}
                              style={styles.optionItem}
                              onPress={() => selectLifestyle(option.value)}
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  selectedLifestyle === option &&
                                    styles.selectedOptionText,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              {/* Goals Dropdown - MANDATORY */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  Select Your Goal
                  <Text style={styles.mandatoryMark}>*</Text>
                </Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      !selectedGoal && styles.incompleteDropdown,
                    ]}
                    onPress={toggleGoalDropdown}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedGoal && styles.placeholderText,
                      ]}
                    >
                      {capitalizer(selectedGoal) || "Choose Goal"}
                    </Text>
                    <Feather
                      name={isGoalDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={Color.rgDisable}
                    />
                  </TouchableOpacity>
                </View>

                <Modal
                  transparent={true}
                  visible={isGoalDropdownOpen}
                  animationType="fade"
                  onRequestClose={() => setIsGoalDropdownOpen(false)}
                >
                  <TouchableWithoutFeedback
                    onPress={() => setIsGoalDropdownOpen(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <ScrollView>
                          {goalOptions.map((option, index) => (
                            <TouchableOpacity
                              key={option + index}
                              style={styles.optionItem}
                              onPress={() => selectGoal(option.value)}
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  selectedGoal === option &&
                                    styles.selectedOptionText,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              {/* Medical Issues */}
              {/* <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>
                    Medical Issues (Optional)
                  </Text>
                  <TextInput
                    style={styles.medicalIssuesInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Describe any medical conditions or concerns"
                    placeholderTextColor={Color.rgDisable}
                    value={medicalIssues}
                    onChangeText={setMedicalIssues}
                  />
                </View> */}

              {/* Continue Button */}
              <ContinueButton
                isValid={selectedLifestyle && selectedGoal}
                text={"Continue"}
                handleSubmit={handleContinue}
              />
            </View>

            {/* Go Back Option */}
            <View style={styles.backContainer}>
              <Text style={styles.backText}>Change your mind? </Text>
              <TouchableOpacity
                onPress={() => {
                  dismissKeyboard();
                  router.push({
                    pathname: "/register/fifth-step",
                    params: { ...params },
                  });
                }}
              >
                <Text style={styles.backLink}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* </KeyboardAvoidingView> */}
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

export default SixthStepRegistration;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Color.rgBgContainer,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  formContainer: {
    // backgroundColor: Color.rgBgForm,
    borderRadius: 15,
    // padding: 20,
    // shadowColor: Color.rgShadow,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "50%",
    // backgroundColor: Color.rgBgSecondary,
    backgroundColor: "rgba(255, 255, 255, 1)",
    // backgroundColor: 'blue',
    borderRadius: 10,
    overflow: "hidden",
  },
  bmiContainer: {
    alignItems: "center",
    // marginBottom: 10,
  },
  title: {
    // color: Color.rgTextSecondary,
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bmiValueContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  bmiValue: {
    color: Color.rgTextPrimary,
    fontSize: 36,
    fontWeight: "bold",
  },
  bmiLabel: {
    color: "#fff",
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
  },
  dropdownContainer: {
    backgroundColor: "#1C1C1C",
    borderRadius: 10,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  dropdownText: {
    color: Color.rgTextPrimary,
    fontSize: 16,
  },
  optionsContainer: {
    maxHeight: 200,
  },
  optionItem: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(136, 136, 136, 0.2)",
  },
  optionText: {
    color: Color.rgDisable,
    fontSize: 16,
  },
  selectedOptionText: {
    color: Color.rgTextPrimary,
    fontWeight: "bold",
  },
  medicalIssuesInput: {
    backgroundColor: "#1C1C1C",
    borderRadius: 10,
    color: Color.rgTextSecondary,
    padding: 15,
    textAlignVertical: "top",
    height: 80,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: Color.rgTextPrimary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: Color.rgTextSecondary,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  backContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  backText: {
    color: "#fff",
  },
  backLink: {
    color: Color.rgTextPrimary,
    fontWeight: "bold",
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    // borderBottomColor: Color.rgBgSecondary,
    borderBottomColor: "rgba(136, 136, 136, 0.5)",
  },
  mandatoryMark: {
    color: Color.rgDanger,
    fontSize: 16,
  },
  incompleteDropdown: {
    // borderWidth: 1,
    // borderColor: 'rgba(255,0,0,0.3)',
  },
  placeholderText: {
    color: Color.rgBgTertiary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
