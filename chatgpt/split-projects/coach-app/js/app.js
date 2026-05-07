(function(){
'use strict';

// ============ 存储层 (localStorage only) ============
const APP_MODE=document.body.dataset.app||'coach';
const P='coachSplitProject';
const K={courses:`${P}_courses`,workTimes:`${P}_workTimes`,schedules:`${P}_schedules`,courseDraft:`${APP_MODE}_courseDraft`,scheduleDraft:`${APP_MODE}_scheduleDraft`,workDraft:`${APP_MODE}_workDraft`,activePage:`${APP_MODE}_activePage`,userProducts:`${P}_userProducts`,userBookings:`${P}_userBookings`,userState:`${APP_MODE}_userState`,coachProfile:`${P}_coachProfile`,storeInfo:`${P}_storeInfo`};
const COURSE_FIELDS=['name','type','unit','limit','minutes','hours','price','buyLimit','giftHours','validDays','activeWay','advanceHour','giftDays','stores','intro','desc'];
const SCHEDULE_FIELDS=['schCourse','schStart','schEnd','schStore','schLimit'];
const DEFAULT_COACH_NAME='王美丽';
const DEFAULT_COACH_PROFILE={name:'王美丽',gender:'女',phone:'182****8474',birthDate:'1995-03-18',idCard:'4108*****5689',tags:['减脂','塑形','瑜伽','普拉提'],bio:'从业8年，擅长体态矫正与产后恢复训练。注重科学训练方法，为每位学员量身定制训练计划。',avatar:'',photos:[]};
const DEFAULT_STORE_INFO={name:'振华商厦店',address:'山东省烟台市芝罘区西大街8号',phone:'0535-6580333'};

function r(k){try{return localStorage.getItem(k)}catch(e){return null}}
function w(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function d(k){try{localStorage.removeItem(k)}catch(e){}}
function L(k,fb){const raw=r(k);if(raw===null)return fb;try{return JSON.parse(raw)??fb}catch(e){return fb}}

// ============ 全局状态 ============
let editingId=null,pendingAuditId=null,currentScheduleId=null,editingScheduleId=null,pickerTarget='';
let today=new Date();
let currentWeekStart=startOfWeek(today);
let selectedDate=new Date(today);
function emptyWorkTimes(){return {一:[],二:[],三:[],四:[],五:[],六:[],日:[]}}
let courses=L(K.courses,[]);
let workTimes=L(K.workTimes,emptyWorkTimes());
let schedules=L(K.schedules,[]);
let userProducts=L(K.userProducts,[]);
let userBookings=L(K.userBookings,[]);
let coachProfile=L(K.coachProfile,DEFAULT_COACH_PROFILE);
let storeInfo=L(K.storeInfo,DEFAULT_STORE_INFO);
let currentUserProductId=null,currentUserBookingId=null,selectedUserScheduleId=null,selectedUserDate='',coachInfoEditing=false;

// ============ 工具函数 ============
function $(id){return document.getElementById(id)}
function val(id){return $(id).value}
function S(){w(K.courses,JSON.stringify(courses));w(K.workTimes,JSON.stringify(workTimes));w(K.schedules,JSON.stringify(schedules));w(K.coachProfile,JSON.stringify(coachProfile));w(K.storeInfo,JSON.stringify(storeInfo));saveUserState()}
function saveUserData(){w(K.userProducts,JSON.stringify(userProducts));w(K.userBookings,JSON.stringify(userBookings))}
function saveUserState(){w(K.userState,JSON.stringify({currentUserProductId,currentUserBookingId,selectedUserScheduleId,selectedUserDate}))}
function restoreUserState(){const s=L(K.userState,{});currentUserProductId=s.currentUserProductId??null;currentUserBookingId=s.currentUserBookingId??null;selectedUserScheduleId=s.selectedUserScheduleId??null;selectedUserDate=s.selectedUserDate??''}
function toast(msg){const t=$('toast');t.innerText=msg;t.style.display='block';setTimeout(()=>t.style.display='none',1500)}
function startOfWeek(d){const x=new Date(d);const day=x.getDay()||7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day+1);return x}
function fmtMD(d){return `${d.getMonth()+1}月${d.getDate()}日`}
function fmtISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function timeToMin(t){const [h,m]=String(t||'00:00').split(':').map(Number);return h*60+(m||0)}
function addOneHour(t){const [h,m]=String(t||'10:00').split(':').map(Number);return `${String(Math.min(22,h+1)).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`}
function dayName(dateStr){return ['日','一','二','三','四','五','六'][new Date(dateStr+'T00:00:00').getDay()]}
function fmtUserDate(dateStr){const d=new Date(dateStr+'T00:00:00');return `${String(d.getMonth()+1).padStart(2,'0')}月${String(d.getDate()).padStart(2,'0')}日`}
function fmtUserDateTime(dateStr,start,end){return `${fmtUserDate(dateStr)} 星期${dayName(dateStr)} ${start}–${end}`}
function userSlotPeriod(start){const hour=parseInt(String(start).split(':')[0],10);return hour<12?'上午':hour<18?'下午':'晚上'}
function normalizeUserCourseName(course){if(!course)return'';if(course.type==='一对多'&&!/小班|团课|小组/.test(course.name))return `${course.name}小班课`;return course.name}
function applyFieldValues(fields,data){if(!data)return;fields.forEach(id=>{const el=$(id);if(el&&data[id]!==undefined)el.value=data[id]})}
function bindDraftEvents(fields,handler){fields.forEach(id=>{const el=$(id);if(!el)return;el.addEventListener('input',handler);el.addEventListener('change',handler)})}
function saveActivePage(id){w(K.activePage,JSON.stringify(id))}


// ============ Draft helpers ============
function saveCourseDraft(){w(K.courseDraft,JSON.stringify(collectCourse()))}
function loadCourseDraft(){return L(K.courseDraft,null)}
function clearCourseDraft(){d(K.courseDraft)}
function collectScheduleDraft(){return{schCourse:val('schCourse'),schStart:val('schStart'),schEnd:val('schEnd'),schStore:val('schStore'),schLimit:val('schLimit')}}
function saveScheduleDraft(){w(K.scheduleDraft,JSON.stringify(collectScheduleDraft()))}
function loadScheduleDraft(){return L(K.scheduleDraft,null)}
function clearScheduleDraft(){d(K.scheduleDraft)}
function defaultWorkLines(){return[{name:'上午',value:'09:00–12:00',off:false},{name:'下午',value:'14:00–18:00',off:false},{name:'晚上',value:'18:30–21:30',off:false}]}
function buildWorkDraftFromSaved(){const selected=Object.keys(workTimes).filter(day=>workTimes[day]&&workTimes[day].length);const baseDay=selected[0];const lines=(baseDay?workTimes[baseDay]:[]).map(value=>({name:'新增',value,off:false}));return{days:selected,lines:lines.length?lines:defaultWorkLines()}}
function collectWorkDraft(){return{days:[...document.querySelectorAll('#editDays .day.on')].map(x=>x.dataset.day),lines:[...document.querySelectorAll('#timeLines .time-line')].map(row=>({name:row.querySelector('.time-name').innerText.trim(),value:row.querySelector('.time-input').value.trim(),off:row.querySelector('.switch').classList.contains('off')}))}}
function saveWorkDraft(){if(!$('workEditPage'))return;w(K.workDraft,JSON.stringify(collectWorkDraft()))}
function loadWorkDraft(){return L(K.workDraft,null)}
function clearWorkDraft(){d(K.workDraft)}

// ============ 课程管理 ============
function meta(c){return c.unit==='按时间'?`${c.type} | ${c.hours||0}节 | ${c.limit||2}人 | ¥${c.price||0}/${c.validDays||30}天`:`${c.type} | ${c.hours||0}节 | ¥${c.price||0}/节`}
function actions(c){if(c.status==='待审核')return`<span onclick="editCourse(${c.id})">编辑</span><span onclick="withdraw(${c.id})">撤回</span>`;if(c.status==='已上架')return`<span onclick="editCourse(${c.id})">编辑</span><span onclick="offline(${c.id})">下架</span><span onclick="removeCourse(${c.id})">删除</span>`;if(c.status==='审核驳回')return`<span onclick="editCourse(${c.id})">编辑</span><span onclick="removeCourse(${c.id})">删除</span>`;return`<span onclick="editCourse(${c.id})">编辑</span><span onclick="online(${c.id})">上架</span><span onclick="removeCourse(${c.id})">删除</span>`}
function renderList(){const kw=val('keyword').trim(),st=val('statusFilter'),box=$('courseList'),fab=document.querySelector('#listPage .fab');const list=courses.filter(c=>(!kw||c.name.includes(kw))&&(st==='全部'||c.status===st));fab.style.display=courses.length?'flex':'none';if(!list.length){box.innerHTML='<div class="empty"><div class="empty-title">暂无课程</div><div>点击下方按钮创建课程，审核通过后可用于课程排班</div><div class="empty-action" onclick="openCreate()">新增课程</div></div>';return}box.innerHTML=list.map(c=>`<div class="course-card"><div class="course-main"><div class="course-name">${c.name}</div><div class="course-meta">${meta(c)}</div>${c.reason?`<div class="reason">驳回原因：${c.reason}</div>`:''}<div class="tag ${c.status==='待审核'?'pending':c.status==='已上架'?'online':c.status==='审核驳回'?'reject':'offline'}">${c.status}</div></div><div class="course-actions">${actions(c)}</div></div>`).join('')}
function collectCourse(){return{name:val('name')||'未命名课程',type:val('type'),unit:val('unit'),limit:val('limit'),minutes:val('minutes'),hours:val('hours'),price:val('price'),buyLimit:val('buyLimit'),giftHours:val('giftHours'),validDays:val('validDays'),activeWay:val('activeWay'),advanceHour:val('advanceHour'),giftDays:val('giftDays'),stores:val('stores'),intro:val('intro'),desc:val('desc')}}

window.openCreate=function(){editingId=null;clearCourseDraft();$('formTitle').innerText='新增课程';document.querySelector('#formPage .bottom-btn').innerText='创建';COURSE_FIELDS.forEach(id=>$(id).value='');$('type').value='一对一';$('unit').value='按节';$('activeWay').value='';updateFormRows();showPage('formPage')};
window.editCourse=function(id){const c=courses.find(x=>x.id===id);if(!c)return;editingId=id;$('formTitle').innerText='新增课程';document.querySelector('#formPage .bottom-btn').innerText=c.status==='审核驳回'?'重新提交':'保存';['name','type','unit','limit','minutes','hours','price','buyLimit','giftHours','validDays','activeWay','advanceHour','giftDays','stores','intro','desc'].forEach(k=>{const el=$(k);if(el)el.value=c[k]||''});updateFormRows();showPage('formPage')};
window.submitCourse=function(){const data=collectCourse();if(editingId){const idx=courses.findIndex(x=>x.id===editingId);const needAudit=courses[idx].status==='审核驳回'||courses[idx].status==='待审核';courses[idx]={...courses[idx],...data,reason:'',status:needAudit?'待审核':courses[idx].status};pendingAuditId=needAudit?courses[idx].id:null;toast(needAudit?'已提交审核':'已保存')}else{const newCourse={id:Date.now(),...data,status:'待审核'};courses.unshift(newCourse);pendingAuditId=newCourse.id;toast('创建成功，已进入待审核')}syncUserProducts();clearCourseDraft();showPage('listPage');if(pendingAuditId)setTimeout(()=>$('auditMask').style.display='block',450)};
window.auditPass=function(){const c=courses.find(x=>x.id===pendingAuditId);if(c){c.status='已上架';c.reason=''}syncUserProducts();$('auditMask').style.display='none';toast('审核通过，课程已上架');pendingAuditId=null;renderList()};
window.auditReject=function(){const c=courses.find(x=>x.id===pendingAuditId);if(c){c.status='审核驳回';c.reason='演示驳回：课程信息需补充'}syncUserProducts();$('auditMask').style.display='none';toast('已驳回');pendingAuditId=null;renderList()};
window.withdraw=function(id){const c=courses.find(x=>x.id===id);if(c)c.status='已下架';syncUserProducts();toast('已撤回');renderList()};
window.offline=function(id){const c=courses.find(x=>x.id===id);if(c)c.status='已下架';syncUserProducts();toast('已下架');renderList()};
window.online=function(id){const c=courses.find(x=>x.id===id);if(c)c.status='待审核';syncUserProducts();toast('已提交上架审核');renderList()};
window.removeCourse=function(id){courses=courses.filter(x=>x.id!==id);syncUserProducts();toast('已删除');renderList()};
function updateFormRows(){const type=val('type'),unit=val('unit');$('limitRow').style.display=type==='一对多'?'flex':'none';$('minuteRow').style.display=unit==='按节'?'flex':'none';$('giftHoursRow').style.display='flex';$('giftDaysRow').style.display=unit==='按时间'?'flex':'none'}

// ============ 工作时间 ============
function renderWorkList(){const box=$('workList'),btn=$('workEditBtn');const has=Object.values(workTimes).some(v=>v.length);if(has){btn.style.display='flex';box.innerHTML=['一','二','三','四','五','六','日'].map(d=>`<div class="work-row"><div class="work-day">周${d}</div><div class="work-times">${workTimes[d].length?workTimes[d].join('&nbsp;&nbsp;&nbsp;'):'休息'}</div></div>`).join('')}else{btn.style.display='none';box.innerHTML='<div class="empty"><div class="empty-title">暂无工作时间</div><div>先设置可排课时间范围，后续新增课次时按该时间进行排班</div><div class="empty-action" onclick="openWorkEdit()">设置工作时间</div></div>'}}
window.openWorkEdit=function(){showPage('workEditPage');const draft=loadWorkDraft()||buildWorkDraftFromSaved();$('editDays').innerHTML=['一','二','三','四','五','六','日'].map(d=>`<div class="day${draft.days.includes(d)?' on':''}" data-day="${d}" onclick="toggleWorkDay(this)">${d}</div>`).join('');renderTimeLines(draft.lines)};
function renderTimeLines(lines=defaultWorkLines()){$('timeLines').innerHTML=lines.map(x=>`<div class="time-line"><div class="time-name">${x.name}</div><input class="time-input" value="${x.value}"><div class="switch${x.off?' off':''}" onclick="toggleWorkSwitch(this)"></div></div>`).join('')}
window.toggleWorkDay=function(el){el.classList.toggle('on');saveWorkDraft()};
window.toggleWorkSwitch=function(el){el.classList.toggle('off');saveWorkDraft()};
window.addTimeLine=function(){$('timeLines').insertAdjacentHTML('beforeend','<div class="time-line"><div class="time-name">新增</div><input class="time-input" value="22:00–23:00"><div class="switch" onclick="toggleWorkSwitch(this)"></div></div>');saveWorkDraft()};
window.saveWorkTime=function(){const selected=[...document.querySelectorAll('#editDays .day.on')].map(x=>x.dataset.day);const times=[...document.querySelectorAll('#timeLines .time-line')].filter(row=>!row.querySelector('.switch').classList.contains('off')).map(row=>row.querySelector('.time-input').value.trim()).filter(Boolean);['一','二','三','四','五','六','日'].forEach(d=>{workTimes[d]=selected.includes(d)?[...times]:[]});S();clearWorkDraft();toast('工作时间已保存');showPage('workPage')};
function getWorkRangesForDate(dateInput){return workTimes[dayName(typeof dateInput==='string'?dateInput:fmtISO(dateInput))]||[]}
function hasWorkTimeForDate(dateInput){return getWorkRangesForDate(dateInput).length>0}

// ============ 排课日历 ============
const CALENDAR_START_HOUR=9,CALENDAR_END_HOUR=22,CALENDAR_HOUR_HEIGHT=48;
function calendarStartMin(){return CALENDAR_START_HOUR*60}
function calendarEndMin(){return CALENDAR_END_HOUR*60}
function calendarTrackHeight(){return (CALENDAR_END_HOUR-CALENDAR_START_HOUR)*CALENDAR_HOUR_HEIGHT}
function buildCalendarLabels(){const labels=[];for(let hour=CALENDAR_START_HOUR;hour<=CALENDAR_END_HOUR;hour++)labels.push(`${String(hour).padStart(2,'0')}:00`);return labels}
function lessonMetrics(s){const minStart=calendarStartMin(),minEnd=calendarEndMin(),pxPerMin=CALENDAR_HOUR_HEIGHT/60;const startMin=Math.max(minStart,timeToMin(s.start));const endMin=Math.min(minEnd,timeToMin(s.end));const top=(startMin-minStart)*pxPerMin;const height=Math.max(20,(endMin-startMin)*pxPerMin-2);return{top,height,duration:endMin-startMin}}
function getLessonTone(s){if(s.status==='停止预约')return'gray';return Number(s.booked||0)>=Number(s.limit||1)?'purple':Number(s.booked||0)>0?'blue':'green'}
function lessonStateText(s){if(s.status==='停止预约')return'不可预约';if(Number(s.booked||0)>=Number(s.limit||1))return`已满 ${s.booked}/${s.limit}`;if(Number(s.booked||0)>0)return`已约 ${s.booked}/${s.limit}`;return`${s.booked}/${s.limit}`}
function lessonHtml(s){const {top,height,duration}=lessonMetrics(s);const color=getLessonTone(s);const compact=duration<=30?' compact':'';return`<div class="lesson ${color}${compact}" style="top:${top}px;height:${height}px" onclick="openOp(${s.id})"><div class="lesson-line"><strong>${s.courseName}</strong><span class="lesson-meta">${s.start}–${s.end}</span><span class="lesson-meta">${lessonStateText(s)}</span></div></div>`}
function renderCalendarHeader(){const end=new Date(currentWeekStart);end.setDate(end.getDate()+6);$('rangeText').innerText=`${fmtMD(currentWeekStart)}–${fmtMD(end)}`;let html='';for(let i=0;i<7;i++){const d=new Date(currentWeekStart);d.setDate(d.getDate()+i);const isActive=fmtISO(d)===fmtISO(selectedDate);html+=`<div onclick="selectDate('${fmtISO(d)}')"><span class="${isActive?'active-date':''}">${d.getDate()}</span></div>`}$('datebar').innerHTML=html}
function renderCalendar(){renderCalendarHeader();const grid=$('calendarGrid'),fab=document.querySelector('#calendarPage .fab');const daySchedules=schedules.filter(s=>(s.date||fmtISO(selectedDate))===fmtISO(selectedDate)&&s.status!=='已取消').sort((a,b)=>timeToMin(a.start)-timeToMin(b.start));fab.style.display=daySchedules.length?'flex':'none';if(!daySchedules.length){grid.innerHTML='<div class="calendar-empty" style="grid-column:1/3"><div class="empty-title">暂无排课</div><div>当前日期暂无课次</div><div>请先创建并上架课程，再新增排课</div><div class="empty-action" onclick="openScheduleCreate()">新增排课</div></div>';return}const labels=buildCalendarLabels();const trackHeight=calendarTrackHeight();const timeHtml=`<div class="time-col" style="height:${trackHeight}px">${labels.map(label=>`<div class="time-label" style="top:${(timeToMin(label)-calendarStartMin())*(CALENDAR_HOUR_HEIGHT/60)}px">${label}</div>`).join('')}</div>`;const trackHtml=`<div class="calendar-track" style="height:${trackHeight}px">${daySchedules.map(s=>lessonHtml(s)).join('')}</div>`;grid.innerHTML=timeHtml+trackHtml}
window.changeWeek=function(step){currentWeekStart.setDate(currentWeekStart.getDate()+step*7);selectedDate=new Date(currentWeekStart);renderCalendar()};
window.goToday=function(){today=new Date();selectedDate=new Date(today);currentWeekStart=startOfWeek(today);renderCalendar()};
window.selectDate=function(d){selectedDate=new Date(d+'T00:00:00');renderCalendar()};

// ============ 课次操作 ============
function showScheduleTip(){const dateStr=fmtISO(selectedDate);$('scheduleTipText').innerHTML=`${fmtMD(selectedDate)}（周${dayName(dateStr)}）还没有设置工作时间，请先去配置后再新增排课。`;$('scheduleTipMask').style.display='block'}
window.closeScheduleTip=function(){$('scheduleTipMask').style.display='none'};
window.goSetWorkTime=function(){closeScheduleTip();openWorkEdit()};
window.openScheduleCreate=function(scheduleId=null){if(scheduleId===null&&!hasWorkTimeForDate(selectedDate)){showScheduleTip();return}editingScheduleId=scheduleId;const sel=$('schCourse'),online=courses.filter(c=>c.status==='已上架');sel.innerHTML=online.map(c=>`<option value="${c.id}">${c.name}${c.type==='一对多'?'小班':''}</option>`).join('')||'<option value="">暂无已上架课程</option>';$('scheduleFormTitle').innerText=scheduleId?'编辑课次':'新增课次';document.querySelector('#scheduleFormPage .orange-btn').innerText=scheduleId?'保存修改':'保存';if(scheduleId){const s=schedules.find(x=>x.id===scheduleId);const matched=online.find(c=>s.courseName.includes(c.name));if(matched)sel.value=matched.id;$('schStart').value=`${s.date}T${s.start}`;$('schEnd').value=`${s.date}T${s.end}`;$('schStore').value=s.store||'';$('schLimit').value=s.limit||''}else{SCHEDULE_FIELDS.forEach(id=>$(id).value='');const draft=loadScheduleDraft();if(draft){if([...sel.options].some(o=>o.value===draft.schCourse))sel.value=draft.schCourse;applyFieldValues(SCHEDULE_FIELDS,draft)}if(!val('schStore')||!val('schLimit'))fillScheduleCourseInfo()}showPage('scheduleFormPage')};
window.openDateTimePicker=function(target){pickerTarget=target;const dateSel=$('pickerDate'),timeSel=$('pickerTime');let dateHtml='';for(let i=0;i<7;i++){const d=new Date(currentWeekStart);d.setDate(d.getDate()+i);dateHtml+=`<option value="${fmtISO(d)}" ${fmtISO(d)===fmtISO(selectedDate)?'selected':''}>${fmtMD(d)}</option>`}dateSel.innerHTML=dateHtml;let timeHtml='';for(let h=9;h<=22;h++){['00','30'].forEach(m=>{if(h===22&&m==='30')return;const t=`${String(h).padStart(2,'0')}:${m}`;timeHtml+=`<option value="${t}">${t}</option>`})}timeSel.innerHTML=timeHtml;if($(target).value){dateSel.value=$(target).value.slice(0,10);timeSel.value=$(target).value.slice(11,16)}else{timeSel.value=target==='schEnd'&&val('schStart')?addOneHour(val('schStart').slice(11,16)):'10:00'}$('pickerMask').style.display='block'};
window.closeDateTimePicker=function(){$('pickerMask').style.display='none'};
window.confirmDateTimePicker=function(){$(pickerTarget).value=$('pickerDate').value+'T'+$('pickerTime').value;$('pickerMask').style.display='none';saveScheduleDraft()};
function fillScheduleCourseInfo(){const c=courses.find(x=>x.id===+val('schCourse'));$('schStore').value=c?(c.stores||''):'';$('schLimit').value=c?(c.type==='一对多'?(c.limit||2):1):'';saveScheduleDraft()}
window.saveSchedule=function(){const c=courses.find(x=>x.id===+val('schCourse'));if(!c){toast('请先创建并审核通过课程');return}const startVal=val('schStart'),endVal=val('schEnd');if(!startVal||!endVal){toast('请选择开始和结束时间');return}const dateStr=startVal.slice(0,10),start=startVal.slice(11,16),endt=endVal.slice(11,16);if(timeToMin(endt)<=timeToMin(start)){toast('结束时间必须晚于开始时间');return}const ranges=getWorkRangesForDate(dateStr);const ok=ranges.some(r=>{const [s1,e1]=r.split('–');return start>=s1&&endt<=e1});if(!ok){toast('不在工作时间范围内');return}const payload={courseId:c.id,courseType:c.type,courseName:c.name+(c.type==='一对多'?'小班':''),date:dateStr,week:dayName(dateStr),start,end:endt,store:val('schStore')||c.stores||'未选择门店',limit:+val('schLimit')||(c.type==='一对多'?+c.limit||2:1)};if(editingScheduleId){const idx=schedules.findIndex(x=>x.id===editingScheduleId);if(idx>-1)schedules[idx]={...schedules[idx],...payload};toast('课次已修改')}else{schedules.push({id:Date.now(),...payload,booked:0,status:'可预约',members:[]});toast('课次已保存')}editingScheduleId=null;S();clearScheduleDraft();selectedDate=new Date(dateStr+'T00:00:00');currentWeekStart=startOfWeek(selectedDate);showPage('calendarPage')};
window.openOp=function(id){currentScheduleId=id;const s=schedules.find(x=>x.id===id);if(s)$('toggleBookingBtn').innerText=s.status==='停止预约'?'开启预约':'停止预约';$('opMask').style.display='block'};
window.hideOp=function(){$('opMask').style.display='none'};
window.editSchedule=function(){hideOp();openScheduleCreate(currentScheduleId)};
function refreshStopPage(){const s=schedules.find(x=>x.id===currentScheduleId);if(!s)return;const reopening=s.status==='停止预约';$('stopPageTitle').innerText=reopening?'开启预约':'停止预约';$('stopText').innerHTML=reopening?'开启预约后，学员将可以继续预约<br/>该课次未满员时会恢复可预约':'停止预约后，学员将无法再预约<br/>该课次已预约的学员不受影响';$('stopConfirmBtn').innerText=reopening?'确认开启':'确认停止';$('stopConfirmBtn').className=reopening?'orange-btn':'red-btn'}
window.showStopPage=function(){hideOp();refreshStopPage();showPage('stopPage')};
window.confirmStop=function(){const s=schedules.find(x=>x.id===currentScheduleId);if(!s)return;if(s.status==='停止预约'){s.status=Number(s.booked||0)>=Number(s.limit||1)?'已满':'可预约';toast('已开启预约')}else{s.status='停止预约';toast('已停止预约')}S();showPage('calendarPage')};
window.cancelSchedule=function(){const s=schedules.find(x=>x.id===currentScheduleId);if(s){s.status='已取消';S()}hideOp();toast('已取消课次');renderCalendar()};
window.deleteSchedule=function(){schedules=schedules.filter(x=>x.id!==currentScheduleId);S();hideOp();toast('已删除课次');renderCalendar()};

// ============ 学员/预约管理 ============
function getCoachStudentCount(){const keys=new Set();schedules.forEach(s=>{(s.members||[]).forEach(m=>{if(m.status==='已取消')return;const k=(m.phone||m.name||'').trim();if(k)keys.add(k)})});return keys.size}
function coachBookingWayText(m){return m.source==='user'?'学员约教练':'教练约学员'}
function coachBookingNote(m){if(m.status==='待教练处理取消')return'学员发起了开课 3 小时内取消申请，等待教练处理。';if(m.status==='待学员确认完课'&&m.completeConfirmExpireAt)return'学员需在 24 小时内确认完课，超时将自动完课。';if(m.status==='未到场')return'教练未同意取消，课程按未到场处理并正常核销。';if(m.status==='已完课'&&m.completedAt)return`完课时间：${new Date(m.completedAt).toLocaleString('zh-CN',{hour12:false})}`;return''}
function coachBookingActions(m){if(m.status==='待教练处理取消')return`<button class="mini-btn" onclick="approveCancelByCoach('${m.bookingId}')">同意取消</button><button class="mini-btn secondary" onclick="markNoShow('${m.bookingId}')">记为未到场</button>`;if(m.status==='待上课')return`<button class="mini-btn" onclick="confirmClassStart('${m.bookingId}')">确认上课</button>`;if(m.status==='上课中'&&m.source==='user')return`<button class="mini-btn" onclick="finishBookingByCoach('${m.bookingId}')">确认完课</button>`;if(m.status==='上课中'&&m.source==='coach')return`<button class="mini-btn" onclick="requestFinishConfirm('${m.bookingId}')">发起完课确认</button>`;return''}
function renderScheduleMemberCard(m){const a=coachBookingActions(m),n=coachBookingNote(m);return`<div class="student-block"><div class="student-head"><div class="avatar"></div><div class="student-main"><div class="student-name">${m.name}</div><div class="student-meta">${m.phone||'未留手机号'}<br/>预约方式：${coachBookingWayText(m)}<br/>预约时间：${m.time||'--'}</div></div><div class="student-status">${m.status}</div></div>${a?`<div class="student-actions">${a}</div>`:''}${n?`<div class="student-note">${n}</div>`:''}</div>`}
window.openDetail=function(id=currentScheduleId){currentScheduleId=id;hideOp();settleBookingTimeouts();const s=schedules.find(x=>x.id===id);if(!s)return;const members=ensureScheduleMembers(s);$('detailBox').innerHTML=`<div class="detail-card"><div class="detail-top"><div class="detail-title">${s.courseName}</div><div class="detail-status">${s.status}</div></div><div class="detail-line">${s.date} ${s.start}–${s.end}<br/>${s.store||''}<br/>上课人数限制&nbsp; ${s.limit}人<br/>已约&nbsp; ${s.booked}人<br/>状态&nbsp; ${s.status}</div></div><div class="student-card"><div class="student-title">预约学员</div>${members.length?members.map(renderScheduleMemberCard).join(''):'<div style="color:#888;margin-top:12px">暂无预约学员</div>'}</div>`;showPage('scheduleDetailPage')};
window.approveCancelByCoach=function(bid,sid){cancelBookingSeat(bid);toast('已同意取消');if(sid){currentScheduleId=sid;renderCoachHome()}else openDetail(currentScheduleId)};
window.markNoShow=function(bid,sid){updateBookingRecord(bid,{status:'未到场',completedAt:new Date().toISOString()});toast('已记为未到场');if(sid){currentScheduleId=sid;renderCoachHome()}else openDetail(currentScheduleId)};
window.confirmClassStart=function(bid,sid){updateBookingRecord(bid,{status:'上课中'});toast('已确认上课');if(sid){currentScheduleId=sid;renderCoachHome()}else openDetail(currentScheduleId)};
window.finishBookingByCoach=function(bid,sid){updateBookingRecord(bid,{status:'已完课',completedAt:new Date().toISOString()});toast('已确认完课');if(sid){currentScheduleId=sid;renderCoachHome()}else openDetail(currentScheduleId)};
window.requestFinishConfirm=function(bid,sid){updateBookingRecord(bid,{status:'待学员确认完课',completeConfirmExpireAt:new Date(Date.now()+24*60*60*1000).toISOString()});toast('已发起完课确认');if(sid){currentScheduleId=sid;renderCoachHome()}else openDetail(currentScheduleId)};
window.showMemberPage=function(){hideOp();showPage('memberPage');renderMembers()};
function renderMembers(){syncUserProducts();const s=schedules.find(x=>x.id===currentScheduleId);if(!s){$('memberRows').innerHTML='<div class="empty" style="padding-top:48px"><div class="empty-title">暂无课次信息</div><div>请返回后重新选择要操作的课次</div></div>';return}const currentRemain=userProducts.filter(p=>String(p.courseId)===String(s.courseId)).reduce((sum,p)=>sum+Number(p.remain||0),0);const members=[['小明','188****0000',currentRemain>0?`剩余：${currentRemain}次`:'无可用课时',currentRemain>0?1:0],['李三','139****6666','剩余：3次',1],['王五','138****3321','剩余：2次',1],['赵敏','137****2208','剩余：1次',1],['孙超','136****1188','无可用课时',0]];$('memberRows').innerHTML=members.map(m=>`<div class="member-row${m[3]?'':' disabled'}" ${m[3]?`onclick="showMemberBookConfirm('${m[0]}','${m[1]}')"`:''}><div class="avatar"></div><div class="member-info"><b>${m[0]}</b><br/>${m[1]}</div><div class="remain ${m[3]?'':'bad'}">${m[2]}</div></div>`).join('')}
let pendingMemberName='',pendingMemberPhone='';
window.showMemberBookConfirm=function(name,phone){pendingMemberName=name;pendingMemberPhone=phone;const s=schedules.find(x=>x.id===currentScheduleId);if(!s)return;$('memberBookText').innerHTML=`将为 <b>${name}</b>（${phone}）<br/>预约 <b>${s.courseName}</b><br/>${s.date} ${s.start}–${s.end}`;$('memberBookMask').style.display='block'};
window.hideMemberBookConfirm=function(){$('memberBookMask').style.display='none';pendingMemberName='';pendingMemberPhone=''};
window.confirmMemberBook=function(){schedules=L(K.schedules,[]);const name=pendingMemberName,phone=pendingMemberPhone;pendingMemberName='';pendingMemberPhone='';$('memberBookMask').style.display='none';const s=schedules.find(x=>x.id===currentScheduleId);if(!s)return;ensureScheduleMembers(s);if(s.status==='停止预约'){toast('该课次已停止预约');return}if(s.booked>=s.limit){toast('该课次已满');return}if(s.members.some(m=>m.name===name&&m.status!=='已取消')){toast('该会员已预约本课次');return}const isCurrentUser=isCurrentUserProfile(name,phone);const product=getFirstAvailableProduct(s.courseId);if(isCurrentUser&&(!product||Number(product.remain||0)<=0)){toast('小明课时不足');return}const booking={bookingId:makeBookingId(),name,phone,time:'教练端预约',status:'待上课',source:'coach',isCurrentUser,productId:product?product.id:'',createdAt:new Date().toISOString(),cancelRequestedAt:'',completeConfirmExpireAt:'',completedAt:''};s.members.push(booking);if(isCurrentUser&&product)product.remain=Math.max(0,Number(product.remain||0)-1);upsertUserBookingMirror(s,booking);syncScheduleBookedCount(s);S();saveUserData();toast('代约成功');openDetail(s.id)};

// ============ 数据同步 ============
function syncScheduleCourseData(){let changed=false;schedules.forEach(s=>{const course=courses.find(c=>String(s.courseId??'')===String(c.id)||(!s.courseId&&s.courseName&&s.courseName.includes(c.name)));if(!course)return;if(s.courseId!==course.id){s.courseId=course.id;changed=true}if(s.courseType!==course.type){s.courseType=course.type;changed=true}if(!s.store&&course.stores){s.store=course.stores;changed=true}});if(changed)S()}
function syncUserProducts(){syncScheduleCourseData();userProducts=L(K.userProducts,[]);userProducts=userProducts.filter(p=>{const course=courses.find(c=>String(c.id)===String(p.courseId));if(!course)return true;if(p.name!==normalizeUserCourseName(course))p.name=normalizeUserCourseName(course);if(p.type!==course.type)p.type=course.type;if(!p.store&&course.stores)p.store=course.stores;return true});S();saveUserData()}
function getUserProduct(productId){return userProducts.find(p=>String(p.id)===String(productId))}
function getFirstAvailableProduct(courseId){return userProducts.find(p=>String(p.courseId)===String(courseId)&&Number(p.remain||0)>0)}
function getUserSlot(scheduleId){return schedules.find(s=>String(s.id)===String(scheduleId))}
function getUserRemainingSeats(slot){return Math.max(0,Number(slot.limit||1)-Number(slot.booked||0))}
function isCurrentUserProfile(name,phone=''){return name==='小明'||phone==='188****0000'}
function hoursUntilBooking(booking){return (new Date(`${booking.date}T${booking.start}:00`).getTime()-Date.now())/36e5}
function makeBookingId(){return `booking-${Date.now()}-${Math.floor(Math.random()*1000)}`}
function upsertUserBookingMirror(schedule,member){if(!member.isCurrentUser)return;const booking={id:member.bookingId,productId:member.productId||`product-${schedule.courseId}`,courseId:schedule.courseId,courseName:normalizeUserCourseName({name:schedule.courseName.replace(/小班$/,''),type:schedule.courseType}),coachName:DEFAULT_COACH_NAME,store:schedule.store,scheduleId:schedule.id,date:schedule.date,start:schedule.start,end:schedule.end,type:schedule.courseType,status:member.status,source:member.source||'user',customerName:member.name,customerPhone:member.phone,createdAt:member.createdAt||new Date().toISOString(),cancelRequestedAt:member.cancelRequestedAt||'',completeConfirmExpireAt:member.completeConfirmExpireAt||'',completedAt:member.completedAt||'',isCurrentUser:true};const idx=userBookings.findIndex(item=>String(item.id)===String(member.bookingId));if(idx>-1)userBookings[idx]={...userBookings[idx],...booking};else userBookings.unshift(booking)}
function syncScheduleBookedCount(schedule){schedule.booked=(schedule.members||[]).filter(m=>m.status!=='已取消').length;if(schedule.status!=='停止预约'&&schedule.status!=='已取消')schedule.status=schedule.booked>=Number(schedule.limit||1)?'已满':'可预约'}
function ensureScheduleMembers(schedule){let changed=false;if(!Array.isArray(schedule.members)){schedule.members=[];changed=true}schedule.members=schedule.members.map((m,i)=>{if(m.bookingId&&m.status&&m.source)return m;changed=true;return{bookingId:m.bookingId||`${schedule.id}-member-${i+1}`,name:m.name||'学员',phone:m.phone||'',time:m.time||'教练端预约',status:m.status||(m.confirmStatus==='已预约'?'待上课':'待上课'),source:m.source||(isCurrentUserProfile(m.name,m.phone)?'user':'coach'),isCurrentUser:m.isCurrentUser??isCurrentUserProfile(m.name,m.phone),createdAt:m.createdAt||new Date().toISOString(),cancelRequestedAt:m.cancelRequestedAt||'',completeConfirmExpireAt:m.completeConfirmExpireAt||'',completedAt:m.completedAt||''}});schedule.members.forEach(m=>upsertUserBookingMirror(schedule,m));syncScheduleBookedCount(schedule);if(changed){S();saveUserData()}return schedule.members}
function settleBookingTimeouts(){let changed=false;schedules.forEach(s=>{ensureScheduleMembers(s);s.members=s.members.map(m=>{if(m.status==='待学员确认完课'&&m.completeConfirmExpireAt&&new Date(m.completeConfirmExpireAt).getTime()<=Date.now()){changed=true;const next={...m,status:'已完课',completedAt:m.completeConfirmExpireAt||new Date().toISOString()};upsertUserBookingMirror(s,next);return next}return m});if(changed)syncScheduleBookedCount(s)});if(changed){S();saveUserData()}}
function migrateLegacyUserBookings(){let changed=false;userBookings=userBookings.map(b=>{const next={...b};if(next.status==='已预约'){next.status='待上课';changed=true}if(next.source===undefined){next.source='user';changed=true}if(next.isCurrentUser===undefined){next.isCurrentUser=true;changed=true}return next});if(changed){S();saveUserData()}}
function updateBookingRecord(bid,changes){schedules=L(K.schedules,[]);let updated=null;schedules.forEach(s=>{ensureScheduleMembers(s);const idx=s.members.findIndex(m=>String(m.bookingId)===String(bid));if(idx>-1){s.members[idx]={...s.members[idx],...changes};updated=s.members[idx];upsertUserBookingMirror(s,s.members[idx]);syncScheduleBookedCount(s)}});const bIdx=userBookings.findIndex(item=>String(item.id)===String(bid));if(bIdx>-1)userBookings[bIdx]={...userBookings[bIdx],...changes};if(updated){S();saveUserData()}return updated}
function cancelBookingSeat(bid){schedules=L(K.schedules,[]);let restored=null;schedules.forEach(s=>{ensureScheduleMembers(s);const idx=s.members.findIndex(m=>String(m.bookingId)===String(bid));if(idx>-1){s.members[idx]={...s.members[idx],status:'已取消',completedAt:new Date().toISOString()};restored=s.members[idx];upsertUserBookingMirror(s,s.members[idx]);syncScheduleBookedCount(s)}});const b=userBookings.find(item=>String(item.id)===String(bid));if(b){const p=getUserProduct(b.productId);if(p)p.remain=Number(p.remain||0)+1;const idx=userBookings.findIndex(item=>String(item.id)===String(bid));if(idx>-1)userBookings[idx]={...userBookings[idx],status:'已取消',completedAt:new Date().toISOString()}}if(restored){S();saveUserData()}return restored}

// ============ 用户端页面 (嵌入教练端) ============
function hasCurrentUserBookedSlot(scheduleId){return userBookings.some(b=>String(b.scheduleId)===String(scheduleId)&&!['已取消'].includes(b.status))}
function getUserCourseSchedules(product){if(!product)return[];return schedules.filter(s=>String(s.courseId??'')===String(product.courseId)&&s.status!=='已取消').sort((a,b)=>`${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))}
function getUserAvailableDates(product){const todayStr=fmtISO(today);return [...new Set(getUserCourseSchedules(product).filter(s=>s.date>=todayStr).map(s=>s.date))].slice(0,7)}
function canUserBookSlot(slot,product){return!!slot&&!!product&&Number(product.remain||0)>0&&slot.status!=='停止预约'&&slot.status!=='已取消'&&getUserRemainingSeats(slot)>0}
function renderUserSlotButton(slot,product){const selected=String(selectedUserScheduleId)===String(slot.id),bookable=canUserBookSlot(slot,product),ownBooked=hasCurrentUserBookedSlot(slot.id),remainingSeats=getUserRemainingSeats(slot);let extra='';if(ownBooked)extra='<span class="user-slot-state">已约</span>';else if(slot.status==='停止预约')extra='<span class="user-slot-state">不可约</span>';else if(!bookable&&remainingSeats<=0)extra='<span class="user-slot-state">已约满</span>';else if(product.type==='一对多')extra=`<span class="user-slot-cap">余${remainingSeats}/${slot.limit}</span>`;return`<button class="user-slot${selected?' selected':''}${bookable?'':' disabled'}" ${bookable?`onclick="selectUserSlot(${slot.id})"`:'disabled'}>${slot.start}–${slot.end}${extra}</button>`}
function renderUserCourseList(){syncUserProducts();const box=$('userCourseList');if(!userProducts.length){box.innerHTML='<div class="user-empty"><div class="empty-title">暂无可预约课程</div><div>先在教练端创建并上架课程，再配置课次，用户端就会自动回填。</div></div>';return}box.innerHTML=userProducts.map(p=>`<div class="user-course-card"><div class="user-avatar" style="background-image:url(${coachProfile.avatar||'../shared/images/coach-photo.jpg'});background-size:cover;background-position:center"></div><div class="user-course-main"><div class="user-course-title">${p.name}</div><div class="user-course-sub">剩余${p.remain}课时</div></div><button class="user-action-btn" ${p.remain>0?`onclick="openUserBooking('${p.id}')"`:'disabled'}>${p.remain>0?'预约':'已用完'}</button></div>`).join('')}
window.openUserCourses=function(){syncUserProducts();saveUserState();showPage('userCoursePage')};
window.openUserBooking=function(productId){const keepSelection=String(currentUserProductId)===String(productId);currentUserProductId=productId;const p=getUserProduct(productId),dates=getUserAvailableDates(p);if(!dates.includes(selectedUserDate))selectedUserDate=dates[0]||'';if(!keepSelection)selectedUserScheduleId=null;saveUserState();showPage('userBookingPage')};
function renderUserBookingPage(){const p=getUserProduct(currentUserProductId),coachBox=$('userCoachCard'),dateBox=$('userDateStrip'),slotBox=$('userSlotGroups'),bookBtn=$('userBookBtn');if(!p){coachBox.innerHTML='';dateBox.innerHTML='';slotBox.innerHTML='<div class="user-empty">请选择课程后再预约</div>';bookBtn.disabled=true;bookBtn.innerText='请选择预约时段';return}const dates=getUserAvailableDates(p);coachBox.innerHTML=`<div class="user-brief-card"><div class="user-avatar" style="background-image:url(${coachProfile.avatar||'../shared/images/coach-photo.jpg'});background-size:cover;background-position:center"></div><div class="user-course-main"><div class="user-course-title">${p.coachName}</div><div class="user-store">${p.store}</div></div></div>`;if(!dates.length){selectedUserDate='';selectedUserScheduleId=null;dateBox.innerHTML='';slotBox.innerHTML='<div class="user-empty">当前课程暂无可预约时段</div>';bookBtn.disabled=true;bookBtn.innerText=Number(p.remain||0)>0?'暂无可预约时段':'剩余课时不足';saveUserState();return}if(!dates.includes(selectedUserDate))selectedUserDate=dates[0];dateBox.innerHTML=dates.map(ds=>`<div class="user-date-item${ds===selectedUserDate?' active':''}" onclick="selectUserDate('${ds}')"><div class="user-date-week">周${dayName(ds)}</div><div class="user-date-day">${fmtISO(today)===ds?'今':new Date(ds+'T00:00:00').getDate()}</div></div>`).join('');const daySlots=getUserCourseSchedules(p).filter(s=>s.date===selectedUserDate);const sections=['上午','下午','晚上'].map(period=>{const items=daySlots.filter(s=>userSlotPeriod(s.start)===period);if(!items.length)return'';return`<div class="user-slot-section"><div class="user-slot-label">${period}</div><div class="user-slot-grid">${items.map(s=>renderUserSlotButton(s,p)).join('')}</div></div>`}).join('');slotBox.innerHTML=sections||'<div class="user-empty">当日暂无可预约时段</div>';const sel=getUserSlot(selectedUserScheduleId);if(!canUserBookSlot(sel,p))selectedUserScheduleId=null;const fs=getUserSlot(selectedUserScheduleId);bookBtn.disabled=!fs;bookBtn.innerText=fs?`预约${fmtUserDateTime(fs.date,fs.start,fs.end)}`:Number(p.remain||0)>0?'请选择预约时段':'剩余课时不足';saveUserState()}
window.selectUserDate=function(ds){selectedUserDate=ds;selectedUserScheduleId=null;saveUserState();renderUserBookingPage()};
window.selectUserSlot=function(sid){selectedUserScheduleId=sid;saveUserState();renderUserBookingPage()};
window.openUserBookingConfirm=function(){const p=getUserProduct(currentUserProductId),slot=getUserSlot(selectedUserScheduleId);if(!canUserBookSlot(slot,p)){toast(Number(p?.remain||0)>0?'请选择可预约时段':'剩余课时不足');return}$('userConfirmText').innerHTML=`将预约${fmtUserDateTime(slot.date,slot.start,slot.end)}的训练，成功预约将使用1节${p.type==='一对多'?'小班':'私教'}课时`;$('userConfirmMask').style.display='block'};
window.hideUserConfirm=function(){$('userConfirmMask').style.display='none'};
window.confirmUserBooking=function(){schedules=L(K.schedules,[]);const p=getUserProduct(currentUserProductId),slot=getUserSlot(selectedUserScheduleId);if(!canUserBookSlot(slot,p)){hideUserConfirm();renderUserBookingPage();toast('当前时段已不可预约');return}ensureScheduleMembers(slot);if(userBookings.some(b=>String(b.scheduleId)===String(slot.id)&&b.status!=='已取消')){hideUserConfirm();toast('这个时段已经预约过了');return}p.remain=Math.max(0,Number(p.remain||0)-1);const booking={bookingId:makeBookingId(),name:'小明',phone:'188****0000',time:'用户端预约',status:'待上课',source:'user',isCurrentUser:true,productId:p.id,createdAt:new Date().toISOString(),cancelRequestedAt:'',completeConfirmExpireAt:'',completedAt:''};slot.members.push(booking);upsertUserBookingMirror(slot,booking);syncScheduleBookedCount(slot);currentUserBookingId=booking.bookingId;S();saveUserData();hideUserConfirm();showPage('userSuccessPage')};
function userBookingNote(b){if(b.status==='待上课'&&hoursUntilBooking(b)<3)return'距开课不足 3 小时，需联系教练协商取消。';if(b.status==='待教练处理取消')return'取消申请已提交，等待教练处理。';if(b.status==='待学员确认完课')return'请在 24 小时内确认完课，超时系统会自动完课。';if(b.status==='未到场')return'教练未同意取消，本次课程按未到场处理并正常核销。';if(b.status==='已完课')return'';return''}
function userBookingActions(b){if(b.status==='待上课')return`<button class="mini-btn${hoursUntilBooking(b)>=3?'':' secondary'}" onclick="handleUserCancel('${b.id}')">${hoursUntilBooking(b)>=3?'取消预约':'联系教练取消'}</button>`;if(b.status==='待学员确认完课')return`<button class="mini-btn" onclick="confirmUserFinish('${b.id}')">确认完课</button>`;return''}
window.handleUserCancel=function(bid){settleBookingTimeouts();const b=userBookings.find(item=>String(item.id)===String(bid));if(!b)return;if(hoursUntilBooking(b)>=3){cancelBookingSeat(bid);toast('已取消预约')}else{updateBookingRecord(bid,{status:'待教练处理取消',cancelRequestedAt:new Date().toISOString()});toast('已提交取消申请，请联系教练处理')}renderUserBookings();if(currentScheduleId)openDetail(currentScheduleId)};
window.confirmUserFinish=function(bid){updateBookingRecord(bid,{status:'已完课',completedAt:new Date().toISOString()});toast('已确认完课');renderUserBookings();if(currentScheduleId)openDetail(currentScheduleId)};
function renderUserSuccessPage(){const b=userBookings.find(item=>String(item.id)===String(currentUserBookingId));$('userSuccessSummary').innerHTML=b?`<div>教练：${b.coachName}</div><div>门店：${b.store}</div><div>时段：${fmtUserDateTime(b.date,b.start,b.end)}</div>`:'<div>暂无预约信息</div>'}
window.openUserBookings=function(){showPage('userBookingsPage')};
function renderUserBookings(){userBookings=L(K.userBookings,[]);settleBookingTimeouts();const list=userBookings;const box=$('userBookingsList');if(!list.length){box.innerHTML='<div class="user-empty"><div class="empty-title">暂无预约记录</div><div>完成预约后，会在这里展示你的课程安排。</div></div>';return}box.innerHTML=list.map(b=>{const wayText=b.source==='user'?'学员预约':'教练代约';const timeText=b.createdAt?new Date(b.createdAt).toLocaleString('zh-CN',{hour12:false}):'--';const doneText=b.status==='已完课'&&b.completedAt?new Date(b.completedAt).toLocaleString('zh-CN',{hour12:false}):'';return`<div class="user-booking-card"><div class="user-booking-head"><div><div class="user-booking-name">${b.courseName}</div><div class="user-store">${b.coachName} · ${b.store}</div></div><div class="user-status">${b.status}</div></div><div class="user-booking-time">${fmtUserDateTime(b.date,b.start,b.end)}</div><div class="user-booking-meta"><span>预约方式：${wayText}</span><span>预约时间：${timeText}</span>${doneText?`<span>完课时间：${doneText}</span>`:''}</div>${userBookingActions(b)?`<div class="user-booking-actions">${userBookingActions(b)}</div>`:''}${userBookingNote(b)?`<div class="user-booking-note">${userBookingNote(b)}</div>`:''}</div>`}).join('')}

// ============ 教练首页 Dashboard ============
function getCoachTodaySchedules(){const todayKey=fmtISO(today);return schedules.filter(s=>s.date===todayKey&&s.status!=='已取消'&&getScheduleActiveMembers(s).length>0).sort((a,b)=>timeToMin(a.start)-timeToMin(b.start))}
function getCoachMonthSchedules(){const monthKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;return schedules.filter(s=>String(s.date||'').startsWith(monthKey)&&s.status!=='已取消'&&getScheduleActiveMembers(s).length>0)}
function getCoachEarliestTime(list){return list.length?list[0].start:'--:--'}
function getScheduleActiveMembers(schedule){return ensureScheduleMembers(schedule).filter(m=>m.status!=='已取消')}
function coachStatusView(schedule){const members=getScheduleActiveMembers(schedule);if(members.some(m=>m.status==='上课中'))return{text:'上课中',tone:'active'};if(members.some(m=>m.status==='待学员确认完课'))return{text:'待确认',tone:'review'};if(members.every(m=>['已完课','未到场'].includes(m.status)))return{text:'已完成',tone:'done'};if(members.some(m=>m.status==='待上课'))return{text:'待上课',tone:'pending'};return{text:'已预约',tone:'pending'}}
function coachCourseMetaText(schedule){const members=getScheduleActiveMembers(schedule);const names=members.map(m=>m.name).filter(Boolean);const memberText=schedule.courseType==='一对多'?`${names.slice(0,2).join('、')}${names.length>2?`等${names.length}人`:names.length?'':'多人课程'}`:(names[0]||'待分配学员');return `${memberText} · ${schedule.store||'未设置门店'}`}
function getCoachStoreName(){const s=schedules.find(item=>item.store&&item.status!=='已取消');return s?s.store:(courses.find(item=>item.stores)||{}).stores||'黄毛健身房'}
function getCoachGreetingText(){const hour=new Date().getHours();if(hour<12)return'上午好';if(hour<18)return'下午好';return'晚上好'}
function coachIcon(name){
  const c='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  const icons={
    coach:`<svg ${c}><circle cx="12" cy="8" r="3.4"/><path d="M6.5 19c1.2-3.1 3.4-4.7 5.5-4.7 2.1 0 4.3 1.6 5.5 4.7"/></svg>`,
    pin:`<svg ${c}><path d="M12 20s-5.5-4.8-5.5-9.3A5.5 5.5 0 0 1 17.5 10.7C17.5 15.2 12 20 12 20Z"/><circle cx="12" cy="10.2" r="1.7"/></svg>`,
    calendarCheck:`<svg ${c}><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"/><path d="m8.5 14 2 2 5-5"/></svg>`,
    chart:`<svg ${c}><path d="M4.5 18.5h15"/><path d="M6.5 15.5 10 12l3 2.5 4.5-6"/><path d="M16 8.5h2.5V11"/></svg>`,
    users:`<svg ${c}><circle cx="9" cy="9" r="3"/><path d="M3.8 18c.8-2.7 2.8-4.2 5.2-4.2 2.4 0 4.4 1.5 5.2 4.2"/><path d="M16.5 8.2a2.3 2.3 0 1 1 0 4.6"/><path d="M18.8 18c-.3-1.4-1.1-2.6-2.3-3.4"/></svg>`,
    contract:`<svg ${c}><path d="M8 3.5h6l4 4v13h-10a3.5 3.5 0 0 1-3.5-3.5V7A3.5 3.5 0 0 1 8 3.5Z"/><path d="M14 3.5V8h4"/><path d="m8.5 15.5 2.2-2.2 2 2 2.8-2.8"/></svg>`,
    clock:`<svg ${c}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></svg>`,
    course:`<svg ${c}><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></svg>`,
    booking:`<svg ${c}><rect x="4" y="4.5" width="16" height="15" rx="3"/><path d="M8 3v3M16 3v3M4 9h16"/><path d="M9 13h6M9 16h4"/></svg>`,
    schedule:`<svg ${c}><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3.5v3M16 3.5v3M4 9.5h16"/><path d="M8 13h3M13 13h3M8 16.5h3"/></svg>`,
    student:`<svg ${c}><circle cx="12" cy="8.5" r="3.2"/><path d="M5.5 19c1-3.1 3.5-4.8 6.5-4.8s5.5 1.7 6.5 4.8"/></svg>`,
    order:`<svg ${c}><path d="M7 3.5h10v17l-3-1.8-2 1.8-2-1.8-3 1.8Z"/><path d="M9 8.5h6M9 12h6M9 15.5h4"/></svg>`,
    home:`<svg ${c}><path d="M4.5 10.5 12 4l7.5 6.5"/><path d="M6.5 9.5v10h11v-10"/></svg>`,
    mine:`<svg ${c}><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c1-3.1 3.5-4.8 6.5-4.8s5.5 1.7 6.5 4.8"/></svg>`
  };
  return icons[name]||icons.course;
}
function coachQuickFeatures(){
  return[
    {key:'contract',label:'门店签约',icon:'contract'},{key:'work',label:'工作时间',icon:'clock'},
    {key:'course',label:'课程管理',icon:'course'},{key:'booking',label:'预约管理',icon:'booking'},
    {key:'calendar',label:'排课日历',icon:'schedule'},{key:'student',label:'学员管理',icon:'student'},
    {key:'order',label:'私教订单',icon:'order'}
  ];
}

function coachHomeTemplate(){
  return `<div class="coach-dashboard">
    <div id="coachStatGrid" class="coach-stat-grid"></div>
    <div class="coach-panel">
      <div class="coach-quick-grid">${coachQuickFeatures().map(item=>`<div class="coach-quick-item" onclick="openCoachFeature('${item.key}')"><div class="coach-quick-icon">${coachIcon(item.icon)}</div><div class="coach-quick-label">${item.label}</div></div>`).join('')}</div>
    </div>
    <div class="coach-panel">
      <div class="coach-panel-head"><div class="coach-panel-title">今日课程</div><div class="coach-panel-link" onclick="showPage('calendarPage')">查看全部</div></div>
      <div id="coachTodayCourseList"></div>
    </div>
  </div>
`;}
function renderCoachHomeLayout(){const page=$('homePage');if(page&&page.dataset.layoutReady!=='coach-v5'){page.innerHTML=coachHomeTemplate();page.dataset.layoutReady='coach-v5'}}

function getCoachHomeStats(){
  const todayKey=fmtISO(today);
  const todayAll=schedules.filter(s=>s.date===todayKey&&s.status!=='已取消');
  let todayBooked=0,todayPendingBooked=0;
  todayAll.forEach(s=>{const active=getScheduleActiveMembers(s);todayBooked+=active.length;todayPendingBooked+=active.filter(m=>m.status==='待上课').length});
  const completedSchedules=schedules.filter(s=>s.date===todayKey&&s.status!=='已取消'&&getScheduleActiveMembers(s).every(m=>['已完课','未到场'].includes(m.status))&&getScheduleActiveMembers(s).length>0);
  const revenue=completedSchedules.reduce((sum,s)=>{const c=courses.find(x=>x.id===s.courseId);return sum+(c?Number(c.price||0):0)},0);
  return[
    {icon:'calendarCheck',label:'今日排课',value:todayAll.length,unit:'节',noteHtml:todayAll.length?`${todayAll.length}个课次`:'暂无'},
    {icon:'chart',label:'今日约课',value:todayBooked,unit:'节',noteHtml:todayPendingBooked?`${todayPendingBooked}节待上课`:'暂无待上课'},
    {icon:'users',label:'今日收入',value:'￥'+revenue,unit:'',noteHtml:revenue>0?`${completedSchedules.length}笔完成`:'暂无'}
  ];
}
function renderCoachStatCards(){const box=$('coachStatGrid');if(!box)return;box.innerHTML=getCoachHomeStats().map(item=>`<div class="coach-stat-box"><div class="coach-stat-title"><div class="coach-stat-icon">${coachIcon(item.icon)}</div><div class="coach-stat-name">${item.label}</div></div><div class="coach-stat-number">${item.value}<small>${item.unit}</small></div><div class="coach-stat-note">${item.noteHtml}</div></div>`).join('')}
function coachTodayDisplayName(m){const n=m.name||'';if(n==='用户本人'||n==='当前用户')return'小明';return n}
function coachTodayMemberStatusChip(m){if(m.status==='待上课')return'<span class="ctc-status pending">待上课</span>';if(m.status==='上课中')return'<span class="ctc-status active">上课中</span>';if(m.status==='待学员确认完课')return'<span class="ctc-status review">待学员确认</span>';if(m.status==='待教练处理取消')return'<span class="ctc-status review">待处理取消</span>';if(m.status==='已完课')return'<span class="ctc-status done">已完成</span>';if(m.status==='未到场')return'<span class="ctc-status done">未到场</span>';return'<span class="ctc-status done">'+m.status+'</span>'}
function coachTodayActions(m,sid){const a=[];if(m.status==='待上课')a.push(`<button class="ctc-btn primary" onclick="event.stopPropagation();confirmClassStart('${m.bookingId}',${sid})">确认上课</button>`);if(m.status==='待教练处理取消')a.push(`<button class="ctc-btn primary" onclick="event.stopPropagation();approveCancelByCoach('${m.bookingId}',${sid})">同意取消</button>`,`<button class="ctc-btn secondary" onclick="event.stopPropagation();markNoShow('${m.bookingId}',${sid})">未到场</button>`);if(m.status==='上课中'&&m.source==='user')a.push(`<button class="ctc-btn primary" onclick="event.stopPropagation();finishBookingByCoach('${m.bookingId}',${sid})">确认下课</button>`);if(m.status==='上课中'&&m.source==='coach')a.push(`<button class="ctc-btn primary" onclick="event.stopPropagation();requestFinishConfirm('${m.bookingId}',${sid})">发起确认</button>`);return a}
function coachTodayNote(m){if(m.status==='待学员确认完课')return'待学员确认完课，超时自动完成';if(m.status==='待教练处理取消')return'';return''}
function renderCoachTodayCourseList(){const box=$('coachTodayCourseList');if(!box)return;const items=getCoachTodaySchedules();if(!items.length){box.innerHTML='<div class="coach-empty-state">今天还没有已预约的课程，新的预约会自动回填到这里。</div>';return}box.innerHTML=`<div class="ctc-list">${items.map(s=>{const members=getScheduleActiveMembers(s);return members.map(m=>{const btns=coachTodayActions(m,s.id);const note=coachTodayNote(m);const hasBtns=btns.length>0;return`<div class="ctc-card" onclick="openCoachScheduleDetail(${s.id})"><div class="ctc-top"><div class="ctc-course">${s.courseName}</div>${coachTodayMemberStatusChip(m)}</div><div class="ctc-time">${s.start} - ${s.end}</div><div class="ctc-meta-row"><div class="ctc-meta"><span class="ctc-meta-name">${coachTodayDisplayName(m)}</span><span>·</span><span>${s.store||'未设置门店'}</span></div>${hasBtns?`<div class="ctc-actions">${btns.join('')}</div>`:''}</div>${note?`<div class="ctc-note">${note}</div>`:''}</div>`}).join('')}).join('')}</div>`}
function renderCoachHome(){renderCoachHomeLayout();renderCoachStatCards();renderCoachTodayCourseList()}

// ============ 底部导航 ============
let coachTabEntrySource={listPage:'tab',calendarPage:'tab'};
function setCoachTabBackState(pageId){
  const lb=document.querySelector('#listPage .nav-back'),cb=document.querySelector('#calendarPage .nav-back');
  if(lb)lb.style.display=coachTabEntrySource.listPage==='shortcut'?'flex':'none';
  if(cb)cb.style.display=coachTabEntrySource.calendarPage==='shortcut'?'flex':'none';
}
function renderCoachBottomNav(currentPage){
  const host=$('coachTabBar');if(!host)return;
  const visible=['homePage','listPage','calendarPage','minePage','memberContractPage','coachInfoPage'];
  if(!visible.includes(currentPage)){host.className='';host.style.display='none';host.innerHTML='';return}
  const tab=currentPage==='listPage'?'course':currentPage==='calendarPage'?'schedule':(currentPage==='minePage'||currentPage==='memberContractPage'||currentPage==='coachInfoPage')?'mine':'home';
  host.className='coach-bottom-nav';host.style.display='grid';
  host.innerHTML=`<div class="coach-bottom-item ${tab==='home'?'active':''}" onclick="showCoachTabPage('homePage')"><div class="coach-bottom-icon">${coachIcon('home')}</div><div>首页</div></div><div class="coach-bottom-item ${tab==='course'?'active':''}" onclick="showCoachTabPage('listPage')"><div class="coach-bottom-icon">${coachIcon('course')}</div><div>课程</div></div><div class="coach-bottom-item ${tab==='schedule'?'active':''}" onclick="showCoachTabPage('calendarPage')"><div class="coach-bottom-icon">${coachIcon('schedule')}</div><div>排班</div></div><div class="coach-bottom-item ${tab==='mine'?'active':''}" onclick="openCoachFeature('mine')"><div class="coach-bottom-icon">${coachIcon('mine')}</div><div>我的</div></div>`;
}
window.showCoachTabPage=function(id){if(id==='listPage'||id==='calendarPage')coachTabEntrySource[id]='tab';showCoachPage(id)};

// ============ 页面导航 (最终版本) ============
function showCoachPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $(id).classList.add('active');saveActivePage(id);
  renderCoachBottomNav(id);setCoachTabBackState(id);
  if(id==='homePage')renderCoachHome();
  if(id==='listPage')renderList();
  if(id==='workPage')renderWorkList();
  if(id==='calendarPage')renderCalendar();
  if(id==='userCoursePage')renderUserCourseList();
  if(id==='userBookingPage')renderUserBookingPage();
  if(id==='userSuccessPage')renderUserSuccessPage();
  if(id==='userBookingsPage')renderUserBookings();
  if(id==='minePage')renderMinePage();
  if(id==='memberContractPage')renderMemberContractPage();
  if(id==='coachInfoPage'){coachInfoEditing=false;renderCoachInfoPage()}
}
window.showPage=showCoachPage;

window.openCoachFeature=function(feature){
  if(feature==='work'){showCoachPage('workPage');return}
  if(feature==='course'){coachTabEntrySource.listPage='shortcut';showCoachPage('listPage');return}
  if(feature==='calendar'){coachTabEntrySource.calendarPage='shortcut';showCoachPage('calendarPage');return}
  if(feature==='mine'){showCoachPage('minePage');return}
  toast('该功能正在建设中')
};
window.openCoachScheduleDetail=function(sid){currentScheduleId=sid;openDetail(sid)};

// ============ 我的页面 ============
function getMineStats(){
  const monthKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const monthSchedules=schedules.filter(s=>String(s.date||'').startsWith(monthKey)&&s.status!=='已取消');
  const studentCount=getCoachStudentCount();
  const revenue=monthSchedules.reduce((sum,s)=>{
    const c=courses.find(x=>x.id===s.courseId);
    return sum+(c?Number(c.price||0):0)*Math.max(1,(ensureScheduleMembers(s).filter(m=>m.status!=='已取消').length));
  },0);
  return[
    {value:monthSchedules.length,label:'本月排课',unit:'节'},
    {value:studentCount,label:'学员总数',unit:'人'},
    {value:'￥'+revenue,label:'本月收入',unit:''}
  ];
}
function renderMinePage(){
  const grid=$('mineStatGrid');if(!grid)return;
  coachProfile=L(K.coachProfile,DEFAULT_COACH_PROFILE);storeInfo=L(K.storeInfo,DEFAULT_STORE_INFO);
  const p=coachProfile;const s=storeInfo;
  const nameEl=document.querySelector('#minePage .mine-header-name');
  const storeEl=document.querySelector('#minePage .mine-header-store');
  const av=$('mineAvatar');
  if(nameEl)nameEl.innerText=p.name||DEFAULT_COACH_NAME;
  if(storeEl)storeEl.innerText=s.name||'振华商厦店';
  if(av)av.style.backgroundImage=`url(${p.avatar||'../shared/images/coach-photo.jpg'})`;
  grid.innerHTML=getMineStats().map(s=>`<div class="mine-stat-box"><div class="mine-stat-value">${s.value}<small style="font-size:13px;color:var(--text-3);font-weight:500;margin-left:4px">${s.unit}</small></div><div class="mine-stat-label">${s.label}</div></div>`).join('');
}
function renderMemberContractPage(){
  const box=$('memberContractList');if(!box)return;
  const products=userProducts.filter(p=>{
    const c=courses.find(x=>String(x.id)===String(p.courseId));
    return c&&c.status==='已上架';
  });
  if(!products.length){
    box.innerHTML='<div class="empty" style="padding-top:60px"><div class="empty-title">暂无会员合同</div><div>会员购买课程后将自动生成电子合同</div></div>';
    return;
  }
  box.innerHTML=products.map((p,i)=>{
    const course=courses.find(c=>String(c.id)===String(p.courseId));
    const contractNo=`HT${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(i+1).padStart(4,'0')}`;
    const signDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(Math.min(28,today.getDate()-i*3)).padStart(2,'0')}`;
    return `<div class="mine-contract-card"><div class="mine-contract-name">${p.name}</div><div class="mine-contract-meta">合同编号：${contractNo}<br/>签署日期：${signDate}<br/>剩余课时：${p.remain}节 · 门店：${p.store||'未指定'}</div><div class="mine-contract-status">已签署</div></div>`;
  }).join('');
}
let ciUploadTarget='';
function ciRow(label,key,type,placeholder,options){
  const p=coachProfile||DEFAULT_COACH_PROFILE;
  let val=(p[key]!==undefined?p[key]:'');
  if(key==='tags')val=Array.isArray(p.tags)?p.tags.join('，'):(p.tags||'');
  if(!coachInfoEditing)return`<div class="ci-row"><span class="ci-label">${label}</span><span class="ci-value">${key==='tags'?ciTagsHtml(p):(val||'--')}</span></div>`;
  if(type==='select')return`<div class="ci-row"><span class="ci-label">${label}</span><select class="ci-input" id="ci_${key}">${options.map(o=>`<option value="${o}" ${val===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
  if(type==='textarea')return`<div class="ci-row ci-textarea-row"><span class="ci-label">${label}</span><textarea class="ci-input" id="ci_${key}" placeholder="${placeholder||''}">${val}</textarea></div>`;
  return`<div class="ci-row"><span class="ci-label">${label}</span><input class="ci-input" id="ci_${key}" value="${val.replace(/"/g,'&quot;')}" placeholder="${placeholder||''}" /></div>`;
}
function ciTagsHtml(p){return`<div class="ci-tags">${(p.tags||[]).map((t,i)=>`<span class="ci-tag">${t}${coachInfoEditing?`<span class="ci-tag-remove" onclick="removeCoachTag(${i})">×</span>`:''}</span>`).join('')}${coachInfoEditing?`<span class="ci-tag-add" onclick="addCoachTag()">+添加</span>`:''}</div>`}
function renderCoachInfoPage(){
  const coachRows=$('ciCoachRows'),bar=$('ciSaveBar'),btn=$('ciEditBtn'),av=$('ciAvatar'),strip=$('ciPhotoStrip');
  if(btn)btn.innerText=coachInfoEditing?'取消':'编辑';
  if(bar)bar.style.display=coachInfoEditing?'block':'none';
  if(!coachRows)return;
  const p=coachProfile||DEFAULT_COACH_PROFILE;
  if(av){
    if(p.avatar){av.style.backgroundImage=`url(${p.avatar})`}
    else{av.style.backgroundImage='url(../shared/images/coach-photo.jpg)'}
    av.style.cursor=coachInfoEditing?'pointer':'';
    av.onclick=coachInfoEditing?function(){ciUploadTarget='avatar';$('ciFileInput').click()}:null;
  }
  if(strip){
    const photos=p.photos||[];
    strip.innerHTML=photos.map((url,i)=>`<div class="ci-photo-thumb" style="background-image:url(${url})" ${coachInfoEditing?`onclick="removeCoachPhoto(${i})" title="点击删除"`:''}></div>`).join('')+(coachInfoEditing?`<div class="ci-photo-add" onclick="addCoachPhoto()">+</div>`:'');
    strip.style.display=photos.length||coachInfoEditing?'flex':'none';
  }
  coachRows.innerHTML=[
    ciRow('姓名','name'),ciRow('性别','gender','select','',['男','女']),
    ciRow('手机号','phone'),ciRow('出生日期','birthDate','','YYYY-MM-DD'),
    ciRow('身份证号','idCard'),ciRow('个人标签','tags'),
    ciRow('个人简介','bio','textarea','介绍你的教学理念、擅长领域等')
  ].join('');
}
window.toggleCoachInfoEdit=function(){coachInfoEditing=!coachInfoEditing;renderCoachInfoPage()};
window.saveCoachInfo=function(){
  const p=coachProfile||DEFAULT_COACH_PROFILE;
  ['name','gender','phone','birthDate','idCard','bio'].forEach(k=>{const el=document.getElementById('ci_'+k);if(el)p[k]=el.value.trim()});
  const tagsEl=document.getElementById('ci_tags');if(tagsEl)p.tags=tagsEl.value.split(/[,，]/).map(t=>t.trim()).filter(Boolean);
  coachProfile=p;coachInfoEditing=false;S();renderCoachInfoPage();toast('已保存')
};
window.addCoachTag=function(){const el=document.getElementById('ci_tags');if(el){const v=el.value.trim();el.value=v+(v?', ':'')+'新标签';el.focus()}};
window.removeCoachTag=function(i){coachProfile.tags.splice(i,1);renderCoachInfoPage()};
window.addCoachPhoto=function(){ciUploadTarget='photos';$('ciFileInput').click()};
window.handleCoachPhotoUpload=function(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    const img=new Image();
    img.onload=function(){
      const MAX=800;
      let w=img.width,h=img.height;
      if(w>MAX||h>MAX){const ratio=Math.min(MAX/w,MAX/h);w=Math.round(w*ratio);h=Math.round(h*ratio)}
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
      const compressed=canvas.toDataURL('image/jpeg',0.75);
      if(ciUploadTarget==='avatar'){coachProfile.avatar=compressed}
      else{if(!coachProfile.photos)coachProfile.photos=[];coachProfile.photos.push(compressed)}
      S();renderCoachInfoPage();
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value='';
};
window.removeCoachPhoto=function(i){coachProfile.photos.splice(i,1);S();renderCoachInfoPage()};

// ============ FAB拖拽 ============
function initFabDrag(){}

// ============ Debug ============
window.debugState=function(){console.log('=== COACH DEBUG ===');console.log('courses:',courses.length,JSON.parse(JSON.stringify(courses)));console.log('schedules:',schedules.length);console.log('workTimes:',Object.keys(workTimes).filter(d=>workTimes[d].length));console.log('userProducts:',userProducts.length);console.log('userBookings:',userBookings.length);console.log('========================')};
window.resetAll=function(){Object.keys(localStorage).filter(k=>k.includes('coachSplit')).forEach(k=>d(k));d(K.courseDraft);d(K.scheduleDraft);d(K.workDraft);d(K.userState);d(K.activePage);console.log('All data cleared. Reloading...');location.reload()};

// ============ Boot ============
function boot(){
  restoreUserState();migrateLegacyUserBookings();settleBookingTimeouts();
  $('type').addEventListener('change',updateFormRows);$('unit').addEventListener('change',updateFormRows);
  $('keyword').addEventListener('input',renderList);$('statusFilter').addEventListener('change',renderList);
  $('schCourse').addEventListener('change',fillScheduleCourseInfo);
  $('timeLines').addEventListener('input',saveWorkDraft);$('timeLines').addEventListener('change',saveWorkDraft);
  bindDraftEvents(COURSE_FIELDS,saveCourseDraft);bindDraftEvents(SCHEDULE_FIELDS,saveScheduleDraft);
  syncUserProducts();S();initFabDrag();
  renderList();renderWorkList();renderCalendar();
  saveActivePage('homePage');showPage('homePage');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
