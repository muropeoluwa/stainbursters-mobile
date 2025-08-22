import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const steps = ['received', 'workshop', 'ready', 'delivered'];

const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const isActive = steps.indexOf(currentStatus) >= index;
        return (
          <View key={step} style={styles.stepContainer}>
            <View style={[styles.circle, isActive && styles.activeCircle]}>
              <Text style={[styles.stepText, isActive && styles.activeText]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {step.toUpperCase()}
            </Text>
            {index < steps.length - 1 && (
              <View style={[styles.line, isActive && styles.activeLine]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

export default StatusTimeline;

const styles = StyleSheet.create({
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    backgroundColor: '#28a745',
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 5,
  },
  activeLabel: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: '#ccc',
  },
  activeLine: {
    backgroundColor: '#28a745',
  },
});
