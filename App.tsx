import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import {
  firebaseConfig,
  isFirebaseConfigured,
} from './src/config/firebaseConfig';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { getFirebaseAuthService } from './src/features/auth/services/firebaseAuthService';
import type { AuthService } from './src/features/auth/types';
import { StatusScreen } from './src/shared/components';

function initialize(): { service: AuthService | null; message?: string } {
  if (!isFirebaseConfigured(firebaseConfig)) {
    return {
      service: null,
      message:
        'This build is waiting for account setup. Sign-in will be available once setup is complete.',
    };
  }
  try {
    return { service: getFirebaseAuthService() };
  } catch {
    return {
      service: null,
      message: 'The account service could not start. Please try again.',
    };
  }
}

export default function App() {
  const [setup, setSetup] = useState(initialize);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {setup.service ? (
        <AuthProvider service={setup.service}>
          <RootNavigator />
        </AuthProvider>
      ) : (
        <StatusScreen
          title="Account setup is pending"
          message={setup.message}
          onRetry={() => setSetup(initialize())}
        />
      )}
    </SafeAreaProvider>
  );
}
