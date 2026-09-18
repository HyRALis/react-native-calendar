import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, controlSizes, opacity, spacing } from '../../theme';
import { Typography } from '../atoms/Typography';

export type PageHeaderProps = {
  title: string;
  onMenuPress: () => void;
  menuOpen?: boolean;
};

export function PageHeader({
  title,
  onMenuPress,
  menuOpen = false,
}: PageHeaderProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open calendar menu"
          accessibilityState={{ expanded: menuOpen }}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menu, pressed && styles.pressed]}
        >
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={styles.lines}
          >
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.line} />
          </View>
        </Pressable>
        <Typography
          accessibilityRole="header"
          variant="subtitle"
          style={styles.title}
        >
          {title}
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: controlSizes.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menu: {
    width: controlSizes.sm,
    height: controlSizes.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: { gap: spacing.xs },
  line: { width: 22, height: 2, backgroundColor: colors.text, borderRadius: 1 },
  title: { flex: 1 },
  pressed: { opacity: opacity.pressed },
});
