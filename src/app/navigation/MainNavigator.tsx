import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabHeaderProps,
} from '@react-navigation/bottom-tabs';
import { CalendarScreen } from '../../features/calendar/screens/CalendarScreen';
import { CalendarDrawer } from '../../features/calendar/components/CalendarDrawer';
import {
  CalendarNavigationProvider,
  useCalendarActions,
  useCalendarNavigation,
} from '../../features/calendar/navigation';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { PageHeader } from '../../shared/components/molecules/PageHeader';
import { colors } from '../../shared/theme';
import { useAuth } from '../../features/auth/AuthProvider';
import { createEventStore } from '../../features/calendar/storage/eventStore';
import { useReducedMotion } from '../../shared/hooks/useReducedMotion';

type MainRoutes = { Calendar: undefined; Profile: undefined };
const Tabs = createBottomTabNavigator<MainRoutes>();

function CalendarIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'▦'}</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'○'}</Text>;
}

function AccountCalendar() {
  const { state } = useAuth();
  const accountId = state.user?.id;
  const store = useMemo(
    () => (accountId ? createEventStore(accountId) : null),
    [accountId],
  );
  return store ? <CalendarScreen key={accountId} eventStore={store} /> : null;
}

export function MainNavigator() {
  return (
    <CalendarNavigationProvider>
      <MainTabs />
    </CalendarNavigationProvider>
  );
}

function MainHeader({ navigation, route }: BottomTabHeaderProps) {
  const { view } = useCalendarNavigation();
  const { setView } = useCalendarActions();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <PageHeader
        title={route.name}
        menuOpen={menuOpen}
        onMenuPress={() => setMenuOpen(true)}
      />
      <CalendarDrawer
        visible={menuOpen && navigation.isFocused()}
        selectedView={view}
        onClose={() => setMenuOpen(false)}
        onSelectView={next => {
          setView(next);
          setMenuOpen(false);
          navigation.navigate('Calendar');
        }}
      />
    </>
  );
}

function MainTabs() {
  const reducedMotion = useReducedMotion();
  return (
    <View style={styles.root}>
      <Tabs.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          animation: reducedMotion ? 'none' : 'fade',
          header: renderMainHeader,
        }}
      >
        <Tabs.Screen
          name="Calendar"
          component={AccountCalendar}
          options={{
            tabBarIcon: CalendarIcon,
            tabBarAccessibilityLabel: 'Calendar',
          }}
        />
        <Tabs.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ProfileIcon,
            tabBarAccessibilityLabel: 'Profile',
          }}
        />
      </Tabs.Navigator>
    </View>
  );
}

function renderMainHeader(props: BottomTabHeaderProps) {
  return <MainHeader {...props} />;
}

const styles = StyleSheet.create({ root: { flex: 1 }, icon: { fontSize: 22 } });
