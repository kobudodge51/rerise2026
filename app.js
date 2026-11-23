(function(){
"use strict";
var CFG=window.PK_CONFIG||{};

/* ---------- 大会データ（対戦表・決勝トーナメント表と同じ） ---------- */
// 参加チーム（対戦表の番号順）
var BLK={
  A:{div:'OF',nm:'予選リーグ',t:["CHERUBIM","Thunder youth","Feujon Jr.","JOKER","獅子丸","DRAGON BALL®","Regends","ORACCHA","AK","Re:RISE"]}
};
var PREF={"AK":"大阪","ORACCHA":"富山","Thunder youth":"富山","獅子丸":"愛知","JOKER":"愛知","CHERUBIM":"愛知","DRAGON BALL®":"愛知","Feujon Jr.":"岐阜","Re:RISE":"長野","Regends":"新潟"};
var DIV={OF:{nm:'U-15部門',sh:'U-15',blocks:['A'],note:'全10チーム・1ブロック総当たり'}};
// 予選 [開始時刻, Aコート(左-右), Bコート(左-右)]　null＝キッチンカータイム
// 2026/11/23 当日版の進行表に合わせて更新
var PRE=[["9:50","A6-A8","A10-A2"],["9:59","A1-A4","A5-A9"],["10:08","A7-A3","A6-A2"],["10:17","A8-A4","A10-A9"],["10:26","A1-A3","A5-A7"],["10:35",null,"A6-A4"],["10:44",null,"A2-A9"],["10:53",null,"A8-A3"],["11:02",null,"A1-A5"],["11:11","A10-A7","A4-A3"],["11:20","A6-A9","A8-A5"],["11:29","A2-A7",null],["11:38","A10-A1",null],["11:47","A6-A3",null],["11:56","A9-A7",null],["12:05","A4-A5","A2-A1"],["12:14","A8-A10","A6-A7"],["12:23","A3-A5","A9-A1"],["12:32","A4-A10","A2-A8"],["12:41","A6-A5","A7-A1"],["13:50","A3-A10","A9-A8"],["13:59","A4-A2","A6-A1"],["14:08","A5-A10","A7-A8"],["14:17","A3-A2","A9-A4"],["14:26","A6-A10","A1-A8"],["14:35","A5-A2","A7-A4"],["14:44",null,"A3-A9"]];
var LUNCH_AFTER=20;
// 決勝トーナメント（全チーム上がり）。@＝予選順位、W:/L:＝その試合の勝者/敗者。sw＝表の上下を入れ替えて描く
var TOUR=[
 {id:'T1-A',row:1,a:'A@10',b:'A@8',r:'1回戦'},
 {id:'T1-B',row:1,a:'A@9',b:'A@7',r:'1回戦'},
 {id:'T2-A',row:2,a:'A@6',b:'A@3',r:'準々決勝'},
 {id:'T2-B',row:2,a:'A@4',b:'A@5',r:'準々決勝'},
 {id:'T3-A',row:3,a:'A@1',b:'W:T1-A',r:'準々決勝'},
 {id:'T3-B',row:3,a:'A@2',b:'W:T1-B',r:'準々決勝',sw:true},
 {id:'T4-A',row:4,a:'L:T1-A',b:'L:T2-A',r:'敗者戦'},
 {id:'T4-B',row:4,a:'L:T1-B',b:'L:T2-B',r:'敗者戦'},
 {id:'T5-A',row:5,a:'W:T3-A',b:'W:T2-A',r:'準決勝'},
 {id:'T5-B',row:5,a:'W:T2-B',b:'W:T3-B',r:'準決勝'},
 {id:'T6-A',row:6,a:'W:T5-A',b:'W:T5-B',r:'決勝戦',fin:true},
 {id:'T6-B',row:6,a:'L:T5-A',b:'L:T5-B',r:'3位決定戦'}];
var TD={};TOUR.forEach(function(t){t.div='OF';t.c=t.id.slice(-1);TD[t.id]=t});
var TTIME={1:'15:20',2:'15:29',3:'15:38',4:'15:47',5:'15:56',6:'16:05'};
var ROOT={OF:'T6-A'};
var NROW=6,FIN='T6-A',THIRD='T6-B';

function team(code){var m=/^([A-C])(\d+)$/.exec(code||'');return m&&BLK[m[1]]?BLK[m[1]].t[+m[2]-1]:null}
function blockOf(code){var m=/^([A-C])\d+$/.exec(code||'');return m?m[1]:null}
function divOf(code){var b=blockOf(code);return b?BLK[b].div:null}


/* ---------- 状態 ---------- */
var state={scores:{},adj:{}}, sb=null, cred=null, loaded=false, online=false, loadError='', VIS=null, lastSync='';
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return null}}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
try{cred=JSON.parse(ls('rr26-cred')||'null')}catch(e){cred=null}
var tab=ss('rr-tab')||'sched', filter=ls('rr-filter')||'', dview='', lview=ls('rr-ldiv')||'OF', tview=ls('rr-tdiv')||'OF', cursor=+(ss('rr-cursor')||0);
function isAdmin(){return !!cred}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function sc(k){var v=state.scores[k];return v&&typeof v.a==='number'&&typeof v.b==='number'?v:null}
function finalV(id){
  var sets=[1,2,3].map(function(i){return sc('t'+id+'s'+i)}),wa=0,wb=0;
  sets.forEach(function(v){var aw=winA(v);if(aw===true)wa++;else if(aw===false)wb++});
  if(!sets[0])return null;
  return {a:wa,b:wb,w:null,sets:sets,done:wa>=2||wb>=2};
}
function mv(m){if(m.fin){var f=finalV(m.id);return f&&f.done?f:null}return sc(m.key)}
function parseW(o){if(o&&typeof o.w==='string'&&o.w.indexOf('|')>0){var p=o.w.split('|');o.w=p[0];o.fa=+p[1];o.fb=+p[2]}return o}
function vf(v,side){return v&&v.a===v.b&&v.w&&v.fa!=null?'<span class="tie">'+v[side]+'</span><span class="fin">'+(side==='a'?v.fa:v.fb)+'</span>':null}
function winA(v){if(!v)return null;return v.a>v.b?true:v.b>v.a?false:(v.w==='a'?true:v.w==='b'?false:null)}

/* ---------- 計算 ---------- */
function prelims(){
  var out=[];
  PRE.forEach(function(r,i){[['A',r[1]],['B',r[2]]].forEach(function(c){if(!c[1])return;var p=c[1].split('-');
    out.push({key:'p'+(i+1)+c[0],kind:'pre',row:i+1,court:c[0],time:r[0],ca:p[0],cb:p[1],a:team(p[0]),b:team(p[1]),blk:blockOf(p[0]),div:divOf(p[0])})})});
  return out;
}
var PM=prelims();
function compute(){
  var st={},h2h={},cnt={},fin={};
  Object.keys(BLK).forEach(function(b){cnt[b]=0;fin[b]=0;BLK[b].t.forEach(function(n,i){st[b+(i+1)]={code:b+(i+1),n:n,b:b,p:0,w:0,l:0,d:0,pts:0,inn:0,opp:0}})});
  var played={OF:0,JR:0},total={OF:0,JR:0};
  PM.forEach(function(m){cnt[m.blk]++;total[m.div]++;var v=sc(m.key);if(!v)return;fin[m.blk]++;played[m.div]++;
    var a=st[m.ca],b=st[m.cb];a.p++;b.p++;a.inn+=v.a;a.opp+=v.b;b.inn+=v.b;b.opp+=v.a;
    if(v.a>v.b){a.w++;b.l++}else if(v.b>v.a){b.w++;a.l++}else{a.d++;b.d++}
    h2h[m.ca+'|'+m.cb]=[v.a,v.b];h2h[m.cb+'|'+m.ca]=[v.b,v.a]});
  Object.keys(st).forEach(function(k){var r=st[k];r.pts=r.w*2+r.d});
  function base(x,y){return (y.pts-x.pts)||(y.inn-x.inn)||(x.opp-y.opp)}
  function hh(x,y){var r=h2h[x.code+'|'+y.code];return r&&r[0]!==r[1]?(r[0]>r[1]?-1:1):0}
  var lg={},seed={},bdone={};
  Object.keys(BLK).forEach(function(b){
    var arr=BLK[b].t.map(function(_,i){return st[b+(i+1)]});
    arr.sort(function(x,y){return base(x,y)||hh(x,y)||((+state.adj[y.code]||0)-(+state.adj[x.code]||0))||(x.code<y.code?-1:1)});
    arr.forEach(function(r,i){r.rank=i+1;r.tied=r.p>0&&arr.some(function(o){return o!==r&&!base(o,r)&&!hh(o,r)})});
    bdone[b]=cnt[b]>0&&fin[b]===cnt[b];
    if(bdone[b])arr.forEach(function(r,i){seed[b+'@'+(i+1)]=r.code});
    lg[b]=arr;
  });
  var T={};
  function res(code){
    if(!code)return null;
    if(/@/.test(code))return seed[code]?team(seed[code]):null;
    var m=/^([WL]):([\w-]+)$/.exec(code);if(m){var t=T[m[2]];return t?(m[1]==='W'?t.win:t.lose)||null:null}
    return null;
  }
  TOUR.forEach(function(d){var o={id:d.id,d:d,a:res(d.a),b:res(d.b),v:d.fin?mv({fin:true,id:d.id}):sc('t'+d.id)};
    if(o.a&&o.b&&o.v){var aw=winA(o.v);if(aw!==null){o.aw=aw;o.win=aw?o.a:o.b;o.lose=aw?o.b:o.a}}
    T[d.id]=o});
  return {st:st,lg:lg,bdone:bdone,T:T,played:played,total:total,h2h:h2h};
}
function seedLabel(code){
  if(!code)return '';
  var m=/^([A-C])@(\d+)$/.exec(code);if(m)return '予選'+m[2]+'位';
  m=/^([WL]):([\w-]+)$/.exec(code);if(m)return m[2]+'の'+(m[1]==='W'?'勝者':'敗者');
  return code;
}

function tourMatches(C){return TOUR.map(function(d){var t=C.T[d.id];return {key:'t'+d.id,kind:'tour',id:d.id,row:d.row,court:d.c,time:TTIME[d.row]||'',a:t.a,b:t.b,pa:seedLabel(d.a),pb:seedLabel(d.b),div:d.div,r:d.r,fin:d.fin}})}

/* ---------- 部品 ---------- */
var GAME_ON=true;
var ICON={
  game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3.2a2.3 2.3 0 1 1 4.6 0H15v3.2a2.3 2.3 0 1 1 0 4.6V20H4z"/><path d="M15 8h5v12h-5"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9 17h6"/></svg>',
  spon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-5 9 5v12"/><path d="M8 21v-6h8v6M3 21h18"/></svg>',
  bingo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><circle cx="12" cy="12" r="3.2"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>',
  sched:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 14h3M13.5 14h3M7.5 17.5h3"/></svg>',
  league:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M3 14.5h18M9 4v16"/></svg>',
  tour:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h3v9H8M11 12h4"/><path d="M15 9h6v6h-6z"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l2.4 3.6 4.2-.4-1.4 4 3 3-4 1.3-.6 4.2-3.6-2.3-3.6 2.3-.6-4.2-4-1.3 3-3-1.4-4 4.2.4z"/><path d="M12 10v4"/></svg>',
  entry:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4.5h-4.5"/></svg>'
};
function daysLeft(){var now=new Date(),d=new Date(2026,10,23);var t=new Date(now.getFullYear(),now.getMonth(),now.getDate());return Math.round((d-t)/864e5)}
function countChip(){var n=daysLeft();if(n>0)return '<span class="count">大会まで あと<b>'+n+'</b>日</span>';if(n===0)return '<span class="count">🎄 本日開催！</span>';return '<span class="count">ご来場ありがとうございました</span>'}
function stars(){var p=[[8,12],[22,8],[40,15],[62,6],[80,14],[92,30],[88,62],[70,88],[50,92],[14,80],[6,52],[30,40]],h='';p.forEach(function(q,i){h+='<i style="left:'+q[0]+'%;top:'+q[1]+'%;animation-delay:-'+(i*0.37).toFixed(2)+'s"></i>'});return h}
function cover(){
  return '<section class="cover" aria-label="大会表紙"><div class="rr-ttl"><small>第4回</small><b>Re:RISE CUP</b><span>2026</span></div>'+
   '<div class="art"><img src="img/cover.webp" alt="第4回 2026 Re:RISE CUP 表紙（ケツァールとクリスマスツリー）" width="967" height="1373">'+stars()+'</div>'+countChip()+
   '<dl><dt>開催日</dt><dd>2026年11月23日（月・祝）</dd><dt>会場</dt><dd>飯田市鼎体育館（長野県飯田市）</dd><dt>部門</dt><dd>U-15部門 全10チーム</dd><dt>主催</dt><dd>飯田DBC Re:RISE／Re:RISE CUP 実行委員会</dd></dl></section>';
}

function teamOpts(){
  return '<option value="">全チームを表示</option>'+Object.keys(BLK).map(function(b){return '<optgroup label="'+DIV[BLK[b].div].sh+' '+BLK[b].nm+'">'+BLK[b].t.map(function(n){return '<option'+(filter===n?' selected':'')+'>'+esc(n)+'</option>'}).join('')+'</optgroup>'}).join('');
}
function seg(id,cur,items){return '<div class="seg" role="group">'+items.map(function(it){return '<button type="button" data-seg="'+id+'" data-v="'+it[0]+'" class="'+it[0].toLowerCase()+'" aria-pressed="'+(cur===it[0])+'">'+it[1]+'</button>'}).join('')+'</div>'}

/* ---------- 試合進行 ---------- */
var PFK={'大阪':'osaka','富山':'toyama','愛知':'aichi','岐阜':'gifu','長野':'nagano','新潟':'niigata'};
function prefChip(n){var p=PREF[n];return p?'<i class="pfc pf-'+PFK[p]+'">'+p+'</i>':''}
function rowHTML(name,ph,code,s,w,ex){return '<div class="row'+(w?' w':'')+(filter&&name===filter?' hl':'')+'"><span class="tn'+(name?'':' ph')+'">'+(code?'<small>'+esc(code)+'</small>':'')+(name?'<span class="nm'+(name.length>=11?' lg':'')+'">'+esc(name)+'</span>'+prefChip(name):esc(ph))+'</span><span class="sc">'+(s==null?'–':s)+(ex||'')+'</span></div>'}
function matchHTML(m,now){
  if(!m)return '<div class="match empty">－</div>';
  var fv=m.fin?finalV(m.id):null,v=m.fin?(fv?{a:fv.a,b:fv.b,w:null}:null):mv(m),aw=m.fin&&!(fv&&fv.done)?null:winA(v);
  var inv=(filter&&!(m.a===filter||m.b===filter))||(dview&&m.div!==dview);
  var vp=function(s){return v&&v.a===v.b&&v.w===s?'<small class="vp">V</small>':''};
  var tag=m.kind==='pre'?'予選リーグ':m.r;
  return '<div class="match'+(m.court==='B'?' cb':'')+(inv?' dim':'')+(now?' now':'')+'"><div class="tags"><span class="dv '+m.div+'">'+DIV[m.div].sh+'</span><span class="bk">'+esc(tag)+(m.kind==='tour'?'（'+m.id+'）':'')+'</span>'+(now?'<span class="pill">次の試合</span>':'')+'</div>'+
    rowHTML(m.a,m.pa,m.kind==='pre'?m.ca.slice(1):'',v?(vf(v,'a')||v.a):null,aw===true,vp('a'))+rowHTML(m.b,m.pb,m.kind==='pre'?m.cb.slice(1):'',v?(vf(v,'b')||v.b):null,aw===false,vp('b'))+
    (v&&v.a===v.b&&!v.w&&!m.fin?'<div class="ref">引き分け</div>':'')+(v&&!m.fin&&v.a===v.b&&v.w?'<div class="ref">時間終了 '+v.a+'-'+v.b+' → Vポイント'+(v.fa!=null?' → 最終 '+v.fa+'-'+v.fb:'')+'（'+esc(v.w==='a'?m.a:m.b)+' の勝ち）</div>':'')+(m.fin?(fv?'<div class="setmini">'+fv.sets.map(function(x,i){if(!x)return '';var tie=x.a===x.b&&x.fa!=null;return '<span><em>第'+(i+1)+'セット</em>'+(tie?'<s>'+x.a+'-'+x.b+'</s> ':'')+(tie?x.fa+'-'+x.fb:x.a+'-'+x.b)+(x.a===x.b&&x.w?' <i>V</i>':'')+'</span>'}).join('')+'</div>':'')+(fv?'<div class="setbox"><div class="st-h"><span>セット</span><b>第1</b><b>第2</b><b>第3</b><b class="tot">取得</b></div>'+['a','b'].map(function(sd){var nm=sd==='a'?m.a:m.b;return '<div class="st-r"><span>'+esc(nm||(sd==='a'?m.pa:m.pb)||'')+'</span>'+[0,1,2].map(function(i){var x=fv&&fv.sets[i];if(!x)return '<b class="na">–</b>';var wa=winA(x),won=(sd==='a')===wa&&wa!==null;var tie=x.a===x.b&&x.fa!=null;return '<b class="'+(won?'won':'')+'">'+(tie?'<s>'+x[sd]+'</s>'+(sd==='a'?x.fa:x.fb):x[sd])+(won&&x.a===x.b&&x.w?'<i>V</i>':'')+'</b>'}).join('')+'<b class="tot">'+(fv?fv[sd]:'–')+'</b></div>'}).join('')+'</div>':'')+'<p class="setnote">5分3セットマッチ・2セット先取'+(fv&&!fv.done?'（試合中）':'')+'</p>':'')+'</div>';
}
function nextKeys(all){var n={};['A','B'].forEach(function(c){for(var i=0;i<all.length;i++){var m=all[i];if(m.court===c&&m.a&&m.b&&!mv(m)){n[m.key]=1;break}}});return n}
function kcCell(){return '<div class="match empty kc-slot"><span>🍴 キッチンカータイム</span><small>このコートの審判さん、キッチンカーをご利用ください</small></div>'}
function viewSched(C){
  var tm=tourMatches(C),all=PM.concat(tm),nx=nextKeys(all);
  var h='<div style="display:grid;gap:8px"><h2>試合進行表</h2><p class="note">5分1セットマッチ（決勝のみ3セットマッチ）・全試合ランニングタイム制。数字は試合終了時の内野人数です。左右はオフィシャル席から見た並びです。</p>'+
    '<select id="team-filter" class="sel" aria-label="チームで絞り込む">'+teamOpts()+'</select></div>';
  h+='<div class="courthead" aria-hidden="true"><span class="a">Aコート</span><span class="b">Bコート</span></div>';
  h+='<div class="stagehead"><span>予選リーグ（全45試合）</span></div>';
  function show(list){if(!filter)return true;return list.some(function(m){return m&&(m.a===filter||m.b===filter)})}
  PRE.forEach(function(r,i){
    var A=PM.filter(function(m){return m.row===i+1&&m.court==='A'})[0]||null,B=PM.filter(function(m){return m.row===i+1&&m.court==='B'})[0]||null;
    if(show([A,B]))h+='<section class="slot"><div class="slot-h"><span class="time">'+(r[0]||'')+'</span><span class="lbl">予選 第'+(i+1)+'試合</span></div><div class="courts">'+(A?matchHTML(A,nx[A.key]):kcCell())+(B?matchHTML(B,nx[B.key]):kcCell())+'</div></section>';
    if(i+1===LUNCH_AFTER)h+='<div class="break"><div>🍙 昼休憩（1時間）<small>12:50頃〜13:50　キッチンカーは大変混雑します</small></div></div>';
  });
  h+='<div class="break"><div>🎄 クリスマスイベント（27分）<small>予選リーグの順位で、決勝トーナメントの組み合わせが決まります（全チーム出場）</small></div></div>';
  h+='<div class="stagehead"><span>決勝トーナメント</span></div>';
  for(var r=1;r<=NROW;r++){
    var A=tm.filter(function(m){return m.row===r&&m.court==='A'})[0]||null,B=tm.filter(function(m){return m.row===r&&m.court==='B'})[0]||null;
    if(!show([A,B]))continue;
    h+='<section class="slot"><div class="slot-h"><span class="time">'+(TTIME[r]||'')+'</span><span class="lbl">'+(r===NROW?'決勝戦（A：16:05・16:14・16:23）／3位決定戦（B）':'決勝T 第'+r+'試合・'+A.r)+'</span></div><div class="courts">'+matchHTML(A,A&&nx[A.key])+matchHTML(B,B&&nx[B.key])+'</div></section>';
  }
  h+='<div class="break"><div>🏆 表彰式・閉会式（16:40〜）<small>表彰：優勝・準優勝・3位</small></div></div>';
  return h;
}
function adjBtn(code){var a=+state.adj[code]||0;return '<span class="adj"><button type="button" class="mini" data-adj="'+code+'" data-d="0.1">上にする</button>'+(a?'<button type="button" class="mini" data-adj="'+code+'" data-d="0">戻す</button>':'')+'</span>'}
function viewLeague(C){
  var d='OF',D=DIV[d];
  var h='<div style="display:grid;gap:8px"><h2>予選リーグ</h2>'+
   '<p class="note">'+D.nm+'（'+D.note+'）：'+C.played[d]+' / '+C.total[d]+' 試合終了。勝ち2点・引き分け1点・負け0点。勝点が同じときは ①内野人数の合計が多い ②相手の内野人数の合計が少ない ③直接対戦の勝者 の順で並べています（正式な順位は本部の発表に従います）。決勝トーナメントは全チームが出場します。</p></div>';
  D.blocks.forEach(function(b){
    var arr=C.lg[b],n=arr.length,nums='①②③④⑤⑥⑦⑧⑨⑩';
    h+='<div class="card"><h3>順位表'+(C.bdone[b]?'<span class="done">確定</span>':'')+'</h3><div class="tbl-wrap"><table><colgroup><col style="width:14%"><col style="width:34%"><col><col><col><col style="width:10%"><col style="width:10%"><col style="width:11%"></colgroup><thead><tr><th>順位</th><th class="name">チーム</th><th>勝</th><th>分</th><th>負</th><th>勝点</th><th>内野</th><th>相手<br>内野</th></tr></thead><tbody>'+
     arr.map(function(r){var on=r.p>0;return '<tr><td class="rk'+(on&&r.rank===1?' rk1':'')+'"><span class="rkn">'+(on?r.rank:'–')+'</span>'+prefChip(r.n)+'</td><td class="name"><span class="no">'+r.code.slice(1)+'</span><span class="lnm'+(r.n.length>=11?' lg':'')+'">'+esc(r.n)+'</span>'+(r.tied?'<span class="tie">同点・本部判断</span>':'')+(isAdmin()&&r.tied?adjBtn(r.code):'')+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td><b>'+r.pts+'</b></td><td>'+r.inn+'</td><td>'+r.opp+'</td></tr>'}).join('')+'</tbody></table></div></div>';
    var ts=BLK[b].t;
    h+='<div class="card"><h3>星取表</h3><div class="tbl-wrap"><table class="mx mx10"><colgroup><col style="width:22%">'+ts.map(function(){return '<col>'}).join('')+'</colgroup><thead><tr><th class="name">対戦</th>'+ts.map(function(_,i){return '<th>'+nums[i]+'</th>'}).join('')+'</tr></thead><tbody>'+
     ts.map(function(a,i){var ca=b+(i+1);return '<tr><td class="name"><span class="no">'+nums[i]+'</span>'+esc(a)+'</td>'+ts.map(function(_,j){var cb=b+(j+1);if(i===j)return '<td class="diag"></td>';var v=C.h2h[ca+'|'+cb];return v?'<td><span class="'+(v[0]>v[1]?'o':v[0]<v[1]?'x':'d')+'">'+(v[0]>v[1]?'〇':v[0]<v[1]?'×':'△')+'</span><small>'+v[0]+'-'+v[1]+'</small></td>':'<td><small>–</small></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>';
  });
  return h;
}

/* ---------- 決勝トーナメント（SVG） ---------- */
function est(s,z){var l=0;String(s).split('').forEach(function(c){l+=c.charCodeAt(0)>255?z*1.02:(/[A-Z0-9]/.test(c)?z*0.66:z*0.56)});return l}
function fitText(x,y,t,z,maxw,cls,anchor){var s=z;while(s>5.5&&est(t,s)>maxw)s-=0.25;return '<text x="'+x+'" y="'+y+'" font-size="'+s+'"'+(anchor?' text-anchor="'+anchor+'"':'')+(cls?' class="'+cls+'"':'')+'>'+esc(t)+'</text>'}
function line(p,k){if(k==='lose')k=null;var col=k==='win'?'var(--path-win)':k==='lose'?'var(--path-lose)':'var(--path-none)';return '<polyline'+(k==='win'?' class="glow" style="color:'+col+'"':'')+' points="'+p+'" fill="none" stroke="'+col+'" stroke-width="'+(k==='win'?4.5:k==='lose'?3:1.6)+'" stroke-linejoin="round" stroke-linecap="round"/>'}
function stag(x,y,v){return '<rect class="scbg" x="'+(x-9)+'" y="'+(y-11)+'" width="18" height="14" rx="3"/><text x="'+x+'" y="'+(y)+'" font-size="10" text-anchor="middle" class="sct">'+v+'</text>'}
function bracket(C,div){
  var T=C.T,root=ROOT[div];
  function kids(d){var x=build(d.a),y=build(d.b);x.side='a';y.side='b';return d.sw?[y,x]:[x,y]}
  function build(code){var m=/^W:([\w-]+)$/.exec(code);if(m){var d=TD[m[1]];return {id:m[1],k:kids(d)}}return {seed:code}}
  var tree={id:root,k:kids(TD[root])};
  var leaves=[];(function walk(n){if(n.seed)leaves.push(n);else n.k.forEach(walk)})(tree);
  function ht(n){return n.seed?0:1+Math.max(ht(n.k[0]),ht(n.k[1]))}
  var RORD=['1回戦','準々決勝','準決勝','決勝戦'],used=[];(function u(n){if(n.seed)return;var r=TD[n.id].r;if(used.indexOf(r)<0)used.push(r);n.k.forEach(u)})(tree);used.sort(function(a,b){return RORD.indexOf(a)-RORD.indexOf(b)});
  var H=used.length,W=360,boxW=112,champW=70,colW=(W-boxW-champW-26)/H,gap=40,top=12;
  leaves.forEach(function(l,i){l.y=top+18+i*gap});
  (function pos(n){if(n.seed){n.x=boxW;return}n.k.forEach(pos);n.y=(n.k[0].y+n.k[1].y)/2;n.x=boxW+(used.indexOf(TD[n.id].r)+1)*colW})(tree);
  var h='';
  // 線
  (function draw(n){if(n.seed)return;var t=T[n.id];
    n.k.forEach(function(kid,i){var side=kid.side,k=null;
      if(t&&t.aw!==undefined)k=((side==='a')===t.aw)?'win':'lose';
      h+=line(kid.x+','+kid.y+' '+n.x+','+kid.y+' '+n.x+','+n.y,k);
      if(t&&t.v){var tv=t.v;if(tv.a===tv.b&&tv.w&&tv.fa!=null){var vo=tv.w===side?10:0;h+=stag(n.x-12-vo,kid.y-3,side==='a'?tv.fa:tv.fb)+'<text x="'+(n.x-27-vo)+'" y="'+(kid.y-3)+'" font-size="9.5" text-anchor="middle" class="sct2x">'+tv[side]+'</text><line x1="'+(n.x-32-vo)+'" y1="'+(kid.y-1)+'" x2="'+(n.x-22-vo)+'" y2="'+(kid.y-12)+'" class="slash"/>'}else h+=stag(n.x-12,kid.y-3,tv[side]);if(!TD[n.id].fin&&t.v.a===t.v.b&&t.v.w===side)h+='<text x="'+(n.x-2)+'" y="'+(kid.y-3)+'" font-size="11" text-anchor="end" class="vtx">V</text>'}
      draw(kid)});
    h+='<text x="'+(n.x+4)+'" y="'+(n.y+12)+'" font-size="8.5" class="sub">'+n.id+'</text>';
  })(tree);
  var rt=T[root];
  h+=line(tree.x+','+tree.y+' '+(W-champW-2)+','+tree.y,rt&&rt.win?'win':null);
  // 出場チームの枠
  leaves.forEach(function(l){var nmv=null,m=/^([A-C])@(\d+)$/.exec(l.seed),code=null;
    if(m){var ty=C.lg[m[1]];if(C.bdone[m[1]]){var r=ty[+m[2]-1];nmv=r.n;code=r.code}}
    var won=false;(function f(n){if(n.seed)return;var t=T[n.id];if(t&&t.win===nmv&&nmv)won=true;n.k.forEach(f)})(tree);
    h+='<rect class="box'+(nmv?' on':'')+(rt&&rt.win&&rt.win===nmv?' won':'')+'" x="2" y="'+(l.y-15)+'" width="'+(boxW-4)+'" height="30" rx="7"/>'+
      '<text x="9" y="'+(l.y-4)+'" font-size="8" class="sub">'+esc(seedLabel(l.seed))+'</text>'+fitText(9,l.y+10,nmv||'未確定',nmv?11:9.5,boxW-16,nmv?'':'sub')});
  // 優勝
  var cy=tree.y;
  h+='<rect class="champ" x="'+(W-champW)+'" y="'+(cy-22)+'" width="'+champW+'" height="44" rx="9"/><text x="'+(W-champW/2)+'" y="'+(cy-7)+'" font-size="9.5" text-anchor="middle" class="champtx">🏆 優勝</text>'+fitText(W-champW/2,cy+11,rt&&rt.win?rt.win:'—',11.5,champW-8,'champtx','middle');
  h+='<rect class="runner" x="'+(W-champW)+'" y="'+(cy+28)+'" width="'+champW+'" height="40" rx="9"/><text x="'+(W-champW/2)+'" y="'+(cy+42)+'" font-size="9" text-anchor="middle" class="runtx">🥈 準優勝</text>'+fitText(W-champW/2,cy+59,rt&&rt.lose?rt.lose:'—',11,champW-8,'runtx','middle');
  var fv=finalV(root);if(fv){h+='<text x="'+(W-champW/2)+'" y="'+(cy+82)+'" font-size="8.5" text-anchor="middle" class="sub">決勝 各セット</text>';fv.sets.forEach(function(x,i){if(x)h+='<text x="'+(W-champW/2)+'" y="'+(cy+95+i*11)+'" font-size="9" text-anchor="middle" class="setx">'+(i+1)+') '+x.a+'-'+x.b+(x.a===x.b&&x.fa!=null?'→'+x.fa+'-'+x.fb:'')+(x.a===x.b&&x.w?' V':'')+'</text>'})}
  var hgt=Math.max(top+18+(leaves.length-1)*gap+26,cy+95+(fv?33:0));
  var tp=TOUR.filter(function(d){return d.div===div&&d.r==='3位決定戦'})[0];
  if(tp){var t3=T[tp.id],y0=hgt+26,ya=y0+22,yb=ya+gap,xm=boxW+colW*1.2,ym=(ya+yb)/2;
    h+='<line x1="4" y1="'+(y0-14)+'" x2="'+(W-4)+'" y2="'+(y0-14)+'" class="sep3"/><text x="4" y="'+(y0)+'" font-size="11" class="t3h">🥉 3位決定戦（'+tp.id+'）</text>';
    [['a',ya,tp.a],['b',yb,tp.b]].forEach(function(q){var nm=t3&&t3[q[0]],k=t3&&t3.aw!==undefined?(((q[0]==='a')===t3.aw)?'win':'lose'):null;
      h+=line(boxW+','+q[1]+' '+xm+','+q[1]+' '+xm+','+ym,k);
      if(t3&&t3.v){var tv=t3.v;if(tv.a===tv.b&&tv.w&&tv.fa!=null){var vo=tv.w===q[0]?10:0;h+=stag(xm-12-vo,q[1]-3,q[0]==='a'?tv.fa:tv.fb)+'<text x="'+(xm-27-vo)+'" y="'+(q[1]-3)+'" font-size="9.5" text-anchor="middle" class="sct2x">'+tv[q[0]]+'</text><line x1="'+(xm-32-vo)+'" y1="'+(q[1]-1)+'" x2="'+(xm-22-vo)+'" y2="'+(q[1]-12)+'" class="slash"/>'}else h+=stag(xm-12,q[1]-3,tv[q[0]]);if(tv.a===tv.b&&tv.w===q[0])h+='<text x="'+(xm-2)+'" y="'+(q[1]-3)+'" font-size="11" text-anchor="end" class="vtx">V</text>'}
      h+='<rect class="box'+(nm?' on':'')+'" x="2" y="'+(q[1]-15)+'" width="'+(boxW-4)+'" height="30" rx="7"/><text x="9" y="'+(q[1]-4)+'" font-size="8" class="sub">'+esc(seedLabel(q[2]).replace('の敗者','（準決勝）の敗者'))+'</text>'+fitText(9,q[1]+10,nm||'未確定',nm?11:9.5,boxW-16,nm?'':'sub')});
    h+=line(xm+','+ym+' '+(W-champW-2)+','+ym,t3&&t3.win?'win':null)+'<text x="'+(xm+4)+'" y="'+(ym+12)+'" font-size="8.5" class="sub">'+tp.id+'</text>';
    h+='<rect class="third" x="'+(W-champW)+'" y="'+(ym-20)+'" width="'+champW+'" height="40" rx="9"/><text x="'+(W-champW/2)+'" y="'+(ym-6)+'" font-size="9" text-anchor="middle" class="thtx">🥉 第3位</text>'+fitText(W-champW/2,ym+11,t3&&t3.win?t3.win:'—',11,champW-8,'thtx','middle');
    hgt=yb+24}
  return '<svg class="bk" viewBox="0 0 '+W+' '+hgt+'" role="img" aria-label="'+DIV[div].nm+'の決勝トーナメント表">'+h+'</svg>';
}
function podium(C){
  var f=C.T[FIN],t=C.T[THIRD],rows=[['p1','優勝',f.win],['p2','準優勝',f.lose],['p3','第3位',t.win],['','第4位',t.lose]];
  return '<ol class="podium">'+rows.map(function(r){return '<li class="'+r[0]+'"><span class="pl">'+r[1]+'</span><span>'+(r[2]?esc(r[2]):'<span class="ph">未確定</span>')+'</span></li>'}).join('')+'</ol>';
}
function pf(n){return n&&PREF[n]?'<small class="pf">（'+PREF[n]+'）</small>':''}
function champBox(label,name,pref){var sp='';for(var i=0;i<10;i++)sp+='<i style="left:'+(5+i*9.5)+'%;top:'+(i%2?18:70)+'%;animation-delay:-'+(i*.31).toFixed(2)+'s"></i>';
  return '<div class="rc"><div class="rc-sp">'+sp+'</div><div class="rc-crown">👑</div><small>'+label+'</small><b>'+(name?esc(name):'未確定')+'</b>'+(pref?'<em>'+pref+'</em>':'')+'</div>'}
function rmatch(m){
  if(!m)return '';var fv=m.fin?finalV(m.id):null,v=m.fin?(fv?{a:fv.a,b:fv.b}:null):mv(m),aw=m.fin&&!(fv&&fv.done)?null:winA(v);
  function row(nm,sd){var w=(sd==='a')===aw&&aw!==null,val=v?(m.fin?v[sd]:(vf(v,sd)||v[sd])):'–';return '<div class="rm-r'+(w?' w':'')+'"><span>'+esc(nm||(sd==='a'?m.pa:m.pb)||'')+'</span><b>'+val+(w&&v&&!m.fin&&v.a===v.b&&v.w?'<i class="rv">V</i>':'')+'</b></div>'}
  return '<div class="rm"><div class="rm-h">'+esc(m.r)+'<span>'+m.id+'</span></div>'+row(m.a,'a')+row(m.b,'b')+(fv?'<div class="rm-s">'+fv.sets.map(function(x,i){if(!x)return '';var tie=x.a===x.b&&x.fa!=null;return '<span>'+(i+1)+'S '+(tie?'<s>'+x.a+'-'+x.b+'</s>'+x.fa+'-'+x.fb+'V':x.a+'-'+x.b)+'</span>'}).join('')+'</div>':'')+'</div>'}
function viewResult(C){
  var tm=tourMatches(C),byId={};tm.forEach(function(m){byId[m.id]=m});
  var f=C.T[FIN],t=C.T[THIRD],ch=f.win,done=!!ch;
  var h=cover()+'<section class="rs-hero"><span class="rs-k">'+(done?'FINAL RESULT':'RESULT')+'</span><h2>🏆 '+(done?'最終結果':'大会結果')+'</h2><p>第4回 2026 Re:RISE CUP（U-15部門）</p></section>';
  if(!done)h+='<p class="note" style="text-align:center">決勝戦が終わると、ここに最終結果が表示されます。</p>';
  var rows=[['p2','準優勝',f.lose],['p3','3位',t.win],['p4','4位',t.lose]];
  h+='<section class="rs-col rs-one">'+champBox('優勝',ch,ch&&PREF[ch]?PREF[ch]+(PREF[ch]==='大阪'?'府':'県'):'');
  h+='<ol class="rs-pod">'+rows.map(function(r){return '<li class="'+r[0]+'"><span class="pl">'+r[1]+'</span><b>'+(r[2]?esc(r[2])+pf(r[2]):'<span class="ph">未確定</span>')+'</b></li>'}).join('')+'</ol>';
  h+='<div class="rm-list">'+['T5-A','T5-B','T6-B','T6-A'].map(function(id){return rmatch(byId[id])}).join('')+'</div></section>';
  return h;
}
function viewTour(C){
  var d='OF';
  var h='<div style="display:grid;gap:8px"><h2>決勝トーナメント</h2>'+
   '<p class="note">予選リーグの順位で全10チームが出場します（予選7〜10位は1回戦から）。1回戦と準々決勝（T2）で負けたチーム同士で敗者戦（T4）を行います。準決勝で負けた2チームで3位決定戦（T6-B）を行います。決勝戦までは5分1セット、決勝戦は5分3セットマッチ（2セット先取）。同数のときは延長Vポイントで決めます。</p>'+
   '<div class="legend"><span><i style="background:var(--path-win)"></i>勝ち上がり</span><span><small class="vp">V</small> Vポイントで勝利</span></div></div>';
  h+='<div class="card"><h3>最終順位</h3>'+podium(C)+'</div>';
  h+='<div class="card"><h3>トーナメント表</h3>'+bracket(C,d)+'</div>';
  var tm=tourMatches(C);
  h+='<div class="tlist">'+tm.map(function(m){return '<div class="slot"><div class="slot-h"><span class="time">'+(m.time||'')+'</span><span class="lbl">'+m.court+'コート '+esc(m.r)+'</span></div>'+matchHTML(m,false)+'</div>'}).join('')+'</div>';
  return h;
}

/* ---------- 要項 ---------- */
function viewInfo(){
  function ul(a){return '<ul class="rules">'+a.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>'}
  return cover()+
  '<div class="card"><h2>大会の目的</h2><p class="note" style="font-size:14px;color:var(--ink)">各ブロックの中心となるここ長野県で、日頃対戦することが難しいチームの皆さんと交流を深め、U-15部門の更なる普及とマナー向上を目的に大会を開催します。</p></div>'+
  '<div class="card"><h2>当日の流れ</h2><ol class="flow">'+
   [['8:30','入場・受付',''],['8:50','練習 前半','AK・獅子丸・Thunder youth・Feujon Jr.・ORACCHA'],['9:00','練習 後半','DRAGON BALL®・CHERUBIM・JOKER・Regends・Re:RISE'],['9:00','監督会議・審判会議','監督会議はAコート、審判会議はBコート'],['9:10','開会式',''],['9:20','リレーイベント',''],['9:50','予選リーグ開始','Aコート・Bコートで同時進行（全45試合）'],['12:50頃','昼休憩（1時間）',''],['13:50','予選リーグ再開',''],['14:53頃','クリスマスイベント（27分）',''],['15:20','決勝トーナメント開始','決勝戦は16:05〜（3セットマッチ）'],['16:40','表彰式・閉会式','表彰：優勝・準優勝・3位']].map(function(r){return '<li><b>'+r[0]+'</b><span>'+r[1]+(r[2]?'<small>'+r[2]+'</small>':'')+'</span></li>'}).join('')+'</ol></div>'+
  '<div class="card"><h2>会場</h2><dl class="info"><dt>会場</dt><dd>飯田市鼎体育館</dd><dt>住所</dt><dd>長野県飯田市鼎（かなえ）中平1339-5<br><a href="https://www.google.com/maps/search/?api=1&query=%E9%A3%AF%E7%94%B0%E5%B8%82%E9%BC%8E%E4%BD%93%E8%82%B2%E9%A4%A8" target="_blank" rel="noopener">Googleマップで開く ↗</a></dd><dt>電話</dt><dd><a href="tel:0265520884">0265-52-0884</a></dd><dt>飲食</dt><dd>体育館の座席、または隣の「鼎文化センター」3階会議室をご利用ください（ゴミ箱・エアコンあり）。<b>アリーナ・ステージでの飲食は禁止</b>です。</dd></dl></div>'+
  '<div class="card"><h2>会場案内図（1階）</h2><a class="seat" href="img/venue.webp" target="_blank" rel="noopener"><img src="img/venue.webp" alt="飯田市鼎体育館 1階の会場案内図（Aコート・Bコート、各チーム席、本部、試合待機場所）" loading="lazy" width="980" height="1255"></a><p class="note">画像を押すと大きく表示できます。</p>'+
   ul(['体育館から出る場合は、<b>下履きに履き替えて</b>ください。','チーム席へルーズボールが飛んでくることがあります。ご注意ください。','2階への移動は、玄関・トイレ付近の階段をご利用ください。<b>2階サイドは立ち入り禁止</b>です。','撮影・観覧はステージ・2階をご利用ください（各チーム席も譲り合ってご利用ください）。フラッシュ撮影・観覧席から選手への指示など、試合の妨害は禁止です。'])+'</div>'+
  '<div class="card"><h2>競技方法</h2>'+ul(['予選は1ブロックの総当たり戦。決勝トーナメントは<b>全チーム上がり</b>で行います。','競技規則：2025-2026年度版 JDBA公式ルール、および一部本大会申し合わせ事項に則します。','コートサイズ：内野11m・外野3m。ミカサ製公認球を使用します。','試合は5分間1セットマッチ。<b>決勝のみ3セットマッチ</b>。全試合ランニングタイム制です。','審判への抗議・アピールは一切認めません。6人以上で試合成立です。','表彰：優勝・準優勝・3位'])+'</div>'+
  '<div class="card"><h2>参加チーム（U-15部門 全10チーム）</h2><div class="teams">'+BLK.A.t.map(function(n){return '<span class="tm OF">'+esc(n)+'<small>（'+PREF[n]+'）</small></span>'}).join('')+'</div><p class="note">五十音順</p></div>'+
  '<div class="card"><h2>参加費・審判</h2><dl class="info"><dt>参加費</dt><dd>1チーム 6,000円（当日、受付でお支払いください）</dd><dt>審判</dt><dd>帯同審判2名以上（主審ができる方1名は必須）のご協力をお願いします。審判欠員は協力金1,000円、専属審判を3名以上出していただける場合は1,000円引きです。服装は問いません。</dd><dt>お弁当</dt><dd>斡旋はありません。審判の皆様には、キッチンカーで使える「500円割引チケット」を配布します（使い方は審判会議・審判控室でご案内します）。</dd></dl></div>'+
  '<div class="card"><h2>お願い</h2>'+ul(['選手の健康管理には十分ご留意ください。','スポーツ保険等に必ず加入してください。大会中の怪我・トラブル、会場までの往復中の事故等には一切責任を負いません。','昼食は各チームでご用意ください。第3駐車場にキッチンカーが出店します。','体育館は靴の履き替えが必要です。全員上履きをご持参ください。','体育館外での練習はボール使用禁止です（外履きで）。アリーナ以外の室内もボール使用禁止です。','各チーム、ユニフォームかビブスをご持参ください。','貴重品の管理をお願いします。','大会で撮影した写真・映像は、チラシ・プログラム・インターネット等に使用する場合があります。試合動画のSNS等への投稿はご遠慮ください。'])+'<p class="note">本大会はプライベート大会です。至らぬ点が多々あるかと思いますが、何卒ご了承ください。</p></div>';
}

/* ---------- 管理者 ---------- */
function allMatches(C){var out=PM.slice();tourMatches(C).forEach(function(m){if(!m.fin){out.push(m);return}
  var s1=sc(m.key+'s1'),s2=sc(m.key+'s2'),need3=!!(s1&&s2&&winA(s1)!==null&&winA(s2)!==null&&winA(s1)!==winA(s2));
  [1,2,3].forEach(function(i){var x={};for(var q in m)x[q]=m[q];x.key=m.key+'s'+i;x.fin=false;x.set=i;x.r='決勝戦 第'+i+'セット';x.off=i===3&&!need3&&!sc(x.key);out.push(x)})});
  return out}
function viewLogin(){
  return '<div class="card"><h2>管理者ログイン</h2><p class="note">本部で結果を入力する方だけが使います。</p><form id="login" class="card" style="box-shadow:none;padding:0;border:0"><div class="field"><label for="lid">ID</label><input id="lid" type="text" autocomplete="username" required></div><div class="field"><label for="lpw">パスワード</label><input id="lpw" type="password" autocomplete="current-password" required></div><button class="btn primary" type="submit">ログイン</button></form></div>';
}
var MOBILE=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches), drafts={}, efil=ss('rr-efil')||'all';
function maxOf(m){return m.fin?2:19}
function cellVal(m,s){var d=drafts[m.key];if(d&&d[s]!==undefined)return d[s];var v=sc(m.key);return v?String(v[s]):''}
function fVal(m,s){var d=drafts[m.key];if(d&&d[s]!==undefined)return d[s];var v=sc(m.key);return v&&v[s]!=null?String(v[s]):''}
function wVal(m){var fa=fVal(m,'fa'),fb=fVal(m,'fb');if(fa!==''&&fb!==''&&fa!==fb)return (+fa>+fb)?'a':'b';return '';var d=drafts[m.key];if(d&&d.w!==undefined)return d.w;var v=sc(m.key);return v?v.w||'':''}
function rowState(m){var d=drafts[m.key],v=sc(m.key);if(d&&(d.a!==undefined||d.b!==undefined||d.w!==undefined)){var a=cellVal(m,'a'),b=cellVal(m,'b');if(!v||String(v.a)!==a||String(v.b)!==b||(a===b&&(fVal(m,'fa')!==(v.fa!=null?String(v.fa):'')||fVal(m,'fb')!==(v.fb!=null?String(v.fb):''))))return 'dirty'}return v?'saved':'empty'}
function viewEntry(C){
  var ms=allMatches(C),n=ms.filter(function(m){return sc(m.key)}).length;
  var list=ms.filter(function(m){return efil==='pre'?m.kind==='pre':efil==='tour'?m.kind==='tour':efil==='todo'?(!sc(m.key)&&!m.off):true});
  var h='<div class="card"><h2>結果の入力</h2><div class="progress" aria-label="入力済み '+n+' / '+ms.length+'"><b style="width:'+(n/ms.length*100).toFixed(1)+'%"></b></div>'+
   '<p class="note">入力済み '+n+' / '+ms.length+' 試合。数字は試合終了時の内野人数（決勝戦は取ったセット数）です。'+(MOBILE?'<b>数字を2つ打つと自動で保存</b>され、次の試合に進みます。':'テンキーで <b>左の数字 → 右の数字 → Enter</b> で保存し、次の試合に進みます（2〜9と0は自動で右の欄へ移ります。10〜19は「1」に続けてもう1桁打ってください）。↑↓キーで試合を移動できます。')+'</p>'+
   seg('efil',efil,[['all','すべて'],['pre','予選'],['tour','決勝T'],['todo','未入力だけ']])+'</div>';
  h+='<div class="etbl-wrap"><table class="etbl"><colgroup><col style="width:170px"><col><col style="width:100px"><col style="width:22px"><col style="width:100px"><col><col style="width:170px"><col style="width:132px"></colgroup><thead><tr><th class="c-no">試合</th><th class="c-tm r">チーム（左）</th><th class="c-in" colspan="3">内野人数</th><th class="c-tm">チーム（右）</th><th class="c-v">Vポイント勝者</th><th class="c-op"></th></tr></thead><tbody>';
  var prevSec='';
  list.forEach(function(m){
    var sec=m.kind==='pre'?'予選リーグ':'決勝トーナメント';
    if(sec!==prevSec){h+='<tr class="sec"><td colspan="8">'+sec+'</td></tr>';prevSec=sec}
    var ok=!!(m.a&&m.b)&&!m.off,st=rowState(m),k=m.key,mx=maxOf(m);
    var no=m.kind==='pre'?'第'+m.row+'試合':m.id+' '+esc(m.r);
    var tie=m.kind==='tour'&&ok&&cellVal(m,'a')!==''&&cellVal(m,'a')===cellVal(m,'b');
    h+='<tr class="er '+st+(m.court==='B'?' cb':'')+'" data-row="'+k+'"><td class="c-no"><b>'+m.court+'</b> '+no+(m.time?'<small>'+m.time+'</small>':'')+'<span class="dv '+m.div+'">'+DIV[m.div].sh+''+'</span></td>'+
     '<td class="c-tm r">'+(ok?esc(m.a):'<span class="ph">'+(m.off?'第3セットは1-1のときだけ':esc(m.pa||'未確定'))+'</span>')+'</td>'+
     '<td class="c-in"><input class="num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-a" data-k="'+k+'" data-s="a" data-max="'+mx+'" value="'+cellVal(m,'a')+'"'+(ok?'':' disabled')+' aria-label="'+esc(m.a||'左のチーム')+'の数字（0〜'+mx+'）"></td><td class="c-dash">−</td>'+
     '<td class="c-in"><input class="num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-b" data-k="'+k+'" data-s="b" data-max="'+mx+'" value="'+cellVal(m,'b')+'"'+(ok?'':' disabled')+' aria-label="'+esc(m.b||'右のチーム')+'の数字（0〜'+mx+'）"></td>'+
     '<td class="c-tm">'+(ok?esc(m.b):'<span class="ph">'+esc(m.pb||'未確定')+'</span>')+'</td>'+
     '<td class="c-v">'+(m.kind==='tour'?'<div class="vin'+(tie?' on':'')+'"><span class="vl">'+(tie?'Vポイント後の最終':'同点のときだけ')+'</span><input class="num vnum" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-fa" data-k="'+k+'" data-s="fa" data-max="19" value="'+fVal(m,'fa')+'"'+(tie?'':' disabled')+' aria-label="Vポイント後の'+esc(m.a||'左')+'の数字"><b>−</b><input class="num vnum" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" id="in-'+k+'-fb" data-k="'+k+'" data-s="fb" data-max="19" value="'+fVal(m,'fb')+'"'+(tie?'':' disabled')+' aria-label="Vポイント後の'+esc(m.b||'右')+'の数字"></div>':'')+'</td>'+
     '<td class="c-op"><button type="button" class="sv" data-save="'+k+'" tabindex="-1"'+(ok?'':' disabled')+'>'+(st==='saved'?'保存済み':'保存')+'</button>'+(sc(k)?'<button type="button" class="del" data-del="'+k+'" tabindex="-1" aria-label="この試合の結果を消す">消す</button>':'')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}
function findM(k){return allMatches(compute()).filter(function(m){return m.key===k})[0]}
function focusNext(k){
  var rows=[].slice.call(document.querySelectorAll('tr.er')),i=-1;rows.forEach(function(r,j){if(r.getAttribute('data-row')===k)i=j});
  for(var j=i+1;j<rows.length;j++){var inp=rows[j].querySelector('input.num:not([disabled])');if(inp){inp.focus();inp.select();var r=inp.getBoundingClientRect();if(r.top<120||r.bottom>window.innerHeight-120)inp.scrollIntoView({block:'center'});return}}
}
function saveRow(k,goNext){
  if(busy)return;var m=findM(k);if(!m||!m.a||!m.b)return;
  var as=cellVal(m,'a'),bs=cellVal(m,'b'),mx=maxOf(m);
  if(!/^\d{1,2}$/.test(as)||!/^\d{1,2}$/.test(bs)){toast('数字を2つとも入れてください');return}
  var a=+as,b=+bs;if(a>mx||b>mx){toast('0〜'+mx+'の数字を入れてください');return}
  var w=null,fa=null,fb=null;
  if(m.kind==='tour'&&a===b&&!m.fin){var fas=fVal(m,'fa'),fbs=fVal(m,'fb');if(!/^\d{1,2}$/.test(fas)||!/^\d{1,2}$/.test(fbs)||fas===fbs){toast('同点です。Vポイント後の最終の数字を入れてください（同じ数字は不可）');var fi=document.getElementById('in-'+k+'-fa');if(fi){fi.focus();fi.select()}return}fa=+fas;fb=+fbs;w=(fa>fb?'a':'b')+'|'+fa+'|'+fb}
  if(m.fin&&a===b){toast('決勝戦はセット数で入力してください（例：2-1）');return}
  once(rpc('rr26_save_result',{p_key:k,p_a:a,p_b:b,p_w:w}).then(function(r){if(r.error)throw r.error;state.scores[k]=parseW({a:a,b:b,w:w});delete drafts[k];render();
    toast('保存しました：'+m.a+' '+a+' - '+b+' '+m.b);if(goNext)focusNext(k)}).catch(werr));
}
/* ---------- 協賛・キッチンカー ---------- */
var KC=[
 ['桜Diner','img/k-sakura.webp','40cmロングチュロス・チーズハットグ・ソースカツ丼・山賊焼き丼・ディッピンドッツ（アイス）など','甘いものもがっつり丼も'],
 ['お食事処 夢（ハンバーグ丼の夢mama）','img/k-yume.webp','ハンバーグ丼 など','手づくりハンバーグ'],
 ['お好み焼 4resT（ふぉれすと）','img/k-4rest.webp','鉄板焼きそば など','鉄板の焼きそば'],
 ['RyoTheSea','img/k-ryo.webp','プルドポークバーガー・ホットドッグ など','STANDARD HOT DOG AND BURGER'],
 ['本格手打ち そば道楽','img/k-soba.webp','本格手打ちそば など','本格手打ち']
];
function viewSpon(){
  var h='<section class="sp-hero kc-hero"><small>第4回 2026 Re:RISE CUP</small><h2 class="sp-t">FOOD CORNER</h2><p>キッチンカー出店のご案内</p><p class="sp-thx">📍 <b>第3駐車場</b>に出店します。沢山食べて、さらにパワーアップ‼</p></section>';
  h+='<div class="sp-grid kc-grid">'+KC.map(function(k,i){return '<section class="sp-card kc-card"><h3 class="sp-cat">キッチンカー '+(i+1)+'</h3><div class="kc-img"><img src="'+k[1]+'" alt="'+esc(k[0])+'のメニュー写真" loading="lazy"></div><div class="sp-co"><b>'+esc(k[0])+'</b><em>'+esc(k[3])+'</em><span>'+esc(k[2])+'</span></div></section>'}).join('')+'</div>';
  h+='<div class="notice"><b>🗑 ご利用の方へお願い</b><span>ゴミはお持ち帰りいただくか、備え付けのゴミ箱に捨ててください。ゴミを捨てる場合は分別にご協力ください。</span></div>';
  h+='<div class="notice"><b>🎫 審判の皆様へ</b><span>キッチンカーで使える「500円割引チケット」を配布します。使い方は審判会議・審判控室でご案内します。</span></div>';
  h+='<p class="note" style="text-align:center">飲食は体育館の座席、または隣の「鼎文化センター」3階会議室で。アリーナ・ステージでの飲食は禁止です。</p>';
  return h;
}

/* ---------- 画面 ---------- */
var toastT=null;
function toast(t){var el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},2600)}
function render(){
  var C;try{C=compute()}catch(e){console.error(e);return}
  if(tab==='entry'&&!isAdmin())tab='login';
  var th=document.documentElement.getAttribute('data-theme');
  if(tab==='game'&&!GAME_ON)tab='sched';
  var body=tab==='game'&&window.viewGame?viewGame():tab==='result'?viewResult(C):tab==='spon'?viewSpon():tab==='league'?viewLeague(C):tab==='tour'?viewTour(C):tab==='info'?viewInfo():tab==='entry'?viewEntry(C):tab==='login'?viewLogin():viewSched(C);
  var tabs=[['result','結果',ICON.trophy],['info','要項',ICON.info],['sched','試合',ICON.sched],['league','予選',ICON.league],['tour','トーナメント',ICON.tour],['spon','協賛',ICON.spon]];
  if(GAME_ON)tabs.splice(5,0,['game','ゲーム',ICON.game]);
  if(isAdmin())tabs.push(['entry','入力',ICON.entry]);
  var y=window.scrollY,ae=document.activeElement,aid=ae&&ae.id&&/^in-/.test(ae.id)?ae.id:null,sel0=aid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  document.body.classList.toggle('wide',tab==='entry'||tab==='spon');
  document.getElementById('app').innerHTML=
   '<header class="top"><div class="wrap"><div class="logo"><div class="hd-ttl">Re:RISE CUP <span>2026</span></div><div class="meta"><span class="live'+(online?' on':'')+'"></span>'+(online?'LIVE 速報中':'速報ページ')+(VIS?'<span class="visits" title="アクセス数">🎁 <b>'+Number(VIS.total).toLocaleString('ja-JP')+'</b>（今日 '+Number(VIS.today).toLocaleString('ja-JP')+'）</span>':'')+'</div></div>'+
   '<div class="themesw" role="group" aria-label="表示モード"><button type="button" data-th="light" aria-label="ライトモード" aria-pressed="'+(th!=='dark')+'">'+ICON.sun+'</button><button type="button" data-th="dark" aria-label="ダークモード" aria-pressed="'+(th==='dark')+'">'+ICON.moon+'</button></div></div></header>'+
   (isAdmin()?'<div class="adminbar"><div class="wrap"><span>管理者としてログイン中</span><button type="button" id="logout">ログアウト</button></div></div>':'')+
   '<main><div class="wrap">'+(loadError?'<div class="alert">'+esc(loadError)+'</div>':'')+body+'</div></main>'+
   '<footer><div class="wrap">'+(isAdmin()?'':'<button type="button" class="linkbtn" data-tab="login">管理者ログイン</button>')+'<span class="credit">主催：飯田DBC Re:RISE／Re:RISE CUP 実行委員会</span></div></footer>'+
   '<nav class="bottomnav" aria-label="メニュー"><div class="in">'+tabs.map(function(t){return '<button type="button" data-tab="'+t[0]+'"'+(tab===t[0]?' aria-current="page"':'')+'>'+t[2]+'<span>'+t[1]+'</span></button>'}).join('')+'</div></nav>'+
   '<button type="button" class="refresh" id="refresh" aria-label="最新情報に更新">'+ICON.gift+'<span class="t"><span>最新情報に更新</span><small>'+(lastSync?'最終更新 '+lastSync:'押すと最新の結果を読み込みます')+'</small></span></button>';
  window.scrollTo(0,y);
  if(aid){var ne=document.getElementById(aid);if(ne&&!ne.disabled){ne.focus({preventScroll:true});if(sel0&&ne.setSelectionRange)try{ne.setSelectionRange(sel0[0],sel0[1])}catch(x){}}}
  try{var hd=document.querySelector('header.top');if(hd)document.documentElement.style.setProperty('--hh',hd.offsetHeight+'px')}catch(e){}
}

/* ---------- 通信 ---------- */
function stamp(){var d=new Date();lastSync=d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')}
function loadAll(){if(!sb)return Promise.resolve(false);
  return Promise.all([sb.from('rr26_results').select('key,a,b,w,updated_at'),sb.from('rr26_settings').select('adj').eq('id',1).maybeSingle()]).then(function(r){
    if(r[0].error)throw r[0].error;var s={};(r[0].data||[]).forEach(function(x){s[x.key]=parseW({a:x.a,b:x.b,w:x.w,t:x.updated_at})});state.scores=s;
    state.adj=(r[1].data&&r[1].data.adj)||{};loaded=true;loadError='';stamp();if(tab!=='login')render();return true;
  }).catch(function(e){console.error(e);loadError=loaded?'':'結果の読み込みに失敗しました。電波の良い場所で「最新情報に更新」を押してください。';render();return false});
}
var tmr=null;function later(){clearTimeout(tmr);tmr=setTimeout(loadAll,400)}
function subscribe(){try{sb.channel('rr26-live').on('postgres_changes',{event:'*',schema:'public',table:'rr26_results'},later).on('postgres_changes',{event:'*',schema:'public',table:'rr26_settings'},later).subscribe(function(s){online=s==='SUBSCRIBED';render()})}catch(e){}}
function rpc(fn,a){var o={p_id:cred&&cred.id,p_pw:cred&&cred.pw};for(var k in a)o[k]=a[k];return sb.rpc(fn,o)}
var busy=false;function once(p){busy=true;return p.then(function(){busy=false},function(){busy=false})}
function werr(e){console.error(e);toast('保存できませんでした。電波を確認してもう一度押してください')}

/* ---------- 操作 ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-th]');if(t){var v=t.getAttribute('data-th');document.documentElement.setAttribute('data-theme',v);ls('rr-theme',v);render();return}
  t=e.target.closest('[data-tab]');if(t){tab=t.getAttribute('data-tab');ss('rr-tab',tab==='login'?'sched':tab);render();window.scrollTo(0,0);if(tab==='entry')focusFirst();return}
  t=e.target.closest('[data-seg]');if(t){var k=t.getAttribute('data-seg'),v2=t.getAttribute('data-v');if(k==='dview'){dview=v2;ls('rr-div',v2)}if(k==='lview'){lview=v2;ls('rr-ldiv',v2)}if(k==='tview'){tview=v2;ls('rr-tdiv',v2)}if(k==='efil'){efil=v2;ss('rr-efil',v2);render();focusFirst();return}render();return}
  var rb=e.target.closest('#refresh');if(rb){
    if(rb.classList.contains('busy'))return;rb.classList.add('busy');rb.querySelector('.t span').textContent='更新中…';
    try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}
    Promise.all([loadAll(),new Promise(function(r){setTimeout(r,600)})]).then(function(res){
      var b=document.getElementById('refresh');
      if(res[0]){if(b){b.classList.remove('busy');b.classList.add('done');b.querySelector('.t span').textContent='更新しました'}toast('最新の結果を表示しています（'+lastSync+'）');setTimeout(render,1600)}
      else{if(b)b.classList.remove('busy');toast('読み込めませんでした。電波を確認してもう一度押してください')}});
    return}
  if(e.target.closest('#logout')){cred=null;ls('rr26-cred',null);tab='sched';render();toast('ログアウトしました');return}
  if(!isAdmin()||busy)return;
  t=e.target.closest('[data-save]');if(t){saveRow(t.getAttribute('data-save'),true);return}
  t=e.target.closest('[data-del]');if(t){var dk=t.getAttribute('data-del'),dm=findM(dk);if(!window.confirm((dm.a||'')+' × '+(dm.b||'')+' の結果を消しますか？'))return;once(rpc('rr26_delete_result',{p_key:dk}).then(function(r){if(r.error)throw r.error;delete state.scores[dk];delete drafts[dk];render();toast('結果を消しました')}).catch(werr));return}
  t=e.target.closest('[data-adj]');if(t){var code=t.getAttribute('data-adj'),adj={};for(var q in state.adj)adj[q]=state.adj[q];var dd=+t.getAttribute('data-d');if(dd)adj[code]=(+adj[code]||0)+dd;else delete adj[code];
    once(rpc('rr26_save_adj',{p_adj:adj}).then(function(r){if(r.error)throw r.error;state.adj=adj;render();toast('順位を調整しました')}).catch(werr));return}
});
document.addEventListener('change',function(e){
  if(e.target.id==='team-filter'){filter=e.target.value;ls('rr-filter',filter);render();return}

});
function markRow(k){var tr=document.querySelector('tr[data-row="'+k+'"]');var m=findM(k);if(!tr||!m)return;var st=rowState(m);tr.classList.remove('saved','dirty','empty');tr.classList.add(st);var b=tr.querySelector('.sv');if(b)b.textContent=st==='saved'?'保存済み':'保存';
  var fa=document.getElementById('in-'+k+'-fa');if(fa){var tie=cellVal(m,'a')!==''&&cellVal(m,'a')===cellVal(m,'b');fa.disabled=!tie;document.getElementById('in-'+k+'-fb').disabled=!tie;var box=fa.parentNode;box.classList.toggle('on',tie);box.querySelector('.vl').textContent=tie?'Vポイント後の最終':'同点のときだけ'}}
document.addEventListener('input',function(e){var t=e.target;if(!t.classList||!t.classList.contains('num'))return;var v=t.value.replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248)}).replace(/\D/g,'').slice(0,2);if(v!==t.value)t.value=v;var k=t.getAttribute('data-k'),sd=t.getAttribute('data-s');drafts[k]=drafts[k]||{};drafts[k][sd]=v;markRow(k);
  var mx=+t.getAttribute('data-max')||12,full=v!==''&&(v.length===2||v==='0'||(+v)*10>mx);if(!full)return;
  if(sd==='a'){var nb=document.getElementById('in-'+k+'-b');if(nb){nb.focus();nb.select()}return}
  if(sd==='fa'){var nfb=document.getElementById('in-'+k+'-fb');if(nfb){nfb.focus();nfb.select()}return}
  if(sd==='b'){var m0=findM(k);if(m0&&m0.kind==='tour'&&cellVal(m0,'a')===v){var f0=document.getElementById('in-'+k+'-fa');if(f0&&!f0.disabled){f0.focus();f0.select();return}}}
  if(sd==='fb'){if(MOBILE){focusNext(k);saveRow(k,false)}return}
  if(MOBILE){var m=findM(k),ta=cellVal(m,'a');if(ta===''){var na=document.getElementById('in-'+k+'-a');if(na)na.focus();return}
    focusNext(k);saveRow(k,false)}});
document.addEventListener('keydown',function(e){var t=e.target;if(e.isComposing||!t.getAttribute||!t.getAttribute('data-k'))return;var k=t.getAttribute('data-k'),sd=t.getAttribute('data-s');
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();moveRow(k,sd,e.key==='ArrowDown'?1:-1);return}
  if(e.key!=='Enter')return;e.preventDefault();
  if(sd==='a'){var nb=document.getElementById('in-'+k+'-b');if(nb){nb.focus();nb.select()}return}
  if(sd==='fa'){var nfb2=document.getElementById('in-'+k+'-fb');if(nfb2){nfb2.focus();nfb2.select()}return}
  if(sd==='b'){var m=findM(k);if(cellVal(m,'a')===''){var na=document.getElementById('in-'+k+'-a');if(na)na.focus();return}if(cellVal(m,'b')==='')return;
    if(m.kind==='tour'&&cellVal(m,'a')===cellVal(m,'b')&&!wVal(m)){var f1=document.getElementById('in-'+k+'-fa');if(f1&&!f1.disabled){f1.focus();f1.select();return}}}
  saveRow(k,true)});
function moveRow(k,sd,d){var rows=[].slice.call(document.querySelectorAll('tr.er')),i=-1;rows.forEach(function(r,j){if(r.getAttribute('data-row')===k)i=j});
  for(var j=i+d;j>=0&&j<rows.length;j+=d){var inp=rows[j].querySelector('input.num[data-s="'+(sd==='fa'||sd==='fb'?'a':sd)+'"]:not([disabled])');if(inp){inp.focus();inp.select();inp.scrollIntoView({block:'nearest'});return}}}
function focusFirst(){if(MOBILE)return;var rows=document.querySelectorAll('tr.er.empty,tr.er.dirty');for(var i=0;i<rows.length;i++){var inp=rows[i].querySelector('input.num:not([disabled])');if(inp){inp.focus();inp.select();inp.scrollIntoView({block:'center'});return}}}
document.addEventListener('focusin',function(e){if(e.target.classList&&e.target.classList.contains('num'))e.target.select()});
document.addEventListener('submit',function(e){
  if(e.target.id!=='login')return;e.preventDefault();
  var id=document.getElementById('lid').value.trim(),pw=document.getElementById('lpw').value;
  if(!sb){toast('接続の準備ができていません');return}
  sb.rpc('rr26_login',{p_id:id,p_pw:pw}).then(function(r){
    if(r.error||!r.data){toast('IDかパスワードが違います');return}
    cred={id:id,pw:pw};ls('rr26-cred',JSON.stringify(cred));tab='entry';ss('rr-tab','entry');render();window.scrollTo(0,0);focusFirst();toast('ログインしました');
  },function(){toast('ログインできませんでした。電波を確認してください')});
});

/* ---------- 起動 ---------- */
render();if(tab==='entry')setTimeout(focusFirst,50);
if(!CFG.SUPABASE_URL||!window.supabase){loadError='接続の準備ができていません。';render()}
else{
  sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  var fresh=!ss('rr-visited');sb.rpc('rr26_hit',{p_inc:fresh}).then(function(r){if(r&&!r.error&&r.data){if(fresh)ss('rr-visited','1');VIS=r.data;render()}},function(){});
  loadAll();subscribe();
  document.addEventListener('visibilitychange',function(){if(!document.hidden)loadAll()});
  setInterval(function(){if(!document.hidden)loadAll()},30000);
}
window.RR={sb:function(){return sb},render:function(){render()},isAdmin:function(){return isAdmin()},rpc:function(f,a){return rpc(f,a)},toast:function(m){toast(m)},PREF:PREF,BLK:BLK,tab:function(){return tab},setTab:function(t){tab=t;ss('rr-tab',t)}};
})();
