import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "../../utils/Toaster";

const { width } = Dimensions.get("window");

const ReferralScreen = () => {
  const [expanded, setExpanded] = useState(null);
  const referralCode = "XP1000";

  const faqs = [
    {
      question: "How does it work?",
      answer:
        "Invite your friends using your unique referral code. When they download and subscribe to fittbot within 7 days of referral, you earn 1000 XP points.",
    },
    {
      question: "How to refer friends?",
      answer:
        "You can invite friends by sharing your referral code directly through messaging apps.",
    },
    {
      question: "When will I receive my XP points?",
      answer:
        "You will receive your 1000 XP points within 24 hours after your friend subscribes to fittbot.",
    },
    {
      question: "How can I use my XP points?",
      answer:
        "You can redeem your XP points for your fittbot subscription and services (1000Xp = ₹10).",
    },
  ];

  const toggleFAQ = (index) => {
    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  const copyToClipboard = () => {
    showToast({
      type: "info",
      title: "Copied!",
      desc: "Referral code copied to clipboard",
    });
  };

  const handleInvite = async () => {
    try {
      const message = `Join me on this amazing app! Use my referral code ${referralCode} to get started and we'll both earn 1000 XP points! Download now: https://myapp.com/download`;

      const url = `sms:?body=${encodeURIComponent(message)}`;

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast({
          type: "error",
          title: "SMS not supported",
          desc: "Your device does not support sending SMS. Please use the Share option instead.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Could not open messaging app. Please try the Share option.",
      });
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Join me on this amazing app! Use my referral code ${referralCode} to get started and we'll both earn 1000 XP points! Download now: https://myapp.com/download`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: error || "Something went wrong. Please try again later",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <View style={styles.headerSub}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer Friends</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.referralCard}>
          <View style={styles.referralContent}>
            <View style={styles.textContainer}>
              <Text style={styles.earnText}>
                Earn upto <Text style={styles.highlightText}>1000 Xp</Text>{" "}
                points per friend you invite to Fittbot
              </Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <TouchableOpacity
                  onPress={copyToClipboard}
                  style={styles.copyButton}
                >
                  <MaterialIcons name="content-copy" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.imageContainer}>
              {/* Replace with your actual image component */}

              <View style={styles.illustrationPlaceholder}>
                <FontAwesome5 name="bullhorn" size={24} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.howItWorksContainer}>
          <View style={styles.howItWorksHeader}>
            <Text style={styles.howItWorksTitle}>
              How to get referral bonus?
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>
                Your friend subscribes to Fittbot
              </Text>
              <Text style={styles.stepSubtitle}>
                using your unique referral code
              </Text>
            </View>
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>XP points</Text>
              <View style={styles.xpContainer}>
                <Text style={styles.xpAmount}>1000</Text>
                {/* <MaterialIcons name="stars" size={18} color="#FFC107" /> */}
              </View>
              {/* <Text style={styles.xpText}>XP points</Text> */}
            </View>
          </View>
        </View>

        <View style={styles.inviteContainer}>
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <FontAwesome5 name="sms" size={18} color="#3E6B89" />
            <Text style={styles.inviteText}>Invite via SMS</Text>
            <Text style={styles.inviteAction}>INVITE</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.largeInviteButton}
          onPress={handleShare}
        >
          <Text style={styles.largeInviteText}>Share Your Referral Code</Text>
        </TouchableOpacity>

        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(index)}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons
                  name={expanded === index ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#3E6B89"
                />
              </TouchableOpacity>
              {expanded === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerSub: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  faqButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  faqText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  referralCard: {
    backgroundColor: "#3E6B89",
    borderRadius: 15,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  referralContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 2,
    alignItems: "flex-start",
  },
  earnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },
  highlightText: {
    color: "#FFC107",
  },
  codeContainer: {
    flexDirection: "row",
    backgroundColor: "#2B4C63",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  codeText: {
    color: "#fff",
    marginRight: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  copyButton: {
    padding: 2,
  },
  inviteContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    margin: 16,
    marginTop: 0,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    paddingVertical: 10,
  },
  inviteText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
  },
  inviteAction: {
    color: "#3E6B89",
    fontWeight: "700",
    fontSize: 14,
  },
  howItWorksContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  howItWorksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  termsText: {
    color: "#3E6B89",
    fontWeight: "700",
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  stepTextContainer: {
    flex: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  stepSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  rewardContainer: {
    flex: 1,
    alignItems: "center",
  },
  rewardText: {
    fontSize: 12,
    color: "#3E6B89",
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  xpAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFC107",
    marginRight: 5,
  },
  xpText: {
    fontSize: 12,
    color: "#3E6B89",
    marginTop: 5,
  },
  largeInviteButton: {
    borderWidth: 1,
    borderColor: "#3E6B89",
    borderRadius: 7,
    padding: 10,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3E6B89",
  },
  largeInviteText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  referNowButton: {
    backgroundColor: "#FFC107",
    borderRadius: 30,
    padding: 15,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  referNowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  faqSection: {
    margin: 16,
    marginBottom: 30,
  },
  faqSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  faqAnswer: {
    padding: 15,
    paddingTop: 0,
    backgroundColor: "#fff",
  },
  answerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default ReferralScreen;
