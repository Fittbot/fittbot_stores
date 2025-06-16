import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CardTitle from '../../components/ui/Register/CardTitle';
import ContinueButton from '../../components/ui/Register/ContinueButton';
import MobileLogo from '../../components/ui/Register/MobileLogo';
import { Color } from '../../GlobalStyles';

const HeightSelector = () => {
  const scrollViewRef = useRef(null);
  const params = useLocalSearchParams();
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  
  const initialHeight = params?.height || 160;
  const initialUnit = params?.heightUnit || 'Centimeter';
  
  const [selectedHeight, setSelectedHeight] = useState(initialHeight);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const [heightInCm, setHeightInCm] = useState(initialHeight);

  const router = useRouter();

  const animatedHeight = useRef(new Animated.Value(200)).current;
  const animatedWidth = useRef(new Animated.Value(90)).current;

  const getHeightInCm = useCallback((height, unit) => {
    if (unit === 'Centimeter') return parseInt(height);
    if (unit === 'Feet') {
      const parts = height.split("'");
      const feet = parseInt(parts[0]) || 0;
      const inches = parseInt(parts[1]) || 0;
      return Math.round((feet * 12 + inches) * 2.54);
    }
    return parseInt(height);
  }, []);

  const convertFromCm = useCallback((cm, toUnit) => {
    if (toUnit === 'Centimeter') return cm;
    if (toUnit === 'Feet') {
      const totalInches = Math.round(cm / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
    return cm;
  }, []);

  const getImageDimensions = useCallback((heightInCm) => {
    const clampedHeight = Math.max(125, Math.min(210, heightInCm));
    
    const minImageHeight = 180;
    const maxImageHeight = 320;
    const heightRatio = (clampedHeight - 125) / (210 - 125);
    const imageHeight = minImageHeight + (maxImageHeight - minImageHeight) * heightRatio;
    
    const minImageWidth = 80;
    const maxImageWidth = 140;
    const imageWidth = minImageWidth + (maxImageWidth - minImageWidth) * heightRatio;
    
    return { height: imageHeight, width: imageWidth };
  }, []);

  const updateAnimations = useCallback((heightInCm) => {
    const dimensions = getImageDimensions(heightInCm);

    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: dimensions.height,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(animatedWidth, {
        toValue: dimensions.width,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [getImageDimensions, animatedHeight, animatedWidth]);

  const generateHeights = useCallback((unit) => {
    if (unit === 'Centimeter') {
      return Array.from({ length: 86 }, (_, i) => 125 + i); 
    }
    if (unit === 'Feet') {
      const heights = [];
      for (let feet = 4; feet <= 6; feet++) {
        for (let inches = 0; inches <= 11; inches++) {
          if (feet === 4 && inches === 0) continue; 
          if (feet === 6 && inches === 11) {
            heights.push(`${feet}'${inches}"`);
            break; 
          }
          heights.push(`${feet}'${inches}"`);
        }
      }
      return heights;
    }
    return [];
  }, []);

  const heights = generateHeights(selectedUnit);

  useEffect(() => {
    if (scrollViewRef.current && !isScrollingRef.current) {
      const convertedHeight = convertFromCm(heightInCm, selectedUnit);
      
      const index = heights.findIndex((h) => {
        if (selectedUnit === 'Feet') {
          return h === convertedHeight;
        }
        return parseInt(h) === parseInt(convertedHeight);
      });
      
      if (index >= 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * 50,
            animated: false,
          });
        }, 50);
      }
    }
  }, [selectedUnit, heights, heightInCm, convertFromCm]);

  const handleScroll = useCallback((event) => {
    isScrollingRef.current = true;
    const offsetY = event.nativeEvent.contentOffset.y;
    const itemHeight = 50;
    const currentIndex = Math.round(offsetY / itemHeight);
    
    if (heights[currentIndex] !== undefined) {
      const newHeight = heights[currentIndex];
      const newHeightInCm = getHeightInCm(newHeight, selectedUnit);
      updateAnimations(newHeightInCm);
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    const currentOffsetY = offsetY;
    scrollTimeoutRef.current = setTimeout(() => {
      const finalIndex = Math.round(currentOffsetY / itemHeight);
      
      if (heights[finalIndex] !== undefined) {
        setSelectedHeight(heights[finalIndex]);
        const finalHeightInCm = getHeightInCm(heights[finalIndex], selectedUnit);
        setHeightInCm(finalHeightInCm);
      }
      
      isScrollingRef.current = false;
    }, 150);
  }, [heights, selectedUnit, getHeightInCm, updateAnimations]);

  const handleMomentumScrollEnd = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const itemHeight = 50;
    const currentIndex = Math.round(offsetY / itemHeight);
    
    if (heights[currentIndex] !== undefined) {
      setSelectedHeight(heights[currentIndex]);
      const newHeightInCm = getHeightInCm(heights[currentIndex], selectedUnit);
      setHeightInCm(newHeightInCm);
    }
  }, [heights, selectedUnit, getHeightInCm]);

  const handleUnitChange = useCallback((newUnit) => {
    if (newUnit === selectedUnit) return;
    const convertedHeight = convertFromCm(heightInCm, newUnit);
    
    setSelectedHeight(convertedHeight);
    setSelectedUnit(newUnit);
  }, [selectedUnit, heightInCm, convertFromCm]);

  const handleContinue = () => {
    router.push({
      pathname: '/register/sixth-step',
      params: {
        ...params,
        height: heightInCm,
        unit: 'Centimeter',
        heightUnit: 'Centimeter',
      },
    });
  };

  const handleBack = () => {
    router.push({
      pathname: '/register/fourth-step',
      params: { ...params },
    });
  };

  useEffect(() => {
    updateAnimations(heightInCm);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [heightInCm, updateAnimations]);

  return (
    <LinearGradient
      style={{ flex: 1, width: '100%', height: '100%' }}
      colors={['#0A0A0A', '#0A0A0A', '#0A0A0A']}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MobileLogo />
        </View>

        <View style={styles.formContainer}>
          <CardTitle title={'Select Your Height'} />

          <View style={styles.unitSelectorContainer}>
            {['Centimeter', 'Feet'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitButton,
                  selectedUnit === unit && styles.activeUnitButton,
                ]}
                onPress={() => handleUnitChange(unit)}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    selectedUnit === unit && styles.activeUnitButtonText,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.silhouetteContainer}>
              <View style={styles.imageWrapper}>
                <Animated.Image
                  source={params.gender == 'Male' ? require('../../assets/images/MALE.png'):require('../../assets/images/FEMALE.png')}
                  style={{
                    width: animatedWidth,
                    height: animatedHeight,
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.heightScrollContainer}>
              <View style={styles.heightScrollOverlay} />
              <ScrollView
                ref={scrollViewRef}
                style={styles.heightScrollView}
                contentContainerStyle={styles.heightScrollViewContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
                snapToInterval={50}
                decelerationRate="fast"
                bounces={false}
              >
                {heights.map((height) => (
                  <View key={height}>
                    <Text
                      style={[
                        styles.numberItem,
                        height == selectedHeight && styles.activeNumber,
                      ]}
                    >
                      {height}{' '}
                      {selectedUnit === 'Centimeter' ? 'cm' : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <ContinueButton
          handleSubmit={handleContinue}
          isValid={true}
          text={'Continue'}
        />

        <View style={styles.backContainer}>
          <Text style={styles.backText}>Change your mind? </Text>
          <TouchableOpacity onPress={() => handleBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HeightSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.rgBgContainer,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
  },
  formContainer: {
    borderRadius: 15,
    width: '100%',
    marginBottom: 30,
  },
  unitSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: Color.rgBgSecondary,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeUnitButton: {
    backgroundColor: Color.rgPrimary,
  },
  unitButtonText: {
    color: Color.rgDisable,
    fontSize: 16,
  },
  activeUnitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    height: 350,
  },
  silhouetteContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  imageWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  heightScrollContainer: {
    flex: 1,
    height: 350,
    position: 'relative',
  },
  heightScrollOverlay: {
    position: 'absolute',
    top: '40%',
    bottom: '40%',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Color.rgPrimaryTransparent,
    zIndex: 1,
    pointerEvents: 'none',
  },
  heightScrollView: {
    width: '100%',
  },
  heightScrollViewContent: {
    paddingVertical: 140,
    alignItems: 'center',
  },
  numberItem: {
    height: 50,
    fontSize: 18,
    textAlign: 'center',
    color: Color.rgDisable,
    paddingHorizontal: 20,
    lineHeight: 50,
  },
  activeNumber: {
    fontSize: 28,
    color: Color.rgPrimary,
    fontWeight: 'bold',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  backText: {
    color: "#fff",
  },
  backLink: {
    color: Color.rgPrimary,
    fontWeight: 'bold',
  },
});