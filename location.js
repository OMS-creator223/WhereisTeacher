const CLUBS={"조정래": {"club": "리트머스", "place": "2-9"}, "김혜원": {"club": "이에스디바이옴", "place": "2-8 / 지구과학실 / 생물실"}, "이하늘": {"club": "지피티1", "place": "컴퓨터1실"}, "변강순": {"club": "지피티2", "place": "컴퓨터1실"}, "장소영": {"club": "엔젤인널스2", "place": "스팀실 / 비슬고"}, "류승원": {"club": "넥서스", "place": "1-10 / 과학실"}, "김정희": {"club": "폴리스1", "place": "1-7"}, "김유진": {"club": "폴리스2", "place": "1-7"}, "장성훈": {"club": "카탈리스트", "place": "2-10 / 실험실 / 교내"}, "지문성": {"club": "메지컬", "place": "2-12 / 화학실"}, "이경락": {"club": "서시", "place": "2-7"}, "김지희": {"club": "글로벌", "place": "2-12"}, "한종수": {"club": "에프비아이1", "place": "R&E실"}, "금영일": {"club": "에프비아이2", "place": "R&E실"}, "이양지": {"club": "이코닉스", "place": "2-2"}, "김성국": {"club": "심봉사1", "place": "대입지도실 / 교내 / 지역 복지관"}, "우정섭": {"club": "턴오버(농구부)", "place": "강당"}, "박효정": {"club": "룩앳미", "place": "1-9"}, "박상희": {"club": "이에스에이", "place": "1-1"}, "김경숙": {"club": "버밀리온", "place": "5층 미술실"}, "양정민": {"club": "교육벼리", "place": "1-11"}, "방그래": {"club": "모션", "place": "2-3 / 교내"}, "정종민": {"club": "바이오스피어", "place": "2-1 / 생명과학실"}, "송지윤": {"club": "와이씨씨", "place": "2-4 / 1학년 각 학급 교실 / 교내 게시판 및 복도"}, "이병국": {"club": "화생방", "place": "2-11 / 화학실"}, "오정훈": {"club": "메디코어", "place": "1-3 / 화학실"}, "박소희": {"club": "디데이", "place": "음악실"}, "곽세진": {"club": "온에어", "place": "방송실 / 자판기 앞 / 강당 / 시청각실 / 도서관 / 1·2학년 교실"}, "조영산": {"club": "에이오티에스", "place": "2-5"}, "이경희": {"club": "바이오홀릭", "place": "1-8"}, "김옥자": {"club": "신문읽기반", "place": "교과융합실2"}, "배상임": {"club": "지역사회 탐구반", "place": "3-3"}, "류규하": {"club": "미디어와 사회반", "place": "3-7"}, "곽경미": {"club": "수학주제탐구반", "place": "3-8"}, "김병우": {"club": "체육 탐구반", "place": "3-5"}, "권수현": {"club": "경제/경영 탐구반", "place": "3-12"}, "정진엽": {"club": "배움의 정석", "place": "3-9"}, "조은진": {"club": "도시문화예술 탐구반", "place": "3-4"}, "한성욱": {"club": "직업 가치 탐구반", "place": "융합교과1"}, "최정숙": {"club": "바이오 메디컬", "place": "3-10"}, "우정연": {"club": "진로 관련 시사탐구반", "place": "3-2"}, "박은주": {"club": "독서토론반", "place": "3-1"}};

function resolve(t, day, p){
  const e = t.tt[day]?.[p];
  if(e && e[0]==="동아"){
    const c=CLUBS[t.name];
    if(!c){const d=deskLoc(t);return {subj:"동아",cls:null,room:d.room||null,text:d.label+" (기본 자리)",guess:false};}
    const aliases={"컴퓨터1실":"컴퓨터실1","스팀실":"STEAM실","교과융합실2":"융합교과실2","융합교과1":"융합교과실1","5층 미술실":"미술실"};
    const room=ROOMS[aliases[c.place]||c.place]||null;
    return {subj:"동아",cls:null,room,text:room?null:c.club+" · "+c.place,guess:false};
  }
 if (!e) return null;
  const [subj, room] = e;
  if (subj === "─▷"){ const prev = resolve(t, day, p-1); return prev ? {...prev, cont:true} : null; }
  let r = null, text = null, guess = false;
  const cls = isClass(room) ? room : null;
  if(subj === "과탐" && cls && cls.startsWith("1-"))return {subj,cls,room:ROOMS["물리실"],text:null,guess:false};
  const specific=TEACHING_ROOM[t.name];
  if(specific && specific.subjects.includes(subj))return {subj,cls,room:ROOMS[specific.room],text:null,guess:false};
  if (room && !isClass(room)){ r=ROOMS[ROOM_ALIAS[room] || room] || null; if(!r) text=room+" (도면 위치 미등록)"; }
  else if (SUBJECT_ROOM[subj]){ const o = SUBJECT_ROOM[subj]; r = o.room ? ROOMS[o.room] : null; text = o.text||null; guess = true; }
  else if (room){ r = ROOMS[ROOM_ALIAS[room] || room] || null; }
  else if (subj === "동아") text = "동아리 활동 (장소 미지정)";
  return {subj, cls, room:r, text, guess};
}
function deskOf(t){
  const d = desks[t.name]; if (!d) return null;
  const r = roomAt(d.floor, d.x, d.y);
  return {floor:d.floor, x:d.x, y:d.y, room:r, memo:d.memo||""};
}
function deskLoc(t){
  const d = deskOf(t);
  if (!d) return {floor:null, label:"자리 미등록"};
  const name = d.room ? roomTitle(d.room) : `${d.floor}층`;
  return {floor:d.floor, x:d.x, y:d.y, room:d.room, label:`${d.floor}층 ${name}${d.memo ? " · "+d.memo : ""}`};
}
function locOf(res){
  if (res.room) return {floor:res.room.floor, room:res.room, label:`${res.room.floor}층 ${roomTitle(res.room)}`};
  return {floor:null, label:res.text || "장소 정보 없음"};
}
const WORK_DAYS={"윤정혜":[4,5],"강신재":[4,5],"김규나":[4,5],"조현창":[1,2,3],"김지희":[1,2,3],"손영아":[1,2,3]};
const notWorking=(t,day)=>!!WORK_DAYS[t.name] && !WORK_DAYS[t.name].includes(Number(day));
const offLocation=()=>({floor:null,room:null,label:"오늘은 근무일이 아닙니다"});
function baseStatusAt(t, day, min){
  if(notWorking(t,day))return {kind:"off",loc:offLocation(),title:"오늘은 근무일이 아닙니다",sub:"근무 요일: "+WORK_DAYS[t.name].map(d=>DAYN[d]).join("·")+" · 기본 자리와 위치 핀을 표시하지 않습니다."};
  if (day<1 || day>5) return {kind:"off", loc:deskLoc(t), title:"오늘은 수업이 없는 날이에요", sub:"주말에는 학교에 안 계실 수 있어요."};
  const list = PERIODS.filter(p => p.n <= DAY_LAST[day]);
  const cur = list.find(p => toMin(p.s) <= min && min < toMin(p.e));
  const time = p => `${p.s}~${p.e}`;
  if (cur){
    const res = resolve(t, day, cur.n);
    if (res){
      const l = locOf(res);
      return {kind:"class", period:cur.n, loc:l, res,
        title:l.label, sub:`${cur.n}교시 · ${subjectLabel(t,res.subj==="─▷"?"":res.subj)}${res.cls?` · ${res.cls}반`:""} · 시간표상 수업 (${time(cur)})`};
    }
    const l = deskLoc(t);
    return {kind:"free", period:cur.n, loc:l, title:l.label, sub:`${cur.n}교시는 수업이 없어요 (${time(cur)}).${t.homeroom ? " "+freeNote(t) : ""}`};
  }
  const prev = [...list].reverse().find(p => toMin(p.e) <= min);
  const next = list.find(p => toMin(p.s) > min);
  if (!prev){ const l = deskLoc(t); return {kind:"before", loc:l, title:l.label, sub:`수업 전이에요. 1교시는 ${list[0].s}에 시작해요.`}; }
  if (!next){ const l = deskLoc(t); return {kind:"after", loc:l, title:l.label, sub:"오늘 일과가 끝났으니 선생님이 안 계실 수도 있어요."}; }
  const res = resolve(t, day, next.n);
  const l = res ? locOf(res) : deskLoc(t);
  const label = prev.n === LUNCH_AFTER ? "점심시간" : "쉬는 시간";
  return {kind:"break", period:next.n, loc:l, title:l.label, sub: res ? `${label} · ${next.n}교시(${next.s})에 이곳에서 수업해요.` : `${label} · 다음 ${next.n}교시는 수업이 없어요.`};
}

/* =========================================================
   시각 (실시간 / 지정)
   ========================================================= */

// 기본 위치는 유지하며 수업 외 가능한 장소를 별도로 안내합니다.
function statusAt(t,day,min){
 const result=baseStatusAt(t,day,min);
 if(t.name==='변강순'&&day>=1&&day<=5&&result.kind!=='class'&&!result.res&&!notWorking(t,day)){
  result.sub+=' 컴퓨터실2에도 계실 수 있습니다. 실제 위치는 확인이 필요합니다.';
 }
 return result;
}
