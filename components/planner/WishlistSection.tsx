import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Heart, Trash2, Edit, Plus } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Profile, WishlistItem } from '../../hooks/usePlannerData';

type WishlistHandlers = {
  onAdd: (payload: Partial<WishlistItem>) => Promise<void>;
  onUpdate: (id: number, payload: Partial<WishlistItem>) => Promise<void>;
  onDeleteRequest: (item: WishlistItem) => void;
};

type WishlistSectionProps = {
  items: WishlistItem[];
  profiles: Profile[];
  loading: boolean;
  handlers: WishlistHandlers;
};

export function WishlistSection({
  items,
  profiles,
  loading,
  handlers,
}: WishlistSectionProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.why && <Text style={styles.itemWhy}>"{item.why}"</Text>}
          <Text style={styles.itemMeta}>
            Foreslått av: {item.profiles?.display_name ?? 'Ukjent'}
          </Text>
          {item.price_estimate && (
            <Text style={styles.itemPrice}>
              Ca. pris: {item.price_estimate} kr
            </Text>
          )}
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.itemActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handlers.onDeleteRequest(item)}
        >
          <Trash2 size={16} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Slett</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        icon={<Heart size={20} color={colors.primary} />}
        title="Ønskeliste"
        subtitle="Hva ønsker vi oss?"
        badge={`${items.length} ønsker`}
      >
        <Pressable
          style={styles.addButton}
          onPress={() => setAddModalOpen(true)}
        >
          <Plus size={18} color="#ffffff" />
        </Pressable>
      </SectionHeader>

      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>Ingen ønsker lagt inn enda.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderItem({ item })}</React.Fragment>
          ))}
        </View>
      )}

      <WishlistFormModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (payload) => {
          await handlers.onAdd(payload);
          setAddModalOpen(false);
        }}
        profiles={profiles}
      />
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case 'kjøpt':
      return { backgroundColor: colors.successBg };
    case 'venter':
      return { backgroundColor: colors.warningBg };
    default:
      return { backgroundColor: colors.infoBg };
  }
}

type WishlistFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<WishlistItem>) => Promise<void>;
  profiles: Profile[];
};

function WishlistFormModal({ visible, onClose, onSubmit, profiles }: WishlistFormModalProps) {
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [priceEstimate, setPriceEstimate] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0].id);
    }
  }, [profiles, selectedProfile]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        why: why.trim() || null,
        price_estimate: priceEstimate ? parseInt(priceEstimate, 10) : null,
        proposed_by: selectedProfile || null,
        status: 'Foreslått',
      });
      // Reset form
      setTitle('');
      setWhy('');
      setPriceEstimate('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Legg til ønske">
      <Input
        label="Hva ønsker du deg? *"
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Ny kaffemaskin"
      />
      <Input
        label="Hvorfor?"
        value={why}
        onChangeText={setWhy}
        placeholder="F.eks. Den gamle er ødelagt"
        multiline
        numberOfLines={3}
      />
      <Input
        label="Estimert pris (kr)"
        value={priceEstimate}
        onChangeText={setPriceEstimate}
        placeholder="F.eks. 2000"
        keyboardType="numeric"
      />

      <View style={styles.buttonGroup}>
        <Button title="Avbryt" variant="secondary" onPress={onClose} />
        <Button
          title="Legg til"
          variant="primary"
          onPress={handleSubmit}
          disabled={!title.trim()}
          loading={loading}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  itemHeader: {
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemWhy: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
