const DAYN = ["일","월","화","수","목","금","토"];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const toMin = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
const pad = n => String(n).padStart(2,"0");
const ROOMS = {}; ROOM_DEF.forEach(([name,floor,x1,y1,x2,y2]) => ROOMS[name] = {name,floor,x1,y1,x2,y2,cx:(x1+x2)/2,cy:(y1+y2)/2});
const isClass = n => /^\d-\d+$/.test(n);
const roomTitle = r => isClass(r.name) ? `${r.name} 교실` : r.name;
const full = c => SUBJ_FULL[c] || c;
const roomAt = (floor,x,y) => ROOM_DEF.map(([name,floor,x1,y1,x2,y2]) => ({name,floor,x1,y1,x2,y2,cx:(x1+x2)/2,cy:(y1+y2)/2})).find(r => r.floor===floor && x>=r.x1 && x<=r.x2 && y>=r.y1 && y<=r.y2);

// 조회 전용: 파일에 포함된 기본 자리만 표시합니다.
const desks = JSON.parse(JSON.stringify(DESKS_DEFAULT));

// 사용자 확인: 체육 교사의 기본 위치는 생활지도실. 수업 장소와는 별개입니다.
const guidanceRoom=ROOM_DEF.find(d=>d[0].includes("생활지도실"));
for(const name of ["한종수","오진석","우정섭","김병우"]){
 if(guidanceRoom){const [_,floor,x1,y1,x2,y2]=guidanceRoom;desks[name]={floor,x:(x1+x2)/2,y:(y1+y2)/2};}
}
// 담임 교사는 담당 학년의 학년실을 기본 위치로 사용합니다.
for(const t of TEACHERS){
 if(!t.homeroom)continue;
 const grade=t.homeroom.split("-")[0];
 const r=ROOM_DEF.find(d=>d[0]===grade+"학년실");
 if(r){const [_,floor,x1,y1,x2,y2]=r;desks[t.name]={floor,x:(x1+x2)/2,y:(y1+y2)/2};}
}
const TEACHING_ROOM={"박소희":{subjects:["음악","음비"],room:"음악실1"},"김정희":{subjects:["음악","음비"],room:"음악실2"},"정종민":{subjects:["미술","미비"],room:"창체활동실·미술실·헌책방"},"김경숙":{subjects:["미술","미비"],room:"미술실"},"이하늘":{subjects:["정보","데과"],room:"컴퓨터실1"},"변강순":{subjects:["정보","데과"],room:"컴퓨터실2"}};
const freeNote=t=>t.homeroom ? t.homeroom.split("-")[0]+"학년실 또는 담당 "+t.homeroom+"반 교실에 계실 수 있어요." : "";
// 김정은 선생님은 최희철 선생님과 같은 기본 위치
if(desks["최희철"]) desks["김정은"] = {...desks["최희철"]};
// 수업 장소와 담당 과목은 서로 독립적으로 관리합니다.
// 사용자 확인이 끝난 선택수업만 과목명에 연결합니다.
const CONFIRMED_ELECTIVES = {
  "이양지": {"C": {grade:2, subject:"주제탐구독서"}},
  "장성훈": {"A": {grade:2, subject:"물리"}, "B": {grade:2, subject:"물리"}},
  "지문성": {"A": {grade:2, subject:"화학"}, "B": {grade:2, subject:"화학"}}
};
function subjectLabel(t, code) {
 const known=CONFIRMED_ELECTIVES[t.name]?.[code];
 if(known)return known.subject+" · 선택 "+code;
 if(/^[A-F]\d*$/.test(code))return "선택 "+code+" · 과목명 확인 필요";
 return full(code);
}
TEACHERS.forEach(t=>{
 const grades={}; const unknown=new Set(); const subjects=new Set();
 Object.values(t.tt).forEach(day=>Object.values(day).forEach(([code,place])=>{
  if(["자율","동아","─▷"].includes(code))return;
  if(code==="진로" && t.name!=="최희철")return;
  const known=CONFIRMED_ELECTIVES[t.name]?.[code];
  if(/^[A-F]\d*$/.test(code) && !known){unknown.add(code); return;}
  const grade=known?.grade || (/^[123]-\d+$/.test(place)?Number(place[0]):null);
  const subject=known?.subject || full(code);
  subjects.add(subject);
  if(grade){ if(!grades[grade])grades[grade]=new Set(); grades[grade].add(subject); }
 }));
 t.gradeSubjects=Object.entries(grades).map(([grade,items])=>({grade:Number(grade),subjects:[...items]}));
 t.unconfirmedCodes=[...unknown].sort();
 t.main=[...subjects].join("·");
 t.searchSubjects=[t.main,...t.gradeSubjects.map(g=>g.grade+"학년 "+g.subjects.join(" ")), ...t.unconfirmedCodes.map(c=>"선택 "+c)].join(" ");
});
function gradeSubjectsHtml(t){
 const lines=t.gradeSubjects.map(g=>`<p style="margin:6px 0;overflow-wrap:anywhere"><b>${g.grade}학년</b> · ${esc(g.subjects.join(" · "))}</p>`).join("");
 const unknown=t.unconfirmedCodes.length?`<p class="small" style="margin:8px 0 0;overflow-wrap:anywhere">과목명 확인 필요: ${esc(t.unconfirmedCodes.map(c=>"선택 "+c).join(" · "))}</p>`:"";
 return `<section class="panel" style="padding:16px;margin-bottom:12px"><h3 style="font-size:1rem;margin:0 0 8px">학년별 담당 과목</h3>${lines || '<p class="small">확인된 담당 과목이 없습니다.</p>'}${unknown}</section>`;
}
