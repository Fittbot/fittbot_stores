import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { getClientRewardsAPI } from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FitnessLoader from "../FitnessLoader";
import { BadgeSummaryModal, BadgeDetailsModal } from "../badgedetails";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import EarnXP from "./EarnXp";
import { showToast } from "../../../utils/Toaster";

const RewardHistoryModal = ({ visible, onClose, history }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reward History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {history?.length === 0 ? (
          <Text style={styles.rewardTitleNo}>No data found.</Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item?.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyDate}>{item?.date}</Text>
                <Text style={styles.historyPoints}>{item?.xp} XP</Text>
                <Text style={styles.historyReward}>{item?.gift}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  </Modal>
);

const RewardDetailsModal = ({ visible, onClose, reward }) => {
  if (!reward) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.centeredModalContainer}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.centeredModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reward Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.rewardDetailContainer}>
            <Image
              source={require("../../../assets/images/rewards_box 3.png")}
              style={styles.rewardDetailImage}
              resizeMode="stretch"
            />
            <Text style={styles.rewardDetailTitle}>{reward.gift}</Text>
            <View style={styles.xpContainer}>
              <Image
                source={require("../../../assets/images/XP 1.png")}
                style={styles.rewardXpIcon}
              />
              <Text style={styles.rewardXp}>{reward.xp} XP</Text>
            </View>
            {reward.description && (
              <Text style={styles.rewardDescription}>{reward.description}</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const RewardCard = ({ item, selected, onPress }) => {
  const truncateTitle = (title) => {
    const words = title.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return title;
  };

  return (
    <TouchableOpacity
      style={[styles.rewardCard, selected && styles.selectedRewardCard]}
      onPress={() => onPress(item)}
    >
      <View style={styles.rewardImageContainer}>
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
          style={styles.rewardImageBackground}
        >
          <Image
            source={require("../../../assets/images/rewards_box 3.png")}
            style={styles.rewardImage}
            resizeMode="stretch"
          />
        </LinearGradient>
      </View>
      <View style={styles.rewardInfoContainer}>
        <Text style={styles.rewardName} numberOfLines={1}>
          {truncateTitle(item.gift)}
        </Text>
        <View style={styles.xpContainer}>
          <Image
            source={require("../../../assets/images/XP 1.png")}
            style={styles.rewardXpIcon}
          />
          <Text style={styles.rewardXp}>{item.xp}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Rewards = () => {
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [quests, setQuests] = useState([]);
  const [topMonths, setTopMonths] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [badgeDetails, setBadgeDetails] = useState(null);
  const [loading, setloading] = useState(true);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("rewards");
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewardUpdate, setRewardUpdate] = useState(null);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const fetchRewardDetails = async () => {
    setloading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId || !gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        setloading(false);
        return;
      }

      const response = await getClientRewardsAPI(clientId, gymId);
      if (response?.status === 200) {
        setRewardHistory(response?.data?.client_history);
        setRewardUpdate(response?.data?.reward_update);
        setQuests(response?.data?.quest || []);
        setTopMonths(response?.data?.monthly_leaderboard);
        setAvailableRewards(response?.data?.gym_rewards || []);
        if (
          response?.data?.gym_rewards &&
          response.data.gym_rewards.length > 0
        ) {
          setSelectedReward(response.data.gym_rewards[0]);
        }
        setBadgeDetails(response?.data?.client_badge);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error fetching rewards",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchRewardDetails();
  }, []);

  const handleMoreDetailsClick = () => {
    setShowBadgeSummary(false);
    setShowBadgeDetails(true);
  };

  const handleSelectReward = (reward) => {
    setSelectedReward(reward);
    setShowRewardDetails(true);
  };

  if (loading) {
    return <FitnessLoader />;
  }

  const calculateProgressPercentage = () => {
    const currentXP = parseInt(badgeDetails?.client_xp) || 0;
    const nextLevelXP = parseInt(badgeDetails?.next_level_start) || 1985;
    const percentage = (currentXP / nextLevelXP) * 100;
    return Math.min(percentage, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "rewards" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("rewards")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "rewards" && styles.activeTabText,
              ]}
            >
              Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "earnXp" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("earnXp")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "earnXp" && styles.activeTabText,
              ]}
            >
              Earn XP
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === "earnXp" ? (
          <EarnXP quest={quests} />
        ) : (
          <View>
            {rewardUpdate && (
              <View style={styles.infoContainer}>
                <View style={styles.infoBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#E74C3C"
                    style={styles.infoIcon}
                  />
                  <MaskedView
                    maskElement={
                      <Text style={{ fontSize: 12, width: "80%" }}>
                        Reward Update: {rewardUpdate}
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={["#030A15", "#0154A0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ justifyContent: "center" }}
                    >
                      <Text
                        style={[{ opacity: 0, fontSize: 12, width: "80%" }]}
                      >
                        Reward Update: {rewardUpdate}
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                </View>
              </View>
            )}

            <View style={styles.badgeCard}>
              <LinearGradient
                colors={["#FFFFFF", "rgba(1,84,160,0.3)"]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.2 }}
                style={{
                  paddingBottom: 35,
                  paddingHorizontal: 16,
                  paddingTop: 20,
                }}
              >
                <View style={styles.badgeHeaderRow}>
                  <View>
                    <MaskedView
                      maskElement={
                        <Text style={{ fontSize: 18, fontWeight: 700 }}>
                          {badgeDetails?.badge} badge
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#030A15", "#0154A0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.4, y: 0 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text
                          style={[
                            { opacity: 0, fontSize: 18, fontWeight: 700 },
                          ]}
                        >
                          {badgeDetails?.badge} badge
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                    <Text style={styles.workoutText}>
                      {badgeDetails?.level}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowBadgeSummary(true)}>
                    <Image
                      source={{ uri: badgeDetails?.image_url }}
                      style={styles.badgeIcon}
                    />
                  </TouchableOpacity>
                </View>

                <View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <LinearGradient
                        colors={["#030A15", "#0154A0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { width: `${calculateProgressPercentage()}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.xpRow}>
                      <Image
                        source={require("../../../assets/images/XP 1.png")}
                        style={styles.xpIcon}
                      />
                      <MaskedView
                        maskElement={
                          <Text style={styles.xpText}>
                            {badgeDetails?.client_xp}
                          </Text>
                        }
                      >
                        <LinearGradient
                          colors={["#030A15", "#0154A0"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0.4, y: 0 }}
                          style={{ justifyContent: "center" }}
                        >
                          <Text style={[{ opacity: 0 }, styles.xpText]}>
                            {badgeDetails?.client_xp}
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                    </View>
                    <Text style={styles.nextLevelXp}>
                      {badgeDetails?.next_level_start} XP
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
            <View
              style={[
                styles.badgeCard,
                { paddingVertical: 5, paddingHorizontal: 15 },
              ]}
            >
              <View style={styles.nextBadgeContainer}>
                <MaskedView
                  maskElement={
                    <Text style={{ fontSize: 12 }}>
                      Just a few steps away from the '
                      {badgeDetails?.next_badge_name}' badge!
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["#030A15", "#0154A0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ justifyContent: "center" }}
                  >
                    <Text style={[{ opacity: 0, fontSize: 12 }]}>
                      Just a few steps away from the '
                      {badgeDetails?.next_badge_name}' badge!
                    </Text>
                  </LinearGradient>
                </MaskedView>
                <Image
                  source={{ uri: badgeDetails?.next_badge_url }}
                  style={styles.smallBadgeIcon}
                />
              </View>
            </View>

            {/* Rewards horizontal scrollable cards */}
            <View style={styles.rewardsSection}>
              <MaskedView
                maskElement={
                  <Text style={styles.rewardsSectionTitle}>
                    Available Rewards
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.4, y: 0 }}
                  style={{ justifyContent: "center" }}
                >
                  <Text style={[{ opacity: 0 }, styles.rewardsSectionTitle]}>
                    Available Rewards
                  </Text>
                </LinearGradient>
              </MaskedView>

              <FlatList
                data={availableRewards}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <RewardCard
                    item={item}
                    selected={selectedReward && selectedReward.id === item.id}
                    onPress={handleSelectReward}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rewardsScrollContainer}
              />
            </View>

            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Reward History</Text>
              </View>
              {rewardHistory?.length === 0 ? (
                <View>
                  <Text style={styles.noData}>No Data Found</Text>
                </View>
              ) : (
                <>
                  {rewardHistory.map((item, index) => (
                    <View key={index} style={styles.historyListItem}>
                      <View style={styles.historyLeftContent}>
                        <View style={styles.statusIndicator}>
                          <AntDesign
                            name="checkcircle"
                            size={18}
                            color="#4CAF50"
                          />
                        </View>
                        <View>
                          <Text style={styles.rewardItemTitle}>
                            {item.gift}
                          </Text>
                          <Text style={styles.rewardItemDate}>
                            Claimed on {item.date}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.rewardItemPoints}>{item.xp} XP</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => setShowRewardHistory(true)}
                  >
                    <Text style={styles.loadMoreText}>Load more</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.monthlyContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.monthlyTitle}>Top Performing Months</Text>
                }
              >
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.4, y: 0 }}
                  style={{ justifyContent: "center" }}
                >
                  <Text style={[{ opacity: 0 }, styles.monthlyTitle]}>
                    Top Performing Months
                  </Text>
                </LinearGradient>
              </MaskedView>

              {topMonths?.length === 0 ? (
                <View>
                  <Text style={styles.noData}>No Data Found</Text>
                </View>
              ) : (
                <>
                  {topMonths.map((month, index) => (
                    <View key={index} style={styles.monthItem}>
                      <View>
                        <MaskedView
                          maskElement={
                            <Text style={styles.monthName}>{month.month}</Text>
                          }
                        >
                          <LinearGradient
                            colors={["#030A15", "#0154A0"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.4, y: 0 }}
                            style={{ justifyContent: "center" }}
                          >
                            <Text style={[{ opacity: 0 }, styles.monthName]}>
                              {month.month}
                            </Text>
                          </LinearGradient>
                        </MaskedView>
                      </View>
                      <MaskedView
                        maskElement={
                          <Text style={styles.monthPoints}>{month.xp}XP</Text>
                        }
                      >
                        <LinearGradient
                          colors={["#030A15", "#0154A0"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0.4, y: 0 }}
                          style={{ justifyContent: "center" }}
                        >
                          <Text style={[{ opacity: 0 }, styles.monthPoints]}>
                            {month.xp}XP
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                    </View>
                  ))}
                </>
              )}
            </View>

            <BadgeSummaryModal
              visible={showBadgeSummary}
              onClose={() => setShowBadgeSummary(false)}
              userXP={parseInt(badgeDetails?.client_xp) || 0}
              currentBadge={badgeDetails?.badge || ""}
              onMoreDetails={handleMoreDetailsClick}
            />

            <BadgeDetailsModal
              visible={showBadgeDetails}
              onClose={() => setShowBadgeDetails(false)}
              currentBadge={badgeDetails?.badge || ""}
              currentLevel={badgeDetails?.level || ""}
            />

            <RewardHistoryModal
              visible={showRewardHistory}
              onClose={() => setShowRewardHistory(false)}
              history={rewardHistory}
            />

            <RewardDetailsModal
              visible={showRewardDetails}
              onClose={() => setShowRewardDetails(false)}
              reward={selectedReward}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: 10,
    marginBottom: Platform.OS === "ios" ? 50 : 0,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FB",
    padding: 16,
    borderRadius: 8,
  },
  infoIcon: {
    width: "10%",
  },
  infoText: {
    fontSize: 12,
    color: "#0154A0",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: Platform.OS === "ios" ? 10 : 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#0154A0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777",
  },
  activeTabText: {
    color: "#0154A0",
    fontWeight: "600",
  },
  badgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    marginTop: 10,
  },
  badgeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgeIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  xpIcon: {
    width: 25,
    height: 25,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "absolute",
    left: 0,
    top: 20,
    fontSize: 12,
  },
  xpText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    position: "relative",
    height: 10,
    marginBottom: 16,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0154A0",
    borderRadius: 5,
  },
  nextLevelXp: {
    position: "absolute",
    right: 0,
    top: 20,
    fontSize: 14,
    color: "#0154A0",
  },
  nextBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextBadgeText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },
  smallBadgeIcon: {
    width: 45,
    height: 50,
  },
  // New reward cards styling
  rewardsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  rewardsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  rewardCard: {
    width: 145,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  selectedRewardCard: {
    // borderWidth: 2,
    // borderColor: '#0154A0',
  },
  rewardImageContainer: {
    height: 120,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  rewardImageBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
  rewardInfoContainer: {
    padding: 8,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardXpIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardXp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0154A0",
  },
  historyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    marginRight: 12,
  },
  rewardItemTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  rewardItemDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  rewardItemPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 12,
    color: "#0154A0",
    fontWeight: "500",
  },
  monthlyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  monthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  monthName: {
    fontSize: 12,
    fontWeight: "500",
  },
  monthPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  workoutText: {
    paddingTop: 5,
    color: "rgba(0,0,0,0.3)",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    flex: 1,
  },
  historyPoints: {
    flex: 1,
    textAlign: "center",
  },
  historyReward: {
    flex: 1,
    textAlign: "right",
  },
  rewardTitleNo: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5,
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredModalContent: {
    width: "60%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  rewardDetailContainer: {
    alignItems: "center",
    paddingBottom: 15,
    borderWidth: 2,
    borderRadius: 25,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  rewardDetailImage: {
    width: "100%",
    height: 150,
    marginBottom: 16,
  },
  rewardDetailTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
});

export default Rewards;
