import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getSmartWatchInterestAPI,
  showSmartWatchInterestAPI,
} from "../../../services/clientApi";
import { useFocusEffect } from "@react-navigation/native";

const ProductBanner = () => {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const taglines = [
    "Smarter tracking, sharper results.",
    "Train hard, Fittbot’s got the numbers!",
    "Push harder. Fittbot measures every win",
    "New to fitness? Your wrist just got smarter!",
  ];

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
  }, [translateY]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % taglines.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <>
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          justifyContent: "flex-start",
          width: "100%",
        }}
        onPress={() => {
          router.push("/client/home");
        }}
      >
        <Ionicons
          name="arrow-back-outline"
          color="#263148"
          size={18}
        ></Ionicons>

        <Text style={styles.brandName}>Shop</Text>
      </TouchableOpacity>

      <View style={styles.bannerContainer}>
        <View style={styles.glowContainer}>
          <View style={styles.innerShadow}>
            {/* <Image
            source={require('../../../assets/images/marketplace/FRAME.png')}
            contentFit="contain"
            style={{ height: 1100, width: 1100 }}
          /> */}
          </View>

          <View style={styles.watchImageContainer}>
            <View style={styles.watchImageOuter}>
              <View style={styles.watchImageInner}>
                <Animated.Image
                  style={[
                    styles.watchImage,
                    {
                      transform: [
                        { translateY: translateY },
                        { translateX: -20 },
                      ],
                    },
                  ]}
                  source={require("../../../assets/images/marketplace/watchy.png")}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.watchName}>Fittbot Smartwatch</Text>
        <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
          {taglines[index]}
        </Animated.Text>
      </View>
    </>
  );
};

const NotificationButton = ({ onPress, interest, loading }) => {
  return (
    <View style={styles.shadowWrapper}>
      {loading ? (
        <Text style={styles.interestText}>Loading...</Text>
      ) : (
        <>
          {!interest ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notifyButton}
            >
              <TouchableOpacity style={styles.notifyButton2} onPress={onPress}>
                <Text style={styles.notifyText}>I'm Interested</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <Text style={styles.interestText}>
              Thank you for showing your interest!
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const ProductCard = ({ title, description, imagePath }) => {
  return (
    <LinearGradient
      colors={["#4D7287", "#322A4F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: 8 }}
    >
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          <Image source={imagePath} style={styles.productImage} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.productCardTitle}>{title}</Text>
          <Text style={styles.productCardDescription} numberOfLines={2}>
            {description}
          </Text>
          <TouchableOpacity style={styles.comingSoonButton}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const marketplace = () => {
  const [interest, setInterest] = useState(false);
  const [loading, setLoading] = useState(null);
  const showInterest = async () => {
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        client_id,
        interest: true,
      };
      const response = await showSmartWatchInterestAPI(payload);
      if (response?.status === 200) {
        setInterest(true);
        getInterest();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
    }
  };

  const getInterest = async () => {
    setLoading(true);
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getSmartWatchInterestAPI(client_id);
      if (response?.status === 200) {
        setInterest(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.details || "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
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
      getInterest();
    }, [])
  );

  return (
    <ScrollView>
      <LinearGradient colors={["#FFFFFF", "#FFF"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <ProductBanner />

            <NotificationButton
              onPress={showInterest}
              interest={interest}
              loading={loading}
            />

            <View style={styles.cardsContainer}>
              <ProductCard
                title="Supplements"
                description="Premium Quality Supplements to fuel your workouts."
                imagePath={require("../../../assets/images/marketplace/supplements.png")}
              />
              <ProductCard
                title="Workout Apparel"
                description="Comfortable and stylish apparel for maximum performance."
                imagePath={require("../../../assets/images/marketplace/apparels.png")}
              />
              <ProductCard
                title="Gym Equipment"
                description="Professional grade equipment for home and commercial use."
                imagePath={require("../../../assets/images/marketplace/equipments.png")}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ScrollView>
  );
};

export default marketplace;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: "100%",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  simpleButton: {
    backgroundColor: "#2A2A30",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  comingSoonText: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
  },
  cardsContainer: {
    marginTop: 20,
  },
  simpleCard: {
    backgroundColor: "#2A2A30",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  backToHomeButton: {
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 50,
  },
  backToHomeText: {
    color: "#00CCFF",
    fontSize: 16,
  },
  container: {
    flex: 1,
    paddingBottom: 20,
    paddingTop: 30,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  time: {
    color: "white",
    fontWeight: "bold",
  },
  statusIcons: {
    flexDirection: "row",
    gap: 5,
  },
  statusIcon: {
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  bannerContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  glowContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'pink',
  },
  brandName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#263148",
    fontFamily: "rajdhani",
  },
  innerShadow: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    zIndex: 2,
    borderRadius: "100%",
    position: "absolute",
    top: -385,
    left: -385,
  },
  innerShadow2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0)",
    zIndex: 1,
    borderColor: "rgba(0, 0, 0, 0.108)",
  },
  watchImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 0,
    width: "100%",
    zIndex: 10,
  },
  watchImageOuter: {
    width: 250,
    height: 250,
    borderRadius: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 60,
  },
  watchImageInner: {
    width: 207,
    height: 207,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: "100%",
    backgroundColor: "#1E171E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#919BA9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 50,
  },
  watchImage: {
    width: 200,
    height: 200,
  },
  watchImage2: {
    width: 200,
    height: 200,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "#263148",
    textAlign: "center",
    lineHeight: 20,
  },
  shadowWrapper: {
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#00c2ff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        // elevation: 10, // subtle and more centered shadow
        // shadowColor: '#00c2ff',
        // shadowOffset: { width: 0, height: 0 },
        // shadowOpacity: 0.3,
        // shadowRadius: 10,
      },
    }),
  },
  notifyButton: {
    borderRadius: 8,
    marginBottom: 30,

    // shadowColor: 'rgba(0, 195, 255, 0.749)',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.3,
    // shadowRadius: 20,
    // elevation: 20, // subtle and more centered shadow
  },
  notifyButton2: {
    // backgroundColor: 'rgba(14, 84, 107, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 80,

    borderColor: "rgba(160, 160, 160, 0.311)",
    // marginBottom: 30,
  },
  notifyText: {
    color: "#FFFFFF",
    fontSize: 12,
    // fontWeight: 'bold',
  },
  interestText: {
    marginBottom: 10,
    color: "#0154A0",
  },
  cardsContainer: {
    width: "100%",
    gap: 20,
  },
  productCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 3,
  },
  productCardTitle: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "500",
  },
  productCardDescription: {
    fontSize: 12,
    color: "#818181",
    marginBottom: 6,
    lineHeight: 18,
    flex: 1,
  },
  comingSoonButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  comingSoonText: {
    color: "#030A15",
    fontSize: 10,
  },
  watchName: {
    marginBottom: 20,
    fontWeight: 500,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: 100,
    height: 100,
  },
});
