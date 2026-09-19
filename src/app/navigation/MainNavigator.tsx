import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

type MainRoutes = { Calendar: undefined; Profile: undefined };
const Tabs = createBottomTabNavigator<MainRoutes>();

function CalendarIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'▦'}</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'○'}</Text>;
}

function renderCalendarScreen() {
  return <CalendarScreen />;
}

/** The provider unmounts with the tabs, so logout clears the session's view. */
export function MainNavigator() {
  return (
    <CalendarNavigationProvider>
      <MainTabs />
    </CalendarNavigationProvider>
  );
}

function MainTabs() {
  const { view } = useCalendarNavigation();
  const { setView } = useCalendarActions();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs.Navigator
        screenOptions={({ navigation, route }) => ({
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          // Crossfade rather than shift: the calendar already uses horizontal
          // motion to mean "another month", and a sliding tab change would
          // borrow that meaning for something else.
          animation: 'fade',
          header: () => (
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
          ),
        })}
      >
        <Tabs.Screen
          name="Calendar"
          options={{
            tabBarIcon: CalendarIcon,
            tabBarAccessibilityLabel: 'Calendar',
          }}
        >
          {renderCalendarScreen}
        </Tabs.Screen>
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

const styles = StyleSheet.create({ root: { flex: 1 }, icon: { fontSize: 22 } });
