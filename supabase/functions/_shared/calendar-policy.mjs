/* Preparation only: pure request/projection policy. No OAuth, HTTP, database or scheduler.
 * Context and bindings must come from a server that verified Supabase getUser,
 * AAL2, current project membership and the server-side binding registry.
 * Never pass browser-provided staff, projectIds, publication or binding as trusted context. */
const fail=code=>{throw new Error(code);};
const text=(value,max=200)=>typeof value==='string'?value.trim().slice(0,max):'';
function configuration(config){
 if(config?.enabled!==true)fail('CALENDAR_DISABLED');
 if(!text(config.calendarId,1000)||config.calendarId==='primary')fail('DEDICATED_CALENDAR_REQUIRED');
 return config;
}
function access(context,projectId,write=false){
 if(!context?.userId||context.aal!=='aal2')fail('FORBIDDEN');
 if(!projectId||!Array.isArray(context.projectIds)||!context.projectIds.includes(projectId))fail('PROJECT_SCOPE_MISMATCH');
 if(write&&context.staff!==true)fail('TEAM_REQUIRED');
}
function bindingFor(config,binding,projectId,entryId){
 if(binding?.calendarId!==config.calendarId||binding.projectId!==projectId||binding.portalEntryId!==entryId||!text(binding.googleEventId,1024))fail('BINDING_MISMATCH');
 return binding;
}
function datePart(value){
 if(value?.dateTime){
  if(typeof value.dateTime!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(value.dateTime)||!Number.isFinite(Date.parse(value.dateTime)))fail('INVALID_DATES');
  return {dateTime:new Date(value.dateTime).toISOString()};
 }
 if(typeof value?.date==='string'&&/^\d{4}-\d\d-\d\d$/.test(value.date)&&new Date(value.date+'T00:00:00Z').toISOString().slice(0,10)===value.date)return {date:value.date};
 fail('INVALID_DATES');
}
function interval(event){
 const start=datePart(event.start),end=datePart(event.end);
 if(!!start.date!==!!end.date||Date.parse(end.dateTime||end.date)<=Date.parse(start.dateTime||start.date))fail('INVALID_DATES');
 return {start,end};
}
function label(config,labelKey){
 if(!labelKey)return {};
 const selected=config.labels?.[labelKey];
 if(!selected||!text(selected.id))fail('UNKNOWN_LABEL');
 return {eventLabelId:selected.id};
}
function meetUrl(value){
 if(!value)return '';
 try{const u=new URL(value);if(u.origin==='https://meet.google.com'&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(u.pathname))return u.href;}catch{}
 fail('INVALID_MEETING_URL');
}
export function planPortalToGoogle({config,context,entry,binding=null,expectedEtag=null,labelKey=null,currentEvent=null}){
 configuration(config);access(context,entry?.project_id,true);
 if(entry.kind!=='event'||!text(entry.id)||!text(entry.title))fail('INVALID_EVENT');
 const range=interval(entry.data?.all_day?{start:{date:entry.starts_at},end:{date:entry.ends_at}}:{start:{dateTime:entry.starts_at},end:{dateTime:entry.ends_at}});
 const body={summary:text(entry.title),...range,visibility:'private',...label(config,labelKey)};
 // Google metadata is a convenience pointer, never proof of project access.
 body.extendedProperties={private:{umberProjectId:entry.project_id,umberPortalEntryId:entry.id}};
 if(text(entry.data?.location))body.location=text(entry.data.location,500);
 if(binding){bindingFor(config,binding,entry.project_id,entry.id);if(!expectedEtag)fail('ETAG_REQUIRED');if(currentEvent?.id!==binding.googleEventId||currentEvent.etag!==expectedEtag)fail('CURRENT_EVENT_REQUIRED');if(!labelKey)body.eventLabelId=currentEvent.eventLabelId||'';}
 return {operation:binding?'patch':'insert',calendarId:config.calendarId,eventId:binding?.googleEventId||null,headers:binding?{'If-Match':expectedEtag}:{},params:{eventLabelVersion:1,sendUpdates:'none'},body};
}
export function planSelectedGoogleImport({config,context,event,projectId,portalEntryId}){
 configuration(config);access(context,projectId,true);
 if(!text(portalEntryId)||!text(event?.id)||event.status==='cancelled')fail('INVALID_EVENT');
 if(event.visibility==='private'||event.visibility==='confidential')fail('PRIVATE_EVENT_REQUIRES_REVIEW');
 if(event.eventType&&event.eventType!=='default')fail('UNSUPPORTED_EVENT_TYPE');
 const range=interval(event);
 return {binding:{calendarId:config.calendarId,googleEventId:event.id,projectId,portalEntryId},entry:{id:portalEntryId,project_id:projectId,kind:'event',title:text(event.summary)||'Reunión UMBER',description:'',visibility:'team',status:'pending',starts_at:range.start.dateTime||range.start.date,ends_at:range.end.dateTime||range.end.date,data:{calendar_source:'google',all_day:!!range.start.date,google_etag:text(event.etag,1024)}}};
}
export function projectCalendarEvent({config,context,binding,event,publication}){
 configuration(config);access(context,binding?.projectId);
 bindingFor(config,binding,binding.projectId,binding.portalEntryId);
 if(!event||event.id!==binding.googleEventId)fail('BINDING_MISMATCH');
 // Publication comes from the portal DB, not from Google labels/metadata or a client request.
 if(publication?.project_id!==binding.projectId||publication.id!==binding.portalEntryId||publication.kind!=='event')fail('PROJECT_SCOPE_MISMATCH');
 if(context.staff!==true&&publication.visibility!=='client')return null;
 if(event.status==='cancelled')return {id:publication.id,project_id:publication.project_id,title:text(publication.title),cancelled:true};
 const range=interval(event);
 const output={id:publication.id,project_id:publication.project_id,title:text(publication.title)||'Reunión UMBER',starts_at:range.start.dateTime||range.start.date,ends_at:range.end.dateTime||range.end.date,all_day:!!range.start.date,cancelled:false};
 // Nothing is copied from Google description, attendees, attachments or conferenceData.
 if(publication.data?.publish_location===true)output.location=text(publication.data.location,500);
 if(publication.data?.publish_meeting_link===true)output.meeting_url=meetUrl(publication.data.meeting_url);
 return output;
}
export function syncDecision({storedEtag,incomingEtag,localChanged=false}){
 if(!incomingEtag)fail('ETAG_REQUIRED');
 if(storedEtag===incomingEtag)return 'unchanged';
 return localChanged?'conflict_requires_review':'update_existing_binding';
}
