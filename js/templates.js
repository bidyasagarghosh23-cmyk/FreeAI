/* ============================================================
   FreeAI Templates — instant standalone HTML generators.
   Each function returns a complete .html file (string) that
   can be previewed in-app or downloaded and opened anywhere.
   No backticks inside generated code (keeps nesting safe).
   ============================================================ */
var FreeAITemplates = (() => {
  "use strict";
  const escT = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const doc = (title, css, body, js) =>
    "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + escT(title) + "</title><style>" + css + "</style></head><body>" + body +
    (js ? "<script>" + js + "<\/script>" : "") +
    "<div style=\"position:fixed;bottom:6px;right:10px;font:11px system-ui;opacity:.45;color:#888\">Made free with FreeAI</div></body></html>";

  const BASE = "*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#111827;color:#f3f4f6;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:18px}h1{margin:6px 0 4px;font-size:clamp(22px,4vw,32px)}p.sub{color:#9ca3af;margin:0 0 14px;text-align:center}button{font:inherit;cursor:pointer;border:none;border-radius:10px;padding:9px 16px;background:ACCENT;color:#fff;font-weight:600}button.ghost{background:#1f2937;color:#e5e7eb;border:1px solid #374151}input,select,textarea{font:inherit;color:#f3f4f6;background:#1f2937;border:1px solid #374151;border-radius:10px;padding:9px 12px}canvas{background:#0b1220;border:1px solid #374151;border-radius:12px;max-width:94vw}.row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}.score{font-weight:700;font-size:18px;margin:10px}.card{background:#1f2937;border:1px solid #374151;border-radius:14px;padding:16px;max-width:560px;width:100%}";
  const base = (accent) => BASE.replace(/ACCENT/g, accent || "#10a37f");

  /* ── GAMES ─────────────────────────────────────────────── */
  function snake({ title = "Snake", accent = "#10a37f", speed = 140 } = {}) {
    return doc(title, base(accent) + ".pad{display:grid;grid-template-columns:repeat(3,54px);gap:6px;margin-top:12px}.pad button{height:54px;background:#1f2937;border:1px solid #374151;font-size:20px}",
      "<h1>🐍 " + escT(title) + "</h1><p class=sub>Arrow keys / WASD / buttons. Eat the apples, don't bite yourself!</p>" +
      "<canvas id=c width=400 height=400></canvas><div class=score>Score: <span id=s>0</span> · Best: <span id=b>0</span></div>" +
      "<div class=row><button onclick=start()>▶ Restart</button></div>" +
      "<div class=pad><span></span><button onclick=setDir(0,-1)>⬆</button><span></span><button onclick=setDir(-1,0)>⬅</button><button onclick=setDir(0,1)>⬇</button><button onclick=setDir(1,0)>➡</button></div>",
      "var cv=document.getElementById('c'),x=cv.getContext('2d'),N=20,S=20,snk,dir,nd,food,score,timer,best=+(localStorage.getItem('snkBest')||0);" +
      "document.getElementById('b').textContent=best;" +
      "function place(){food={x:(Math.random()*N)|0,y:(Math.random()*N)|0};}" +
      "function setDir(a,b){if(dir.x!==-a||dir.y!==-b)nd={x:a,y:b};}" +
      "function start(){snk=[{x:10,y:10}];dir={x:1,y:0};nd=dir;score=0;document.getElementById('s').textContent=0;place();clearInterval(timer);timer=setInterval(step," + (speed | 0) + ");draw();}" +
      "function step(){dir=nd;var h={x:snk[0].x+dir.x,y:snk[0].y+dir.y};" +
      "if(h.x<0||h.y<0||h.x>=N||h.y>=N||snk.some(function(p){return p.x===h.x&&p.y===h.y})){clearInterval(timer);if(score>best){best=score;localStorage.setItem('snkBest',best);document.getElementById('b').textContent=best;}alert('Game over! Score: '+score);return;}" +
      "snk.unshift(h);if(h.x===food.x&&h.y===food.y){score++;document.getElementById('s').textContent=score;place();}else snk.pop();draw();}" +
      "function draw(){x.fillStyle='#0b1220';x.fillRect(0,0,400,400);x.font='17px serif';x.fillText('🍎',food.x*S+1,food.y*S+17);snk.forEach(function(p,i){x.fillStyle=i===0?'" + accent + "':'#34d399';x.beginPath();x.roundRect(p.x*S+1,p.y*S+1,S-2,S-2,5);x.fill();});}" +
      "addEventListener('keydown',function(e){var k=e.key.toLowerCase();if(k==='arrowup'||k==='w')setDir(0,-1);if(k==='arrowdown'||k==='s')setDir(0,1);if(k==='arrowleft'||k==='a')setDir(-1,0);if(k==='arrowright'||k==='d')setDir(1,0);if(k.indexOf('arrow')===0)e.preventDefault();});start();");
  }

  function flappy({ title = "Flappy Bird", accent = "#0ea5e9" } = {}) {
    return doc(title, base(accent),
      "<h1>🐦 " + escT(title) + "</h1><p class=sub>Click / tap / Space to flap. Dodge the pipes!</p><canvas id=c width=380 height=520></canvas><div class=score>Score: <span id=s>0</span></div><div class=row><button onclick=reset()>▶ Restart</button></div>",
      "var cv=document.getElementById('c'),x=cv.getContext('2d'),y,v,pipes,score,run,raf;" +
      "function reset(){y=250;v=0;pipes=[];score=0;run=true;document.getElementById('s').textContent=0;cancelAnimationFrame(raf);loop();}" +
      "function flap(){if(!run){reset();return;}v=-7.2;}" +
      "cv.addEventListener('pointerdown',flap);addEventListener('keydown',function(e){if(e.code==='Space'){e.preventDefault();flap();}});" +
      "function loop(){if(!run)return;v+=0.42;y+=v;" +
      "if(!pipes.length||pipes[pipes.length-1].x<210)pipes.push({x:390,gap:80+Math.random()*300,hit:false});" +
      "x.fillStyle='#0b1220';x.fillRect(0,0,380,520);" +
      "pipes.forEach(function(p){p.x-=2.4;x.fillStyle='" + accent + "';x.fillRect(p.x,0,58,p.gap-72);x.fillRect(p.x,p.gap+72,58,520);" +
      "if(!p.hit&&p.x<70){p.hit=true;score++;document.getElementById('s').textContent=score;}" +
      "if(70+13>p.x&&70-13<p.x+58&&(y-13<p.gap-72||y+13>p.gap+72))run=false;});" +
      "pipes=pipes.filter(function(p){return p.x>-70});" +
      "x.font='26px serif';x.fillText('🐦',56,y+9);" +
      "if(y>510||y<0)run=false;" +
      "if(!run){x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,380,520);x.fillStyle='#fff';x.font='bold 28px system-ui';x.textAlign='center';x.fillText('Game Over',190,240);x.font='16px system-ui';x.fillText('Score: '+score+' — click to retry',190,272);x.textAlign='left';return;}" +
      "raf=requestAnimationFrame(loop);}reset();");
  }

  function breakout({ title = "Breakout", accent = "#8b5cf6" } = {}) {
    return doc(title, base(accent),
      "<h1>🧱 " + escT(title) + "</h1><p class=sub>Move the mouse / finger to bounce. Break all the bricks!</p><canvas id=c width=440 height=480></canvas><div class=score>Score: <span id=s>0</span> · Lives: <span id=l>3</span></div><div class=row><button onclick=reset()>▶ Restart</button></div>",
      "var cv=document.getElementById('c'),x=cv.getContext('2d'),px,bx,by,vx,vy,bricks,score,lives,run;" +
      "function reset(){px=185;bx=220;by=430;vx=3;vy=-3;score=0;lives=3;run=true;bricks=[];for(var r=0;r<5;r++)for(var c=0;c<7;c++)bricks.push({x:18+c*59,y:36+r*26,on:true,hue:r*54+c*8});upd();requestAnimationFrame(loop);}" +
      "function upd(){document.getElementById('s').textContent=score;document.getElementById('l').textContent=lives;}" +
      "function move(cx){var r=cv.getBoundingClientRect();px=Math.max(0,Math.min(370,(cx-r.left)*(440/r.width)-35));}" +
      "cv.addEventListener('mousemove',function(e){move(e.clientX)});cv.addEventListener('touchmove',function(e){move(e.touches[0].clientX);e.preventDefault()},{passive:false});" +
      "function loop(){if(!run)return;bx+=vx;by+=vy;if(bx<8||bx>432)vx*=-1;if(by<8)vy*=-1;" +
      "if(by>448&&by<462&&bx>px&&bx<px+70){vy=-Math.abs(vy);vx=((bx-(px+35))/35)*4;}" +
      "if(by>480){lives--;upd();if(lives<=0){run=false;alert('Game over! Score: '+score);return;}bx=220;by=430;vx=3;vy=-3;}" +
      "var left=0;bricks.forEach(function(b){if(b.on){left++;if(bx>b.x&&bx<b.x+51&&by>b.y&&by<b.y+19){b.on=false;vy*=-1;score+=10;upd();}}});" +
      "if(!left){run=false;alert('🏆 You win! Score: '+score);return;}" +
      "x.fillStyle='#0b1220';x.fillRect(0,0,440,480);" +
      "bricks.forEach(function(b){if(b.on){x.fillStyle='hsl('+b.hue+',75%,58%)';x.beginPath();x.roundRect(b.x,b.y,51,19,5);x.fill();}});" +
      "x.fillStyle='" + accent + "';x.beginPath();x.roundRect(px,456,70,11,6);x.fill();" +
      "x.fillStyle='#fff';x.beginPath();x.arc(bx,by,8,0,7);x.fill();" +
      "requestAnimationFrame(loop);}reset();");
  }

  function memory({ title = "Memory Match", accent = "#f59e0b" } = {}) {
    return doc(title, base(accent) + ".grid{display:grid;grid-template-columns:repeat(4,74px);gap:9px}.tile{height:74px;font-size:32px;background:#1f2937;border:1px solid #374151;border-radius:13px;color:#f3f4f6}.tile.open{background:" + accent + "}",
      "<h1>🃏 " + escT(title) + "</h1><p class=sub>Find all the matching pairs. Fewer moves = better!</p><div class=grid id=g></div><div class=score>Moves: <span id=m>0</span> · Pairs: <span id=p>0</span>/8</div><div class=row><button onclick=reset()>🔀 Shuffle &amp; restart</button></div>",
      "var E=['🚀','🎸','🍕','🐶','🌈','⚽','🎁','🦄'],first=null,lock=false,moves=0,pairs=0;" +
      "function reset(){moves=0;pairs=0;first=null;lock=false;upd();var deck=E.concat(E).sort(function(){return Math.random()-.5});var g=document.getElementById('g');g.innerHTML='';" +
      "deck.forEach(function(e){var b=document.createElement('button');b.className='tile';b.textContent='❓';b.onclick=function(){flip(b,e)};g.appendChild(b);});}" +
      "function upd(){document.getElementById('m').textContent=moves;document.getElementById('p').textContent=pairs;}" +
      "function flip(b,e){if(lock||b.classList.contains('open'))return;b.classList.add('open');b.textContent=e;" +
      "if(!first){first={b:b,e:e};return;}moves++;upd();" +
      "if(first.e===e){pairs++;upd();first=null;if(pairs===8)setTimeout(function(){alert('🏆 You win in '+moves+' moves!')},250);}" +
      "else{lock=true;var f=first;first=null;setTimeout(function(){b.classList.remove('open');b.textContent='❓';f.b.classList.remove('open');f.b.textContent='❓';lock=false;},720);}}" +
      "reset();");
  }

  /* ── SOFTWARE / APPS ───────────────────────────────────── */
  function todo({ title = "My To-Do List", accent = "#10a37f" } = {}) {
    return doc(title, base(accent) + ".task{display:flex;gap:9px;align-items:center;background:#111827;border:1px solid #374151;border-radius:11px;padding:10px 12px;margin:8px 0}.task.done span{text-decoration:line-through;opacity:.5}.task span{flex:1}",
      "<h1>✅ " + escT(title) + "</h1><p class=sub>Your tasks save automatically in this browser.</p><div class=card><div class=row style=justify-content:stretch><input id=t placeholder='Add a new task…' style=flex:1 onkeydown=\"if(event.key==='Enter')add()\"><button onclick=add()>＋ Add</button></div><div id=list></div><div class=row style=margin-top:10px><button class=ghost onclick=clearDone()>Clear completed</button></div></div>",
      "var K='freeaiTodo',tasks=JSON.parse(localStorage.getItem(K)||'[]');" +
      "function save(){localStorage.setItem(K,JSON.stringify(tasks));render();}" +
      "function add(){var i=document.getElementById('t');if(!i.value.trim())return;tasks.unshift({t:i.value.trim(),d:false});i.value='';save();}" +
      "function tog(n){tasks[n].d=!tasks[n].d;save();}function del(n){tasks.splice(n,1);save();}" +
      "function clearDone(){tasks=tasks.filter(function(a){return !a.d});save();}" +
      "function render(){var L=document.getElementById('list');L.innerHTML=tasks.length?'':'<p style=\"color:#9ca3af;text-align:center\">No tasks yet 🎉</p>';tasks.forEach(function(a,n){var d=document.createElement('div');d.className='task'+(a.d?' done':'');var c=document.createElement('input');c.type='checkbox';c.checked=a.d;c.onchange=function(){tog(n)};var s=document.createElement('span');s.textContent=a.t;var b=document.createElement('button');b.className='ghost';b.textContent='🗑';b.onclick=function(){del(n)};d.append(c,s,b);L.appendChild(d);});}" +
      "render();");
  }

  function calculator({ title = "Calculator", accent = "#0ea5e9" } = {}) {
    const btns = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map(b =>
      "<button onclick=press('" + b + "')>" + (b === "*" ? "×" : b === "/" ? "÷" : b) + "</button>").join("");
    return doc(title, base(accent) + ".keys{display:grid;grid-template-columns:repeat(4,64px);gap:8px}.keys button{height:56px;font-size:20px;background:#1f2937;border:1px solid #374151;color:#f3f4f6}.keys button:hover{background:#374151}#d{width:280px;text-align:right;font-size:26px;margin-bottom:12px}",
      "<h1>🧮 " + escT(title) + "</h1><input id=d readonly value=0><div class=keys>" + btns + "</div><div class=row style=margin-top:10px><button class=ghost onclick=clr()>C Clear</button><button class=ghost onclick=back()>⌫</button></div>",
      "var expr='';function show(){document.getElementById('d').value=expr||'0'}" +
      "function press(k){if(k==='='){try{if(/^[0-9+\\-*/.() ]+$/.test(expr))expr=String(Math.round(Function('return('+expr+')')()*1e10)/1e10);}catch(e){expr='';alert('Invalid calculation');}}else expr+=k;show();}" +
      "function clr(){expr='';show()}function back(){expr=expr.slice(0,-1);show()}" +
      "addEventListener('keydown',function(e){if('0123456789+-*/.()'.indexOf(e.key)>=0){expr+=e.key;show()}if(e.key==='Enter')press('=');if(e.key==='Backspace')back();});");
  }

  function notepad({ title = "Notepad", accent = "#f59e0b" } = {}) {
    return doc(title, base(accent) + "textarea{width:min(760px,94vw);height:52vh;line-height:1.6}",
      "<h1>📝 " + escT(title) + "</h1><p class=sub>Auto-saves as you type. <span id=wc></span></p><textarea id=t placeholder='Start writing…'></textarea><div class=row style=margin-top:12px><button onclick=dl()>⬇ Download .txt</button><button class=ghost onclick=cp()>⧉ Copy all</button><button class=ghost onclick=wipe()>🗑 Clear</button></div>",
      "var t=document.getElementById('t');t.value=localStorage.getItem('freeaiNote')||'';" +
      "function wc(){var v=t.value;document.getElementById('wc').textContent=v.trim()?v.trim().split(/\\s+/).length+' words · '+v.length+' chars':''}" +
      "t.addEventListener('input',function(){localStorage.setItem('freeaiNote',t.value);wc()});wc();" +
      "function dl(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t.value],{type:'text/plain'}));a.download='note.txt';a.click()}" +
      "function cp(){navigator.clipboard.writeText(t.value);alert('Copied ✓')}" +
      "function wipe(){if(confirm('Clear everything?')){t.value='';localStorage.removeItem('freeaiNote');wc()}}");
  }

  function pomodoro({ title = "Focus Timer", accent = "#ef4444" } = {}) {
    return doc(title, base(accent) + "#time{font-size:clamp(56px,14vw,110px);font-weight:800;font-variant-numeric:tabular-nums;margin:8px}",
      "<h1>🍅 " + escT(title) + "</h1><p class=sub id=mode>Focus time — 25 minutes</p><div id=time>25:00</div><div class=row><button onclick=toggle() id=btn>▶ Start</button><button class=ghost onclick=setM(25,'Focus time — 25 minutes')>Focus 25</button><button class=ghost onclick=setM(5,'Break — 5 minutes ☕')>Break 5</button><button class=ghost onclick=setM(15,'Long break — 15 minutes 🌿')>Break 15</button></div><p class=sub style=margin-top:14px>Sessions done: <b id=done>0</b></p>",
      "var left=1500,timer=null,done=+(localStorage.getItem('pomoDone')||0);document.getElementById('done').textContent=done;" +
      "function show(){var m=(left/60)|0,s=left%60;document.getElementById('time').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;document.title=document.getElementById('time').textContent+' · Focus Timer'}" +
      "function toggle(){var b=document.getElementById('btn');if(timer){clearInterval(timer);timer=null;b.textContent='▶ Start';return;}b.textContent='⏸ Pause';" +
      "timer=setInterval(function(){left--;show();if(left<=0){clearInterval(timer);timer=null;b.textContent='▶ Start';done++;localStorage.setItem('pomoDone',done);document.getElementById('done').textContent=done;try{var a=new AudioContext(),o=a.createOscillator();o.frequency.value=880;o.connect(a.destination);o.start();o.stop(a.currentTime+.7)}catch(e){}alert('⏰ Time up! Great work.');}},1000);}" +
      "function setM(m,label){clearInterval(timer);timer=null;left=m*60;document.getElementById('mode').textContent=label;document.getElementById('btn').textContent='▶ Start';show()}show();");
  }

  function passwordGen({ title = "Password Generator", accent = "#10a37f" } = {}) {
    return doc(title, base(accent) + "#pw{width:min(520px,92vw);text-align:center;font-size:19px;font-family:ui-monospace,monospace}label{display:flex;gap:8px;align-items:center;margin:6px}",
      "<h1>🔐 " + escT(title) + "</h1><p class=sub>Strong passwords, generated on your device. Nothing is sent anywhere.</p><input id=pw readonly><div style=margin:14px><label>Length <input id=len type=number value=16 min=6 max=64 style=width:76px></label><label><input type=checkbox id=up checked> Uppercase ABC</label><label><input type=checkbox id=num checked> Numbers 123</label><label><input type=checkbox id=sym checked> Symbols #$&amp;</label></div><div class=row><button onclick=gen()>🎲 Generate</button><button class=ghost onclick=cp()>⧉ Copy</button></div>",
      "function gen(){var set='abcdefghijklmnopqrstuvwxyz';if(document.getElementById('up').checked)set+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(document.getElementById('num').checked)set+='0123456789';if(document.getElementById('sym').checked)set+='!@#$%^&*()-_=+';" +
      "var n=Math.max(6,Math.min(64,+document.getElementById('len').value||16)),out='',buf=new Uint32Array(n);crypto.getRandomValues(buf);for(var i=0;i<n;i++)out+=set[buf[i]%set.length];document.getElementById('pw').value=out;}" +
      "function cp(){navigator.clipboard.writeText(document.getElementById('pw').value);alert('Copied ✓')}gen();");
  }

  /* ── WEB OS ────────────────────────────────────────────── */
  function webOS({ title = "FreeOS", accent = "#0ea5e9", user = "Guest" } = {}) {
    const css = "body{margin:0;font-family:system-ui,sans-serif;overflow:hidden;height:100vh;background:linear-gradient(135deg,#0f172a," + accent + ")}" +
      ".desk{position:absolute;inset:0 0 46px;padding:16px;display:flex;flex-direction:column;flex-wrap:wrap;gap:6px;align-content:flex-start}" +
      ".dicon{width:84px;padding:9px 4px;text-align:center;color:#fff;background:none;border:none;border-radius:12px;cursor:pointer;font-size:12px}.dicon:hover{background:rgba(255,255,255,.16)}.dicon div{font-size:32px}" +
      ".win{position:absolute;width:min(430px,92vw);background:#111827;color:#f3f4f6;border:1px solid #374151;border-radius:13px;box-shadow:0 18px 50px rgba(0,0,0,.5);overflow:hidden}" +
      ".bar{display:flex;align-items:center;background:#1f2937;padding:8px 12px;cursor:move;font-weight:650;font-size:14px}.bar button{margin-left:auto;background:#dc2626;color:#fff;border:none;border-radius:7px;width:26px;height:24px;cursor:pointer}" +
      ".body{padding:12px}.body textarea{width:100%;height:170px;background:#0b1220;color:#f3f4f6;border:1px solid #374151;border-radius:9px;padding:9px;font:inherit}" +
      ".taskbar{position:absolute;left:0;right:0;bottom:0;height:46px;background:rgba(10,14,24,.88);backdrop-filter:blur(8px);display:flex;align-items:center;gap:8px;padding:0 12px;color:#fff}" +
      ".start{background:" + accent + ";color:#fff;border:none;border-radius:10px;padding:7px 14px;font-weight:700;cursor:pointer}.clock{margin-left:auto;font-variant-numeric:tabular-nums}" +
      ".keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.keys button{height:42px;background:#1f2937;color:#fff;border:1px solid #374151;border-radius:8px;cursor:pointer}.keys input{grid-column:span 4;background:#0b1220;color:#fff;border:1px solid #374151;border-radius:8px;padding:9px;text-align:right;font-size:18px}" +
      "canvas.paint{background:#fff;border-radius:9px;width:100%;touch-action:none}";
    const body =
      "<div class=desk id=desk>" +
      ["notepad|📝|Notepad","calc|🧮|Calculator","paint|🎨|Paint","about|ℹ️|About"].map(s => {
        const p = s.split("|"); return "<button class=dicon data-app=" + p[0] + "><div>" + p[1] + "</div>" + p[2] + "</button>";
      }).join("") + "</div>" +
      "<div class=taskbar><button class=start id=start>⊞ " + escT(title) + "</button><span>👋 " + escT(user) + "</span><span class=clock id=clock></span></div>";
    const js =
      "var z=10;" +
      "function tick(){document.getElementById('clock').textContent=new Date().toLocaleTimeString()}setInterval(tick,1000);tick();" +
      "var APPS={notepad:{t:'📝 Notepad',h:'<textarea placeholder=\"Type here… (saved automatically)\" oninput=\"localStorage.setItem(\\'osNote\\',this.value)\">'},paint:{t:'🎨 Paint',h:'<p style=\"margin:0 0 8px\">Color <input type=color value=\"#0ea5e9\" class=pc> <button class=pclear>Clear</button></p><canvas class=paint width=380 height=220></canvas>'},about:{t:'ℹ️ About',h:'<h3 style=\"margin:4px 0\">" + escT(title) + "</h3><p>A pocket web operating system in one HTML file — draggable windows, taskbar, clock and apps. Made free with FreeAI Create Studio.</p>'}};" +
      "function openApp(name){var w=document.createElement('div');w.className='win';w.style.left=(60+Math.random()*160)+'px';w.style.top=(50+Math.random()*110)+'px';w.style.zIndex=++z;" +
      "var inner='';" +
      "if(name==='calc'){inner='<div class=keys><input readonly value=0 class=cd>';['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].forEach(function(k){inner+='<button data-k=\"'+k+'\">'+k+'</button>'});inner+='</div>';w.innerHTML='<div class=bar>🧮 Calculator<button>✕</button></div><div class=body>'+inner+'</div>';}" +
      "else{var a=APPS[name];w.innerHTML='<div class=bar>'+a.t+'<button>✕</button></div><div class=body>'+a.h+'</div>';}" +
      "document.body.appendChild(w);" +
      "var bar=w.querySelector('.bar');bar.querySelector('button').onclick=function(){w.remove()};" +
      "w.addEventListener('pointerdown',function(){w.style.zIndex=++z});" +
      "bar.addEventListener('pointerdown',function(e){if(e.target.tagName==='BUTTON')return;var ox=e.clientX-w.offsetLeft,oy=e.clientY-w.offsetTop;function mv(ev){w.style.left=(ev.clientX-ox)+'px';w.style.top=(ev.clientY-oy)+'px'}function up(){removeEventListener('pointermove',mv);removeEventListener('pointerup',up)}addEventListener('pointermove',mv);addEventListener('pointerup',up)});" +
      "if(name==='notepad'){var t=w.querySelector('textarea');t.value=localStorage.getItem('osNote')||'';}" +
      "if(name==='calc'){var d=w.querySelector('.cd'),expr='';w.querySelectorAll('button[data-k]').forEach(function(b){b.onclick=function(){var k=b.dataset.k;if(k==='='){try{if(/^[0-9+\\-*/.() ]+$/.test(expr))expr=String(Function('return('+expr+')')());}catch(e){expr=''}}else expr+=k;d.value=expr||'0'}});}" +
      "if(name==='paint'){var c=w.querySelector('.paint'),g=c.getContext('2d'),down=false;g.lineWidth=3;g.lineCap='round';" +
      "function pos(e){var r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}}" +
      "c.addEventListener('pointerdown',function(e){down=true;var p=pos(e);g.strokeStyle=w.querySelector('.pc').value;g.beginPath();g.moveTo(p.x,p.y)});" +
      "c.addEventListener('pointermove',function(e){if(!down)return;var p=pos(e);g.lineTo(p.x,p.y);g.stroke()});" +
      "addEventListener('pointerup',function(){down=false});" +
      "w.querySelector('.pclear').onclick=function(){g.clearRect(0,0,c.width,c.height)};}}" +
      "document.querySelectorAll('.dicon').forEach(function(b){b.onclick=function(){openApp(b.dataset.app)}});" +
      "document.getElementById('start').onclick=function(){openApp('about')};" +
      "openApp('about');";
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + escT(title) + " — Web OS</title><style>" + css + "</style></head><body>" + body + "<script>" + js + "<\/script></body></html>";
  }

  /* ── BROWSER SHELL ─────────────────────────────────────── */
  function browser({ title = "FreeBrowser", accent = "#10a37f" } = {}) {
    const css = "body{margin:0;font-family:system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;background:#0f172a;color:#f3f4f6}" +
      ".top{display:flex;gap:8px;align-items:center;padding:10px;background:#111827;border-bottom:1px solid #1f2937;flex-wrap:wrap}" +
      ".logo{font-weight:800}.logo span{color:" + accent + "}" +
      "button{background:#1f2937;color:#fff;border:1px solid #374151;border-radius:10px;padding:8px 12px;cursor:pointer}button.go{background:" + accent + ";border:none;font-weight:700}" +
      "#url{flex:1;min-width:150px;background:#1f2937;border:1px solid #374151;color:#fff;border-radius:99px;padding:10px 16px;font:inherit}" +
      "iframe{flex:1;border:none;background:#fff;width:100%}.note{font-size:12px;color:#9ca3af;padding:6px 12px;background:#111827}";
    const body =
      "<div class=top><span class=logo>🌐 " + escT(title).replace(/([A-Za-z]+)$/, "<span>$1</span>") + "</span>" +
      "<button onclick=back()>←</button><button onclick=fwd()>→</button><button onclick=reload()>⟳</button>" +
      "<input id=url placeholder='Search or enter a website — e.g. example.com or \"cats\"' onkeydown=\"if(event.key==='Enter')go()\">" +
      "<button class=go onclick=go()>Go</button><button onclick=ext()>Open externally ↗</button></div>" +
      "<iframe id=f src='https://example.com'></iframe>" +
      "<div class=note>⚠️ Many big sites (Google, YouTube, Facebook…) block being shown inside other pages — that's their security rule, not a bug. Use “Open externally” for those. Sites like example.com, Wikipedia mobile mirrors and many blogs work inside.</div>";
    const js =
      "var f=document.getElementById('f'),u=document.getElementById('url'),cur='https://example.com';" +
      "function norm(q){q=q.trim();if(!q)return cur;if(/^https?:\\/\\//i.test(q))return q;if(/^[^\\s]+\\.[a-z]{2,}(\\/.*)?$/i.test(q))return 'https://'+q;return 'https://html.duckduckgo.com/html/?q='+encodeURIComponent(q)}" +
      "function go(){cur=norm(u.value);u.value=cur;f.src=cur}function back(){try{history.back()}catch(e){}}function fwd(){try{history.forward()}catch(e){}}function reload(){f.src=cur}function ext(){open(cur,'_blank')}" +
      "u.value=cur;";
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + escT(title) + "</title><style>" + css + "</style></head><body>" + body + "<script>" + js + "<\/script></body></html>";
  }

  /* ── YOUR OWN AI ───────────────────────────────────────── */
  function aiBot({ name = "MyBot", personality = "You are a helpful, friendly assistant.", accent = "#8b5cf6", greeting = "Hi! Ask me anything." } = {}) {
    const css = "body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#f3f4f6;height:100vh;display:flex;flex-direction:column}" +
      "header{padding:14px 18px;background:#111827;border-bottom:1px solid #1f2937;font-weight:750;display:flex;gap:10px;align-items:center}.ava{width:34px;height:34px;border-radius:10px;background:" + accent + ";display:flex;align-items:center;justify-content:center}" +
      "#msgs{flex:1;overflow-y:auto;padding:18px;max-width:820px;width:100%;margin:0 auto}.m{margin:10px 0;line-height:1.6;white-space:pre-wrap;word-break:break-word}.u{text-align:right}.u b{background:#1f2937;padding:9px 15px;border-radius:18px;display:inline-block;font-weight:500;text-align:left}.a b{color:" + accent + ";display:block;margin-bottom:3px}" +
      ".bar{display:flex;gap:8px;padding:12px;max-width:820px;width:100%;margin:0 auto}#in{flex:1;background:#1f2937;border:1px solid #374151;color:#fff;border-radius:99px;padding:12px 18px;font:inherit}button{background:" + accent + ";border:none;color:#fff;border-radius:99px;padding:0 20px;font-weight:700;cursor:pointer}";
    const js =
      "var NAME=" + JSON.stringify(name) + ",SYS=" + JSON.stringify(personality) + ",hist=[{role:'system',content:SYS}];" +
      "var msgs=document.getElementById('msgs');" +
      "function add(role,text){var d=document.createElement('div');d.className='m '+(role==='user'?'u':'a');if(role==='user'){var b=document.createElement('b');b.textContent=text;d.appendChild(b)}else{var h=document.createElement('b');h.textContent=NAME;var s=document.createElement('span');s.textContent=text;d.append(h,s)}msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d}" +
      "add('assistant'," + JSON.stringify(greeting) + ");" +
      "async function send(){var inp=document.getElementById('in'),t=inp.value.trim();if(!t)return;inp.value='';add('user',t);hist.push({role:'user',content:t});var wait=add('assistant','…thinking');" +
      "try{var r=await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai',messages:hist})});var j=await r.json();var out=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'Sorry, I could not answer that.';wait.querySelector('span').textContent=out;hist.push({role:'assistant',content:out});}" +
      "catch(e){try{var r2=await fetch('https://text.pollinations.ai/'+encodeURIComponent(SYS+'\\n\\nUser: '+t+'\\n\\nAssistant:')+'?model=openai');wait.querySelector('span').textContent=await r2.text()}catch(e2){wait.querySelector('span').textContent='⚠️ I need an internet connection to think.'}}" +
      "msgs.scrollTop=msgs.scrollHeight}" +
      "document.getElementById('in').addEventListener('keydown',function(e){if(e.key==='Enter')send()});";
    const body = "<header><span class=ava>🤖</span> " + escT(name) + " <small style='opacity:.55;font-weight:400'>· free AI by FreeAI</small></header><div id=msgs></div><div class=bar><input id=in placeholder='Message " + escT(name) + "…'><button onclick=send()>Send ➤</button></div>";
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + escT(name) + " — AI</title><style>" + css + "</style></head><body>" + body + "<script>" + js + "<\/script></body></html>";
  }

  /* ── WEBSITE ───────────────────────────────────────────── */
  function website({ type = "landing", title = "My Website", tagline = "Something amazing is coming.", accent = "#10a37f" } = {}) {
    const sets = {
      landing: [["🚀 Fast", "Lightning-fast pages that load instantly anywhere."], ["🔒 Secure", "Built with privacy and safety from day one."], ["💎 Beautiful", "A design your visitors will love and remember."]],
      portfolio: [["💻 Web Development", "Modern, responsive websites and web apps."], ["🎨 UI Design", "Clean interfaces that people enjoy using."], ["📱 Mobile First", "Perfect on every phone, tablet and screen."]],
      restaurant: [["🍛 Fresh Daily", "Cooked fresh every morning with local ingredients."], ["🚴 Home Delivery", "Hot and fast delivery to your doorstep."], ["⭐ Loved by All", "Rated 4.9 by thousands of happy customers."]],
      shop: [["🛍 Best Prices", "Quality products at prices you'll love."], ["🚚 Free Shipping", "Free delivery on all orders this month."], ["↩ Easy Returns", "Changed your mind? No-hassle 7-day returns."]],
    };
    const cards = (sets[type] || sets.landing).map(c => "<div class=feat><div style='font-size:30px'>" + c[0].split(" ")[0] + "</div><h3>" + escT(c[0].split(" ").slice(1).join(" ")) + "</h3><p>" + escT(c[1]) + "</p></div>").join("");
    const css = "*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;color:#111827}" +
      "nav{display:flex;align-items:center;gap:18px;padding:15px 5vw;position:sticky;top:0;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid #e5e7eb;z-index:5}nav b{font-size:19px}nav a{color:#374151;text-decoration:none;font-weight:550}nav .sp{flex:1}" +
      ".btn{background:" + accent + ";color:#fff!important;padding:10px 20px;border-radius:99px;font-weight:700;display:inline-block;text-decoration:none;border:none;cursor:pointer;font:inherit}" +
      "header{text-align:center;padding:11vh 6vw;background:linear-gradient(135deg," + accent + "22,#fff)}header h1{font-size:clamp(34px,6.5vw,62px);margin:.2em 0;letter-spacing:-1px}header p{font-size:19px;color:#4b5563;max-width:640px;margin:0 auto 26px}" +
      "section{padding:56px 6vw;max-width:1150px;margin:0 auto}h2{text-align:center;font-size:31px;margin:0 0 28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.feat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:18px;padding:24px}.feat p{color:#6b7280;line-height:1.6}" +
      "form{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:10px}input,textarea{padding:12px 15px;border:1px solid #d1d5db;border-radius:12px;font:inherit}" +
      "footer{text-align:center;padding:28px;color:#9ca3af;border-top:1px solid #e5e7eb;font-size:14px}";
    const body =
      "<nav><b>" + escT(title) + "</b><span class=sp></span><a href=#features>Features</a><a href=#contact>Contact</a><a class=btn href=#contact>Get Started</a></nav>" +
      "<header><h1>" + escT(title) + "</h1><p>" + escT(tagline) + "</p><a class=btn href=#contact>Start now →</a></header>" +
      "<section id=features><h2>Why choose us?</h2><div class=grid>" + cards + "</div></section>" +
      "<section id=contact><h2>Contact us</h2><form onsubmit=\"event.preventDefault();alert('Thanks! Your message has been noted (demo form — connect it to your email/backend to receive messages).')\"><input required placeholder='Your name'><input required type=email placeholder='Your email'><textarea required rows=4 placeholder='Your message…'></textarea><button class=btn>Send message</button></form></section>" +
      "<footer>© " + new Date().getFullYear() + " " + escT(title) + " · Made free with FreeAI</footer>";
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + escT(title) + "</title><style>" + css + "</style></head><body>" + body + "</body></html>";
  }

  return { snake, flappy, breakout, memory, todo, calculator, notepad, pomodoro, passwordGen, webOS, browser, aiBot, website };
})();
