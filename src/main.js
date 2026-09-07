import './style.css';
import {createGame,TOOLS,MISSIONS,selectTool,InputQueue,step,undo,resetDamage,startChallenge,startRound,nextRound,freeplay,pause,running,coverage,endGesture} from './engine.js';
import {drawWallpaper,drawPostcard,drawIcon,drawTool,renderDamage,renderEffects} from './render.js';
const $=id=>document.getElementById(id),desktop=$('desktop'),viewport=$('viewport');
let g=createGame(),queue=new InputQueue(),keys=new Set(),scale=1,drag=null,z=3,sound=false,audio=null,last=0,acc=0,raf=0,lastUi=0,previousMode='',helpReturn=null;
const cache={marks:null,count:0},damage=$('damage').getContext('2d'),effects=$('effects').getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const names={files:'내 둥지',notes:'퇴근 메모.txt',gallery:'휴가.jpg',terminal:'부리 프롬프트',recycle:'휴지통'},states={};
for(const el of document.querySelectorAll('[data-window]'))states[el.dataset.window]={open:!el.classList.contains('hidden'),minimized:false,initial:{left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height}};
function redrawArt(){drawWallpaper($('wallpaper').getContext('2d'));drawPostcard($('postcard').getContext('2d'));for(const c of document.querySelectorAll('[data-icon]'))drawIcon(c.getContext('2d'),c.dataset.icon,c.width,c.height);}
for(let i=1;i<TOOLS.length;i++){const t=TOOLS[i],b=document.createElement('button');b.className='tool';b.dataset.tool=t.id;b.setAttribute('aria-pressed',String(g.tool===t.id));b.setAttribute('aria-label',`${i} ${t.name}: ${t.hint}`);const c=document.createElement('canvas');c.width=116;c.height=74;drawTool(c.getContext('2d'),t.id,58,30,t.id==='hammer'?.9:.8);b.append(c,document.createTextNode(`${i} ${t.name}`));b.onclick=()=>choose(t.id);$('tool-grid').append(b);}
function choose(id){queue.switchTool(g,id);keys.delete('Space');update();desktop.focus({preventScroll:true});}
function performUndo(){queue.undoLast(g);clearInput();update();}
function soundCue(type){if(!sound)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const frequencies={hammer:65,saw:85,gun:140,fire:75,stamp:220,bugs:700,undo:490,win:880},f=frequencies[type];if(!f)return;const o=audio.createOscillator(),v=audio.createGain();o.type=['saw','gun','fire'].includes(type)?'sawtooth':'triangle';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.5,audio.currentTime+.09);v.gain.setValueAtTime(.025,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{sound=false;}}
function clearInput(){queue.clear();keys.clear();endGesture(g);drag=null;}
function taskButtons(){$('tasks').replaceChildren();for(const [id,s] of Object.entries(states))if(s.open){const b=document.createElement('button');b.textContent=names[id];b.setAttribute('aria-label',`${names[id]} ${s.minimized?'복원':'최소화'}`);b.setAttribute('aria-pressed',String(!s.minimized));b.onclick=()=>{s.minimized=!s.minimized;windowVisibility(id);};$('tasks').append(b);}}
function windowVisibility(id){const s=states[id],el=$('window-'+id);el.classList.toggle('hidden',!s.open||s.minimized);if(s.open&&!s.minimized){el.style.zIndex=++z;if(z>35){z=10;document.querySelectorAll('[data-window]').forEach(w=>w.style.zIndex='2');el.style.zIndex=z;}}taskButtons();}
function openWindow(id){if(!states[id])return;states[id].open=true;states[id].minimized=false;windowVisibility(id);$('start-menu').classList.add('hidden');if(id==='terminal'){choose('pointer');$('terminal-input').focus();}}
for(const b of document.querySelectorAll('[data-open]'))b.onclick=()=>openWindow(b.dataset.open);
for(const b of document.querySelectorAll('[data-minimize]'))b.onclick=()=>{states[b.dataset.minimize].minimized=true;windowVisibility(b.dataset.minimize);};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>{states[b.dataset.close].open=false;windowVisibility(b.dataset.close);};
for(const b of document.querySelectorAll('[data-maximize]'))b.onclick=()=>{const id=b.dataset.maximize,el=$('window-'+id),s=states[id];if(!s.maximized){s.before={left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height};Object.assign(el.style,{left:'110px',top:'3px',width:'984px',height:'604px'});}else Object.assign(el.style,s.before);s.maximized=!s.maximized;};
function restoreWindows(){for(const [id,s] of Object.entries(states)){Object.assign($('window-'+id).style,s.initial);s.maximized=false;}states.files.open=states.notes.open=states.gallery.open=true;states.files.minimized=states.notes.minimized=states.gallery.minimized=false;for(const id of Object.keys(states))windowVisibility(id);$('start-menu').classList.add('hidden');}
function point(e){const r=viewport.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale};}
for(const title of document.querySelectorAll('.os-window>.window-title'))title.addEventListener('pointerdown',e=>{if(e.target.closest('button')||!running(g))return;e.preventDefault();e.stopPropagation();const el=title.parentElement,p=point(e);drag={el,dx:p.x-parseFloat(el.style.left),dy:p.y-parseFloat(el.style.top),pointer:e.pointerId};if(el.dataset.window){el.style.zIndex=Math.min(35,++z);}title.setPointerCapture(e.pointerId);clearQueuedOnly();});
function clearQueuedOnly(){queue.clear();endGesture(g);}
desktop.addEventListener('pointerdown',e=>{
 if(e.button!==0||!running(g)||e.target.closest('.safe,.window-title'))return;
 if(g.tool==='pointer')return;
 e.preventDefault();e.stopPropagation();const p=point(e);queue.push('down',p.x,p.y);desktop.setPointerCapture(e.pointerId);desktop.focus({preventScroll:true});
},true);
desktop.addEventListener('click',e=>{if(g.tool!=='pointer'&&!e.target.closest('.safe,.window-title')){e.preventDefault();e.stopPropagation();}},true);
desktop.addEventListener('pointermove',e=>{const p=point(e);if(drag){const el=drag.el;el.style.left=Math.max(0,Math.min(1100-el.offsetWidth,p.x-drag.dx))+'px';el.style.top=Math.max(0,Math.min(605-el.offsetHeight,p.y-drag.dy))+'px';return;}if(e.target.closest('.safe,.window-title')&&!g.holding){g.cursor.visible=false;return;}queue.push('move',p.x,p.y);});
function pointerUp(e){if(drag){drag=null;return;}queue.push('up');}
window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerUp);desktop.addEventListener('pointerleave',()=>{if(!g.holding)g.cursor.visible=false;});
desktop.addEventListener('contextmenu',e=>{e.preventDefault();clearInput();$('toolbox').classList.remove('collapsed','hidden');});
function dialog(title,body,buttons){$('dialog-title').textContent=title;$('dialog-body').textContent=body;$('dialog-actions').replaceChildren();for(const [name,fn] of buttons){const b=document.createElement('button');b.textContent=name;b.onclick=fn;$('dialog-actions').append(b);}$('dialog-layer').classList.remove('hidden');$('dialog-actions').querySelector('button')?.focus({preventScroll:true});}
function closeDialog(){$('dialog-layer').classList.add('hidden');desktop.focus({preventScroll:true});}
function showHelp(){clearInput();if(running(g)){helpReturn=g.mode;g.mode='help';}dialog('도움말 — 진짜 PC는 멀쩡합니다','1 망치 · 2 전기톱 · 3 연발총 · 4 화염기 · 5 도장 · 6 흰개미\n마우스 왼쪽으로 사용. 전기톱은 누른 채 드래그하세요.\n0: 창 조작 / 제목 표시줄은 언제든 드래그할 수 있습니다.\n방향키: 가상 커서 이동 / Space: 도구 사용\nU 또는 Ctrl+Z: 한 동작 취소 / P: 일시정지\n오른쪽 클릭: 도구 창 다시 열기\n\n복구와 휴지통은 이 게임 화면에만 적용됩니다. 화면 캡처, 파일 접근, 실제 명령 실행은 하지 않습니다.',[['알겠어요',()=>{closeDialog();if(helpReturn){g.mode=helpReturn;helpReturn=null;}previousMode='';update();}]]);}
function beginChallenge(){clearInput();startChallenge(g);$('start-menu').classList.add('hidden');previousMode='';update();}
function returnFree(){clearInput();freeplay(g);closeDialog();$('start-menu').classList.add('hidden');previousMode='';update();}
function handlePause(){if(pause(g)){clearInput();previousMode='';update();}}
$('pointer-tool').onclick=()=>choose('pointer');$('undo').onclick=performUndo;
$('clean').onclick=()=>{clearInput();if(g.mode==='challenge'){const m=g.mode;g.mode='help';dialog('도전 중 복구','파손을 지우면 이번 단계의 목표도 초기화됩니다.\n남은 시간은 늘어나지 않습니다.',[['복구',()=>{g.mode=m;resetDamage(g);closeDialog();previousMode='';update();}],['취소',()=>{g.mode=m;closeDialog();previousMode='';update();}]]);}else{resetDamage(g);update();}};
$('collapse-tools').onclick=()=>$('toolbox').classList.toggle('collapsed');$('tool-toggle').onclick=()=>$('toolbox').classList.toggle('hidden');$('outside-tools').onclick=()=>{$('toolbox').classList.remove('hidden','collapsed');};
$('start-button').onclick=()=>$('start-menu').classList.toggle('hidden');$('challenge').onclick=beginChallenge;$('outside-challenge').onclick=beginChallenge;$('freeplay').onclick=returnFree;$('restore-windows').onclick=restoreWindows;
$('pause').onclick=handlePause;$('help').onclick=showHelp;$('start-help').onclick=showHelp;$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'소리 켜짐':'소리 꺼짐';if(sound)soundCue('stamp');};
$('empty-bin').onclick=()=>{$('window-recycle').querySelector('p').textContent='걱정 0개를 비웠습니다.\n원래부터 가상 휴지통이었습니다.';};
$('terminal-input').addEventListener('keydown',e=>{e.stopPropagation();if(e.key!=='Enter')return;e.preventDefault();const value=e.target.value.trim().toLowerCase(),out=$('terminal-output');e.target.value='';const replies={help:'help / dir / ver / squawk / clear 만 지원합니다.',dir:'[가상 폴더] 중요_해보이는_일\n[가상 파일] 퇴근_메모.txt\n이 목록은 코드에 적힌 장난용 목록입니다.',ver:'Flamingo 98 — Fictional Desktop / 0.98',squawk:'꽥! 퇴근하세요.'};if(value==='clear')out.textContent='';else out.textContent+=`\nC:\\NEST> ${value.slice(0,80)}\n${replies[value]||'실행하지 않았습니다. help를 입력하세요.'}\n`;out.parentElement.scrollTop=out.parentElement.scrollHeight;});
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(e.target.closest('button')&&['Space','Enter'].includes(e.code))return;
 if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat){e.preventDefault();handlePause();}return;}if(!running(g))return;
 if(/^Digit[0-6]$/.test(e.code)){e.preventDefault();choose(TOOLS[Number(e.code.slice(-1))].id);return;}
 if(e.code==='KeyU'||((e.ctrlKey||e.metaKey)&&e.code==='KeyZ')){e.preventDefault();if(!e.repeat)performUndo();return;}
 if(e.code==='Space'){e.preventDefault();if(!e.repeat){queue.push('down',g.cursor.x,g.cursor.y);keys.add('Space');}return;}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();if(!e.repeat){const dx=e.code==='ArrowRight'?12:e.code==='ArrowLeft'?-12:0,dy=e.code==='ArrowDown'?12:e.code==='ArrowUp'?-12:0;queue.push('move',g.cursor.x+dx,g.cursor.y+dy);}keys.add(e.code);}
});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')queue.push('up');});
function blur(){clearInput();if(running(g)){pause(g);previousMode='';update();}}
window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();last=0;acc=0;});
function update(){const t=TOOLS.find(t=>t.id===g.tool);for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===g.tool));$('pointer-tool').setAttribute('aria-pressed',String(g.tool==='pointer'));$('tool-tip').textContent=t.name+' — '+t.hint;$('undo').disabled=!g.history.length||!running(g);$('status').textContent=`${t.name} · 파손 ${coverage(g).toFixed(1)}% · 기록 ${g.marks.length} · ${g.full?'화면 기록 한도입니다. 전체 복구하세요.':'1–6 도구 / 0 창 / 방향키+Space / U 취소 / P 멈춤'}`;
 const missionVisible=['challenge','roundclear','brief','lost','won'].includes(g.mode);$('mission').classList.toggle('hidden',!missionVisible);
 if(missionVisible){const m=MISSIONS[g.mission];$('mission-title').textContent=m.name;$('mission-time').textContent=Math.ceil(g.time)+'초';$('mission-instruction').textContent=m.instruction;$('mission-progress').textContent=g.mission===0?`표적 ${g.targets.filter(Boolean).length}/3　절단 ${Math.floor(g.metrics.saw)}/250px`:g.mission===1?`승인 ${g.targets.filter(Boolean).length}/3　그을음 ${coverage(g,true).toFixed(1)}/3%`:`갉기 ${g.metrics.nibbles}/45　탄흔 ${g.metrics.gun}/25　파손 ${coverage(g).toFixed(1)}/8%`;}
 if(g.mode===previousMode)return;clearInput();previousMode=g.mode;
 if(g.mode==='free'||g.mode==='challenge'){closeDialog();$('pause').textContent='멈춤';}
 if(g.mode==='brief'){const m=MISSIONS[g.mission];dialog('스트레스 테스트',m.name+'\n\n'+m.instruction+'\n제한 시간 '+m.time+'초. 시작하면 표적이 표시됩니다.',[['시작',()=>{selectTool(g,MISSIONS[g.mission].tool);startRound(g);previousMode='';update();}],['자유 모드',returnFree]]);}
 if(g.mode==='roundclear')dialog('단계 통과','처리 완료!\n'+MISSIONS[g.mission].name+'\n\n다음 단계는 새 바탕화면에서 시작합니다.',[['다음 단계',()=>{nextRound(g);previousMode='';update();}],['자유 모드',returnFree]]);
 if(g.mode==='won')dialog('퇴근 승인','세 단계 모두 통과했습니다!\n오늘의 바탕화면은 충분히 고생했어요.\n진짜 컴퓨터는 여전히 멀쩡합니다.',[['처음부터 다시',beginChallenge],['자유롭게 부수기',returnFree]]);
 if(g.mode==='lost')dialog('시간 초과','시간 안에 작업을 끝내지 못했습니다.\n같은 단계의 목표를 다시 확인하고 도전하세요.',[['이 단계 재도전',()=>{resetDamage(g);g.mode='brief';previousMode='';update();}],['자유 모드',returnFree]]);
 if(g.mode==='paused'){$('pause').textContent='계속';dialog('일시정지','불길과 흰개미, 제한 시간을 모두 멈췄습니다.',[['계속',handlePause],['자유 모드',returnFree]]);}
}
function tick(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;acc+=dt;while(acc>=1/60){if(running(g)){const dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);if(dx||dy)queue.push('move',g.cursor.x+dx*5,g.cursor.y+dy*5);queue.drain(g);step(g,1/60);for(const event of new Set(g.events))soundCue(event);g.events=[];}else queue.clear();acc-=1/60;}renderDamage(damage,g,cache);renderEffects(effects,g,{reducedMotion:reduced});if(now-lastUi>200||g.mode!==previousMode){lastUi=now;update();}raf=requestAnimationFrame(tick);}
const resize=new ResizeObserver(()=>{scale=viewport.clientWidth/1100;desktop.style.transform=`scale(${scale})`;});resize.observe(viewport);taskButtons();document.fonts.ready.then(()=>{redrawArt();update();raf=requestAnimationFrame(tick);});if(import.meta.hot)import.meta.hot.dispose(()=>{cancelAnimationFrame(raf);resize.disconnect();});
