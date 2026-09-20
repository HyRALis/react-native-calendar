import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthProvider';
import type { AuthMode } from '../types';
import {
  validateCredentials,
  type CredentialErrors,
} from '../validation/validateCredentials';
import { authErrorMessage } from '../services/authErrorMessage';
import { Button, FormField, Typography } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';

export function AuthScreen({
  mode,
  onSwitch,
}: {
  mode: AuthMode;
  onSwitch: () => void;
}) {
  const { service } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const isSignUp = mode === 'signUp';

  async function submit() {
    if (submitting.current) {
      return;
    }
    const values = { email, password };
    const nextErrors = validateCredentials(values, mode);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) {
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      await (isSignUp ? service.signUp(values) : service.signIn(values));
      setPassword('');
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="overline" tone="primary" style={styles.brand}>
            CALENDAR
          </Typography>
          <View style={styles.heading}>
            <Typography accessibilityRole="header" variant="display">
              {isSignUp
                ? 'Make time for\nwhat matters.'
                : 'A little more\nspace for your day.'}
            </Typography>
            <Typography tone="muted">
              {isSignUp
                ? 'Create your account to get started.'
                : 'Sign in to your personal calendar.'}
            </Typography>
          </View>
          <View style={styles.form}>
            <Typography variant="subtitle">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </Typography>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              disabled={loading}
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              disabled={loading}
              returnKeyType="go"
              onSubmitEditing={() => {
                void submit();
              }}
            />
            {message ? (
              <Typography
                accessibilityRole="alert"
                variant="caption"
                tone="error"
              >
                {message}
              </Typography>
            ) : null}
            <Button
              title={isSignUp ? 'Create account' : 'Sign in'}
              loading={loading}
              onPress={() => {
                void submit();
              }}
            />
          </View>
          <Typography
            variant="caption"
            tone="muted"
            style={styles.switchPrompt}
          >
            {isSignUp ? 'Already have an account?' : 'New here?'}
          </Typography>
          <Button
            variant="secondary"
            title={isSignUp ? 'Go to sign in' : 'Create an account'}
            onPress={onSwitch}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  brand: {
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  heading: { gap: spacing.md, marginBottom: spacing.lg },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchPrompt: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
