import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key to check in AsyncStorage
const WELCOME_SCREEN_VIEWED_KEY = "welcome_screen_viewed";

const WelcomeScreen = ({ setShowWelcome }) => {
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_SCREEN_VIEWED_KEY, "true");
      setShowWelcome(false);
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mockupContainer}>
          <Image
            source={require("../assets/images/welcome_image_2.png")}
            style={styles.mockupImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>WELCOME</Text>
          <Text style={styles.toText}>to</Text>
          <Text style={styles.appNameText}>
            <Text style={styles.fittText}>Fitt</Text>
            <Text style={styles.botText}>bot</Text>
          </Text>
          <View style={styles.underline} />
          <Text style={styles.taglineText}>
            Your Personal Fitness Companion
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>LET'S GET STARTED</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.madeInText}>MADE IN INDIA</Text>
          <Text style={styles.flagText}>🇮🇳</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 40,
    // paddingHorizontal: 20,
    paddingTop: 100,
    // backgroundColor: '#ffa3a3',
  },
  mockupContainer: {
    width: "100%",
    height: Dimensions.get("window").height * 0.45,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    // backgroundColor: '#a3ffa6',
  },
  mockupImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    marginVertical: 0,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "400",
    color: "#333",
    letterSpacing: 1,
  },
  toText: {
    fontSize: 18,
    color: "#333",
    marginVertical: 5,
  },
  appNameText: {
    fontSize: 50,
    // fontWeight: 'bold',
    fontWeight: "600",
    // marginBottom: 10,
  },
  fittText: {
    color: "#FF6464",
  },
  botText: {
    color: "#333",
  },
  underline: {
    width: 80,
    height: 2,
    backgroundColor: "#FF6464",
    marginBottom: 10,
  },
  taglineText: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#FF6464",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    // width: '90%',
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    // marginTop: 20,
  },
  madeInText: {
    fontSize: 14,
    color: "#333",
    marginRight: 5,
  },
  flagText: {
    fontSize: 18,
  },
});

export default WelcomeScreen;
