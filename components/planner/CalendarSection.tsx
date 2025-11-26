import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Calendar as CalendarIcon, Trash2, Plus, MapPin, Clock, ExternalLink, PlusCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Profile, CalendarEvent } from '../../hooks/usePlannerData';

type CalendarHandlers = {
  onAdd: (payload: Partial<CalendarEvent>) => Promise<void>;
  onUpdate: (id: number, payload: Partial<CalendarEvent>) => Promise<void>;
  onDeleteRequest: (item: CalendarEvent) => void;
};

type CalendarSectionProps = {
  events: CalendarEvent[];
  profiles: Profile[];
  loading: boolean;
  lastGoogleFetch: Date | null;
  currentUserId?: string;
  handlers: CalendarHandlers;
};

export function CalendarSection({
  events,
  profiles,
  loading,
  lastGoogleFetch,
  currentUserId,
  handlers,
}: CalendarSectionProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const calendarEmbedUrl =
    'https://calendar.google.com/calendar/embed?src=deusj76c77ctm4g2hvlavmsa3l5793st%40import.calendar.google.com&ctz=Europe%2FOslo';
  const calendarSubscribeUrl =
    'https://calendar.google.com/calendar/u/0/r?cid=deusj76c77ctm4g2hvlavmsa3l5793st@import.calendar.google.com';
  const storageKey = currentUserId ? `@slips_calendar_added_${currentUserId}` : '@slips_calendar_added';

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        setCalendarAdded(stored === 'true');
      } catch {
        setCalendarAdded(false);
      }
    };
    load();
  }, [storageKey]);

  const openExternal = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Kunne ikke åpne linken', 'Kopier adressen og lim den inn i Safari.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Noe gikk galt', 'Prøv igjen om et øyeblikk.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
      return date.toLocaleDateString('no-NO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: CalendarEvent }) => (
    <View style={styles.item}>
      <View style={styles.eventTypeIndicator}>
        <View style={[styles.eventDot, getEventTypeStyle(item.event_type)]} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.textTertiary} />
            <Text style={styles.detailText}>{formatDate(item.starts_at)}</Text>
          </View>
          
          {item.location && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.textTertiary} />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}
          
          <Text style={styles.itemMeta}>
            Av: {item.profiles?.display_name ?? 'Ukjent'}
          </Text>
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
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        icon={<CalendarIcon size={20} color={colors.info} />}
        title="Kalender"
        subtitle="Kommende hendelser"
        badge={`${events.length} hendelser`}
      >
        <Pressable
          style={styles.addButton}
          onPress={() => setAddModalOpen(true)}
        >
          <Plus size={18} color="#ffffff" />
        </Pressable>
      </SectionHeader>

      <View style={styles.googleCard}>
        <View style={styles.googleCardHeader}>
          <View>
            <Text style={styles.googleCardTitle}>Google kalender</Text>
            <Text style={styles.googleCardSubtitle}>
              Abonner og se hele oversikten
            </Text>
          </View>
          <View style={styles.googleBadge}>
            <Text style={styles.googleBadgeText}>Synk</Text>
          </View>
        </View>

        <Text style={styles.googleDescription}>
          Åpne kalenderen i Google for å se alle detaljene, eller legg den til i
          din egen konto med ett trykk. Fungerer best på iPhone.
        </Text>

        <View style={styles.googleActions}>
          <Pressable
            style={styles.openButton}
            onPress={() => openExternal(calendarEmbedUrl)}
          >
            <ExternalLink size={18} color={colors.info} />
            <Text style={styles.openButtonText}>Åpne kalender</Text>
          </Pressable>
          {!calendarAdded ? (
            <Pressable
              style={styles.subscribeButton}
              onPress={async () => {
                await openExternal(calendarSubscribeUrl);
                setCalendarAdded(true);
                await AsyncStorage.setItem(storageKey, 'true');
              }}
            >
              <PlusCircle size={20} color="#ffffff" />
              <Text style={styles.subscribeButtonText}>Legg til i min</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.addedButton}
              onPress={() => {
                Alert.alert(
                  'Fjern status?',
                  'Fjern markeringen for at kalenderen er lagt til?',
                  [
                    { text: 'Avbryt', style: 'cancel' },
                    {
                      text: 'Fjern',
                      style: 'destructive',
                      onPress: async () => {
                        setCalendarAdded(false);
                        await AsyncStorage.setItem(storageKey, 'false');
                      },
                    },
                  ]
                );
              }}
            >
              <PlusCircle size={18} color={colors.success} />
              <Text style={styles.addedButtonText}>Kalender lagt til!</Text>
            </Pressable>
          )}
        </View>

        {lastGoogleFetch ? (
          <Text style={styles.googleMeta}>
            Sist hentet av Google:{' '}
            {lastGoogleFetch.toLocaleTimeString('nb-NO', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            {lastGoogleFetch.toLocaleDateString('nb-NO', {
              day: '2-digit',
              month: '2-digit',
            })}{' '}
            (kan henge opptil 24t)
          </Text>
        ) : (
          <Text style={styles.googleMeta}>
            Google kan bruke opptil 24 timer på å hente ny data første gang.
          </Text>
        )}
      </View>

      {loading && events.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : events.length === 0 ? (
        <Text style={styles.emptyText}>Ingen hendelser lagt inn enda.</Text>
      ) : (
        <View style={styles.list}>
          {events.map((item) => (
            <React.Fragment key={item.id}>{renderItem({ item })}</React.Fragment>
          ))}
        </View>
      )}

      <CalendarFormModal
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

function getEventTypeStyle(eventType: string) {
  switch (eventType.toLowerCase()) {
    case 'fest':
    case 'party':
      return { backgroundColor: colors.primary };
    case 'møte':
    case 'meeting':
      return { backgroundColor: colors.info };
    case 'middag':
    case 'dinner':
      return { backgroundColor: colors.success };
    default:
      return { backgroundColor: colors.textTertiary };
  }
}

type CalendarFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<CalendarEvent>) => Promise<void>;
  profiles: Profile[];
};

function CalendarFormModal({ visible, onClose, onSubmit, profiles }: CalendarFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [eventType, setEventType] = useState('Annet');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0].id);
    }
  }, [profiles, selectedProfile]);

  const handleSubmit = async () => {
    if (!title.trim() || !startsAt) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        starts_at: startsAt,
        ends_at: null,
        event_type: eventType,
        owner: selectedProfile || null,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt('');
      setEventType('Annet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Legg til hendelse">
      <Input
        label="Tittel *"
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Fredagsmiddag"
      />
      <Input
        label="Beskrivelse"
        value={description}
        onChangeText={setDescription}
        placeholder="F.eks. Pizza og film"
        multiline
        numberOfLines={2}
      />
      <Input
        label="Sted"
        value={location}
        onChangeText={setLocation}
        placeholder="F.eks. Hjemme"
      />
      <Input
        label="Starttid (YYYY-MM-DD HH:MM) *"
        value={startsAt}
        onChangeText={setStartsAt}
        placeholder="2025-11-30 19:00"
      />
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeButtons}>
          {['Fest', 'Møte', 'Middag', 'Annet'].map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeButton,
                eventType === type && styles.typeButtonActive,
              ]}
              onPress={() => setEventType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  eventType === type && styles.typeButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Avbryt" variant="secondary" onPress={onClose} />
        <Button
          title="Legg til"
          variant="primary"
          onPress={handleSubmit}
          disabled={!title.trim() || !startsAt}
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
  googleCard: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.info}30`,
  },
  googleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  googleCardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  googleCardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  googleBadge: {
    backgroundColor: colors.info,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  googleBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: fontSize.xs,
  },
  googleDescription: {
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  googleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: `${colors.info}40`,
  },
  openButtonText: {
    color: colors.info,
    fontWeight: '700',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.info,
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: `${colors.success}60`,
  },
  addedButtonText: {
    color: colors.success,
    fontWeight: '700',
  },
  googleHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  googleMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    flexDirection: 'row',
  },
  eventTypeIndicator: {
    marginRight: spacing.md,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
    backgroundColor: colors.info,
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
