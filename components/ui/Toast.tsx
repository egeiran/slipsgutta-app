import React, { useEffect} from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { CheckCircle, XCircle } from 'lucide-react-native';

type ToastProps = {
  message: string;
  variant: 'success' | 'error';
  onClose: () => void;
};

export function SuccessToast({ message, onClose }: Omit<ToastProps, 'variant'>) {
  return <Toast message={message} variant="success" onClose={onClose} />;
}

export function ErrorToast({ message, onClose }: Omit<ToastProps, 'variant'>) {
  return <Toast message={message} variant="error" onClose={onClose} />;
}

function Toast({ message, variant, onClose }: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [opacity, onClose]);

  const isSuccess = variant === 'success';

  return (
    <Animated.View
      style={[
        styles.toast,
        isSuccess ? styles.toastSuccess : styles.toastError,
        { opacity },
      ]}
    >
      {isSuccess ? (
        <CheckCircle size={20} color={colors.success} />
      ) : (
        <XCircle size={20} color={colors.error} />
      )}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadow.md,
    minWidth: 280,
    maxWidth: 400,
  },
  toastSuccess: {
    backgroundColor: colors.successBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  toastError: {
    backgroundColor: colors.errorBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
});
