// SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Simulate loading and navigate to Home or Auth
    const timer = setTimeout(() => {
      navigation.replace('AccessCodeLogin'); // Change to your login/home screen
    }, 2500); // 2.5 seconds splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <Image
        source={require('../imagename/imagename.png')} // Your app logo
        style={styles.logo}
      />
      <Text style={styles.title}>StainBursters</Text>
      <Text style={styles.subtitle}>Smart Laundry Solutions</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Could also use a gradient for style
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B3D91', // App primary color
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
});

export default SplashScreen;
