const $=id=>document.getElementById(id);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function tok(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function palette(K){const L=+tok('--tile-l')||78,S=+tok('--tile-s')||52;const out=[];for(let i=0;i<K;i++){const h=(i*360/K+18*(i%2))%360;out.push(`hsl(${h} ${S}% ${L+((i%3)-1)*4}%)`);}return out;}
function fit(cv,aspect,maxW=620){const w=Math.max(120,Math.min(cv.parentElement.clientWidth-28,maxW));const h=Math.round(w*aspect);const dpr=window.devicePixelRatio||1;
  cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h};}
function DV(w,h,pad=10){const S=Math.min(w,h)/2-pad,ox=w/2,oy=h/2;return{S,ox,oy,sc:z=>[ox+z.re*S,oy-z.im*S],dk:(x,y)=>cx((x-ox)/S,-(y-oy)/S)};}
function geoTo(ctx,V,z,w,move){const[x1,y1]=V.sc(z),[x2,y2]=V.sc(w);if(move)ctx.moveTo(x1,y1);
  const det=z.re*w.im-z.im*w.re;if(Math.abs(det)<1e-10){ctx.lineTo(x2,y2);return;}
  const r1=(cabs2(z)+1)/2,r2=(cabs2(w)+1)/2;const ccx=(r1*w.im-z.im*r2)/det,ccy=(z.re*r2-r1*w.re)/det;
  const R=Math.sqrt(Math.max(0,ccx*ccx+ccy*ccy-1));if(R*V.S>3e4||!isFinite(R)){ctx.lineTo(x2,y2);return;}
  const[sx,sy]=V.sc(cx(ccx,ccy));const a1=Math.atan2(y1-sy,x1-sx),a2=Math.atan2(y2-sy,x2-sx);let dl=a2-a1;
  while(dl>Math.PI)dl-=2*Math.PI;while(dl<-Math.PI)dl+=2*Math.PI;ctx.arc(sx,sy,R*V.S,a1,a1+dl,dl<0);}
function rim(ctx,V){ctx.beginPath();ctx.arc(V.ox,V.oy,V.S,0,2*Math.PI);ctx.fillStyle=tok('--soft');ctx.fill();ctx.strokeStyle=tok('--muted');ctx.lineWidth=1;ctx.stroke();}
function hcircle(h,rho){const t=Math.tanh(rho/2),h2=cabs2(h);const k=1-t*t*h2;return{c:cscale(h,(1-t*t)/k),r:t*(1-h2)/k};}
function csqrt(z){const r=cabs(z);const a=Math.sqrt((r+z.re)/2),b=Math.sign(z.im||1)*Math.sqrt(Math.max(0,(r-z.re)/2));return cx(a,b);}
function fmt(x,n=3){return (x>=0?' ':'')+x.toFixed(n).replace('-','−');}
function fc(z,n=3){return `${fmt(z.re,n)} ${z.im<0?'−':'+'} ${Math.abs(z.im).toFixed(n)}i`;}
const views=[];function redrawAll(){for(const v of views)v();}
function pointerPos(cv,e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
function onDrag(cv,down,move,up){let act=false;cv.addEventListener('pointerdown',e=>{const p=pointerPos(cv,e);if(down(p[0],p[1])!==false){act=true;cv.setPointerCapture(e.pointerId);e.preventDefault();}});
  cv.addEventListener('pointermove',e=>{if(!act)return;const p=pointerPos(cv,e);move(p[0],p[1]);});
  const end=()=>{if(act){act=false;up&&up();}};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);}
function visible(el,cb){const io=new IntersectionObserver(es=>{for(const e of es)cb(e.isIntersecting);});io.observe(el);}

/* ---------- 3D helpers ---------- */
function proj(p,yaw,pitch,w,h,scale){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  let x=p[0]*cy-p[1]*sy,y=p[0]*sy+p[1]*cy,z=p[2];const y2=y*cp-z*sp,z2=y*sp+z*cp;const f=3.2/(3.2+y2);
  return[w/2+x*scale*f,h/2-z2*scale*f,y2];}

/* ---------- Saddle / pseudosphere ---------- */
(function(){const cv=$('cvSurf');let mode='saddle',yaw=0.6,pitch=0.45,run=false,last=0;
  function pt(u,v){if(mode==='saddle'){const x=u*Math.cos(v),y=u*Math.sin(v);return[x*1.1,y*1.1,(x*x-y*y)*0.75];}
    const s=1/Math.cosh(u);return[s*Math.cos(v)*1.05,s*Math.sin(v)*1.05,(u-Math.tanh(u))*0.7-0.75];}
  function draw(){const{ctx,w,h}=fit(cv,0.82,560);const sc=Math.min(w,h)*0.36;const ink=tok('--muted'),hyp=tok('--hyp');
    const U=mode==='saddle'?[0,1]:[0.08,3.2];const lines=[];const nu=12,nv=36;
    for(let i=0;i<=nu;i++){const u=U[0]+(U[1]-U[0])*i/nu;const L=[];for(let j=0;j<=nv;j++)L.push(pt(u,2*Math.PI*j/nv));lines.push(L);}
    for(let j=0;j<nv;j+=2){const v=2*Math.PI*j/nv;const L=[];for(let i=0;i<=nu*3;i++)L.push(pt(U[0]+(U[1]-U[0])*i/(nu*3),v));lines.push(L);}
    ctx.lineWidth=0.8;for(const L of lines){for(let k=1;k<L.length;k++){const a=proj(L[k-1],yaw,pitch,w,h,sc),b=proj(L[k],yaw,pitch,w,h,sc);
      ctx.globalAlpha=Math.max(0.15,Math.min(0.9,0.55-(a[2]+b[2])*0.25));ctx.strokeStyle=ink;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}}
    ctx.globalAlpha=1;ctx.strokeStyle=hyp;ctx.lineWidth=2.4;ctx.beginPath();const ur=mode==='saddle'?0.8:0.9;
    for(let j=0;j<=120;j++){const p=proj(pt(ur,2*Math.PI*j/120),yaw,pitch,w,h,sc);j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();}
  function loop(t){if(!run)return;if(!reduceMotion){yaw+=(t-last)/1000*0.25;}last=t;draw();if(!reduceMotion)requestAnimationFrame(loop);}
  visible(cv,v=>{run=v;if(v){last=performance.now();requestAnimationFrame(loop);}});
  let px=0,py=0;onDrag(cv,(x,y)=>{px=x;py=y;},(x,y)=>{yaw+=(x-px)*0.01;pitch=Math.max(-1.2,Math.min(1.2,pitch+(y-py)*0.01));px=x;py=y;draw();});
  const set=m=>{mode=m;$('btSaddle').setAttribute('aria-pressed',m==='saddle');$('btPseudo').setAttribute('aria-pressed',m!=='saddle');draw();};
  $('btSaddle').onclick=()=>set('saddle');$('btPseudo').onclick=()=>set('pseudo');views.push(draw);})();

/* ---------- Growth chart ---------- */
(function(){const cv=$('cvGrowth');function draw(){const{ctx,w,h}=fit(cv,0.72,560);const L=48,R=12,T=12,B=34;const W=w-L-R,H=h-T-B;
  const X=r=>L+r/6*W,Y=v=>T+H-(Math.log10(v)-0)/(Math.log10(2000))*H;ctx.font='11px '+tok('--mono');ctx.fillStyle=tok('--muted');ctx.strokeStyle=tok('--line');ctx.lineWidth=1;
  for(const v of [1,10,100,1000]){ctx.beginPath();ctx.moveTo(L,Y(v));ctx.lineTo(L+W,Y(v));ctx.stroke();ctx.textAlign='right';ctx.fillText(v,L-6,Y(v)+4);}
  for(let r=0;r<=6;r++){ctx.textAlign='center';ctx.fillText(r,X(r),T+H+16);}ctx.fillText('radius r',L+W/2,T+H+30);
  const curve=(fn,col)=>{ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.beginPath();for(let i=1;i<=300;i++){const r=0.02+i/300*5.98;const p=[X(r),Y(Math.max(1e-9,fn(r)))];if(p[1]>T+H){ctx.moveTo(p[0],T+H);continue;}ctx.lineTo(p[0],p[1]);}ctx.stroke();};
  ctx.save();ctx.beginPath();ctx.rect(L,T,W,H);ctx.clip();curve(r=>2*Math.PI*r,tok('--euc'));curve(r=>2*Math.PI*Math.sinh(r),tok('--hyp'));ctx.restore();
  ctx.textAlign='left';ctx.font='12px '+tok('--body');ctx.fillStyle=tok('--hyp');ctx.fillText('2π sinh r',X(4.3),Y(2*Math.PI*Math.sinh(4.3))-8);ctx.fillStyle=tok('--euc');ctx.fillText('2πr',X(5.2),Y(2*Math.PI*5.2)+16);}
  views.push(draw);})();

/* ---------- Poincaré disk triangle ---------- */
(function(){const cv=$('cvDisk');let P=[cx(-0.35,-0.25),cx(0.45,-0.2),cx(0.05,0.5)];let V,drag=-1;
  function draw(){const f=fit(cv,1,560);const ctx=f.ctx;V=DV(f.w,f.h);rim(ctx,V);
    ctx.strokeStyle=tok('--line');ctx.lineWidth=1;for(let k=0;k<12;k++){const t=k*Math.PI/12;ctx.beginPath();geoTo(ctx,V,cexp(t),cexp(t+Math.PI*0.62),true);ctx.stroke();}
    const C=hcircle(P[0],1);const[ccx,ccy]=V.sc(C.c);ctx.setLineDash([5,4]);ctx.strokeStyle=tok('--euc');ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ccx,ccy,C.r*V.S,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();geoTo(ctx,V,P[0],P[1],true);geoTo(ctx,V,P[1],P[2],false);geoTo(ctx,V,P[2],P[0],false);ctx.closePath();ctx.fillStyle=tok('--hyp-soft');ctx.fill();ctx.strokeStyle=tok('--hyp');ctx.lineWidth=2;ctx.stroke();
    ctx.font='600 13px '+tok('--body');['A','B','C'].forEach((n,i)=>{const[x,y]=V.sc(P[i]);ctx.beginPath();ctx.arc(x,y,7,0,2*Math.PI);ctx.fillStyle=tok('--panel');ctx.fill();ctx.strokeStyle=tok('--ink');ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=tok('--ink');ctx.fillText(n,x+10,y-8);});
    read();}
  function read(){const a=hdist(P[1],P[2]),b=hdist(P[0],P[2]),c=hdist(P[0],P[1]);const ang=(x,y,z)=>Math.acos(Math.max(-1,Math.min(1,(Math.cosh(y)*Math.cosh(z)-Math.cosh(x))/(Math.sinh(y)*Math.sinh(z)))));
    const A=ang(a,b,c),B=ang(b,a,c),Cc=ang(c,a,b);const deg=x=>(x*180/Math.PI).toFixed(1)+'°';const sum=A+B+Cc;
    $('rdTri').innerHTML=`<span class="k">sides</span><span>a ${a.toFixed(3)} · b ${b.toFixed(3)} · c ${c.toFixed(3)}</span><span class="k">angles</span><span>${deg(A)} + ${deg(B)} + ${deg(Cc)}</span><span class="k">sum</span><span>${deg(sum)} <span class="k">(flat: 180°)</span></span><span class="k">area</span><span>π − sum = ${(Math.PI-sum).toFixed(4)}</span>`;
    const z=P[0],r2=cabs2(z),r=Math.sqrt(r2);const up=cdiv(cmul(cx(0,1),cadd(cx(1),z)),csub(cx(1),z));const kl=cscale(z,2/(1+r2));const t=(1+r2)/(1-r2);
    $('rdCoord').innerHTML=`<span class="k">disk</span><span>(${fmt(z.re)}, ${fmt(z.im)})</span><span class="k">Klein</span><span>(${fmt(kl.re)}, ${fmt(kl.im)})</span><span class="k">half-plane</span><span>(${fmt(up.re)}, ${fmt(up.im)})</span><span class="k">hyperboloid</span><span>(t ${t.toFixed(3)}, x ${fmt(2*z.re/(1-r2))}, y ${fmt(2*z.im/(1-r2))})</span><span class="k">polar</span><span>ρ ${(2*Math.atanh(r)).toFixed(3)}, θ ${(Math.atan2(z.im,z.re)*180/Math.PI).toFixed(1)}°</span>`;}
  onDrag(cv,(x,y)=>{let best=-1,bd=24;P.forEach((p,i)=>{const[sx,sy]=V.sc(p);const d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;best=i;}});drag=best;return best>=0;},
    (x,y)=>{let z=V.dk(x,y);const r=cabs(z);if(r>0.985)z=cscale(z,0.985/r);P[drag]=z;draw();});views.push(draw);})();

/* ---------- Möbius tiling ---------- */
function genTiles(F,rootMu,rootParity,V,S,maxN,minPx){const d=F.d;const out=[];const q=[{mu:rootMu,par:rootParity,from:-1,isRoot:true}];let h=0;
  while(h<q.length&&out.length<maxN){const n=q[h++];n.f=mapply(minv(n.mu),F.v);n.vf=mapply(V,n.f);n.idx=out.length;out.push(n);
    const px=(1-cabs2(n.vf))*S;if(px<minPx)continue;const start=n.isRoot?0:1;
    for(let i=start;i<d;i++)q.push({mu:mmul(F.bpow[i],mmul(F.a,n.mu)),par:1-n.par,from:n.idx});}
  return out;}
function tilePath(ctx,Vd,F,V,mu){const T=mmul(V,mmul(minv(mu),F.tileBase));const vs=F.verts.map(z=>onDisk(mapply(T,z)));ctx.beginPath();ctx.moveTo(...Vd.sc(vs[0]));for(let k=0;k<vs.length;k++)geoTo(ctx,Vd,vs[k],vs[(k+1)%vs.length],false);ctx.closePath();}
(function(){const cv=$('cvMob');let d=4,F=kframe(d),V=MID,rootMu=F.a,rootPar=0,nodes=[],Vd;
  function draw(){const f=fit(cv,1,580);const ctx=f.ctx;Vd=DV(f.w,f.h);rim(ctx,Vd);
    nodes=genTiles(F,rootMu,rootPar,V,Vd.S,2600,0.9);const sA=tok('--panel'),sB=tok('--hyp-soft');
    ctx.lineWidth=0.7;ctx.strokeStyle=tok('--muted');
    for(const n of nodes){if((1-cabs2(n.vf))*Vd.S<0.6)continue;tilePath(ctx,Vd,F,V,n.mu);ctx.fillStyle=n.par?sB:sA;ctx.fill();ctx.stroke();}
    ctx.strokeStyle=tok('--hyp');ctx.lineWidth=1.4;for(const n of nodes){if(n.from<0)continue;const p=nodes[n.from];ctx.beginPath();geoTo(ctx,Vd,p.vf,n.vf,true);ctx.stroke();}
    ctx.fillStyle=tok('--hyp');for(const n of nodes){const r=Math.max(0.8,Math.min(4,(1-cabs2(n.vf))*4));const[x,y]=Vd.sc(n.vf);ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
    let det=csub(cmul(V.a,V.d),cmul(V.b,V.c));const s=csqrt(det);const al=cdiv(V.a,s),be=cdiv(V.b,s);const o=mapply(V,cx(0));
    $('rdMob').innerHTML=`<span class="k">α</span><span>${fc(al)}</span><span class="k">β</span><span>${fc(be)}</span><span class="k">|α|²−|β|²</span><span>${(cabs2(al)-cabs2(be)).toFixed(6)}</span><span class="k">origin goes to</span><span>${fc(o)}</span><span class="k">moved by</span><span>${hdist(cx(0),o).toFixed(3)} (hyperbolic)</span><span class="k">tiles drawn</span><span>${nodes.length}</span><span class="k">edge length</span><span>d(u,v) = ${hdist(F.u,F.v).toFixed(4)}</span>`;}
  function recenter(){let best=null,bd=Infinity;for(const n of nodes){const r=cabs2(n.vf);if(r<bd){bd=r;best=n;}}if(!best)return;const K=mmul(minv(best.mu),F.a);V=mmul(V,K);rootMu=F.a;rootPar=best.par;}
  let p0;onDrag(cv,(x,y)=>{p0=Vd.dk(x,y);if(cabs(p0)>0.97)return false;},(x,y)=>{let q=Vd.dk(x,y);const r=cabs(q);if(r>0.97)q=cscale(q,0.97/r);V=mmul(mmul(mtrans(q),mtrans(cneg(p0))),V);p0=q;draw();},()=>{recenter();draw();});
  $('rgD').oninput=e=>{d=+e.target.value;$('outD').textContent=d;F=kframe(d);V=MID;rootMu=F.a;rootPar=0;draw();};
  $('btMobReset').onclick=()=>{V=MID;rootMu=F.a;rootPar=0;draw();};views.push(draw);})();

/* ---------- Greedy routing ---------- */
const G={net:null,src:-1,dst:-1,Vh:MID,seed:20070507};
function pickDemoPair(N){let best=null,bl=-1;const n=N.pts.length;for(let s=0;s<n;s++)for(let t=0;t<n;t++){if(s===t)continue;const e=routeEuclid(N,s,t);if(e.ok)continue;const sp=N.hop[s][t];if(sp>bl){bl=sp;best=[s,t];}}
  if(!best){let m=-1;for(let s=0;s<n;s++)for(let t=0;t<n;t++)if(N.hop[s][t]>m){m=N.hop[s][t];best=[s,t];}}return best;}
function newNet(){const n=+$('rgN').value,bar=$('cbBar').checked;const rng=mulberry(G.seed++);G.net=genNetwork(n,rng,bar);const pr=pickDemoPair(G.net);G.src=pr[0];G.dst=pr[1];centerMid();drawGreedy();}
function centerMid(){const N=G.net;if(G.src<0||G.dst<0){G.Vh=mtrans(cneg(N.f[N.root]));return;}const p=routeHyp(N,G.src,G.dst).path;G.Vh=mtrans(cneg(N.f[p[Math.floor(p.length/2)]]));}
function routesNow(){const N=G.net;if(G.src<0||G.dst<0)return null;return{eu:routeEuclid(N,G.src,G.dst),hy:routeHyp(N,G.src,G.dst),tr:routeTree(N,G.src,G.dst)};}
let physV,hypV;
function drawGreedy(){const N=G.net;if(!N)return;const R=routesNow();const cE=tok('--euc'),cH=tok('--hyp'),cT=tok('--tree'),cL=tok('--line'),ink=tok('--ink');
  {const f=fit($('cvPhys'),1,560);const ctx=f.ctx;const S=Math.min(f.w,f.h)/2-10,RR=Math.sqrt(5);physV={sc:p=>[f.w/2+p.x/RR*S,f.h/2-p.y/RR*S]};
    ctx.beginPath();ctx.arc(f.w/2,f.h/2,S,0,2*Math.PI);ctx.fillStyle=tok('--soft');ctx.fill();
    ctx.strokeStyle=cL;ctx.lineWidth=1;for(let i=0;i<N.pts.length;i++)for(const j of N.adj[i])if(j>i){ctx.beginPath();ctx.moveTo(...physV.sc(N.pts[i]));ctx.lineTo(...physV.sc(N.pts[j]));ctx.stroke();}
    ctx.strokeStyle=cT;ctx.lineWidth=1.2;ctx.globalAlpha=0.6;for(let i=0;i<N.pts.length;i++)if(N.parent[i]>=0){ctx.beginPath();ctx.moveTo(...physV.sc(N.pts[i]));ctx.lineTo(...physV.sc(N.pts[N.parent[i]]));ctx.stroke();}ctx.globalAlpha=1;
    if(N.barrier){ctx.strokeStyle=tok('--bad');ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(...physV.sc(BARRIER[0]));ctx.lineTo(...physV.sc(BARRIER[1]));ctx.stroke();}
    if(R){const pl=(path,c,w,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();path.forEach((v,k)=>{const p=physV.sc(N.pts[v]);k?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.stroke();ctx.setLineDash([]);};
      pl(R.tr.path,cT,2,[5,4]);pl(R.eu.path,cE,3.5);pl(R.hy.path,cH,2.5);
      if(!R.eu.ok){const p=physV.sc(N.pts[R.eu.path[R.eu.path.length-1]]);ctx.strokeStyle=tok('--bad');ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p[0]-7,p[1]-7);ctx.lineTo(p[0]+7,p[1]+7);ctx.moveTo(p[0]+7,p[1]-7);ctx.lineTo(p[0]-7,p[1]+7);ctx.stroke();}}
    for(let i=0;i<N.pts.length;i++){const p=physV.sc(N.pts[i]);ctx.beginPath();ctx.arc(p[0],p[1],i===N.root?5:3.5,0,2*Math.PI);ctx.fillStyle=i===N.root?cT:ink;ctx.fill();}
    markSD(ctx,i=>physV.sc(N.pts[i]));}
  {const f=fit($('cvHypNet'),1,560);const ctx=f.ctx;hypV=DV(f.w,f.h);rim(ctx,hypV);const P=i=>mapply(G.Vh,N.f[i]);const VP=N.pts.map((_,i)=>P(i));
    if($('cbShort').checked){ctx.strokeStyle=cL;ctx.lineWidth=0.8;for(let i=0;i<N.pts.length;i++)for(const j of N.adj[i])if(j>i&&N.parent[i]!==j&&N.parent[j]!==i){ctx.beginPath();geoTo(ctx,hypV,VP[i],VP[j],true);ctx.stroke();}}
    ctx.strokeStyle=cT;ctx.lineWidth=1.3;for(let i=0;i<N.pts.length;i++)if(N.parent[i]>=0){ctx.beginPath();geoTo(ctx,hypV,VP[N.parent[i]],VP[i],true);ctx.stroke();}
    if(R){const pl=(path,c,w,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();for(let k=1;k<path.length;k++)geoTo(ctx,hypV,VP[path[k-1]],VP[path[k]],k===1);ctx.stroke();ctx.setLineDash([]);};
      pl(R.tr.path,cT,2.2,[5,4]);pl(R.eu.path,cE,3);pl(R.hy.path,cH,2.6);}
    for(let i=0;i<N.pts.length;i++){const p=hypV.sc(VP[i]);const r=Math.max(1.3,Math.min(4.5,(1-cabs2(VP[i]))*4.5));ctx.beginPath();ctx.arc(p[0],p[1],i===N.root?r+1.5:r,0,2*Math.PI);ctx.fillStyle=i===N.root?cT:ink;ctx.fill();}
    markSD(ctx,i=>hypV.sc(VP[i]));}
  readGreedy(R);}
function markSD(ctx,sc){const N=G.net;ctx.font='600 12px '+tok('--body');for(const [i,lab] of [[G.src,'S'],[G.dst,'D']]){if(i<0)continue;const p=sc(i);ctx.beginPath();ctx.arc(p[0],p[1],8,0,2*Math.PI);ctx.fillStyle=tok('--panel');ctx.fill();ctx.strokeStyle=tok('--ink');ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=tok('--ink');ctx.textAlign='center';ctx.fillText(lab,p[0],p[1]+4);ctx.textAlign='left';}}
function readGreedy(R){const N=G.net;if(!R){$('rdRoutes').innerHTML='<span class="k">Tap a source, then a destination.</span>';$('rdDist').innerHTML='';return;}
  const sp=N.hop[G.src][G.dst];const row=(name,r,c)=>`<div class="route-row"><span style="color:${c}">${name}</span><span>${r.ok?`${r.path.length-1} hops · stretch ${((r.path.length-1)/sp).toFixed(2)}`:`<span class="no">stuck after ${r.path.length-1} hops</span>`}</span></div>`;
  $('rdRoutes').innerHTML=`<div class="route-row"><span class="k">shortest possible</span><span>${sp} hops</span></div>`+row('Euclidean greedy',R.eu,tok('--euc'))+row('Hyperbolic greedy',R.hy,tok('--hyp'))+row('Tree path',R.tr,tok('--tree'))+
    `<div class="hops">${N.pts.length} nodes · ${(2*N.m/N.pts.length).toFixed(1)} links/node · tree degree d = ${N.d} · tree depth ${Math.max(...N.depth)}</div>`;
  const dd=R.hy.path.map(v=>hdist(N.f[v],N.f[G.dst]));const de=R.eu.path.map(v=>Math.hypot(N.pts[v].x-N.pts[G.dst].x,N.pts[v].y-N.pts[G.dst].y));
  const mx=Math.max(...dd,0.001);
  $('rdDist').innerHTML=`<div class="k" style="margin-bottom:4px">hyperbolic greedy</div>`+dd.map((x,k)=>`<div style="display:flex;gap:8px;align-items:center"><span class="k" style="width:3ch">${k}</span><span style="flex:0 0 auto;height:8px;width:${Math.max(2,x/mx*140)}px;background:${tok('--hyp')};border-radius:2px"></span><span>${x.toFixed(2)}</span></div>`).join('')+
    `<div class="k" style="margin:10px 0 4px">Euclidean greedy (physical distance)</div><div class="hops">${de.map(x=>x.toFixed(2)).join(' → ')}${R.eu.ok?'':' <span class="no">✕ no closer neighbor</span>'}</div>`;}
function pickNode(arr,x,y){let best=-1,bd=22;arr.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=i;}});return best;}
function tapNode(i){if(i<0)return;if(G.src<0||G.dst>=0){G.src=i;G.dst=-1;}else if(i!==G.src){G.dst=i;centerMid();}drawGreedy();}
$('cvPhys').addEventListener('click',e=>{const[x,y]=pointerPos($('cvPhys'),e);tapNode(pickNode(G.net.pts.map(p=>physV.sc(p)),x,y));});
$('cvHypNet').addEventListener('click',e=>{const[x,y]=pointerPos($('cvHypNet'),e);tapNode(pickNode(G.net.pts.map((_,i)=>hypV.sc(mapply(G.Vh,G.net.f[i]))),x,y));});
$('btCMid').onclick=()=>{centerMid();drawGreedy();};
$('btCRoot').onclick=()=>{G.Vh=mtrans(cneg(G.net.f[G.net.root]));drawGreedy();};
$('btCSrc').onclick=()=>{if(G.src>=0){G.Vh=mtrans(cneg(G.net.f[G.src]));drawGreedy();}};
$('btCDst').onclick=()=>{if(G.dst>=0){G.Vh=mtrans(cneg(G.net.f[G.dst]));drawGreedy();}};
$('rgN').oninput=e=>{$('outN').textContent=e.target.value;};$('rgN').onchange=newNet;$('cbBar').onchange=newNet;$('cbShort').onchange=drawGreedy;$('btNew').onclick=newNet;
views.push(drawGreedy);

/* ---------- Statistics ---------- */
const ST={res:null,running:false};
function runTrials(){if(ST.running)return;ST.running=true;const n=+$('rgN2').value,bar=$('cbBar2').checked,T=25;const rng=mulberry(Date.now()%1e9);
  const acc={pairs:0,eu:{fail:0,str:[],cong:[]},hy:{fail:0,str:[],cong:[]},tr:{fail:0,str:[],cong:[]},deg:0,minr:1,n,bar,T};let k=0;
  const step=()=>{const N=genNetwork(n,rng,bar);const S=netStats(N);acc.pairs+=S.pairs;acc.deg+=2*N.m/n;for(const key of ['eu','hy','tr']){acc[key].fail+=S[key].fail;acc[key].str.push(...S[key].str);acc[key].cong.push(...S[key].cong);}
    for(const z of Object.values(N.f))acc.minr=Math.min(acc.minr,1-cabs(z));k++;$('runStatus').textContent=`${k}/${T}`;
    if(k<T)setTimeout(step,0);else{ST.res=acc;ST.running=false;$('runStatus').textContent='done';drawStats();}};setTimeout(step,0);}
function drawStats(){const A=ST.res;if(!A)return;const ce=pct(A.eu.cong,.8);const rows=[['Euclidean greedy','eu',tok('--euc')],['Hyperbolic greedy','hy',tok('--hyp')],['Spanning tree','tr',tok('--tree')]];
  $('tbStats').innerHTML=`<tr><th>Scheme</th><th>Delivery failure</th><th>Stretch p80</th><th>Congestion p80</th></tr>`+rows.map(([nm,k,c])=>{const cg=pct(A[k].cong,.8)/ce-1;
    return `<tr><td><span style="color:${c}">●</span> ${nm}</td><td>${(100*A[k].fail/A.pairs).toFixed(1)}%</td><td>${pct(A[k].str,.8).toFixed(2)}</td><td>${k==='eu'?'—':(cg>=0?'+':'')+(100*cg).toFixed(0)+'%'}</td></tr>`;}).join('');
  $('rdMeta').textContent=`${A.T} networks · ${A.n} nodes${A.bar?' · barrier':''} · ${(A.deg/A.T).toFixed(1)} links/node · ${A.pairs.toLocaleString()} routes in total · closest node to the rim: 1 − |z| = ${A.minr.toExponential(1)}. Congestion is shown relative to Euclidean greedy.`;
  const{ctx,w,h}=fit($('cvCdf'),0.72,560);const L=40,R=10,T=10,B=32,W=w-L-R,H=h-T-B;const X=s=>L+(s-1)/5*W,Y=p=>T+H-p*H;
  ctx.font='11px '+tok('--mono');ctx.fillStyle=tok('--muted');ctx.strokeStyle=tok('--line');ctx.lineWidth=1;
  for(let p=0;p<=1.001;p+=0.25){ctx.beginPath();ctx.moveTo(L,Y(p));ctx.lineTo(L+W,Y(p));ctx.stroke();ctx.textAlign='right';ctx.fillText(p.toFixed(2),L-5,Y(p)+4);}
  for(let s=1;s<=6;s++){ctx.textAlign='center';ctx.fillText(s,X(s),T+H+15);}ctx.fillText('stretch',L+W/2,T+H+29);
  ctx.save();ctx.beginPath();ctx.rect(L,T,W,H);ctx.clip();
  for(const[nm,k,c] of rows){const s=A[k].str.slice().sort((a,b)=>a-b);const tot=A.pairs;ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(X(1),Y(0));
    for(let i=0;i<s.length;i++){if(i>0&&s[i]===s[i-1]&&i<s.length-1)continue;ctx.lineTo(X(s[i]),Y(i/tot));ctx.lineTo(X(s[i]),Y((i+1)/tot));}ctx.lineTo(X(6.5),Y(s.length/tot));ctx.stroke();}
  ctx.restore();ctx.strokeStyle=tok('--muted');ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(L,Y(0.8));ctx.lineTo(L+W,Y(0.8));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=tok('--muted');ctx.textAlign='left';ctx.fillText('80th percentile',L+W-100,Y(0.8)-5);}
$('rgN2').oninput=e=>{$('outN2').textContent=e.target.value;};$('btRun').onclick=runTrials;views.push(drawStats);

const SW={data:[]};
function runSweep(){const sizes=[30,40,50,60,70,80,90];let i=0,j=0;const rng=mulberry(4242);let acc={eu:0,hy:0,pairs:0};
  const step=()=>{const n=sizes[i];const N=genNetwork(n,rng,false);const S=netStats(N);acc.eu+=S.eu.fail;acc.hy+=S.hy.fail;acc.pairs+=S.pairs;j++;
    if(j===6){SW.data.push({n,eu:100*acc.eu/acc.pairs,hy:100*acc.hy/acc.pairs});acc={eu:0,hy:0,pairs:0};j=0;i++;drawSweep();}if(i<sizes.length)setTimeout(step,0);};setTimeout(step,0);}
function drawSweep(){const{ctx,w,h}=fit($('cvSweep'),0.62,560);const L=40,R=12,T=12,B=32,W=w-L-R,H=h-T-B;const ymax=Math.max(20,...SW.data.map(d=>d.eu));const X=n=>L+(n-30)/60*W,Y=v=>T+H-v/ymax*H;
  ctx.font='11px '+tok('--mono');ctx.fillStyle=tok('--muted');ctx.strokeStyle=tok('--line');ctx.lineWidth=1;
  for(let v=0;v<=ymax;v+=5){ctx.beginPath();ctx.moveTo(L,Y(v));ctx.lineTo(L+W,Y(v));ctx.stroke();ctx.textAlign='right';ctx.fillText(v+'%',L-5,Y(v)+4);}
  for(let n=30;n<=90;n+=10){ctx.textAlign='center';ctx.fillText(n,X(n),T+H+15);}ctx.fillText('nodes in the same circle',L+W/2,T+H+29);
  if(!SW.data.length){ctx.fillText('computing…',L+W/2,T+H/2);return;}
  for(const[k,c] of [['eu',tok('--euc')],['hy',tok('--hyp')]]){ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2.2;ctx.beginPath();SW.data.forEach((d,i)=>{i?ctx.lineTo(X(d.n),Y(d[k])):ctx.moveTo(X(d.n),Y(d[k]));});ctx.stroke();
    SW.data.forEach(d=>{ctx.beginPath();ctx.arc(X(d.n),Y(d[k]),3,0,2*Math.PI);ctx.fill();});}
  const d0=SW.data[0];ctx.textAlign='left';ctx.font='12px '+tok('--body');ctx.fillStyle=tok('--euc');ctx.fillText('Euclidean',X(d0.n)+8,Y(d0.eu)+4);ctx.fillStyle=tok('--hyp');ctx.fillText('Hyperbolic',X(d0.n)+8,Y(0)-6);}
views.push(drawSweep);

/* ---------- Poincaré ball ---------- */
(function(){const cv=$('cvBall');let yaw=0.4,pitch=0.35,run=false,last=0;const nodes=[];
  const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};const tet=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(norm);
  function perp(v){const a=Math.abs(v[0])<0.9?[1,0,0]:[0,1,0];const c=[v[1]*a[2]-v[2]*a[1],v[2]*a[0]-v[0]*a[2],v[0]*a[1]-v[1]*a[0]];return norm(c);}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function build(dir,depth,parent,spread){const r=Math.tanh(depth*1.0/2);nodes.push({p:dir.map(x=>x*r),parent,depth});const me=nodes.length-1;if(depth>=4)return;
    const kids=depth===0?tet:(()=>{const e1=perp(dir),e2=cross(dir,e1);const out=[];for(let k=0;k<3;k++){const t=2*Math.PI*k/3+depth;out.push(norm(dir.map((x,i)=>x*Math.cos(spread)+(e1[i]*Math.cos(t)+e2[i]*Math.sin(t))*Math.sin(spread))));}return out;})();
    for(const c of kids)build(c,depth+1,me,spread*0.5);}
  build([0,0,1],0,-1,0.75);
  function draw(){const{ctx,w,h}=fit(cv,0.9,560);const sc=Math.min(w,h)*0.4;const ink=tok('--muted');
    ctx.beginPath();ctx.arc(w/2,h/2,sc*3.2/3.2,0,2*Math.PI);ctx.fillStyle=tok('--soft');ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.stroke();
    ctx.globalAlpha=0.35;for(let k=0;k<6;k++){const ang=k*Math.PI/6;ctx.beginPath();for(let j=0;j<=72;j++){const t=2*Math.PI*j/72;const p=proj([Math.cos(t)*Math.cos(ang),Math.cos(t)*Math.sin(ang),Math.sin(t)],yaw,pitch,w,h,sc);j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();}
    ctx.beginPath();for(let j=0;j<=72;j++){const t=2*Math.PI*j/72;const p=proj([Math.cos(t),Math.sin(t),0],yaw,pitch,w,h,sc);j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();ctx.globalAlpha=1;
    const P=nodes.map(n=>proj(n.p,yaw,pitch,w,h,sc));const order=nodes.map((_,i)=>i).sort((a,b)=>P[b][2]-P[a][2]);
    ctx.strokeStyle=tok('--hyp');for(const i of order){const n=nodes[i];if(n.parent<0)continue;ctx.lineWidth=Math.max(0.6,2.2-n.depth*0.4);ctx.globalAlpha=0.5+0.4*(P[i][2]<0);ctx.beginPath();ctx.moveTo(P[n.parent][0],P[n.parent][1]);ctx.lineTo(P[i][0],P[i][1]);ctx.stroke();}
    ctx.globalAlpha=1;for(const i of order){const n=nodes[i];ctx.beginPath();ctx.arc(P[i][0],P[i][1],Math.max(1.6,5-n.depth),0,2*Math.PI);ctx.fillStyle=n.depth===0?tok('--euc'):tok('--hyp');ctx.fill();}}
  function loop(t){if(!run)return;yaw+=(t-last)/1000*0.2;last=t;draw();if(!reduceMotion)requestAnimationFrame(loop);}
  visible(cv,v=>{run=v;if(v&&!reduceMotion){last=performance.now();requestAnimationFrame(loop);}else draw();});
  let px,py;onDrag(cv,(x,y)=>{px=x;py=y;},(x,y)=>{yaw+=(x-px)*0.01;pitch=Math.max(-1.3,Math.min(1.3,pitch+(y-py)*0.01));px=x;py=y;draw();});views.push(draw);})();

/* ---------- Hex 7-coloring with unit segment ---------- */
const HEX_S=0.45;
function hexRound(q,r){let x=q,z=r,y=-x-z;let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return[rx,rz];}
function toHex(x,y,s){return hexRound((Math.sqrt(3)/3*x-y/3)/s,(2/3*y)/s);}
function hexCenter(q,r,s){return[s*(Math.sqrt(3)*q+Math.sqrt(3)/2*r),s*1.5*r];}
function hexPath(ctx,X,Y,q,r,s){const[c0,c1]=hexCenter(q,r,s);ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/180*(60*k-30);const p=[X(c0+s*Math.cos(a)),Y(c1+s*Math.sin(a))];k?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.closePath();}
(function(){const cv=$('cvHex');let A={x:-0.4,y:0.1},th=0.35,mode=null,grab;let W2S;
  const B=()=>({x:A.x+Math.cos(th),y:A.y+Math.sin(th)});const col7=(q,r)=>(((q+3*r)%7)+7)%7;
  function draw(){const{ctx,w,h}=fit(cv,0.8,600);const span=4.2,sc=w/span;const X=x=>w/2+x*sc,Y=y=>h/2-y*sc;W2S={sc,w,h};const pal=palette(7);
    ctx.lineWidth=1;ctx.strokeStyle=tok('--panel');for(let q=-10;q<=10;q++)for(let r=-6;r<=6;r++){const[c0,c1]=hexCenter(q,r,HEX_S);if(Math.abs(X(c0)-w/2)>w/2+30||Math.abs(Y(c1)-h/2)>h/2+30)continue;hexPath(ctx,X,Y,q,r,HEX_S);ctx.fillStyle=pal[col7(q,r)];ctx.fill();ctx.stroke();
      ctx.fillStyle=tok('--ink');ctx.globalAlpha=0.45;ctx.font='10px '+tok('--mono');ctx.textAlign='center';ctx.fillText(col7(q,r)+1,X(c0),Y(c1)+3);ctx.globalAlpha=1;}
    const b=B();ctx.strokeStyle=tok('--ink');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(A.x),Y(A.y));ctx.lineTo(X(b.x),Y(b.y));ctx.stroke();
    for(const p of [A,b]){ctx.beginPath();ctx.arc(X(p.x),Y(p.y),8,0,2*Math.PI);ctx.fillStyle=tok('--panel');ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=tok('--ink');ctx.stroke();}
    const ha=toHex(A.x,A.y,HEX_S),hb=toHex(b.x,b.y,HEX_S);const ca=col7(...ha)+1,cb=col7(...hb)+1;
    $('rdHex').innerHTML=`<div class="kv"><span class="k">end 1</span><span>color ${ca}</span><span class="k">end 2</span><span>color ${cb}</span><span class="k">length</span><span>${Math.hypot(b.x-A.x,b.y-A.y).toFixed(3)}</span><span class="k">verdict</span><span class="${ca!==cb?'ok':'no'}">${ca!==cb?'different colors':'same color'}</span></div>`;}
  const toW=(x,y)=>({x:(x-W2S.w/2)/W2S.sc,y:-(y-W2S.h/2)/W2S.sc});
  onDrag(cv,(x,y)=>{const p=toW(x,y),b=B();const dA=Math.hypot(p.x-A.x,p.y-A.y),dB=Math.hypot(p.x-b.x,p.y-b.y);const tol=16/W2S.sc;
      if(dB<tol){mode='rotB';}else if(dA<tol){mode='rotA';}else{const t=Math.max(0,Math.min(1,((p.x-A.x)*Math.cos(th)+(p.y-A.y)*Math.sin(th))));const qx=A.x+t*Math.cos(th),qy=A.y+t*Math.sin(th);if(Math.hypot(p.x-qx,p.y-qy)<tol){mode='move';grab={dx:p.x-A.x,dy:p.y-A.y};}else return false;}},
    (x,y)=>{const p=toW(x,y);if(mode==='rotB')th=Math.atan2(p.y-A.y,p.x-A.x);else if(mode==='rotA'){const b=B();th=Math.atan2(b.y-p.y,b.x-p.x);A={x:b.x-Math.cos(th),y:b.y-Math.sin(th)};}else{A={x:p.x-grab.dx,y:p.y-grab.dy};}draw();});views.push(draw);})();

/* ---------- Star graph packing ---------- */
function drawStar(){const n=+$('rgStar').value;$('outStar').textContent=n;
  {const{ctx,w,h}=fit($('cvStarE'),1,460);const c=[w/2,h/2],R=Math.min(w,h)*0.38;const pts=[];for(let i=0;i<n;i++){const t=2*Math.PI*i/n+Math.PI/2;pts.push([c[0]+R*Math.cos(t),c[1]-R*Math.sin(t)]);}
    let bad=0;ctx.strokeStyle=tok('--bad');ctx.lineWidth=1.6;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])<R-1e-9){bad++;ctx.beginPath();ctx.moveTo(...pts[i]);ctx.lineTo(...pts[j]);ctx.stroke();}}
    ctx.strokeStyle=tok('--euc');ctx.lineWidth=1.6;for(const p of pts){ctx.beginPath();ctx.moveTo(...c);ctx.lineTo(...p);ctx.stroke();}
    for(const p of pts){ctx.beginPath();ctx.arc(p[0],p[1],4,0,2*Math.PI);ctx.fillStyle=tok('--ink');ctx.fill();}ctx.beginPath();ctx.arc(c[0],c[1],6,0,2*Math.PI);ctx.fillStyle=tok('--euc');ctx.fill();
    $('rdStarE').innerHTML=bad?`<span class="no">${bad} leaf pairs are closer to each other than to the hub.</span> Greedy fails between them. Spokes are ${(360/n).toFixed(1)}° apart; they need more than 60°.`:`<span class="ok">Greedy works.</span> Spokes are ${(360/n).toFixed(1)}° apart, more than 60°. Try 6 or more.`;}
  {const{ctx,w,h}=fit($('cvStarH'),1,460);const V=DV(w,h);rim(ctx,V);const th=2*Math.PI/n,c=Math.cos(th);const need=c/(1-c);const rStar=need>1?Math.acosh(need):0;const r=Math.max(0.9,rStar*1.08+0.35);const er=Math.tanh(r/2);
    const pts=[];for(let i=0;i<n;i++)pts.push(cscale(cexp(th*i+Math.PI/2),er));let bad=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(hdist(pts[i],pts[j])<=r)bad++;
    ctx.strokeStyle=tok('--hyp');ctx.lineWidth=1.6;for(const p of pts){ctx.beginPath();ctx.moveTo(V.ox,V.oy);ctx.lineTo(...V.sc(p));ctx.stroke();}
    for(const p of pts){const[x,y]=V.sc(p);ctx.beginPath();ctx.arc(x,y,Math.max(1.8,(1-cabs2(p))*6),0,2*Math.PI);ctx.fillStyle=tok('--ink');ctx.fill();}ctx.beginPath();ctx.arc(V.ox,V.oy,6,0,2*Math.PI);ctx.fillStyle=tok('--hyp');ctx.fill();
    $('rdStarH').innerHTML=`<span class="${bad?'no':'ok'}">${bad?bad+' violating pairs':'Greedy works'}.</span> Leaves at hyperbolic radius ${r.toFixed(2)} (minimum ${rStar.toFixed(2)}; 2 ln(n/π) = ${Math.max(0,2*Math.log(n/Math.PI)).toFixed(2)}). Neighboring leaves are ${hdist(pts[0],pts[1%n]).toFixed(2)} apart, farther than the ${r.toFixed(2)} to the hub.`;}}
$('rgStar').oninput=drawStar;views.push(drawStar);

/* ---------- Frequency reuse ---------- */
function reuseTree(d,m,V,S){const F=kframe(d);const nodes=genTiles(F,F.a,0,V,S,3200,1.2);F.view=V;
  const nb=nodes.map(()=>[]);for(const n of nodes)if(n.from>=0){nb[n.idx].push(n.from);nb[n.from].push(n.idx);}
  const col=new Array(nodes.length).fill(-1);let K=0;
  for(let x=0;x<nodes.length;x++){const forb=new Set();const dist=new Map([[x,0]]);const q=[x];let h=0;while(h<q.length){const y=q[h++];const dy=dist.get(y);if(dy>=m-1)continue;for(const z of nb[y])if(!dist.has(z)){dist.set(z,dy+1);q.push(z);if(col[z]>=0)forb.add(col[z]);}}
    let c=0;while(forb.has(c))c++;col[x]=c;K=Math.max(K,c+1);}
  const dist=new Map([[0,0]]);const q=[0];let h=0;const tier=[];let ring=0;while(h<q.length){const y=q[h++];const dy=dist.get(y);if(dy===m){ring++;if(col[y]===col[0])tier.push(y);continue;}for(const z of nb[y])if(!dist.has(z)){dist.set(z,dy+1);q.push(z);}}
  return{F,nodes,col,K,tier,ring};}
function hexReuse(m){const i=Math.ceil(m/2),j=Math.floor(m/2);return{i,j,K:i*i+i*j+j*j};}
function drawReuse(){const d=+$('rgRd').value,m=+$('rgRm').value;$('outRd').textContent=d;$('outRm').textContent=m;
  let RT;{const{ctx,w,h}=fit($('cvReuseH'),1,520);const V=DV(w,h);rim(ctx,V);const VC=mtrans(cneg(kframe(d).u));RT=reuseTree(d,m,VC,V.S);const pal=palette(RT.K);
    ctx.lineWidth=0.6;ctx.strokeStyle=tok('--panel');for(const n of RT.nodes){tilePath(ctx,V,RT.F,VC,n.mu);ctx.fillStyle=pal[RT.col[n.idx]];ctx.fill();if((1-cabs2(n.vf))*V.S>3)ctx.stroke();}
    ctx.strokeStyle=tok('--ink');ctx.lineWidth=2.5;tilePath(ctx,V,RT.F,VC,RT.nodes[0].mu);ctx.stroke();
    ctx.fillStyle=tok('--ink');for(const t of RT.tier){const[x,y]=V.sc(RT.nodes[t].vf);ctx.beginPath();ctx.arc(x,y,Math.max(1.5,Math.min(4,(1-cabs2(RT.nodes[t].vf))*5)),0,2*Math.PI);ctx.fill();}}
  const HX=hexReuse(m);{const{ctx,w,h}=fit($('cvReuseE'),1,520);const s=Math.min(w,h)/(m>=4?13:10);const X=x=>w/2+x,Y=y=>h/2-y;const pal=palette(HX.K);const keys=new Map();
    const colOf=(q,r)=>{const A=(HX.i+HX.j)*q+HX.j*r,Bn=-HX.j*q+HX.i*r;const key=(((A%HX.K)+HX.K)%HX.K)+','+(((Bn%HX.K)+HX.K)%HX.K);if(!keys.has(key))keys.set(key,keys.size);return keys.get(key);};
    ctx.lineWidth=1;ctx.strokeStyle=tok('--panel');for(let q=-14;q<=14;q++)for(let r=-14;r<=14;r++){const[c0,c1]=hexCenter(q,r,s);if(Math.abs(c0)>w/2+s||Math.abs(c1)>h/2+s)continue;hexPath(ctx,X,Y,q,r,s);ctx.fillStyle=pal[colOf(q,r)];ctx.fill();ctx.stroke();}
    ctx.strokeStyle=tok('--ink');ctx.lineWidth=2.5;hexPath(ctx,X,Y,0,0,s);ctx.stroke();
    const vecs=[[HX.i,HX.j],[-HX.j,HX.i+HX.j],[-HX.i-HX.j,HX.i],[-HX.i,-HX.j],[HX.j,-HX.i-HX.j],[HX.i+HX.j,-HX.i]];ctx.fillStyle=tok('--ink');for(const[q,r] of vecs){const[c0,c1]=hexCenter(q,r,s);ctx.beginPath();ctx.arc(X(c0),Y(c1),4,0,2*Math.PI);ctx.fill();}}
  const expK=m===2?2:m===3?d+1:2*d;
  $('tbReuse').innerHTML=`<tr><th></th><th>Hyperbolic (d = ${d})</th><th>Hexagons (6)</th></tr><tr><td>Channel groups needed</td><td>${RT.K}</td><td>${HX.K}</td></tr><tr><td>Spectrum per cell</td><td>1/${RT.K}</td><td>1/${HX.K}</td></tr><tr><td>Cells exactly ${m} steps away</td><td>${RT.ring}</td><td>${6*m}</td></tr><tr><td>…of which co-channel (first tier)</td><td>${RT.tier.length}</td><td>6</td></tr>`+(RT.K!==expK?`<tr><td colspan="3" class="k">expected ${expK}</td></tr>`:'');}
$('rgRd').oninput=drawReuse;$('rgRm').oninput=drawReuse;views.push(drawReuse);

/* ---------- Shannon ---------- */
function drawShannon(){const g=+$('rgGamma').value;$('outGamma').textContent=g.toFixed(1);const Ks=[1,3,4,7,9,12,13,19];
  const data=Ks.map(K=>{const sir=Math.pow(Math.sqrt(3*K),g)/6;return{K,sir,eff:Math.log2(1+sir)/K};});const best=data.reduce((a,b)=>b.eff>a.eff?b:a);
  const{ctx,w,h}=fit($('cvShannon'),0.6,620);const L=46,R=10,T=26,B=40,W=w-L-R,H=h-T-B;const ymax=Math.max(1.2,...data.map(d=>d.eff))*1.15;const bw=W/data.length;
  ctx.font='11px '+tok('--mono');ctx.strokeStyle=tok('--line');ctx.fillStyle=tok('--muted');ctx.lineWidth=1;
  for(let v=0;v<=ymax;v+=0.5){const y=T+H-v/ymax*H;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+W,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(v.toFixed(1),L-5,y+4);}
  data.forEach((d,i)=>{const x=L+i*bw+bw*0.18,bh=d.eff/ymax*H;ctx.fillStyle=d===best?tok('--hyp'):tok('--tree');ctx.globalAlpha=d===best?1:0.55;ctx.fillRect(x,T+H-bh,bw*0.64,bh);ctx.globalAlpha=1;
    ctx.fillStyle=tok('--muted');ctx.textAlign='center';ctx.fillText('K='+d.K,x+bw*0.32,T+H+15);ctx.fillText((10*Math.log10(d.sir)).toFixed(0)+' dB',x+bw*0.32,T+H+29);ctx.fillStyle=tok('--ink');ctx.fillText(d.eff.toFixed(2),x+bw*0.32,T+H-bh-6);});
  ctx.textAlign='left';ctx.fillStyle=tok('--muted');ctx.font='12px '+tok('--body');ctx.fillText('bits/s/Hz per cell, (1/K)·log₂(1 + SIR); SIR shown under each bar',L,14);}
$('rgGamma').oninput=drawShannon;views.push(drawShannon);

/* ---------- boot ---------- */
newNet();drawSweep();
let rt,lastW=document.body.clientWidth;new ResizeObserver(()=>{const w=document.body.clientWidth;if(w===lastW)return;lastW=w;clearTimeout(rt);rt=setTimeout(redrawAll,80);}).observe(document.body);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redrawAll);
new MutationObserver(redrawAll).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
redrawAll();setTimeout(runTrials,300);setTimeout(runSweep,600);
