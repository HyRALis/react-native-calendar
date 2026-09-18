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

type AuthRoutes = { SignIn: undefined; SignUp: undefined };
const AuthStack = createNativeStackNavigator<AuthRoutes>();
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

function SignIn({ navigation }: NativeStackScreenProps<AuthRoutes, 'SignIn'>) {
  return (
    <AuthScreen mode="signIn" onSwitch={() => navigation.replace('SignUp')} />
  );
}
function SignUp({ navigation }: NativeStackScreenProps<AuthRoutes, 'SignUp'>) {
  return (
    <AuthScreen mode="signUp" onSwitch={() => navigation.replace('SignIn')} />
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
  // Replacing the entire tree removes private navigation history on logout.
  return (
    <NavigationContainer theme={theme}>
      {state.status === 'signedIn' ? (
        <MainNavigator key={state.user.id} />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn" component={SignIn} />
          <AuthStack.Screen name="SignUp" component={SignUp} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
