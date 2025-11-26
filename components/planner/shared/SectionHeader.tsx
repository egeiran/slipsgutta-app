import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../../styles/theme';

type SectionHeaderProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
};

export function SectionHeader({ icon, title, subtitle, badge, children }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={styles.title}>{title}</Text>
          {badge && <Text style={styles.badge}>{badge}</Text>}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    marginLeft: spacing.md,
  },
});
