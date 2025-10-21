// SharedProfileScreen.tsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

interface Earning {
  order_id?: string;
  order_name?: string;
  customer_name?: string;
  date?: string;
  total_amount?: string | number;
  amount_earned?: string | number;
  status?: string;
  items?: Array<{ item_name?: string; price?: string | number; quantity?: number }>;
}

interface Order {
  id?: string;
  total_amount?: string | number;
  status?: string;
  created_at?: string;
  customer_name?: string;
  items?: any;
}

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
  office_address?: string;
  profile_picture?: string;
  bank_name?: string;
  account_number?: string;
  payment_method?: string;
  total_earnings?: string | number;
  balance?: string | number;
  total_withdrawn?: string | number;
  profit_allocation?: string;
  earning_history?: Earning[];
  recent_orders?: Order[]; // legacy / small list
  orders?: Order[]; // optional full orders array if backend uses this key
}

const BASE_URL = 'https://stainbursters.name.ng';

const SharedProfileScreen: React.FC = () => {
  const { token, logout, switchRole } = useContext(AuthContext);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Orders collapse & search
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersQuery, setOrdersQuery] = useState('');

  // Earnings collapse & search
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [earningsQuery, setEarningsQuery] = useState('');

  // Editable info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Withdrawal
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/get_profile_data.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status) {
        // Normalize keys (safety)
        const prof: ProfileData = {
          ...data.profile,
          earning_history: data.profile?.earning_history ?? [],
          recent_orders: data.profile?.recent_orders ?? data.profile?.orders ?? [],
          orders: data.profile?.orders ?? data.profile?.recent_orders ?? [],
        };
        setProfile(prof);
        setName(prof.name || '');
        setEmail(prof.email || '');
        setAddress(prof.office_address || '');
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('fetchProfile error', err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Name required');
    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/api/update_profile.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, office_address: address }),
      });
      const data = await res.json();
      if (data.status) {
        Alert.alert('Success', 'Profile updated');
        setEditing(false);
        fetchProfile();
      } else {
        Alert.alert('Error', data.message || 'Update failed');
      }
    } catch (err) {
      console.error('updateProfile error', err);
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawal = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Invalid amount');
    if (!bankName || !accountNumber || !accountName) return Alert.alert('Fill all bank details');
    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/api/withdraw.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          note,
        }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', json.message || 'Withdrawal submitted');
        setModalVisible(false);
        fetchProfile();
        setAmount('');
      } else {
        Alert.alert('Failed', json.message || 'Could not submit');
      }
    } catch (err) {
      console.error('withdraw error', err);
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );

  if (!profile)
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>No profile data</Text>
      </SafeAreaView>
    );

  const avatarUri = profile.profile_picture
    ? `${BASE_URL}/uploads/profile_pictures/${profile.profile_picture}`
    : null;

  // Orders source: prefer full orders array if backend provides it, else recent_orders
  const ordersSource: Order[] = (profile.orders && profile.orders.length > 0)
    ? profile.orders
    : (profile.recent_orders ?? []);

  // Filter helpers (case-insensitive)
  const filterOrders = (q: string) => {
    if (!q) return ordersSource;
    const s = q.toLowerCase();
    return ordersSource.filter(o =>
      String(o.id ?? '').toLowerCase().includes(s)
      || String(o.customer_name ?? '').toLowerCase().includes(s)
      || String(o.status ?? '').toLowerCase().includes(s)
    );
  };

  const filterEarnings = (q: string) => {
    const arr: Earning[] = profile.earning_history ?? [];
    if (!q) return arr;
    const s = q.toLowerCase();
    return arr.filter(e =>
      String(e.order_id ?? '').toLowerCase().includes(s)
      || String(e.customer_name ?? '').toLowerCase().includes(s)
      || String(e.order_name ?? '').toLowerCase().includes(s)
    );
  };

  const filteredOrders = filterOrders(ordersQuery);
  const filteredEarnings = filterEarnings(earningsQuery);

  const balanceNum = Number(profile.balance ?? 0);
  const totalEarnedNum = Number(profile.total_earnings ?? 0);
  const totalWithdrawnNum = Number(profile.total_withdrawn ?? 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* User Info */}
        <View style={styles.center}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require('../../../assets/avatar-placeholder.png')}
            style={styles.avatar}
          />
          {editing ? (
            <>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
              <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745' }]} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={() => setEditing(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.role}>{profile.role.toUpperCase()}</Text>
              <Text style={styles.info}>{profile.phone}</Text>
              <Text style={styles.info}>{profile.email || 'No email set'}</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={[styles.button, { backgroundColor: '#007bff', marginTop: 8 }]}>
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Earnings Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Earnings Overview</Text>
          <Text style={styles.label}>Total: ₦{totalEarnedNum.toLocaleString()}</Text>
          <Text style={styles.label}>Balance: ₦{balanceNum.toLocaleString()}</Text>
          <Text style={styles.label}>Withdrawn: ₦{totalWithdrawnNum.toLocaleString()}</Text>
          <Text style={styles.label}>Allocation: {profile.profit_allocation || '20%'}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#007bff', marginTop: 10 }]}
            onPress={() => {
              setBankName(profile.bank_name || '');
              setAccountNumber(profile.account_number || '');
              setAccountName(profile.name || '');
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Request Withdrawal</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏦 Bank Details</Text>
          <Text style={styles.label}>Bank: {profile.bank_name || 'Not set'}</Text>
          <Text style={styles.label}>Account Number: {profile.account_number || 'Not set'}</Text>
          <Text style={styles.label}>Payment Method: {profile.payment_method || 'Transfer'}</Text>
        </View>

  {/* Collapsible Orders Section */}
<View style={{ marginBottom: 12 }}>
  <TouchableOpacity style={styles.sectionHeader} onPress={() => setOrdersOpen(!ordersOpen)}>
    <Text style={styles.cardTitle}>📦 Orders</Text>
    <Text style={styles.toggleText}>{ordersOpen ? '−' : '+'}</Text>
  </TouchableOpacity>
  {ordersOpen && (
    <View style={styles.card}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search orders by ID, customer or status..."
        placeholderTextColor="#888"
        value={ordersQuery}
        onChangeText={setOrdersQuery}
      />
      {filteredOrders && filteredOrders.length > 0 ? (
        <ScrollView
          style={{ maxHeight: 240 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {filteredOrders.slice(0, 5).map((o, idx) => {
            const orderId = o.id ?? '';
            const cust = o.customer_name ?? 'Walk-in';
            const date = o.created_at ?? '';
            const total = o.total_amount ?? 0;
            const status = o.status ?? '';
            return (
              <View key={idx} style={styles.historyItem}>
                <Text style={styles.historyText}>Order ID: {orderId}</Text>
                <Text style={styles.historyText}>Customer: {cust}</Text>
                <Text style={styles.historyText}>Date: {date}</Text>
                <Text style={styles.historyText}>Total: ₦{Number(total).toLocaleString()}</Text>
                <Text style={styles.historyText}>Status: {status}</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No orders found</Text>
      )}
    </View>
  )}
</View>

{/* Collapsible Earning History Section */}
<View style={{ marginBottom: 12 }}>
  <TouchableOpacity style={styles.sectionHeader} onPress={() => setEarningsOpen(!earningsOpen)}>
    <Text style={styles.cardTitle}>📜 Earning History</Text>
    <Text style={styles.toggleText}>{earningsOpen ? '−' : '+'}</Text>
  </TouchableOpacity>
  {earningsOpen && (
    <View style={styles.card}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search earnings by order ID or customer..."
        placeholderTextColor="#888"
        value={earningsQuery}
        onChangeText={setEarningsQuery}
      />
      {filteredEarnings && filteredEarnings.length > 0 ? (
        <ScrollView
          style={{ maxHeight: 240 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {filteredEarnings.slice(0, 5).map((e, idx) => (
            <View key={idx} style={styles.historyItem}>
              <Text style={styles.historyText}>Order: {e.order_name ?? `#${e.order_id ?? ''}`}</Text>
              <Text style={styles.historyText}>Customer: {e.customer_name}</Text>
              <Text style={styles.historyText}>Date: {e.date}</Text>
              <Text style={styles.historyText}>Total Amount: ₦{Number(e.total_amount ?? 0).toLocaleString()}</Text>
              <Text style={styles.historyText}>Amount Earned: ₦{Number(e.amount_earned ?? 0).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No earning records found</Text>
      )}
    </View>
  )}
</View>


        {/* Collapsible Settings */}
        <TouchableOpacity style={[styles.card, { backgroundColor: '#fff' }]} onPress={() => setSettingsOpen(!settingsOpen)}>
          <Text style={styles.cardTitle}>⚙️ Settings</Text>
          {settingsOpen && (
            <View style={{ marginTop: 10 }}>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d', marginBottom: 8 }]} onPress={switchRole}>
                <Text style={styles.buttonText}>Switch Role</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#dc3545' }]} onPress={logout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdrawal Request</Text>
            <TextInput style={styles.input} placeholder="Amount (₦)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Bank Name" value={bankName} onChangeText={setBankName} />
            <TextInput style={styles.input} placeholder="Account Number" keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
            <TextInput style={styles.input} placeholder="Account Name" value={accountName} onChangeText={setAccountName} />
            <TextInput style={styles.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#6c757d', marginRight: 6 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#007bff' }]} onPress={handleWithdrawal}>
                <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SharedProfileScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', marginBottom: 18 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '700', color: '#222' },
  role: { fontSize: 12, color: '#666' },
  info: { fontSize: 13, color: '#555' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 14, elevation: 2 },
  cardTitle: { fontWeight: '700', color: '#007bff', marginBottom: 6 },
  label: { color: '#333', marginBottom: 4 },
  button: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8, width: '100%' },
  historyItem: { borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingVertical: 8 },
  historyText: { color: '#333' },
  historyDate: { color: '#777', fontSize: 12 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#007bff', marginBottom: 8, textAlign: 'center' },

  /* New UI pieces */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  toggleText: { fontSize: 18, color: '#444', fontWeight: '700' },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    color: '#333',
  },
  divider: { borderBottomWidth: 1, borderBottomColor: '#eee', marginVertical: 8 },
  noDataText: { textAlign: 'center', color: '#777', fontStyle: 'italic', paddingVertical: 10 },
});
