import{b as g}from"./browser-polyfill-CZ_dLIqp.js";import{s as C,q as w,e as v,p as S,f as T,d as B,b as k,E as L}from"./auth-DamYbgfF.js";import{P as p}from"./classroom-BFFu9rzf.js";const y="better-bbo-cc-print-runtime",m="better-bbo-cc-print-static",P=`
@media print {
  #buttonDiv,
  .form-header,
  .buttonStyle,
  button.btn,
  .print-button,
  .no-print {
    display: none !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
  }
  #entireTable td,
  #entireTable tr,
  table.ccTable td,
  table.ccTable tr {
    page-break-inside: avoid !important;
  }
}
@page {
  size: letter landscape;
  margin: 0.3in;
}
`;function O(){D(),window.addEventListener("beforeprint",R),window.addEventListener("afterprint",x)}function D(){if(document.getElementById(m))return;const t=document.createElement("style");t.id=m,t.textContent=P,document.head.appendChild(t)}function R(){x();const t=$();if(!t)return;const{width:n,height:r}=t.getBoundingClientRect();if(!Number.isFinite(n)||n<=0)return;const i=(11-.3*2)*96,e=(8.5-.3*2)*96*.94,o=Math.min(i/n,r>0?e/r:1),a=o<1?o:1,E=`
@media print {
  #mainDiv {
    position: static !important;
    width: ${n}px !important;
    height: auto !important;
    overflow: visible !important;
    zoom: ${a.toFixed(4)};
  }
  #ccDiv {
    position: static !important;
    top: 0 !important;
    width: ${n}px !important;
    height: auto !important;
    overflow: visible !important;
    visibility: visible !important;
  }
}
`.trim(),s=document.createElement("style");s.id=y,s.textContent=E,document.head.appendChild(s)}function x(){const t=document.getElementById(y);t&&t.remove()}function $(){return document.getElementById("entireTable")||document.querySelector("table.ccTable")||document.getElementById("ccDiv")||document.getElementById("mainDiv")}const d="[better-bbo-cc/editor]",c="better-bbo-cc-editor-toolbar",u="better-bbo-cc-editor-styles";I();function I(){O(),_(),F(),console.log(d,"initialized")}function _(){if(document.getElementById(u))return;const t=document.createElement("style");t.id=u,t.textContent=`
    #${c} {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 99999;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 8px;
      background: rgba(255,255,255,0.95);
      border: 1px solid #888;
      border-radius: 4px;
      font: 12px/1.4 system-ui, sans-serif;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    #${c} button {
      cursor: pointer;
      padding: 3px 8px;
      border: 1px solid #888;
      background: #fff;
      border-radius: 3px;
      font: inherit;
    }
    #${c} button:hover { background: #eef; }
    #${c} button:disabled { opacity: 0.5; cursor: progress; }
    @media screen {
      body { padding-top: var(--better-bbo-cc-toolbar-height, 0); }
    }
    @media print {
      #${c} { display: none !important; }
    }
  `,document.head.appendChild(t)}function F(){if(document.getElementById(c))return;const t=document.createElement("div");t.id=c;const n=document.createElement("span");if(n.textContent="Better CC:",n.style.alignSelf="center",n.style.fontWeight="bold",t.appendChild(n),window.top!==window.self){const e=document.createElement("button");e.type="button",e.textContent="↗ Open in tab",e.title="Open this card in a new full-size browser tab",e.addEventListener("click",()=>{window.open(window.location.href,"_blank","noopener")}),t.appendChild(e)}const r=/\/acblcc\.html$/i.test(window.location.pathname),i=document.createElement("button");if(i.type="button",i.textContent="Export JSON",i.title="Download this card as portable JSON",i.addEventListener("click",()=>U(i)),r&&t.appendChild(i),r)b(t,"Print…","Print the card: an ACBL card, or this page as BBO shows it","print"),b(t,"Export PDF…","Download the last saved version as an ACBL card","export"),f(t,"Edit on Bridge Craftwork","Open the last saved version in the card editor at bridge-craftwork.com","Opening…",e=>h(B(e))),f(t,"Save to Bridge Classroom","Open the last saved version in Bridge Classroom, which saves it to your account","Opening…",e=>h(g.storage.local.get(p).catch(()=>({})).then(o=>k(e,o==null?void 0:o[p]))));else{const e=document.createElement("button");e.type="button",e.textContent="Print (fixed)",e.title="Print this card using the landscape fit-to-page layout",e.addEventListener("click",()=>window.print()),t.appendChild(e)}document.body.appendChild(t),new ResizeObserver(()=>{document.documentElement.style.setProperty("--better-bbo-cc-toolbar-height",`${t.offsetHeight+14}px`)}).observe(t)}function b(t,n,r,i){const e=document.createElement("button");e.type="button",e.textContent=n,e.title=r,e.addEventListener("click",async()=>{try{await C({action:i,allowPage:!0,record:l().then(({xml:o})=>w(o)),onBusy:o=>{e.disabled=o,e.textContent=o?i==="print"?"Preparing…":"Rendering…":n}})}catch(o){console.error(d,n,o),alert(`${n.replace("…","")} failed: ${o.message}`)}}),t.appendChild(e)}function f(t,n,r,i,e){const o=document.createElement("button");o.type="button",o.textContent=n,o.title=r,o.addEventListener("click",async()=>{o.disabled=!0,o.textContent=i;try{const{xml:a}=await l();await e(await w(a))}catch(a){console.error(d,n,a),alert(`${n} failed: ${a.message}`)}finally{o.disabled=!1,o.textContent=n}}),t.appendChild(o)}async function h(t){await g.runtime.sendMessage({type:"open-card-link",url:await t})}async function l(){const t=v(window.location.search),n=t.get("key")??t.get("cckey");if(!n)throw new Error("Could not find this card’s key in the URL.");return{xml:await N(L.fetch,{key:n,request_id:String(Date.now()),v3u:"BBO1"}),params:t}}async function U(t){t.disabled=!0;const n=t.textContent;t.textContent="Exporting…";try{const{xml:r,params:i}=await l(),e=S(r);e.partner=i.get("partner")??"";const o=T([e]),a=z(e.title||"card")+".json";j(o,a)}catch(r){console.error(d,"export failed",r),alert(`Export failed: ${r.message}`)}finally{t.disabled=!1,t.textContent=n}}async function N(t,n){const r=new URLSearchParams(n).toString(),i=await fetch(t,{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r});if(!i.ok)throw new Error(`POST ${t} → HTTP ${i.status}`);return i.text()}function j(t,n){const r=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),i=URL.createObjectURL(r),e=document.createElement("a");e.href=i,e.download=n,document.body.appendChild(e),e.click(),e.remove(),setTimeout(()=>URL.revokeObjectURL(i),5e3)}function z(t){return t.replace(/[^\w.-]+/g,"_").slice(0,60)||"card"}
