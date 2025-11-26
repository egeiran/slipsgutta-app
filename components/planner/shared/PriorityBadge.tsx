import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../../styles/theme';

type PriorityBadgeProps = {
  priority: string;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getStyle = () => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'høy':
        return styles.badgeCritical;
      case 'medium':
      case 'middels':
        return styles.badgeMedium;
      default:
        return styles.badgeLow;
    }
  };

  return (
    <View style={[styles.badge, getStyle()]}>
      <Text style={styles.badgeText}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeCritical: {
    backgroundColor: colors.errorBg,
  },
  badgeMedium: {
    backgroundColor: colors.warningBg,
  },
  badgeLow: {
    backgroundColor: colors.infoBg,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
});
