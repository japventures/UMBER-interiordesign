# Prueba real de carga — preparada, no ejecutada

## Acceso que falta

1. Herramienta de navegador operativa para abrir el portal y Supabase. No hay herramienta Browser/Computer Use disponible en el turno de preparación. El Chromium local tampoco inicia: `process_singleton_posix.cc`, `socket() failed: Operation not permitted (1)`. No se intentan cambios de flags, exposición de servidor ni rutas alternativas para eludir esa restricción.
2. Sesión del equipo de Ana Paula o Melissa en el portal con su propio MFA AAL2. No se enrolan factores por ellas ni se usan claves, códigos o contraseñas copiados al chat. No se eleva a Jorge/QA a staff.
3. Comprobar en Supabase la versión actual de `portal-drive` y desplegar, dentro de la autorización aplicable, la versión integrada preparada que añade upload y conserva los orígenes autorizados. El último despliegue comprobado aquí fue domain-only: no probar subida contra él suponiendo que ya incluye upload.
4. Integrar la rama de proceso en el sitio de prueba y habilitar `guidedUploadEnabled` únicamente al completar las comprobaciones de backend. El archivo de configuración preparado continúa sin ese flag; no se activó nada.

No es necesario ampliar el alcance OAuth `drive.file`, cambiar permisos de Drive ni dar acceso a otro proyecto. La conexión corporativa y la carpeta raíz ya se verificaron anteriormente, pero deben comprobarse vigentes en esta prueba.

## Código y reversión

- Versión preparada del backend: `supabase/functions/portal-drive/index.ts`, SHA256 `fad96dfd9902f39a9cc43c14a616e4bbf18c0af70f1cce77a5b325385caea998`.
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

150 pruebas offline aprobadas tras reconciliar la función. La prueba visual preparada en `tests/five-stage-visual-browser.cjs` no pasó de iniciar Chromium; no se generaron capturas y no cuenta como QA visual aprobado. Prueba real no iniciada por los accesos y requisitos anteriores.
