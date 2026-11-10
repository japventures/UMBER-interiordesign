/* Fictional data only. Never substitute client information in this public file. */
window.UMBER_PORTAL_SAMPLE=()=>{
 const projects=[{id:'demo-residence',name:'Residencia · The Woodlands',location:'The Woodlands, TX',status:'active',start_date:'2026-10-01',target_date:'2027-03-31'},{id:'demo-hospitality',name:'Restaurante · Guadalajara',location:'Guadalajara, México',status:'active',start_date:'2026-11-01',target_date:'2027-05-31'}];
 let i=0;const entry=(kind,title,description,status='pending',data={},extra={})=>({id:'demo-entry-'+(++i),project_id:projects[0].id,kind,title,description,status,visibility:'client',position:i,data,created_at:'2026-11-08T16:00:00Z',...extra});
 const entries=[
  ...['Visita a sitio y arranque','Look and feel y distribución','Diseño conceptual','Presupuesto y compras','Supervisión y styling'].map((title,n)=>entry('stage',title,'',n<2?'completed':n===2?'in_progress':'pending',{owner:'Equipo UMBER'})),
  entry('event','Revisión de materiales','Reunión de ejemplo con el equipo.','pending',{location:'Videollamada'},{starts_at:'2026-11-18T16:00:00Z',ends_at:'2026-11-18T17:00:00Z'}),
  entry('event','Visita de coordinación','Recorrido de ejemplo por las áreas del proyecto.','pending',{location:'Obra'},{starts_at:'2026-11-24T15:00:00Z',ends_at:'2026-11-24T16:00:00Z'}),
  entry('document','Distribución general','Documento ilustrativo; no contiene archivo real.','review',{category:'plan',version:'v2'}),
  entry('document','Contrato de servicios','Referencia visual sin documento adjunto.','completed',{category:'contract',version:'v1'}),
  entry('render','Sala principal','Visualización pendiente de incorporar.','review',{room:'Sala',version:'v2'}),
  entry('moodboard','Materiales y texturas','Paleta de ejemplo para revisión.','review',{room:'Áreas sociales',version:'v1'}),
  entry('tour','Recorrido virtual','Se incorporará un recorrido autorizado por el equipo.','pending',{room:'Planta baja'}),
  entry('selection','Sofá de sala','Ejemplo de selección. Aprobar el diseño no autoriza una compra.','review',{room:'Sala',vendor:'Proveedor de ejemplo',amount:2800,currency:'USD'}),
  entry('selection','Lámpara de comedor','Referencia ilustrativa, sin cotización real.','ordered',{room:'Comedor',vendor:'Proveedor de ejemplo',amount:640,currency:'USD'}),
  entry('invoice','Honorarios · Concepto','Factura ficticia, sin solicitud de pago.','paid',{reference:'DEMO-001',amount:1500,currency:'USD',due_date:'2026-10-15'}),
  entry('invoice','Honorarios · Desarrollo','Factura ficticia, sin solicitud de pago.','outstanding',{reference:'DEMO-002',amount:2200,currency:'USD',due_date:'2026-11-30'}),
  entry('update','Revisión de materiales','El equipo compartió una nueva propuesta para revisión.','in_progress',{area:'Áreas sociales'}),
  entry('document','Presupuesto interno de ejemplo','Borrador visible solo para el equipo.','pending',{version:'v1'},{visibility:'team'}),
  entry('stage','Descubrimiento','Proyecto de hospitalidad de ejemplo.','in_progress',{}, {project_id:projects[1].id}),
  entry('moodboard','Concepto restaurante','Referencia de ejemplo para desarrollar la dirección visual.','pending',{}, {project_id:projects[1].id})
 ];
 // Fictional scheduling ranges shared by the Gantt and editable stage records.
 const spanish=/^\/es(?:\/|$)/.test(umberRoutePath(location.pathname));
 const tr=(a,b)=>spanish?a:b;
 const stages=entries.filter(e=>e.kind==='stage'&&e.project_id===projects[0].id);
 const stageTitles=['Site visit and kickoff','Look and feel and layout','Conceptual design','Budget and purchasing','Supervision and styling'];
 const stageDescriptions=[tr('Reunión de arranque, levantamiento y necesidades del proyecto.','Kickoff meeting, site survey and project needs.'),tr('Distribución, iluminación decorativa y dirección de materiales.','Layout, decorative lighting and material direction.'),tr('Mobiliario, visualizaciones y revisión del diseño.','Furniture, visualizations and design review.'),tr('Presupuesto por partidas, revisión de productos y seguimiento de pedidos.','Itemized budget, product review and order tracking.'),tr('Coordinación de instalaciones, control de calidad y entrega.','Installation coordination, quality review and handover.')];
 const stageDates=[['2026-10-01','2026-10-07'],['2026-10-12','2026-10-16'],['2026-11-02','2026-11-27'],['2026-12-07','2027-01-29']];
 stages.forEach((e,n)=>{if(!spanish)e.title=stageTitles[n];e.description=stageDescriptions[n];e.data.estimate=n===4?tr('Según entregas de proveedores','Depends on supplier deliveries'):tr('Estimación por confirmar con el estudio','Estimate to confirm with the studio');if(stageDates[n]){e.starts_at=stageDates[n][0]+'T15:00:00Z';e.ends_at=stageDates[n][1]+'T23:00:00Z';}});
 stages[3].data.dependency_note=tr('Antes de iniciar: confirmar aprobación del diseño y liquidación de la fase anterior con el estudio.','Before starting: confirm design approval and settlement of the preceding phase with the studio.');
 stages[4].data.dependency_note=tr('Fechas por programar según recepción de productos e instalaciones.','Dates to be scheduled according to deliveries and installation.');
 for(const e of entries.filter(e=>e.project_id===projects[0].id&&['document','render','moodboard','tour','selection','update'].includes(e.kind))){
  e.data.stage_id=stages[e.kind==='selection'?3:2].id;
  if(['render','moodboard','document'].includes(e.kind)&&e.status==='review'){e.data.revision_round=1;e.data.revisions_included=2;}
 }
 const sofa=entries.find(e=>e.kind==='selection'&&e.status==='review');sofa.data.unit_price=1400;sofa.data.quantity=2;
 const lamp=entries.find(e=>e.kind==='selection'&&e.status==='ordered');lamp.data.unit_price=320;lamp.data.quantity=2;
 entries.find(e=>e.kind==='update').data.next_action=tr('Revisa la paleta y comenta los ajustes en el entregable correspondiente.','Review the palette and comment on the relevant deliverable.');
 if(!/^\/es(?:\/|$)/.test(umberRoutePath(location.pathname))){
 const translations={'Residencia · The Woodlands':'Residence · The Woodlands','Restaurante · Guadalajara':'Restaurant · Guadalajara','Descubrimiento':'Discovery','Concepto':'Concept design','Desarrollo y visualización':'Development & visualization','Aprobaciones':'Approvals','Compras y logística':'Procurement & logistics','Obra y coordinación':'Site coordination','Instalación y ambientación':'Installation & styling','Entrega':'Handover','Revisión de materiales':'Materials review','Visita de coordinación':'Coordination visit','Distribución general':'General layout','Contrato de servicios':'Design services agreement','Sala principal':'Main living room','Materiales y texturas':'Materials & textures','Recorrido virtual':'Virtual tour','Sofá de sala':'Living room sofa','Lámpara de comedor':'Dining pendant','Honorarios · Concepto':'Design fee · Concept','Honorarios · Desarrollo':'Design fee · Development','Presupuesto interno de ejemplo':'Example internal budget','Concepto restaurante':'Restaurant concept','Equipo UMBER':'UMBER team','Videollamada':'Video call','Obra':'Site','Sala':'Living room','Áreas sociales':'Social areas','Planta baja':'Ground floor','Comedor':'Dining room','Proveedor de ejemplo':'Example supplier','Reunión de ejemplo con el equipo.':'Example meeting with the team.','Recorrido de ejemplo por las áreas del proyecto.':'Example walkthrough of project areas.','Documento ilustrativo; no contiene archivo real.':'Illustrative document; no actual file attached.','Referencia visual sin documento adjunto.':'Visual reference; no actual file attached.','Visualización pendiente de incorporar.':'Rendering to be added.','Paleta de ejemplo para revisión.':'Example palette for review.','Se incorporará un recorrido autorizado por el equipo.':'An approved tour will be added by the team.','Ejemplo de selección. Aprobar el diseño no autoriza una compra.':'Example selection. Design approval does not authorize a purchase.','Referencia ilustrativa, sin cotización real.':'Illustrative reference; not an actual quote.','Factura ficticia, sin solicitud de pago.':'Fictional invoice; not a payment request.','El equipo compartió una nueva propuesta para revisión.':'The team shared a new proposal for review.','Borrador visible solo para el equipo.':'Draft visible to the team only.','Proyecto de hospitalidad de ejemplo.':'Example hospitality project.','Referencia de ejemplo para desarrollar la dirección visual.':'Example reference for developing the visual direction.'};
 for(const p of projects)p.name=translations[p.name]||p.name;
 for(const e of entries){e.title=translations[e.title]||e.title;e.description=translations[e.description]||e.description;for(const k of ['owner','location','room','vendor','area'])if(e.data[k])e.data[k]=translations[e.data[k]]||e.data[k];}
 }
 return {projects,entries,comments:[{id:'demo-comment',project_id:projects[0].id,entry_id:null,author_id:'demo-team',body:/^\/es(?:\/|$)/.test(umberRoutePath(location.pathname))?'La próxima revisión reunirá materiales, iluminación y mobiliario. Mensaje ficticio.':'The next review will bring together materials, lighting and furniture. Fictional message.',created_at:'2026-11-08T16:00:00Z'}],decisions:[]};
};
