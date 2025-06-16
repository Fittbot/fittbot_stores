import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import FirstStepRegistration from "../../components/ui/Register/FirstStepRegistration";
import { Color, linearGradientColors } from "../../GlobalStyles";

const { width, height } = Dimensions.get("window");

const Register = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        style={{ flex: 1, width: "100%", height: "100%" }}
        colors={["#0A0A0A", "#0A0A0A", "#0A0A0A"]}
      >
        {/* <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        > */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FirstStepRegistration />
          </ScrollView>
        {/* </KeyboardAvoidingView> */}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
});
