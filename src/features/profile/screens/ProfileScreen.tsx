import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { authErrorMessage } from '../../auth/services/authErrorMessage';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/theme';

export function ProfileScreen() {
  const { state, service } = useAuth();
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
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        Your profile
      </Text>
      <Text style={styles.subtitle}>Your account, all in one place.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <Text selectable style={styles.email}>
          {state.user?.email ?? 'No email address'}
        </Text>
        <Text style={styles.label}>ACCOUNT ID</Text>
        <Text selectable style={styles.id}>
          {state.user?.id}
        </Text>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        title="Logout"
        onPress={() => {
          void logout();
        }}
        loading={loading}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginTop: 16 },
  subtitle: { color: colors.muted, fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
  },
  email: { fontSize: 18, color: colors.text, marginBottom: 12 },
  id: { fontSize: 14, color: colors.muted },
  error: { color: colors.error, fontSize: 14 },
});
