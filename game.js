/* ==========================================================
   ゲーム：中澤監督パズル（ジグソー 4×4 / 5×5 / 8×8）
   ========================================================== */
(function(){
var PZ={
 1:{img:'img/nakazawa.webp',w:1024,h:1024,ghost:true,title:'中澤監督パズル',sub:'どアップ編',lv:[4,5,8],cap:'うっすら見本あり'},
 2:{img:'img/nakazawa2.webp',w:1000,h:1600,ghost:false,title:'中澤監督パズル',sub:'腕組み全身編',lv:[47,58,69],cap:'見本の透かしなし・上級者向け'}};
var LV={4:{p:1,c:4,r:4,nm:'かんたん',star:'★',k:'easy'},5:{p:1,c:5,r:5,nm:'ふつう',star:'★★',k:'mid'},8:{p:1,c:8,r:8,nm:'むずかしい',star:'★★★',k:'hard'},
 47:{p:2,c:4,r:7,nm:'上級',star:'★★★★',k:'easy'},58:{p:2,c:5,r:8,nm:'超上級',star:'★★★★★★',k:'mid'},69:{p:2,c:6,r:9,nm:'鬼',star:'★★★★★★★★',k:'hard'}};
Object.keys(LV).forEach(function(k){var L=LV[k];L.gr=L.c+'×'+L.r;L.sub=(L.c*L.r)+'ピース'});
var rk={},rkLv=+(lsg('rr-pz-lv')||4),rkAt=0,rkBusy=false,myIds=[];if(!LV[rkLv])rkLv=4;
try{myIds=JSON.parse(localStorage.getItem('rr-pz-my')||'[]')}catch(e){}
function lsg(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lss(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmt(ms){ms=Math.max(0,ms|0);var m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),d=Math.floor(ms%1000/100);return m+':'+String(s).padStart(2,'0')+'.'+d}
var PFK2={'大阪':'osaka','富山':'toyama','愛知':'aichi','岐阜':'gifu','長野':'nagano','新潟':'niigata'};
function teamChip(t){if(!t)return '';var p=window.RR&&RR.PREF[t];return '<span class="pz-team">'+e(t)+(p?'<i class="pfc pf-'+PFK2[p]+'">'+p+'</i>':'')+'</span>'}

/* ---------- ランキング ---------- */
function loadRank(force){
  if(!window.RR||!RR.sb()||rkBusy){if(!window.RR)setTimeout(function(){loadRank(true)},300);return}if(!force&&Date.now()-rkAt<15000)return;
  rkBusy=true;
  RR.sb().from('rr26_puzzle').select('id,lv,name,team,ms,created_at').order('ms',{ascending:true}).limit(2000).then(function(r){
    rkBusy=false;if(r.error){console.error(r.error);Object.keys(LV).forEach(function(k){rk[k]=rk[k]||[]});rk.err=true}else{rk={};Object.keys(LV).forEach(function(k){rk[k]=[]});(r.data||[]).forEach(function(x){if(rk[x.lv])rk[x.lv].push(x)})}
    rkAt=Date.now();if(RR.tab()==='game'&&!document.querySelector('.pz-layer'))RR.render();
  },function(){rkBusy=false});
}
setInterval(function(){if(RR.tab()==='game')loadRank()},20000);

function rankHTML(lv,hlId){
  var list=rk[lv];
  if(!list)return '<div class="pz-rk-empty">ランキングを読み込み中…</div>';
  if(!list.length)return '<div class="pz-rk-empty">'+(rk.err?'ランキングを準備中です':'まだ挑戦者がいません。<br><b>1位のチャンス！</b>')+'</div>';
  return '<ol class="pz-rk">'+list.map(function(x,i){var r=i+1,me=myIds.indexOf(x.id)>=0,hl=x.id===hlId;
    return '<li class="'+(r<=3?'top t'+r:'')+(me?' me':'')+(hl?' hl':'')+'"><span class="no">'+(r===1?'🥇':r===2?'🥈':r===3?'🥉':r)+'</span><span class="who"><b>'+e(x.name)+(me?'<em>YOU</em>':'')+'</b>'+teamChip(x.team)+'</span><span class="pz-t">'+fmt(x.ms)+'</span>'+(RR.isAdmin()?'<button type="button" class="pz-del" data-pzdel="'+x.id+'" aria-label="削除">✕</button>':'')+'</li>'}).join('')+'</ol>';
}

window.viewGame=function(){
  loadRank();
  var h='<section class="pz-hero"><div class="pz-snow" aria-hidden="true">'+'❄❅❆✦❄✦❅❆'.split('').map(function(c,i){return '<i style="left:'+(6+i*12)+'%;animation-delay:-'+(i*1.3)+'s">'+c+'</i>'}).join('')+'</div>'+
   '<span class="pz-k">CHRISTMAS GAME</span><h2>🧩 中澤監督パズル</h2><p>バラバラになった中澤監督を、いちばん早く元に戻せるのは誰だ!?</p>'+
   '<div class="pz-photos"><div class="pz-photo"><img src="'+PZ[1].img+'" alt="中澤監督 どアップ" width="1024" height="1024"></div><div class="pz-photo tall"><img src="'+PZ[2].img+'" alt="中澤監督 腕組み全身" width="1000" height="1600"><span class="pz-q">NEW</span></div></div></section>';
  [1,2].forEach(function(pn){var P=PZ[pn];
    h+='<section class="pz-set"><div class="pz-set-h"><img src="'+P.img+'" alt="" class="'+(pn===2?'tall':'')+'"><div><small>パズル'+(pn===1?'①':'②')+'</small><b>'+P.sub+'</b><em>'+P.cap+'</em></div></div>'+
     '<div class="pz-lv">'+P.lv.map(function(n){var L=LV[n];return '<button type="button" class="pz-lvbtn '+L.k+(pn===2?' p2':'')+'" data-pzstart="'+n+'"><span class="st">'+L.star+'</span><b>'+L.nm+'</b><span class="gr"><i>'+L.gr+'</i>'+L.sub+'</span><span class="go">スタート ▶</span></button>'}).join('')+'</div></section>';
  });
  h+='<p class="note">ピースを指（マウス）でドラッグして、正しい場所に近づけるとピタッとはまります。完成までのタイムでランキングに挑戦！</p>';
  var cp=LV[rkLv].p;
  h+='<div class="card pz-rkcard"><h3>🏆 ランキング</h3><div class="pz-rkp">'+[1,2].map(function(pn){return '<button type="button" data-pzrk="'+PZ[pn].lv[0]+'" aria-pressed="'+(cp===pn)+'">'+(pn===1?'①':'②')+' '+PZ[pn].sub+'</button>'}).join('')+'</div>'+
   '<div class="pz-rktabs" role="tablist">'+PZ[cp].lv.map(function(n){return '<button type="button" role="tab" data-pzrk="'+n+'" aria-selected="'+(rkLv===n)+'" class="'+LV[n].k+'">'+LV[n].nm+'<small>'+LV[n].gr+'（'+(rk[n]?rk[n].length:'-')+'人）</small></button>'}).join('')+'</div>'+rankHTML(rkLv,lastId)+'</div>';
  return h;
};

/* ---------- ピース形状 ---------- */
// 辺のテンプレート（t:辺に沿った位置, n:外向きの高さ）。左右対称なので逆向きでも同じ形
var TPL=[[0.36,0,0.40,0.04,0.38,0.10],[0.34,0.20,0.40,0.28,0.50,0.28],[0.60,0.28,0.66,0.20,0.62,0.10],[0.60,0.04,0.64,0,0.66,0]];
function edge(p,x0,y0,x1,y1,d,s){
  var dx=x1-x0,dy=y1-y0,nx=dy/s,ny=-dx/s; // 進行方向の左手＝外向き（時計回りに辿る）
  function P(t,n){return [x0+dx*t+nx*n*d*s,y0+dy*t+ny*n*d*s]}
  if(!d){p.lineTo(x1,y1);return}
  var a=P(0.34,0);p.lineTo(a[0],a[1]);
  TPL.forEach(function(c){var q1=P(c[0],c[1]),q2=P(c[2],c[3]),q3=P(c[4],c[5]);p.bezierCurveTo(q1[0],q1[1],q2[0],q2[1],q3[0],q3[1])});
  p.lineTo(x1,y1);
}
function piecePath(pc,w,h,pad){
  var p=new Path2D(),x=pad,y=pad;p.moveTo(x,y);
  edge(p,x,y,x+w,y,pc.t,w);edge(p,x+w,y,x+w,y+h,pc.r,h);edge(p,x+w,y+h,x,y+h,pc.b,w);edge(p,x,y+h,x,y,pc.l,h);p.closePath();return p;
}

/* ---------- プレイ ---------- */
var G=null,lastId=null,IMGS={};
[1,2].forEach(function(pn){var im=new Image();im.src=PZ[pn].img;IMGS[pn]=im});
var testCtx=document.createElement('canvas').getContext('2d');

function start(n){
  if(G||!LV[n])return;
  var L0=LV[n],P=PZ[L0.p],img=IMGS[L0.p];
  if(!img.complete){img.onload=function(){img.onload=null;start(n)};return}
  lss('rr-pz-lv',n);rkLv=n;
  var L=document.createElement('div');L.className='pz-layer';L.innerHTML=
   '<div class="pz-bar"><button type="button" class="pz-x" data-pzq>✕ やめる</button><div class="pz-tm"><small>'+L0.nm+' '+L0.gr+'</small><b id="pz-time">0:00.0</b></div><div class="pz-cnt"><b id="pz-done">0</b>/'+(L0.c*L0.r)+'</div><button type="button" class="pz-eye" data-pzeye>👀 見本</button></div>'+
   '<div class="pz-stage" id="pz-stage"><div class="pz-board'+(P.ghost?'':' noghost')+'" id="pz-board"><img src="'+P.img+'" alt=""></div><div class="pz-tray" id="pz-tray"><span>ピース置き場</span></div></div>'+
   '<div class="pz-peek" id="pz-peek" hidden><img src="'+P.img+'" alt="見本"><small>タップで閉じる</small></div>'+
   '<div class="pz-cd" id="pz-cd"></div>';
  document.body.appendChild(L);document.documentElement.classList.add('pz-on');
  G={n:n,cols:L0.c,rows:L0.r,asp:P.w/P.h,im:img,L:L,pieces:[],done:0,t0:0,t1:0,run:false,z:10,finished:false};
  layout();build();intro();
}
function layout(){
  var st=document.getElementById('pz-stage'),W=st.clientWidth,H=st.clientHeight,a=G.asp,bw,bh,bx,by,tx,ty,tw,th,land=W>H*1.05;
  if(land){bh=Math.min(H-20,W*0.56/a);bw=bh*a;bx=12;by=(H-bh)/2;tx=bx+bw+14;ty=10;tw=W-tx-10;th=H-20}
  else{var mh=(H-24)*(a<1?0.64:0.6);bw=Math.min(W-24,mh*a);bh=bw/a;bx=(W-bw)/2;by=10;tx=8;ty=by+bh+14;tw=W-16;th=H-ty-8}
  G.bw=bw;G.bh=bh;G.bx=bx;G.by=by;G.sw=bw/G.cols;G.sh=bh/G.rows;G.s=Math.min(G.sw,G.sh);G.pad=Math.max(G.sw,G.sh)*0.3;G.tray={x:tx,y:ty,w:tw,h:th};G.W=W;G.H=H;
  var bd=document.getElementById('pz-board');bd.style.cssText='left:'+bx+'px;top:'+by+'px;width:'+bw+'px;height:'+bh+'px';
  var tr=document.getElementById('pz-tray');tr.style.cssText='left:'+tx+'px;top:'+ty+'px;width:'+tw+'px;height:'+th+'px';
}
function draw(pc,shadow){
  var s=G.s,pad=G.pad,SW=G.sw+pad*2,SH=G.sh+pad*2,dpr=Math.min(2,window.devicePixelRatio||1),c=pc.el,x=c.getContext('2d'),img=G.im;
  c.width=Math.round(SW*dpr);c.height=Math.round(SH*dpr);c.style.width=SW+'px';c.style.height=SH+'px';
  x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,SW,SH);
  if(shadow){x.save();x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=s*0.12;x.shadowOffsetY=s*0.05;x.fillStyle='#000';x.fill(pc.path);x.restore()}
  x.save();x.clip(pc.path);x.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,pad-pc.c*G.sw,pad-pc.r*G.sh,G.bw,G.bh);
  var g=x.createLinearGradient(0,0,SW,SH);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.14)');x.fillStyle=g;x.fill(pc.path);x.restore();
  x.lineWidth=Math.max(1,s*0.025);x.strokeStyle=shadow?'rgba(255,255,255,.55)':'rgba(255,255,255,.18)';x.stroke(pc.path);
}
function build(){
  var R=G.rows,C=G.cols,H=[],V=[],r,c,st=document.getElementById('pz-stage');
  for(r=0;r<R;r++){H[r]=[];V[r]=[];for(c=0;c<C;c++){H[r][c]=Math.random()<.5?1:-1;V[r][c]=Math.random()<.5?1:-1}}
  for(r=0;r<R;r++)for(c=0;c<C;c++){
    var p2={row:r,col:c,t:r?-H[r-1][c]:0,b:r<R-1?H[r][c]:0,l:c?-V[r][c-1]:0,rt:c<C-1?V[r][c]:0};
    p2.path=piecePath({t:p2.t,r:p2.rt,b:p2.b,l:p2.l},G.sw,G.sh,G.pad);
    p2.el=document.createElement('canvas');p2.el.className='pz-pc';
    G.pieces.push(p2);
  }
  G.pieces.forEach(function(p){p.r=p.row;p.c=p.col;draw(p,true);p.hx=G.bx+p.col*G.sw-G.pad;p.hy=G.by+p.row*G.sh-G.pad;place(p,p.hx,p.hy);st.appendChild(p.el)});
}
function place(p,x,y){p.x=x;p.y=y;p.el.style.transform='translate3d('+x+'px,'+y+'px,0)'}
function scatter(){
  var T=G.tray,SW=G.sw+G.pad*2,SH=G.sh+G.pad*2,list=G.pieces.slice().sort(function(){return Math.random()-.5});
  list.forEach(function(p,i){
    var x=T.x+Math.random()*Math.max(1,T.w-SW)-G.pad*0.2,y=T.y+Math.random()*Math.max(1,T.h-SH);
    p.el.style.transition='transform .7s cubic-bezier(.2,.8,.2,1) '+(i*12)+'ms';place(p,x,y);p.el.style.zIndex=++G.z;
  });
  setTimeout(function(){G&&G.pieces.forEach(function(p){p.el.style.transition=''})},800+list.length*12);
}
function intro(){
  var cd=document.getElementById('pz-cd'),seq=['3','2','1','START!'],i=0;
  cd.innerHTML='<div class="pz-cd-in"><small>完成形をおぼえてね</small><b>'+LV[G.n].nm+'</b></div>';cd.className='pz-cd show';
  setTimeout(function step(){
    if(!G)return;
    if(i<seq.length){cd.innerHTML='<b class="pz-num'+(i===3?' go':'')+'">'+seq[i]+'</b>';i++;if(i===3)scatter();setTimeout(step,i===4?650:800);return}
    cd.className='pz-cd';G.run=true;G.t0=performance.now();tick();
  },1400);
}
function tick(){if(!G||!G.run)return;document.getElementById('pz-time').textContent=fmt(performance.now()-G.t0);requestAnimationFrame(tick)}

/* ドラッグ */
var drag=null;
function hit(ev){
  var st=document.getElementById('pz-stage'),R=st.getBoundingClientRect(),px=ev.clientX-R.left,py=ev.clientY-R.top,best=null,bz=-1;
  G.pieces.forEach(function(p){if(p.lock)return;var lx=px-p.x,ly=py-p.y;if(lx<0||ly<0||lx>G.sw+G.pad*2||ly>G.sh+G.pad*2)return;
    if(!testCtx.isPointInPath(p.path,lx,ly))return;var z=+p.el.style.zIndex||0;if(z>bz){bz=z;best=p}});
  // 指先は太いので、形の外でも近くのピースを拾う
  if(!best)G.pieces.forEach(function(p){if(p.lock)return;var cx=p.x+G.pad+G.sw/2,cy=p.y+G.pad+G.sh/2;if(Math.abs(px-cx)<G.sw*.6&&Math.abs(py-cy)<G.sh*.6){var z=+p.el.style.zIndex||0;if(z>bz){bz=z;best=p}}});
  return best&&{p:best,ox:px-best.x,oy:py-best.y,R:R};
}
document.addEventListener('pointerdown',function(ev){
  if(!G||!G.run||!ev.target.closest('#pz-stage'))return;
  var h=hit(ev);if(!h)return;ev.preventDefault();
  drag=h;drag.id=ev.pointerId;h.p.el.style.zIndex=++G.z;h.p.el.classList.add('drag');
},{passive:false});
document.addEventListener('pointermove',function(ev){
  if(!drag||ev.pointerId!==drag.id)return;ev.preventDefault();
  var x=ev.clientX-drag.R.left-drag.ox,y=ev.clientY-drag.R.top-drag.oy;
  x=Math.max(-G.pad,Math.min(G.W-G.sw-G.pad,x));y=Math.max(-G.pad,Math.min(G.H-G.sh-G.pad,y));place(drag.p,x,y);
},{passive:false});
function up(ev){
  if(!drag||ev.pointerId!==drag.id)return;var p=drag.p;drag=null;p.el.classList.remove('drag');
  if(Math.hypot(p.x-p.hx,p.y-p.hy)<G.s*0.32){
    p.lock=true;p.el.style.transition='transform .12s ease-out';place(p,p.hx,p.hy);p.el.style.zIndex=1;p.el.classList.add('lock');draw(p,false);
    setTimeout(function(){p.el.style.transition=''},150);
    try{navigator.vibrate&&navigator.vibrate(12)}catch(x){}
    spark(p.hx+G.pad+G.sw/2,p.hy+G.pad+G.sh/2);
    G.done++;var d=document.getElementById('pz-done');d.textContent=G.done;d.parentNode.classList.remove('bump');void d.offsetWidth;d.parentNode.classList.add('bump');
    if(G.done===G.cols*G.rows)finish();
  }
}
document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
function spark(x,y){var st=document.getElementById('pz-stage');if(!st)return;var s=document.createElement('div');s.className='pz-spark';s.style.left=x+'px';s.style.top=y+'px';
  for(var i=0;i<8;i++){var a=i/8*Math.PI*2;s.innerHTML+='<i style="--x:'+(Math.cos(a)*28).toFixed(0)+'px;--y:'+(Math.sin(a)*28).toFixed(0)+'px"></i>'}
  st.appendChild(s);setTimeout(function(){s.remove()},650)}

/* 完成 */
function finish(){
  G.run=false;G.finished=true;G.t1=performance.now()-G.t0;document.getElementById('pz-time').textContent=fmt(G.t1);
  document.getElementById('pz-board').classList.add('win');confetti();
  var b=document.createElement('div');b.className='pz-win';
  b.innerHTML='<div class="pz-win-in"><span class="pz-k">COMPLETE!!</span><b class="pz-wt">'+fmt(G.t1)+'</b><button type="button" class="pz-done-btn" data-pzform>🎉 完成！</button><small>押してランキングに登録しよう</small></div>';
  G.L.appendChild(b);
}
function form(){
  var w=G.L.querySelector('.pz-win');if(!w)return;
  var teams=RR.BLK.A.t.slice().concat(['保護者・応援','スタッフ・審判']);
  w.innerHTML='<form class="pz-form" id="pz-form"><span class="pz-k">'+LV[G.n].nm+'（'+LV[G.n].gr+'）</span><b class="pz-wt">'+fmt(G.t1)+'</b>'+
   '<label><span>なまえ <em>必須</em></span><input id="pz-name" maxlength="16" required autocomplete="nickname" value="'+e(lsg('rr-pz-name')||'')+'" placeholder="例：なかざわ"></label>'+
   '<label><span>チーム名 <small>（任意）</small></span><input id="pz-teamin" maxlength="24" list="pz-teams" value="'+e(lsg('rr-pz-team')||'')+'" placeholder="えらぶ or 入力"><datalist id="pz-teams">'+teams.map(function(t){return '<option value="'+e(t)+'">'}).join('')+'</datalist></label>'+
   '<button type="submit" class="pz-done-btn">ランキングに登録</button><p class="pz-msg" id="pz-msg"></p></form>';
  setTimeout(function(){var i=document.getElementById('pz-name');i&&!i.value&&i.focus()},50);
}
function submit(){
  if(G.sending)return;var nm=document.getElementById('pz-name').value.trim(),tm=document.getElementById('pz-teamin').value.trim(),msg=document.getElementById('pz-msg');
  if(!nm){msg.textContent='なまえを入れてください';return}
  lss('rr-pz-name',nm);lss('rr-pz-team',tm);G.sending=true;msg.textContent='登録中…';
  if(!RR.sb()){msg.textContent='通信できませんでした';G.sending=false;return}
  RR.sb().rpc('rr26_puzzle_add',{p_lv:G.n,p_name:nm,p_team:tm||null,p_ms:Math.round(G.t1)}).then(function(r){
    if(r.error)throw r.error;var id=r.data;myIds.push(id);lss('rr-pz-my',JSON.stringify(myIds.slice(-50)));lastId=id;
    return RR.sb().from('rr26_puzzle').select('id',{count:'exact',head:true}).eq('lv',G.n).lt('ms',Math.round(G.t1)).then(function(c){
      var rank=(c.count||0)+1,w=G.L.querySelector('.pz-win');
      w.innerHTML='<div class="pz-win-in"><span class="pz-k">'+LV[G.n].nm+' RANKING</span><b class="pz-rank">'+(rank<=3?['🥇','🥈','🥉'][rank-1]:'')+rank+'<small>位</small></b><b class="pz-wt sm">'+fmt(G.t1)+'</b><div class="pz-acts"><button type="button" class="pz-done-btn" data-pzrank>ランキングを見る</button><button type="button" class="pz-again" data-pzstart="'+G.n+'">もう一度あそぶ</button></div></div>';
      rkLv=G.n;loadRank(true);
    });
  }).catch(function(x){console.error(x);G.sending=false;msg.textContent='登録できませんでした。電波を確認してもう一度押してください'});
}
function close(){if(!G)return;G.run=false;G.L.remove();G=null;document.documentElement.classList.remove('pz-on');RR.render()}
function confetti(){
  var cv=document.createElement('canvas');cv.className='pz-conf';G.L.appendChild(cv);var W=cv.width=innerWidth,H=cv.height=innerHeight,x=cv.getContext('2d'),cols=['#F4C542','#C8102E','#0B7A3E','#fff','#12A4A0','#FFD66B'],P=[];
  for(var i=0;i<160;i++)P.push({x:W/2+(Math.random()-.5)*60,y:H*.45,vx:(Math.random()-.5)*14,vy:-Math.random()*16-4,r:Math.random()*6+3,c:cols[i%cols.length],a:Math.random()*6,va:(Math.random()-.5)*.4});
  var t=0;(function f(){if(!cv.isConnected)return;x.clearRect(0,0,W,H);P.forEach(function(p){p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()});if(++t<200)requestAnimationFrame(f);else cv.remove()})();
}

/* クリック */
var qArm=0;
document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-pzstart]');if(t){var n=+t.getAttribute('data-pzstart');if(G){G.L.remove();G=null}start(n);return}
  t=ev.target.closest('[data-pzrk]');if(t){rkLv=+t.getAttribute('data-pzrk');lss('rr-pz-lv',rkLv);RR.render();return}
  if(ev.target.closest('[data-pzq]')){if(G&&!G.finished&&Date.now()-qArm>2500){qArm=Date.now();var b=ev.target.closest('[data-pzq]');b.textContent='もう一度押すと終了';setTimeout(function(){b.isConnected&&(b.textContent='✕ やめる')},2500);return}close();return}
  if(ev.target.closest('[data-pzeye]')){document.getElementById('pz-peek').hidden=false;return}
  if(ev.target.closest('#pz-peek')){document.getElementById('pz-peek').hidden=true;return}
  if(ev.target.closest('[data-pzform]')){form();return}
  if(ev.target.closest('[data-pzrank]')){close();RR.setTab('game');RR.render();setTimeout(function(){var el=document.querySelector('.pz-rk li.hl');el&&el.scrollIntoView({block:'center',behavior:'smooth'})},200);return}
  t=ev.target.closest('[data-pzdel]');if(t&&RR.isAdmin()){var id=+t.getAttribute('data-pzdel');if(!window.confirm('このランキング記録を削除しますか？'))return;RR.rpc('rr26_puzzle_del',{p_rid:id}).then(function(r){if(r.error)throw r.error;loadRank(true)}).catch(function(x){console.error(x);RR.toast('削除できませんでした')});return}
});
document.addEventListener('submit',function(ev){if(ev.target.id==='pz-form'){ev.preventDefault();submit()}});
window.addEventListener('resize',function(){if(!G||G.done)return;/* 開始直後のみ再配置 */});
window.__pzG=function(){return G};
})();
