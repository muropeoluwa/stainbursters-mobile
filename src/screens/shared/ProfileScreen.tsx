// SharedProfileScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
  office_address?: string;
  avatar?: string;
  bank_name?: string;
  account_number?: string;
  total_earnings?: string;
  balance?: string;
  recent_orders?: any[];
}

const SharedProfileScreen = () => {
  const { token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_profile_data.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.status) {
        setProfile(data.profile);
      } else {
        alert(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!profile) {
    return <Text style={{ textAlign: 'center', marginTop: 50 }}>No profile data</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={profile.avatar ? { uri: `https://stainbursters.name.ng/${profile.avatar}` } : require('../../../assets/avatar-placeholder.png')}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role.toUpperCase()}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
          {profile.email ? <Text style={styles.info}>Email: {profile.email}</Text> : null}
          {profile.office_address ? <Text style={styles.info}>Address: {profile.office_address}</Text> : null}
        </View>

        {/* Earnings & Wallet - only for Trader/Rider/Staff */}
        {(profile.role === 'trader' || profile.role === 'rider' || profile.role === 'staff') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wallet & Earnings</Text>
            <Text style={styles.label}>Total Earnings: ₦{profile.total_earnings || '0.00'}</Text>
            <Text style={styles.label}>Current Balance: ₦{profile.balance || '0.00'}</Text>
          </View>
        )}

        {/* Account Info */}
        {profile.role === 'trader' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank Details</Text>
            <Text style={styles.label}>Bank: {profile.bank_name || 'N/A'}</Text>
            <Text style={styles.label}>Account Number: {profile.account_number || 'N/A'}</Text>
          </View>
        )}

        {/* Recent Orders - Trader & Rider */}
        {(profile.role === 'trader' || profile.role === 'rider') && profile.recent_orders?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Orders</Text>
            {profile.recent_orders.map((order, idx) => (
              <View key={idx} style={styles.orderRow}>
                <Text style={styles.label}>Order #{order.id}</Text>
                <Text style={styles.label}>Amount: ₦{order.total_amount}</Text>
                <Text style={styles.label}>Status: {order.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={[styles.button, { backgroundColor: '#dc3545' }]} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SharedProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    padding: 16,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  role: { fontSize: 14, color: '#666', marginBottom: 4 },
  phone: { fontSize: 14, color: '#333' },
  info: { fontSize: 14, color: '#555', marginTop: 2 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#007bff' },
  label: { fontSize: 14, color: '#555', marginTop: 2 },
  orderRow: { marginBottom: 8, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  button: { paddingVertical: 10, borderRadius: 8, marginVertical: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
