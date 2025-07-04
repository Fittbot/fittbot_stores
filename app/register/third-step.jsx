import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
// import Svg, { Path, Circle } from 'react-native-Svg';
// import MaleChar from '../../assets/images/Layer 41 1';
// import FemaleChar from '../../assets/svg/femaleChar';
import { Color, linearGradientColors } from "../../GlobalStyles";
import { LinearGradient } from "expo-linear-gradient";
import MobileLogo from "../../components/ui/Register/MobileLogo";
import ContinueButton from "../../components/ui/Register/ContinueButton";
import CardTitle from "../../components/ui/Register/CardTitle";

const GenderIcon = ({ type, selected, onPress }) => {
  const iconColor = selected ? Color.rgPrimary : Color.rgDisable;
  const backgroundColor = selected
    ? "rgba(255,255,255,0.8)"
    : "rgba(255,255,255,0.1)";
  // 8178428798
  return (
    <TouchableOpacity
      style={[styles.genderIconContainer, { backgroundColor }]}
      onPress={onPress}
    >
      {type === "male" ? (
        <Image
          source={require("../../assets/images/Layer 41 1.png")}
          style={styles.images}
        />
      ) : (
        <Image
          source={require("../../assets/images/FEMALE_V001.png")}
          style={styles.images}
        />
      )}
      <Text
        style={[
          styles.genderText,
          { color: selected ? Color.rgPrimary : "#fff" },
        ]}
      >
        {type === "male" ? "Male" : "Female"}
      </Text>
    </TouchableOpacity>
  );
};

const ThirdStepRegistration = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedGender, setSelectedGender] = useState(null);

  const { full_name } = params;

  useEffect(() => {
    if (params.gender) {
      setSelectedGender(params.gender);
    }
  }, []);

  const handleGenderSelection = (gender) => {
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (selectedGender) {
      router.push({
        pathname: "/register/fourth-step",
        params: {
          ...params,
          gender: selectedGender,
          dateOfBirth: params?.dateOfBirth,
        },
      });
    }
  };

  return (
    <LinearGradient
      style={{ flex: 1, width: "100%", height: "100%" }}
      colors={["#0A0A0A", "#0A0A0A", "#0A0A0A"]}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MobileLogo />
        </View>

        <View style={styles.formContainer}>
          <CardTitle title={`Hi ${full_name || "User"}, select your gender`} />

          <View style={styles.genderSelectionContainer}>
            <GenderIcon
              type="male"
              selected={selectedGender === "Male"}
              onPress={() => handleGenderSelection("Male")}
            />
            <GenderIcon
              type="female"
              selected={selectedGender === "Female"}
              onPress={() => handleGenderSelection("Female")}
            />
          </View>
        </View>

        <ContinueButton
          isValid={selectedGender}
          handleSubmit={handleContinue}
          text={"Continue"}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Change your mind? </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/register/age-selector",
                params: { ...params },
              })
            }
          >
            <Text style={styles.loginLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.rgBgContainer,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
  },
  formContainer: {
    borderRadius: 15,
    width: "100%",
    marginBottom: 30,
  },
  images: {
    width: 100,
    height: 140,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: Color.rgDisable,
    fontSize: 16,
    textAlign: "center",
  },
  genderSelectionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  genderIconContainer: {
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
  },
  genderText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: Color.rgPrimary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: Color.rgDisable,
  },
  nextButtonText: {
    color: Color.rgTextSecondary,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: Color.rgDisable,
  },
  loginLink: {
    color: Color.rgPrimary,
    fontWeight: "bold",
  },
});

export default ThirdStepRegistration;
