import { useState } from 'react';
import { View } from 'react-native';
import { FAB, IconButton, Switch, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showApiError } from '@/lib/form';
import { formatDuration, formatINR } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useCategories, useSaveService, useSetServiceActive } from '@/lib/queries/catalog';
import { serviceSchema, type ServiceInput, type ServiceOutput } from '@/lib/schemas/service';
import type { Service } from '@/lib/types';
import { FormAlert, SelectField, SubmitButton, SwitchField, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Card, InfiniteList } from '@/ui/Parts';
import { useToast } from '@/ui/toast';

function ServiceForm({ service, onDone }: { service?: Service; onDone: () => void }) {
  const toast = useToast();
  const save = useSaveService();
  const categories = useCategories();
  const form = useForm<ServiceInput, unknown, ServiceOutput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: service?.category.id ?? '',
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMinutes: service ? String(service.durationMinutes) : '60',
      basePrice: service ? String(Number(service.basePrice)) : '',
      active: service?.active ?? true,
    },
    mode: 'onTouched',
  });
  const submit = form.handleSubmit((v) =>
    save.mutateAsync({ ...v, id: service?.id }).then(
      () => { toast.success(service ? 'Service updated' : 'Service added'); onDone(); },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message ?? categories.error?.message} />
      <SelectField control={form.control} name="categoryId" label="Category" options={categories.data?.items.map((c) => ({ value: c.id, label: c.name })) ?? []} />
      <TextField control={form.control} name="name" label="Service name" />
      <TextField control={form.control} name="description" label="Description (optional)" multiline lines={3} />
      <TextField control={form.control} name="durationMinutes" label="Duration (minutes)" keyboardType="number-pad" hint="15 to 480, in steps of 15" left="timer-outline" />
      <TextField control={form.control} name="basePrice" label="Visit charge (₹)" keyboardType="decimal-pad" left="currency-inr" />
      <SwitchField control={form.control} name="active" label="Offered to customers" />
      <SubmitButton onPress={submit} pending={save.isPending}>{service ? 'Save service' : 'Add service'}</SubmitButton>
    </>
  );
}

// Owner only: the services customers can book, with price and duration.
export function ServicesList() {
  const theme = useTheme();
  const toast = useToast();
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const setActive = useSetServiceActive();
  const list = useInfiniteList<Service>('services', '/services', { includeInactive: true, pageSize: 50 });

  return (
    <View style={{ flex: 1 }}>
      <InfiniteList
        query={list}
        emptyIcon="tools"
        emptyTitle="No services yet"
        emptyDescription="Add the repairs you offer."
        renderItem={(s) => (
          // Not a tappable card: a switch inside a tappable card would also open the editor.
          <Card style={{ gap: 4, opacity: s.active ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>{s.category.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton icon="pencil-outline" size={20} onPress={() => setEditing(s)} accessibilityLabel={`Edit ${s.name}`} />
                <Switch value={s.active} onValueChange={(active) => setActive.mutate({ id: s.id, active }, { onError: (e) => toast.error(e.message) })} accessibilityLabel={`Offer ${s.name} to customers`} />
              </View>
            </View>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>{s.name}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{formatINR(s.basePrice)} · about {formatDuration(s.durationMinutes)}{s.active ? '' : ' · Hidden'}</Text>
          </Card>
        )}
      />
      <FAB icon="plus" label="New service" onPress={() => setEditing('new')} style={{ position: 'absolute', right: 16, bottom: 16 }} />
      <FormModal visible={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New service' : 'Edit service'}>
        {editing !== null && <ServiceForm service={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </FormModal>
    </View>
  );
}
