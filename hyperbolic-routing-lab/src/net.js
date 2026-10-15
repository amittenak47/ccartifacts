function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function segCross(p1,p2,p3,p4){
  const o=(a,b,c)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
  return o(p1,p2,p3)!==o(p1,p2,p4)&&o(p3,p4,p1)!==o(p3,p4,p2);
}
const BARRIER=[{x:-1/3,y:0},{x:1/3,y:0}];
function genNetwork(n,rng,barrier,R=Math.sqrt(5)){
  for(let attempt=0;attempt<500;attempt++){
    const pts=[];for(let i=0;i<n;i++){const r=R*Math.sqrt(rng()),t=2*Math.PI*rng();pts.push({x:r*Math.cos(t),y:r*Math.sin(t)});}
    const adj=pts.map(()=>[]);let m=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
      if(dx*dx+dy*dy<=1){if(barrier&&segCross(pts[i],pts[j],BARRIER[0],BARRIER[1]))continue;adj[i].push(j);adj[j].push(i);m++;}}
    const seen=new Array(n).fill(false);const q=[0];seen[0]=true;let c=1;
    while(q.length){const x=q.pop();for(const y of adj[x])if(!seen[y]){seen[y]=true;c++;q.push(y);}}
    if(c===n)return buildNet(pts,adj,m,barrier);
  }
  return null;
}
function ed(p,q){return Math.hypot(p.x-q.x,p.y-q.y);}
function buildNet(pts,adj,m,barrier){
  const n=pts.length;
  // Prim MST on graph edges
  const inT=new Array(n).fill(false),best=new Array(n).fill(Infinity),par=new Array(n).fill(-1);best[0]=0;
  const tadj=pts.map(()=>[]);
  for(let k=0;k<n;k++){let x=-1;for(let i=0;i<n;i++)if(!inT[i]&&(x<0||best[i]<best[x]))x=i;inT[x]=true;
    if(par[x]>=0){tadj[x].push(par[x]);tadj[par[x]].push(x);}
    for(const y of adj[x]){const w=ed(pts[x],pts[y]);if(!inT[y]&&w<best[y]){best[y]=w;par[y]=x;}}}
  // tree center as root
  const bfs=(src,A)=>{const d=new Array(n).fill(-1);d[src]=0;const q=[src];let h=0;while(h<q.length){const x=q[h++];for(const y of A[x])if(d[y]<0){d[y]=d[x]+1;q.push(y);}}return d;};
  let root=0,bestE=Infinity;for(let i=0;i<n;i++){const e=Math.max(...bfs(i,tadj));if(e<bestE){bestE=e;root=i;}}
  const parent=new Array(n).fill(-1),depth=new Array(n).fill(0),children=pts.map(()=>[]);
  {const q=[root];const seen=new Array(n).fill(false);seen[root]=true;let h=0;
   while(h<q.length){const x=q[h++];for(const y of tadj[x])if(!seen[y]){seen[y]=true;parent[y]=x;depth[y]=depth[x]+1;children[x].push(y);q.push(y);}}}
  // order children by angle around parent, counterclockwise starting after the parent direction
  for(let x=0;x<n;x++){const p=pts[x];const ref=parent[x]>=0?Math.atan2(pts[parent[x]].y-p.y,pts[parent[x]].x-p.x):0;
    children[x].sort((a,b)=>{const A=(Math.atan2(pts[a].y-p.y,pts[a].x-p.x)-ref+4*Math.PI)%(2*Math.PI);const B=(Math.atan2(pts[b].y-p.y,pts[b].x-p.x)-ref+4*Math.PI)%(2*Math.PI);return A-B;});}
  let dmax=0;for(let i=0;i<n;i++)dmax=Math.max(dmax,tadj[i].length);const d=Math.max(3,dmax);
  const emb=embedTree(root,children,d);
  const hop=pts.map((_,i)=>bfs(i,adj));
  return {pts,adj,m,barrier,tadj,root,parent,depth,children,d,f:emb.f,mu:emb.mu,F:emb.F,hop,treeDepth:bestE};
}
function routeEuclid(N,s,t){const P=N.pts;const path=[s];let x=s;
  while(x!==t){let best=-1,bd=ed(P[x],P[t]);for(const y of N.adj[x]){const dd=ed(P[y],P[t]);if(dd<bd){bd=dd;best=y;}}
    if(best<0)return{path,ok:false};x=best;path.push(x);if(path.length>500)return{path,ok:false};}
  return{path,ok:true};}
function routeHyp(N,s,t){const f=N.f;const path=[s];let x=s;
  while(x!==t){let best=-1,bd=hdelta(f[x],f[t]);for(const y of N.adj[x]){const dd=hdelta(f[y],f[t]);if(dd<bd){bd=dd;best=y;}}
    if(best<0)return{path,ok:false};x=best;path.push(x);if(path.length>500)return{path,ok:false};}
  return{path,ok:true};}
function routeTree(N,s,t){let a=s,b=t;const A=[a],B=[b];
  while(a!==b){if(N.depth[a]>=N.depth[b]){a=N.parent[a];A.push(a);}else{b=N.parent[b];B.push(b);}}
  B.pop();return{path:A.concat(B.reverse()),ok:true};}
function pct(arr,p){if(!arr.length)return NaN;const s=arr.slice().sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*(s.length-1)+0.5))];}
function netStats(N){const n=N.pts.length;const res={eu:{fail:0,str:[],cong:new Array(n).fill(0)},hy:{fail:0,str:[],cong:new Array(n).fill(0)},tr:{fail:0,str:[],cong:new Array(n).fill(0)},pairs:0};
  for(let s=0;s<n;s++)for(let t=0;t<n;t++){if(s===t)continue;res.pairs++;const sp=N.hop[s][t];
    for(const [k,fn] of [['eu',routeEuclid],['hy',routeHyp],['tr',routeTree]]){const r=fn(N,s,t);
      if(!r.ok){res[k].fail++;continue;}res[k].str.push((r.path.length-1)/sp);for(const v of r.path)res[k].cong[v]++;}}
  return res;}
if(typeof module!=='undefined')module.exports={mulberry,genNetwork,routeEuclid,routeHyp,routeTree,netStats,pct};
