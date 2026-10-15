const cx=(re,im=0)=>({re,im});
const cadd=(a,b)=>({re:a.re+b.re,im:a.im+b.im});
const csub=(a,b)=>({re:a.re-b.re,im:a.im-b.im});
const cneg=a=>({re:-a.re,im:-a.im});
const cmul=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
const cdiv=(a,b)=>{const d=b.re*b.re+b.im*b.im;return{re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};
const cconj=a=>({re:a.re,im:-a.im});
const cabs2=a=>a.re*a.re+a.im*a.im;
const cabs=a=>Math.hypot(a.re,a.im);
const cscale=(a,s)=>({re:a.re*s,im:a.im*s});
const cexp=t=>({re:Math.cos(t),im:Math.sin(t)});
const Mob=(a,b,c,d)=>({a,b,c,d});
function mnorm(m){const s=Math.sqrt(Math.max(cabs2(m.a),cabs2(m.b),cabs2(m.c),cabs2(m.d)));return Mob(cscale(m.a,1/s),cscale(m.b,1/s),cscale(m.c,1/s),cscale(m.d,1/s));}
function mapply(m,z){return cdiv(cadd(cmul(m.a,z),m.b),cadd(cmul(m.c,z),m.d));}
function mmul(m,n){return mnorm(Mob(cadd(cmul(m.a,n.a),cmul(m.b,n.c)),cadd(cmul(m.a,n.b),cmul(m.b,n.d)),cadd(cmul(m.c,n.a),cmul(m.d,n.c)),cadd(cmul(m.c,n.b),cmul(m.d,n.d))));}
function minv(m){return Mob(m.d,cneg(m.b),cneg(m.c),m.a);}
const MID=Mob(cx(1),cx(0),cx(0),cx(1));
function mtrans(p){return Mob(cx(1),p,cconj(p),cx(1));}
function mrot(t){return Mob(cexp(t),cx(0),cx(0),cx(1));}
function hdelta(z,w){return cabs2(csub(z,w))/((1-cabs2(z))*(1-cabs2(w)));}
function hdist(z,w){return Math.acosh(1+2*hdelta(z,w));}
function onDisk(z){const r=cabs(z);return r>0?cscale(z,1/r):z;}

const frameCache={};
function kframe(d){
  if(frameCache[d])return frameCache[d];
  const z0=cmul(cx(0,-1),cexp(Math.PI/d));
  const phi=s=>Mob(cx(1),cx(0,-s),cx(0,s),cx(1));
  const f=s=>{const w=mapply(phi(s),z0);return Math.atan2(w.im,w.re);};
  let lo=-0.9999999,hi=0;
  for(let k=0;k<200;k++){const m=(lo+hi)/2;if(f(m)<0)hi=m;else lo=m;}
  const s=(lo+hi)/2;
  const sigma=mmul(phi(s),Mob(cx(0,-1),cx(0),cx(0),cx(1)));
  const b=mmul(sigma,mmul(mrot(2*Math.PI/d),minv(sigma)));
  const a=Mob(cx(-1),cx(0),cx(0),cx(1));
  const u=mapply(sigma,cx(0)),v=cneg(u);
  const bpow=[MID];for(let i=1;i<d;i++)bpow.push(mmul(b,bpow[i-1]));
  const verts=[];for(let k=0;k<d;k++)verts.push(cexp((2*k+1)*Math.PI/d));
  const tileBase=mmul(a,sigma);
  return frameCache[d]={d,s,sigma,b,a,u,v,bpow,verts,tileBase};
}
function embedTree(root,children,d){
  const F=kframe(d);const mu={},f={};
  mu[root]=F.a;f[root]=mapply(minv(F.a),F.v);
  const st=[root];
  while(st.length){const w=st.pop();const ch=children[w]||[];let i=(w===root)?0:1;
    for(const c of ch){mu[c]=mmul(F.bpow[i],mmul(F.a,mu[w]));f[c]=mapply(minv(mu[c]),F.v);i++;st.push(c);}}
  return {mu,f,F};
}
if(typeof module!=='undefined')module.exports={cx,cadd,csub,cneg,cmul,cdiv,cconj,cabs2,cabs,cscale,cexp,Mob,mnorm,mapply,mmul,minv,MID,mtrans,mrot,hdelta,hdist,onDisk,kframe,embedTree};
