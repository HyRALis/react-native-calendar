import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { LockedSessionScreen } from '../../features/auth/screens/LockedSessionScreen';
import { StatusScreen } from '../../shared/components';
import { colors } from '../../shared/theme';
import { MainNavigator } from './MainNavigator';
import { useReducedMotion } from '../../shared/hooks/useReducedMotion';

type RootRoutes = { SignIn: undefined; SignUp: undefined; Main: undefined };
const RootStack = createNativeStackNavigator<RootRoutes>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function SignIn({ navigation }: NativeStackScreenProps<RootRoutes, 'SignIn'>) {
  return (
    <AuthScreen mode="signIn" onSwitch={() => navigation.replace('SignUp')} />
  );
}
function SignUp({ navigation }: NativeStackScreenProps<RootRoutes, 'SignUp'>) {
  return (
    <AuthScreen mode="signUp" onSwitch={() => navigation.replace('SignIn')} />
  );
}
function MainRoute() {
  const { state } = useAuth();

  return state.status === 'signedIn' ? (
    <MainNavigator key={state.user.id} />
  ) : null;
}

export function RootNavigator() {
  const reducedMotion = useReducedMotion();
  const { state, retry, obscured } = useAuth();
  if (obscured) {
    return <StatusScreen title="Calendar locked" />;
  }
  if (state.status === 'locked') {
    return <LockedSessionScreen />;
  }
  if (state.status === 'loading') {
    return <StatusScreen title="Opening your calendar" loading />;
  }
  if (state.status === 'error') {
    return (
      <StatusScreen
        title="Unable to open your account"
        message={state.message}
        onRetry={retry}
      />
    );
  }
  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: reducedMotion ? 'none' : 'fade',
        }}
      >
        {state.status === 'signedIn' ? (
          <RootStack.Screen name="Main" component={MainRoute} />
        ) : (
          <>
            <RootStack.Screen name="SignIn" component={SignIn} />
            <RootStack.Screen name="SignUp" component={SignUp} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
