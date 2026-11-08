/* Fictional data only. Never substitute client information in this public file. */
window.UMBER_PORTAL_SAMPLE=()=>{
 const projects=[{id:'demo-residence',name:'Residencia · The Woodlands',location:'The Woodlands, TX',status:'active',start_date:'2026-10-01',target_date:'2027-03-31'},{id:'demo-hospitality',name:'Restaurante · Guadalajara',location:'Guadalajara, México',status:'active',start_date:'2026-11-01',target_date:'2027-05-31'}];
 let i=0;const entry=(kind,title,description,status='pending',data={},extra={})=>({id:'demo-entry-'+(++i),project_id:projects[0].id,kind,title,description,status,visibility:'client',position:i,data,created_at:'2026-11-08T16:00:00Z',...extra});
 const entries=[
  ...['Descubrimiento','Concepto','Desarrollo y visualización','Aprobaciones','Compras y logística','Obra y coordinación','Instalación y ambientación','Entrega'].map((s,n)=>entry('stage',s,'',n<2?'completed':n===2?'in_progress':'pending',{owner:'Equipo UMBER'})),
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
 return {projects,entries,comments:[{id:'demo-comment',project_id:projects[0].id,entry_id:null,author_id:'demo-team',body:'La próxima revisión reunirá materiales, iluminación y mobiliario. Mensaje ficticio.',created_at:'2026-11-08T16:00:00Z'}],decisions:[]};
};
