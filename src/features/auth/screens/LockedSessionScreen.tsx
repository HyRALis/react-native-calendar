import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthProvider';
import { Button, Typography } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';

export function LockedSessionScreen() {
  const { biometry, enabled, checking, busy, message, unlock, service } =
    useAuth();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="heading" accessibilityRole="header">
          Unlock your calendar
        </Typography>
        <Typography tone="muted">
          {checking
            ? 'Checking biometric availability…'
            : enabled && biometry
            ? 'Confirm your identity to access your calendar and profile.'
            : 'Sign in with your password to continue. You can enable biometrics in Profile on a supported device.'}
        </Typography>
        {message ? (
          <Typography accessibilityRole="alert" tone="error">
            {message}
          </Typography>
        ) : null}
        {enabled && biometry ? (
          <Button
            title={`Unlock with ${biometry}`}
            loading={busy}
            disabled={checking}
            onPress={() => {
              void unlock();
            }}
          />
        ) : null}
        <Button
          title="Use password"
          variant="outline"
          disabled={busy}
          onPress={() => {
            void service.signOut();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.xl,
  },
});
