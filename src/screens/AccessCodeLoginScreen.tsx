import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const AccessCodeLoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    console.log('📲 Attempting login with:', { phone, access_code: code });

    try {
      const response = await fetch('https://stainbursters.name.ng/api/login_with_code.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, access_code: code }),
      });

      const rawResponseText = await response.text();
      console.log('📥 Raw API response text:', rawResponseText);

      let data;
      try {
        data = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.error('❌ Failed to parse API response JSON:', parseError);
        Alert.alert('Server Error', 'Invalid response from server. Please try again.');
        return;
      }

      console.log('🟢 Parsed API response:', JSON.stringify(data, null, 2));

      if (data.success) {
        const token = data.token.replace('Bearer ', '');
        console.log('🔑 Received token:', token);

        // Validate token
        const validateResponse = await fetch('https://stainbursters.name.ng/api/validate_token.php', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        const validateText = await validateResponse.text();
        console.log('🔐 Raw token validation response:', validateText);

        let validateData;
        try {
          validateData = JSON.parse(validateText);
        } catch (error) {
          console.error('❌ Token validation parse error:', error);
          Alert.alert('Token Error', 'Failed to validate session. Please try again.');
          return;
        }

        if (validateData.success) {
          console.log('✅ Token valid. Logging in with user data:', validateData);
          await login(token, validateData.role, validateData.user_id, data.user);
        } else {
          Alert.alert('Session Invalid', 'Your session is invalid or expired.');
        }
      } else {
        console.warn('⚠️ Login failed:', data.message);
        Alert.alert('Login Failed', data.message || 'Invalid code or phone number');
      }

    } catch (error) {
      console.error('❌ Network/Login error:', error);
      Alert.alert('Error', 'Network error or server not reachable');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with Access Code</Text>
      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Access Code"
        value={code}
        onChangeText={setCode}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});

export default AccessCodeLoginScreen;
