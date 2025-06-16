import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Animated,
  Platform,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  AntDesign,
  FontAwesome5,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import DraggableFlatList from "react-native-draggable-flatlist";
import { showToast } from "../utils/Toaster";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const MAX_MEDIA_ITEMS = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_INPUT_HEIGHT = 60;
const MAX_INPUT_HEIGHT = 150;

const MediaInputComponent = ({ onMediaSubmit }) => {
  const [text, setText] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [isMediaOptionsVisible, setMediaOptionsVisible] = useState(false);
  const [audioRecording, setAudioRecording] = useState(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [selectedMediaUris, setSelectedMediaUris] = useState([]);
  const audioRecordingRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const [inputContentHeight, setInputContentHeight] =
    useState(MIN_INPUT_HEIGHT);
  const inputHeight = useRef(new Animated.Value(MIN_INPUT_HEIGHT)).current;
  const textInputRef = useRef(null);

  const hasContent = text.trim() !== "" || mediaItems.length > 0;
  const isMaxMediaReached = mediaItems.length >= MAX_MEDIA_ITEMS;

  // Add audio configuration function
  const configureAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Failed to configure audio mode:", error);
    }
  };

  // Configure audio mode when component mounts
  useEffect(() => {
    configureAudioMode();
  }, []);

  const isMediaUnique = useCallback(
    (newItem) => {
      return !mediaItems.some(
        (existingItem) =>
          existingItem.uri === newItem.uri ||
          (existingItem.type === newItem.type &&
            (existingItem.fileName === newItem.fileName ||
              existingItem.uri === newItem.uri))
      );
    },
    [mediaItems]
  );

  useEffect(() => {
    Animated.timing(inputHeight, {
      toValue: Math.min(
        Math.max(inputContentHeight, MIN_INPUT_HEIGHT),
        MAX_INPUT_HEIGHT
      ),
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [inputContentHeight]);

  const pickMediaFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Error",
          desc: "Sorry, we need camera roll permissions to make this work!",
        });
        return;
      }

      if (mediaItems.length >= MAX_MEDIA_ITEMS) {
        showToast({
          type: "error",
          title: "Media Limit Exceed",
          desc: `You can only add up to ${MAX_MEDIA_ITEMS} media items.`,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_MEDIA_ITEMS - mediaItems.length,
        allowsEditing: false,
        exif: false,
        base64: false,
      });

      if (!result.canceled) {
        const newMediaItems = result.assets
          .filter((asset) => {
            const newItem = {
              type: asset.type === "image" ? "image" : "video",
              uri: asset.uri,
              fileSize: asset.fileSize || 0,
              fileName: asset.fileName || "unknown",
            };
            return isMediaUnique(newItem) && newItem.fileSize <= MAX_FILE_SIZE;
          })
          .map((asset) => ({
            type: asset.type === "image" ? "image" : "video",
            uri: asset.uri,
            fileSize: asset.fileSize || 0,
            fileName: asset.fileName || "unknown",
          }));

        const updatedMediaItems = [...mediaItems, ...newMediaItems].slice(
          0,
          MAX_MEDIA_ITEMS
        );
        setMediaItems(updatedMediaItems);

        const newUris = newMediaItems.map((item) => item.uri);
        const combinedUris = [...selectedMediaUris, ...newUris];
        const uniqueUris = [...new Set(combinedUris)].slice(0, MAX_MEDIA_ITEMS);
        setSelectedMediaUris(uniqueUris);

        if (newMediaItems.length === 0) {
          showToast({
            type: "error",
            title: "Duplicate Media",
            desc: "The selected media is already added or exceeds file size limit.",
          });
        }

        setMediaOptionsVisible(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to pick media from gallery",
      });
    }
  };

  const takePhotoFromCamera = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } =
        await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted" || mediaLibraryStatus !== "granted") {
        showToast({
          type: "info",
          title: "Permission needed",
          desc: "Sorry, we need camera and media library permissions to make this work!",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        const newMediaItem = {
          type: "image",
          uri: asset.uri,
          fileSize: asset.fileSize || 0,
          fileName: asset.fileName || "camera_capture.jpg",
        };

        if (
          isMediaUnique(newMediaItem) &&
          newMediaItem.fileSize <= MAX_FILE_SIZE
        ) {
          const savedAsset = await MediaLibrary.createAssetAsync(asset.uri);
          await MediaLibrary.createAlbumAsync("YourAppName", savedAsset, false);

          const updatedMediaItems = [...mediaItems, newMediaItem].slice(
            0,
            MAX_MEDIA_ITEMS
          );
          setMediaItems(updatedMediaItems);

          setMediaOptionsVisible(false);
        } else {
          showToast({
            type: "error",
            title: "Duplicate Media",
            desc: "This media is already added or exceeds file size limit.",
          });
        }
      }
    } catch (error) {
      console.error("Camera photo error:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to take photo",
      });
    }
  };

  const removeMediaItem = useCallback(
    (indexToRemove) => {
      if (indexToRemove < 0 || indexToRemove >= mediaItems.length) {
        console.error("Invalid index for media removal", {
          index: indexToRemove,
          mediaItemsLength: mediaItems.length,
        });
        return;
      }

      const removedItem = mediaItems[indexToRemove];

      if (!removedItem) {
        console.error("Media item at specified index is undefined", {
          index: indexToRemove,
          mediaItems: mediaItems,
        });
        return;
      }

      const updatedMediaItems = mediaItems.filter(
        (_, index) => index !== indexToRemove
      );

      setMediaItems(updatedMediaItems);
      if (removedItem.uri) {
        setSelectedMediaUris((prev) =>
          prev.filter((uri) => uri !== removedItem.uri)
        );
      }
    },
    [mediaItems]
  );

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  const startRecording = async () => {
    try {
      // Configure audio mode first
      await configureAudioMode();

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "info",
          title: "Permission needed",
          desc: "Sorry, we need audio recording permissions!",
        });
        return;
      }

      // Give iOS time to finalize AVAudioSession state
      await wait(500);

      // Attempt recording (with auto-retry)
      await attemptRecordingWithRetry();
    } catch (err) {
      // showToast({
      //   type: "error",
      //   title: "Recording Error",
      //   desc: "Could not start audio recording. Please try again.",
      // });
    }
  };

  const attemptRecordingWithRetry = async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();

      audioRecordingRef.current = recording;
      setAudioRecording(recording);
      setRecordingTimer(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      await wait(500);

      try {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        await recording.startAsync();

        audioRecordingRef.current = recording;
        setAudioRecording(recording);
        setRecordingTimer(0);

        timerIntervalRef.current = setInterval(() => {
          setRecordingTimer((prev) => prev + 1);
        }, 1000);
      } catch (retryErr) {
        // showToast({
        //   type: "error",
        //   title: "Recording Error",
        //   desc: "Could not start audio recording. Please try again.",
        // });
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (!audioRecordingRef.current) return;

      clearInterval(timerIntervalRef.current);
      await audioRecordingRef.current.stopAndUnloadAsync();
      const uri = audioRecordingRef.current.getURI();

      if (uri) {
        const newAudioItem = {
          type: "audio",
          uri: uri,
          duration: recordingTimer,
        };
        setMediaItems((prev) =>
          [...prev, newAudioItem].slice(0, MAX_MEDIA_ITEMS)
        );
      }

      setAudioRecording(null);
      audioRecordingRef.current = null;
      setRecordingTimer(0);
    } catch (err) {
      console.error("Failed to stop recording", err);
      showToast({
        type: "error",
        title: "Recording Error",
        desc: "Could not stop audio recording",
      });
    }
  };

  const renderMediaIcon = (type) => {
    switch (type) {
      case "image":
        return <MaterialIcons name="image" size={20} color="#42A5F5" />;
      case "video":
        return <MaterialIcons name="video-library" size={20} color="#42A5F5" />;
      case "audio":
        return <MaterialIcons name="audiotrack" size={20} color="#42A5F5" />;
      default:
        return null;
    }
  };

  const renderMediaPreview = ({ item, index, drag, isActive }) => {
    if (!item) {
      console.error("Attempting to render undefined media item", {
        index,
        mediaItems: mediaItems,
        fullItemList: JSON.stringify(mediaItems, null, 2),
      });
      return null;
    }

    const safeIndex =
      typeof index === "number"
        ? index
        : mediaItems.findIndex((mediaItem) => mediaItem === item);

    return (
      <TouchableOpacity
        delayLongPress={300}
        style={[
          styles.mediaPreviewItem,
          {
            backgroundColor: isActive ? "#e0e0e0" : "transparent",
          },
        ]}
        onLongPress={drag}
      >
        {item.type === "image" || item.type === "video" ? (
          <Image source={{ uri: item.uri }} style={styles.mediaPreviewImage} />
        ) : item.type === "audio" ? (
          <View style={styles.audioPreview}>
            <MaterialIcons name="audiotrack" size={30} color="#42A5F5" />
            <Text>{`${item.duration}s`}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.removeMediaButton}
          onPress={() => {
            removeMediaItem(safeIndex);
          }}
        >
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>

        <View style={styles.mediaTypeIndicator}>
          {renderMediaIcon(item.type)}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {mediaItems.length > 0 && (
        <View style={styles.mediaPreviewContainer}>
          <DraggableFlatList
            data={mediaItems}
            renderItem={renderMediaPreview}
            keyExtractor={(item, index) => {
              return item?.uri || `draggable-item-${index}`;
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            onDragEnd={({ data }) => {
              setMediaItems(data);
            }}
            contentContainerStyle={styles.mediaPreviewList}
          />
        </View>
      )}

      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <Animated.View
            style={[styles.textInputWrapper, { height: inputHeight }]}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts..."
              placeholderTextColor="#999"
              multiline
              value={text}
              onChangeText={(newText) => {
                setText(newText);
              }}
              onContentSizeChange={(event) => {
                const { contentSize } = event.nativeEvent;
                setInputContentHeight(contentSize.height);
              }}
              scrollEnabled
            />
            <TouchableOpacity
              style={[
                styles.attachButton,
                isMaxMediaReached && styles.disabledButton,
              ]}
              onPress={() => setMediaOptionsVisible(!isMediaOptionsVisible)}
              disabled={isMaxMediaReached}
            >
              <MaterialIcons
                name="attach-file"
                size={24}
                color={isMaxMediaReached ? "#ccc" : "#1DA1F2"}
              />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.voiceRecordButton,
                isMaxMediaReached && styles.disabledButton,
              ]}
              onPress={audioRecording ? stopRecording : startRecording}
              disabled={isMaxMediaReached && !audioRecording}
            >
              {audioRecording ? (
                <View style={styles.recordingContainer}>
                  <Ionicons name="stop-circle" size={36} color="#42A5F5" />
                  <Text style={styles.recordingTimer}>{recordingTimer}s</Text>
                </View>
              ) : (
                <Ionicons
                  name="mic"
                  size={25}
                  color={isMaxMediaReached ? "#ccc" : "#1DA1F2"}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[!hasContent && styles.disabledSubmitButton]}
              onPress={() => {
                if (hasContent) {
                  onMediaSubmit({
                    text,
                    mediaItems,
                  });
                  setText("");
                  setMediaItems([]);
                }
              }}
              disabled={!hasContent}
            >
              {hasContent ? (
                <LinearGradient
                  colors={["#ffffff", "#ffffff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  <MaterialIcons name="send" size={24} color="#1DA1F2" />
                </LinearGradient>
              ) : (
                <View style={styles.submitButton}>
                  <MaterialIcons name="send" size={24} color="#1DA1F2" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isMediaOptionsVisible && (
          <View style={styles.mediaOptionsContainer}>
            <TouchableOpacity
              style={styles.mediaOption}
              onPress={pickMediaFromGallery}
            >
              <MaterialIcons name="photo-library" size={24} color="#42A5F5" />
              <Text style={styles.mediaOptionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaOption}
              onPress={takePhotoFromCamera}
            >
              <MaterialIcons name="camera-alt" size={24} color="#42A5F5" />
              <Text style={styles.mediaOptionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  mediaPreviewContainer: {
    marginBottom: 10,
  },
  mediaPreviewList: {
    paddingBottom: 10,
  },
  inputSection: {
    flexDirection: "column",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0.5, height: 0.5 },
    shadowOpacity: 2,
    shadowRadius: 1,
    elevation: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(29, 160, 242, 0.04)",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1DA1F2",
  },
  textInput: {
    flex: 1,
    minHeight: 60,
    maxHeight: 150,
    fontSize: 16,
    color: "#333",
    paddingTop: Platform.OS === "ios" ? 20 : 10,
  },
  attachButton: {
    marginLeft: 10,
    transform: [{ rotate: "45deg" }],
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginLeft: 5,
    alignItems: "center",
    gap: 5,
  },
  voiceRecordButton: {
    alignItems: "center",
  },
  recordingContainer: {
    alignItems: "center",
  },
  recordingTimer: {
    fontSize: 12,
    color: "#42A5F5",
  },
  submitButton: {
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1DA1F2",
    backgroundColor: "rgba(29, 160, 242, 0.04)",
  },
  disabledSubmitButton: {
    opacity: 0.5,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  mediaOptionsContainer: {
    marginTop: 10,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  mediaOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  mediaOptionText: {
    marginLeft: 10,
    color: "#42A5F5",
  },
  mediaPreviewItem: {
    position: "relative",
    marginRight: 10,
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  audioPreview: {
    width: 100,
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  removeMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaTypeIndicator: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 15,
    padding: 5,
  },
});

export default MediaInputComponent;
