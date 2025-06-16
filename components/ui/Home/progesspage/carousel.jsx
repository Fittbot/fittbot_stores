import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ITEM_WIDTH = screenWidth - 10;

const Carousel = ({ data, autoPlayInterval = 3000, onChangeTab, gender }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeIndex === data.length - 1) {
        flatListRef.current.scrollToIndex({
          animated: true,
          index: 0,
        });
      } else {
        flatListRef.current.scrollToIndex({
          animated: true,
          index: activeIndex + 1,
        });
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / screenWidth
        );
        if (slideIndex !== activeIndex) {
          setActiveIndex(slideIndex);
        }
      },
    }
  );
  const goToPage = (path) => {
    switch (path) {
      case "qr_scanner":
        router.push("/client/workout");
        return;
      case "desi_diet":
        router.push("/client/allfoods");
        return;
      case "view_transformation":
        router.push({
          pathname: "/client/workout",
        });
        return;
      case "gym_buddy":
        onChangeTab("Gym Buddy");
        return;
      case "rewards":
        onChangeTab("My Rewards");
        return;
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity onPress={() => goToPage(item.description)}>
        <View style={styles.slideOuter}>
          <View style={styles.slide}>
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render progress indicators
  const renderIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {data.map((_, index) => {
          // Calculate width of indicator based on active state
          const width = scrollX.interpolate({
            inputRange: [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ],
            outputRange: [10, 30, 10],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange: [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ],
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[styles.indicator, { width, opacity }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Explore What Fittbot Offers You !</Text>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.flatlistContent}
      />
      {renderIndicators()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    marginVertical: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 14,
    marginBottom: 10,
  },
  flatlistContent: {
    alignItems: "center",
  },
  slideOuter: {
    width: screenWidth,
    height: "100%",
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    width: ITEM_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    color: "white",
    fontSize: 16,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "white",
    marginHorizontal: 4,
  },
});

export default Carousel;
