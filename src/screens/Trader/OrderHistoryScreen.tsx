import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
  RefreshControl, SafeAreaView, Platform, Modal
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: string;
  total_amount: string;
  amount_paid: string;
  balance_due?: string;
  created_at: string;
  status: string;
  payment_status?: string;
}

const HistoryScreen = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null);

  const showModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const fetchDeliveredOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_order_history.php', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      console.log('📦 Delivered Orders Response:', text);
      const data = JSON.parse(text);
      if (data.status) {
        setOrders(data.orders);
      } else {
        showModal(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showModal('Network Error: Could not fetch order history');
    } finally {
      setLoading(false);
    }
  };

  const undoDelivery = (orderId: string) => {
    setConfirmUndoId(orderId);
    setModalMessage('Return this order back to Ready for Pickup?');
    setModalVisible(true);
  };

  const confirmUndo = async () => {
  if (!confirmUndoId) return;
  try {
    const response = await fetch('https://stainbursters.name.ng/api/update_order_status.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: confirmUndoId,
        status: 'Ready',
      }),
    });

    const data = await response.json();
    if (data.success) {
      showModal('Order moved back to Ready for Pickup.');
      fetchDeliveredOrders();
    } else {
      showModal(data.message || 'Undo failed');
    }
  } catch (error) {
    showModal('Network Error: Could not connect to server');
  } finally {
    setConfirmUndoId(null);
  }
};


  const renderItem = ({ item }: { item: Order }) => {
  // Normalize items safely
  let itemsList: any[] = [];
  if (item.items) {
    if (Array.isArray(item.items)) {
      itemsList = item.items;
    } else if (typeof item.items === 'string') {
      try {
        itemsList = JSON.parse(item.items);
      } catch (error) {
        console.warn('Invalid JSON in items:', item.items);
        itemsList = [];
      }
    }
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

      <TouchableOpacity style={styles.undoBtn} onPress={() => undoDelivery(item.id)}>
        <Text style={styles.undoText}>Return Item to Ready Box</Text>
      </TouchableOpacity>
    </View>
  );
};


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeliveredOrders().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📜 Delivered Orders</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No delivered orders yet</Text>}
          />
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            {confirmUndoId ? (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    confirmUndo();
                    setModalVisible(false);
                  }}
                  style={[styles.modalBtn, { backgroundColor: '#28a745' }]}
                >
                  <Text style={styles.modalBtnText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setConfirmUndoId(null);
                  }}
                  style={[styles.modalBtn, { backgroundColor: '#6c757d' }]}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: '#007bff', marginTop: 10 }]}
              >
                <Text style={styles.modalBtnText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  badgeDelivered: {
    fontSize: 13,
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    color: '#155724',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  undoBtn: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  undoText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
