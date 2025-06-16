import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getUUIDAPI } from "../../services/clientApi";
import FitnessLoader from "../../components/ui/FitnessLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../utils/Toaster";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";

export default function ActivateAccount({ route }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [uuid, setUuid] = useState(null);
  const [plans, setPlans] = useState(null);
  const router = useRouter();

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const clientId = await AsyncStorage.getItem("client_id");
        if (!clientId) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Failed to load activation details",
          });
        }
        const response = await getUUIDAPI(clientId);
        if (response?.status === 200) {
          setUuid(response.data.uuid);
          setPlans(response?.data?.plans);
          setUserData({
            name: response?.data.name,
            contact: response?.data.contact,
            email: response?.data.email,
            gym_name: response?.data?.gym_name,
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
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

    fetchData();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6D28D9" />;
  }

  if (loading) {
    return <FitnessLoader />;
  }

  return (
    <View style={styles.container}>
      {/* <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.header}>
          <Text style={styles.logoText}>
            <Text style={styles.logoFirstPart}>Fitt</Text>
            <Text style={styles.logoSecondPart}>bot</Text>
          </Text>
          <Text style={styles.headerTitle}>Activate Your Account</Text>
        </LinearGradient> */}
      <NewOwnerHeader
        text={"Manage Membership"}
        onBackButtonPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.qrContainer}>
          {/* <Text style={styles.qrTitle}>Your Activation QR Code</Text> */}

          <View style={styles.qrWrapper}>
            {uuid ? (
              <QRCode
                value={uuid}
                size={200}
                color="#000"
                backgroundColor="#fff"
                logo={require("../../assets/images/new_logo.png")}
                logoSize={50}
                logoBackgroundColor="white"
              />
            ) : (
              <ActivityIndicator size="large" color="#6D28D9" />
            )}
          </View>

          <View style={styles.instructionCard}>
            <MaterialCommunityIcons
              name="information"
              size={24}
              color="#6D28D9"
            />
            <Text style={styles.instructionText}>
              Please ask the Gym Executives to scan this QR code using the
              FittBot Business app to activate and link your account with the
              Gym.
            </Text>
          </View>
        </View>
        {userData?.gym_name && (
          <View>
            <Text style={{ color: "green", textAlign: "center" }}>
              {plans?.expiry == 0
                ? "Your Gym Membership Expired.Please Renew."
                : "You Have an Active Gym Membership"}
            </Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={20} color="#6D28D9" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{userData?.name}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="call" size={20} color="#6D28D9" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{userData?.contact}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={20} color="#6D28D9" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{userData?.email}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="barbell" size={20} color="#6D28D9" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Gym Name</Text>
                <Text style={styles.detailValue}>
                  {userData?.gym_name || "Not Joined"}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {userData?.gym_name ? (
          <View style={styles.planContainer}>
            <Text style={styles.sectionTitle}>Selected Plan</Text>

            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.planName}>{plans?.plan_name}</Text>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.planDetailRow}>
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={20}
                    color="#6D28D9"
                  />
                  <Text style={styles.planDetailText}>
                    Duration: {plans?.duration} months
                  </Text>
                </View>

                <View style={styles.planDetailRow}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={20}
                    color="#6D28D9"
                  />
                  <Text style={styles.planDetailText}>
                    Amount: {plans?.amount}
                  </Text>
                </View>

                <View style={styles.planDetailRow}>
                  <MaterialCommunityIcons
                    name="calendar-today"
                    size={20}
                    color="#6D28D9"
                  />
                  <Text style={styles.planDetailText}>
                    {plans?.expiry == 0
                      ? "Expired"
                      : `Expiry: ${plans?.expiry} day(s)`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          ""
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6D28D9",
    fontFamily: "Poppins_400Regular",
  },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    marginBottom: 5,
    marginTop: 10,
  },
  qrContainer: {
    alignItems: "center",
    padding: 20,
    marginTop: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 15,
  },
  qrWrapper: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 240,
    width: 240,
  },
  instructionCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "flex-start",
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  instructionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    lineHeight: 20,
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 15,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins_400Regular",
  },
  detailValue: {
    fontSize: 15,
    color: "#1F2937",
    fontFamily: "Poppins_600SemiBold",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  planContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 3,
  },
  planHeader: {
    backgroundColor: "#6D28D9",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  planName: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 10,
  },
  planDetails: {
    padding: 15,
  },
  planDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  planDetailText: {
    fontSize: 14,
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
    marginLeft: 10,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
    backgroundColor: "#000",
    paddingHorizontal: 6,
    marginTop: 10,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#FFFFFF",
  },
});
