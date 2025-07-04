import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
const SCREEN_WIDTH = Dimensions.get("window").width;
const SELECTOR_WIDTH = (SCREEN_WIDTH - 110) / 3;

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

  // Simple scroll state tracking like height selector
  const isScrollingRef = useRef({
    month: false,
    day: false,
    year: false,
  });

  const scrollTimeoutRef = useRef({
    month: null,
    day: null,
    year: null,
  });

  const { gender, full_name } = params;

  // Memoize the data arrays
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const years = useMemo(
    () =>
      Array.from(
        { length: 100 },
        (_, i) => new Date().getFullYear() - i
      ).reverse(),
    []
  );

  const formatMonth = useCallback((month) => {
    const monthNames = [
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
    ];
    return monthNames[month - 1];
  }, []);

  // Initialize state from params
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

  // Scroll to initial positions - simplified like height selector
  useEffect(() => {
    if (!isInitialized) return;

    const scrollToInitialPositions = () => {
      const monthIndex = months.findIndex((m) => m === selectedMonth);
      const dayIndex = days.findIndex((d) => d === selectedDay);
      const yearIndex = years.findIndex((y) => y === selectedYear);

      if (
        monthScrollRef.current &&
        monthIndex >= 0 &&
        !isScrollingRef.current.month
      ) {
        monthScrollRef.current.scrollTo({
          y: monthIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (
        dayScrollRef.current &&
        dayIndex >= 0 &&
        !isScrollingRef.current.day
      ) {
        dayScrollRef.current.scrollTo({
          y: dayIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (
        yearScrollRef.current &&
        yearIndex >= 0 &&
        !isScrollingRef.current.year
      ) {
        yearScrollRef.current.scrollTo({
          y: yearIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    };

    const timeout = setTimeout(scrollToInitialPositions, 50);
    return () => clearTimeout(timeout);
  }, [
    selectedMonth,
    selectedDay,
    selectedYear,
    isInitialized,
    months,
    days,
    years,
  ]);

  // Simplified scroll handler like height selector
  const createScrollHandler = useCallback(
    (dataArray, setSelectedValue, scrollType) => {
      return (event) => {
        isScrollingRef.current[scrollType] = true;
        const offsetY = event.nativeEvent.contentOffset.y;
        const itemHeight = ITEM_HEIGHT;
        const currentIndex = Math.round(offsetY / itemHeight);

        if (dataArray[currentIndex] !== undefined) {
          // Don't set selected value here, just track scrolling
        }

        if (scrollTimeoutRef.current[scrollType]) {
          clearTimeout(scrollTimeoutRef.current[scrollType]);
        }

        const currentOffsetY = offsetY;
        scrollTimeoutRef.current[scrollType] = setTimeout(() => {
          const finalIndex = Math.round(currentOffsetY / itemHeight);

          if (dataArray[finalIndex] !== undefined) {
            setSelectedValue(dataArray[finalIndex]);
          }

          isScrollingRef.current[scrollType] = false;
        }, 150);
      };
    },
    []
  );

  // Simplified momentum scroll end handler like height selector
  const createMomentumScrollEndHandler = useCallback(
    (dataArray, setSelectedValue, scrollType) => {
      return (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const itemHeight = ITEM_HEIGHT;
        const currentIndex = Math.round(offsetY / itemHeight);

        if (dataArray[currentIndex] !== undefined) {
          setSelectedValue(dataArray[currentIndex]);
        }

        isScrollingRef.current[scrollType] = false;
      };
    },
    []
  );

  // Handle direct item press
  const handleItemPress = useCallback(
    (scrollRef, value, index, setSelectedValue, scrollType) => {
      if (isScrollingRef.current[scrollType]) return;

      setSelectedValue(value);

      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      }
    },
    []
  );

  const renderScrollSelector = useCallback(
    (
      scrollRef,
      dataArray,
      selectedValue,
      label,
      setSelectedValue,
      scrollType,
      formatFunc = (val) => val
    ) => {
      const scrollHandler = createScrollHandler(
        dataArray,
        setSelectedValue,
        scrollType
      );

      const momentumScrollEndHandler = createMomentumScrollEndHandler(
        dataArray,
        setSelectedValue,
        scrollType
      );

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
              onScroll={scrollHandler}
              onMomentumScrollEnd={momentumScrollEndHandler}
              scrollEventThrottle={16}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              bounces={false}
              overScrollMode="never"
            >
              {dataArray.map((item, index) => (
                <TouchableOpacity
                  key={`${scrollType}-${item}`}
                  style={[styles.itemContainer, { height: ITEM_HEIGHT }]}
                  onPress={() =>
                    handleItemPress(
                      scrollRef,
                      item,
                      index,
                      setSelectedValue,
                      scrollType
                    )
                  }
                  activeOpacity={0.7}
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
    },
    [createScrollHandler, createMomentumScrollEndHandler, handleItemPress]
  );

  const handleContinue = useCallback(() => {
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
  }, [
    selectedYear,
    selectedMonth,
    selectedDay,
    router,
    params,
    full_name,
    gender,
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(scrollTimeoutRef.current).forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    };
  }, []);

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
                "month",
                formatMonth
              )}
              {renderScrollSelector(
                dayScrollRef,
                days,
                selectedDay,
                "Day",
                setSelectedDay,
                "day"
              )}
              {renderScrollSelector(
                yearScrollRef,
                years,
                selectedYear,
                "Year",
                setSelectedYear,
                "year"
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
    paddingHorizontal: 20,
    paddingTop: 20,
    height: "60%",
  },
  contentContainer: {
    marginBottom: 10,
  },
  birthdaySelectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorContainer: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  selectorLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: "#fff",
    fontWeight: "600",
  },
  heightScrollContainer: {
    height: VISIBLE_ITEMS * ITEM_HEIGHT,
    position: "relative",
  },
  heightScrollView: {
    width: "100%",
  },
  heightScrollViewContent: {
    paddingVertical: (VISIBLE_ITEMS * ITEM_HEIGHT - ITEM_HEIGHT) / 2,
    alignItems: "center",
  },
  selectionHighlight: {
    position: "absolute",
    top: "40%",
    bottom: "40%",
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FF5757",
    zIndex: 1,
    pointerEvents: "none",
  },
  itemContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT,
    paddingHorizontal: 20,
  },
  itemText: {
    fontSize: 14,
    color: "#b9b9b9",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: ITEM_HEIGHT,
  },
  selectedItemText: {
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "bold",
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
