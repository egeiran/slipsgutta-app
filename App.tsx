import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { usePlannerData } from './hooks/usePlannerData';
import { ShoppingSection } from './components/planner/ShoppingSection';
import { WishlistSection } from './components/planner/WishlistSection';
import { CalendarSection } from './components/planner/CalendarSection';
import { RoommateStatus } from './components/planner/RoommateStatus';
import { PurchaseLogPanel } from './components/planner/PurchaseLogPanel';
import { TipsGrid } from './components/planner/TipsGrid';
import { DeleteConfirmModal } from './components/ui/ConfirmModal';
import { SuccessToast, ErrorToast } from './components/ui/Toast';
import { requestPermissions } from './lib/notifications';
import { colors, spacing, fontSize, borderRadius } from './styles/theme';
import type { ShoppingItem, WishlistItem, CalendarEvent } from './hooks/usePlannerData';
import { LogOut } from 'lucide-react-native';

function MainApp() {
  const { user, loading: authLoading, logout } = useAuth();
  
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <PlannerApp user={user} onLogout={logout} />;
}

function PlannerApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const planner = usePlannerData();
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string; id: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'shopping' | 'wishlist' | 'calendar';
    id: number;
    label: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const showToast = (variant: 'success' | 'error', message: string) => {
    setToast({ variant, message, id: Date.now() });
  };

  const withToast = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      await action();
      if (successMessage) showToast('success', successMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Noe gikk galt';
      showToast('error', message);
      throw err;
    }
  };

  const shoppingHandlers = {
    onAdd: (payload: Partial<ShoppingItem>) =>
      withToast(() => planner.addShoppingItem(payload), 'Lagt til i handlelista'),
    onUpdate: (id: number, payload: Partial<ShoppingItem>) =>
      withToast(() => planner.updateShoppingItem(id, payload), 'Oppdatert handlelinje'),
    onPurchase: (id: number, purchasedBy?: string | null) =>
      withToast(() => planner.markShoppingPurchased(id, purchasedBy), 'Markert som kjøpt'),
    onDeleteRequest: (item: ShoppingItem) =>
      setDeleteTarget({ type: 'shopping', id: item.id, label: item.title }),
  };

  const wishlistHandlers = {
    onAdd: (payload: Partial<WishlistItem>) =>
      withToast(() => planner.addWishlistItem(payload), 'Lagt til i ønskelista'),
    onUpdate: (id: number, payload: Partial<WishlistItem>) =>
      withToast(() => planner.updateWishlistItem(id, payload), 'Oppdatert ønske'),
    onDeleteRequest: (item: WishlistItem) =>
      setDeleteTarget({ type: 'wishlist', id: item.id, label: item.title }),
  };

  const calendarHandlers = {
    onAdd: (payload: Partial<CalendarEvent>) =>
      withToast(() => planner.addCalendarEvent(payload), 'Lagt til i kalenderen'),
    onUpdate: (id: number, payload: Partial<CalendarEvent>) =>
      withToast(() => planner.updateCalendarEvent(id, payload), 'Oppdatert hendelse'),
    onDeleteRequest: (item: CalendarEvent) =>
      setDeleteTarget({ type: 'calendar', id: item.id, label: item.title }),
  };

  const choreHandlers = {
    onMarkDone: (task: string, profileId: string, completed: boolean) =>
      withToast(
        () => planner.markChoreDone(task, profileId, completed),
        completed ? 'Oppgave markert som gjort (Peak!)' : 'Angret oppgave (Cooked...)'
      ),
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const { type, id, label } = deleteTarget;
    const deleteAction = async () => {
      if (type === 'shopping') return planner.deleteShoppingItem(id);
      if (type === 'wishlist') return planner.deleteWishlistItem(id);
      return planner.deleteCalendarEvent(id);
    };

    await withToast(deleteAction, `${label} slettet`);
    setDeleteTarget(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await planner.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const toastComponent = useMemo(() => {
    if (!toast) return null;
    const commonProps = { message: toast.message, onClose: () => setToast(null) };
    return toast.variant === 'success' ? <SuccessToast {...commonProps} /> : <ErrorToast {...commonProps} />;
  }, [toast]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Slipsgutta Planner</Text>
            <Text style={styles.subtitle}>Handleliste, ønskeliste og kalender</Text>
          </View>
          <TouchableOpacity style={styles.userSection} onPress={onLogout}>
            <View>
              <Text style={styles.userName}>{user.display_name}</Text>
              <Text style={styles.userLogout}>Logg ut</Text>
            </View>
            <LogOut size={24} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {planner.configError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{planner.configError}</Text>
          </View>
        )}

        <ShoppingSection
          items={planner.shoppingItems}
          profiles={planner.profiles}
          loading={planner.loading}
          handlers={shoppingHandlers}
        />

        <WishlistSection
          items={planner.wishlistItems}
          profiles={planner.profiles}
          loading={planner.loading}
          handlers={wishlistHandlers}
        />

        <CalendarSection
          events={planner.calendarEvents}
          profiles={planner.profiles}
          loading={planner.loading}
          handlers={calendarHandlers}
        />

        <RoommateStatus
          profiles={planner.profiles}
          choreStatuses={planner.choreStatuses}
          onMarkDone={choreHandlers.onMarkDone}
          loading={planner.loading}
        />

        <PurchaseLogPanel logs={planner.purchaseLogs} />

        <TipsGrid />
      </ScrollView>

      {toastComponent && (
        <View style={styles.toastContainer}>{toastComponent}</View>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        itemLabel={deleteTarget?.label ?? ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}10`,
  },
  userName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  userLogout: {
    fontSize: fontSize.xs,
    color: colors.primary,
    textAlign: 'right',
  },
  errorBox: {
    backgroundColor: colors.warningBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.lg,
    borderRadius: spacing.sm,
    marginBottom: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  toastContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    left: spacing.lg,
    alignItems: 'center',
  },
});

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
