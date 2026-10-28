// 교실 검색: 기존 교사 검색과 도면·시간 조회를 함께 사용합니다.
let selectedRoom=null;
const roomNorm=s=>String(s).toLowerCase().replace(/\s/g,'').replace(/([123])학년(\d+)반/g,'$1-$2').replace(/교실/g,'').replace(/제/g,'');
function roomLessons(room,day,period){
 if(day<1||day>5||!period)return [];
 return TEACHERS.filter(t=>!notWorking(t,day)).flatMap(t=>{
  const res=resolve(t,day,period);
  return res?.room?.name===room.name ? [{t,res}] : [];
 });
}
function roomLessonText(rows){return rows.map(({t,res})=>`${t.name} 선생님 · ${subjectLabel(t,res.subj)}${res.cls?' · '+res.cls+'반':''}${res.guess?' · 추정 장소':''}`).join(' / ');}
function roomCurrent(room){
 const n=nowT();
 const p=PERIODS.find(p=>n.day>=1&&n.day<=5&&p.n<=DAY_LAST[n.day]&&toMin(p.s)<=n.min&&n.min<toMin(p.e));
 if(!p)return {label:'현재 정규 수업 시간이 아닙니다',rows:[],period:null};
 const rows=roomLessons(room,n.day,p.n);
 return {label:rows.length?roomLessonText(rows):'등록된 시간표에서 이 교실의 수업을 확인하지 못했습니다',rows,period:p};
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
 <section class="answer"><span class="badge big ${fcls(room.floor)}">${room.floor}</span><div><p class="who">교실 위치 · ${room.floor}층</p><h2>${esc(roomTitle(room))}</h2><span class="tag">${cur.period?cur.period.n+'교시 · 시간표 기준':'조회 시각 안내'}</span><p>${esc(cur.label)}</p>${cur.rows.length>1?'<p class="small">복수의 수업이 등록되어 있습니다. 합반 또는 시간표 중복 여부를 확인해 주세요.</p>':''}</div></section>
 <section class="panel"><div class="floors">${[1,2,3,4,5].map(f=>`<button class="fbtn f${f} ${f===room.floor?'here':''}" data-rfloor="${f}" aria-pressed="${viewFloor===f}">${f}F</button>`).join('')}<div class="zoom"><button id="rzo" aria-label="축소">−</button><button id="rzi" aria-label="확대">+</button></div></div>${mb.html}${viewFloor!==room.floor?`<p class="hint">안내 교실은 ${room.floor}층입니다.</p>`:''}</section>
 <section class="panel"><div class="days">${[1,2,3,4,5].map(d=>`<button data-rday="${d}" aria-pressed="${day===d}">${DAYN[d]}</button>`).join('')}</div><ol class="route">${PERIODS.filter(p=>p.n<=DAY_LAST[day]).map(p=>{const rows=roomLessons(room,day,p.n);return `<li><button class="stop ${n.day===day&&cur.period?.n===p.n?'now':''}" data-rperiod="${p.n}"><span class="node"><b>${p.n}</b></span><span class="t"><b>${esc(rows.length?roomLessonText(rows):'등록된 수업 정보 없음')}</b><span>${p.s}~${p.e}</span></span></button></li>`;}).join('')}</ol><p class="small">교시를 누르면 해당 시각으로 조회합니다. 수업 정보 없음은 빈 교실이라는 뜻이 아닙니다. 시간표 변경·시험·휴일·실제 재실 여부는 반영되지 않습니다. 과목 미확인 선택수업은 코드로 표시합니다.</p></section>`;
 $("roomBack").onclick=returnToList;
 $("roomSearch").onclick=()=>{returnToList();$("q").focus();};
 $("detail").querySelectorAll('[data-rfloor]').forEach(b=>b.onclick=()=>{viewFloor=Number(b.dataset.rfloor);userFloor=true;renderDetail();});
 $("detail").querySelectorAll('[data-rday]').forEach(b=>b.onclick=()=>{viewDay=Number(b.dataset.rday);renderDetail();});
 $("detail").querySelectorAll('[data-rperiod]').forEach(b=>b.onclick=()=>{const p=PERIODS.find(p=>p.n===Number(b.dataset.rperiod));sim={day,min:toMin(p.s)+1};render();});
 $("rzi").onclick=()=>{zoom=Math.min(4,zoom+.6);renderDetail();};$("rzo").onclick=()=>{zoom=Math.max(1,zoom-.6);renderDetail();};
 if(zoom>1&&mb.pos)requestAnimationFrame(()=>{const w=$("mapwrap"),i=$("mapinner");if(w&&i)w.scrollLeft=i.clientWidth*mb.pos.x-w.clientWidth/2;});
};
