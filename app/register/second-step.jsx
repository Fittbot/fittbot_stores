import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import OTPInput from "../../components/ui/OTPInput";
import { Color, linearGradientColors } from "../../GlobalStyles";
import ContinueButton from "../../components/ui/Register/ContinueButton";
import MobileLogo from "../../components/ui/Register/MobileLogo";
import CardTitle from "../../components/ui/Register/CardTitle";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { registerUserOTPVerification } from "../../services/clientApi";
import { showToast } from "../../utils/Toaster";
import { Image } from "expo-image";

const OTPVerification = React.memo(() => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [verificationState, setVerificationState] = useState({
    otp: "",
    isOTPValid: false,
    timer: 30,
    canResend: false,
    resendAttempts: 3,
  });

  const [contact, setContact] = useState(params.contact);
  const [isLoading, setIsLoading] = useState(false);

  const handleOTPComplete = useCallback((completedOTP) => {
    setVerificationState((prev) => ({
      ...prev,
      otp: completedOTP || "",
      isOTPValid: !!(completedOTP && completedOTP.length === 6),
    }));
  }, []);

  useEffect(() => {
    if (verificationState?.otp.length === 6) {
      Keyboard.dismiss();
      handleVerifyOTP();
    }
  }, [verificationState?.otp]);

  const handleVerifyOTP = useCallback(async () => {
    if (verificationState.isOTPValid) {
      try {
        setIsLoading(true);
        let data = {
          data: contact || params.contact,
          otp: verificationState.otp,
        };

        const response = await registerUserOTPVerification(data);
        // const response = {
        //   status: 200,
        //   message: 'Temporary messageOTP verified successfully',
        // }

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Registration",
            desc: response?.message,
            visibilityTime: 1500,
          });

          setTimeout(() => {
            router.push({
              pathname: "/register/age-selector",
              params: { ...params },
            });
          }, 2800);
          setTimeout(() => {
            setIsLoading(false);
          }, 2800);
        } else {
          showToast({
            type: "error",
            title: "Registration",
            desc: response?.detail,
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Registration",
          desc: response?.detail,
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [verificationState.isOTPValid, verificationState.otp, router]);

  const handleResendOTP = useCallback(() => {
    setVerificationState((prev) => {
      if (prev.resendAttempts > 0) {
        return {
          ...prev,
          resendAttempts: prev.resendAttempts - 1,
          timer: 30,
          canResend: false,
        };
      }
      return prev;
    });
  }, []);

  const otpInputComponent = useMemo(
    () => (
      <OTPInput onComplete={handleOTPComplete} onResendOTP={handleResendOTP} />
    ),
    [handleOTPComplete, handleResendOTP]
  );

  useEffect(() => {
    if (verificationState?.otp.length === 6) {
      Keyboard.dismiss();
    }
  }, [verificationState?.otp]);

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss || verificationState?.otp.length === 6}
    >
      <LinearGradient
        style={{ flex: 1, width: "100%", height: "100%" }}
        colors={["#0A0A0A", "#0A0A0A", "#0A0A0A"]}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.flex}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === "ios" ? 50 : 10}
          keyboardShouldPersistTaps="handled"
          enableAutomaticScroll={false}
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              {isLoading ? (
                <Image
                  source={require("../../assets/gif/welcome.gif")}
                  style={styles.topImage}
                  contentFit="contain"
                />
              ) : (
                <Image
                  source={require("../../assets/images/OTP 2.png")}
                  style={styles.topImage}
                  contentFit="contain"
                />
              )}
            </View>

            <View style={styles.formContainer}>
              <CardTitle title={"Verify OTP"} />

              <View style={styles.otpContainer}>{otpInputComponent}</View>

              <ContinueButton
                isValid={verificationState.isOTPValid || isLoading}
                handleSubmit={handleVerifyOTP}
                text={"Verify"}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
});

export default OTPVerification;

const styles = StyleSheet.create({
  flex: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
  },
  title: {
    color: Color.rgTextSecondary,
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 10,
  },
  subtitle: {
    color: Color.rgDisable,
    fontSize: 16,
    textAlign: "center",
  },
  topImage: {
    width: 250,
    height: 200,
  },
  formContainer: {
    borderRadius: 15,
    padding: 20,
    shadowColor: Color.rgShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "100%",
  },
  resendSection: {
    alignItems: "center",
  },
  timerText: {
    color: Color.rgDisable,
    fontSize: 14,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  activeResendText: {
    color: Color.rgPrimary,
  },
  inactiveResendText: {
    color: Color.rgDisable,
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
    color: "#fff",
  },
  loginLink: {
    color: Color.rgPrimary,
    fontWeight: "bold",
  },
});
