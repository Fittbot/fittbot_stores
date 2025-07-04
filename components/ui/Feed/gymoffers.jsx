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
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";
import FitnessLoader from "../FitnessLoader";
import { LinearGradient } from "expo-linear-gradient";
import { getGymOffersAPI } from "../../../services/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const getOfferImage = (imageType) => {
  switch (imageType) {
    case "membership":
      return require("../../../assets/images/offer.jpg");
    case "friends":
      return require("../../../assets/images/offer.jpg");
    case "protein":
      return require("../../../assets/images/offer.jpg");
    case "training":
      return require("../../../assets/images/offer.jpg");
    case "apparel":
      return require("../../../assets/images/offer.jpg");
    case "student":
      return require("../../../assets/images/offer.jpg");
    case "morning":
      return require("../../../assets/images/offer.jpg");
    default:
      return require("../../../assets/images/offer.jpg");
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "membership":
      return "id-card";
    case "guest":
      return "user-friends";
    case "nutrition":
      return "blender";
    case "training":
      return "dumbbell";
    case "apparel":
      return "tshirt";
    default:
      return "tag";
  }
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const GymOffers = ({ onScroll, scrollEventThrottle, headerHeight }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const handleOfferPress = (item) => {
    setSelectedOffer(item);
    setModalVisible(true);
  };

  const getGymOffers = async () => {
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
      const response = await getGymOffersAPI(gym_id);

      if (response?.status === 200) {
        setOffers(response?.data);
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
    getGymOffers();
  }, []);

  const renderOffer = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[
          styles.offerContainer,
          isEven ? styles.offerEven : styles.offerOdd,
        ]}
        onPress={() => handleOfferPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.offerImageContainer}>
          <LinearGradient
            colors={[
              index % 3 == 0
                ? "#36439F"
                : index % 3 == 1
                ? "#7C001D"
                : "#1E2349",
              "#000000",
            ]}
            style={styles.offerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={
                item.image_url ||
                require("../../../assets/images/offer_card.png")
              }
              contentFit="cover"
              style={{ width: "100%", height: "55%" }}
            />
            <View style={styles.offerDetails}>
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offerSubtitle}>
                {item.description.length > 70
                  ? `${item.description.slice(0, 70)}...`
                  : item.description}
              </Text>
              <View style={styles.offerValidUntil}>
                <Ionicons
                  name="time-outline"
                  size={responsiveFontSize(14)}
                  color="#FFF"
                />
                <Text style={styles.offerValidText}>
                  Valid until {formatDate(item.validity)}
                </Text>
              </View>

              <View style={styles.offerFooter}>
                <Text style={styles.offerCode}>
                  Code: {item.code ? item.code : "Not Applicable"}
                </Text>
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Entypo
                    name="chevron-right"
                    size={responsiveFontSize(14)}
                    color="#FFF"
                  />
                </View>
              </View>

              <View style={styles.offerBadge}>
                <View style={styles.offerBadgeContainer}>
                  <Image
                    source={require("../../../assets/images/offer_badge.png")}
                    contentFit="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View style={styles.offerBadgeText}>
                    <Text style={styles.offerText1}>SPECIAL</Text>
                    <Text style={styles.offerText2}>OFFER</Text>
                    <Text style={styles.offerDiscount}>{item.discount} %</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  // Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      {/* <TouchableWithoutFeedback onPress={() => setModalVisible(false)}> */}
      <View style={styles.modalOverlay}>
        {/* <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}> */}
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons
                name="close"
                size={responsiveFontSize(24)}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>

          {selectedOffer && (
            <>
              {/* Fixed Image Header */}
              <View style={styles.modalImageContainer}>
                <ImageBackground
                  source={
                    selectedOffer?.image_url ||
                    require("../../../assets/images/offer_card.png")
                  }
                  style={styles.modalImage}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.modalImageGradient}
                  >
                    <View style={styles.modalOfferTag}>
                      <Text style={styles.modalOfferTagText}>
                        {selectedOffer.tag}
                      </Text>
                    </View>
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedOffer.title}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {selectedOffer.subdescription}
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.modalDetailsContainer}
                contentContainerStyle={styles.modalDetailsContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <FontAwesome5
                      name={getCategoryIcon(selectedOffer.category)}
                      size={responsiveFontSize(18)}
                      color="#1DA1F2"
                    />
                    <Text style={styles.modalInfoLabel}>Category</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.category.charAt(0).toUpperCase() +
                        selectedOffer.category.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <FontAwesome
                      name="percent"
                      size={responsiveFontSize(18)}
                      color="#1DA1F2"
                    />
                    <Text style={styles.modalInfoLabel}>Discount</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.discount}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <Ionicons
                      name="calendar"
                      size={responsiveFontSize(18)}
                      color="#1DA1F2"
                    />
                    <Text style={styles.modalInfoLabel}>Valid Until</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDate(selectedOffer.validity)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDescriptionContainer}>
                  <Text style={styles.modalDescriptionTitle}>
                    Offer Details
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedOffer.description}
                  </Text>
                </View>
                {selectedOffer.code && (
                  <View style={styles.modalCodeContainer}>
                    <Text style={styles.modalCodeLabel}>Use Code</Text>
                    <View style={styles.modalCodeBox}>
                      <Text style={styles.modalCodeValue}>
                        {selectedOffer.code ? selectedOffer.code : "NA"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* <TouchableOpacity style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>Claim This Offer</Text>
                </TouchableOpacity> */}

                {/* Add some bottom padding for better scrolling */}
                <View style={styles.modalBottomPadding} />
              </ScrollView>
            </>
          )}
        </View>
        {/* </TouchableWithoutFeedback> */}
      </View>
      {/* </TouchableWithoutFeedback> */}
    </Modal>
  );

  if (isLoading) {
    return <FitnessLoader page="feed" />;
  }

  return (
    <View style={styles.container} edges={["top"]}>
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.offersContainer,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View style={styles.headerInfoContainer}>
            <LinearGradient
              colors={["#FF5757", "#8C52FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoHeader}
            >
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Exclusive Offers</Text>
                <Text style={styles.promoSubtitle}>
                  Save big on memberships & more
                </Text>
              </View>
              <View style={styles.promoIconContainer}>
                <FontAwesome5
                  name="tags"
                  size={responsiveFontSize(24)}
                  color="#FFF"
                />
              </View>
            </LinearGradient>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5
              name="gift"
              size={responsiveFontSize(50)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>No Offers Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon for new deals
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
  offersContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerInfoContainer: {
    marginVertical: responsiveHeight(2),
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  promoSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
  },
  promoIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    minHeight: responsiveHeight(30),
    maxHeight: responsiveHeight(35),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerDetails: {
    position: "relative",
    // backgroundColor: "#1E2349",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E99809",
    borderBottomEndRadius: 12,
    height: "45%",
    padding: 10,
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
    borderRadius: responsiveWidth(3),
  },
  offerTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  offerTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  offerBadgeContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 70,
    height: 70,
  },
  offerText1: {
    fontSize: 10,
    fontWeight: 400,
    color: "#A32669",
    textAlign: "center",
  },
  offerBadgeText: {
    position: "absolute",
    top: 3,
    right: 0,
    left: 0,
  },
  offerText2: {
    fontSize: 12,
    fontWeight: 900,
    color: "#D7001D",
    textAlign: "center",
  },
  offerDiscount: {
    color: "#000",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    textAlign: "center",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
    width: "80%",
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(10),
    marginLeft: responsiveWidth(1),
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerCode: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    marginRight: responsiveWidth(1),
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(85),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(4),
    zIndex: 10,
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    height: responsiveHeight(30),
    width: "100%",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: responsiveWidth(4),
  },
  modalOfferTag: {
    position: "absolute",
    top: responsiveHeight(2),
    left: responsiveWidth(4),
    backgroundColor: "#1DA1F2",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  modalSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1,
    padding: responsiveWidth(4),
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    marginTop: responsiveHeight(0.5),
  },
  modalInfoValue: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(1),
  },
  modalDescription: {
    color: "#555",
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
  },
  modalCodeContainer: {
    marginVertical: responsiveHeight(2),
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    marginBottom: responsiveHeight(1),
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#FF5757",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(70),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    flex: 0, // Changed from flex: 1
  },
  modalHeader: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(4),
    zIndex: 10,
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    height: responsiveHeight(25), // Reduced height to give more space for scrollable content
    width: "100%",
  },
  modalImage: {
    height: "100%",
    width: "100%",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: responsiveWidth(4),
  },
  modalOfferTag: {
    position: "absolute",
    top: responsiveHeight(2),
    left: responsiveWidth(4),
    backgroundColor: "#1DA1F2",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  modalSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1, // This ensures ScrollView takes remaining space
    backgroundColor: "#FFF",
  },
  modalDetailsContent: {
    padding: responsiveWidth(4),
    paddingBottom: responsiveHeight(4), // Extra padding at bottom
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    marginTop: responsiveHeight(0.5),
  },
  modalInfoValue: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(1),
  },
  modalDescription: {
    color: "#555",
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
  },
  modalCodeContainer: {
    marginVertical: responsiveHeight(2),
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    marginBottom: responsiveHeight(1),
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#1DA1F2",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  modalBottomPadding: {
    height: responsiveHeight(2),
  },
});

export default GymOffers;
