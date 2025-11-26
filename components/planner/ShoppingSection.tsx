import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ShoppingBag, Trash2, Check, Plus, Edit2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';
import { PriorityBadge } from './shared/PriorityBadge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Profile, ShoppingItem } from '../../hooks/usePlannerData';

type ShoppingHandlers = {
  onAdd: (payload: Partial<ShoppingItem>) => Promise<void>;
  onUpdate: (id: number, payload: Partial<ShoppingItem>) => Promise<void>;
  onPurchase: (id: number, purchasedBy?: string | null) => Promise<void>;
  onDeleteRequest: (item: ShoppingItem) => void;
};

type ShoppingSectionProps = {
  items: ShoppingItem[];
  profiles: Profile[];
  loading: boolean;
  handlers: ShoppingHandlers;
};

export function ShoppingSection({
  items,
  profiles,
  loading,
  handlers,
}: ShoppingSectionProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);

  const activeItems = useMemo(() => items.filter((item) => !item.is_done), [items]);

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>{item.quantity || 'Mengde ikke satt'}</Text>
          <Text style={styles.itemMeta}>
            Av: {item.profiles?.display_name ?? 'Ukjent'}
          </Text>
          {item.needed_by && (
            <Text style={styles.itemDate}>
              Trengs: {new Date(item.needed_by).toLocaleDateString('no-NO')}
            </Text>
          )}
        </View>
        <PriorityBadge priority={item.priority} />
      </View>

      <View style={styles.itemActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handlers.onPurchase(item.id, item.added_by)}
        >
          <Check size={16} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Kjøpt</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setEditItem(item)}
        >
          <Edit2 size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Endre</Text>
        </Pressable>

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
        icon={<ShoppingBag size={20} color={colors.success} />}
        title="Handleliste"
        subtitle="Hva trenger vi å kjøpe?"
        badge={`${activeItems.length} linjer`}
      >
        <Pressable
          style={styles.addButton}
          onPress={() => setAddModalOpen(true)}
        >
          <Plus size={18} color="#ffffff" />
        </Pressable>
      </SectionHeader>

      {loading && activeItems.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : activeItems.length === 0 ? (
        <Text style={styles.emptyText}>Ingen ting er lagt inn enda. Det er cooked.</Text>
      ) : (
        <View style={styles.list}>
          {activeItems.map((item) => (
            <React.Fragment key={item.id}>{renderItem({ item })}</React.Fragment>
          ))}
        </View>
      )}

      <ShoppingFormModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (payload) => {
          await handlers.onAdd(payload);
          setAddModalOpen(false);
        }}
        profiles={profiles}
        title="Legg til på handlelista"
        submitLabel="Legg til"
      />

      {editItem && (
        <ShoppingFormModal
          visible={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          onSubmit={async (payload) => {
            if (editItem) {
              await handlers.onUpdate(editItem.id, payload);
              setEditItem(null);
            }
          }}
          profiles={profiles}
          initialData={editItem}
          title="Endre handlelinje"
          submitLabel="Lagre"
        />
      )}
    </View>
  );
}

type ShoppingFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<ShoppingItem>) => Promise<void>;
  profiles: Profile[];
  initialData?: ShoppingItem;
  title: string;
  submitLabel: string;
};

function ShoppingFormModal({ 
  visible, 
  onClose, 
  onSubmit, 
  profiles, 
  initialData,
  title: modalTitle,
  submitLabel
}: ShoppingFormModalProps) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('Lav');
  const [neededBy, setNeededBy] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setQuantity(initialData.quantity || '');
        setPriority(initialData.priority);
        setNeededBy(initialData.needed_by || '');
        setSelectedProfile(initialData.added_by || '');
      } else {
        setTitle('');
        setQuantity('');
        setPriority('Lav');
        setNeededBy('');
        if (profiles.length > 0) setSelectedProfile(profiles[0].id);
      }
    }
  }, [visible, initialData, profiles]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        quantity: quantity.trim() || null,
        priority,
        needed_by: neededBy || null,
        added_by: selectedProfile || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={modalTitle}>
      <Input
        label="Tittel *"
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Melk"
      />
      <Input
        label="Mengde"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="F.eks. 2 liter (eller en sjoko)"
      />
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Prioritet</Text>
        <View style={styles.priorityButtons}>
          {['Lav', 'Middels', 'Høy'].map((p) => (
            <Pressable
              key={p}
              style={[
                styles.priorityButton,
                priority === p && styles.priorityButtonActive,
              ]}
              onPress={() => setPriority(p)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === p && styles.priorityButtonTextActive,
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Avbryt" variant="secondary" onPress={onClose} />
        <Button
          title={submitLabel}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  itemDate: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
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
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
