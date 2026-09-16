import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { colors } from '../../../shared/theme';

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
      // Firebase's subscription changes the navigator; no manual navigation.
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
          <Text style={styles.brand}>CALENDAR</Text>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {isSignUp
                ? 'Make time for\nwhat matters.'
                : 'A little more\nspace for your day.'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Create your account to get started.'
                : 'Sign in to your personal calendar.'}
            </Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create account' : 'Welcome back'}
            </Text>
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
              editable={!loading}
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
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={() => {
                void submit();
              }}
            />
            {message ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {message}
              </Text>
            ) : null}
            <Button
              title={isSignUp ? 'Create account' : 'Sign in'}
              loading={loading}
              onPress={() => {
                void submit();
              }}
            />
          </View>
          <Text style={styles.switchPrompt}>
            {isSignUp ? 'Already have an account?' : 'New here?'}
          </Text>
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
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.primary,
    marginBottom: 16,
  },
  heading: { gap: 12, marginBottom: 16 },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
  },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  form: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { fontSize: 21, fontWeight: '700', color: colors.text },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
  switchPrompt: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
});
