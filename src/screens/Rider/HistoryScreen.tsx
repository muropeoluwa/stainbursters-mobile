import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: any;
  total_amount: string;
  amount_paid: string;
  balance_due?: string;
  payment_status?: string;
  created_at: string;
  status: string;
}

const RiderHistoryScreen = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRiderHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_rider_history.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn('Invalid JSON response:', text);
        return;
      }
      if (data.status) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        console.warn(data.message || 'Failed to fetch rider history');
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRiderHistory().then(() => setRefreshing(false));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = orders.filter(o =>
      (o.customer_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (o.customer_phone || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const renderItem = ({ item }: { item: Order }) => {
    let itemsList: any[] = [];
    if (item.items) {
      if (Array.isArray(item.items)) itemsList = item.items;
      else try { itemsList = JSON.parse(item.items); } catch { itemsList = []; }
    }

    const total = parseFloat(item.total_amount || '0');
    const balance = parseFloat(item.balance_due || (total - parseFloat(item.amount_paid || '0')));
    const isFullyPaid = balance === 0 || item.payment_status === 'Paid';

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.customer_name || 'Anonymous'}</Text>
          <Text style={styles.badgeDelivered}>✅ Delivered</Text>
        </View>
        <Text style={styles.label}>Phone: {item.customer_phone || 'N/A'}</Text>
        <Text style={styles.label}>Items:</Text>
        {itemsList.length > 0 ? (
          itemsList.map((itm, idx) => (
            <Text key={idx} style={styles.itemText}>
              - {itm.type || itm.name || 'Item'} × {itm.quantity || 1} = ₦{itm.price || '0.00'}
            </Text>
          ))
        ) : (
          <Text style={styles.itemText}>No items listed</Text>
        )}
        <Text style={styles.label}>Total: ₦{total.toFixed(2)}</Text>
        <Text style={styles.label}>
          {isFullyPaid ? '✅ Fully Paid' : `Balance Due: ₦${balance.toFixed(2)}`}
        </Text>
        <Text style={styles.label}>Date: {new Date(item.created_at).toLocaleString()}</Text>
      </View>
    );
  };

  useEffect(() => {
    fetchRiderHistory();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No delivered orders yet</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default RiderHistoryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f4', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  container: { flex: 1, padding: 16 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badgeDelivered: { fontSize: 13, backgroundColor: '#d4edda', padding: 4, borderRadius: 5 },
  label: { fontSize: 14, color: '#555', marginTop: 6 },
  itemText: { fontSize: 14, color: '#222', marginLeft: 10 },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' },
});
