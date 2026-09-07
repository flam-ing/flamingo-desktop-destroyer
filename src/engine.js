export const W=1100,H=650,PLAY_H=613;
export const TOOLS=[
 {id:'pointer',name:'창 조작',hint:'창 제목을 드래그하고 바탕화면 아이콘을 여세요.'},
 {id:'hammer',name:'망치',hint:'클릭하면 큰 유리 균열과 파편이 생깁니다.'},
 {id:'saw',name:'전기톱',hint:'누른 채 드래그해 들쭉날쭉한 절단선을 만드세요.'},
 {id:'gun',name:'연발총',hint:'누르고 있으면 작은 탄흔이 빠르게 남습니다.'},
 {id:'fire',name:'화염기',hint:'불길이 퍼지고 그을음이 남습니다.'},
 {id:'stamp',name:'퇴근 도장',hint:'클릭해서 플라밍고 퇴근 승인을 찍으세요.'},
 {id:'bugs',name:'흰개미',hint:'클릭해 풀어놓으면 스스로 기어다니며 갉아먹습니다.'},
];
export const MISSIONS=[
 {name:'01 · 오류 창 강제 수리',time:45,instruction:'빨간 표적 3곳을 망치로 깨고, 전기톱으로 250px 이상 자르세요.',tool:'hammer',targets:[{x:542,y:160},{x:450,y:360},{x:790,y:226}]},
 {name:'02 · 퇴근 서류 처리',time:55,instruction:'세 표적에 퇴근 도장을 찍고, 화염기로 바탕화면 3%를 태우세요.',tool:'stamp',targets:[{x:400,y:168},{x:462,y:356},{x:832,y:227}]},
 {name:'03 · 야근 버그 퇴치',time:65,instruction:'흰개미에게 45번 갉게 하고, 연발총 25발 · 파손율 8%를 달성하세요.',tool:'bugs',targets:[]},
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function random(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const rng=g=>{g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;};
const freshMetrics=()=>({hammer:0,saw:0,gun:0,fire:0,stamp:0,bugs:0,nibbles:0});
export function createGame(){return {mode:'free',resumeMode:'free',tool:'hammer',cursor:{x:535,y:245,visible:false},holding:false,gesture:0,clock:0,time:Infinity,mission:0,targets:[],marks:[],bugs:[],fires:[],particles:[],metrics:freshMetrics(),grid:new Uint8Array(110*62),burnGrid:new Uint8Array(110*62),history:[],cooldown:0,seed:9807,events:[],changed:0,score:0,full:false};}
export const running=g=>g.mode==='free'||g.mode==='challenge';
export function selectTool(g,tool){if(!TOOLS.some(t=>t.id===tool))return false;endGesture(g);g.tool=tool;return true;}
export function coverage(g,burn=false){const grid=burn?g.burnGrid:g.grid;let sum=0;for(const n of grid)sum+=n;return sum/grid.length*100;}
function area(g,x,y,r,burn=false){const grid=burn?g.burnGrid:g.grid;for(let yy=Math.max(0,Math.floor((y-r)/10));yy<=Math.min(61,Math.ceil((y+r)/10));yy++)for(let xx=Math.max(0,Math.floor((x-r)/10));xx<=Math.min(109,Math.ceil((x+r)/10));xx++)if(Math.hypot(xx*10+5-x,yy*10+5-y)<r)grid[yy*110+xx]=1;}
function mark(g,kind,x,y,extra={}){if(g.marks.length>=10000){g.full=true;return;}g.marks.push({kind,x,y,seed:Math.floor(rng(g)*0xffffffff),gesture:g.gesture,...extra});g.changed++;}
function snapshot(g){return {length:g.marks.length,bugs:structuredClone(g.bugs),fires:structuredClone(g.fires),metrics:{...g.metrics},grid:g.grid.slice(),burnGrid:g.burnGrid.slice(),targets:g.targets.slice(),seed:g.seed,score:g.score};}
export function beginGesture(g,x,y){if(!running(g)||g.tool==='pointer')return false;g.history.push(snapshot(g));if(g.history.length>30)g.history.shift();g.gesture++;g.holding=true;g.cursor={x:clamp(x,0,W),y:clamp(y,0,PLAY_H),visible:true};g.cooldown=0;apply(g,g.cursor.x,g.cursor.y,true);return true;}
export function moveGesture(g,x,y){x=clamp(x,0,W);y=clamp(y,0,PLAY_H);const previous={...g.cursor};g.cursor={x,y,visible:true};if(!running(g)||!g.holding)return;
 const distance=Math.hypot(x-previous.x,y-previous.y);
 if(g.tool==='saw'&&distance>0){g.metrics.saw+=distance;const segments=Math.ceil(distance/7);for(let i=1;i<=segments;i++){const a=(i-1)/segments,b=i/segments;mark(g,'saw',previous.x+(x-previous.x)*a,previous.y+(y-previous.y)*a,{x2:previous.x+(x-previous.x)*b,y2:previous.y+(y-previous.y)*b});area(g,previous.x+(x-previous.x)*b,previous.y+(y-previous.y)*b,14);}g.events.push('saw');}
 if(g.tool==='fire'&&distance>28)apply(g,x,y,false);
 checkMission(g);
}
export function endGesture(g){g.holding=false;g.cooldown=0;}
function hitTarget(g,tool,x,y){if(g.mode!=='challenge'||MISSIONS[g.mission].tool!==tool)return;MISSIONS[g.mission].targets.forEach((t,i)=>{if(Math.hypot(x-t.x,y-t.y)<53)g.targets[i]=true;});}
function apply(g,x,y,initial){
 const tool=g.tool;
 if(tool==='hammer'&&initial){g.metrics.hammer++;mark(g,'hammer',x,y,{radius:26+rng(g)*9});area(g,x,y,50);hitTarget(g,tool,x,y);for(let i=0;i<14;i++)g.particles.push({kind:'shard',x,y,vx:(rng(g)-.5)*370,vy:-80-rng(g)*260,life:.65+rng(g)*.3,size:3+rng(g)*7});g.events.push('hammer');g.cooldown=.25;}
 if(tool==='saw'&&initial){mark(g,'saw',x,y,{x2:x+2,y2:y});area(g,x,y,14);g.events.push('saw');}
 if(tool==='gun'){g.metrics.gun++;const dx=(rng(g)-.5)*14,dy=(rng(g)-.5)*14;mark(g,'bullet',x+dx,y+dy,{radius:8+rng(g)*6});area(g,x+dx,y+dy,16);g.particles.push({kind:'shell',x:x+55,y:y+18,vx:70+rng(g)*80,vy:-100,life:.65,size:4});g.events.push('gun');g.cooldown=.075;}
 if(tool==='fire'){if(!g.fires.some(f=>Math.hypot(f.x-x,f.y-y)<25&&f.age<2)){g.fires.push({x,y,age:0,emit:0,seed:Math.floor(rng(g)*99999),gesture:g.gesture});g.metrics.fire++;}g.cooldown=.13;g.events.push('fire');}
 if(tool==='stamp'&&initial){g.metrics.stamp++;mark(g,'stamp',x,y,{angle:(rng(g)-.5)*.32});area(g,x,y,39);hitTarget(g,tool,x,y);g.events.push('stamp');}
 if(tool==='bugs'&&initial){g.metrics.bugs++;for(let i=0;i<6&&g.bugs.length<72;i++)g.bugs.push({x:x+(rng(g)-.5)*20,y:y+(rng(g)-.5)*20,angle:rng(g)*Math.PI*2,life:13,age:0,emit:rng(g)*.15,gesture:g.gesture});g.events.push('bugs');}
 g.score=Math.floor(coverage(g)*100)+g.metrics.gun*3+g.metrics.stamp*20+g.metrics.nibbles;checkMission(g);
}
export function undo(g){if(!running(g))return false;endGesture(g);const s=g.history.pop();if(!s)return false;g.marks.length=s.length;g.bugs=s.bugs;g.fires=s.fires;g.metrics=s.metrics;g.grid=s.grid;g.burnGrid=s.burnGrid;g.targets=s.targets;g.seed=s.seed;g.score=s.score;g.particles=[];g.full=false;g.changed++;g.events.push('undo');return true;}
export function resetDamage(g){endGesture(g);g.marks=[];g.bugs=[];g.fires=[];g.particles=[];g.history=[];g.grid.fill(0);g.burnGrid.fill(0);g.metrics=freshMetrics();g.targets=MISSIONS[g.mission].targets.map(()=>false);g.score=0;g.full=false;g.changed++;}
export function startChallenge(g){resetDamage(g);g.mission=0;g.targets=MISSIONS[0].targets.map(()=>false);g.mode='brief';g.time=MISSIONS[0].time;g.clock=0;}
export function startRound(g){if(g.mode!=='brief')return false;g.mode='challenge';g.time=MISSIONS[g.mission].time;return true;}
export function nextRound(g){if(g.mode!=='roundclear')return false;g.mission++;resetDamage(g);g.mode='brief';g.time=MISSIONS[g.mission].time;return true;}
export function freeplay(g){resetDamage(g);g.mode='free';g.time=Infinity;}
export function pause(g){if(running(g)){g.resumeMode=g.mode;g.mode='paused';endGesture(g);return true;}if(g.mode==='paused'){g.mode=g.resumeMode;return true;}return false;}
export function goals(g){if(g.mission===0)return [g.targets.every(Boolean),g.metrics.saw>=250];if(g.mission===1)return[g.targets.every(Boolean),coverage(g,true)>=3];return[g.metrics.nibbles>=45,g.metrics.gun>=25,coverage(g)>=8];}
function checkMission(g){if(g.mode==='challenge'&&goals(g).every(Boolean)){g.mode=g.mission===2?'won':'roundclear';endGesture(g);g.events.push('win');}}
export function step(g,dt=1/60){if(!running(g))return;dt=clamp(Number.isFinite(dt)?dt:0,0,.05);g.clock+=dt;g.cooldown-=dt;
 if(g.mode==='challenge'){g.time=Math.max(0,g.time-dt);if(!g.time){g.mode='lost';endGesture(g);return;}}
 if(g.holding&&g.cooldown<=0&&['gun','fire'].includes(g.tool))apply(g,g.cursor.x,g.cursor.y,false);
 for(const f of g.fires){f.age+=dt;f.emit+=dt;if(f.emit>.14&&f.age<5){f.emit=0;const r=12+f.age*12;mark(g,'burn',f.x+(rng(g)-.5)*r,f.y+(rng(g)-.5)*r,{radius:r*.7,gesture:f.gesture});area(g,f.x,f.y,r);area(g,f.x,f.y,r,true);}}
 g.fires=g.fires.filter(f=>f.age<5.5);
 for(const b of g.bugs){b.age+=dt;b.life-=dt;b.angle+=(rng(g)-.5)*4*dt;b.x+=Math.cos(b.angle)*48*dt;b.y+=Math.sin(b.angle)*48*dt;if(b.x<5||b.x>W-5){b.angle=Math.PI-b.angle;b.x=clamp(b.x,5,W-5);}if(b.y<5||b.y>PLAY_H-5){b.angle=-b.angle;b.y=clamp(b.y,5,PLAY_H-5);}b.emit+=dt;if(b.emit>.19){b.emit=0;mark(g,'nibble',b.x,b.y,{radius:5+rng(g)*5,gesture:b.gesture});area(g,b.x,b.y,12);g.metrics.nibbles++;}}
 g.bugs=g.bugs.filter(b=>b.life>0);
 for(const p of g.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=600*dt;}g.particles=g.particles.filter(p=>p.life>0);
 g.score=Math.floor(coverage(g)*100)+g.metrics.gun*3+g.metrics.stamp*20+g.metrics.nibbles;checkMission(g);
}
export class InputQueue{constructor(){this.events=[];}push(type,x,y){this.events.push({type,x,y});}drain(g){for(const e of this.events){if(e.type==='down')beginGesture(g,e.x,e.y);if(e.type==='move')moveGesture(g,e.x,e.y);if(e.type==='up')endGesture(g);}this.events.length=0;}switchTool(g,tool){this.drain(g);return selectTool(g,tool);}undoLast(g){this.drain(g);return undo(g);}clear(){this.events.length=0;}}
