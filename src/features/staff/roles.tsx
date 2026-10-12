import { useState } from 'react';
import { View } from 'react-native';
import { Chip, Icon, Text } from 'react-native-paper';
import { useAppTheme } from '@/ui/theme';
import type { Role } from '@/lib/auth';
import { PERMISSIONS, ROLE_INFO, ROLE_ORDER, type Permission } from '@/lib/permissions';
import { Card, SectionTitle } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';

function Access({ p }: { p: Permission }) {
  const theme = useAppTheme();
  const look = {
    full: { icon: 'check', label: 'Yes', color: theme.app.success },
    own: { icon: 'account-outline', label: 'Own only', color: theme.colors.primary },
    none: { icon: 'minus', label: 'No', color: theme.colors.onSurfaceVariant },
  }[p.access];
  return (
    <View style={{ alignItems: 'flex-end', maxWidth: '45%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon source={look.icon} size={16} color={look.color} />
        <Text variant="labelLarge" style={{ color: look.color }}>{look.label}</Text>
      </View>
      {p.note && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>{p.note}</Text>}
    </View>
  );
}

// Read-only: what each role can do. The rules are built in and checked by the server on every request.
// One role at a time, because a 4-column table does not fit a phone.
export function RolesScreen() {
  const theme = useAppTheme();
  const [role, setRole] = useState<Role>('OWNER');
  return (
    <Screen>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        These rules are built in and checked by the server on every request; they are not editable.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROLE_ORDER.map((r) => (
          <Chip key={r} mode={role === r ? 'flat' : 'outlined'} selected={role === r} showSelectedOverlay onPress={() => setRole(r)} testID={`role-${r}`}>{ROLE_INFO[r].label}</Chip>
        ))}
      </View>
      <Card style={{ gap: 4 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700' }}>{ROLE_INFO[role].label}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{ROLE_INFO[role].summary}</Text>
      </Card>
      {PERMISSIONS.map((m) => (
        <View key={m.module} style={{ gap: 8 }}>
          <SectionTitle>{m.module}</SectionTitle>
          <Card style={{ gap: 12 }}>
            {m.rows.map((row) => (
              <View key={row.action} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text variant="bodyMedium" style={{ flex: 1 }}>{row.action}</Text>
                <Access p={row.roles[role]} />
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
