import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame,selectTool,beginGesture,moveGesture,endGesture,step,W,H} from '../src/engine.js';
import {drawWallpaper,drawPostcard,renderDamage,renderEffects,drawTool} from '../src/render.js';
GlobalFonts.registerFromPath(new URL('../node_modules/galmuri/dist/Galmuri11.ttf',import.meta.url).pathname,'Galmuri11');
const g=createGame(),c=createCanvas(W,H),ctx=c.getContext('2d');drawWallpaper(ctx);
// This is a renderer-only exhibit. The DOM desktop windows are NOT represented as a browser screenshot.
const postcard=createCanvas(340,211);drawPostcard(postcard.getContext('2d'));ctx.drawImage(postcard,370,220);
const click=(tool,x,y)=>{selectTool(g,tool);beginGesture(g,x,y);endGesture(g);};
click('hammer',180,180);click('hammer',420,100);selectTool(g,'saw');beginGesture(g,150,380);moveGesture(g,420,450);endGesture(g);selectTool(g,'gun');beginGesture(g,750,100);for(let i=0;i<100;i++){moveGesture(g,750+Math.sin(i*.12)*110,100+i*2);step(g);}endGesture(g);click('fire',660,400);click('stamp',450,315);click('bugs',820,490);for(let i=0;i<200;i++)step(g);
const overlay=createCanvas(W,H);renderDamage(overlay.getContext('2d'),g,{marks:null,count:0});ctx.drawImage(overlay,0,0);const fx=createCanvas(W,H);g.cursor.visible=false;renderEffects(fx.getContext('2d'),g);ctx.drawImage(fx,0,0);ctx.fillStyle='#c5c5c5';ctx.fillRect(0,0,W,44);ctx.fillStyle='#000';ctx.font='16px Galmuri11';ctx.textAlign='left';ctx.fillText('CPU EFFECTS EXHIBIT — NOT BROWSER QA',16,28);for(let i=1;i<7;i++)drawTool(ctx,['','hammer','saw','gun','fire','stamp','bugs'][i],65+i*145,585,.65);
await mkdir(new URL('../docs/previews/',import.meta.url),{recursive:true});await writeFile(new URL('../docs/previews/cpu-effects.png',import.meta.url),c.toBuffer('image/png'));console.log('CPU effect-only exhibit: docs/previews/cpu-effects.png. Not a browser screenshot.');
