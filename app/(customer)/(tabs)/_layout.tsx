import { Tabs } from 'expo-router';
import { tabIcon, useTabOptions } from '@/ui/nav';

export default function CustomerTabs() {
  const options = useTabOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home-variant-outline') }} />
      <Tabs.Screen name="bookings" options={{ title: 'My bookings', tabBarLabel: 'Bookings', tabBarIcon: tabIcon('calendar-text-outline') }} />
      <Tabs.Screen name="book" options={{ title: 'Book a repair', tabBarLabel: 'Book', tabBarIcon: tabIcon('plus-circle-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'My account', tabBarLabel: 'Account', tabBarIcon: tabIcon('account-circle-outline') }} />
    </Tabs>
  );
}
