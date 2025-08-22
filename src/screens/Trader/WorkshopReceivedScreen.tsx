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

const WorkshopReceivedScreen = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirm, setModalConfirm] = useState<null | (() => void)>(null);

  const showModal = (message: string, onConfirm?: () => void) => {
    setModalMessage(message);
    setModalConfirm(() => (onConfirm ? () => onConfirm() : null));
    setModalVisible(true);
  };

  const fetchWorkshopOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_workshop_orders.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.status) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        showModal(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      showModal("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string) => {
  showModal('Mark this order as Ready?', async () => {
    try {
      const response = await fetch('https://stainbursters.name.ng/api/update_order_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ✅ must be JSON
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId, status: 'Ready' }), // ✅ send JSON
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.success || data.status) { // depending on your backend key
        showModal("Order marked as Ready.");
        fetchWorkshopOrders();
      } else {
        showModal(data.message || "Failed to update order");
      }
    } catch {
      showModal("Failed to connect to server.");
    }
  });
};


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkshopOrders().then(() => setRefreshing(false));
  }, []);

  useFocusEffect(useCallback(() => {
    fetchWorkshopOrders();
  }, []));

  const renderItem = ({ item }: { item: WalkInOrder }) => {
  // Normalize items safely
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
        <Text style={styles.badgeWorkshop}>🧰 Workshop</Text>
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

      <TouchableOpacity style={styles.statusBtn} onPress={() => updateStatus(item.id)}>
        <Text style={styles.statusText}>Mark as Ready</Text>
      </TouchableOpacity>
    </View>
  );
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🧰 Workshop Orders</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            const filtered = orders.filter(o =>
              (o.customer_name || '').toLowerCase().includes(query.toLowerCase()) ||
              (o.customer_phone || '').toLowerCase().includes(query.toLowerCase())
            );
            setFilteredOrders(filtered);
          }}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No workshop orders</Text>}
          />
        )}
        <Modal visible={modalVisible} transparent animationType="fade">
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

export default WorkshopReceivedScreen;

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
  badgeWorkshop: {
    fontSize: 13,
    backgroundColor: '#d1ecf1',
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
    backgroundColor: '#28a745',
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
