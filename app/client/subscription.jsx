import React, { useState, useRef, useCallback, memo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList as RNFlatList,
  Animated,
  Modal,
  ScrollView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import PaymentMethodModal from "../../components/ui/Payment/paymentselectionmodal";
import Purchases from "react-native-purchases";
import { FlatList } from "react-native";
const { width, height } = Dimensions.get("window");

const CARD_WIDTH = width * 0.75;
const SPACING = 12;
const VISIBLE_PEEK = 35;
const OFFSET_FOR_PEEK = VISIBLE_PEEK + 10;
const currentPlanData = {
  name: "Gold Plan",
  expiryDate: "15 May 2025",
  isActive: true,
};

const planFeatures = [
  {
    id: 1,
    name: "Personalized Interface",
    icon: "person-outline",
    description: "Customized dashboard based on your preferences",
  },
  {
    id: 2,
    name: "Workout Log & Insights",
    icon: "fitness-center",
    description: "Track your workouts and get detailed analytics",
  },
  {
    id: 3,
    name: "Diet Log & Insights",
    icon: "restaurant",
    description: "Monitor your nutrition with personalized recommendations",
  },
  {
    id: 4,
    name: "Community Feed",
    icon: "people",
    description: "Connect with like-minded fitness enthusiasts",
  },
  {
    id: 5,
    name: "Live Gym Stats",
    icon: "insert-chart",
    description: "Real-time statistics about your gym performance",
  },
];

const subscriptionPlansTemplate = [
  {
    id: 1,
    name: "Smart Plan",
    duration: "1 Month",
    mrp: 298,
    discountedPrice: 149,
    savings: 149,
    discountPercentage: 50,
    color: ["#689ff1", "#689ff1"],
    icon: "lightbulb-outline",
    popular: false,
    packageIdentifier: "$rc_monthly",
  },
  {
    id: 2,
    name: "Gold Plan",
    duration: "3 Months",
    mrp: 894,
    discountedPrice: 449,
    savings: 445,
    discountPercentage: 50,
    color: ["#d8a416", "#d8a416"],
    icon: "star",
    popular: false,
    packageIdentifier: null,
  },
  {
    id: 3,
    name: "Platinum Plan",
    duration: "6 Months",
    mrp: 1788,
    discountedPrice: 799,
    savings: 989,
    discountPercentage: 55,
    color: ["#a0a0b5", "#a0a0b5"],
    icon: "card-membership",
    popular: true,
    packageIdentifier: null,
  },
  {
    id: 4,
    name: "Diamond Plan",
    duration: "1 Year",
    mrp: 3576,
    discountedPrice: 1399,
    savings: 2177,
    discountPercentage: 60,
    color: ["#76aac3", "#76aac3"],
    icon: "diamond",
    popular: false,
    packageIdentifier: null,
  },
  {
    id: 5,
    name: "Pro Plan",
    duration: "2 Years",
    mrp: 7152,
    discountedPrice: 2499,
    savings: 4653,
    discountPercentage: 65,
    color: ["#8b8cc5", "#8b8cc5"],
    icon: "verified",
    popular: false,
    packageIdentifier: null,
  },
  {
    id: 6,
    name: "Ultimate Plan",
    duration: "3 Years",
    mrp: 10728,
    discountedPrice: 3199,
    savings: 7529,
    discountPercentage: 70,
    color: ["#8058aa", "#8058aa"],
    icon: "emoji-events",
    popular: false,
    packageIdentifier: null,
  },
];

const CurrentPlanSection = memo(() => {
  return (
    <Animatable.View
      animation="fadeIn"
      duration={800}
      style={styles.currentPlanSection}
    >
      <LinearGradient
        colors={["#d8a416", "#d8a416"]}
        style={styles.currentPlanCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.currentPlanHeader}>
          <View style={styles.currentPlanTitle}>
            <MaterialIcons name="star" size={18} color="#FFF" />
            <Text style={styles.currentPlanName}>{currentPlanData.name}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: currentPlanData.isActive
                    ? "#6BAF75"
                    : "#E57373",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {currentPlanData.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          <View style={styles.expiryInfo}>
            <MaterialIcons name="calendar-today" size={14} color="#FFF" />
            <Text style={styles.expiryText}>
              Expires on {currentPlanData.expiryDate}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.unsubscribeButton}>
            <Text style={styles.unsubscribeText}>Unsubscribe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.renewButton}>
            <Text style={styles.renewText}>Renew</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
});

const FeatureItem = ({ feature, isAvailable }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <MaterialIcons
        name={feature.icon}
        size={22}
        color={isAvailable ? "#6BAF75" : "#CCC"}
      />
    </View>
    <View style={styles.featureTextContainer}>
      <Text
        style={[styles.featureName, !isAvailable && styles.featureDisabled]}
      >
        {feature.name}
      </Text>
      <Text
        style={[
          styles.featureDescription,
          !isAvailable && styles.featureDisabled,
        ]}
      >
        {feature.description}
      </Text>
    </View>
    <MaterialIcons
      name={isAvailable ? "check-circle" : "cancel"}
      size={22}
      color={isAvailable ? "#6BAF75" : "#DDD"}
    />
  </View>
);

const SubscriptionPage = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] =
    useState(false);
  const [planDetailsModalVisible, setPlanDetailsModalVisible] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState(
    subscriptionPlansTemplate
  );
  const [selectedPlan, setSelectedPlan] = useState(
    subscriptionPlansTemplate[2]
  );
  const flatListRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPlan, setModalPlan] = useState(null);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [packages, setPackages] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const initialIndex = 2;
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (flatListRef.current && isInitialRender) {
      setTimeout(() => {
        const position = initialIndex * (CARD_WIDTH + SPACING);
        scrollX.setValue(position);
        flatListRef.current.scrollToOffset({
          offset: position,
          animated: false,
        });
        setIsInitialRender(false);
      }, 100);
    }
  }, [isInitialRender, scrollX]);

  useEffect(() => {
    // Initialize RevenueCat first
    const initPurchases = async () => {
      try {
        await Purchases.configure({
          apiKey:
            Platform.OS === "ios"
              ? "your_ios_api_key"
              : "goog_aQceSdrhHksDcFHLMbfKZhSscgH",
        });

        Purchases.setDebugLogsEnabled(true);
        await fetchOfferings();
      } catch (error) {
        console.error("Failed to initialize RevenueCat:", error);
        setLoading(false);
      }
    };

    initPurchases();
  }, []);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();

      if (offerings.current && offerings.current.availablePackages.length > 0) {
        setPackages(offerings.current.availablePackages);

        const updatedPlans = subscriptionPlansTemplate.map((plan) => {
          const matchingPackage = offerings.current.availablePackages.find(
            (pkg) => pkg.identifier === plan.packageIdentifier
          );

          if (matchingPackage) {
            return {
              ...plan,
              package: matchingPackage,
              price: matchingPackage.product.price,
              priceString: matchingPackage.product.priceString,
              currencyCode: matchingPackage.product.currencyCode,
              isAvailable: true,
            };
          }

          return {
            ...plan,
            isAvailable: false,
            price: null,
            priceString: "Coming Soon",
          };
        });

        setSubscriptionPlans(updatedPlans);
      } else {
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan) => {
    if (!plan.package || !plan.isAvailable) {
      Alert.alert(
        "Unavailable",
        "This subscription plan is not available yet."
      );
      return;
    }

    try {
      setPurchasing(true);

      const { customerInfo } = await Purchases.purchasePackage(plan.package);

      if (customerInfo.entitlements.active.premium_access) {
        Alert.alert(
          "Success!",
          `You have successfully subscribed to ${plan.name}!`,
          [
            {
              text: "OK",
              onPress: () => {
                console.log("User has premium access");
              },
            },
          ]
        );
      }
    } catch (error) {
      if (!error.userCancelled) {
        console.error("Purchase error:", error);
        Alert.alert(
          "Purchase Failed",
          "There was an error processing your purchase. Please try again."
        );
      }
    } finally {
      setPurchasing(false);
      setPlanDetailsModalVisible(false);
    }
  };

  const renderPlanItem = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1.5) * (CARD_WIDTH + SPACING),
        index * (CARD_WIDTH + SPACING),
        (index + 1.5) * (CARD_WIDTH + SPACING),
      ];

      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [30, 0, 30],
        extrapolate: "clamp",
      });

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1, 0.9],
        extrapolate: "clamp",
      });

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.7, 1, 0.7],
        extrapolate: "clamp",
      });

      const handleSelect = () => {
        setModalPlan(item);
        setPlanDetailsModalVisible(true);
      };

      const isSelected = selectedPlan.id === item.id;

      return (
        <Animated.View
          style={[
            styles.planItem,
            {
              transform: [{ translateY }, { scale }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSelect}
            style={styles.planCardTouchable}
          >
            <LinearGradient
              colors={item.color}
              style={[styles.planCard, isSelected && styles.selectedPlanCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {item.popular && (
                <Animatable.View
                  animation="pulse"
                  iterationCount="infinite"
                  style={styles.popularBadge}
                >
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </Animatable.View>
              )}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {item.discountPercentage}% OFF
                </Text>
              </View>

              <View style={styles.planHeader}>
                <MaterialIcons name={item.icon} size={32} color="#FFF" />
                <Text style={styles.planName}>{item.name}</Text>
                <Text style={styles.planDuration}>{item.duration}</Text>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.mrpPrice}>₹{item.mrp}</Text>
                <Text style={styles.discountedPrice}>
                  ₹{item.discountedPrice}
                </Text>
                <Text style={styles.savingsText}>
                  You Save: ₹{item.savings}
                </Text>
              </View>

              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [selectedPlan.id, scrollX]
  );

  const handlePlanSelect = useCallback((plan) => {
    const index = subscriptionPlans.findIndex((p) => p.id === plan.id);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
    setSelectedPlan(plan);
  }, []);

  const handleSubscribeNow = () => {
    if (modalPlan) {
      handlePurchase(modalPlan);
    }
  };

  const PlanDetailsModal = () => {
    if (!modalPlan) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={planDetailsModalVisible}
        onRequestClose={() => setPlanDetailsModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setPlanDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={modalPlan.color}
                    style={styles.modalHeaderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modalHeaderContent}>
                      {/* <MaterialIcons name={modalPlan.icon} size={24} color="#FFF" /> */}
                      <Text style={styles.modalPlanName}>{modalPlan.name}</Text>
                      <Text style={styles.modalPlanDuration}>
                        {modalPlan.duration}
                      </Text>
                    </View>
                  </LinearGradient>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setPlanDetailsModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalPriceSection}>
                  <Text style={styles.modalMrpPrice}>₹{modalPlan.mrp}</Text>
                  <Text style={styles.modalDiscountedPrice}>
                    ₹{modalPlan.discountedPrice}
                  </Text>
                  <View style={styles.modalDiscountBadge}>
                    <Text style={styles.modalDiscountText}>
                      {modalPlan.discountPercentage}% OFF
                    </Text>
                  </View>
                  <Text style={styles.modalSavingsText}>
                    You Save: ₹{modalPlan.savings}
                  </Text>
                </View>

                <View style={styles.modalFeaturesList}>
                  <Text style={styles.modalFeaturesTitle}>
                    Features Included
                  </Text>
                  <ScrollView style={styles.modalFeaturesScroll}>
                    {planFeatures.map((feature) => (
                      <FeatureItem
                        key={feature.id}
                        feature={feature}
                        isAvailable={true}
                      />
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={styles.modalSubscribeButton}
                  onPress={handleSubscribeNow}
                >
                  <Text style={styles.modalSubscribeText}>SUBSCRIBE NOW</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="history" size={18} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ paddingTop: 7 }}>
        <CurrentPlanSection />

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        <View style={styles.carouselContainer}>
          <AnimatedFlatList
            ref={flatListRef}
            data={subscriptionPlans}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.plansList]}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + SPACING,
              offset: (CARD_WIDTH + SPACING) * index,
              index,
            })}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            renderItem={renderPlanItem}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING)
              );
              if (index >= 0 && index < subscriptionPlans.length) {
                setSelectedPlan(subscriptionPlans[index]);
              }
            }}
          />
        </View>

        <View style={styles.indicatorsContainer}>
          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.indicator,
                selectedPlan.id === plan.id && styles.indicatorActive,
              ]}
              onPress={() => handlePlanSelect(plan)}
            />
          ))}
        </View>

        <View style={styles.supportSection}>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportText}>
              Having trouble with your subscription or have questions? Our
              support team is available 24/7 to assist you.
            </Text>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => Linking.openURL("mailto:support@fittbot.com")}
            >
              <MaterialIcons name="email" size={18} color="#FFF" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://fittbot.com/terms-conditions/")
                }
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Terms & Conditions</Text>
              </TouchableOpacity>

              <View style={styles.linkDivider} />

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://fittbot.com/privacy-policy/")
                }
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>

              <View style={styles.linkDivider} />

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://fittbot.com/cancellation-policy/")
                }
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Cancellation Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PlanDetailsModal />

        {/* <PaymentMethodModal
          visible={paymentMethodModalVisible}
          onClose={() => setPaymentMethodModalVisible(false)}
          planData={modalPlan}
        /> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  headerButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  currentPlanSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  currentPlanCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  currentPlanHeader: {
    marginBottom: 15,
  },
  currentPlanTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  currentPlanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 8,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryText: {
    fontSize: 12,
    color: "#FFF",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  unsubscribeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  unsubscribeText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  renewButton: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  renewText: {
    color: "#E8CA75",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  carouselContainer: {
    height: 300,
  },

  plansList: {
    paddingVertical: 10,
    paddingLeft: OFFSET_FOR_PEEK,
    paddingRight: OFFSET_FOR_PEEK,
  },
  planItem: {
    width: CARD_WIDTH,
    marginRight: SPACING,
    borderRadius: 16,
    overflow: "hidden",
  },
  planCardTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  planCard: {
    padding: 15,
    height: 290,
    borderRadius: 16,
    position: "relative",
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 10,
  },
  popularBadge: {
    position: "absolute",
    top: 10,
    left: 0,
    backgroundColor: "#E57373",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  popularText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 10,
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 10,
  },
  planHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 5,
  },
  planDuration: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  priceSection: {
    alignItems: "center",
    marginBottom: 15,
  },
  mrpPrice: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 2,
  },
  savingsText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  viewDetailsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DDD",
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: "#7986CB",
    width: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  featuresList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  featureDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  featureDisabled: {
    color: "#999",
  },
  viewAllFeaturesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  viewAllFeaturesText: {
    fontSize: 14,
    color: "#7986CB",
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
    paddingBottom: 20,
  },
  modalHeader: {
    position: "relative",
    height: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeaderGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderContent: {
    alignItems: "center",
  },
  modalPlanName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 8,
  },
  modalPlanDuration: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPriceSection: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    position: "relative",
  },
  modalMrpPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  modalDiscountedPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  modalDiscountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F0F8F1",
    borderRadius: 5,
    marginTop: 10,
  },
  modalDiscountText: {
    color: "#6BAF75",
    fontWeight: "bold",
    fontSize: 12,
  },
  modalSavingsText: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
  modalFeaturesList: {
    flex: 1,
    padding: 20,
  },
  modalFeaturesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  modalFeaturesScroll: {
    flex: 1,
  },
  modalSubscribeButton: {
    backgroundColor: "#7986CB",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSubscribeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  supportSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  supportCard: {
    backgroundColor: "#FFF",
    borderRadius: 7,
    padding: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 15,
  },
  supportButton: {
    backgroundColor: "#7986CB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  supportButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 12,
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkButton: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  linkText: {
    fontSize: 10,
    color: "#7986CB",
  },
  linkDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#DDD",
  },
});
export default SubscriptionPage;
