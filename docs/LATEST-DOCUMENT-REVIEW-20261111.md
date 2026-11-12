# Cotejo de Untitled document (1).pdf — 11 noviembre 2026

Documento recibido: 3 páginas. SHA-256 del adjunto: 131b60a688b35d83557efc8c4a8ec5ed586e89f086c67aa70573a1af9c10ad72. Se leyeron texto y capturas de las tres páginas. El PDF no se publica en el repositorio.

| Página / indicación | Corrección y verificación |
| --- | --- |
| 1: un mismo criterio para títulos, cuerpo, secundarios y negritas | Jerarquía compartida de Montserrat: cuerpo Light 300, títulos principales 300, subtítulos/tarjetas 400, destacados 600. Acentos Bebas Neue según la guía previa. Tarjetas de inicio y portafolio comparten work-meta, tamaño 24px, peso 400, terracotta y ubicación arriba en olive. La ficha usa la misma familia y jerarquía con título principal de mayor tamaño. Albra no está instalada; compra no autorizada. |
| 1: componentes parecen servicios separados | Se agrupan dentro del primer servicio en un bloque indentado, con fondo suave, introducción explícita y lista con viñetas. Sólo el servicio principal lleva su número; componentes con tipografía subordinada. |
| 2: iconos azules en celular | Flechas decorativas retiradas en el trabajo previo, conservado. Se mantiene la suite antirregresión sobre renderizadores y HTML. No se puede certificar la representación nativa de iOS desde este navegador. |
| 2: mezcla español/inglés en aprobación | Estados y controles localizados. Los comentarios escritos por usuarios se conservan literalmente y ahora llevan “Comentario del cliente (texto original)” / “Client comment (original text)”. No se reescriben opiniones ni registros de aprobación. |
| 2: Contacto duplicado | Se retiró el H2 repetido. Queda un H1 Contacto / Contact en runtime y HTML estático, sin cambiar el envío protegido de Formspree. |
| 2: ficha y tarjetas con tipografía/color distintos | Tarjetas de portafolio e inicio comparten componentes y reglas de jerarquía; títulos de ficha pertenecen al rol principal. Metadatos sin ubicación duplicada. |
| 3: sólo aparece un proyecto | Causa real: home() reutilizaba el arreglo de una sola imagen del hero para crear los destacados. Se separaron las listas: hero estático de una foto, tres destacados con enlaces independientes. Se agregaron pruebas del renderizador real, además de los HTML. |
| 3: invitación a Instagram al pie | Resuelto el 12 noviembre: Jorge confirmó @umberinteriordesign. Invitación al pie de todas las páginas, localizada ES/EN, con enlace directo al perfil, apertura separada y sin embed ni emojis. |

## Conservado

Renders privados, visor PDF/imágenes, aprobaciones con semáforo, funciones de Mercury y las ocho intenciones ES/EN. No se modifican DNS, dominio, usuarios, datos de clientes, MFA, RLS ni permisos de Drive. No se compró Albra ni se enviaron correos/formularios.

## Pruebas y límites

117 pruebas Node y regresión del portal pasan, incluyendo pruebas nuevas ES/EN para tres destacados, título único de Contacto y seis componentes dentro del servicio principal. Los formularios conservan POST fijo, fieldset deshabilitado sin JavaScript y validación. Pendientes: revisión visual tras el despliegue de este commit; iPhone físico/390px, recepción real del formulario, factura real Mercury, recorrido autenticado y enlace oficial de Instagram.

Las indicaciones implementadas no equivalen a aceptación visual total ni cierran las dependencias listadas.

## Inspección publicada

En a9b0688 se verificó en navegador a 500 px: tres tarjetas en inicio y una foto de hero, Contacto con un solo título, seis componentes agrupados dentro de arquitectura interior y ausencia de desbordamiento en las páginas medidas. Se detectaron reglas antiguas más específicas que dejaban títulos de inicio a 22px frente a 24px en portafolio y etiquetas con tamaños distintos. Se corrigió la prioridad de los selectores para compartir título de 24px/400 y etiqueta de 14px/400 entre ambas ubicaciones; se comprueba en la publicación final.

## Cierre de Instagram — 12 noviembre 2026

El usuario proporcionó @umberinteriordesign. Se añadió el bloque común de invitación al pie, con el enlace https://www.instagram.com/umberinteriordesign/ y traducción que se mantiene al cambiar de idioma. No se inició sesión ni se siguió la cuenta; se publica únicamente el enlace solicitado. Albra y las pruebas autenticadas/de entrega real conservan sus estados pendientes.
