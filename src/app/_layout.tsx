import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BRAND } from '@/content/brand';
import { ProgressProvider } from '@/hooks/ProgressContext';
import { SettingsProvider } from '@/hooks/SettingsContext';
import { SessionsProvider } from '@/sessions/SessionsContext';
import { colors } from '@/theme';

/**
 * Layout raíz: proveedores globales (preferencias, progreso y sesiones) y
 * navegación en pila con cabecera y botón «atrás». Durante una sesión, la
 * barra de sesión oculta la cabecera para dejar más espacio a la actividad.
 */
export default function RootLayout() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <SessionsProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.navy, fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: BRAND.nombre, headerShown: false }} />
            <Stack.Screen name="areas/index" options={{ title: 'Actividades por áreas' }} />
            <Stack.Screen name="areas/[id]" options={{ title: 'Área' }} />
            <Stack.Screen name="sesion/nueva" options={{ title: 'Nueva sesión' }} />
            <Stack.Screen name="sesion/resumen" options={{ title: 'Resumen de la sesión', headerBackVisible: false }} />
            <Stack.Screen name="perfiles/index" options={{ title: 'Perfiles' }} />
            <Stack.Screen name="perfiles/[id]" options={{ title: 'Perfil' }} />
            <Stack.Screen name="historial/index" options={{ title: 'Historial de sesiones' }} />
            <Stack.Screen name="historial/[id]" options={{ title: 'Sesión' }} />
            <Stack.Screen name="categorias/index" options={{ title: 'Vocabulario' }} />
            <Stack.Screen name="categorias/[id]" options={{ title: 'Categoría' }} />
            <Stack.Screen name="vocabulario/[categoria]" options={{ title: 'Vocabulario' }} />
            <Stack.Screen name="juegos/index" options={{ title: 'Juegos' }} />
            <Stack.Screen name="juegos/denominacion" options={{ title: 'Denominación' }} />
            <Stack.Screen name="juegos/busca" options={{ title: 'Busca la imagen' }} />
            <Stack.Screen name="juegos/memory" options={{ title: 'Memory' }} />
            <Stack.Screen name="juegos/frases" options={{ title: 'Frases' }} />
            <Stack.Screen name="semantica/index" options={{ title: 'Semántica' }} />
            <Stack.Screen name="semantica/categorizar" options={{ title: 'Categorizar' }} />
            <Stack.Screen name="semantica/intruso" options={{ title: '¿Cuál no pertenece?' }} />
            <Stack.Screen name="semantica/asociaciones" options={{ title: 'Asociaciones' }} />
            <Stack.Screen name="semantica/funciones" options={{ title: 'Funciones' }} />
            <Stack.Screen name="fonologia/index" options={{ title: 'Fonema inicial' }} />
            <Stack.Screen name="fonologia/[fonema]" options={{ title: 'Fonema' }} />
            <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
            <Stack.Screen name="creditos" options={{ title: 'Créditos de las imágenes' }} />
          </Stack>
        </SessionsProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}
