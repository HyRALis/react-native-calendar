import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { CalendarScreen } from '../../features/calendar/screens/CalendarScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { StatusScreen } from '../../shared/components/StatusScreen';
import { colors } from '../../shared/theme';

type AuthRoutes = { SignIn: undefined; SignUp: undefined };
type MainRoutes = { Calendar: undefined; Profile: undefined };
const AuthStack = createNativeStackNavigator<AuthRoutes>();
const Tabs = createBottomTabNavigator<MainRoutes>();
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
function CalendarIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>▦</Text>;
}
function ProfileIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>○</Text>;
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
        <Tabs.Navigator
          key={state.user.id}
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            headerShadowVisible: false,
          }}
        >
          <Tabs.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ tabBarIcon: CalendarIcon }}
          />
          <Tabs.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarIcon: ProfileIcon }}
          />
        </Tabs.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn" component={SignIn} />
          <AuthStack.Screen name="SignUp" component={SignUp} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ icon: { fontSize: 22 } });
