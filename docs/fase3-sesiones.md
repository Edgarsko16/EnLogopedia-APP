# EnLogopedia — Fase 3: arquitectura de sesiones, perfiles y resultados

## 1. Navegación

| Ruta | Pantalla |
|---|---|
| `/` | Portada profesional: continuar sesión, nueva sesión, áreas, perfiles, historial, ajustes y acceso rápido |
| `/sesion/nueva` | Preparar sesión: perfil, actividades libres o sugeridas, modalidad, dificultad, parámetros y orden |
| `/sesion/resumen?id=` | Resumen al finalizar y observaciones |
| `/areas`, `/areas/[id]` | Actividades por área de intervención |
| `/perfiles`, `/perfiles/[id]` | Perfiles por alias y seguimiento |
| `/historial`, `/historial/[id]` | Historial (con filtro por perfil), detalle, observaciones y eliminación |

Las rutas anteriores (`/juegos/*`, `/semantica/*`, `/fonologia/*`, `/categorias`, `/vocabulario/*`) se mantienen sin cambios. Desde la portada se llega a ellas por «Actividades por áreas» y por «Acceso rápido».

Una actividad se abre **dentro de una sesión** cuando su ruta lleva `?sesion=<uid>` y ese `uid` es la actividad actual de la sesión en curso. En ese caso aparece la barra de sesión (`SessionBar`) y se oculta la cabecera. Sin ese parámetro, la pantalla funciona igual que antes.

## 2. Catálogo de actividades (`src/activities/`)

- `AREAS`: Lenguaje, Habla y fonología, Audición, Lectoescritura, Funciones cognitivas y Comunicación. Las áreas sin actividades se muestran con la etiqueta «Próximamente» y sus líneas previstas, sin enlace.
- `OBJECTIVES`: 9 objetivos de trabajo.
- `ACTIVITIES`: 10 actividades con identificador, nombre, descripción, áreas, modalidades (cada una con sus objetivos y su tipo de valoración: automática, manual o ninguna), niveles, parámetros (categoría y fonema), duración orientativa, requisitos de contenido y estado. Una actividad puede estar en varias áreas sin duplicarse; por ejemplo, «Busca la imagen» aparece en Lenguaje y en Funciones cognitivas.
- `availabilityOf(id, modalidad, params)`: comprueba con el banco real si hay contenido suficiente. La usan los menús, el editor de sesiones y el generador.
- `activityHref()`: construye la ruta con modalidad, parámetros y elemento de sesión.

## 3. Modelo de datos (`src/sessions/types.ts`)

```
Profile        { id, alias, createdAt, lastActivityAt? }
Session        { version: 1, id, profileId | null, origen: libre|sugerida, sugerencia?,
                 createdAt, status: en-curso|pausada|finalizada, items[], currentIndex,
                 activeMs, lastResumedAt?, endedAt?, observaciones? }
SessionItem    { uid, activityId, modalidad, dificultad, params, estado: pendiente|en-curso|completada|saltada,
                 attempts: AttemptRecord[], manual: ManualRecord[], startedAt?, endedAt? }
AttemptRecord  { id, at, ronda, elemento, respuesta, correcta }
ManualRecord   { id, at, ronda, elemento, valoracion: correcto|con-ayuda|incorrecto|no-realizado }
Observations   { dificultades, apoyos, reforzar }
```

- `elemento` es el identificador de lo que se trabajaba (palabra, frase…) y `respuesta`, lo que se eligió. Así se puede consultar después, por ejemplo, que en «cuchara» se eligió «tenedor».
- `ronda` identifica la interacción dentro de la actividad. Una misma combinación de ronda, elemento y respuesta se registra una sola vez, aunque se pulse dos veces o se repinte la pantalla.

Qué registra cada actividad:

| Actividad | elemento | respuesta |
|---|---|---|
| Busca la imagen, Identificar fonema | palabra objetivo | palabra elegida |
| Memory | 1.ª carta del turno | 2.ª carta del turno |
| Frases: elegir | frase de la foto | frase elegida |
| Frases: completar | frase | palabra elegida |
| Frases: construir | frase | frase construida |
| Categorizar | palabra | categoría elegida |
| ¿Cuál no pertenece? | intrusa | palabra elegida |
| Asociaciones | pista | palabra elegida |
| Funciones | palabra o función | palabra o función elegida |
| Clasificar fonema | palabra | «sí» o «no» |
| Denominación (manual) | palabra | valoración del profesional |

Vocabulario y «Escuchar y ver» son de repaso y no registran respuestas.

## 4. Lógica de sesión (`src/sessions/sessionLogic.ts`, funciones puras)

- `createSession`, `addAttempt`, `setManual`, `moveTo`, `pauseSession`, `resumeSession`, `finishSession` y `setObservations`.
- Solo se registran respuestas en una sesión **en curso** y en la **actividad actual**.
- Al pasar a otra actividad, la actual queda «completada» si tiene resultados o «saltada» si no. Lo saltado no cuenta como error.
- `activeMs` acumula el tiempo activo y no cuenta las pausas.
- Si la app se cierra con una sesión en curso, al volver se recupera como pausada. En la portada aparece «Continuar sesión».
- Solo puede haber una sesión sin finalizar. Para empezar otra hay que continuarla o finalizarla.

## 5. Resultados (`src/sessions/results.ts`)

- **Por actividad**: rondas, aciertos a la primera, rondas resueltas tras un error, respuestas incorrectas y elementos con errores (con lo elegido). Las valoraciones manuales se cuentan aparte.
- **Porcentaje**: solo con 5 o más rondas (`MIN_ROUNDS_FOR_RATE`).
- **Seguimiento por perfil** (solo sesiones finalizadas): número de sesiones, última sesión, áreas trabajadas y actividades frecuentes.
  - Elementos con dificultad repetida: trabajados al menos 2 veces con errores en la mitad o más, o con 2 o más valoraciones «con ayuda» o «incorrecto».
  - Actividades a reforzar: menos del 60 % a la primera con al menos 5 rondas, o la mitad o más de valoraciones manuales negativas.
  - Son pistas para el profesional, no interpretaciones clínicas.

## 6. Sesión sugerida (`src/sessions/suggest.ts`)

1. Filtra las actividades del área con modalidades que trabajan el objetivo elegido. Excluye las modalidades de solo repaso y las que no tienen contenido suficiente.
2. Alterna actividades distintas hasta cubrir la duración orientativa (15, 20 o 30 minutos; máximo 8 actividades).
3. Avisa si hay menos de 3 actividades distintas o si ha tenido que repetir.

Sin IA ni servicios externos. La propuesta es editable y la pantalla recuerda que no es un programa terapéutico validado.

## 7. Almacenamiento local (`src/sessions/storage.ts`)

Se mantiene AsyncStorage. Motivos:

- SQLite (expo-sqlite) en web requiere WebAssembly y cabeceras COOP/COEP, lo que complica la vista previa web con la que se trabaja.
- El volumen previsto es pequeño: perfiles y sesiones de decenas de intentos.
- No hacen falta consultas relacionales complejas.

Esquema versionado (v1):

```
@enlogopedia/profiles/v1         Profile[]
@enlogopedia/sessions/index/v1   SessionMeta[]   (listados rápidos)
@enlogopedia/session/v1/<id>     Session          (una clave por sesión)
```

- Una clave por sesión evita valores que crezcan sin límite; Android limita el tamaño por registro.
- `rebuildIndex()` reconstruye el índice a partir de las sesiones si se pierde.
- Borrar un perfil borra en cascada sus sesiones (`deleteProfileCascade`).
- Las escrituras van en cola (`SessionsContext`) para que dos guardados seguidos no se pisen.
- Las imágenes no se guardan en los registros: solo los identificadores.
- Si en el futuro hiciera falta SQLite (cientos de sesiones por perfil, informes cruzados), la migración consistiría en leer estas claves y volcarlas a tablas `profiles`, `sessions`, `items`, `attempts` y `manual`, con migraciones versionadas.

### Copia de seguridad

Ajustes → «Exportar copia (JSON)» abre la hoja de compartir del sistema con todos los perfiles y sesiones. La restauración desde una copia **no está implementada** todavía.

## 8. Privacidad y protección de datos

- Los perfiles son alias. Se bloquean patrones evidentes de datos personales (DNI/NIE, teléfono, correo, fechas) y se avisa si el alias parece un nombre propio. No es un filtro infalible.
- Los registros asociados a un alias son **datos seudonimizados**: pueden seguir siendo datos personales.
- Medidas actuales:
  - Todo es local, sin servidor ni sincronización.
  - Solo se guardan los datos mínimos.
  - Avisos en perfiles y observaciones.
  - Eliminación de sesiones y de perfiles con todos sus registros.
  - Exportación solo por decisión expresa del usuario.
- **No hay cifrado propio de la app.** La protección depende del dispositivo: bloqueo de pantalla y cifrado del sistema, activado por defecto en Android moderno. En web, los datos quedan en el almacenamiento del navegador de ese equipo.
- Recomendaciones: dispositivo de uso profesional con bloqueo, no compartir el equipo y eliminar perfiles cuando ya no sean necesarios.
- Esta información es orientativa y no sustituye el asesoramiento de un profesional en protección de datos (RGPD/LOPDGDD).

## 9. Sistema de diseño (`src/theme/index.ts`, `src/components/ui.tsx`)

- **Paleta** derivada del logo: azul noche `#172E69`, azul `#2456A6`, turquesa `#259AC9` (solo decorativo), turquesa oscuro `#1A6F93`, azul claro `#EAF4FA` y fondo `#F8FAFD`.
- **Contrastes** comprobados en `__tests__/theme.test.ts`: texto ≥ 4,5:1 y componentes ≥ 3:1.
- **Tokens**: `colors`, `spacing`, `radius`, `shadows` (`boxShadow`), `fontSize`, `fontWeight`, `MIN_TOUCH` (48), `COMFORT_TOUCH` (56) y `CONTENT_MAX_WIDTH` (960).
- **Componentes**:
  - `Card`, `Tag`, `ProgressBar` y `SectionHeader`.
  - `MenuCard`, con variante destacada.
  - `SessionBar`, `SessionSummaryView` y `ObservationsForm`.
  - Los existentes: `AppButton`, `OptionSelector`, `Feedback`, `ImageChoiceGrid`…
- **Retroalimentación configurable**: Ajustes → «Voz de refuerzo tras fallar» silencia el «Prueba otra vez».

## 10. Cómo probar en Android

1. En el ordenador:

   ```bash
   npx expo start
   ```

2. En el teléfono Android, instala **Expo Go** desde Google Play, ábrelo y escanea el código QR. Ordenador y teléfono deben estar en la misma red wifi; si no conecta, usa `npx expo start --tunnel`.
3. Flujo a comprobar:
   - Crear un perfil.
   - Preparar una sesión con 2 o 3 actividades e iniciarla.
   - Responder bien y mal.
   - Pausar, cerrar Expo Go, volver a abrir y continuar.
   - Terminar, escribir observaciones y revisar historial y perfil.
4. Revisar también: la voz (requiere la voz española instalada en Ajustes de Android → Texto a voz), TalkBack, el tamaño de letra del sistema y el margen superior de la barra de sesión.
5. El icono propio y la pantalla de bienvenida **no se ven en Expo Go**: requieren una compilación (`npx eas-cli@latest build --profile development --platform android`).
