import { Tabs } from 'expo-router';
import { tabIcon, useTabOptions } from '@/ui/nav';

export default function TechTabs() {
  const options = useTabOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="tech" options={{ title: 'My jobs', tabBarLabel: 'Today', tabBarIcon: tabIcon('clipboard-text-clock-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'My account', tabBarLabel: 'Account', tabBarIcon: tabIcon('account-circle-outline') }} />
    </Tabs>
  );
}
