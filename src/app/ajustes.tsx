import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Feedback } from '@/components/Feedback';
import { OptionSelector } from '@/components/OptionSelector';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/components/ToggleRow';
import { useProgress } from '@/hooks/ProgressContext';
import { useSettings } from '@/hooks/SettingsContext';
import { useSpeech } from '@/hooks/useSpeech';
import { exportAll } from '@/sessions/storage';
import { colors, radius, spacing } from '@/theme';
import type { Difficulty, TextScale } from '@/types/settings';

export default function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { resetProgress } = useProgress();
  const { speak } = useSpeech();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Screen>
      <Section title="Audio">
        <ToggleRow
          label="Voz activada"
          description="Lee en voz alta palabras, instrucciones y frases."
          value={settings.audioEnabled}
          onChange={(audioEnabled) => updateSettings({ audioEnabled })}
        />
        <OptionSelector<number>
          label="Velocidad de la voz"
          value={settings.speechRate}
          onChange={(speechRate) => updateSettings({ speechRate })}
          options={[
            { value: 0.7, label: 'Lenta' },
            { value: 0.9, label: 'Normal' },
            { value: 1.1, label: 'Rápida' },
          ]}
        />
        <ToggleRow
          label="Voz de refuerzo tras fallar"
          description="Dice «Prueba otra vez» al elegir una opción incorrecta. Desactívala si la persona lo vive como una penalización."
          value={settings.feedbackVoice}
          onChange={(feedbackVoice) => updateSettings({ feedbackVoice })}
        />
        <AppButton
          label="Probar la voz"
          icon="volume-high"
          variant="secondary"
          disabled={!settings.audioEnabled}
          onPress={() => speak('Hola. Así suena la voz de la aplicación.')}
        />
      </Section>

      <Section title="Lectura y aspecto">
        <ToggleRow
          label="Mostrar la palabra escrita"
          description="En vocabulario, la palabra aparece bajo la foto."
          value={settings.showWords}
          onChange={(showWords) => updateSettings({ showWords })}
        />
        <OptionSelector<TextScale>
          label="Tamaño del texto"
          value={settings.textScale}
          onChange={(textScale) => updateSettings({ textScale })}
          options={[
            { value: 1, label: 'Normal' },
            { value: 1.2, label: 'Grande' },
            { value: 1.4, label: 'Muy grande' },
          ]}
        />
        <ToggleRow
          label="Animaciones"
          description="Transiciones suaves de las fotos. Se desactivan también si el sistema pide reducir el movimiento."
          value={settings.animationsEnabled}
          onChange={(animationsEnabled) => updateSettings({ animationsEnabled })}
        />
      </Section>

      <Section title="Juegos">
        <OptionSelector<Difficulty>
          label="Dificultad inicial"
          value={settings.difficulty}
          onChange={(difficulty) => updateSettings({ difficulty })}
          options={[
            { value: 'facil', label: 'Fácil' },
            { value: 'media', label: 'Media' },
            { value: 'dificil', label: 'Difícil' },
          ]}
        />
        <ToggleRow
          label="Pronunciación con seseo"
          description="Para Canarias, Andalucía y América: en fonología, z, ce y ci se cuentan como /s/ (cerdo empieza por /s/)."
          value={settings.seseo}
          onChange={(seseo) => updateSettings({ seseo })}
        />
        <AppText size="small" color={colors.textMuted}>
          Afecta al número de imágenes en «Busca la imagen», a las parejas de memory y al tipo de palabras en denominación.
        </AppText>
      </Section>

      <Section title="Copia de seguridad de sesiones">
        <AppText size="small" color={colors.textMuted}>
          Perfiles, sesiones y observaciones se guardan solo en este dispositivo y no están cifrados por la app. Puedes exportar
          una copia en formato JSON con la hoja de compartir del sistema y guardarla donde decidas (por ejemplo, en una carpeta
          local protegida). Al compartirla, los datos salen de la app: elige un destino seguro.
        </AppText>
        <AppButton
          label="Exportar copia (JSON)"
          icon="share"
          variant="secondary"
          onPress={async () => {
            try {
              await Share.share({ title: 'Copia de EnLogopedia', message: await exportAll() });
            } catch {
              setMessage('Este dispositivo o navegador no permite compartir. En Android funciona desde la app.');
            }
          }}
        />
      </Section>

      <Section title="Datos guardados">
        <AppText size="small" color={colors.textMuted}>
          Las preferencias y el progreso se guardan solo en este dispositivo. La app no envía datos a ningún servidor.
        </AppText>
        <AppButton
          label="Restablecer ajustes"
          icon="refresh"
          variant="ghost"
          onPress={() => {
            resetSettings();
            setMessage('Ajustes restablecidos.');
          }}
        />
        {confirmReset ? (
          <View style={styles.confirm}>
            <AppText weight="600">¿Seguro que quieres borrar el progreso? No se puede deshacer.</AppText>
            <View style={styles.row}>
              <AppButton
                label="Sí, borrar"
                variant="danger"
                style={styles.flex}
                onPress={async () => {
                  await resetProgress();
                  setConfirmReset(false);
                  setMessage('Progreso borrado.');
                }}
              />
              <AppButton label="Cancelar" variant="ghost" style={styles.flex} onPress={() => setConfirmReset(false)} />
            </View>
          </View>
        ) : (
          <AppButton label="Borrar progreso" icon="trash" variant="danger" onPress={() => setConfirmReset(true)} />
        )}
        {message ? <Feedback kind="info" message={message} /> : null}
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText size="large" weight="700" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  confirm: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.errorBg, borderRadius: radius.md },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 120 },
});
