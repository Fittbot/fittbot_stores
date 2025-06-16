import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Circle, Line } from 'react-native-svg';
import { Color } from '../../../GlobalStyles';

const CircularProgressBar = ({
  size = 200,
  width = 15,
  initialValue = 55,
  minValue = 0,
  maxValue = 100,
  tintColor = Color.rgPrimary,
  backgroundColor = '#888',
  unit = 'kg',
  onProgressChange,
  style,
}) => {
  const [fill, setFill] = useState(initialValue);
  const scrollViewRef = useRef(null);
  const itemHeight = 50; // Height of each number item

  // Generate an array of numbers from minValue to maxValue
  const numbers = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => i + minValue
  );

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / itemHeight);

    // Ensure we don't go beyond the last number
    const newValue = Math.max(
      minValue,
      Math.min(maxValue, currentIndex + minValue)
    );

    if (newValue !== fill) {
      setFill(newValue);

      // Call progress change callback if provided
      if (onProgressChange) {
        onProgressChange(newValue);
      }
    }
  };

  // Scroll to initial value on component mount
  const scrollToInitialValue = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: (fill - minValue) * itemHeight,
        animated: false,
      });
    }
  };

  // Generate ticks for speedometer
  const renderTicks = () => {
    const ticks = [];
    const totalTicks = 30; // Total number of ticks
    const startAngle = -90; // Start from bottom of semicircle
    const sweepAngle = 180;
    const radius = size / 2;

    for (let i = 0; i <= totalTicks; i++) {
      const angle = startAngle + (sweepAngle * i) / totalTicks;
      const radians = angle * (Math.PI / 180);

      // Differentiate major and minor ticks
      const isLargeTick = i % 5 === 0;

      // Inner radius for tick start
      const innerRadius = isLargeTick
        ? radius - 30 // Longer ticks for major marks
        : radius - 20; // Shorter ticks for minor marks

      // Calculate tick coordinates
      const x1 = radius + innerRadius * Math.cos(radians);
      const y1 = radius + innerRadius * Math.sin(radians);
      const x2 = radius + radius * Math.cos(radians);
      const y2 = radius + radius * Math.sin(radians);

      ticks.push(
        <Line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#FFFFFF"
          strokeWidth={isLargeTick ? 3 : 1}
        />
      );
    }

    return ticks;
  };

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.valueText,
          {
            fontSize: size / 5,
            color: tintColor,
          },
        ]}
      >
        {`${Math.round(fill)} ${unit}`}
      </Text>

      <AnimatedCircularProgress
        size={size}
        width={width}
        fill={((fill - minValue) / (maxValue - minValue)) * 100}
        tintColor={tintColor}
        backgroundColor={backgroundColor}
        arcSweepAngle={180}
        rotation={-90}
        lineCap="round"
        padding={5}
        renderBackground={() => (
          <Svg
            style={[
              StyleSheet.absoluteFill,
              styles.ticksOverlay,
              { zIndex: 100 },
            ]}
          >
            {renderTicks()}
          </Svg>
        )}
        renderCap={({ center }) => (
          <Circle cx={center.x} cy={center.y} r="10" fill={tintColor} />
        )}
      >
        {() => (
          <View style={styles.contentContainer}>
            <View style={[styles.scrollContainer, { height: itemHeight * 5 }]}>
              <ScrollView
                ref={scrollViewRef}
                onLayout={scrollToInitialValue}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: itemHeight * 2,
                    paddingBottom: itemHeight * 2,
                  },
                ]}
                overScrollMode="never"
              >
                {numbers.map((number) => (
                  <Text
                    key={number}
                    style={[
                      styles.numberItem,
                      number === fill && styles.activeNumber,
                    ]}
                  >
                    {number}
                    {number === fill ? ' Kg' : ''}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </AnimatedCircularProgress>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticksOverlay: {
    zIndex: 100,
    position: 'absolute',
  },
  scrollContainer: {
    // width: 100,
    overflow: 'hidden',
  },
  scrollContent: {
    alignItems: 'center',
  },
  numberItem: {
    height: 50,
    fontSize: 18,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#d5d5d5',
  },
  activeNumber: {
    fontSize: 28,
    color: Color.rgPrimary,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    fontWeight: 'bold',
    borderRadius: 5,
  },
  valueText: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: Color.rgPrimary,
  },
});

export default CircularProgressBar;
