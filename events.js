function enterDetailHistory(){
 if(!history.state?.whereTeacherDetail){history.pushState({whereTeacherDetail:true},"",location.href);}
}
function returnToList(){
 if(history.state?.whereTeacherDetail){history.back();return;}
 restoreListView();
}
function restoreListView(){
 $("app").dataset.mode="list";
 document.querySelector(".listcol").scrollTop=savedListScroll;
 scrollTo({top:savedPageScroll,behavior:"auto"});
}
window.addEventListener("popstate",()=>{
 if(history.state?.whereTeacherDetail && selected!==null){$("app").dataset.mode="detail";render();}
 else restoreListView();
});
function goHome(){
 if(history.state?.whereTeacherDetail)history.replaceState(null,"",location.href);
 floorFilter=0;syncFloorFilter(); selected=null; query=""; sim=null; viewDay=null; placing=false; userFloor=false; viewFloor=4;
 zoom=1;
 $("q").value="";
 $("app").dataset.mode="list";
 document.querySelectorAll("details[open]").forEach(el=>el.open=false);
 render(); scrollTo({top:0,behavior:"auto"});
}
$("homeLogo").onclick=goHome;
function syncFloorFilter(){document.querySelectorAll("#floorFilter button").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.floor)===floorFilter)));}
document.querySelectorAll("#floorFilter button").forEach(b=>b.onclick=()=>{floorFilter=Number(b.dataset.floor);syncFloorFilter();$("app").dataset.mode="list";renderList();});
$("timeToggle").onclick=()=>{const el=$("timeTools");el.open=!el.open;};
$("timeTools").addEventListener("toggle",()=>$("timeToggle").setAttribute("aria-expanded",String($("timeTools").open)));
$("q").addEventListener("input", e => {
  query = e.target.value;
  // 상세 화면에서 검색해도 결과 목록을 즉시 표시합니다.
  $("app").dataset.mode = "list";
  renderList();
});
$("simApply").onclick = () => {
 if($("simDay").value===""){alert("요일을 선택해 주세요.");$("simDay").focus();return;}
 if(!$("simTime").value){alert("시간을 선택해 주세요.");$("simTime").focus();return;}
 sim={day:Number($("simDay").value),min:toMin($("simTime").value)};userFloor=false;render();
};
$("simTime").addEventListener("click",function(){try{if(typeof this.showPicker==="function")this.showPicker();}catch(e){this.focus();}});
function returnToLiveTime(){
 if(!sim)return;
 sim=null;viewDay=null;userFloor=false;
 render();
}
$("liveReturn").onclick=returnToLiveTime;
$("chip").onclick=returnToLiveTime;
$("chip").onkeydown=e=>{if(sim&&(e.key==="Enter"||e.key===" ")){e.preventDefault();returnToLiveTime();}};
$("simLive").onclick = () => { sim = null; userFloor = false; render(); };


render();
let lastSig = "";
setInterval(() => {
  if (placing) return;
  const n = nowT(), tt = TEACHERS.find(x => x.no === selected);
  const sig = n.day + ":" + n.min + ":" + (tt ? statusAt(tt, n.day, n.min).title : "");
  renderChip();
  if(sig!==lastSig){
    const active=document.activeElement;
    if(active && ($("list").contains(active) || $("detail").contains(active))) return;
    lastSig=sig;renderList();renderDetail();
  }
}, 30000);
