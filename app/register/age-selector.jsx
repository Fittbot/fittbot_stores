import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Color, linearGradientColors } from "../../GlobalStyles";
import ContinueButton from "../../components/ui/Register/ContinueButton";
import { LinearGradient } from "expo-linear-gradient";
import MobileLogo from "../../components/ui/Register/MobileLogo";
import CardTitle from "../../components/ui/Register/CardTitle";

// Scroll selector dimensions
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const SELECTOR_WIDTH = 80;

const DateOfBirthSelector = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedYear, setSelectedYear] = useState(1999);
  const [isInitialized, setIsInitialized] = useState(false);

  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  const { gender, full_name } = params;

  const SCREEN_WIDTH = Dimensions.get("window").width;
  // const SELECTOR_WIDTH = (SCREEN_WIDTH - 110) / 3;
  const SELECTOR_WIDTH = (SCREEN_WIDTH - 110) / 3;
  const ITEM_HEIGHT = 50;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  ).reverse();

  const formatMonth = (month) => {
    return [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][month - 1];
  };

  useEffect(() => {
    if (params.dateOfBirth && !isInitialized) {
      const [year, month, day] = params.dateOfBirth.split("-").map(Number);

      setSelectedYear(year || 1999);
      setSelectedMonth(month || 6);
      setSelectedDay(day || 15);
      setIsInitialized(true);
    } else if (!isInitialized) {
      setSelectedMonth(6);
      setSelectedDay(15);
      setSelectedYear(1999);
      setIsInitialized(true);
    }
  }, [params, isInitialized]);

  useEffect(() => {
    if (
      !isInitialized ||
      !monthScrollRef.current ||
      !dayScrollRef.current ||
      !yearScrollRef.current
    ) {
      return;
    }

    setTimeout(() => {
      if (monthScrollRef.current) {
        const monthIndex = months.findIndex((m) => m === selectedMonth);
        if (monthIndex >= 0) {
          monthScrollRef.current.scrollTo({
            y: monthIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }

      if (dayScrollRef.current) {
        const dayIndex = days.findIndex((d) => d === selectedDay);
        if (dayIndex >= 0) {
          dayScrollRef.current.scrollTo({
            y: dayIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }

      if (yearScrollRef.current) {
        const yearIndex = years.findIndex((y) => y === selectedYear);
        if (yearIndex >= 0) {
          yearScrollRef.current.scrollTo({
            y: yearIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }
    }, 50);
  }, [selectedMonth, selectedDay, selectedYear, isInitialized]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleMonthScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / ITEM_HEIGHT);
    const newMonth = months[currentIndex];

    if (newMonth && newMonth !== selectedMonth) {
      debounce(() => setSelectedMonth(newMonth), 100)();
    }
  };

  const handleDayScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / ITEM_HEIGHT);
    const newDay = days[currentIndex];

    if (newDay && newDay !== selectedDay) {
      debounce(() => setSelectedDay(newDay), 100)();
    }
  };

  const handleYearScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / ITEM_HEIGHT);
    const newYear = years[currentIndex];

    if (newYear && newYear !== selectedYear) {
      debounce(() => setSelectedYear(newYear), 100)();
    }
  };

  const handleScrollEnd =
    (scrollRef, dataArray, selectedValue, setSelectedValue) =>
    async (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const newValue = dataArray[index];

      if (newValue && newValue !== selectedValue) {
        setSelectedValue(newValue);
        // Ensure smooth scroll to the selected item
        scrollRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      }
    };

  const handleItemPress = (scrollRef, value, index, setSelectedValue) => {
    setSelectedValue(value);
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  const renderScrollSelector = (
    scrollRef,
    dataArray,
    selectedValue,
    label,
    setSelectedValue,
    formatFunc = (val) => val
  ) => {
    return (
      <View style={[styles.selectorContainer, { width: SELECTOR_WIDTH }]}>
        <Text style={styles.selectorLabel}>{label}</Text>
        <View style={styles.heightScrollContainer}>
          <View style={styles.selectionHighlight} />
          <ScrollView
            ref={scrollRef}
            style={styles.heightScrollView}
            contentContainerStyle={styles.heightScrollViewContent}
            showsVerticalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd(
              scrollRef,
              dataArray,
              selectedValue,
              setSelectedValue
            )}
            onScrollEndDrag={handleScrollEnd(
              scrollRef,
              dataArray,
              selectedValue,
              setSelectedValue
            )}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            {dataArray.map((item, index) => (
              <TouchableOpacity
                key={item}
                style={[styles.itemContainer, { height: ITEM_HEIGHT }]}
                onPress={() =>
                  handleItemPress(scrollRef, item, index, setSelectedValue)
                }
              >
                <Text
                  style={[
                    styles.itemText,
                    item === selectedValue && styles.selectedItemText,
                  ]}
                >
                  {formatFunc(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const handleContinue = () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(
      2,
      "0"
    )}-${String(selectedDay).padStart(2, "0")}`;

    router.push({
      pathname: "/register/third-step",
      params: {
        ...params,
        full_name,
        gender,
        dateOfBirth: formattedDate,
      },
    });
  };

  return (
    <LinearGradient
      style={{ flex: 1, width: "100%", height: "100%" }}
      colors={["#0A0A0A", "#0A0A0A", "#0A0A0A"]}
    >
      <View style={styles.container}>
        <MobileLogo />

        <View style={styles.formContainer}>
          <CardTitle title={`Hi ${full_name || ""}, When's Your Birthday?`} />

          <View style={styles.contentContainer}>
            <View style={styles.birthdaySelectorsContainer}>
              {renderScrollSelector(
                monthScrollRef,
                months,
                selectedMonth,
                "Month",
                setSelectedMonth,
                formatMonth
              )}
              {renderScrollSelector(
                dayScrollRef,
                days,
                selectedDay,
                "Day",
                setSelectedDay
              )}
              {renderScrollSelector(
                yearScrollRef,
                years,
                selectedYear,
                "Year",
                setSelectedYear
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default DateOfBirthSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
  },
  formContainer: {
    // flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    // backgroundColor: 'rgb(63, 144, 43)',
    height: "60%",
  },
  contentContainer: {
    marginBottom: 10,
    // backgroundColor: '#fff',
  },
  birthdaySelectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // backgroundColor: '#cdbd0f',
  },
  selectorContainer: {
    alignItems: "center",
    marginHorizontal: 5,
    // paddingHorizontal: 10,
  },
  selectorLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: "#fff",
    fontWeight: "600",
  },
  heightScrollContainer: {
    height: VISIBLE_ITEMS * ITEM_HEIGHT,
    overflow: "hidden",
    borderRadius: 8,
    // backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
  },
  heightScrollView: {
    height: VISIBLE_ITEMS * ITEM_HEIGHT,
  },
  heightScrollViewContent: {
    paddingVertical: (VISIBLE_ITEMS * ITEM_HEIGHT - ITEM_HEIGHT) / 2,
  },
  selectionHighlight: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    transform: [{ translateY: -ITEM_HEIGHT / 2 }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#FF5757",
    // backgroundColor: 'rgba(255, 87, 87, 0.1)',
  },
  itemContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  itemText: {
    fontSize: 20,
    color: "#b9b9b9",
    fontWeight: "500",
  },
  selectedItemText: {
    color: "#FF5757",
    fontSize: 24,
    fontWeight: "600",
  },
  numberItem: {
    fontSize: 18,
    color: Color.rgDisable,
    textAlign: "center",
  },
  activeNumber: {
    fontSize: 26,
    color: Color.rgPrimary,
    fontWeight: "bold",
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: Color.rgPrimary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "75%",
    marginHorizontal: "auto",
    justifyContent: "center",
  },
  nextButtonText: {
    color: Color.rgContinue,
    fontSize: 14,
    // fontWeight: 'bold',
    marginRight: 10,
  },
  backContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  backText: {
    color: Color.rgDisable,
  },
  backLink: {
    color: Color.rgPrimary,
    fontWeight: "bold",
  },
});
