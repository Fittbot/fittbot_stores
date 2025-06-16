import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import PaymentMethodSelector from "../../components/ui/Payment/paymentmethod";
import PaymentMethodModal from "../../components/ui/Payment/paymentselectionmodal";
import { showToast } from "../../utils/Toaster";

const PayNow = () => {
  const router = useRouter();
  const {
    name,
    price,
    duration,
    offerprice,
    xpEligiblePlanId,
    xpOfferPrice,
    paymentMethod: initialPaymentMethod,
  } = useLocalSearchParams();

  // Payment states
  const [regularPrice, setRegularPrice] = useState(parseFloat(price) || 0);
  const [discountedPrice, setDiscountedPrice] = useState(
    parseFloat(offerprice) || 0
  );
  const [xpPrice, setXpPrice] = useState(
    parseFloat(offerprice) - parseFloat(xpOfferPrice) || 0
  );
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(
    parseFloat(offerprice) || parseFloat(price) || 0
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialPaymentMethod || null
  );
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] =
    useState(false);

  // XP related states
  const [totalXp, setTotalXp] = useState(2500);
  const [isXpEligible, setIsXpEligible] = useState(false);
  const [showXpInfo, setShowXpInfo] = useState(false);

  // Determine if user is eligible for XP discount plan
  useEffect(() => {
    // Check if user has sufficient XP for the XP-eligible plan (e.g., 2500 XP)
    const xpThreshold = 2500; // This would come from your backend
    const isEligible = totalXp >= xpThreshold && xpEligiblePlanId;
    setIsXpEligible(isEligible);

    // Update selected plan price based on eligibility
    if (isEligible) {
      setSelectedPlanPrice(xpPrice);
    } else {
      setSelectedPlanPrice(discountedPrice);
    }
  }, [totalXp, xpEligiblePlanId, discountedPrice, xpPrice]);

  useEffect(() => {
    if (initialPaymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    }
  }, [initialPaymentMethod]);

  const openPaymentMethodModal = () => {
    setPaymentMethodModalVisible(true);
  };

  const handlePayNow = () => {
    if (!paymentMethod) {
      showToast({
        type: "error",
        title: "Payment Method Required",
        desc: "Please select a payment method to continue.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Payment Successful",
      desc: "Your subscription has been activated.",
    });
    router.push("/client/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF5757" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Summary</Text>
        </View>

        {/* Plan Details Card */}
        <View style={styles.card}>
          <View style={styles.planDetails}>
            <Text style={styles.planName}>{name || "Premium Plan"}</Text>
            <Text style={styles.planDuration}>
              {duration || "Monthly"} Subscription
            </Text>

            {/* If eligible for XP discount, show that a special offer is applied */}
            {isXpEligible && (
              <View style={styles.offerTag}>
                <Text style={styles.offerTagText}>
                  XP Special Offer Unlocked
                </Text>
              </View>
            )}

            <View style={styles.priceLine}>
              <Text style={styles.priceLabel}>Regular Price:</Text>
              <Text style={styles.priceValueStrikethrough}>
                ₹{regularPrice.toFixed(2)}
              </Text>
            </View>

            <View style={styles.priceLine}>
              <Text style={styles.priceLabel}>Discounted Price:</Text>
              <Text
                style={
                  isXpEligible
                    ? styles.priceValueStrikethrough
                    : styles.priceValue
                }
              >
                ₹{discountedPrice.toFixed(2)}
              </Text>
            </View>

            {isXpEligible && (
              <View style={styles.priceLine}>
                <Text style={styles.priceLabel}>XP Special Offer:</Text>
                <Text style={[styles.priceValue, styles.xpSpecialPrice]}>
                  ₹{xpPrice.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceLine}>
              <Text style={styles.totalLabel}>Amount to Pay:</Text>
              <Text style={styles.totalValue}>
                ₹{selectedPlanPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method Section */}
        {paymentMethod ? (
          <PaymentMethodSelector
            initialMethod={paymentMethod}
            showChangeOption={true}
            onSelectMethod={openPaymentMethodModal}
          />
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity
              style={styles.selectPaymentButton}
              onPress={openPaymentMethodModal}
            >
              <Text style={styles.selectPaymentText}>
                Select Payment Method
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* XP Information Card */}
        <View style={styles.card}>
          <View style={styles.xpTitleRow}>
            <Text style={styles.sectionTitle}>Your XP Benefits</Text>
            <TouchableOpacity onPress={() => setShowXpInfo(!showXpInfo)}>
              <View style={styles.infoButton}>
                <Text style={styles.infoButtonText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.xpDetails}>
            <View style={styles.xpCompactDisplay}>
              <View style={styles.xpColumn}>
                <Text style={styles.xpValueLarge}>{totalXp}</Text>
                <Text style={styles.xpLabel}>Your XP</Text>
              </View>

              {isXpEligible && (
                <>
                  <View style={styles.xpDivider} />
                  <View style={styles.xpColumn}>
                    <Text style={[styles.xpValueLarge, styles.xpSpecialPrice]}>
                      ₹{(discountedPrice - xpPrice).toFixed(2)}
                    </Text>
                    <Text style={styles.xpLabel}>XP Savings</Text>
                  </View>
                </>
              )}
            </View>

            {isXpEligible ? (
              <View style={styles.xpInfoBanner}>
                <Text style={styles.xpInfoText}>
                  Congratulations! Your XP has unlocked a special discounted
                  plan with additional ₹{xpOfferPrice} off. This offer is
                  applied automatically.
                </Text>
              </View>
            ) : (
              <View style={styles.xpInfoBanner}>
                <Text style={styles.xpInfoText}>
                  You need at least 2500 XP to unlock the special discounted
                  plan with ₹25 off. Keep earning!
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, !paymentMethod && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={!paymentMethod}
        >
          <Text style={styles.payButtonText}>
            Pay ₹{selectedPlanPrice.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={paymentMethodModalVisible}
        onClose={() => setPaymentMethodModalVisible(false)}
        planData={{
          name: name || "Premium Plan",
          discountedPrice: selectedPlanPrice,
          duration: duration || "Monthly",
          mrp: parseFloat(price) || 0,
        }}
      />

      {/* XP Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showXpInfo}
        onRequestClose={() => setShowXpInfo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowXpInfo(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>XP Benefit Information</Text>
            <Text style={styles.modalText}>
              • Accumulate XP by completing activities in the app{"\n"}• Once
              you reach 2500 XP, you unlock a special discounted plan{"\n"}• The
              discount is pre-configured and cannot be combined with other
              offers{"\n"}• XP benefits are subject to our terms and conditions
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowXpInfo(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default PayNow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 10,
    paddingVertical: 10,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    paddingVertical: 10,
  },
  planDetails: {
    // marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  planDuration: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  offerTag: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  offerTagText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  priceLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: "#555",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  priceValueStrikethrough: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 7,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5757",
  },
  xpSpecialPrice: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  selectPaymentButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FF5757",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectPaymentText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: "#FF5757",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: "#FFAAAA",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  // XP related styles
  xpTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },
  xpDetails: {
    marginBottom: 5,
  },
  xpCompactDisplay: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 5,
  },
  xpColumn: {
    alignItems: "center",
    flex: 1,
  },
  xpValueLarge: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  xpLabel: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  xpDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#EEEEEE",
  },
  xpInfoBanner: {
    backgroundColor: "#F9F9F9",
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  xpInfoText: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 15,
    textAlign: "left",
    alignSelf: "stretch",
  },
  modalCloseButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  modalCloseButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
