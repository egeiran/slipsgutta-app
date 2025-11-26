import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadow, fontSize } from './theme';

export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadow.md,
    },
    cardCompact: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadow.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textBase: {
        fontSize: fontSize.base,
        color: colors.text,
    },
    textSecondary: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    textTertiary: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    heading: {
        fontSize: fontSize.xxl,
        fontWeight: '700',
        color: colors.text,
    },
    subheading: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: colors.text,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.base,
        color: colors.text,
    },
    inputFocused: {
        borderColor: colors.primary,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: fontSize.base,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonSecondaryText: {
        color: colors.text,
    },
    buttonDanger: {
        backgroundColor: colors.error,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
