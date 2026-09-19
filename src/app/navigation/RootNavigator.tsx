import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { StatusScreen } from '../../shared/components';
import { colors } from '../../shared/theme';
import { MainNavigator } from './MainNavigator';

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
/**
 * Keyed by account, so a session that changes hands starts the calendar over
 * instead of inheriting the previous user's view.
 */
function MainRoute() {
  const { state } = useAuth();

  return (
    <MainNavigator key={state.status === 'signedIn' ? state.user.id : 'none'} />
  );
}

export function RootNavigator() {
  const { state, retry } = useAuth();
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
  // One stack holds both halves of the app, so signing in and out crossfades
  // rather than snapping. Screens for the half you are not in are absent from
  // the navigator entirely, which is what removes private navigation history
  // on logout — the same guarantee the previous whole-tree swap gave.
  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {state.status === 'signedIn' ? (
          <RootStack.Screen name="Main" component={MainRoute} />
        ) : (
          // Signing in and signing up are the same form in two modes, so they
          // crossfade too rather than sliding as though one followed the other.
          <>
            <RootStack.Screen name="SignIn" component={SignIn} />
            <RootStack.Screen name="SignUp" component={SignUp} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
