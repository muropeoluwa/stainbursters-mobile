import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

const RiderMapScreen = () => {
  const { switchToCustomer } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rider Map Screen</Text>

      {/* Add your rider map UI here */}

      <View style={styles.backButton}>
        <Button title="⬅ Back to Customer Home" onPress={switchToCustomer} color="#007bff" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  backButton: { marginTop: 40 },
});

export default RiderMapScreen;
