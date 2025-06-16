import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MobileLogo = () => {
  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  return (
    <View>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          },
        ]}
      >
        <Text style={styles.logoText}>
          <Text style={styles.logoFirstPart}>Fitt</Text>
          <Text style={styles.logoSecondPart}>bot</Text>
        </Text>
        <View style={styles.logoUnderline} />
        <Text style={styles.tagline}>Your Personal Fitness Companion</Text>
      </Animated.View>
    </View>
  );
};

export default MobileLogo;

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logoText: {
    fontSize: 42,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontWeight: 400,
  },
  logoFirstPart: {
    color: '#FF5757',
  },
  logoSecondPart: {
    color: '#FFFFFF',
  },
  logoUnderline: {
    width: 80,
    height: 4,
    backgroundColor: '#FF5757',
    borderRadius: 2,
    marginTop: 5,
  },
  tagline: {
    color: '#DDDDDD',
    fontSize: 10,
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});
