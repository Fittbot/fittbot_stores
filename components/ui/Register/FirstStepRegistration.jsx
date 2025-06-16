import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Field, Formik } from "formik";
import * as Yup from "yup";
import { Feather } from "@expo/vector-icons";
import { Color } from "../../../GlobalStyles";
import MobileLogo from "./MobileLogo";
import ContinueButton from "./ContinueButton";
import CardTitle from "./CardTitle";
import { registerUserAPI } from "../../../services/clientApi";
import { showToast } from "../../../utils/Toaster";
import Toast from "react-native-toast-message";

// Validation Schema
const validationSchema = Yup.object().shape({
  full_name: Yup.string()
    .min(2, "Name is too short")
    .max(50, "Name is too long")
    .required("Full Name is required"),

  // age: Yup.number()
  //   .positive('Age must be a positive number')
  //   .integer('Age must be an integer')
  //   .min(18, 'You must be at least 18 years old')
  //   .max(120, 'Please enter a valid age')
  //   .required('Age is required'),

  contact: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits")
    .required("Mobile Number is required"),

  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

// Update your existing validation schema to add more robust password requirements
const passwordValidationSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

// Custom Input Component
const CustomInput = ({
  field: { name, onBlur, onChange, value, type },
  form: { errors, touched, handleBlur },
  ...props
}) => {
  return (
    <View style={styles.inputContainer}>
      <View
        style={[
          styles.inputWrapper,
          errors[name] && touched[name] && styles.inputError,
        ]}
      >
        <Feather
          name={getIconName(name)}
          size={20}
          color={errors[name] && touched[name] ? Color.rgError : Color.rgIcon}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          onChangeText={onChange(name)}
          onBlur={handleBlur(name)}
          value={value}
          type={type}
          placeholderTextColor={Color.rgDisable}
          {...props}
        />
        {errors[name] && touched[name] && (
          <Feather name="alert-circle" size={20} color="red" />
        )}
      </View>
      {errors[name] && touched[name] && (
        <Text style={styles.errorText}>{errors[name]}</Text>
      )}
    </View>
  );
};

// Custom Password Input Component
const PasswordInput = ({
  field: { name, onBlur, onChange, value },
  form: { errors, touched, handleBlur },
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <View style={styles.inputContainer}>
      <View
        style={[
          styles.inputWrapper,
          errors[name] && touched[name] && styles.inputError,
        ]}
      >
        <Feather
          name="lock"
          size={20}
          color={errors[name] && touched[name] ? Color.rgError : Color.rgIcon}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          onChangeText={onChange(name)}
          onBlur={handleBlur(name)}
          value={value}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor={Color.rgDisable}
          {...props}
        />

        {/* Password Visibility Toggle */}
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeIcon}
        >
          <Feather
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={20}
            color="#4A4A4A"
          />
        </TouchableOpacity>
      </View>

      {/* Password Strength Indicator */}
      <View style={styles.strengthIndicator}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              index < passwordStrength && {
                backgroundColor:
                  passwordStrength <= 2
                    ? "red"
                    : passwordStrength <= 4
                    ? "orange"
                    : "green",
              },
            ]}
          />
        ))}
      </View>

      {/* Error Message */}
      {errors[name] && touched[name] && (
        <Text style={styles.errorText}>{errors[name]}</Text>
      )}
    </View>
  );
};

// Icon selection helper
const getIconName = (fieldName) => {
  switch (fieldName) {
    case "full_name":
      return "user";
    case "age":
      return "calendar";
    case "contact":
      return "phone";
    case "email":
      return "mail";
    case "password":
      return "lock";
    case "confirmPassword":
      return "lock";
    default:
      return "check";
  }
};

const FirstStepRegistration = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setIsLoading(true);
      setApiError(null);

      let data = {
        full_name: values.full_name,
        contact: values.contact,
        email: values.email,
        password: values.password,
      };

      const response = await registerUserAPI(data);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Registration",
          desc: response?.message,
          visibilityTime: 5000,
        });

        setTimeout(() => {
          if (
            response.otp_verified === true &&
            response.registeration_completed === true
          ) {
            router.push({
              pathname: "/",
              // params: {
              //   userId: response.data?.userId,
              //   full_name: values.full_name,
              //   age: values.age,
              //   email: values.email,
              //   contact: values.contact,
              // },
            });
          } else if (
            response.otp_verified === true &&
            response.registeration_completed !== true
          ) {
            router.push({
              pathname: "/register/age-selector",
              params: {
                full_name: values.full_name,
                email: values.email,
                contact: values.contact,
              },
            });
          } else {
            router.push({
              pathname: "/register/second-step",
              params: {
                full_name: values.full_name,
                email: values.email,
                contact: values.contact,
              },
            });
          }
        }, 1000);
      } else {
        if (response?.errors) {
          Object.keys(response.errors).forEach((field) => {
            setFieldError(field, response.errors[field]);
          });
        }

        showToast({
          type: "error",
          title: "Registration",
          desc: response?.detail,
        });

        setApiError(
          response?.message || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MobileLogo />
      </View>

      <Formik
        initialValues={{
          full_name: "",
          contact: "",
          email: "",
          password: "",
          confirmPassword: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isValid, dirty, isSubmitting }) => (
          <View style={styles.formContainer}>
            <CardTitle title={"Personal Information"} />

            {/* {apiError && (
              <View style={styles.apiErrorContainer}>
                <Feather name="alert-circle" size={16} color={Color.rgError} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            )} */}

            <Field
              component={CustomInput}
              name="full_name"
              placeholder="Full Name"
              autoCapitalize="words"
            />

            {/* <Field
              component={CustomInput}
              name="age"
              placeholder="Age"
              keyboardType="numeric"
            /> */}

            <Field
              component={CustomInput}
              name="contact"
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Field
              component={CustomInput}
              name="email"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              component={PasswordInput}
              name="password"
              placeholder="Password"
            />
            <Field
              component={PasswordInput}
              name="confirmPassword"
              placeholder="Confirm Password"
            />

            <ContinueButton
              isValid={isValid && !isLoading}
              handleSubmit={handleSubmit}
              text={isLoading ? "Registering..." : "Continue"}
            />

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={Color.rgPrimary}
                style={styles.loader}
              />
            )}
          </View>
        )}
      </Formik>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.rgBgContainer,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
  },
  title: {
    color: Color.rgTextSecondary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: Color.rgDisable,
    fontSize: 16,
  },
  formContainer: {
    // backgroundColor: Color.rgBgForm,
    borderRadius: 15,
    // padding: 20,
    shadowColor: Color.rgShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "100%",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "red",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: "#FF5757",
    // padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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
  apiErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff000055" || "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  apiErrorText: {
    color: Color.rgError || "red",
    fontSize: 14,
    marginLeft: 8,
  },
  loader: {
    marginTop: 10,
  },
});

export default FirstStepRegistration;
