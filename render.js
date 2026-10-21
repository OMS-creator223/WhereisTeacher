let selected = null, query = "", zoom = 1, viewFloor = 4, userFloor = false, placing = false, viewDay = null;
const fcls = f => f ? `f${f}` : "";

function renderChip() {
  $("liveReturn").hidden = !sim;
  const n = nowT();
  const isWeekday = n.day >= 1 && n.day <= 5;
  const cur = PERIODS.find(p => isWeekday && p.n <= DAY_LAST[n.day] && toMin(p.s) <= n.min && n.min < toMin(p.e));
  let label;
  if (!isWeekday) label = "주말";
  else if (cur) label = cur.n + "교시";
  else if (n.min < toMin(PERIODS[0].s)) label = "수업 전";
  else if (n.min >= toMin(PERIODS[3].e) && n.min < toMin(PERIODS[4].s)) label = "점심시간";
  else if (n.min >= toMin(PERIODS.find(p => p.n === DAY_LAST[n.day]).e)) label = "수업 종료";
  else label = "쉬는 시간";
  const c = $("chip");
  c.textContent = `${sim ? "지정 시간 · " : ""}${DAYN[n.day]} ${pad(Math.floor(n.min / 60))}:${pad(n.min % 60)} · ${label}`;
  c.className = "chip" + (sim ? " sim" : "");
  if(sim){
    c.setAttribute("role","button");c.setAttribute("tabindex","0");
    c.setAttribute("title","눌러서 현재 시간으로 돌아가기");
    c.setAttribute("aria-label",c.textContent+". 눌러서 현재 시간으로 돌아가기");
  }else{
    for(const key of ["role","tabindex","title","aria-label"])c.removeAttribute(key);
  }
}
let savedListScroll=0,savedPageScroll=0;
let floorFilter=0;
function renderList(){
 const n=nowT(),q=query.trim().replace(/\s/g,"");
 const items=TEACHERS.filter(t=>(!floorFilter||deskLoc(t).floor===floorFilter)&&(!q||t.name.includes(q)||t.searchSubjects.replace(/\s/g,"").includes(q)||(t.homeroom&&t.homeroom.includes(q))));
 const groups=new Map();
 for(const t of items){const f=deskLoc(t).floor||0;if(!groups.has(f))groups.set(f,[]);groups.get(f).push(t);}
 $("list").innerHTML=items.length ? `<p class="floor-guide">기본 교무실·학년실의 층별 목록입니다. 각 선생님 아래에는 조회 시간의 장소를 표시합니다.</p>`+[...groups.keys()].sort((a,b)=>(a||99)-(b||99)).map(f=>{
  const rows=groups.get(f);
  return `<section class="floor-group"><h3 class="floor-heading">${f?f+"층":"기본 위치 미등록"}<small>${rows.length}명</small></h3>`+rows.map(t=>{
   const st=statusAt(t,n.day,n.min),off=notWorking(t,n.day);
   const meta=[t.main,t.homeroom?t.homeroom+" 담임":""].filter(Boolean).join(" · ");
   return `<button class="row${off?" off-duty":""}" data-id="${t.no}" aria-pressed="${selected===t.no}"><span class="badge ${fcls(f)}" title="기본 장소 층">${f?f+"F":"미등록"}</span><span class="rt"><b>${esc(t.name)} 선생님</b><small title="${esc(meta)}">${esc(meta)}</small><span class="${off?"off-duty-label":""}">${esc(st.loc.label)}${st.kind==="after"?" · 일과 종료":""}</span></span></button>`;
  }).join("")+`</section>`;
 }).join("") : `<div class="empty">${floorFilter ? "선택한 층에서 검색 결과가 없어요." : "찾는 선생님이 없어요. 이름이나 과목을 다시 확인해 보세요."}${floorFilter ? `<button type="button" class="btn" id="searchAllFloors">전체 층에서 찾기</button>` : ""}</div>`;
 $("searchAllFloors") && ($("searchAllFloors").onclick=()=>{floorFilter=0;syncFloorFilter();renderList();});
 $("list").querySelectorAll(".row").forEach(b=>b.onclick=()=>{savedPageScroll=window.scrollY;savedListScroll=document.querySelector(".listcol").scrollTop;selected=Number(b.dataset.id);zoom=1;userFloor=false;placing=false;viewDay=null;enterDetailHistory();$("app").dataset.mode="detail";render();scrollTo({top:0});});
}

function mapBlock(floor, st, t){
  const im = IMG[floor], W = im.w, H = im.h;
  let html = "", pos = null;
  const target = st.loc;
  if (!placing && target.floor === floor){
    if (target.room){ const r = target.room; html += `<div class="hl" style="left:${r.x1/W*100}%;top:${r.y1/H*100}%;width:${(r.x2-r.x1)/W*100}%;height:${(r.y2-r.y1)/H*100}%"></div>`; }
    const px = target.x ?? target.room.cx, py = target.y ?? target.room.cy;
    html += `<div class="pin" style="left:${px/W*100}%;top:${py/H*100}%"></div>`; pos = {x:px/W};
  }
  const d = deskOf(t);
  if (placing && d && d.floor === floor) html += `<div class="pin" style="left:${d.x/W*100}%;top:${d.y/H*100}%;background:var(--brand)"></div>`;
  return {pos, html: `<div class="mapwrap ${placing?"placing":""}" id="mapwrap"><div class="mapinner" id="mapinner" style="width:${zoom*100}%;--room-border:${Math.min(4,1+zoom).toFixed(2)}px;--room-halo:${Math.min(7,zoom*1.75).toFixed(2)}px;--room-glow:${Math.min(12,zoom*3).toFixed(2)}px;--room-edge:${Math.min(2,zoom*.5).toFixed(2)}px">
      <img id="mapimg" src="${im.data}" alt="${floor}층 도면" draggable="false">${html}</div></div>`};
}

function renderDetail(){
  const box = $("detail");
  if (selected === null){
    box.innerHTML = `<div class="panel"><div class="nomap">선생님을 고르면<br>시간표상 수업 장소와 등록 자리를 안내해 드려요.</div></div>`;
    return;
  }
  const t = TEACHERS.find(x => x.no === selected), n = nowT();
  const st = statusAt(t, n.day, n.min), f = st.loc.floor;
  if (!userFloor && !placing && f) viewFloor = f;
  const showDay = viewDay ?? ((n.day>=1 && n.day<=5) ? n.day : 1);
  const mb = mapBlock(viewFloor, st, t);
  const d = deskOf(t);

  const floorsBtns = [1,2,3,4,5].map(x => `<button class="fbtn f${x} ${f===x&&!placing?"here":""}" role="tab" aria-selected="${viewFloor===x}" data-f="${x}">${x}F</button>`).join("");
  const stops = PERIODS.filter(p => p.n <= DAY_LAST[showDay]).map(p => {
    const res = resolve(t, showDay, p.n);
    const l = res ? locOf(res) : deskLoc(t);
    const isNow = st.period === p.n && showDay === n.day && st.kind === "class";
    const info = notWorking(t,showDay) ? "근무일 아님" : res ? `${full(res.subj==="─▷"?"":res.subj)}${res.cls?` · ${res.cls}반`:""}${res.cont?" (연강)":""}` : "수업 없음"+(t.homeroom ? " · "+freeNote(t) : "");
    return `<li><button class="stop ${isNow?"now":""}" data-p="${p.n}"><span class="node"><b class="${fcls(l.floor)}">${p.n}</b></span>
      <span class="t"><b>${esc(l.label)}</b><span>${p.s}~${p.e} · ${esc(info)}</span></span></button></li>`;
  }).join("");

  box.innerHTML = `
    <div class="detail-actions"><button class="back" id="back">← 선생님 목록</button><button class="btn ghost" id="detailSearch">다른 선생님 검색</button></div>
    <section class="answer">
      <span class="badge big ${fcls(f)}">${f ? f : "?"}</span>
      <div><p class="who">${esc(t.name)} 선생님${t.homeroom ? " · "+t.homeroom+" 담임" : ""}${t.role ? " · "+esc(t.role) : ""}</p>
      <span class="tag" style="${!["class","break"].includes(st.kind) && !notWorking(t,n.day) ? "display:none" : ""}">${notWorking(t,n.day) ? "근무 요일 안내" : st.kind==="class" ? "시간표상 수업 장소" : st.kind==="break" ? "다음 교시 장소 · 현재 위치 아님" : ""}</span><h2>${esc(st.title)}</h2><p>${esc(st.sub)}</p>
      ${st.res && st.res.guess ? `<span class="tag">교과 특성상 특별실 수업으로 추정한 위치예요</span>` : ""}
      ${(st.kind!=="class") && !d ? `<span class="tag">아직 자리가 등록되지 않았어요</span>` : ""}</div>
    </section>
    <section class="panel">
      <div class="floors" role="tablist" aria-label="층 선택">${floorsBtns}
        <div class="zoom"><button id="zo" aria-label="축소">−</button><button id="zi" aria-label="확대">+</button></div></div>
      ${IMG[viewFloor] ? mb.html : ""}
      ${f && f !== viewFloor && !placing ? `<p class="hint">📍 안내 장소는 ${f}층입니다. 위에서 ${f}F를 눌러 보세요.</p>` : ""}
      ${!f && !placing ? `<p class="hint">도면에 표시할 수 있는 위치가 아니에요. ${esc(st.loc.label)}</p>` : ""}
      ${placing ? `<p class="hint"><b>${viewFloor}층 도면에서 자리를 눌러 주세요.</b> 교무센터나 연구실 안의 책상 위치를 그대로 찍으면 돼요.</p>` : ""}

    </section>
    <section class="panel">
      <div class="days" role="group" aria-label="요일">${[1,2,3,4,5].map(x => `<button data-d="${x}" aria-pressed="${showDay===x}">${DAYN[x]}</button>`).join("")}</div>
      <ol class="route">${stops}</ol>
      <p class="small">교시를 누르면 그 시각의 위치로 바꿔 보여 줘요.</p>
    </section>`;

  $("back").onclick = returnToList;
  $("detailSearch").onclick = () => {returnToList();$("q").focus();};
  box.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { viewFloor = Number(b.dataset.f); userFloor = true; renderDetail(); });
  $("zi").onclick = () => { zoom = Math.min(4, zoom+.6); renderDetail(); };
  $("zo").onclick = () => { zoom = Math.max(1, zoom-.6); renderDetail(); };
  box.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { viewDay = Number(b.dataset.d); renderDetail(); });
  box.querySelectorAll("[data-p]").forEach(b => b.onclick = () => {
    const p = PERIODS.find(x => x.n === Number(b.dataset.p));
    sim = {day: showDay, min: toMin(p.s)+1}; userFloor = false; render();
  });
  if (zoom > 1 && mb.pos && !placing){
    requestAnimationFrame(() => { const w = $("mapwrap"), inn = $("mapinner"); if (w && inn) w.scrollLeft = inn.clientWidth*mb.pos.x - w.clientWidth/2; });
  }
}

function render(){ renderChip(); renderList(); renderDetail(); }

