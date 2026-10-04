import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, IconButton, Searchbar, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounced } from '@/lib/debounce';
import { showApiError } from '@/lib/form';
import { formatDayRange, formatPhone } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useCategories } from '@/lib/queries/catalog';
import { useAddTimeOff, useRemoveTimeOff, useSaveAreas, useSaveSkills, useSaveWorkingHours, useTechnician, useTimeOff } from '@/lib/queries/technicians';
import { timeOffSchema, toTimeOffBody, type TimeOffInput } from '@/lib/schemas/time-off';
import type { Technician, TimeOff, WorkingDay } from '@/lib/types';
import { FormAlert, PillGroup, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Card, ConfirmDialog, EmptyState, ErrorState, InfiniteList, ListSkeleton, SectionTitle, Tag } from '@/ui/Parts';
import { DateField, TimeField } from '@/ui/Pickers';
import { Screen } from '@/ui/Screen';
import { useToast } from '@/ui/toast';
import { Controller } from 'react-hook-form';

export function TechniciansList() {
  const theme = useTheme();
  const router = useRouter();
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const list = useInfiniteList<Technician>('technicians', '/technicians', { q: q || undefined });
  return (
    <InfiniteList
      query={list}
      emptyIcon="account-wrench-outline"
      emptyTitle="No technicians found"
      emptyDescription="The owner adds technicians under Users. Then set them up here."
      header={<Searchbar placeholder="Search technicians" value={text} onChangeText={setText} />}
      renderItem={(t) => (
        <Card onPress={() => router.push(`/staff/technicians/${t.id}`)} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>{t.name}</Text>
            {t.status === 'INACTIVE' && <Text variant="labelMedium" style={{ color: theme.colors.error, fontWeight: '700' }}>Inactive</Text>}
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatPhone(t.phone)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {t.skills.length === 0 ? <Text variant="bodySmall" style={{ color: theme.colors.error }}>No skills yet</Text> : t.skills.map((s) => <Tag key={s.id}>{s.name}</Tag>)}
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{t.areas.length ? t.areas.join(', ') : 'No service areas yet'}</Text>
        </Card>
      )}
    />
  );
}

// Frame for the skills, areas and hours editors: content plus one Save button.
function SetupCard({ title, description, dirty, pending, onSave, children }: { title: string; description: string; dirty: boolean; pending: boolean; onSave: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{description}</Text>
        {children}
        <SubmitButton onPress={onSave} pending={pending} disabled={!dirty}>Save</SubmitButton>
      </Card>
    </View>
  );
}

function SkillsEditor({ technician }: { technician: Technician }) {
  const toast = useToast();
  const categories = useCategories();
  const save = useSaveSkills(technician.id);
  const saved = technician.skills.map((s) => s.id);
  const [selected, setSelected] = useState<string[]>(saved);
  const dirty = selected.length !== saved.length || selected.some((id) => !saved.includes(id));
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  return (
    <SetupCard title="Skills" description="Appliance types this technician can repair. They are only offered bookings for these." dirty={dirty} pending={save.isPending}
      onSave={() => save.mutate({ categoryIds: selected }, { onSuccess: () => toast.success('Skills saved'), onError: (e) => toast.error(e.message) })}>
      {categories.isPending ? <ListSkeleton rows={1} /> : categories.isError ? <ErrorState error={categories.error} onRetry={() => categories.refetch()} /> : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.data.items.map((c) => <Chip key={c.id} selected={selected.includes(c.id)} showSelectedCheck onPress={() => toggle(c.id)}>{c.name}</Chip>)}
        </View>
      )}
    </SetupCard>
  );
}

// Same spelling rule as the backend ("  kondapur " -> "Kondapur"), so the list looks the way it is saved.
const tidy = (v: string) => v.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function AreasEditor({ technician }: { technician: Technician }) {
  const toast = useToast();
  const save = useSaveAreas(technician.id);
  const [areas, setAreas] = useState<string[]>(technician.areas);
  const [draft, setDraft] = useState('');
  const dirty = areas.length !== technician.areas.length || areas.some((a) => !technician.areas.includes(a));
  const add = () => {
    const area = tidy(draft);
    if (area.length < 2) return;
    setAreas((cur) => (cur.includes(area) ? cur : [...cur, area].sort()));
    setDraft('');
  };
  return (
    <SetupCard title="Service areas" description="Neighbourhoods this technician covers. Matched against the area in the customer's address." dirty={dirty} pending={save.isPending}
      onSave={() => save.mutate({ areas }, { onSuccess: () => toast.success('Areas saved'), onError: (e) => toast.error(e.message) })}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput mode="outlined" dense label="Add an area (e.g. Kondapur)" value={draft} onChangeText={setDraft} onSubmitEditing={add} maxLength={60} style={{ flex: 1 }} />
        <Button mode="contained-tonal" icon="plus" onPress={add}>Add</Button>
      </View>
      {areas.length === 0 ? <Text variant="bodySmall" style={{ opacity: 0.6 }}>No areas yet.</Text> : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {areas.map((a) => <Chip key={a} onClose={() => setAreas((cur) => cur.filter((x) => x !== a))}>{a}</Chip>)}
        </View>
      )}
    </SetupCard>
  );
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // show Monday first
const invalid = (d: WorkingDay) => !d.isOff && (!d.startTime || !d.endTime || d.startTime >= d.endTime);

function HoursEditor({ technician }: { technician: Technician }) {
  const toast = useToast();
  const theme = useTheme();
  const save = useSaveWorkingHours(technician.id);
  const [days, setDays] = useState<WorkingDay[]>(technician.workingHours);
  const dirty = JSON.stringify(days) !== JSON.stringify(technician.workingHours);
  const complete = days.length === 7; // the API needs all 7 days
  const change = (dayOfWeek: number, patch: Partial<WorkingDay>) => setDays((cur) => cur.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));

  return (
    <SetupCard title="Working hours" description="Times are India time (IST). Bookings are only offered inside these hours." dirty={dirty && complete && !days.some(invalid)} pending={save.isPending}
      onSave={() => save.mutate({ days }, { onSuccess: () => toast.success('Working hours saved'), onError: (e) => toast.error(e.message) })}>
      {!complete ? (
        <View style={{ gap: 8 }}>
          <Text variant="bodyMedium">No working hours yet.</Text>
          <Button mode="outlined" onPress={() => setDays(DAY_NAMES.map((_, dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '18:00', isOff: dayOfWeek === 0 })))}>Start with Mon to Sat, 9:00 to 18:00</Button>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {WEEK_ORDER.map((n) => {
            const d = days.find((x) => x.dayOfWeek === n)!;
            return (
              <View key={n} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="titleSmall" style={{ fontWeight: '700' }}>{DAY_NAMES[n]}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{d.isOff ? 'Day off' : 'Working'}</Text>
                    <Switch value={!d.isOff} onValueChange={(on) => change(n, { isOff: !on })} />
                  </View>
                </View>
                {!d.isOff && (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TimeField label="Start" value={d.startTime} onChange={(t) => change(n, { startTime: t })} error={invalid(d)} />
                    <Text>to</Text>
                    <TimeField label="End" value={d.endTime} onChange={(t) => change(n, { endTime: t })} error={invalid(d)} />
                  </View>
                )}
                {invalid(d) && <Text variant="bodySmall" style={{ color: theme.colors.error }}>End must be after start</Text>}
              </View>
            );
          })}
        </View>
      )}
    </SetupCard>
  );
}

const REASONS = [{ value: 'SICK', label: 'Sick' }, { value: 'LEAVE', label: 'Leave' }, { value: 'OTHER', label: 'Other' }];
const REASON_LABEL = { SICK: 'Sick', LEAVE: 'Leave', OTHER: 'Other' };

function TimeOffForm({ technicianId, onDone }: { technicianId: string; onDone: () => void }) {
  const toast = useToast();
  const add = useAddTimeOff(technicianId);
  const form = useForm<TimeOffInput>({ resolver: zodResolver(timeOffSchema), defaultValues: { startDate: '', endDate: '', reason: 'SICK', note: '' }, mode: 'onTouched' });
  const submit = form.handleSubmit((v) =>
    add.mutateAsync(toTimeOffBody(v)).then(
      (r) => {
        toast.success(r.bookingsNeedingReassignment > 0 ? `Time off added. ${r.bookingsNeedingReassignment} booking(s) now need a new technician.` : 'Time off added');
        onDone();
      },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <Controller control={form.control} name="startDate" render={({ field, fieldState }) => (
        <DateField label="First day off" value={field.value} onChange={(d) => { field.onChange(d); if (!form.getValues('endDate') || form.getValues('endDate') < d) form.setValue('endDate', d); }} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="endDate" render={({ field, fieldState }) => (
        <DateField label="Last day off" value={field.value} onChange={field.onChange} min={form.getValues('startDate') || undefined} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="reason" render={({ field }) => <PillGroup options={REASONS} value={field.value} onChange={field.onChange} />} />
      <TextField control={form.control} name="note" label="Note (optional)" maxLength={300} />
      <SubmitButton onPress={submit} pending={add.isPending}>Add time off</SubmitButton>
    </>
  );
}

function TimeOffSection({ technicianId }: { technicianId: string }) {
  const toast = useToast();
  const theme = useTheme();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<TimeOff | null>(null);
  const q = useTimeOff(technicianId, false); // upcoming and current only
  const remove = useRemoveTimeOff(technicianId);
  const addButton = <Button compact icon="plus" onPress={() => setAdding(true)}>Add</Button>;

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle action={q.data && q.data.items.length > 0 ? addButton : undefined}>Time off</SectionTitle>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Sick days and leave. No bookings are offered on these days.</Text>
      {q.isPending ? <ListSkeleton rows={1} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? (
        <EmptyState icon="beach" title="No upcoming time off" description="Add days when this technician is away." action={<Button mode="contained-tonal" icon="plus" onPress={() => setAdding(true)}>Add time off</Button>} />
      ) : q.data.items.map((t) => (
        <Card key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>{formatDayRange(t.startAt, t.endAt)}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{REASON_LABEL[t.reason]}{t.note ? ` · ${t.note}` : ''}</Text>
          </View>
          <IconButton icon="trash-can-outline" iconColor={theme.colors.error} onPress={() => setRemoving(t)} accessibilityLabel="Remove time off" />
        </Card>
      ))}
      <FormModal visible={adding} onClose={() => setAdding(false)} title="Add time off" subtitle="Whole days, India time.">
        <TimeOffForm technicianId={technicianId} onDone={() => setAdding(false)} />
      </FormModal>
      <ConfirmDialog
        visible={removing !== null}
        title="Remove this time off?"
        message={removing ? `${formatDayRange(removing.startAt, removing.endAt)} becomes a normal working day again.` : ''}
        confirmLabel="Remove"
        destructive
        busy={remove.isPending}
        onDismiss={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id, { onSuccess: () => { toast.success('Time off removed'); setRemoving(null); }, onError: (e) => { toast.error(e.message); setRemoving(null); } })}
      />
    </View>
  );
}

export function TechnicianDetail({ id }: { id: string }) {
  const theme = useTheme();
  const q = useTechnician(id);
  if (q.isPending) return <Screen><ListSkeleton rows={3} /></Screen>;
  if (q.isError) return <Screen><ErrorState error={q.error} onRetry={() => q.refetch()} /></Screen>;
  const t = q.data;
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{t.name}{t.status === 'INACTIVE' ? ' (inactive)' : ''}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{formatPhone(t.phone)}{t.email ? ` · ${t.email}` : ''}</Text>
      </View>
      {/* Each editor keeps its own draft, so saving one never wipes unsaved edits in another. */}
      <SkillsEditor technician={t} />
      <AreasEditor technician={t} />
      <HoursEditor technician={t} />
      <TimeOffSection technicianId={t.id} />
    </Screen>
  );
}
