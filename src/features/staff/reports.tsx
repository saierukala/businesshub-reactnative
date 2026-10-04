import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import { addDays, formatINR, formatWeekdayDate, istDay } from '@/lib/format';
import { useBookingReport, useRevenueReport, useServiceReport, useTechnicianReport, type BreakdownRow, type ReportRange } from '@/lib/queries/reports';
import type { Page } from '@/lib/types';
import { PillGroup } from '@/ui/Form';
import { Card, EmptyState, ErrorState, ListSkeleton, StatCard } from '@/ui/Parts';
import { DateField } from '@/ui/Pickers';
import { Screen } from '@/ui/Screen';
import { BookingCard } from '../booking/BookingsList';

const TABS = [{ value: 'bookings', label: 'Bookings' }, { value: 'revenue', label: 'Revenue' }, { value: 'services', label: 'Services' }, { value: 'technicians', label: 'Technicians' }];
const GROUPS = [{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }];

// Which calendar days a row covers: a day, a week starting that Monday, or a month starting that day.
function periodLabel(period: string, groupBy: string) {
  const d = formatWeekdayDate(`${period}T00:00:00+05:30`);
  return groupBy === 'week' ? `Week of ${d}` : groupBy === 'month' ? new Date(`${period}T00:00:00+05:30`).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }) : d;
}

type Q = { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

// Loading, error and empty are the same for every report.
function Frame({ q, empty, children }: { q: Q; empty: boolean; children: ReactNode }) {
  if (q.isPending) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (empty) return <EmptyState icon="chart-box-outline" title="Nothing in this period" description="Try a wider date range." />;
  return <>{children}</>;
}

function Pager({ page, onPage }: { page: Pick<Page<unknown>, 'page' | 'totalPages' | 'total'>; onPage: (p: number) => void }) {
  if (page.totalPages <= 1) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Button icon="chevron-left" disabled={page.page <= 1} onPress={() => onPage(page.page - 1)}>Previous</Button>
      <Text variant="bodySmall">Page {page.page} of {page.totalPages}</Text>
      <Button icon="chevron-right" contentStyle={{ flexDirection: 'row-reverse' }} disabled={page.page >= page.totalPages} onPress={() => onPage(page.page + 1)}>Next</Button>
    </View>
  );
}

function BookingsTab({ range, onPage }: { range: ReportRange; onPage: (p: number) => void }) {
  const router = useRouter();
  const q = useBookingReport(range);
  const s = q.data?.summary;
  return (
    <View style={{ gap: 12 }}>
      {s && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatCard label="Total" value={s.total} icon="calendar-multiple" />
          <StatCard label="Completed" value={s.completed} icon="check-circle" tone="#16a34a" />
          <StatCard label="Cancelled" value={s.cancelled} icon="close-circle" tone="#dc2626" />
          <StatCard label="No-show" value={s.noShow} icon="account-off" tone="#b91c1c" />
          <StatCard label="Rescheduled" value={s.rescheduled} icon="calendar-sync" tone="#d97706" />
        </View>
      )}
      <Frame q={q} empty={q.data?.bookings.total === 0}>
        {q.data && (
          <>
            {q.data.bookings.items.map((b) => <BookingCard key={b.id} booking={b} staff onPress={() => router.push(`/staff/bookings/${b.id}`)} />)}
            <Pager page={q.data.bookings} onPage={onPage} />
          </>
        )}
      </Frame>
    </View>
  );
}

function RevenueTab({ range, groupBy, onGroup, onPage }: { range: ReportRange; groupBy: string; onGroup: (g: string) => void; onPage: (p: number) => void }) {
  const theme = useTheme();
  const q = useRevenueReport({ ...range, groupBy: groupBy as 'day' | 'week' | 'month' });
  return (
    <View style={{ gap: 12 }}>
      <PillGroup options={GROUPS} value={groupBy} onChange={onGroup} />
      {q.data && (
        <Card>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Total in this period</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '800' }}>{formatINR(q.data.totals.revenue)}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>from {q.data.totals.payments} {q.data.totals.payments === 1 ? 'payment' : 'payments'}</Text>
        </Card>
      )}
      <Frame q={q} empty={q.data?.total === 0}>
        {q.data && (
          <>
            <Card style={{ gap: 12 }}>
              {q.data.items.map((r) => (
                <View key={r.period} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{periodLabel(r.period, groupBy)}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{r.payments} {r.payments === 1 ? 'payment' : 'payments'}</Text>
                  </View>
                  <Text variant="titleSmall" style={{ fontWeight: '800' }}>{formatINR(r.revenue)}</Text>
                </View>
              ))}
            </Card>
            <Pager page={q.data} onPage={onPage} />
          </>
        )}
      </Frame>
    </View>
  );
}

function BreakdownTab({ q, onPage, rating }: { q: Q & { data?: Page<BreakdownRow> }; onPage: (p: number) => void; rating?: boolean }) {
  const theme = useTheme();
  return (
    <Frame q={q} empty={q.data?.total === 0}>
      {q.data && (
        <>
          {q.data.items.map((r) => (
            <Card key={r.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="titleSmall" style={{ fontWeight: '700', flex: 1 }}>{r.name}</Text>
                <Text variant="titleSmall" style={{ fontWeight: '800' }}>{formatINR(r.revenue)}</Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {r.bookings} {r.bookings === 1 ? 'booking' : 'bookings'} · {r.completed} done · {r.cancelled} cancelled · {r.noShow} no-show
                {rating && r.avgRating != null ? ` · ★ ${r.avgRating.toFixed(1)}` : ''}
              </Text>
            </Card>
          ))}
          <Pager page={q.data} onPage={onPage} />
        </>
      )}
    </Frame>
  );
}

function ServicesTab({ range, onPage }: { range: ReportRange; onPage: (p: number) => void }) {
  return <BreakdownTab q={useServiceReport(range)} onPage={onPage} />;
}
function TechniciansTab({ range, onPage }: { range: ReportRange; onPage: (p: number) => void }) {
  return <BreakdownTab q={useTechnicianReport(range)} onPage={onPage} rating />;
}

// Reports from SQL totals. Dates are IST calendar days, inclusive.
export function ReportsView() {
  const today = istDay();
  const [tab, setTab] = useState('bookings');
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState('day');
  const [page, setPage] = useState(1);
  const range: ReportRange = { from, to, page, pageSize: 15 };
  const changeRange = (f: string, t: string) => { setFrom(f); setTo(t); setPage(1); };

  return (
    <Screen>
      <PillGroup options={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />
      <View style={{ gap: 4 }}>
        <DateField label="From" value={from} max={to} onChange={(d) => changeRange(d, to)} />
        <DateField label="To" value={to} min={from} onChange={(d) => changeRange(from, d)} />
      </View>
      {tab === 'bookings' && <BookingsTab range={range} onPage={setPage} />}
      {tab === 'revenue' && <RevenueTab range={range} groupBy={groupBy} onGroup={(g) => { setGroupBy(g); setPage(1); }} onPage={setPage} />}
      {tab === 'services' && <ServicesTab range={range} onPage={setPage} />}
      {tab === 'technicians' && <TechniciansTab range={range} onPage={setPage} />}
    </Screen>
  );
}
