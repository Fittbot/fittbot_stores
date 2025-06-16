import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import FitnessLoader from "../FitnessLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import { getGymAnnouncementsAPI } from "../../../services/Api";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const ANNOUNCEMENT_ICONS = [
  "campaign",
  "event",
  "notifications-active",
  "fitness-center",
  "local-offer",
];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * ANNOUNCEMENT_ICONS.length);
  return ANNOUNCEMENT_ICONS[randomIndex];
};

const GymAnnouncements = ({ onScroll, scrollEventThrottle, headerHeight }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#FF5757";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "#FF5757";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getGymAnnouncements = async () => {
    setIsLoading(true);
    try {
      const gym_id = await AsyncStorage.getItem("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong",
        });
        return;
      }
      const response = await getGymAnnouncementsAPI(gym_id);
      if (response?.status === 200) {
        const formattedAnnouncements = response?.data.map((announcement) => ({
          id: announcement.id.toString(),
          title: announcement.title,
          description: announcement.description,
          date: announcement.datetime.split("T")[0],
          time: new Date(announcement.datetime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          priority: announcement.priority || "medium",
          icon:
            announcement.priority === "high"
              ? "warning"
              : announcement.priority === "medium"
              ? "notifications"
              : "info",
        }));
        setAnnouncements(formattedAnnouncements);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Something went wrong",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong, Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getGymAnnouncements();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // Format time from ISO string in 12-hour format (e.g., "2:30 PM")
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAnnouncementPress = (item) => {
    setSelectedAnnouncement(item);
    setModalVisible(true);
  };

  const renderAnnouncement = ({ item }) => (
    <TouchableOpacity
      style={styles.announcementContainer}
      onPress={() => handleAnnouncementPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.announcementHeader}>
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={item.icon}
            size={responsiveFontSize(24)}
            color="#FF5757"
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <View style={styles.dateTimeContainer}>
            <FontAwesome
              name="calendar"
              size={responsiveFontSize(12)}
              color="#666"
            />
            <Text style={styles.dateTimeText}>{item.date}</Text>
            <FontAwesome
              name="clock-o"
              size={responsiveFontSize(12)}
              color="#666"
              style={styles.timeIcon}
            />
            <Text style={styles.dateTimeText}>{item.time}</Text>
          </View>
        </View>
      </View>
      <Text
        style={styles.announcementContent}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {item.description}
      </Text>
      {item.description.length > 100 && (
        <Text style={styles.readMoreText}>Tap to read more</Text>
      )}
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  {selectedAnnouncement && (
                    <MaterialIcons
                      name={selectedAnnouncement.icon}
                      size={responsiveFontSize(30)}
                      color="#FF5757"
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={responsiveFontSize(24)}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {selectedAnnouncement && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {selectedAnnouncement.title}
                  </Text>

                  <View style={styles.modalDateContainer}>
                    <View style={styles.dateTimeBox}>
                      <FontAwesome
                        name="calendar"
                        size={responsiveFontSize(14)}
                        color="#666"
                      />
                      <Text style={styles.modalDateText}>
                        {selectedAnnouncement.date}
                      </Text>
                    </View>
                    <View style={styles.dateTimeBox}>
                      <FontAwesome
                        name="clock-o"
                        size={responsiveFontSize(14)}
                        color="#666"
                      />
                      <Text style={styles.modalDateText}>
                        {selectedAnnouncement.time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.modalContentText}>
                    {selectedAnnouncement.description}
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (isLoading) {
    return <FitnessLoader page="feed" />;
  }

  return (
    <View style={styles.container} edges={["top"]}>
      <FlatList
        data={announcements}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.announcementsContainer,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View style={styles.headerInfoContainer}>
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={responsiveFontSize(24)}
                color="#FF5757"
              />
              <Text style={styles.infoText}>
                Latest announcements from your gym
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={responsiveFontSize(50)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>No Announcements</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for gym updates
            </Text>
          </View>
        )}
      />
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    marginBottom: Platform.OS === "ios" ? 50 : 0,
  },
  announcementsContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerInfoContainer: {
    marginVertical: responsiveHeight(2),
  },
  infoBox: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    marginLeft: responsiveWidth(3),
    fontSize: responsiveFontSize(14),
    color: "#333",
    flex: 1,
  },
  announcementContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: responsiveWidth(3),
    marginBottom: responsiveHeight(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  priorityIndicator: {
    width: responsiveWidth(1),
    height: responsiveHeight(6),
    borderRadius: responsiveWidth(0.5),
    marginRight: responsiveWidth(3),
  },
  iconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  headerTextContainer: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveHeight(0.5),
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginLeft: responsiveWidth(1),
  },
  timeIcon: {
    marginLeft: responsiveWidth(3),
  },
  announcementContent: {
    padding: responsiveWidth(4),
    fontSize: responsiveFontSize(14),
    color: "#555",
    lineHeight: responsiveFontSize(20),
  },
  readMoreText: {
    fontSize: responsiveFontSize(12),
    color: "#FF5757",
    fontWeight: "500",
    textAlign: "right",
    paddingRight: responsiveWidth(4),
    paddingBottom: responsiveWidth(2),
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(10),
  },
  emptyTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(2),
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#999",
    marginTop: responsiveHeight(1),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(4),
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(4),
    width: "100%",
    maxHeight: responsiveHeight(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: responsiveWidth(2),
  },
  modalContent: {
    padding: responsiveWidth(4),
  },
  modalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveHeight(1.5),
  },
  modalDateContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: responsiveHeight(1.5),
  },
  priorityTag: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(4),
  },
  priorityText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "500",
  },
  dateTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: responsiveWidth(4),
  },
  modalDateText: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginLeft: responsiveWidth(1),
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: responsiveHeight(1.5),
  },
  modalContentText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    lineHeight: responsiveFontSize(24),
  },
});

export default GymAnnouncements;
