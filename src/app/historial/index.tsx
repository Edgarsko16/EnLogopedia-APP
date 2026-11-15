import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import type { IconName } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MenuCard } from '@/components/MenuCard';
import { OptionSelector } from '@/components/OptionSelector';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/ui';
import { activityLabel, formatDateTime, formatDuration } from '@/sessions/labels';
import { useSessions } from '@/sessions/SessionsContext';
import { colors } from '@/theme';
import { plural } from '@/utils/text';

const ALL = '__todos__';
const NONE = '__sin__';

/** Historial local de sesiones, filtrable por perfil. */
export default function HistoryScreen() {
  const { perfil } = useLocalSearchParams<{ perfil?: string }>();
  const { index, profiles, ready } = useSessions();
  const [filter, setFilter] = useState<string>(typeof perfil === 'string' ? perfil : ALL);

  const list = [...index]
    .filter((m) => filter === ALL || (filter === NONE ? m.profileId === null : m.profileId === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <OptionSelector<string>
        label="Perfil"
        value={filter}
        onChange={setFilter}
        options={[
          { value: ALL, label: 'Todos' },
          { value: NONE, label: 'Sin perfil' },
          ...profiles.map((p) => ({ value: p.id, label: p.alias })),
        ]}
      />
      <AppText color={colors.textMuted}>{ready ? plural(list.length, 'sesión', 'sesiones') : 'Cargando…'}</AppText>
      {ready && list.length === 0 ? <AppText>No hay sesiones con este filtro.</AppText> : null}
      {list.map((m) => {
        const alias = profiles.find((p) => p.id === m.profileId)?.alias ?? 'Sin perfil';
        const acts = [...new Set(m.activityIds)].map((a) => activityLabel(a)).join(', ');
        const unfinished = m.status !== 'finalizada';
        return (
          <MenuCard
            key={m.id}
            title={`${formatDateTime(m.createdAt)} · ${alias}`}
            description={`${acts}${m.activeMs > 0 ? ` · ${formatDuration(m.activeMs)}` : ''}`}
            icon={(unfinished ? 'pause-circle' : 'document-text') as IconName}
            onPress={() => router.push({ pathname: '/historial/[id]', params: { id: m.id } })}
            footer={unfinished ? <Tag label={m.status === 'pausada' ? 'Pausada' : 'En curso'} tone="warning" /> : undefined}
          />
        );
      })}
    </Screen>
  );
}
