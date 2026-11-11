# Cotejo de Ana Paula — 11 noviembre 2026

Fuente: «cambios website umber.pdf» (2 páginas), «Untitled document.pdf» (5 páginas) y las imágenes de tipografía/colorimetría ya recuperadas del correo. Las páginas se cotejaron visualmente con sus instrucciones. Este documento no declara aceptación total.

| Indicación | Estado y evidencia |
| --- | --- |
| Tipografía institucional | Parcial: Montserrat variable, usada a peso 300 para cuerpo, y Bebas Neue para acentos, alojadas localmente con OFL. Se sustituyeron las familias Arial/Helvetica/Georgia de sitio y portal. Albra Sans Bold **no instalada**: no se encontró archivo de UMBER; la fuente oficial requiere licencia web. Los títulos mantienen Montserrat provisionalmente, sin fingir que es Albra. |
| Paleta institucional | Tokens terracotta #875f45, burlap #cabdab, coconut #e3dfd3, olive #605e4d, slate #302f2d conservados. |
| Títulos grandes color del logo | Selectores públicos usan terracotta; se preserva el contraste de texto sobre fotografías y estados de aprobación. |
| Ubicación duplicada en tarjetas | Una ubicación, encima del nombre; comprobado ES/EN en regresión. |
| Desarrollar intención de todos los proyectos | Se desarrollaron ocho textos ES/EN y se igualaron sus HTML estáticos con el renderizador. Veneros ya no tiene la sola frase de ubicación; se corrigió además la copia errónea de Tapalpa en su registro público. Descripción editorial basada en material existente; aprobación final de las autoras pendiente. |
| Estudio: restituir contenido anterior | Conservados los tres bloques: legado, filosofía y compromiso, más cierre, en ES/EN. |
| Inicio: quitar nombres | El bloque señalado mantiene UMBER Interior Design; los nombres permanecen en Estudio porque el documento posterior pide restaurar ese texto. |
| Quitar pausa | Hero estático sin control de pausa ni autoplay. |
| Quitar “Una selección de nuestro portafolio” | Retirado; no reemplazado por otra nota equivalente en inicio. |
| Alternativa a “Explora nuestros proyectos” | Inicio usa Ver proyectos / View projects. |
| Alternativa a “Conversemos sobre tu proyecto” | Contacto / Contact. |
| Quitar Concepto en fichas | El renderizador muestra ubicación y tipo; no el antiguo campo Concepto. |
| Español en Estudio, Contacto y FAQ | Copias ES/EN y pruebas existentes conservadas. Contenido escrito por usuarios no se traduce automáticamente. |
| Journal → Blog | Navegación y títulos Blog en ambos idiomas. |
| Aclarar servicios | Arquitectura interior y sus componentes siguen anidados y aclarados según alcance. |
| Quitar emojis | Prueba de todos los HTML y renderizadores conservada. |
| Iniciar proyecto / Contacto | Mismo destino de contacto. |
| Selecciones como listado de facturas | Tabla con foto, partida, proveedor, unitario, cantidad, importe, estado y acciones conservada; semáforo y visor conservados. |
| Proyecto basado en propuesta | Flujo de cinco etapas, entregables, revisiones y resumen por moneda conservado. No se generalizan ni publican importes ni datos privados de la propuesta original. |

## Límites concretos

- Albra Sans Bold es una dependencia real pendiente. La ficha oficial https://rellence.com/albra muestra el estilo Sans Bold desde €65; no es una cotización final de licencia web. https://rellence.com/EULA distingue licencia web por dominio y visitas; la versión trial no autoriza publicar trabajo del cliente. No se compró ni descargó una copia de terceros.
- No se modificó DNS, dominio, seguridad de Supabase ni datos privados. No se enviaron formularios o correos de prueba.
- La revisión móvil completa, el recorrido autenticado, la entrega real del formulario y la conciliación de Mercury siguen fuera de lo verificado por pruebas locales.
- La revisión nativa posterior del Google Doc y Conceptual Proposal enlazado siguen sin verificarse; se cotejaron los archivos efectivamente recuperados.

## Validación

Se ejecuta toda la suite Node más pruebas de paridad ES/EN de las ocho intenciones y presencia/licencias de fuentes. La publicación se verifica contra GitHub Pages y sus archivos servidos. La inspección visual publicada se registra aparte; aprobar pruebas de código no equivale a aprobar diseño.

## Fuentes de tipografía abierta

- https://github.com/google/fonts/tree/main/ofl/montserrat
- https://github.com/google/fonts/tree/main/ofl/bebasneue

Archivos WOFF2 convertidos sin cambios de diseño a partir de los TTF oficiales; licencias OFL completas junto a los archivos. Las fuentes no dependen de una petición externa a Google Fonts.
