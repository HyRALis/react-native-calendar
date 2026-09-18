import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarScreen } from '../../features/calendar/screens/CalendarScreen';
import { CalendarDrawer } from '../../features/calendar/components/CalendarDrawer';
import type { CalendarView } from '../../features/calendar/types';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { PageHeader } from '../../shared/components/molecules/PageHeader';
import { colors } from '../../shared/theme';

type MainRoutes = { Calendar: undefined; Profile: undefined };
const Tabs = createBottomTabNavigator<MainRoutes>();

function CalendarIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'\u25a6'}</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={[styles.icon, { color }]}>{'\u25cb'}</Text>;
}

/** View preference is local to the signed-in session, shared by the header and screen. */
export function MainNavigator() {
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs.Navigator
        screenOptions={({ navigation, route }) => ({
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          header: () => (
            <>
              <PageHeader
                title={route.name}
                menuOpen={menuOpen}
                onMenuPress={() => setMenuOpen(true)}
              />
              <CalendarDrawer
                visible={menuOpen && navigation.isFocused()}
                selectedView={calendarView}
                onClose={() => setMenuOpen(false)}
                onSelectView={view => {
                  setCalendarView(view);
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
          {() => <CalendarScreen view={calendarView} />}
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
