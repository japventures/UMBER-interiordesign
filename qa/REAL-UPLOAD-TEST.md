# Prueba real de carga — preparada, no ejecutada

## Acceso que falta

1. Herramienta de navegador operativa para abrir el portal y Supabase. No hay herramienta Browser/Computer Use disponible en el turno de preparación. El Chromium local tampoco inicia: `process_singleton_posix.cc`, `socket() failed: Operation not permitted (1)`. No se intentan cambios de flags, exposición de servidor ni rutas alternativas para eludir esa restricción.
2. Sesión administradora del portal con MFA AAL2. La coordinación informó después que Jorge inició sesión con su propio 2FA y que se le asignó portal_staff. Esa sesión puede servir para la prueba de equipo cuando esté disponible la herramienta de navegador. No modificar más roles ni enrolar factores en nombre de otras personas.
3. Comprobar en Supabase la versión actual de `portal-drive` y desplegar, dentro de la autorización aplicable, la versión integrada preparada que añade upload y conserva los orígenes autorizados. El último despliegue comprobado aquí fue domain-only: no probar subida contra él suponiendo que ya incluye upload.
4. Integrar la rama de proceso en el sitio de prueba y habilitar `guidedUploadEnabled` únicamente al completar las comprobaciones de backend. El archivo de configuración preparado continúa sin ese flag; no se activó nada.

No es necesario ampliar el alcance OAuth `drive.file`, cambiar permisos de Drive ni dar acceso a otro proyecto. La conexión corporativa y la carpeta raíz ya se verificaron anteriormente, pero deben comprobarse vigentes en esta prueba.

## Código y reversión

- Versión preparada del backend: `supabase/functions/portal-drive/index.ts`, SHA256 `7509ac93f107d7d335b0b5e29c0a44def11387526239d46082dc274ae600dc7f`.
- Se reconcilió con el paquete integrado ya revisado: upload y ajuste de dominio. No desplegar la copia anterior que sólo aceptaba el origen de GitHub.
- Antes de desplegar: descargar la fuente alojada actual y compararla. Si contiene diferencias adicionales, detener ese paso y reconciliar. No sobrescribir cambios del trabajo de dominio.
- Si se habilita el flag durante QA y falla la prueba, volver a deshabilitarlo. Conservar copia exacta de la función previa para reversión; no cambiar MFA, JWT, roles, RLS ni callbacks.

## Archivo y proyecto permitidos

Ejecutar `python3 qa/create-upload-fixture.py` genera un PDF determinista, sólo con texto ficticio:

- Archivo: `qa/fixtures/umber-private-upload-qa.pdf`.
- Tamaño: 1834 bytes.
- SHA256: `587ac97300e4115abc5453db41bae1a6dd7b41bf087db6a17f607af021a6085c`.
- Marcador: `UMBER-UPLOAD-QA-20261117`.
- Único proyecto permitido: `e2e00000-0000-4000-8000-000000000001`.

Antes de cualquier escritura, confirmar que el proyecto sigue siendo QA y que la sesión tiene acceso. No crear usuarios, modificar membresías o usar proyectos/archivos reales. Si ya existe una prueba con el mismo marcador, inspeccionar su estado y evitar duplicarla.

## Ejecución y evidencia

1. Registrar el proyecto seleccionado, la identidad de equipo y la versión de frontend/backend, sin capturar tokens o códigos MFA.
2. Guardar los IDs y estados previos del proyecto; no adoptar las cinco etapas ni reclasificar sus archivos como parte de esta prueba sin una acción explícita del equipo. Para probar sólo transporte puede usarse un nuevo entregable en borrador dentro del proyecto QA y el paso inicial sin dependencias financieras.
3. Adjuntar el PDF sintético con nota que incluya su marcador. Esperar respuesta real, no sólo mensaje visual. Verificar `entry_id`, HTTP 200, tamaño y SHA256 guardados, `visibility=team`, archivo bajo la carpeta privada vinculada a ese proyecto y conservación de etapa/slot/versión.
4. Abrir el PDF mediante el visor privado del portal y comprobar el marcador. La descarga debe coincidir con el hash anterior; no aceptar una respuesta HTML de error como PDF. No compartir el archivo por Drive.
5. Con sesión cliente AAL2 ya autorizada para QA: el borrador no aparece y la descarga directa del ID responde 404. No recopilar OTP ni iniciar sesión como el cliente usando correos de acceso.
6. Publicación temporal sólo en QA: guardar primero el estado exacto del entregable, publicar y comprobar vista previa del cliente asignado; un cliente de otro proyecto debe seguir sin acceso. Si no hay ambas sesiones, dejar esta parte pendiente en lugar de cambiar permisos.
7. Restaurar SIEMPRE el entregable al estado anterior de borrador en un bloque de finalización si se hizo publicación temporal, incluso tras un fallo de verificación. Confirmar que vuelve a estar oculto al cliente. No borrar usuarios, archivos ni registros.
8. Conservar ID nuevo, resultados, hash y capturas sin secretos. Un conflicto tras la carga puede dejar un archivo sin vincular: registrar su ID para conciliación manual, sin borrarlo automáticamente.

## Qué no prueba este procedimiento

No verifica firmas electrónicas, pagos bancarios, invitaciones de Calendar ni integración Mercury. Calendar sigue sin conexión. Una simulación en `/admin/demo/` no demuestra carga real ni acceso de clientes.

## Resultado de preparación

158 pruebas offline aprobadas tras reconciliar la función. La prueba visual preparada en `tests/five-stage-visual-browser.cjs` no pasó de iniciar Chromium; no se generaron capturas y no cuenta como QA visual aprobado. Prueba real no iniciada por los accesos y requisitos anteriores.

## Actualización de identidad y control

Jorge ahora fue reportado como staff autorizado; por eso su sesión no sirve como prueba de aislamiento de un cliente sin privilegios. Para comprobar borradores y acceso de cliente debe usarse una identidad cliente distinta ya autorizada, en una sesión separada. Si no está disponible, se puede validar carga y visor como equipo, pero la comprobación de cliente queda pendiente. No retirar el rol nuevo de Jorge para simular cliente ni cambiar membresías.

La herramienta de control de navegador sigue ausente del inventario disponible en este hilo, incluso después de que el entorno quedó listo. No se pudo inspeccionar la sesión ni comprobar el estado de Return control. No afirmar que devolver el control resuelve la ausencia de esa herramienta. La siguiente acción necesita que el hilo con el navegador conectado ejecute la prueba o que la herramienta vuelva a estar disponible aquí. No pedir otra contraseña, token o código 2FA.

## Actualización autoritativa: alcance QA preparado

La versión 7509ac93... reemplaza el paquete fad96dfd... para esta prueba: agrega una habilitación QA apagada por defecto y conserva CORS/dominio. No está desplegada por este trabajador.

Antes de activar, el relevo debe confirmar el cambio concreto: desplegar sólo portal-drive; poner PORTAL_QA_UPLOAD_ENABLED=true en el servidor; publicar guidedUploadEnabled=true y guidedUploadProjectIds=["e2e00000-0000-4000-8000-000000000001"] en el frontend. El código comprometido conserva guidedUploadEnabled=false y el servidor permanece deshabilitado si falta su flag. No afirmar activación por integrar la rama.

Con esa habilitación, todas las cargas (incluidas las de AP/Melissa) se restringen al proyecto QA asignado. La excepción de Jorge requiere identidad exacta, AAL2, portal_staff vigente y auditoría INSERT del entregable a su nombre. Sólo puede subir a un borrador nuevo sin adjuntos ni enlaces previos. No puede usar Picker, OAuth, verify_root ni create_qa. No se cambia TEAM_EMAILS ni el propietario corporativo de la conexión.

Para revisar su archivo privado, se exige además qa_uploaded_by, auditoría de creación propia y appProperties.umber_entry de Drive coincidente con el ID del entregable. Cambiar un enlace o ID en el JSON no concede acceso a un archivo ajeno. No se amplía su lectura de otros proyectos. Esta restricción corresponde a la función Drive; su rol portal_staff ya concedido por la coordinación mantiene sus permisos de datos del portal y no se modifica aquí.

El entregable de prueba debe crearse NUEVO usando la sesión de Jorge; no reutilizar los fixtures creados por otra identidad. La carga guiada puede preparar las etapas que falten únicamente dentro del proyecto ficticio; registrar sus IDs y conservarlos, sin borrar ni reclasificar contenido. Si falta el rastro de auditoría INSERT, detenerse y revisar el trigger existente; no reemplazarlo por un campo editable del navegador.

Al concluir o fallar QA: poner primero PORTAL_QA_UPLOAD_ENABLED=false y guidedUploadEnabled=false. Confirmar que una nueva carga se rechaza y que la lectura excepcional de borradores por Jorge deja de estar habilitada. Conservar archivo y registro privados para evidencia; no cambiar membresías ni borrar archivos. Los accesos de cliente publicados previamente autorizados conservan su comportamiento existente.

CNAME de main se incorpora sin cambios a la rama. En el momento de preparar este cambio, main era e672b6e y su único cambio desde 6e98d62 era CNAME. No se actualiza main ni se despliega desde este trabajo. Revalidar head antes de integrar.
