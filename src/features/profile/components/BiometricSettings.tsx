import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Typography } from '../../../shared/components';
import { spacing } from '../../../shared/theme';

export function BiometricSettings() {
  const { biometry, enabled, checking, busy, message, setBiometrics } =
    useAuth();
  return (
    <View style={styles.content}>
      <Typography variant="bodyStrong" accessibilityRole="header">
        Biometric sign-in
      </Typography>
      <Typography tone="muted">
        {checking
          ? 'Checking biometric availability…'
          : enabled
          ? 'Biometric sign-in is enabled. Your calendar locks when you leave the app.'
          : biometry
          ? `Use ${biometry} to return to your calendar without entering your password. Anyone enrolled on this device can unlock it.`
          : 'Biometrics are unavailable. Enroll a fingerprint or face in device settings, then return here. You can always use your password.'}
      </Typography>
      {message ? (
        <Typography accessibilityRole="alert" tone="error">
          {message}
        </Typography>
      ) : null}
      {biometry || enabled ? (
        <Button
          title={enabled ? 'Disable biometrics' : 'Enable biometrics'}
          variant="outline"
          loading={busy}
          disabled={checking}
          onPress={() => {
            void setBiometrics(!enabled);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.lg } });
