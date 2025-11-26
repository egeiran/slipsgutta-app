import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';
import type { PurchaseLog } from '../../hooks/usePlannerData';

type PurchaseLogPanelProps = {
  logs: PurchaseLog[];
};

export function PurchaseLogPanel({ logs }: PurchaseLogPanelProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}t siden`;
    } else if (diffInHours < 48) {
      return 'I går';
    } else {
      return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
    }
  };

  const renderItem = ({ item }: { item: PurchaseLog }) => (
    <View style={styles.logItem}>
      <View style={styles.iconContainer}>
        <ShoppingBag size={16} color={colors.success} />
      </View>
      <View style={styles.logContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.shopping_items?.title ?? 'Ukjent vare'}
        </Text>
        <Text style={styles.logMeta}>
          {item.profiles?.display_name ?? 'Noen'} • {formatDate(item.purchased_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Kjøpslogg"
        subtitle="Sist kjøpt"
        badge={`${Math.min(logs.length, 10)}`}
      />

      <View style={styles.panel}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Ingen kjøp registrert enda</Text>
        ) : (
          logs.slice(0, 10).map((item) => (
            <React.Fragment key={item.id}>{renderItem({ item })}</React.Fragment>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  logMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
