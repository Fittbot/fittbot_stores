import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  AntDesign,
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import {
  createFeedPostAPI,
  deletePostAPI,
  editPostAPI,
  getFeedPostAPI,
  getLikesDataAPI,
  likeFeedPostAPI,
} from "../../../services/Api";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  blockPostAPI,
  hasMediainPostAPI,
  reportPostAPI,
} from "../../../services/clientApi";
import PostModalClient from "../PostModalClient";
import FitnessLoader from "../FitnessLoader";
import MediaInputComponent from "../../MediaInputComponent";
import { Audio } from "expo-av";
import Swiper from "react-native-swiper";
import * as Haptics from "expo-haptics";
import axios from "axios";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardScreenWidth = 392;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};
import SuccessPopup from "../SuccessPopup";
import UploadingProgress from "./uploadingProgress";
import websocketConfig from "../../../services/websocketconfig";
import NewPostNotification from "./NewPostNotification";
import { useWS, WebSocketProvider } from "../../../context/webSocketProvider";
import useFeedSocket from "../../../context/useFeedSocket";
import { showToast } from "../../../utils/Toaster";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableWithoutFeedback } from "react-native";
import { ShimmerListItem } from "../../shimmerUI/ShimmerComponentsPreview";

export default function AllFeedWrapper(props) {
  const [gymId, setGymId] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem("gym_id").then((id) => setGymId(Number(id)));
  }, []);

  if (!gymId) return null;

  const url1 = "websocket_feed";
  const url2 = "posts";

  return (
    <WebSocketProvider gymId={gymId} url1={url1} url2={url2}>
      <AllFeed {...props} />
    </WebSocketProvider>
  );
}

const AllFeed = ({ onScroll, scrollEventThrottle, headerHeight }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fullImageModal, setFullImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [text, setText] = useState("");
  const [feed, setFeed] = useState([]);
  const [likes, setLikes] = useState(null);
  const [likeModal, setLikeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const postOpacity = useRef(new Animated.Value(0)).current;
  const postTranslate = useRef(new Animated.Value(50)).current;
  const likeScale = useRef({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportConfirmModalVisible, setReportConfirmModalVisible] =
    useState(false);
  const [reportedPost, setReportedPost] = useState(null);
  const [reportReason, setReportReason] = useState(null);
  const [postId, setPostId] = useState(null);
  const [optionId, setOptionId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDuration, setAudioDuration] = useState({});
  const [audioPosition, setAudioPosition] = useState({});
  const [localLikeState, setLocalLikeState] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const progressInterval = useRef(null);
  const progressBarRef = useRef(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [otherUsers, setOtherUsers] = useState(false);
  const [newPostNotification, setNewPostNotification] = useState(false);
  const [blockConfirmModalVisible, setBlockConfirmModalVisible] =
    useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const uploadingPostId = useRef(null);

  useEffect(() => {
    if (otherUsers) {
      setNewPostNotification(true);
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      const hideTimeout = setTimeout(() => {
        setNewPostNotification(false);
        setOtherUsers(false);
      }, 10000);
      return () => clearTimeout(hideTimeout);
    } else {
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNewPostNotification(false);
      });
    }
  }, [otherUsers]);

  const handleNewPostClick = () => {
    getAllPosts();
    setOtherUsers(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return "0:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const playSound = async (audioUrl, postId) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis) {
              setAudioDuration({
                ...audioDuration,
                [postId]: status.durationMillis,
              });
            }

            setAudioPosition({
              ...audioPosition,
              [postId]: status.positionMillis,
            });

            if (status.durationMillis > 0) {
              setAudioProgress({
                ...audioProgress,
                [postId]: status.positionMillis / status.durationMillis,
              });
            }

            if (status.didJustFinish) {
              setIsPlaying({ ...isPlaying, [postId]: false });
              setAudioPosition({ ...audioPosition, [postId]: 0 });
              setAudioProgress({ ...audioProgress, [postId]: 0 });

              if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
              }
            }
          }
        }
      );

      setSound(newSound);
      setIsPlaying({ ...isPlaying, [postId]: true });

      const status = await newSound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setAudioDuration({ ...audioDuration, [postId]: status.durationMillis });
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Could not play audio",
      });
    }
  };

  const stopSound = async (postId) => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying({ ...isPlaying, [postId]: false });

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const seekAudio = async (postId, value) => {
    if (sound) {
      const newPosition = value * (audioDuration[postId] || 0);
      await sound.setPositionAsync(newPosition);
      setAudioPosition({ ...audioPosition, [postId]: newPosition });
      setAudioProgress({
        ...audioProgress,
        [postId]: newPosition / (audioDuration[postId] || 1),
      });
    }
  };

  const preloadAudio = async (audioUrl, postId) => {
    try {
      if (!preloadedSounds.current[postId]) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          null
        );
        preloadedSounds.current[postId] = newSound;

        const status = await newSound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          setAudioDuration((prev) => ({
            ...prev,
            [postId]: status.durationMillis,
          }));
        }
      }
    } catch (error) {
      console.log("Error preloading audio:", error);
    }
  };

  const preloadedSounds = useRef({});

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      Object.values(preloadedSounds.current).forEach((sound) => {
        if (sound) sound.unloadAsync();
      });

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [sound]);

  const toggleTextExpansion = (postId) => {
    setExpandedCaptions({
      ...expandedCaptions,
      [postId]: !expandedCaptions[postId],
    });
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportedPost(null);
  };

  const handleReportReason = async (reason) => {
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
        user_id: client_id,
        post_id: postId,
        reason,
        user_role: "client",
      };
      const response = await reportPostAPI(payload);
      if (response?.status === 200) {
        await getAllPosts();
        setReportReason(reason);
        setReportModalVisible(false);
        setReportConfirmModalVisible(true);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Reporting Post",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const submitReport = async () => {
    try {
      setReportConfirmModalVisible(false);
      setReportedPost(null);
      setReportReason(null);
      setShowMoreOptions(false);
      showToast({
        type: "success",
        title: "Report Submitted",
        desc: "Thank you for letting us know. We'll review this content.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to submit report. Please try again later",
      });
    }
  };

  // const handleBlockUser = async (id) => {
  //   try {
  //     const client_id = await AsyncStorage.getItem("client_id");
  //     if (!client_id) {
  //       showToast({
  //         type: "error",
  //         title: "Error",
  //         desc: "Something went wrong. Please try again later",
  //       });;
  //     }
  //     const payload = {
  //       user_id: client_id,
  //       post_id: id,
  //       user_role: "client",
  //     };
  //     const response = await blockPostAPI(payload);
  //     if (response?.status === 200) {
  //       await getAllPosts();
  //       showToast({
  //         type: "success",
  //         title: "Success",
  //         desc: "user Blocked Successfully",
  //       });
  //       setReportConfirmModalVisible(false);
  //       setReportedPost(null);
  //       setReportReason(null);
  //       setShowMoreOptions(false);
  //       setPostId(null);
  //     } else {
  //       showToast({
  //         type: "error",
  //         title: "Error",
  //         desc: response?.detail || "Error Blocking User",
  //       });
  //     }
  //   } catch (error) {
  //     showToast({
  //       type: "error",
  //       title: "Error",
  //       desc: "Something went wrong. Please try again later",
  //     });;
  //   }
  // };

  const handleBlockUser = async (id) => {
    setMenuVisible((prev) => ({ ...prev, [id]: false }));
    setUserToBlock(id);
    setBlockConfirmModalVisible(true);
    setShowMoreOptions(false);
  };

  const confirmBlockUser = async () => {
    try {
      const client_id = await AsyncStorage.getItem("client_id");
      if (!client_id) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const payload = {
        user_id: client_id,
        post_id: userToBlock,
        user_role: "client",
      };
      const response = await blockPostAPI(payload);
      if (response?.status === 200) {
        await getAllPosts();
        showToast({
          type: "success",
          title: "Success",
          desc: "User Blocked Successfully",
        });
        setReportConfirmModalVisible(false);
        setReportedPost(null);
        setReportReason(null);
        setShowMoreOptions(false);
        setPostId(null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Blocking User",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setBlockConfirmModalVisible(false);
      setUserToBlock(null);
    }
  };

  const closeBlockConfirmModal = () => {
    setBlockConfirmModalVisible(false);
    setUserToBlock(null);
  };

  const handleEditPost = (post) => {
    setMenuVisible((prev) => ({ ...prev, [post.post_id]: false }));
    setEditPostId(post.post_id);
    setEditText(post.content);
    setEditModalVisible(true);
    // setShowMoreOptions(false);
  };

  const handleDeletePost = (postId) => {
    setMenuVisible((prev) => ({ ...prev, [postId]: false }));
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => deletePost(postId),
        style: "destructive",
      },
    ]);
    setShowMoreOptions(false);
  };

  const deletePost = async (postId) => {
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const response = await deletePostAPI(gymId, postId);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Post Deleted Successfully",
        });
        await getAllPosts();
      } else {
        setLikeModal(false);
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Deleting Post",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error Deletign Post",
      });
    }
  };

  const saveEditedPost = async () => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");
      const payload = {
        post_id: editPostId,
        gym_id: gymId,
        content: editText,
        role: "client",
        client_id: clientId,
      };
      const response = await editPostAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Post Updated Successfully",
        });
        setEditModalVisible(false);
        await getAllPosts();
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const closeConfirmModal = () => {
    setReportConfirmModalVisible(false);
    setReportedPost(null);
    setReportReason(null);
    setShowMoreOptions(false);
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} m ago`;
      }
      return `${diffHours} h ago`;
    } else if (diffDays < 7) {
      return `${diffDays} d ago`;
    } else {
      return postDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const toggleLike = async (postId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const postIndex = feed.findIndex((post) => post.post_id === postId);
      if (postIndex !== -1) {
        const updatedFeed = [...feed];
        const post = updatedFeed[postIndex];

        const newIsLiked = !post.is_liked;
        updatedFeed[postIndex] = {
          ...post,
          is_liked: newIsLiked,
          like_count: newIsLiked ? post.like_count + 1 : post.like_count - 1,
        };

        setFeed(updatedFeed);
        setLocalLikeState({
          ...localLikeState,
          [postId]: newIsLiked,
        });
      }

      if (likeScale.current[postId]) {
        Animated.sequence([
          Animated.timing(likeScale.current[postId], {
            toValue: 1.5,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(likeScale.current[postId], {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const payload = {
        post_id: postId,
        gym_id: gymId,
        client_id: clientId,
        role: "client",
      };

      likeFeedPostAPI(payload)
        .then((response) => {
          if (response?.status !== 200) {
            const postIndex = feed.findIndex((post) => post.post_id === postId);
            if (postIndex !== -1) {
              const updatedFeed = [...feed];
              const post = updatedFeed[postIndex];

              updatedFeed[postIndex] = {
                ...post,
                is_liked: !post.is_liked,
                like_count: !post.is_liked
                  ? post.like_count + 1
                  : post.like_count - 1,
              };

              setFeed(updatedFeed);
              showToast({
                type: "error",
                title: "Error",
                desc: response?.detail || "Error updating like",
              });
            }
          }
        })
        .catch((error) => {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again later",
          });
        });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  const openModal = (post) => {
    setShowMoreOptions(false);
    setSelectedPost(post);
    setModalVisible(true);
  };

  const openFullImage = (image) => {
    setSelectedImage(image);
    setFullImageModal(true);
  };

  const closeFullImage = () => {
    setFullImageModal(false);
    setSelectedImage(null);
  };

  const getLikeDetails = async (post) => {
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      setLikes([]);
      const response = await getLikesDataAPI(gymId, post.post_id);
      if (response?.status === 200) {
        setLikes(response.names);
        setLikeModal(true);
      } else {
        setLikeModal(false);
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error fetching likes",
        });
      }
    } catch (error) {
      setLikeModal(false);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const generateAvatar = (userName) => {
    const firstLetter = userName ? userName.charAt(0).toUpperCase() : "?";
    const colors = ["#FF5757", "#4CAF50", "#2196F3", "#9C27B0", "#FF9800"];
    const colorIndex = userName ? userName.charCodeAt(0) % colors.length : 0;

    return (
      <View
        style={{
          width: responsiveWidth(10),
          height: responsiveWidth(10),
          borderRadius: responsiveWidth(5),
          backgroundColor: colors[colorIndex],
          justifyContent: "center",
          alignItems: "center",
          marginRight: responsiveWidth(3),
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: responsiveFontSize(16),
            fontWeight: "bold",
          }}
        >
          {firstLetter}
        </Text>
      </View>
    );
  };

  const renderProfileImage = (url, userName, isYou = false) => {
    if (url) {
      return (
        <Image
          source={{ uri: url }}
          style={{
            width: responsiveWidth(10),
            height: responsiveWidth(10),
            borderRadius: responsiveWidth(5),
            marginRight: responsiveWidth(3),
            borderWidth: 2,
            borderColor: isYou ? "#6366F1" : "transparent",
          }}
        />
      );
    }
    return generateAvatar(userName, isYou ? "#6366F1" : null);
  };

  const reportThisPost = (id) => {
    setMenuVisible((prev) => ({ ...prev, [id]: false }));
    setReportModalVisible(true);
    setPostId(id);
  };

  const doubleTapRefs = useRef({});
  const lastTapRefs = useRef({});

  useEffect(() => {
    feed.forEach((post) => {
      if (!likeScale.current[post.post_id]) {
        likeScale.current[post.post_id] = new Animated.Value(1);
      }
      if (!doubleTapRefs.current[post.post_id]) {
        doubleTapRefs.current[post.post_id] = new Animated.Value(0);
      }
      lastTapRefs.current[post.post_id] =
        lastTapRefs.current[post.post_id] || 0;
    });
  }, [feed]);

  const renderPost = ({ item, index }) => {
    if (!likeScale.current[item.post_id]) {
      likeScale.current[item.post_id] = new Animated.Value(1);
    }

    if (!doubleTapRefs.current[item.post_id]) {
      doubleTapRefs.current[item.post_id] = new Animated.Value(0);
    }

    if (lastTapRefs.current[item.post_id] === undefined) {
      lastTapRefs.current[item.post_id] = 0;
    }

    const toggleMoreOptions = (postId) => {
      setMenuVisible((prev) => {
        const newState = {};
        Object.keys(prev).forEach((key) => {
          newState[key] = false;
        });
        newState[postId] = !prev[postId];
        return newState;
      });
    };
    if (item.media) {
      const audioMedia = item.media.find((m) => m.file_type === "audio");
      if (audioMedia) {
        preloadAudio(audioMedia.file_url, item.post_id);
      }
    }

    const ProfileComponent = item.profile_url ? (
      <Image
        source={{ uri: item.profile_url }}
        style={{
          width: responsiveWidth(10),
          height: responsiveWidth(10),
          borderRadius: responsiveWidth(5),
          marginRight: responsiveWidth(3),
        }}
      />
    ) : (
      generateAvatar(item.user_name)
    );

    const handleDoubleTap = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (now - lastTapRefs.current[item.post_id] < DOUBLE_TAP_DELAY) {
        if (!item.is_liked) {
          toggleLike(item.post_id);
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (doubleTapRefs.current[item.post_id]) {
          Animated.sequence([
            Animated.timing(doubleTapRefs.current[item.post_id], {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.delay(500),
            Animated.timing(doubleTapRefs.current[item.post_id], {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }

      lastTapRefs.current[item.post_id] = now;
    };

    const isOwnPost = item.is_editable;
    const hasMedia = item.media && item.media.length > 0;
    const hasImages =
      item.media && item.media.some((m) => m.file_type === "image");
    const hasAudio =
      item.media && item.media.some((m) => m.file_type === "audio");
    const isTextLong = item.content && item.content.length > 150;
    const isExpanded = expandedCaptions[item.post_id] || false;

    return (
      <TouchableWithoutFeedback
        onPress={() => {
          if (menuVisible[item.post_id]) {
            setMenuVisible((prev) => ({ ...prev, [item.post_id]: false }));
          }
        }}
        style={{ paddingHorizontal: 10 }}
      >
        <View style={styles.postContainer} key={item.post_id}>
          <View style={styles.postHeader}>
            <View style={styles.userInfoContainer}>
              {ProfileComponent}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.user_name}</Text>
                <Text style={styles.timeText}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => toggleMoreOptions(item?.post_id)}>
              <MaterialIcons name="more-vert" size={24} color="#555" />
            </TouchableOpacity>

            {menuVisible[item.post_id] && (
              <View style={styles.moreOptionsMenu}>
                {isOwnPost ? (
                  <>
                    <TouchableOpacity
                      style={styles.moreOptionItem}
                      onPress={() => handleEditPost(item)}
                    >
                      <Feather name="edit-2" size={18} color="#555" />
                      <Text style={styles.moreOptionText}>Edit Post</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.moreOptionItem}
                      onPress={() => handleDeletePost(item.post_id)}
                    >
                      <Feather name="trash-2" size={18} color="#FF3B30" />
                      <Text
                        style={[styles.moreOptionText, { color: "#FF3B30" }]}
                      >
                        Delete Post
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.moreOptionItem}
                      onPress={() => reportThisPost(item?.post_id)}
                    >
                      <MaterialIcons name="flag" size={18} color="#555" />
                      <Text style={styles.moreOptionText}>Report Post</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.moreOptionItem}
                      onPress={() => handleBlockUser(item?.post_id)}
                    >
                      <MaterialIcons name="block" size={18} color="#555" />
                      <Text style={styles.moreOptionText}>Block User</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onPress={handleDoubleTap}
            style={styles.postContentContainer}
          >
            {!hasMedia && (
              <View style={styles.textOnlyContainer}>
                <Text style={styles.textOnlyContent}>
                  {isTextLong && !isExpanded
                    ? item.content.substring(0, 150) + "..."
                    : item.content}
                </Text>
                {isTextLong && (
                  <TouchableOpacity
                    onPress={() => toggleTextExpansion(item.post_id)}
                    style={styles.readMoreButton}
                  >
                    <Text style={styles.readMoreText}>
                      {isExpanded ? "See less" : "See more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {hasImages && (
              <View style={styles.mediaWrapper}>
                <Swiper
                  style={[
                    styles.swiperContainer,
                    {
                      alignSelf: "center",
                    },
                  ]}
                  dotStyle={styles.inactiveDot}
                  activeDotStyle={styles.activeDot}
                  paginationStyle={styles.pagination}
                  loop={false}
                  removeClippedSubviews={false}
                  scrollEnabled={true}
                  bounces={true}
                  containerStyle={{
                    width: responsiveWidth(100),
                    alignSelf: "center",
                    overflow: "hidden",
                  }}
                  onIndexChanged={(index) => {
                    const newState = { ...currentSlideIndex };
                    newState[item.post_id] = index;
                    setCurrentSlideIndex(newState);

                    if (isPlaying[item.post_id]) {
                      stopSound(item.post_id);
                    }
                  }}
                >
                  {item.media
                    .filter((media) => media.file_type === "image")
                    .map((media, index) => (
                      <View
                        key={index}
                        style={[
                          styles.slideItem,
                          {
                            width: responsiveWidth(100),
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => openFullImage(media.file_url)}
                          style={[
                            styles.mediaImageContainer,
                            {
                              width: responsiveWidth(100),
                              height: responsiveHeight(50),
                              alignSelf: "center",
                            },
                          ]}
                          pointerEvents="box-none"
                        >
                          <Image
                            source={{ uri: media.file_url }}
                            style={[
                              styles.mediaImage,
                              {
                                width: "100%",
                                height: "100%",
                                borderRadius: 10,
                              },
                            ]}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                </Swiper>
              </View>
            )}
          </TouchableOpacity>

          {hasAudio && (
            <View style={styles.separateAudioContainer}>
              {item.media
                .filter((media) => media.file_type === "audio")
                .map((media, index) => (
                  <View key={index} style={styles.audioContainer}>
                    <View style={styles.audioPlayerContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          if (isPlaying[item.post_id]) {
                            stopSound(item.post_id);
                          } else {
                            playSound(media.file_url, item.post_id);
                          }
                        }}
                      >
                        <LinearGradient
                          colors={["#0154A0", "#030A15"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.audioPlayButton}
                        >
                          <MaterialIcons
                            name={
                              isPlaying[item.post_id] ? "pause" : "play-arrow"
                            }
                            size={30}
                            color={"white"}
                          />
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.audioProgressContainer}>
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBackground}>
                            <View
                              style={[
                                styles.progressBar,
                                {
                                  width: `${
                                    (audioProgress[item.post_id] || 0) * 100
                                  }%`,
                                  backgroundColor: isPlaying[item.post_id]
                                    ? "#FF5757"
                                    : "#999",
                                },
                              ]}
                            />
                          </View>

                          <View style={styles.seekBarTouchable}>
                            <GestureDetector
                              gesture={Gesture.Pan().onUpdate(
                                ({ absoluteX }) => {
                                  const progressBarElement =
                                    progressBarRef.current;

                                  if (progressBarElement) {
                                    progressBarElement.measure(
                                      (fx, fy, width, height, px, py) => {
                                        const containerWidth = width;
                                        const ratio = Math.max(
                                          0,
                                          Math.min(
                                            1,
                                            (absoluteX - px) / containerWidth
                                          )
                                        );
                                        seekAudio(item.post_id, ratio);
                                      }
                                    );
                                  }
                                }
                              )}
                            >
                              <View
                                ref={progressBarRef}
                                style={styles.progressBarTouchable}
                              />
                            </GestureDetector>
                          </View>
                        </View>

                        <View style={styles.audioTimeContainer}>
                          <Text style={styles.audioTimeText}>
                            {formatTime(audioPosition[item.post_id] || 0)}
                          </Text>
                          <Text style={styles.audioTimeText}>
                            {formatTime(audioDuration[item.post_id] || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* Only show caption if there's media (images or audio) */}
          {item.content && hasMedia && (
            <View style={styles.captionContainer}>
              <Text>
                {/* <Text style={styles.userName}>{item.user_name}</Text> */}
                <Text style={styles.captionFullText}>
                  {isTextLong && !isExpanded
                    ? ` ${item.content.substring(0, 100)}...`
                    : ` ${item.content}`}
                </Text>
              </Text>

              {isTextLong && (
                <TouchableOpacity
                  onPress={() => toggleTextExpansion(item.post_id)}
                  style={styles.seeMoreButton}
                >
                  <Text style={styles.seeMoreText}>
                    {isExpanded ? "See less" : "See more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
            }}
          >
            <View style={styles.postActions}>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  onPress={() => toggleLike(item.post_id)}
                  style={styles.actionButton}
                >
                  {likeScale.current[item.post_id] ? (
                    <Animated.View
                      style={{
                        transform: [{ scale: likeScale.current[item.post_id] }],
                      }}
                    >
                      <AntDesign
                        name={item.is_liked ? "heart" : "hearto"}
                        size={22}
                        color={item.is_liked ? "#FF5757" : "#FF5757"}
                      />
                    </Animated.View>
                  ) : (
                    <AntDesign
                      name={item.is_liked ? "heart" : "hearto"}
                      size={22}
                      color={item.is_liked ? "#FF5757" : "#808187"}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => getLikeDetails(item)}
                  style={styles.likesContainer}
                >
                  <Text style={styles.likesText}>
                    {item.like_count > 0
                      ? `${item.like_count} ${
                          item.like_count === 1 ? "like" : "likes"
                        }`
                      : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.postActions}>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openModal(item)}
                >
                  <MaterialCommunityIcons
                    name="comment-outline"
                    size={22}
                    color="#808187"
                  />
                </TouchableOpacity>

                {item.comment_count > 0 && (
                  <TouchableOpacity
                    onPress={() => openModal(item)}
                    style={styles.commentsPreview}
                  >
                    <Text style={styles.viewCommentsText}>
                      {item.comment_count > 0
                        ? `${item.comment_count} ${
                            item.comment_count === 1 ? "comment" : "comments"
                          }`
                        : ""}
                      {/* {item.comment_count > 1 ? 'all ' : ''}
                      {item.comment_count}{' '}
                      {item.comment_count === 1 ? 'comment' : 'comments'} */}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* <TouchableOpacity
            onPress={() => getLikeDetails(item)}
            style={styles.likesContainer}
          >
            <Text style={styles.likesText}>
              {item.like_count > 0
                ? `${item.like_count} ${
                    item.like_count === 1 ? 'like' : 'likes'
                  }`
                : 'Be the first to like this'}
            </Text>
          </TouchableOpacity> */}

          {/* {item.comment_count > 0 && (
            <TouchableOpacity
              onPress={() => openModal(item)}
              style={styles.commentsPreview}
            >
              <Text style={styles.viewCommentsText}>
                View {item.comment_count > 1 ? 'all ' : ''}
                {item.comment_count}{' '}
                {item.comment_count === 1 ? 'comment' : 'comments'}
              </Text>
            </TouchableOpacity>
          )} */}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const getAllPosts = async () => {
    setIsLoading(true);
    try {
      const gymId = await AsyncStorage.getItem("gym_id");
      const clientId = await AsyncStorage.getItem("client_id");
      if (!gymId || !clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getFeedPostAPI(gymId, clientId, "client");
      if (response?.status === 200) {
        setFeed(response?.data);
      } else if (response?.status === 201) {
        setFeed([]);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getAllPosts();
      return () => {
        setExpanded(false);
      };
    }, [])
  );

  useFeedSocket(async (msg) => {
    if (msg.action !== "new_post") return;

    if (msg.post_id === uploadingPostId.current) {
      setUploading(false);
      setUploadStatus(null);
      // setUploadingId(null);
      uploadingPostId.current = null;
      await getAllPosts();
    } else {
      setOtherUsers(true);
      setUploading(false);
      setUploadStatus(null);
    }
  });

  const sendToAWS = async (text, gymId, clientId, mediaItems) => {
    try {
      const formData = new FormData();

      formData.append("gym_id", gymId);
      formData.append("client_id", clientId);
      formData.append("content", text);
      formData.append("role", "client");

      const processedMediaItems = mediaItems.map((item) => {
        if (item.uri) {
          const uriParts = item.uri.split("/");
          const fileName = uriParts[uriParts.length - 1];
          const fileNameParts = fileName.split(".");
          const extension =
            fileNameParts.length > 1
              ? fileNameParts[fileNameParts.length - 1]
              : "";
          return {
            ...item,
            extension: extension,
          };
        }
        return item;
      });

      const mediaMetadata = processedMediaItems.map((item) => ({
        type: item.type,
        extension: item.extension || "",
        ...(item.type === "image"
          ? { fileName: item.fileName, fileSize: item.fileSize }
          : {}),
        ...(item.type === "audio" ? { duration: item.duration } : {}),
      }));
      formData.append("media", JSON.stringify(mediaMetadata));

      setUploading(true);
      setUploadStatus("Creating post...");

      const response = await hasMediainPostAPI(formData);

      if (response?.status === 200) {
        const { presigned_urls, post_id } = response.data;

        // setUploadingId(post_id);
        uploadingPostId.current = post_id;
        setUploadStatus("Uploading file(s)...");

        const uploadPromises = mediaItems.map(async (item, index) => {
          const { upload_url, content_type } = presigned_urls[index];

          try {
            const fileResponse = await fetch(item.uri);
            const fileBlob = await fileResponse.blob();
            const s3Response = await axios.put(upload_url, fileBlob, {
              headers: {
                "Content-Type": content_type,
              },
              transformRequest: [(data) => data],
            });
            if (s3Response?.status === 200) {
              return true;
            } else {
              return false;
            }
          } catch (error) {
            return false;
          }
        });
        await Promise.all(uploadPromises);
        // setUploadStatus("Upload complete!");
        return true;
      } else {
        return false;
      }
    } catch (err) {
      setUploadStatus("Post Creation Failed");
      setUploading(false);
      return false;
    } finally {
      // setUploading(false);
    }
  };

  const createFormData = async (text, gymId, clientId, mediaItems) => {
    const formData = new FormData();

    formData.append("gym_id", gymId);
    formData.append("client_id", clientId);
    formData.append("content", text);
    formData.append("role", "client");

    const processedMediaItems = mediaItems.map((item) => {
      if (item.uri) {
        const uriParts = item.uri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileNameParts = fileName.split(".");
        const extension =
          fileNameParts.length > 1
            ? fileNameParts[fileNameParts.length - 1]
            : "";
        return {
          ...item,
          extension: extension,
        };
      }
      return item;
    });

    const mediaMetadata = processedMediaItems.map((item) => ({
      type: item.type,
      extension: item.extension || "",
      ...(item.type === "image"
        ? { fileName: item.fileName, fileSize: item.fileSize }
        : {}),
      ...(item.type === "audio" ? { duration: item.duration } : {}),
    }));

    formData.append("media", JSON.stringify(mediaMetadata));

    for (let item of processedMediaItems) {
      if (item.uri) {
        let mimeType = "";
        if (item.type === "image") {
          mimeType = `image/${
            item.extension === "jpg" ? "jpeg" : item.extension
          }`;
          formData.append("file", {
            uri: item.uri,
            name: `image_${Date.now()}.${item.extension}`,
            type: mimeType,
          });
        } else if (item.type === "audio") {
          mimeType = `audio/${item.extension}`;
          formData.append("file", {
            uri: item.uri,
            name: `audio_${Date.now()}.${item.extension}`,
            type: mimeType,
          });
        }
      }
    }

    return formData;
  };

  if (isLoading) {
    return <FitnessLoader page="feed" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container]} edges={["top"]}>
        {feed?.length ? (
          <FlatList
            data={feed}
            renderItem={renderPost}
            keyExtractor={(item) => item.post_id}
            contentContainerStyle={[
              styles.feedContainer,
              { paddingTop: headerHeight },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            ListHeaderComponent={() => (
              <MediaInputComponent
                onMediaSubmit={async ({ text, mediaItems }) => {
                  try {
                    const gymId = await AsyncStorage.getItem("gym_id");
                    const clientId = await AsyncStorage.getItem("client_id");

                    if (!gymId || !clientId) {
                      throw new Error("Gym ID or Client ID not found");
                    }

                    if (mediaItems.length > 0) {
                      const response = await sendToAWS(
                        text,
                        gymId,
                        clientId,
                        mediaItems
                      );
                      if (response === true) {
                        setText("");
                        setExpanded(false);
                      } else {
                        showToast({
                          type: "error",
                          title: "Error",
                          desc:
                            response?.detail ||
                            response?.message ||
                            "Error uploading media",
                        });
                      }
                    } else {
                      setIsLoading(true);
                      const formData = await createFormData(
                        text,
                        gymId,
                        clientId,
                        []
                      );
                      const response = await createFeedPostAPI(formData);

                      if (response?.status === 200) {
                        showToast({
                          type: "success",
                          title: "Success",
                          desc:
                            response?.message || "Post Created Successfully",
                        });
                        await getAllPosts();
                        setText("");
                        setExpanded(false);
                      } else {
                        showToast({
                          type: "error",
                          title: "Error",
                          desc:
                            response?.detail ||
                            response?.message ||
                            "Error creating post",
                        });
                      }
                    }
                  } catch (error) {
                    showToast({
                      type: "error",
                      title: "Error",
                      desc: "Something went wrong. Please try again later",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            )}
          />
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.feedContainer,
              { paddingTop: headerHeight, flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <MediaInputComponent
              onMediaSubmit={async ({ text, mediaItems }) => {
                try {
                  const gymId = await AsyncStorage.getItem("gym_id");
                  const clientId = await AsyncStorage.getItem("client_id");

                  if (!gymId || !clientId) {
                    throw new Error("Gym ID or Client ID not found");
                  }

                  if (mediaItems.length > 0) {
                    const response = await sendToAWS(
                      text,
                      gymId,
                      clientId,
                      mediaItems
                    );
                    if (response === true) {
                      setText("");
                      setExpanded(false);
                    } else {
                      showToast({
                        type: "error",
                        title: "Error",
                        desc:
                          response?.detail ||
                          response?.message ||
                          "Error uploading media",
                      });
                    }
                  } else {
                    setIsLoading(true);
                    const formData = await createFormData(
                      text,
                      gymId,
                      clientId,
                      []
                    );
                    const response = await createFeedPostAPI(formData);

                    if (response?.status === 200) {
                      showToast({
                        type: "success",
                        title: "Success",
                        desc: response?.message || "Post Created Successfully",
                      });
                      await getAllPosts();
                      setText("");
                      setExpanded(false);
                    } else {
                      showToast({
                        type: "error",
                        title: "Error",
                        desc:
                          response?.detail ||
                          response?.message ||
                          "Error creating post",
                      });
                    }
                  }
                } catch (error) {
                  showToast({
                    type: "error",
                    title: "Error",
                    desc: "Something went wrong. Please try again later",
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
            />

            {/* No posts message */}
            <View style={styles.noFeedContainer}>
              <MaterialCommunityIcons
                name="post-outline"
                size={80}
                color="#CBD5E0"
              />

              <Text style={styles.noFeedTitle}>No Posts to Show</Text>

              <Text style={styles.noFeedSubtitle}>
                There's nothing in your feed right now. Create your first post
                using the input above!
              </Text>
            </View>
          </ScrollView>
        )}

        <UploadingProgress
          isUploading={uploading}
          uploadStatus={uploadStatus}
        />

        <NewPostNotification
          visible={newPostNotification}
          onPress={handleNewPostClick}
        />

        {modalVisible && (
          <PostModalClient
            post={selectedPost}
            visible={modalVisible}
            onClose={closeModal}
            getAllPosts={getAllPosts}
          />
        )}

        <Modal
          visible={likeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setLikeModal(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Likes</Text>
                <TouchableOpacity
                  onPress={() => setLikeModal(false)}
                  style={styles.modalCloseButton}
                >
                  <AntDesign name="close" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.likesScrollContainer}>
                {likes === null ? (
                  <View style={styles.likesLoading}>
                    <ActivityIndicator size="small" color="#0095F6" />
                  </View>
                ) : likes.length === 0 ? (
                  <View style={styles.noLikesContainer}>
                    <Text style={styles.noLikesText}>No likes yet</Text>
                  </View>
                ) : (
                  likes.map((like, index) => (
                    <View key={index} style={styles.likeItem}>
                      <View style={styles.likeUserInfo}>
                        {renderProfileImage(like?.profile, like?.name)}
                        <Text style={styles.likeUserName}>{like?.name}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={fullImageModal}
          transparent
          animationType="fade"
          onRequestClose={closeFullImage}
        >
          <View style={styles.fullImageOverlay}>
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={closeFullImage}
            >
              <AntDesign name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.fullScreenBackground}
              activeOpacity={1}
              onPress={closeFullImage}
            />
          </View>
        </Modal>

        <Modal
          visible={reportModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeReportModal}
        >
          <View style={styles.overlay}>
            <View style={styles.reportModalContainer}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Report</Text>
                <TouchableOpacity
                  onPress={closeReportModal}
                  style={styles.reportCloseButton}
                >
                  <AntDesign name="close" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              </View>

              <View style={styles.reportContent}>
                <Text style={styles.reportQuestion}>
                  Why are you reporting this post?
                </Text>

                <ScrollView
                  style={styles.reportReasonList}
                  showsVerticalScrollIndicator={false}
                >
                  {[
                    "It's spam",
                    "Nudity or sexual activity",
                    "Hate speech or symbols",
                    "Violence or dangerous organizations",
                    "Sale of illegal or regulated goods",
                    "Bullying or harassment",
                    "Intellectual property violation",
                    "False information",
                    "Suicide, self-injury or eating disorders",
                    "I just don't like it",
                  ].map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reportReasonItem}
                      onPress={() => handleReportReason(reason)}
                    >
                      <Text style={styles.reportReasonText}>{reason}</Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={reportConfirmModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeConfirmModal}
        >
          <View style={styles.overlay}>
            <View style={styles.confirmModalContainer}>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmCheckmark}>
                  <MaterialIcons name="check" size={36} color="#FFFFFF" />
                </View>

                <Text style={styles.confirmTitle}>
                  Thanks for letting us know
                </Text>
                <Text style={styles.confirmSubtitle}>
                  Your feedback helps keep our community safe.
                </Text>
              </View>

              <View style={styles.confirmContent}>
                <Text style={styles.confirmActionTitle}>Other options</Text>

                <TouchableOpacity
                  style={styles.confirmActionItem}
                  onPress={() => handleBlockUser(postId)}
                >
                  <View style={styles.confirmActionIconContainer}>
                    <MaterialIcons name="block" size={24} color="#000000" />
                  </View>
                  <View style={styles.confirmActionTextContainer}>
                    <Text style={styles.confirmActionText}>Block user</Text>
                    <Text style={styles.confirmActionSubtext}>
                      They won't be able to find your profile or posts anymore.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={submitReport}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={blockConfirmModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeBlockConfirmModal}
        >
          <View style={styles.overlay2}>
            <View style={styles.confirmModalContainer2}>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmCheckmark}>
                  <MaterialIcons name="block" size={36} color="#FFFFFF" />
                </View>

                <Text style={styles.confirmTitle}>Block User</Text>
                <Text style={styles.confirmSubtitle}>
                  Are you sure you want to block this user? You won't be able to
                  find their posts anymore untill you unblock them.
                </Text>
              </View>

              <View style={styles.confirmContent}>
                <View style={styles.blockButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeBlockConfirmModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.blockButton}
                    onPress={confirmBlockUser}
                  >
                    <Text style={styles.blockButtonText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.editModalContainer}>
              <View style={styles.editHeader}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.editCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.editTitle}>Edit Post</Text>
                <TouchableOpacity onPress={saveEditedPost}>
                  <Text style={styles.editSaveButton}>Save</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editContent}>
                <TextInput
                  style={styles.editTextInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                  placeholder="Edit your post..."
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: Platform.OS === "ios" ? 50 : 0,
  },
  mainContainer: {
    flex: 1,
  },
  expandedContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  headerText: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#1DA1F2",
  },
  inputContainer: {
    paddingHorizontal: responsiveWidth(3),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
  },
  feedContainer: {
    paddingBottom: responsiveHeight(2),
  },
  postBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    minHeight: responsiveHeight(7),
  },
  postBoxExpanded: {
    minHeight: responsiveHeight(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
  },
  expandedInputContainer: {
    flex: 1,
  },
  closeButton: {
    alignSelf: "flex-end",
    backgroundColor: "#FF5757",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(1),
  },
  input: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    color: "#1DA1F2",
    textAlignVertical: "top",
    marginTop: responsiveHeight(1),
  },
  placeholderText: {
    color: "#8E8E8E",
    fontSize: responsiveFontSize(14),
  },
  postButton: {
    backgroundColor: "#FF5757",
    borderRadius: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
  },

  postContainer: {
    backgroundColor: "#ffffff",
    marginBottom: responsiveHeight(2),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
    margin: 8,
    position: "relative",
  },

  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1.5),
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    justifyContent: "center",
  },
  userName: {
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    color: "#000000",
  },
  timeText: {
    fontSize: responsiveFontSize(10),
    color: "#8E8E8E",
  },

  postContentContainer: {
    width: "100%",
    position: "relative",
  },
  textOnlyContainer: {
    padding: responsiveWidth(4),
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    margin: 10,
  },
  textOnlyInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: responsiveWidth(4),
    minHeight: responsiveWidth(40),
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postContent: {
    fontSize: responsiveFontSize(16),
    color: "#1DA1F2",
    lineHeight: 24,
    textAlign: "left",
    fontWeight: "400",
  },

  mediaWrapper: {
    position: "relative",
    width: "100%",
    height: responsiveWidth(100),
  },
  heartOverlay: {
    position: "absolute",
  },
  swiperContainer: {
    width: "100%",
    height: responsiveWidth(100),
  },
  slideItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaImageContainer: {
    width: "100%",
    height: "100%",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    bottom: -25,
    alignItems: "center",
  },
  activeDot: {
    backgroundColor: "#FF5757",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  inactiveDot: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  swiperButtonWrapper: {
    backgroundColor: "transparent",
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 0,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: "space-between",
    alignItems: "center",
  },
  swiperButtonText: {
    color: "black",
    fontSize: 50,
    fontWeight: "200",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  audioContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(5),
  },
  audioPlayerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: responsiveWidth(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: responsiveHeight(2),
  },
  audioProgressContainer: {
    flex: 1,
  },
  audioTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(0.5),
  },
  audioTimeText: {
    fontSize: responsiveFontSize(12),
    color: "#8E8E8E",
  },
  progressBarContainer: {
    position: "relative",
    height: responsiveHeight(2),
    width: "100%",
  },
  progressBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(0.8),
    backgroundColor: "#EEEEEE",
    borderRadius: 4,
  },
  progressBar: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 4,
  },
  progressBarTouchable: {
    position: "absolute",
    top: -responsiveHeight(1),
    left: 0,
    right: 0,
    height: responsiveHeight(3),
    justifyContent: "center",
  },
  progressBarHandle: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    backgroundColor: "#FF5757",
    position: "absolute",
  },
  audioWaveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: responsiveHeight(8),
    width: "100%",
    marginTop: responsiveHeight(2),
  },
  waveformBar: {
    width: responsiveWidth(0.8),
    marginHorizontal: responsiveWidth(0.5),
    borderRadius: 3,
  },

  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1),
  },
  actionButtonsRow: {
    flexDirection: "row",
    // backgroundColor: 'pink',
  },
  actionButton: {
    // marginRight: responsiveWidth(6),
    // paddingVertical: 8,
    // paddingHorizontal: 4,
    // backgroundColor: 'yellow',
    marginVertical: "auto",
  },

  likesContainer: {
    // paddingHorizontal: responsiveWidth(3),
    // paddingBottom: responsiveHeight(0.5),
    // backgroundColor: 'blue',
    paddingLeft: 5,
    marginVertical: "auto",
  },
  likesText: {
    fontSize: responsiveFontSize(12),
    fontWeight: "400",
    color: "#000000",
  },
  captionContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1),
  },
  captionFullText: {
    fontSize: responsiveFontSize(14),
    color: "#1DA1F2",
    lineHeight: 20,
  },
  seeMoreButton: {
    marginTop: responsiveHeight(0.5),
  },
  seeMoreText: {
    fontSize: responsiveFontSize(12),
    color: "#8E8E8E",
    fontWeight: "500",
  },
  commentsPreview: {
    // paddingHorizontal: responsiveWidth(3),
    // paddingVertical: responsiveHeight(0.5),
    // marginBottom: responsiveHeight(1),
    marginVertical: "auto",
    paddingLeft: 5,
  },
  viewCommentsText: {
    fontSize: responsiveFontSize(12),
    color: "#000000",
    // fontWeight: '500',
  },

  moreOptionsContainer: {
    position: "relative",
    marginVertical: "auto",
  },
  moreOptionsMenu: {
    position: "absolute",
    right: responsiveWidth(3),
    top: responsiveHeight(6),
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: responsiveWidth(50),
    zIndex: 1000,
  },
  moreOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveHeight(1.5),
  },
  moreOptionText: {
    marginLeft: responsiveWidth(3),
    fontSize: responsiveFontSize(14),
    color: "#000000",
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: "#DBDBDB",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: "80%",
    width: "100%",
    paddingTop: responsiveHeight(2),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(2),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  modalTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#1DA1F2",
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    padding: responsiveWidth(2),
  },
  likesScrollContainer: {
    flex: 1,
  },
  likesLoading: {
    padding: responsiveHeight(3),
    alignItems: "center",
  },
  noLikesContainer: {
    padding: responsiveHeight(3),
    alignItems: "center",
  },
  noLikesText: {
    fontSize: responsiveFontSize(14),
    color: "#8E8E8E",
  },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  likeUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeUserName: {
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    color: "#000000",
  },
  followButton: {
    backgroundColor: "#FF5757",
    paddingVertical: responsiveHeight(0.8),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: 4,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },

  fullImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullImageCloseButton: {
    position: "absolute",
    top: responsiveHeight(4),
    right: responsiveWidth(4),
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },

  reportModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: "70%",
    width: "100%",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(2),
    paddingBottom: responsiveHeight(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
    position: "relative",
  },
  reportTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#1DA1F2",
  },
  reportCloseButton: {
    position: "absolute",
    right: responsiveWidth(4),
    padding: responsiveWidth(2),
  },
  reportContent: {
    padding: responsiveWidth(4),
  },
  reportQuestion: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#1DA1F2",
    marginBottom: responsiveHeight(2),
    textAlign: "center",
  },
  reportReasonList: {
    maxHeight: "90%",
  },
  reportReasonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveHeight(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  reportReasonText: {
    fontSize: responsiveFontSize(14),
    color: "#000000",
  },

  confirmModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: "50%",
    width: "100%",
  },

  confirmModalContainer2: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    width: "90%",
    alignSelf: "center",
    overflow: "hidden",
  },

  confirmHeader: {
    backgroundColor: "#FFFFFF",
    padding: responsiveWidth(6),
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  confirmCheckmark: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: responsiveWidth(7),
    backgroundColor: "#1DA1F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  confirmTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "600",
    color: "#000000",
    marginBottom: responsiveHeight(1),
    textAlign: "center",
  },
  confirmSubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#8E8E8E",
    textAlign: "center",
    lineHeight: 22,
  },
  confirmContent: {
    padding: responsiveWidth(4),
  },
  confirmActionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#000000",
    marginBottom: responsiveHeight(2),
  },
  confirmActionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(2.5),
  },
  confirmActionIconContainer: {
    width: responsiveWidth(10),
    alignItems: "center",
  },
  confirmActionTextContainer: {
    flex: 1,
    marginLeft: responsiveWidth(3),
  },
  confirmActionText: {
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    color: "#000000",
  },
  confirmActionSubtext: {
    fontSize: responsiveFontSize(12),
    color: "#8E8E8E",
    marginTop: responsiveHeight(0.5),
  },
  doneButton: {
    backgroundColor: "#1DA1F2",
    borderRadius: 5,
    padding: responsiveHeight(1.5),
    alignItems: "center",
    marginTop: responsiveHeight(2),
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
  },

  editModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: "60%",
    width: "100%",
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(2),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  editTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#1DA1F2",
  },
  editCancelButton: {
    fontSize: responsiveFontSize(14),
    color: "#1DA1F2",
  },
  editSaveButton: {
    fontSize: responsiveFontSize(14),
    color: "#FF5757",
    fontWeight: "600",
  },
  editContent: {
    padding: responsiveWidth(4),
    flex: 1,
  },
  editTextInput: {
    fontSize: responsiveFontSize(16),
    color: "#1DA1F2",
    textAlignVertical: "top",
    flex: 1,
  },

  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(5),
    backgroundColor: "#FFFFFF",
  },
  noFeedTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "600",
    color: "#1DA1F2",
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(1),
  },
  noFeedSubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#8E8E8E",
    textAlign: "center",
    marginBottom: responsiveHeight(3),
    maxWidth: responsiveWidth(70),
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5757",
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(5),
    borderRadius: 5,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: responsiveWidth(2),
  },
  mediaWrapper: {
    position: "relative",
    width: "100%",
    height: responsiveWidth(100),
    overflow: "hidden",
  },
  swiperContainer: {
    height: responsiveWidth(100),
  },
  slideItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mediaImageContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    bottom: 0,
    zIndex: 10,
    paddingTop: 7,
    backgroundColor: "white",
  },
  activeDot: {
    backgroundColor: "#FF5757",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  inactiveDot: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  swiperButtonWrapper: {
    backgroundColor: "transparent",
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 0,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  swiperButtonText: {
    color: "#FF5757",
    fontSize: 50,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textOnlyContainer: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  textOnlyContent: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    fontWeight: "400",
  },

  readMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },

  readMoreText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
  },

  captionContainer: {
    paddingRight: 15,
    paddingLeft: 5,
    paddingVertical: 5,
  },

  captionFullText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },

  seeMoreButton: {
    marginTop: 2,
    marginBottom: 5,
  },

  seeMoreText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
  },
  separateAudioContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },

  audioContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    height: responsiveHeight(10),
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },

  audioPlayerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  audioPlayButton: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  audioProgressContainer: {
    flex: 1,
    height: 50,
    justifyContent: "center",
  },

  progressBarContainer: {
    height: 20,
    justifyContent: "center",
    position: "relative",
  },

  progressBarBackground: {
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },

  progressBar: {
    height: "100%",
    borderRadius: 2,
  },

  progressBarTouchable: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 10,
  },

  seekBarTouchable: {
    position: "absolute",
    top: -15,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 10,
  },

  audioTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  audioTimeText: {
    fontSize: 12,
    color: "#666",
  },
  notificationContainer: {
    position: "absolute",
    // top: 250,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newPostNotification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DA1F2",
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newPostText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
    marginLeft: responsiveWidth(2),
  },
  blockButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(2),
  },
  cancelButton: {
    backgroundColor: "#EFEFEF",
    borderRadius: 5,
    padding: responsiveHeight(1.5),
    alignItems: "center",
    flex: 1,
    marginRight: responsiveWidth(2),
  },
  cancelButtonText: {
    color: "#1DA1F2",
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
  },
  blockButton: {
    backgroundColor: "#1DA1F2",
    borderRadius: 5,
    padding: responsiveHeight(1.5),
    alignItems: "center",
    flex: 1,
    marginLeft: responsiveWidth(2),
  },
  blockButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  menuContainer: {
    position: "absolute",
    top: 45,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    width: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#4A5568",
  },
});

// export default AllFeed;
