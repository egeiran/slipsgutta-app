import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Users, Check, AlertCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';
import { ConfirmModal } from '../ui/ConfirmModal';
import { getWeekNumber } from '../../lib/utils';
import type { Profile, ChoreStatus } from '../../hooks/usePlannerData';

type RoommateStatusProps = {
  profiles: Profile[];
  choreStatuses: ChoreStatus[];
  onMarkDone: (task: string, profileId: string, completed: boolean) => Promise<void>;
  loading: boolean;
};

const CHORES = [
  "Vaske/rydde stua",
  "Vaske/rydde kjøkkenet",
  "Vaske/rydde badene",
  "Vaske/rydde gangen",
];

type Assignment = { task: string; profile: Profile | null };
type Rotation = { currentAssignments: Assignment[]; nextAssignments: Assignment[] };

export function RoommateStatus({ profiles, choreStatuses, onMarkDone, loading }: RoommateStatusProps) {
  const [confirmTarget, setConfirmTarget] = useState<{ profile: Profile; task: string; action: 'complete' | 'undo' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rotation = useMemo<Rotation>(() => buildRotation(profiles), [profiles]);
  
  const completionLookup = useMemo(() => {
    const map = new Map<string, ChoreStatus>();
    choreStatuses.forEach((status) => {
      map.set(status.task, status);
    });
    return map;
  }, [choreStatuses]);

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setSubmitting(true);
    try {
      const completed = confirmTarget.action === 'complete';
      await onMarkDone(confirmTarget.task, confirmTarget.profile.id, completed);
      setConfirmTarget(null);
    } catch (error) {
      console.error('Failed to update chore status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (profiles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        icon={<Users size={20} color={colors.warning} />}
        title="Ukens oppgaver"
        subtitle="Hvem har ansvaret denne uka?"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Denne uka</Text>
            <View style={styles.cardList}>
              {rotation.currentAssignments.map(({ task, profile }) => (
                <ChoreCard
                  key={`${task}-${profile?.id ?? task}`}
                  task={task}
                  profile={profile}
                  completed={profile ? Boolean(completionLookup.get(task)?.completed) : false}
                  active
                  onPress={() => {
                    if (!profile) return;
                    const isCompleted = Boolean(completionLookup.get(task)?.completed);
                    setConfirmTarget({ 
                      profile, 
                      task, 
                      action: isCompleted ? 'undo' : 'complete' 
                    });
                  }}
                  disabled={loading || submitting}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Neste uke</Text>
            <View style={styles.cardList}>
              {rotation.nextAssignments.map(({ task, profile }) => (
                <ChoreCard 
                  key={`${task}-${profile?.id ?? task}`} 
                  task={task} 
                  profile={profile} 
                  completed={false} 
                  active={false} 
                />
              ))}
            </View>
          </View>
        </View>
      )}

      <ConfirmModal
        visible={Boolean(confirmTarget)}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmTarget(null)}
        title={confirmTarget?.action === 'complete' ? "Er det gjort?" : "Ikke gjort likevel?"}
        description={
          confirmTarget?.action === 'complete' 
            ? "Er du sikker på at dette er PEAK nok?" 
            : "Er du sikker på at du vil angre? Da blir det cooked igjen."
        }
        confirmLabel={confirmTarget?.action === 'complete' ? "Ja, det er peak" : "Ja, angre"}
        cancelLabel="Nei, vent"
        variant={confirmTarget?.action === 'complete' ? 'primary' : 'danger'}
      />
    </View>
  );
}

function ChoreCard({
  task,
  profile,
  completed,
  active,
  onPress,
  disabled,
}: {
  task: string;
  profile: Profile | null;
  completed: boolean;
  active: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  if (!profile) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.taskName}>{task}</Text>
        <Text style={styles.profileName}>
          {profile.display_name} • {active ? "Ukeoppgave" : "Kommer snart"}
        </Text>
      </View>
      
      {active && (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={[
            styles.statusButton,
            completed ? styles.statusButtonDone : styles.statusButtonPending,
            disabled && styles.statusButtonDisabled
          ]}
        >
          {completed ? (
            <>
              <Check size={14} color={colors.success} />
              <Text style={styles.statusTextDone}>Ferdig</Text>
            </>
          ) : (
            <Text style={styles.statusTextPending}>Marker gjort</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

function buildRotation(profiles: Profile[]): Rotation {
  if (profiles.length === 0) {
    return { currentAssignments: [], nextAssignments: [] };
  }

  const weekNumber = getWeekNumber(new Date());
  const startIndex = weekNumber % profiles.length;

  const ordered = [...profiles];
  const rotate = (offset: number) => ordered[(startIndex + offset) % ordered.length] ?? null;

  const currentAssignments: Assignment[] = CHORES.map((task, index) => ({ task, profile: rotate(index) }));
  const nextAssignments: Assignment[] = CHORES.map((task, index) => ({ task, profile: rotate(index + 1) }));

  return { currentAssignments, nextAssignments };
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.xs,
  },
  cardList: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  profileName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
  },
  statusButtonPending: {
    backgroundColor: colors.text,
  },
  statusButtonDone: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusButtonDisabled: {
    opacity: 0.7,
  },
  statusTextPending: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusTextDone: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
});

