import { Redirect } from 'expo-router';
import { homeFor, useAuth } from '@/lib/auth';

// The Gate in _layout.tsx already guards the areas; this just picks the starting screen.
export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? homeFor(user.role) : '/login'} />;
}
