import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SwitchRoleScreen = () => {
  const { userId, login, token } = useContext(AuthContext);
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSwitchRole = async () => {
    if (!selectedRole || !accessCode) {
      Alert.alert('Missing Fields', 'Please select a role and enter access code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/switch_role.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_id=${userId}&new_role=${selectedRole}&access_code=${encodeURIComponent(accessCode)}`
      });

      const text = await response.text();
      console.log('🔁 Switch Role Response:', text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        Alert.alert('Server Error', 'Unexpected response from server');
        return;
      }

      if (data.status) {
        Alert.alert('Success', `Role changed to ${selectedRole}`);
        login(token!, selectedRole, userId!); // Re-auth with new role
      } else {
        Alert.alert('Access Denied', data.message || 'Invalid access code');
      }
    } catch (error) {
      console.error('Switch Role Error:', error);
      Alert.alert('Network Error', 'Failed to contact the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Switch Role</Text>

      <Text style={styles.label}>Select Role</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedRole}
          onValueChange={setSelectedRole}
          mode="dropdown"
        >
          <Picker.Item label="Select Role" value="" />
          <Picker.Item label="Trader" value="Trader" />
          <Picker.Item label="Rider" value="Rider" />
          <Picker.Item label="Staff" value="Staff" />
        </Picker>
      </View>

      <Text style={styles.label}>Official Access Code</Text>
      <TextInput
        placeholder="Enter access code"
        style={styles.input}
        value={accessCode}
        onChangeText={setAccessCode}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Confirm Role Switch" onPress={handleSwitchRole} />
      )}

      {/* ⬅️ Back to Home Button */}
      <View style={{ marginTop: 30 }}>
        <Button
          title="⬅ Back to Home"
          color="#6c757d"
          onPress={() => navigation.navigate('CustomerDrawer')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 20,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
});

export default SwitchRoleScreen;
