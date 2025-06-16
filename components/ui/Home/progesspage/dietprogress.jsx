import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg";

const DietProgressTracker = ({
  calories = { actual: 1500, target: 2987 },
  protein = { actual: 1500, target: 1800 },
  carbs = { actual: 300, target: 500 },
  fat = { actual: 30, target: 50 },
}) => {
  // Calculate percentages for the circular progress (capped at 100%)
  const proteinPercentage = Math.min(protein.actual / protein.target, 1);
  const carbsPercentage = Math.min(carbs.actual / carbs.target, 1);
  const fatPercentage = Math.min(fat.actual / fat.target, 1);

  // Calculate stroke dash values (circumference = 2 * PI * radius)
  const innerRadius = 60; // Fat (innermost)
  const midRadius = 85; // Protein (middle)
  const outerRadius = 110; // Carbs (outermost)
  const innerCircumference = 2 * Math.PI * innerRadius;
  const midCircumference = 2 * Math.PI * midRadius;
  const outerCircumference = 2 * Math.PI * outerRadius;

  // Calculate stroke dasharray and dashoffset
  const fatStrokeDashoffset = innerCircumference * (1 - fatPercentage);
  const proteinStrokeDashoffset = midCircumference * (1 - proteinPercentage);
  const carbsStrokeDashoffset = outerCircumference * (1 - carbsPercentage);

  // Define colors for each macro
  const PROTEIN_COLOR = "#FFC107"; // Orange/Yellow
  const CARBS_COLOR = "#00BCD4"; // Cyan
  const FAT_COLOR = "#E53935"; // Red

  // Define arc paths for each metric
  const createArc = (radius, percentage, startAngle = -90) => {
    const endAngle = startAngle + percentage * 360;
    const startX = 150 + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = 150 + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = 150 + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = 150 + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: "/client/diet",
          params: {
            selectedTab: "Reports",
          },
        })
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today's Diet Progress</Text>
        <View style={styles.goalContainer}>
          <Text style={styles.goalLabel}>Goal</Text>
          <Text style={styles.goalValue}>
            <Text style={styles.currentValue}>
              {calories.actual || 0}&nbsp;
            </Text>
            /{calories.target}
          </Text>
        </View>
      </View>

      <View style={styles.circleContainer}>
        <Svg width="300" height="250" viewBox="0 0 300 300">
          {/* Background circles */}
          <Circle
            cx="150"
            cy="150"
            r={outerRadius}
            stroke="#E0E0E0"
            strokeWidth="10"
            fill="none"
          />
          <Circle
            cx="150"
            cy="150"
            r={midRadius}
            stroke="#E0E0E0"
            strokeWidth="10"
            fill="none"
          />
          <Circle
            cx="150"
            cy="150"
            r={innerRadius}
            stroke="#E0E0E0"
            strokeWidth="10"
            fill="none"
          />

          {/* Progress arcs */}
          {/* Fat arc (innermost) - Red */}
          <Path
            d={createArc(
              innerRadius,
              fatPercentage === 1 ? 0.99995 : fatPercentage,
              -90
            )}
            stroke={FAT_COLOR}
            strokeLinecap="round"
            strokeWidth="10"
            fill="none"
          />

          {/* Protein arc (middle) - Orange/Yellow */}
          <Path
            d={createArc(
              midRadius,
              proteinPercentage === 1 ? 0.99995 : proteinPercentage,
              -90
            )}
            stroke={PROTEIN_COLOR}
            strokeLinecap="round"
            strokeWidth="10"
            fill="none"
          />

          {/* Carbs arc (outermost) - Cyan */}
          <Path
            d={createArc(
              outerRadius,
              carbsPercentage === 1 ? 0.99995 : carbsPercentage,
              -90
            )}
            stroke={CARBS_COLOR}
            strokeLinecap="round"
            strokeWidth="10"
            fill="none"
          />

          {/* Center text */}
          <G>
            <SvgText
              x="150"
              y="145"
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="#333"
            >
              {calories.actual || 0}
            </SvgText>
            <SvgText
              x="150"
              y="175"
              textAnchor="middle"
              fontSize="16"
              fill="#666"
            >
              Calories
            </SvgText>
          </G>
        </Svg>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricTitle, { color: CARBS_COLOR }]}>
              Carbs
            </Text>
          </View>
          <View style={styles.macros}>
            <View style={[styles.metricIcon, styles.carbsIcon]}>
              <Image
                source={require("../../../../assets/images/CARBS.png")}
                style={styles.images}
              />
            </View>
            <View>
              <Text style={styles.metricValue}>
                {carbs.actual || 0}/{carbs.target}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricTitle, { color: PROTEIN_COLOR }]}>
              Protein
            </Text>
          </View>
          <View style={styles.macros}>
            <View style={[styles.metricIcon, styles.proteinIcon]}>
              <Image
                source={require("../../../../assets/images/PROTEIN.png")}
                style={styles.images}
              />
            </View>
            <View>
              <Text style={styles.metricValue}>
                {protein.actual || 0}/{protein.target}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricTitle, { color: FAT_COLOR }]}>Fat</Text>
          </View>
          <View style={styles.macros}>
            <View style={[styles.metricIcon, styles.fatIcon]}>
              <Image
                source={require("../../../../assets/images/FAT.png")}
                style={styles.fatImage}
              />
            </View>
            <View>
              <Text style={styles.metricValue}>
                {fat.actual || 0}/{fat.target}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.subTitle}>
        This data is based on your today's diet logs.
        <Link href={"/client/diet"} style={styles.link}>
          Add Diet
        </Link>{" "}
        to make your progress here.
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // width: '100%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    margin: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  goalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  goalValue: {
    fontSize: 14,
    color: "#666",
  },
  currentValue: {
    color: "#FF4081",
    fontWeight: "bold",
  },
  images: {
    width: 14,
    height: 14,
  },
  fatImage: {
    width: 14,
    height: 17,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0, // Reduced from 5 to 0
    height: 240, // Added explicit height to control vertical space
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0, // Added to reduce space after the circle
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 5,
  },
  metricIcon: {
    width: 16,
    height: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  macros: {
    flexDirection: "row",
    gap: 4,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  link: {
    color: "blue",
  },
});

export default DietProgressTracker;
