const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/card-pdf-Cj71s0jm.js","assets/browser-polyfill-DffEbQem.js","assets/_commonjsHelpers-CqkleIqs.js","assets/acblClassicFillPdf-BAvCT5sV.js","assets/PDFButton-jJkX7uAS.js","assets/migrate-ChgRBFc9.js","assets/ntDefenses-DbzLMdjK.js","assets/checkCard-CactabMx.js"])))=>i.map(i=>d[i]);
import{T as w,n as y,e as x,p as E,f as v,_ as C,d as T,b as S,E as k}from"./auth-DNeVZU1L.js";import{b as B}from"./browser-polyfill-DffEbQem.js";import"./_commonjsHelpers-CqkleIqs.js";const u="better-bbo-cc-print-runtime",l="better-bbo-cc-print-static",L=`
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
`;function O(){P(),window.addEventListener("beforeprint",_),window.addEventListener("afterprint",b)}function P(){if(document.getElementById(l))return;const t=document.createElement("style");t.id=l,t.textContent=L,document.head.appendChild(t)}function _(){b();const t=I();if(!t)return;const n=t.getBoundingClientRect().width;if(!Number.isFinite(n)||n<=0)return;const i=(11-.3*2)*96/n,e=i<1?i:1,r=`
@media print {
  #mainDiv {
    position: static !important;
    width: ${n}px !important;
    height: auto !important;
    overflow: visible !important;
    transform: scale(${e.toFixed(4)});
    transform-origin: top left;
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
`.trim(),a=document.createElement("style");a.id=u,a.textContent=r,document.head.appendChild(a)}function b(){const t=document.getElementById(u);t&&t.remove()}function I(){return document.getElementById("entireTable")||document.querySelector("table.ccTable")||document.getElementById("ccDiv")||document.getElementById("mainDiv")}const s="[better-bbo-cc/editor]",c="better-bbo-cc-editor-toolbar",p="better-bbo-cc-editor-styles";$();function $(){O(),D(),R(),console.log(s,"initialized")}function D(){if(document.getElementById(p))return;const t=document.createElement("style");t.id=p,t.textContent=`
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
  `,document.head.appendChild(t)}function R(){if(document.getElementById(c))return;const t=document.createElement("div");t.id=c;const n=document.createElement("span");if(n.textContent="Better CC:",n.style.alignSelf="center",n.style.fontWeight="bold",t.appendChild(n),window.top!==window.self){const e=document.createElement("button");e.type="button",e.textContent="↗ Open in tab",e.title="Open this card in a new full-size browser tab",e.addEventListener("click",()=>{window.open(window.location.href,"_blank","noopener")}),t.appendChild(e)}const o=document.createElement("button");o.type="button",o.textContent="Export JSON",o.title="Download this card as portable JSON",o.addEventListener("click",()=>F(o)),t.appendChild(o);const i=document.createElement("button");i.type="button",i.textContent="Print (fixed)",i.title="Print this card using the landscape fit-to-page layout",i.addEventListener("click",()=>window.print()),t.appendChild(i);for(const[e,r]of Object.entries(w))d(t,`PDF: ${r}`,`Download the last saved version as the ACBL ${r} card`,"Rendering…",async a=>{const{downloadAcblPdf:h}=await C(async()=>{const{downloadAcblPdf:g}=await import("./card-pdf-Cj71s0jm.js");return{downloadAcblPdf:g}},__vite__mapDeps([0,1,2,3,4,5,6,7]));await h(a,e)});d(t,"Edit on Bridge Craftwork","Open the last saved version in the card editor at bridge-craftwork.com","Opening…",e=>m(T(e))),d(t,"Save to Bridge Classroom","Open the last saved version in Bridge Classroom, which saves it to your account","Opening…",e=>m(S(e))),document.body.appendChild(t),new ResizeObserver(()=>{document.documentElement.style.setProperty("--better-bbo-cc-toolbar-height",`${t.offsetHeight+14}px`)}).observe(t)}function d(t,n,o,i,e){const r=document.createElement("button");r.type="button",r.textContent=n,r.title=o,r.addEventListener("click",async()=>{r.disabled=!0,r.textContent=i;try{const{xml:a}=await f();await e(await y(a))}catch(a){console.error(s,n,a),alert(`${n} failed: ${a.message}`)}finally{r.disabled=!1,r.textContent=n}}),t.appendChild(r)}async function m(t){await B.runtime.sendMessage({type:"open-card-link",url:await t})}async function f(){const t=x(window.location.search),n=t.get("key")??t.get("cckey");if(!n)throw new Error("Could not find this card’s key in the URL.");return{xml:await U(k.fetch,{key:n,request_id:String(Date.now()),v3u:"BBO1"}),params:t}}async function F(t){t.disabled=!0;const n=t.textContent;t.textContent="Exporting…";try{const{xml:o,params:i}=await f(),e=E(o);e.partner=i.get("partner")??"";const r=v([e]),a=j(e.title||"card")+".json";A(r,a)}catch(o){console.error(s,"export failed",o),alert(`Export failed: ${o.message}`)}finally{t.disabled=!1,t.textContent=n}}async function U(t,n){const o=new URLSearchParams(n).toString(),i=await fetch(t,{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:o});if(!i.ok)throw new Error(`POST ${t} → HTTP ${i.status}`);return i.text()}function A(t,n){const o=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),i=URL.createObjectURL(o),e=document.createElement("a");e.href=i,e.download=n,document.body.appendChild(e),e.click(),e.remove(),setTimeout(()=>URL.revokeObjectURL(i),5e3)}function j(t){return t.replace(/[^\w.-]+/g,"_").slice(0,60)||"card"}
