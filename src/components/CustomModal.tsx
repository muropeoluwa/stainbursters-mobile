import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CustomModal({ visible, message, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  message: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#38a169',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
  },
});
