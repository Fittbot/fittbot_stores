import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

const XpCard = ({
  userName,
  profileImage,
  xp = 0,
  progress = 0,
  quote = "You're one step away from greatness — don't skip today!",
  badgeImage,
  color1 = "#7b2cbf",
  color2 = "#e5383b",
  onBadgePress,
}) => {
  const router = useRouter();

  const onProfilePress = () => {
    router.push({
      pathname: "/client/profile",
      params: {
        tab: "personal",
      },
    });
  };

  // Determine if it's a tablet based on screen width
  const isTablet = screenWidth >= 768;

  return (
    <View style={[styles.card, isTablet && styles.cardTablet]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.profileButtonInitial}
          onPress={onProfilePress}
        >
          <Image
            source={profileImage}
            style={[styles.avatar, isTablet && styles.avatarTablet]}
          />
        </TouchableOpacity>

        <View style={styles.middleSection}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.greeting,
                isTablet && styles.greetingTablet,
                { color: color1 === "#7b2cbf" ? "#C2185B" : color1 },
              ]}
            >
              Hi, {userName}
            </Text>
            <Text
              style={[
                styles.xp,
                isTablet && styles.xpTablet,
                { color: color1 === "#7b2cbf" ? "#C2185B" : color1 },
              ]}
            >
              {xp} XP
            </Text>
          </View>

          <View
            style={[
              styles.progressBackground,
              isTablet && styles.progressBackgroundTablet,
            ]}
          >
            <LinearGradient
              colors={[color1, color2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.profileButtonInitial}
            onPress={() => onBadgePress()}
          >
            <Image
              source={badgeImage}
              style={[styles.badge, isTablet && styles.badgeTablet]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          styles.quote,
          isTablet && styles.quoteTablet,
          { color: color1 === "#7b2cbf" ? "#C2185B" : color1 },
        ]}
      >
        {quote || "You're one step away from greatness — don't skip today!"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: "100%",
    maxWidth: screenWidth >= 768 ? 500 : screenWidth - 32, // Responsive max width
    minWidth: 280, // Minimum width for very small screens
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    paddingTop: 16,
    marginBottom: 16,
    overflow: "hidden",
    alignSelf: "center",
  },
  cardTablet: {
    maxWidth: 600,
    padding: 20,
    paddingTop: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    flexShrink: 0,
    aspectRatio: 1,
  },
  avatarTablet: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  middleSection: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: "center",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2185B",
    flexShrink: 1,
  },
  greetingTablet: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressBackground: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
    width: "100%",
  },
  progressBackgroundTablet: {
    height: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  xp: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#C2185B",
    flexShrink: 0,
  },
  xpTablet: {
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    width: 45,
    height: 45,
    flexShrink: 0,
    aspectRatio: 1,
  },
  badgeTablet: {
    width: 60,
    height: 60,
  },
  quote: {
    marginTop: 0,
    fontSize: 10,
    textAlign: "center",
    color: "#6A1B9A",
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  quoteTablet: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 0,
    paddingHorizontal: 16,
  },
  profileButtonInitial: {
    // Added for better touch targets
    padding: 2,
  },
});

export default XpCard;
