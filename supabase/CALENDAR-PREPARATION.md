# Calendar de UMBER — preparación sin conexión

## Estado comprobado

La política pura está implementada en `functions/_shared/calendar-policy.mjs` y cubierta por pruebas sintéticas. No es una función desplegada ni una sincronización operativa. No hay OAuth, tokens, llamadas HTTP, canal de notificaciones, permisos nuevos, calendario creado ni invitaciones enviadas. La interfaz actual sigue usando los eventos propios del portal.

La política genera planes de creación/edición y una vista mínima para clientes. No llama a Google. Permanece deshabilitada si la configuración del servidor no contiene `enabled: true` y un calendario dedicado distinto de `primary`.

## Recorrido acordado

1. Desde UMBER: equipo autenticado con AAL2 selecciona proyecto y etapa; crea la cita en borrador. Después puede enviarla al calendario dedicado y publicar los datos autorizados al cliente.
2. Desde Calendar: el equipo selecciona explícitamente una cita del calendario UMBER y el proyecto. Se crea un borrador del portal y un vínculo de servidor. Una etiqueta no asigna proyectos ni publica citas automáticamente.
3. Una cita ya vinculada mantiene el mismo registro al cambiar de horario. Conservar etiqueta al editar, usar ETag/If-Match para evitar sobrescribir cambios y enviar conflictos a revisión.
4. Cancelar marca la cita como cancelada, conserva historial y retira el enlace de reunión de la proyección al cliente.

## Aislamiento y publicación

- El servidor verifica `getUser`, AAL2, rol actual y acceso al proyecto antes de construir el contexto de la política. Nunca confiar en `staff`, listas de proyectos o permisos enviados por el navegador.
- La relación calendario/evento/proyecto/registro se guarda en una tabla de servidor con unicidad por calendario y evento y por registro del portal. No se deduce del título, color, etiqueta o `extendedProperties` de Google.
- Un cliente sólo recibe una cita de su proyecto y con visibilidad `client` guardada en el portal. Revalidar membresía en cada lectura, incluso después de retirar accesos.
- No copiar descripciones, invitados, correos, adjuntos ni notas privadas de Calendar a registros visibles al cliente. El título visible procede del registro revisado del portal.
- Lugar y enlace de Meet requieren publicación explícita por separado. El enlace debe ser HTTPS y del host exacto `meet.google.com`, sin credenciales o parámetros.
- Los eventos privados/confidenciales y los tipos especiales se rechazan en la importación inicial preparada. Una futura opción de revisión de eventos privados requerirá diseño y pruebas adicionales.
- La creación preparada usa `sendUpdates=none` y no incluye invitados. Agregar invitados y enviar invitaciones será una acción explícita posterior; no está implementada.

## Cuenta, calendario y permisos: decisión pendiente antes de activar

Preferencia: que la aplicación cree un calendario secundario exclusivo UMBER con el alcance `calendar.app.created`, si la prueba de Google confirma las operaciones necesarias, incluidas las etiquetas. Las socias podrán trabajar desde Calendar sobre ese mismo calendario. No se pide acceso a todos los calendarios personales.

Si se elige un calendario existente creado fuera de la aplicación, hay que definir la cuenta propietaria y explicar el alcance efectivo antes del consentimiento: `calendar.events.owned` permite gestionar eventos de los calendarios propiedad de la cuenta, no sólo el de UMBER. Una lista permitida en nuestro servidor limita el comportamiento de la app, pero no reduce lo autorizado por OAuth. No solicitar ese permiso de forma silenciosa.

La conexión de Drive con `drive.file` no autoriza Calendar. No modificarla ni reutilizar sus tokens como si concedieran otros alcances. No solicitar `calendar.acls`, hacer público el calendario ni otorgar permisos de compartición como parte de esta preparación.

Google permite etiquetas propias del calendario; administrarlas requiere propiedad del calendario. Leer y conservar todas las etiquetas existentes antes de cualquier actualización. Los planes de evento usan `eventLabelVersion=1`; una edición conserva la etiqueta actual salvo selección explícita de otra etiqueta configurada.

## Trabajo necesario para operación real

- Aprobar cuenta, calendario y consentimiento exacto; comprobar propiedad y operaciones con permisos mínimos.
- Implementar OAuth con estado de un solo uso, expiración y vínculo a staff AAL2; cifrar refresh tokens sólo en servidor, sin registros de secretos.
- Crear almacenamiento de conexiones, vínculos y cursores con RLS y sin políticas de lectura de clientes; probarlo en un entorno desechable antes de aplicar migraciones.
- Integrar la política con manejador autenticado y transportes HTTP limitados a endpoints de Google; tratar errores y revocación sin fallback a datos de demostración.
- Implementar outbox/idempotencia, ETags, reintentos acotados y conservación de cancelaciones. Las 13 pruebas actuales son de política, no de persistencia o reintentos reales.
- Sincronización incremental: paginar hasta el último `nextSyncToken`, conservar token sólo tras completar el lote, tratar 410 con resincronización y conservar vínculos/proyectos. Un aviso push sólo despierta al sincronizador; no concede acceso ni contiene un evento confiable.
- Aplicar la zona horaria del proyecto; soportar día completo con fin exclusivo y probar horario de verano en Google y en la interfaz del portal.
- Probar con proyecto ficticio, dos identidades de cliente y equipo AAL2: borrador invisible, publicación explícita, retiro de membresía, cambio de horario, conflicto, cancelación y revocación de OAuth. No usar citas personales ni datos reales para estas pruebas.

## Fuentes oficiales consultadas

- Alcances: https://developers.google.com/workspace/calendar/api/auth
- Etiquetas: https://developers.google.com/workspace/calendar/api/guides/labels
- Propiedades extendidas: https://developers.google.com/workspace/calendar/api/guides/extended-properties
- Sincronización: https://developers.google.com/workspace/calendar/api/guides/sync
- Notificaciones push: https://developers.google.com/workspace/calendar/api/guides/push

## Pruebas del portal y carga guiada

150 pruebas offline aprobadas en el paquete completo. Incluyen el recorrido simulado de contrato/anticipo, layouts y moodboard, respaldo de aprobación y después 3D; una versión nueva del moodboard invalida la confirmación anterior. Los registros simulados se identifican como tales y nunca afirman contener un archivo real de Drive. Se corrigió la posible colisión de IDs de la demo al cargar varios archivos en el mismo milisegundo.

Las pruebas de la función de Drive preparada rechazan AAL1, no-staff, registros publicados, contenido HTML, carpetas ajenas y Shared Drive incorrecto. La escritura queda condicionada a proyecto, borrador y timestamp anterior; si cambia el registro durante la carga devuelve conflicto y no sustituye sus metadatos. Una carga de Drive ya realizada puede quedar huérfana ante conflicto; el manejo operativo de esos archivos requiere conciliación, sin borrado automático.

Pendientes: revisión visual del nuevo flujo (herramienta de navegador no disponible en este turno), despliegue/activación del backend de carga guiada y recorrido real con sesión staff AAL2. Las pruebas offline no resuelven estos pendientes.
