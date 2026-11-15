import { Linking, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { IMAGE_CREDITS } from '@/content/credits';
import { colors, radius, spacing } from '@/theme';

/**
 * Créditos de las fotografías. Las licencias CC BY y CC BY-SA obligan a
 * citar autoría, licencia y enlace; esta pantalla cumple esa obligación.
 */
export default function CreditsScreen() {
  return (
    <Screen>
      <AppText color={colors.textMuted}>
        Fotografías de Wikimedia Commons con licencias libres que permiten el uso comercial, y fotografías propias o encargadas cuando se indica. Se han redimensionado y
        convertido a formato WebP. Pulsa en cada enlace para ver el original y su licencia.
      </AppText>
      {IMAGE_CREDITS.length === 0 ? <AppText>No hay imágenes registradas.</AppText> : null}
      {IMAGE_CREDITS.map((c) => {
        const key = c.archivo.split('/').pop()?.replace(/\.webp$/, '') ?? '';
        return (
          <View key={c.archivo} style={styles.item}>
            <View style={styles.thumb}>
              <Photo imageKey={key} label={null} hiddenLabel={c.concepto} aspectRatio={1} />
            </View>
            <View style={styles.texts}>
              <AppText weight="700">{c.concepto}</AppText>
              <AppText size="small">Autoría: {c.autor}</AppText>
              <AppText size="small">Licencia: {c.licencia}</AppText>
              <AppText size="small" color={colors.textMuted}>
                {c.origen === 'commons' ? 'Fuente: Wikimedia Commons' : `Fuente: ${c.fuente}`}
              </AppText>
              <View style={styles.links}>
                {c.url ? (
                <AppButton
                  label="Ver original"
                  variant="ghost"
                  compact
                  onPress={() => Linking.openURL(c.url)}
                  accessibilityLabel={`Ver original de ${c.concepto}`}
                />
                ) : null}
                {c.urlLicencia ? (
                  <AppButton
                    label="Ver licencia"
                    variant="ghost"
                    compact
                    onPress={() => Linking.openURL(c.urlLicencia)}
                    accessibilityLabel={`Ver licencia ${c.licencia}`}
                  />
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  thumb: { width: 72 },
  texts: { flex: 1, gap: 2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
