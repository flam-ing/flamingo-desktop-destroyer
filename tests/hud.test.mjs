import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createGame,TOOLS,MISSIONS,coverage,running} from '../src/engine.js';

// Exercise the production DOM updater without starting Canvas, audio or a browser.
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const start=source.indexOf('function update(){');
const end=source.indexOf('\nfunction tick(',start);
assert.ok(start>=0&&end>start,'production HUD update function must be present');
const updateSource=source.slice(start,end)+'\nupdate();';
function renderHUD(g,previousProgress='previous frame'){
 const elements=new Map();
 const $=id=>{
  if(!elements.has(id))elements.set(id,{textContent:'',disabled:false,hidden:false,setAttribute(){},classList:{toggle(_name,hidden){elements.get(id).hidden=hidden;}}});
  return elements.get(id);
 };
 $('mission-progress').textContent=previousProgress;
 $('mission-time').textContent='previous time';
 runInNewContext(updateSource,{g,TOOLS,MISSIONS,coverage,running,$,document:{querySelectorAll:()=>[]},previousMode:g.mode});
 return $;
}

test('round-clear HUD displays the final targets and saw distance',()=>{
 const g=createGame();Object.assign(g,{mode:'roundclear',mission:0,time:30.2,targets:[true,true,true]});g.metrics.saw=250;
 const $=renderHUD(g,'표적 3/3　절단 249/250px');
 assert.equal($('mission').hidden,false);
 assert.equal($('mission-progress').textContent,'표적 3/3　절단 250/250px');
 assert.equal($('mission-time').textContent,'31초');
});

test('second round-clear HUD displays final burn coverage',()=>{
 const g=createGame();Object.assign(g,{mode:'roundclear',mission:1,targets:[true,true,true]});g.burnGrid.fill(1,0,Math.ceil(g.burnGrid.length*.03));
 const $=renderHUD(g,'승인 3/3　그을음 2.9/3%');
 assert.equal($('mission-progress').textContent,'승인 3/3　그을음 3.0/3%');
 assert.equal($('mission-title').textContent,MISSIONS[1].name);
});

test('victory HUD replaces the penultimate 7.9 percent with final 8.0 percent',()=>{
 const g=createGame();Object.assign(g,{mode:'won',mission:2});Object.assign(g.metrics,{nibbles:45,gun:25});g.grid.fill(1,0,Math.ceil(g.grid.length*.08));
 const $=renderHUD(g,'갉기 45/45　탄흔 25/25　파손 7.9/8%');
 assert.equal($('mission-progress').textContent,'갉기 45/45　탄흔 25/25　파손 8.0/8%');
 assert.match($('status').textContent,/파손 8\.0%/);
 assert.equal($('mission').hidden,false);
});

test('timeout HUD displays zero time and the final unfinished metrics',()=>{
 const g=createGame();Object.assign(g,{mode:'lost',mission:0,time:0,targets:[true,false,false]});g.metrics.saw=249;
 const $=renderHUD(g);
 assert.equal($('mission-time').textContent,'0초');
 assert.equal($('mission-progress').textContent,'표적 1/3　절단 249/250px');
 assert.equal($('mission').hidden,false);
});

test('next-stage briefing refreshes its visible HUD instead of showing previous-stage metrics',()=>{
 const g=createGame();Object.assign(g,{mode:'brief',mission:1,time:MISSIONS[1].time,targets:[false,false,false]});
 const $=renderHUD(g,'표적 3/3　절단 250/250px');
 assert.equal($('mission-title').textContent,MISSIONS[1].name);
 assert.equal($('mission-progress').textContent,'승인 0/3　그을음 0.0/3%');
});
