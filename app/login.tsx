import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/lib/auth';
import { Button } from '../src/ui/Parts';
import { s } from '../src/ui/theme';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[s.screen, { justifyContent: 'center' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.pad}>
        <Text style={s.title}>HomeFix Technician</Text>
        <Text style={s.muted}>Log in to see your visits.</Text>
        <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button title="Log in" onPress={submit} busy={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}
