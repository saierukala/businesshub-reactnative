import { Tabs } from 'expo-router';
import { tabIcon, useTabOptions } from '@/ui/nav';

export default function StaffTabs() {
  const options = useTabOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="staff/index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('view-dashboard-outline') }} />
      <Tabs.Screen name="staff/bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-text-outline') }} />
      <Tabs.Screen name="staff/customers" options={{ title: 'Customers', tabBarIcon: tabIcon('account-multiple-outline') }} />
      <Tabs.Screen name="staff/more" options={{ title: 'More', tabBarIcon: tabIcon('dots-horizontal-circle-outline') }} />
    </Tabs>
  );
}
