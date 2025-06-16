import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import websocketConfig from "../../services/websocketconfig";
import { showToast } from "../../utils/Toaster";

const SessionChat = () => {
  const params = useLocalSearchParams();
  const { sessionId, sessionName, host_id } = params;
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [user, setUser] = useState(null);

  const ws = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    let isMounted = true;
    let wsConnection = null;

    const connectWebSocket = async () => {
      try {
        const gymId = await AsyncStorage.getItem("gym_id");
        const id = await AsyncStorage.getItem("client_id");

        if (!gymId || !isMounted || !id || !sessionId) {
          if (isMounted) {
            showToast({
              type: "error",
              title: "Error",
              desc: "Something went wrong. Please try again later",
            });
          }
          return;
        }

        wsConnection = await websocketConfig.createWebSocketConnection(
          "/chat",
          sessionId
        );

        if (wsConnection) {
          ws.current = wsConnection;

          wsConnection.onopen = () => {};

          wsConnection.onmessage = (event) => {
            if (!isMounted) return;

            try {
              const message = JSON.parse(event.data);

              if (message.status === 500) {
                if (isMounted) {
                  showToast({
                    type: "error",
                    title: "Server Error",
                    desc: "Could not fetch chat data. Please try again later.",
                  });
                }
                return;
              }

              if (message.action === "old_messages") {
                if (message.data) {
                  const sortedMessages = message.data.sort(
                    (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
                  );
                  const processedMessages = addDateSections(sortedMessages);
                  setMessages(processedMessages);
                  scrollToBottom();
                } else {
                }
              } else if (message.action === "new_message") {
                setMessages((prev) => [...prev, message.data]);
                scrollToBottom();
              } else if (message.action === "edit_message") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === message.data.id
                      ? { ...msg, ...message.data }
                      : msg
                  )
                );
              } else if (message.action === "delete_message") {
                const idsToDelete = message.data.message_ids;
                setMessages((prev) =>
                  prev.filter((msg) => !idsToDelete.includes(msg.id))
                );
              } else if (message.action === "error") {
                showToast({
                  type: "error",
                  title: "Error",
                  desc: message.message || "Unknown error occurred",
                });
              } else {
              }
            } catch (error) {
              console.error(
                "Error parsing WS message:",
                error,
                "Raw data:",
                event.data
              );
            } finally {
              if (isMounted) {
              }
            }
          };

          wsConnection.onerror = (error) => {
            if (isMounted) {
              // showToast({
              //   type: "error",
              //   title: "Connection Error",
              //   desc: "Failed to connect to the server. Please try again later",
              // });
            }
          };

          wsConnection.onclose = (e) => {
            if (isMounted) {
            }
          };
        }
      } catch (error) {
        if (isMounted) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Failed to connect. Please try again later",
          });
        }
      }
    };

    const loadSessionDetails = async () => {
      if (params.selectedSession) {
        try {
          const sessionData =
            typeof params.selectedSession === "string"
              ? JSON.parse(params.selectedSession)
              : params.selectedSession;
          setSessionDetails(sessionData);
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Error parsing session details",
          });
        }
      }
    };

    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("client_id");
        if (isMounted) {
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    connectWebSocket();
    fetchUserId();
    loadSessionDetails();

    return () => {
      isMounted = false;
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
      if (ws && ws.current) {
        ws.current = null;
      }
    };
  }, [sessionId, params.selectedSession]);

  const flatListRef = useRef(null);

  const addDateSections = (msgs) => {
    if (!msgs || msgs.length === 0) return [];

    let result = [];
    let currentDate = null;

    msgs.forEach((msg) => {
      const messageDate = new Date(msg.sent_at).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        result.push({
          isDateHeader: true,
          date: messageDate,
          id: `date-${messageDate}`,
        });
      }

      result.push(msg);
    });

    return result;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Type something to send",
      });
      return;
    }
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Connection is not open. Please try again later.",
      });
      return;
    }

    if (editingMessage) {
      const payload = {
        action: "edit",
        message_id: editingMessage.id,
        message: newMessage.trim(),
      };
      ws.current.send(JSON.stringify(payload));
      setEditingMessage(null);
    } else {
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
        action: "send",
        client_id,
        message: newMessage.trim(),
      };
      ws.current.send(JSON.stringify(payload));
    }
    setNewMessage("");
  };

  const handleLongPress = (message) => {
    if (message.isDateHeader) return;

    if (message.client_id == currentUserId) {
      setIsSelectionMode(true);
      setSelectedMessages([message.id]);
    }
  };

  const handleMessagePress = (message) => {
    if (message.isDateHeader) return;

    if (isSelectionMode) {
      setSelectedMessages((prev) => {
        if (prev.includes(message.id)) {
          return prev.filter((id) => id !== message.id);
        } else {
          if (message.client_id == currentUserId) {
            return [...prev, message.id];
          }
          return prev;
        }
      });
    }
  };

  const handleEdit = () => {
    if (selectedMessages.length !== 1) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please select only one message to edit",
      });
      return;
    }

    const messageToEdit = messages.find(
      (msg) => msg.id === selectedMessages[0]
    );
    if (!messageToEdit || messageToEdit.client_id != currentUserId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "You can only edit your own messages",
      });
      return;
    }

    setEditingMessage(messageToEdit);
    setNewMessage(messageToEdit.message);
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleDelete = () => {
    if (selectedMessages.length === 0) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${selectedMessages.length} message(s)?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            const payload = {
              action: "delete",
              message_ids: selectedMessages,
            };
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify(payload));
            }
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => !selectedMessages.includes(msg.id))
            );
            setIsSelectionMode(false);
            setSelectedMessages([]);
          },
          style: "destructive",
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (ws.current) {
      ws.current.close();
    }
    const wsUrl = `ws://2051-115-99-244-112.ngrok-free.app/ws/chat/${sessionId}?token=dummy_token_example`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => {
      setRefreshing(false);
    };
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("client_id");
        setCurrentUserId(userId);
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    };

    loadUserId();

    if (params.selectedSession) {
      try {
        const sessionData =
          typeof params.selectedSession === "string"
            ? JSON.parse(params.selectedSession)
            : params.selectedSession;

        setSessionDetails(sessionData);
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error parsing session details",
        });
      }
    }

    // fetchMessages();
  }, [params.selectedSession]);

  const renderItem = ({ item }) => {
    if (item.isDateHeader) {
      return (
        <View style={styles.dateHeaderContainer}>
          <View style={styles.dateHeaderLine} />
          <Text style={styles.dateHeaderText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          <View style={styles.dateHeaderLine} />
        </View>
      );
    }

    const isSelected = selectedMessages.includes(item.id);
    const isSelf = item.client_id == currentUserId;
    const isHost = item.client_id == host_id;

    return (
      <TouchableWithoutFeedback
        onLongPress={() => handleLongPress(item)}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.messageContainer}>
          {!isSelf && (
            <Text style={styles.senderName}>
              {isHost ? "Host" : item.client_name}
            </Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isSelf ? styles.sentBubble : styles.receivedBubble,
              isSelected && styles.selectedBubble,
              { minWidth: 80 },
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.sent_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderSessionDetails = () => {
    if (!sessionDetails) return null;

    return (
      <TouchableOpacity
        style={styles.sessionInfoContainer}
        onPress={() =>
          Alert.alert(
            "Session Details",
            `Date: ${new Date(
              sessionDetails.session_date
            ).toLocaleDateString()}\n` +
              `Time: ${sessionDetails.session_time}\n` +
              `Type: ${sessionDetails.workout_type} Workout\n` +
              `Participants: ${sessionDetails.participant_count}/${sessionDetails.participant_limit}`
          )
        }
      >
        <View style={styles.sessionInfoContent}>
          <View style={styles.sessionInfoRow}>
            <Ionicons name="calendar-outline" size={16} color="#FFF" />
            <Text style={styles.sessionInfoText}>
              {sessionDetails.session_date
                ? new Date(sessionDetails.session_date).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.sessionInfoRow}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.sessionInfoText}>
              {sessionDetails.session_time || "N/A"}
            </Text>
          </View>
          <View style={styles.sessionInfoRow}>
            <FontAwesome5 name="dumbbell" size={14} color="#FFF" />
            <Text style={styles.sessionInfoText}>
              {sessionDetails.workout_type || "General"} Workout
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={16} color="#FFF" />
      </TouchableOpacity>
    );
  };
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{sessionName || "Session Chat"}</Text>
        </View>

        {isSelectionMode ? (
          <View style={styles.selectionControls}>
            <TouchableOpacity
              onPress={cancelSelection}
              style={styles.headerButton}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.selectionCountText}>
              {selectedMessages.length} selected
            </Text>

            <TouchableOpacity
              onPress={handleEdit}
              style={styles.headerButton}
              disabled={selectedMessages.length !== 1}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={selectedMessages.length === 1 ? "#fff" : "#aaa"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={styles.headerButton}
              disabled={selectedMessages.length === 0}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={selectedMessages.length > 0 ? "#fff" : "#aaa"}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Ionicons name="chatbubbles" size={24} color={"#fff"} />
          </>
        )}
      </View>

      {renderSessionDetails()}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) =>
          item.isDateHeader
            ? item.id
            : item.id?.toString() || `index-${Math.random()}`
        }
        renderItem={renderItem}
        initialNumToRender={100}
        maxToRenderPerBatch={20}
        windowSize={21}
        ListFooterComponent={
          isLoading && (
            <ActivityIndicator
              size="small"
              color="#128C7E"
              style={styles.loader}
            />
          )
        }
        onContentSizeChange={() => {
          if (!refreshing) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.messagesList}
      />

      {/* Input Box */}
      <View style={styles.inputContainer}>
        {editingMessage && (
          <View style={styles.editingIndicator}>
            <Text style={styles.editingText}>Editing message</Text>
            <TouchableOpacity
              onPress={cancelEditing}
              style={styles.cancelButton}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons
            name={editingMessage ? "checkmark" : "send"}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    backgroundColor: "#006FAD",
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  headerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 5,
  },
  selectionControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectionCountText: {
    color: "#fff",
    marginHorizontal: 6,
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 5,
    // maxWidth: '85%',
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    marginBottom: 2,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sentBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#006FAD4D",
    borderBottomRightRadius: 5,
  },
  receivedBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
  },
  selectedBubble: {
    backgroundColor: "#BBDEFB",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: "#888",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 24,
    paddingRight: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#006FAD",
    padding: 10,
    borderRadius: 50,
    position: "absolute",
    right: 15,
    bottom: 15,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dateHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    justifyContent: "center",
  },
  dateHeaderText: {
    fontSize: 13,
    color: "#888",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  loader: {
    marginVertical: 20,
  },
  editingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  editingText: {
    fontSize: 13,
    color: "#6200EA",
    fontStyle: "italic",
  },
  cancelButton: {
    padding: 3,
  },
  sessionInfoContainer: {
    backgroundColor: "#006FAD80",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfoContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sessionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionInfoText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 5,
  },
});

export default SessionChat;
