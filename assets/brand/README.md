# Identidad visual de EnLogopedia

## Archivos

| Archivo | Uso |
|---|---|
| `image-png.png` | Archivo original del logo (500 × 500 px, PNG con transparencia). **No se modifica.** |
| `logo.png` | Copia idéntica del original con el nombre acordado. |
| `logo-app.png` | Copia sin márgenes transparentes (351 × 288 px), generada con `sharp.trim()` a partir de `logo.png`. La usan la portada (`src/components/BrandLogo.tsx`) y la pantalla de bienvenida (`app.json`, plugin `expo-splash-screen`). |
| `propuestas/icono-borrador-1024.png` | **Borrador** de icono: el oído recortado y ampliado sobre fondo blanco. No está conectado a la app. |
| `propuestas/android-foreground-borrador-1024.png` | **Borrador** de primer plano del icono adaptativo de Android (zona segura central). No está conectado. |

La configuración de marca está en `src/content/brand.ts`: nombre, lema, logo y su proporción.

## Regenerar `logo-app.png` tras cambiar el logo

```bash
node -e "require('sharp')('assets/brand/logo.png').trim({threshold:10}).extend({top:8,bottom:8,left:8,right:8,background:{r:0,g:0,b:0,alpha:0}}).png().toFile('assets/brand/logo-app.png')"
```

Después, ajusta `LOGO_ASPECT_RATIO` en `src/content/brand.ts` (ancho ÷ alto del nuevo archivo).

## Icono de la app: pendiente

Siguen los iconos de la plantilla de Expo. Los borradores no se han conectado porque:

- El símbolo del oído mide unos 220 × 185 px dentro del logo de 500 px. Un icono necesita 1024 × 1024 px, y el icono adaptativo de Android exige que el dibujo quepa en la zona segura central (≈ 66 %, unos 680 px). Habría que ampliarlo más de 3 veces y quedaría borroso.
- El logo está ligeramente inclinado y lleva el texto incrustado, que en tamaño de icono no se leería.

Qué hace falta: el logo original en **vectorial (SVG/PDF) o en alta resolución (≥ 2048 px)**, idealmente con el símbolo del oído separado del texto. Con él se generan:

- `assets/icon.png`: 1024 × 1024, sin transparencia (iOS).
- `assets/android-icon-foreground.png`: 1024 × 1024, transparente, dibujo dentro del 66 % central.
- `assets/android-icon-background.png`: color liso (por ejemplo `#EAF4FA`) o el fondo que se decida.
- `assets/android-icon-monochrome.png`: silueta en un solo color para los iconos temáticos de Android 13 o superior.
- `assets/favicon.png`: 48 × 48 para la web.

Se sustituyen con el mismo nombre, se revisa `android.adaptiveIcon.backgroundColor` en `app.json` y se genera una compilación nueva (Expo Go no muestra el icono propio).

## Nombre

El nombre definitivo es **EnLogopedia**. El texto incrustado en la imagen del logo dice «Enlogopedia», con «l» minúscula. Si se rehace el logo, conviene unificarlo.
