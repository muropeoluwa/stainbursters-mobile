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
  payment_status?: string;
}

const PickupReadyScreen = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButtons, setModalButtons] = useState<React.ReactNode>(null);

  const showModal = (title: string, message: string, buttons: React.ReactNode) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalButtons(buttons);
    setModalVisible(true);
  };

  const defaultOK = () => (
    <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
      <Text style={styles.modalButtonText}>OK</Text>
    </TouchableOpacity>
  );

  const fetchReadyOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://stainbursters.name.ng/api/get_ready_walkins.php', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      console.log('Fetch Ready Orders Response:', text);
      const data = JSON.parse(text);

      if (data.status) {
        setOrders(data.orders);
      } else {
        showModal('Error', data.message || 'Something went wrong.', defaultOK());
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showModal('Network Error', 'Could not connect to server.', defaultOK());
    } finally {
      setLoading(false);
    }
  };

  const performUpdateStatus = async (orderId: string, newStatus: string) => {
  try {
    const response = await fetch('https://stainbursters.name.ng/api/update_order_status.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ✅ JSON
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId, status: newStatus }), // ✅ send JSON
    });

    const text = await response.text();
    console.log('Update Status Response:', text);
    const data = JSON.parse(text);

    if (data.success || data.status) { // backend might return 'success' or 'status'
      fetchReadyOrders();
      showModal(
        'Updated',
        `Order ${newStatus === 'Collected' ? 'reverted' : 'delivered'} successfully.`,
        defaultOK()
      );
    } else {
      showModal('Error', data.message || 'Update failed', defaultOK());
    }
  } catch (error) {
    console.error('Update error:', error);
    showModal('Network Error', 'Could not connect to server.', defaultOK());
  }
};


  const updateStatus = (orderId: string, newStatus: string) => {
    const isUndo = newStatus === 'Collected';
    const title = isUndo ? 'Undo Order' : 'Mark as Delivered';
    const message = isUndo
      ? 'Undo this order back to Collected?'
      : 'Mark this order as Delivered?';

    showModal(title, message, (
      <View style={styles.modalBtnRow}>
        <TouchableOpacity
          style={styles.modalButtonOutline}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={() => {
            setModalVisible(false);
            performUpdateStatus(orderId, newStatus);
          }}
        >
          <Text style={styles.modalButtonText}>Yes</Text>
        </TouchableOpacity>
      </View>
    ));
  };

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
  const balance = parseFloat(item.balance_due || (total - parseFloat(item.amount_paid || '0')));
  const isFullyPaid = balance === 0 || item.payment_status === 'Paid';

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.name}>{item.customer_name || 'Anonymous'}</Text>
        <Text style={styles.badgeReady}>🟢 Ready</Text>
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

      <TouchableOpacity
        style={styles.statusBtnPrimary}
        onPress={() => {
          if (!isFullyPaid) {
            showModal(
              '⚠️ Cannot Deliver',
              'This order has a pending balance. Advise to clear part payment.',
              defaultOK()
            );
          } else {
            updateStatus(item.id, 'Delivered');
          }
        }}
      >
        <Text style={styles.statusText}>Mark as Delivered</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statusBtnSecondary}
        onPress={() => updateStatus(item.id, 'Workshop')}
      >
        <Text style={styles.statusText}>Return to Workshop</Text>
      </TouchableOpacity>
    </View>
  );
};


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReadyOrders().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReadyOrders();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>✅ Ready for Pickup</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={orders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No orders marked as Ready</Text>}
          />
        )}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              {modalButtons}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default PickupReadyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badgeReady: {
    fontSize: 13,
    backgroundColor: '#d4edda',
    padding: 4,
    borderRadius: 5,
  },
  label: { fontSize: 14, color: '#555', marginTop: 6 },
  itemText: { fontSize: 14, color: '#222', marginLeft: 10 },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' },
  statusBtnPrimary: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  statusBtnSecondary: {
    backgroundColor: '#ffc107',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonOutline: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'center' },
});
