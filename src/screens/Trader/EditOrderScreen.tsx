import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const EditOrderScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const [name, setName] = useState(order.customer_name);
  const [phone, setPhone] = useState(order.customer_phone);

  const handleSave = async () => {
    try {
      const response = await fetch('https://stainbursters.name.ng/api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `order_id=${order.id}&customer_name=${name}&customer_phone=${phone}`,
      });
      const data = await response.json();
      if (data.status) {
        navigation.goBack();
      } else {
        alert(data.message || 'Failed to update');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Edit Order</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Customer Name" style={styles.input} />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" style={styles.input} />
      <TouchableOpacity onPress={handleSave} style={styles.btn}>
        <Text style={styles.btnText}>💾 Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  input: { backgroundColor: '#eee', marginVertical: 8, padding: 10, borderRadius: 6 },
  btn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center' },
});

export default EditOrderScreen;
