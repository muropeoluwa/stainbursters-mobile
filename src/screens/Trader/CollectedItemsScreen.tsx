// CollectedItemsScreen.tsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

interface WalkInOrder {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: any;
  total_amount: string;
  amount_paid: string;
  balance_due?: string;
  created_at: string;
  status: string;
  payment_status?: string;
}

const CollectedItemsScreen = () => {
  const { token, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'ThisWeek'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirm, setModalConfirm] = useState<null | (() => void)>(null);

  const showModal = (message: string, onConfirm?: () => void) => {
    setModalMessage(message);
    setModalConfirm(() => (onConfirm ? () => onConfirm() : null));
    setModalVisible(true);
  };

  const handleSessionExpired = () => {
    setModalVisible(false);
    logout(); // force logout → navigates to login screen
  };

  const fetchCollectedOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_collected_walkins.php', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        showModal("Session expired, please login again.", handleSessionExpired);
        return;
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        showModal("Invalid response from server.");
        return;
      }

      if (data.status) {
        setOrders(data.orders);
        applyFilters(data.orders, searchQuery, dateFilter);
      } else {
        if (data.message?.toLowerCase().includes("session expired")) {
          showModal("Session expired, please login again.", handleSessionExpired);
        } else {
          showModal(data.message || "Something went wrong from backend.");
        }
      }
    } catch (error) {
      showModal("Network Error. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    fullOrders: WalkInOrder[],
    query: string,
    dateScope: 'All' | 'Today' | 'ThisWeek'
  ) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const filtered = fullOrders.filter(order => {
      const created = new Date(order.created_at);
      let matchesDate = true;
      if (dateScope === 'Today') matchesDate = created >= todayStart;
      else if (dateScope === 'ThisWeek') matchesDate = created >= weekStart;

      const lowerQuery = query.toLowerCase();
      const matchesQuery =
        (order.customer_name || '').toLowerCase().includes(lowerQuery) ||
        (order.customer_phone || '').toLowerCase().includes(lowerQuery);

      return matchesDate && matchesQuery;
    });

    setFilteredOrders(filtered);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(orders, query, dateFilter);
  };

  const handleDateFilterChange = (newFilter: 'All' | 'Today' | 'ThisWeek') => {
    setDateFilter(newFilter);
    applyFilters(orders, searchQuery, newFilter);
  };

  const sendToRider = async (orderId: string) => {
    showModal(
      'Are you sure you want to send this order to the rider?',
      async () => {
        try {
          const response = await fetch(
            'https://stainbursters.name.ng/api/update_order_status.php',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                order_id: orderId,
                status: 'pending',
              }),
            }
          );

          if (response.status === 401) {
            showModal("Session expired, please login again.", handleSessionExpired);
            return;
          }

          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Invalid JSON response:', text);
            showModal('❌ Server error. Invalid response format.');
            return;
          }

          if (data.success) {
            showModal('✅ Order sent to rider successfully');
            fetchCollectedOrders(); // refresh orders
          } else {
            if (data.message?.toLowerCase().includes("session expired")) {
              showModal("Session expired, please login again.", handleSessionExpired);
            } else {
              showModal(data.message || '❌ Failed to send to rider');
            }
          }
        } catch (error) {
          console.error('SendToRider Error:', error);
          showModal('❌ Network Error. Could not send order.');
        }
      }
    );
  };

  const calculateGrandTotal = () => {
    return filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0);
  };

  const renderItem = ({ item }: { item: WalkInOrder }) => {
    let itemsList: any[] = [];

    if (item.items) {
      if (Array.isArray(item.items)) {
        itemsList = item.items;
      } else if (typeof item.items === 'string') {
        try {
          itemsList = JSON.parse(item.items);
        } catch (e) {
          console.warn('Failed to parse items JSON', e);
          itemsList = [];
        }
      }
    }

    const total = parseFloat(item.total_amount || '0');
    const paid = parseFloat(item.amount_paid || '0');
    const balance = total - paid;
    const isFullyPaid = balance <= 0;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.customer_name || 'Anonymous'}</Text>
          <Text style={styles.badgeCollected}>🟡 Collected</Text>
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
        <TouchableOpacity style={styles.statusBtn} onPress={() => sendToRider(item.id)}>
          <Text style={styles.statusText}>Send to Rider</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCollectedOrders().then(() => setRefreshing(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCollectedOrders();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📦 Collected Walk-In Orders</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <View style={styles.filterRow}>
          {['All', 'Today', 'ThisWeek'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterBtn,
                dateFilter === filter && styles.filterBtnActive,
              ]}
              onPress={() => handleDateFilterChange(filter as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>
          Total Amount for Filtered Orders: ₦{calculateGrandTotal().toFixed(2)}
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No collected orders</Text>
            }
          />
        )}

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <View style={styles.modalBtnGroup}>
                {modalConfirm ? (
                  <>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#6c757d' }]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#007bff' }]}
                      onPress={() => {
                        setModalVisible(false);
                        modalConfirm?.();
                      }}
                    >
                      <Text style={styles.modalBtnText}>Yes</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#007bff' }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CollectedItemsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  filterBtnActive: {
    backgroundColor: '#007bff',
  },
  filterText: {
    color: '#333',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeCollected: {
    fontSize: 13,
    backgroundColor: '#fff3cd',
    padding: 4,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },
  itemText: {
    fontSize: 14,
    color: '#222',
    marginLeft: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
  statusBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
