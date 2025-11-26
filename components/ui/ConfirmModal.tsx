import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { spacing, colors, fontSize } from '../../styles/theme';
import { AlertTriangle, HelpCircle } from 'lucide-react-native';

type ConfirmModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'success';
  icon?: React.ReactNode;
};

export function ConfirmModal({
  visible,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Bekreft',
  cancelLabel = 'Avbryt',
  variant = 'primary',
  icon,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} onClose={onCancel} showCloseButton={false}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {icon ? (
            icon
          ) : variant === 'danger' ? (
            <AlertTriangle size={48} color={colors.error} />
          ) : (
            <HelpCircle size={48} color={colors.primary} />
          )}
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{description}</Text>

        <View style={styles.buttons}>
          <View style={styles.buttonWrapper}>
            <Button title={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title={confirmLabel} variant={variant} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DeleteConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemLabel: string;
};

export function DeleteConfirmModal({ open, onConfirm, onCancel, itemLabel }: DeleteConfirmModalProps) {
  return (
    <ConfirmModal
      visible={open}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title="Bekreft sletting"
      description={`Er du sikker på at du vil slette "${itemLabel}"? Denne handlingen kan ikke angres.`}
      confirmLabel="Slett"
      variant="danger"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
  },
});
