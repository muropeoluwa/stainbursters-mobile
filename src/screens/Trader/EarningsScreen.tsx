import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

const EarningsScreen = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    total_earned: '0.00',
    total_paid: '0.00',
    total_unpaid: '0.00'
  });

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_trader_earnings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${encodeURIComponent(token || '')}`
      });

      const text = await response.text();
      console.log('Earnings API raw:', text);
      const data = JSON.parse(text);

      if (data.status) {
        setEarnings(data.earnings);
      } else {
        Alert.alert('Error', data.message || 'Failed to load earnings');
      }
    } catch (error) {
      console.error('Earnings fetch error:', error);
      Alert.alert('Network Error', 'Could not load earnings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 100 }} size="large" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📈 Trader Earnings</Text>

      <View style={styles.card}>
        <Text>Total Earned:</Text>
        <Text style={styles.amount}>₦{earnings.total_earned}</Text>
      </View>

      <View style={styles.card}>
        <Text>Total Paid:</Text>
        <Text style={styles.amount}>₦{earnings.total_paid}</Text>
      </View>

      <View style={styles.card}>
        <Text>Total Unpaid:</Text>
        <Text style={styles.amount}>₦{earnings.total_unpaid}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5
  }
});

export default EarningsScreen;
