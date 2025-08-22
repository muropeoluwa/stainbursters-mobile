import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../api/config';

export default function PlaceOrderScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [itemsByCategory, setItemsByCategory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Fetch inventory
  useEffect(() => {
    fetch(`${API_BASE_URL}/get_inventory.php`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const grouped = data.items.reduce((acc, item) => {
            const cat = item.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
          }, {});
          setItemsByCategory(grouped);
        }
      })
      .catch(err => console.error('Inventory fetch error:', err));
  }, []);

  const handleAddItem = item => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = itemId => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      setModalMessage('No items selected');
      setModalVisible(true);
      return;
    }

    const amount = parseFloat(amountPaid || '0');
    const balance = totalAmount - amount;

    const payload = new FormData();
    payload.append('customer_name', customerName || 'Walk-in');
    payload.append('phone', phone);
    payload.append('items', JSON.stringify(selectedItems));
    payload.append('total_price', totalAmount);
    payload.append('payment_status', balance <= 0 ? 'Paid' : 'Part Payment');
    payload.append('balance_due', balance);

    fetch(`${API_BASE_URL}/submit_walkin_order.php`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    })
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setSelectedItems([]);
          setCustomerName('');
          setPhone('');
          setAmountPaid('');
          setModalMessage('Order submitted successfully!');
          setModalVisible(true);

          // Navigate to receipt screen
          navigation.navigate('ReceiptScreen', {
            orderDetails: {
              customerName: customerName || 'Walk-in',
              phone,
              items: selectedItems,
              totalAmount,
              amountPaid: amount,
              balanceDue: balance,
              timestamp: new Date().toLocaleString(),
              traderName: user?.name || 'Trader',
            },
          });
        } else {
          setModalMessage(data.message || 'Submission failed');
          setModalVisible(true);
        }
      })
      .catch(error => {
        console.error('Submit error:', error);
        setModalMessage('Network error. Please try again.');
        setModalVisible(true);
      });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          Place Walk-in Order
        </Text>

        <TextInput
          placeholder="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          style={styles.input}
        />
        <TextInput
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
        <TextInput
          placeholder="Amount Paid"
          keyboardType="numeric"
          value={amountPaid}
          onChangeText={setAmountPaid}
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Laundry Items</Text>
        {Object.entries(itemsByCategory).map(([cat, items]) => (
          <View key={cat} style={styles.card}>
            <TouchableOpacity
              onPress={() =>
                setExpandedCategory(expandedCategory === cat ? null : cat)
              }
            >
              <Text style={styles.cardHeader}>{cat}</Text>
            </TouchableOpacity>
            {expandedCategory === cat &&
              items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => handleAddItem(item)}
                >
                  <Text>{item.name}</Text>
                  <Text>₦{item.price}</Text>
                </TouchableOpacity>
              ))}
          </View>
        ))}

        {selectedItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Selected Items</Text>
            {selectedItems.map(item => (
              <View key={item.id} style={styles.selectedRow}>
                <Text style={{ flex: 1 }}>
                  {item.name} x{item.quantity}
                </Text>
                <Text>₦{item.price * item.quantity}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="close-circle" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
              Total: ₦{totalAmount.toFixed(2)}
            </Text>
          </>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Order</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 16 }}>{modalMessage}</Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.okBtn}
            >
              <Text style={{ color: '#fff' }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    padding: 10,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 10,
    marginVertical: 4,
    borderRadius: 6,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: '#008080',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  okBtn: {
    marginTop: 20,
    backgroundColor: '#008080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
};
