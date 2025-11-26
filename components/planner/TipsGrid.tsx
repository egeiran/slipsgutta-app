import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../../styles/theme';
import { SectionHeader } from './shared/SectionHeader';

const TIPS = [
  'Bruk prioritet "Høy" for ting vi trenger ASAP',
  'Sett "Trengs før" dato på viktige varer',
  'Sjekk kalenderen for å planlegge middager',
  'Marker oppgaver som gjort når de er ferdige',
];

export function TipsGrid() {
  return (
    <View style={styles.container}>
      <SectionHeader
        icon={<Lightbulb size={20} color={colors.warning} />}
        title="Tips & triks"
      />

      <View style={styles.grid}>
        {TIPS.map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  grid: {
    gap: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tipNumberText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.warning,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
});
