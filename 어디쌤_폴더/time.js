let sim = null;
const nowT = () => { if (sim) return sim; const v=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Seoul",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(p=>[p.type,p.value])); return {day:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(v.weekday),min:Number(v.hour)*60+Number(v.minute)}; };

/* =========================================================
   화면
   ========================================================= */
