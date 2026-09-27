import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function StatCard({ icon: Icon, iconColor = Colors.primaryNeon, label, value, subtext }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {Icon && (
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
            <Icon size={18} color={iconColor} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 16,
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
