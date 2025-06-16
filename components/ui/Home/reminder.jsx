import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  createReminderAPI,
  deleteRemindersAPI,
  getRemindersAPI,
} from "../../../services/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../../../utils/Toaster";
import ReminderCard from "../RemainderCard";
import FitnessLoader from "../FitnessLoader";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

const FloatingActionButton = ({ icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={1}>
      <Ionicons name={icon} size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const ChatModal = ({ visible, onClose, onAdd }) => {
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "What type of reminder would you like to set?", isAI: true },
  ]);
  const [reminderType, setReminderType] = useState("");
  const [reminderDetails, setReminderDetails] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [gymCount, setGymCount] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [waterInterval, setWaterInterval] = useState("");
  const [dietType, setDietType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notificationType, setNotificationType] = useState("push");
  const [currentStep, setCurrentStep] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const scrollViewRef = useRef(null);

  const formatToSQLDateTime = (date, timeString) => {
    if (!date || !timeString) return null;

    let dateString;
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = date;
    }

    const [hours, minutes] = timeString.split(":");

    return `${dateString} ${hours.padStart(2, "0")}:${minutes.padStart(
      2,
      "0"
    )}:00`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const day = tomorrow.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages]);

  const resetForm = () => {
    setChatMessages([
      {
        id: 1,
        text: "What type of reminder would you like to set?",
        isAI: true,
      },
    ]);
    setReminderType("");
    setReminderDetails("");
    setReminderTime("");
    setReminderTitle("");
    setGymCount("");
    setWaterAmount("");
    setWaterInterval("");
    setDietType("");
    setStartTime("");
    setEndTime("");
    setFrequency("");
    setNotificationType("");
    setCurrentStep(0);
    setTimeError("");
    setSelectedAmPm("AM");
    setSelectedDate("");
    setShowDatePicker(false);
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const addMessage = (text, isAI = true) => {
    const newMessage = {
      id: Date.now(),
      text,
      isAI,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const convert24To12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const convert12To24Hour = (hour, minute, ampm) => {
    let hour24 = parseInt(hour, 10);

    if (ampm === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  };

  const isTimePast = (timeString) => {
    if (!timeString) return false;

    const now = new Date();
    const [hours, minutes] = timeString.split(":");
    const selectedDate = new Date();
    selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return selectedDate < now;
  };

  const handleSubmit = () => {
    let title = "";
    let details = "";
    let othersTime = null;
    let finalReminderMode = reminderType;
    let isRecurring = frequency === "daily"; // Set to true only when frequency is "daily"

    if (reminderType === "water") {
      title = "Water Reminder";
      details = `Drink ${waterAmount}ml of water every ${waterInterval} hours between ${convert24To12Hour(
        startTime
      )} and ${convert24To12Hour(endTime)}`;
    } else if (reminderType === "diet") {
      title = `${dietType} Meal Reminder`;
      details = reminderDetails || `Time for your ${dietType.toLowerCase()}`;
    } else if (reminderType === "gym") {
      title = "Gym Crowd Alert";
      details = `Alert when less than ${gymCount} people are in the gym between ${convert24To12Hour(
        startTime
      )} and ${convert24To12Hour(endTime)}`;
    } else if (reminderType === "workout") {
      title = "Workout Reminder";
      details = reminderDetails || "Time for your workout session";
      finalReminderMode = "others"; // Send as others type

      // Calculate others_time based on frequency
      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    } else if (reminderType === "meeting") {
      title = "Meeting Reminder";
      details = reminderDetails || "Time for your meeting";
      finalReminderMode = "others"; // Send as others type

      // Calculate others_time based on frequency
      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    } else if (reminderType === "others") {
      title = reminderTitle;
      details = reminderDetails || "Custom reminder";

      // Calculate others_time based on frequency
      if (frequency === "custom_date" && selectedDate) {
        othersTime = formatToSQLDateTime(selectedDate, reminderTime);
      } else if (frequency === "daily") {
        const tomorrowDate = getTomorrowDate();
        othersTime = formatToSQLDateTime(tomorrowDate, reminderTime);
      }
    }

    onAdd({
      reminder_mode: finalReminderMode,
      title: title,
      details: details,
      intimation_start_time:
        reminderType === "water" || reminderType === "gym" ? startTime : null,
      intimation_end_time:
        reminderType === "water" || reminderType === "gym" ? endTime : null,
      reminder_time:
        reminderType === "diet" ||
        reminderType === "others" ||
        reminderType === "workout" ||
        reminderType === "meeting"
          ? reminderTime
          : null,
      is_recurring: frequency, // Use the boolean value instead of frequency string
      reminder_type: notificationType ? notificationType : "push",
      gym_count: reminderType === "gym" ? gymCount : null,
      diet_type: reminderType === "diet" ? dietType : null,
      water_timing: reminderType === "water" ? waterInterval : null,
      water_amount: reminderType === "water" ? waterAmount : null,
      others_time: othersTime, // Updated to include calculated datetime
    });

    resetForm();
    onClose();
  };
  const moveToNextStep = (userResponse, nextAIQuestion) => {
    if (isProcessingSelection) return;

    setIsProcessingSelection(true);

    if (userResponse) {
      addMessage(userResponse, false);
    }

    if (nextAIQuestion) {
      setTimeout(() => {
        addMessage(nextAIQuestion, true);
        setCurrentStep((prev) => prev + 1);
        setIsProcessingSelection(false);
      }, 500);
    } else {
      setIsProcessingSelection(false);
    }
  };

  const renderTypeSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("water");
            moveToNextStep(
              "Water reminder",
              "How much water would you like to drink each time?"
            );
          }}
        >
          <Ionicons name="water" size={24} color="#2196F3" />
          <Text style={styles.optionText}>Water</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("diet");
            moveToNextStep(
              "Diet reminder",
              "What type of meal would you like to be reminded about?"
            );
          }}
        >
          <Ionicons name="nutrition" size={24} color="#4CAF50" />
          <Text style={styles.optionText}>Diet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("gym");
            moveToNextStep(
              "Gym Crowd reminder",
              "Below what number of people in the gym would you like to be notified?"
            );
          }}
        >
          <Ionicons name="people" size={20} color="#FF9800" />
          <Text style={styles.optionText}>Gym Crowd</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("workout");
            moveToNextStep(
              "Workout reminder",
              "Please enter a description for this workout reminder"
            );
          }}
        >
          <Ionicons name="barbell" size={24} color="#6C5CE7" />
          <Text style={styles.optionText}>Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("meeting");
            moveToNextStep(
              "Meeting reminder",
              "Please enter a description for this meeting reminder"
            );
          }}
        >
          <Ionicons name="business" size={24} color="#6C5CE7" />
          <Text style={styles.optionText}>Meeting</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setReminderType("others");
            moveToNextStep(
              "Other reminder",
              "What would you like to title this reminder?"
            );
          }}
        >
          <Ionicons name="calendar" size={24} color="#6C5CE7" />
          <Text style={styles.optionText}>Others</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReminderTitleInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Enter a title for your reminder"
          value={reminderTitle}
          onChangeText={setReminderTitle}
        />
        <TouchableOpacity
          style={[styles.nextButton, !reminderTitle && styles.disabledButton]}
          disabled={!reminderTitle}
          onPress={() => {
            if (reminderTitle) {
              moveToNextStep(
                `Title: ${reminderTitle}`,
                "Please enter a description for this reminder"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter a title",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReminderDescriptionInput = () => {
    return (
      <View>
        <TextInput
          style={[styles.textInput, { height: 100, textAlignVertical: "top" }]}
          placeholder="Enter a description (optional)"
          multiline={true}
          numberOfLines={4}
          value={reminderDetails}
          onChangeText={setReminderDetails}
        />
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            moveToNextStep(
              reminderDetails
                ? `Description: ${reminderDetails}`
                : "No description provided",
              "What time would you like to be reminded?"
            );
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaterAmountInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Amount in ml (e.g., 250)"
          keyboardType="numeric"
          value={waterAmount}
          onChangeText={setWaterAmount}
        />
        <TouchableOpacity
          style={[styles.nextButton, !waterAmount && styles.disabledButton]}
          disabled={!waterAmount || isProcessingSelection}
          onPress={() => {
            if (waterAmount) {
              moveToNextStep(
                `${waterAmount}ml`,
                "How often would you like to be reminded to drink water?"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter an amount",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDietTypeSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Breakfast");
            moveToNextStep(
              "Breakfast reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Breakfast</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Lunch");
            moveToNextStep(
              "Lunch reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Lunch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Dinner");
            moveToNextStep(
              "Dinner reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Dinner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setDietType("Snack");
            moveToNextStep(
              "Snack reminder",
              "Any specific details about this meal reminder?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Snack</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGymCountInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="Number of people (e.g., 10)"
          keyboardType="numeric"
          value={gymCount}
          onChangeText={setGymCount}
        />
        <TouchableOpacity
          style={[styles.nextButton, !gymCount && styles.disabledButton]}
          disabled={!gymCount || isProcessingSelection}
          onPress={() => {
            if (gymCount) {
              moveToNextStep(
                `When fewer than ${gymCount} people`,
                "Between which hours would you like to be notified?"
              );
            } else {
              showToast({
                type: "error",
                title: "Error",
                desc: "Please enter a number",
              });
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaterIntervalSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("0.5");
            moveToNextStep(
              "Every half an hour",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every half an hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("1");
            moveToNextStep(
              "Every hour",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("2");
            moveToNextStep(
              "Every 2 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 2 hours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("3");
            moveToNextStep(
              "Every 3 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 3 hours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            setWaterInterval("4");
            moveToNextStep(
              "Every 4 hours",
              "Between which hours would you like to be notified?"
            );
          }}
          disabled={isProcessingSelection}
        >
          <Text style={styles.optionText}>Every 4 hours</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDietDetailsInput = () => {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Low carb breakfast, Protein-rich dinner"
          value={reminderDetails}
          onChangeText={setReminderDetails}
        />
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            moveToNextStep(
              reminderDetails
                ? `Details: ${reminderDetails}`
                : "No special details",
              "What time would you like to be reminded?"
            );
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimeRangeSelection = () => {
    const allTimeOptions = [
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
    ];

    const startTimeIndex = startTime ? allTimeOptions.indexOf(startTime) : -1;

    const availableEndTimes = startTime
      ? allTimeOptions.filter((_, index) => index > startTimeIndex)
      : [];

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        <Text style={styles.timeLabel}>Start Time:</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={styles.timeOptionsScrollView}
        >
          <View style={styles.timeOptionsContainer}>
            {allTimeOptions.map((time) => (
              <TouchableOpacity
                key={`start-${time}`}
                style={[
                  styles.timeOption,
                  startTime === time && styles.selectedTimeOption,
                ]}
                onPress={() => {
                  setStartTime(time);
                  setTimeError("");
                  if (
                    endTime &&
                    allTimeOptions.indexOf(endTime) <=
                      allTimeOptions.indexOf(time)
                  ) {
                    setEndTime("");
                  }
                }}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    startTime === time && styles.selectedTimeOptionText,
                  ]}
                >
                  {convert24To12Hour(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.timeLabel}>End Time:</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={styles.timeOptionsScrollView}
        >
          <View style={styles.timeOptionsContainer}>
            {availableEndTimes.map((time) => (
              <TouchableOpacity
                key={`end-${time}`}
                style={[
                  styles.timeOption,
                  endTime === time && styles.selectedTimeOption,
                ]}
                onPress={() => {
                  setEndTime(time);
                  setTimeError("");
                }}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    endTime === time && styles.selectedTimeOptionText,
                  ]}
                >
                  {convert24To12Hour(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {!startTime && (
          <Text style={styles.helperText}>
            Please select a start time first
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!startTime || !endTime) && styles.disabledButton,
          ]}
          disabled={!startTime || !endTime || isProcessingSelection}
          onPress={() => {
            if (startTime && endTime) {
              moveToNextStep(
                `Between ${convert24To12Hour(
                  startTime
                )} and ${convert24To12Hour(endTime)}`,
                "Is this reminder for today only or every day?"
              );
            }
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSingleTimeSelection = () => {
    const updateReminderTime = () => {
      const time24 = convert12To24Hour(
        selectedHour,
        selectedMinute,
        selectedAmPm
      );
      setReminderTime(time24);
      setShowTimePicker(false);
    };

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        {!showTimePicker ? (
          <View>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => {
                setShowTimePicker(true);
                setTimeError("");
              }}
            >
              <Ionicons name="time-outline" size={20} color="#6c63ff" />
              <Text style={styles.timePickerButtonText}>
                {reminderTime
                  ? convert24To12Hour(reminderTime)
                  : "Select a time"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                !reminderTime && styles.disabledButton,
              ]}
              disabled={!reminderTime || isProcessingSelection}
              onPress={() => {
                if (reminderTime) {
                  // All reminder types now follow the same flow - go to frequency selection
                  moveToNextStep(
                    `At ${convert24To12Hour(reminderTime)}`,
                    "Is this reminder for today only or every day?"
                  );
                }
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Select Time</Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hour</Text>
                <ScrollView
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = (i + 1).toString().padStart(2, "0");
                    return (
                      <TouchableOpacity
                        key={`hour-${hour}`}
                        style={[
                          styles.timePickerItem,
                          selectedHour === hour &&
                            styles.timePickerItemSelected,
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text
                          style={[
                            styles.timePickerItemText,
                            selectedHour === hour &&
                              styles.timePickerItemTextSelected,
                          ]}
                        >
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.timePickerSeparator}>:</Text>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minute</Text>
                <ScrollView
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                  ].map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timePickerItem,
                        selectedMinute === minute &&
                          styles.timePickerItemSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
                          selectedMinute === minute &&
                            styles.timePickerItemTextSelected,
                        ]}
                      >
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>AM/PM</Text>
                <View style={styles.amPmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      selectedAmPm === "AM" && styles.amPmButtonSelected,
                    ]}
                    onPress={() => setSelectedAmPm("AM")}
                  >
                    <Text
                      style={[
                        styles.amPmButtonText,
                        selectedAmPm === "AM" && styles.amPmButtonTextSelected,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      selectedAmPm === "PM" && styles.amPmButtonSelected,
                    ]}
                    onPress={() => setSelectedAmPm("PM")}
                  >
                    <Text
                      style={[
                        styles.amPmButtonText,
                        selectedAmPm === "PM" && styles.amPmButtonTextSelected,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={[styles.timePickerButton, styles.timePickerCancelButton]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timePickerButton,
                  styles.timePickerConfirmButton,
                ]}
                onPress={updateReminderTime}
              >
                <Text style={styles.timePickerConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFrequencySelection = () => {
    const handleFrequencySelection = (selectedFrequency) => {
      if (selectedFrequency === "today") {
        let timeToCheck;
        if (reminderType === "diet") {
          timeToCheck = reminderTime;
        } else {
          timeToCheck = endTime;
        }

        if (isTimePast(timeToCheck)) {
          setTimeError(
            "You've selected a time in the past. Please choose a future time or select 'Every day' instead."
          );
          return;
        }
      }

      setFrequency(selectedFrequency);
      setTimeError("");

      if (
        reminderType === "others" ||
        reminderType === "workout" ||
        reminderType === "meeting"
      ) {
        if (selectedFrequency === "custom_date") {
          // Initialize date picker with tomorrow's date
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setSelectedDay(tomorrow.getDate().toString());
          setSelectedMonth((tomorrow.getMonth() + 1).toString());
          setSelectedYear(tomorrow.getFullYear().toString());
          setShowDatePicker(true);
          moveToNextStep(
            "Custom date",
            "Please select the date for your reminder"
          );
        } else {
          // For "daily" frequency, go directly to confirmation
          moveToNextStep("Every day", "Would you like to save this reminder?");
          // Don't increment currentStep again since moveToNextStep already does it
          // The next step will show renderFinalConfirmation
        }
      } else {
        // For water, diet, gym reminders
        moveToNextStep(
          selectedFrequency === "today" ? "Today only" : "Every day",
          "Would you like to save this reminder?"
        );
      }
    };

    return (
      <View>
        {timeError ? (
          <View>
            <Text style={styles.errorText}>{timeError}</Text>
            <TouchableOpacity
              style={[styles.backButton, { marginBottom: 10 }]}
              onPress={() => {
                setTimeError("");
                setCurrentStep(currentStep - 1);
              }}
            >
              <Text style={styles.backButtonText}>
                Go Back to Time Selection
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.optionsContainer}>
          {(reminderType === "water" ||
            reminderType === "diet" ||
            reminderType === "gym") && (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleFrequencySelection("today")}
              disabled={isProcessingSelection}
            >
              <Ionicons name="today" size={24} color="#6c63ff" />
              <Text style={styles.optionText}>Today only</Text>
            </TouchableOpacity>
          )}

          {(reminderType === "others" ||
            reminderType === "workout" ||
            reminderType === "meeting") && (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleFrequencySelection("custom_date")}
              disabled={isProcessingSelection}
            >
              <Ionicons name="calendar-outline" size={24} color="#6c63ff" />
              <Text style={styles.optionText}>Select Date</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleFrequencySelection("daily")}
            disabled={isProcessingSelection}
          >
            <Ionicons name="repeat" size={24} color="#6c63ff" />
            <Text style={styles.optionText}>Every day</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderCustomDateSelection = () => {
    const updateSelectedDate = () => {
      if (!selectedDate) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setTimeError(
          "Selected date is in the past. Please choose today or a future date."
        );
        return;
      }

      // Better datetime validation - preserve local timezone
      const selectedDateTime = new Date(selectedDate);
      const [hours, minutes] = reminderTime.split(":");
      selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const now = new Date();

      if (selectedDateTime < now) {
        setTimeError(
          "Selected date and time is in the past. Please choose a future date and time."
        );
        return;
      }

      // Format date string for storage (YYYY-MM-DD format)
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      setSelectedDate(dateString);
      setShowDatePicker(false);
      setTimeError("");

      const formattedDate = selectedDate.toLocaleDateString();
      moveToNextStep(
        `Date: ${formattedDate}`,
        "Would you like to save this reminder?"
      );
    };

    const handleDateChange = (event, date) => {
      if (event.type === "dismissed") {
        setShowDatePicker(false);
        setCurrentStep(currentStep - 1);
        return;
      }

      if (date) {
        // Check if selected date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
          setTimeError(
            "Selected date is in the past. Please choose today or a future date."
          );
          return;
        }

        setSelectedDate(date);
        setTimeError("");

        // For Android, automatically proceed after selection
        if (Platform.OS === "android") {
          // Better datetime validation - preserve local timezone
          const selectedDateTime = new Date(date);
          const [hours, minutes] = reminderTime.split(":");
          selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const now = new Date();

          if (selectedDateTime < now) {
            setTimeError(
              "Selected date and time is in the past. Please choose a future date and time."
            );
            return;
          }

          setShowDatePicker(false);
          const formattedDate = date.toLocaleDateString();
          moveToNextStep(
            `Date: ${formattedDate}`,
            "Would you like to save this reminder?"
          );
        }
      }
    };

    // Get minimum date (tomorrow)
    const getMinimumDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    };

    // Get maximum date (1 year from now)
    const getMaximumDate = () => {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return maxDate;
    };

    return (
      <View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Date</Text>

            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    styles.datePickerCancelButton,
                  ]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentStep(currentStep - 1);
                  }}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    styles.datePickerConfirmButton,
                    !selectedDate && styles.disabledButton,
                  ]}
                  onPress={updateSelectedDate}
                  disabled={!selectedDate}
                >
                  <Text style={styles.datePickerConfirmButtonText}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <DateTimePicker
              value={selectedDate || getMinimumDate()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              textColor="#000000"
              onChange={handleDateChange}
              minimumDate={getMinimumDate()}
              maximumDate={getMaximumDate()}
              style={styles.dateTimePicker}
            />
          </View>
        )}
      </View>
    );
  };

  const renderFinalConfirmation = () => {
    return (
      <View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: "#f44336", marginTop: 10 },
          ]}
          onPress={() => {
            resetForm();
            onClose();
          }}
        >
          <Text style={styles.submitButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentInput = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        if (reminderType === "water") {
          return renderWaterAmountInput();
        } else if (reminderType === "diet") {
          return renderDietTypeSelection();
        } else if (reminderType === "gym") {
          return renderGymCountInput();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderReminderDescriptionInput();
        } else if (reminderType === "others") {
          return renderReminderTitleInput();
        }
        break;
      case 2:
        if (reminderType === "water") {
          return renderWaterIntervalSelection();
        } else if (reminderType === "diet") {
          return renderDietDetailsInput();
        } else if (reminderType === "gym") {
          return renderTimeRangeSelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderSingleTimeSelection();
        } else if (reminderType === "others") {
          return renderReminderDescriptionInput();
        }
        break;
      case 3:
        if (reminderType === "water") {
          return renderTimeRangeSelection();
        } else if (reminderType === "diet") {
          return renderSingleTimeSelection();
        } else if (reminderType === "gym") {
          return renderFrequencySelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          return renderFrequencySelection();
        } else if (reminderType === "others") {
          return renderSingleTimeSelection();
        }
        break;
      case 4:
        if (reminderType === "water" || reminderType === "diet") {
          return renderFrequencySelection();
        } else if (reminderType === "gym") {
          return renderFinalConfirmation();
        } else if (reminderType === "others") {
          return renderFrequencySelection();
        } else if (reminderType === "workout" || reminderType === "meeting") {
          // Check if custom date was selected and we need to show date picker
          if (frequency === "custom_date") {
            return renderCustomDateSelection();
          } else {
            // For daily frequency, show final confirmation
            return renderFinalConfirmation();
          }
        }
        break;
      case 5:
        // This should handle final confirmation for all types
        if (reminderType === "water" || reminderType === "diet") {
          return renderFinalConfirmation();
        } else if (reminderType === "others") {
          // Check if custom date was selected and we need to show date picker
          if (frequency === "custom_date") {
            return renderCustomDateSelection();
          } else {
            // For daily frequency, show final confirmation
            return renderFinalConfirmation();
          }
        } else {
          // For workout/meeting after custom date selection
          return renderFinalConfirmation();
        }
        break;
      case 6:
        return renderFinalConfirmation();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={(e) => {
              e.stopPropagation();
              Keyboard.dismiss();
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set a New Reminder</Text>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    onClose();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContentContainer}
              >
                {chatMessages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      message.isAI
                        ? styles.aiMessageContainer
                        : styles.userMessageContainer,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.isAI ? styles.aiMessage : styles.userMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.isAI
                            ? styles.aiMessageText
                            : styles.userMessageText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                    {message.isAI && (
                      <View style={styles.aiAvatar}>
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={16}
                          color="#fff"
                        />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.inputContainer}>{renderCurrentInput()}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const Reminders = ({ scrollY }) => {
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const getReminders = async () => {
    setLoading(true);
    try {
      const clientId = await AsyncStorage.getItem("client_id");

      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const response = await getRemindersAPI(clientId);
      if (response?.status === 200) {
        setReminders(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    getReminders();
  }, []);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const animatedStyle = {
    transform: [{ scale }],
  };

  const handleAddReminder = async (newReminder) => {
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");

      if (!clientId || !gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
      const payload = {
        ...newReminder,
        client_id: clientId,
        gym_id: gymId,
      };

      const response = await createReminderAPI(payload);

      if (response?.status === 200) {
        getReminders();
        showToast({
          type: "success",
          title: "Success",
          desc: "Reminder Added Successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await deleteRemindersAPI(id);
              if (response?.status === 200) {
                getReminders();
                showToast({
                  type: "success",
                  title: "Success",
                  desc: "Reminder deleted Successfully",
                });
              } else {
                showToast({
                  type: "error",
                  title: "Error",
                  desc:
                    response?.detail ||
                    "Something went wrong. Please try again later",
                });
              }
            } catch (err) {
              showToast({
                type: "error",
                title: "Error",
                desc: "Something went wrong. Please try again later",
              });
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return <FitnessLoader />;
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingTop: 240 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {reminders.length > 0 ? (
          <ScrollView style={styles.remindersList}>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.reminder_id}
                reminder={reminder}
                onDelete={() => handleDeleteReminder(reminder.reminder_id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateText}>No reminders set</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first reminder
            </Text>
          </View>
        )}
      </Animated.ScrollView>
      <FloatingActionButton icon="add" onPress={() => setModalVisible(true)} />
      <ChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddReminder}
      />
    </View>
  );
};

export default Reminders;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    marginBottom: 20,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  remindersList: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  reminderItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
  },
  reminderIcon: {
    marginRight: 15,
    justifyContent: "center",
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  reminderDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  reminderTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  reminderMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  reminderFrequency: {
    fontSize: 11,
    color: "#777",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reminderFrequencyText: {
    fontSize: 11,
    color: "#777",
  },
  reminderNotificationType: {
    fontSize: 11,
    color: "#777",
  },
  deleteButton: {
    justifyContent: "center",
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  chatContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  chatContentContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  aiMessage: {
    backgroundColor: "#f0f0f5",
    borderTopLeftRadius: 5,
  },
  userMessage: {
    backgroundColor: "#6c63ff",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: "#333",
  },
  userMessageText: {
    color: "#fff",
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 12,
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: width / 2 - 30,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    alignSelf: "flex-end",
    width: 100,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  timeOption: {
    width: width / 4 - 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    padding: 5,
    margin: 5,
    alignItems: "center",
  },
  selectedTimeOption: {
    backgroundColor: "#6c63ff",
    borderColor: "#6c63ff",
  },
  timeOptionText: {
    fontSize: 12,
    color: "#333",
  },
  selectedTimeOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timePickerColumn: {
    width: 80,
    alignItems: "center",
  },
  timePickerLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  timePickerSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 15,
  },
  timePickerScroll: {
    height: 150,
    width: "100%",
  },
  timePickerScrollContent: {
    paddingVertical: 10,
  },
  timePickerItem: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerItemSelected: {
    backgroundColor: "#6c63ff",
    borderRadius: 8,
  },
  timePickerItemText: {
    fontSize: 14,
    color: "#333",
  },
  timePickerItemTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timePickerCancelButton: {
    backgroundColor: "#f0f0f5",
    flex: 1,
    marginRight: 10,
  },
  timePickerCancelButtonText: {
    color: "#666",
  },
  timePickerConfirmButton: {
    backgroundColor: "#6c63ff",
    flex: 1,
    marginLeft: 10,
  },
  timePickerConfirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  amPmContainer: {
    flexDirection: "column",
    height: 100,
    justifyContent: "center",
  },
  amPmButton: {
    padding: 5,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    margin: 4,
  },
  amPmButtonSelected: {
    backgroundColor: "#6c63ff",
    borderColor: "#6c63ff",
  },
  amPmButtonText: {
    fontSize: 12,
    color: "#333",
  },
  amPmButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "#f44336",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  timeOptionsScrollView: {
    maxHeight: 120,
    marginBottom: 10,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 5,
    fontStyle: "italic",
  },
  backButton: {
    backgroundColor: "#f0f0f5",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 90 : 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1595A3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  datePickerButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
  },
  datePickerCancelButton: {
    backgroundColor: "#f0f0f5",
    marginRight: 10,
  },
  datePickerCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerConfirmButton: {
    backgroundColor: "#6c63ff",
    marginLeft: 10,
  },
  datePickerConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateTimePicker: {
    height: 200,
    marginVertical: 10,
  },
});
