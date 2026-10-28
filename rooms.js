// 교실 검색: 기존 교사 검색과 도면·시간 조회를 함께 사용합니다.
let selectedRoom=null;
// 수업하지 않는 것으로 확인된 공간만 등록합니다. 컴퓨터실과 전산실은 구분합니다.
const NON_TEACHING_ROOMS=new Set(['전산실']);
function isNonTeachingRoom(room){return NON_TEACHING_ROOMS.has(room.name)||NON_TEACHING_ROOMS.has(roomTitle(room));}
function roomHasSchedule(room){return teachingRoomNames().has(room.name)&&!isNonTeachingRoom(room);}
const roomNorm=s=>String(s).toLowerCase().replace(/\s/g,'').replace(/([123])학년(\d+)반/g,'$1-$2').replace(/교실/g,'').replace(/제/g,'');
function roomLessons(room,day,period){
 if(isNonTeachingRoom(room)||day<1||day>5||!period)return [];
 return TEACHERS.filter(t=>!notWorking(t,day)).flatMap(t=>{
  const res=resolve(t,day,period);
  return res?.room?.name===room.name ? [{t,res}] : [];
 });
}
function roomLessonText(rows){return rows.map(({t,res})=>`${t.name} 선생님 · ${subjectLabel(t,res.subj)}${res.cls?' · '+res.cls+'반':''}${res.guess?' · 추정 장소':''}`).join(' / ');}
function roomCurrent(room){
 if(!roomHasSchedule(room))return {label:"",rows:[],period:null};
 const n=nowT();
 const p=PERIODS.find(p=>n.day>=1&&n.day<=5&&p.n<=DAY_LAST[n.day]&&toMin(p.s)<=n.min&&n.min<toMin(p.e));
 if(!p)return {label:'현재 정규 수업 시간이 아닙니다',rows:[],period:null};
 const rows=roomLessons(room,n.day,p.n);
 return {label:rows.length?roomLessonText(rows):'등록된 시간표에서 이 교실의 수업을 확인하지 못했습니다',rows,period:p};
}
// 현재 교시와 무관하게 월~금 전체 시간표로 수업 공간을 판정합니다.
let searchableTeachingRooms=null;
function teachingRoomNames(){
 if(searchableTeachingRooms)return searchableTeachingRooms;
 const names=new Set();
 for(let day=1;day<=5;day++)for(const period of PERIODS.filter(p=>p.n<=DAY_LAST[day])){
  for(const teacher of TEACHERS){
   if(notWorking(teacher,day))continue;
   const res=resolve(teacher,day,period.n);
   if(res?.room&&!res.guess&&!isNonTeachingRoom(res.room))names.add(res.room.name);
  }
 }
 searchableTeachingRooms=names;return names;
}
const teacherRenderList=renderList;
renderList=function(){
 teacherRenderList();
 const q=roomNorm(query.trim());if(!q)return;
 const matches=Object.values(ROOMS).filter(r=>roomNorm(r.name).includes(q)||roomNorm(roomTitle(r)).includes(q)||Object.entries(ROOM_ALIAS).some(([a,b])=>b===r.name&&roomNorm(a).includes(q)));
 if(!matches.length)return;
 const section=document.createElement('section');section.className='floor-group';
 section.innerHTML=`<h3 class="floor-heading">교실·특별실<small>${matches.length}곳</small></h3>`+matches.map(r=>`<button class="row" data-room="${esc(r.name)}"><span class="badge ${fcls(r.floor)}">${r.floor}F</span><span class="rt"><b>${esc(roomTitle(r))}</b><small>${r.floor}층 · 교실 위치 보기</small><span>${esc(roomCurrent(r).label)}</span></span></button>`).join('');
 if($("list").querySelector('.empty'))$("list").innerHTML='';
 $("list").prepend(section);
 section.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{
  $("q").blur();savedPageScroll=window.scrollY;savedListScroll=document.querySelector('.listcol').scrollTop;
  selectedRoom=b.dataset.room;selected=null;viewDay=null;zoom=1;userFloor=false;placing=false;
  enterDetailHistory();$("app").dataset.mode='detail';renderDetail();scrollTo({top:0});
 });
 $("list").querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>{selectedRoom=null;renderDetail();}));
};
const teacherRenderDetail=renderDetail;
renderDetail=function(){
 if(!selectedRoom)return teacherRenderDetail();
 const room=ROOMS[selectedRoom],n=nowT(),cur=roomCurrent(room);
 if(!room){selectedRoom=null;return teacherRenderDetail();}
 if(!userFloor)viewFloor=room.floor;
 const day=viewDay??(n.day>=1&&n.day<=5?n.day:1);
 const mb=mapBlock(viewFloor,{loc:{floor:room.floor,room}}, {name:''});
 $("detail").innerHTML=`<div class="detail-actions"><button class="back" id="roomBack">← 검색 결과</button><button class="btn ghost" id="roomSearch">다른 교실 검색</button></div>
 <section class="answer"><span class="badge big ${fcls(room.floor)}">${room.floor}</span><div><p class="who">교실 위치 · ${room.floor}층</p><h2>${esc(roomTitle(room))}</h2>${roomHasSchedule(room)?`<span class="tag">${cur.period?cur.period.n+'교시 · 시간표 기준':'조회 시각 안내'}</span><p>${esc(cur.label)}</p>`:''}${cur.rows.length>1?'<p class="small">복수의 수업이 등록되어 있습니다. 합반 또는 시간표 중복 여부를 확인해 주세요.</p>':''}</div></section>
 <section class="panel"><div class="floors">${[1,2,3,4,5].map(f=>`<button class="fbtn f${f} ${f===room.floor?'here':''}" data-rfloor="${f}" aria-pressed="${viewFloor===f}">${f}F</button>`).join('')}<div class="zoom"><button id="rzo" aria-label="축소">−</button><button id="rzi" aria-label="확대">+</button></div></div>${mb.html}${viewFloor!==room.floor?`<p class="hint">안내 교실은 ${room.floor}층입니다.</p>`:''}</section>
 ${!roomHasSchedule(room)?'':`<section class="panel room-schedule" style="scroll-margin-top:72px"><div class="days">${[1,2,3,4,5].map(d=>`<button data-rday="${d}" aria-pressed="${day===d}">${DAYN[d]}</button>`).join('')}</div><ol class="route">${PERIODS.filter(p=>p.n<=DAY_LAST[day]).map(p=>{const rows=roomLessons(room,day,p.n);return `<li><button class="stop ${n.day===day&&cur.period?.n===p.n?'now':''}" data-rperiod="${p.n}"><span class="node"><b>${p.n}</b></span><span class="t"><b>${esc(rows.length?roomLessonText(rows):'등록된 수업 정보 없음')}</b><span>${p.s}~${p.e}</span></span></button></li>`;}).join('')}</ol><p class="small">교시를 누르면 해당 시각으로 조회합니다. 수업 정보 없음은 빈 교실이라는 뜻이 아닙니다. 시간표 변경·시험·휴일·실제 재실 여부는 반영되지 않습니다. 과목 미확인 선택수업은 코드로 표시합니다.</p></section>`}`;
 $("roomBack").onclick=returnToList;
 $("roomSearch").onclick=()=>{returnToList();$("q").focus();};
 $("detail").querySelectorAll('[data-rfloor]').forEach(b=>b.onclick=()=>{viewFloor=Number(b.dataset.rfloor);userFloor=true;renderDetail();});
 $("detail").querySelectorAll('[data-rday]').forEach(b=>b.onclick=()=>{viewDay=Number(b.dataset.rday);renderDetail();});
 $("detail").querySelectorAll('[data-rperiod]').forEach(b=>b.onclick=()=>{const p=PERIODS.find(p=>p.n===Number(b.dataset.rperiod));sim={day,min:toMin(p.s)+1};render();});
 $("rzi").onclick=()=>{zoom=Math.min(4,zoom+.6);renderDetail();};$("rzo").onclick=()=>{zoom=Math.max(1,zoom-.6);renderDetail();};
 if(zoom>1&&mb.pos)requestAnimationFrame(()=>{const w=$("mapwrap"),i=$("mapinner");if(w&&i)w.scrollLeft=i.clientWidth*mb.pos.x-w.clientWidth/2;});
};

// 교사 상세와 교실 상세의 모든 도면에서 공간을 터치할 수 있습니다.
const roomOriginalMapBlock=mapBlock;
mapBlock=function(floor,st,t){
 const block=roomOriginalMapBlock(floor,st,t);
 if(placing)return block;
 const im=IMG[floor];
 const hotspots=Object.values(ROOMS).filter(r=>Number(r.floor)===Number(floor)).map(r=>
 `<button type="button" data-map-room="${esc(r.name)}" aria-label="${esc(roomTitle(r))} ${roomHasSchedule(r)?'수업 일정':'위치'} 보기" style="position:absolute;left:${r.x1/im.w*100}%;top:${r.y1/im.h*100}%;width:${(r.x2-r.x1)/im.w*100}%;height:${(r.y2-r.y1)/im.h*100}%;background:transparent;border:0;padding:0;z-index:5;cursor:pointer"></button>`).join('');
 block.html=block.html.replace('</div></div>',hotspots+'</div></div>');return block;
};
function openRoomFromMap(name){
 if(!ROOMS[name]||placing)return;
 selectedRoom=name;selected=null;viewDay=null;userFloor=false;
 enterDetailHistory();$('app').dataset.mode='detail';renderDetail();
 requestAnimationFrame(()=>{
  const target=$('detail').querySelector('.room-schedule')||$('detail').querySelector('.answer');
  if(target)target.scrollIntoView({block:'start',behavior:'smooth'});
 });
}
// 캡처 단계에서 처리하여 도면 내부의 다른 클릭 처리와 충돌하지 않게 합니다.
document.addEventListener('click',event=>{
 if(placing)return;
 const button=event.target.closest('[data-map-room]');
 if(button){event.preventDefault();event.stopPropagation();openRoomFromMap(button.dataset.mapRoom);return;}
 const inner=event.target.closest('#mapinner');if(!inner)return;
 const image=inner.querySelector('img');if(!image)return;
 const rect=image.getBoundingClientRect(),im=IMG[viewFloor];
 const x=(event.clientX-rect.left)/rect.width*im.w,y=(event.clientY-rect.top)/rect.height*im.h;
 const hits=Object.values(ROOMS).filter(r=>Number(r.floor)===Number(viewFloor)&&x>=r.x1&&x<=r.x2&&y>=r.y1&&y<=r.y2);
 hits.sort((a,b)=>(a.x2-a.x1)*(a.y2-a.y1)-(b.x2-b.x1)*(b.y2-b.y1));
 if(hits.length){event.preventDefault();event.stopPropagation();openRoomFromMap(hits[0].name);}
},true);
