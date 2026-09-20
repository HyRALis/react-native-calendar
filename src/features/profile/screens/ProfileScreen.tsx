import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { authErrorMessage } from '../../auth/services/authErrorMessage';
import { Button, Typography } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { BiometricSettings } from '../components/BiometricSettings';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const { state, service, busy } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signingOut = useRef(false);
  async function logout() {
    if (signingOut.current) {
      return;
    }
    signingOut.current = true;
    setLoading(true);
    setError('');
    try {
      await service.signOut();
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      signingOut.current = false;
      setLoading(false);
    }
  }
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography
          accessibilityRole="header"
          variant="heading"
          style={styles.title}
        >
          Your profile
        </Typography>
        <Typography tone="muted">Your account, all in one place.</Typography>
        <View style={styles.card}>
          <Typography variant="overline" tone="muted">
            EMAIL ADDRESS
          </Typography>
          <Typography selectable style={styles.email}>
            {state.user?.email ?? 'No email address'}
          </Typography>
          <Typography variant="overline" tone="muted">
            ACCOUNT ID
          </Typography>
          <Typography selectable variant="caption" tone="muted">
            {state.user?.id}
          </Typography>
        </View>
        <BiometricSettings />
        {error ? (
          <Typography accessibilityRole="alert" variant="caption" tone="error">
            {error}
          </Typography>
        ) : null}
        <Button
          title="Logout"
          onPress={() => {
            void logout();
          }}
          loading={loading}
          disabled={busy}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  title: { marginTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  email: { marginBottom: spacing.md },
});
