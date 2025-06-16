import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CircularProgressBar from '../../components/ui/Register/Gauge';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Color, linearGradientColors } from '../../GlobalStyles';
import MobileLogo from '../../components/ui/Register/MobileLogo';
import CardTitle from '../../components/ui/Register/CardTitle';
import { LinearGradient } from 'expo-linear-gradient';
import ContinueButton from '../../components/ui/Register/ContinueButton';

const FourthStep = () => {
  const router = useRouter();
  const params = useLocalSearchParams();


  const { fullName, gender } = params;
  const [weight, setWeight] = useState(60);

  const handleProgressChange = (newValue) => {
    setWeight(newValue);
  };

  useEffect(() => {
    if (params.weight) {
      setWeight(parseInt(params.weight));
    }
  }, []);

  const handleContinue = () => {
    router.push({
      pathname: '/register/fifth-step',
      params: { ...params, weight },
    });
  };

  return (
    <LinearGradient
      style={{ flex: 1, width: '100%', height: '100%' }}
      colors={linearGradientColors}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MobileLogo />

          {/* <Text style={styles.title}>Choose Your Weight</Text>
        <Text style={styles.subtitle}>Hi {fullName}, select your weight</Text> */}
        </View>

        <View style={styles.formContainer}>
          <CardTitle title={'Select Your Weight'} />

          <View style={styles.progressContainer}>
            <CircularProgressBar
              size={250}
              width={20}
              initialValue={params.weight || weight}
              minValue={40}
              maxValue={150}
              tintColor={Color.rgPrimary}
              backgroundColor={Color.rgDisable}
              unit="kg"
              onProgressChange={handleProgressChange}
            />
          </View>
        </View>

        <ContinueButton
          handleSubmit={() => handleContinue()}
          text={'Continue'}
          isValid={true}
        />

        {/* <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push('/register/fifth-step')}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity> */}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Change your mind? </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/register/third-step',
                params: { ...params },
              })
            }
          >
            <Text style={styles.loginLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

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
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  title: {
    color: Color.rgTextSecondary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: Color.rgDisable,
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    // marginBottom: 30,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: Color.rgPrimary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: Color.rgTextSecondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
  },
  loginLink: {
    color: Color.rgPrimary,
    fontWeight: 'bold',
  },
});

export default FourthStep;
