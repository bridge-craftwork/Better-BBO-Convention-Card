const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/card-pdf-qESXEiFD.js","assets/browser-polyfill-DffEbQem.js","assets/_commonjsHelpers-CqkleIqs.js","assets/auth-DE45MJKV.js","assets/classroom-BFFu9rzf.js","assets/acblClassicFillPdf-CoiaoADJ.js","assets/PDFButton-CGW04nAw.js","assets/migrate-0bHlNDBH.js","assets/ntDefenses-CN4mM3GI.js","assets/checkCard-_bislIg2.js"])))=>i.map(i=>d[i]);
import{q as M,_ as Y,e as q,p as G,f as K,d as V,b as X,E as Q}from"./auth-DE45MJKV.js";import{b as E}from"./browser-polyfill-DffEbQem.js";import{P as I}from"./classroom-BFFu9rzf.js";import"./_commonjsHelpers-CqkleIqs.js";const W="better-bbo-cc-print-runtime",F="better-bbo-cc-print-static",Z=`
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
`;function tt(){et(),window.addEventListener("beforeprint",nt),window.addEventListener("afterprint",H)}function et(){if(document.getElementById(F))return;const t=document.createElement("style");t.id=F,t.textContent=Z,document.head.appendChild(t)}function nt(){H();const t=ot();if(!t)return;const{width:n,height:i}=t.getBoundingClientRect();if(!Number.isFinite(n)||n<=0)return;const o=(11-.3*2)*96,e=(8.5-.3*2)*96*.94,a=Math.min(o/n,i>0?e/i:1),d=a<1?a:1,p=`
@media print {
  #mainDiv {
    position: static !important;
    width: ${n}px !important;
    height: auto !important;
    overflow: visible !important;
    zoom: ${d.toFixed(4)};
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
`.trim(),c=document.createElement("style");c.id=W,c.textContent=p,document.head.appendChild(c)}function H(){const t=document.getElementById(W);t&&t.remove()}function ot(){return document.getElementById("entireTable")||document.querySelector("table.ccTable")||document.getElementById("ccDiv")||document.getElementById("mainDiv")}const S=[{id:"classic",name:"ACBL Classic",desc:"The familiar SS1 Rev. 4-12 card: what most clubs use."},{id:"new",name:"ACBL New",desc:"The redesigned ACBL card."}],O={id:"page",name:"This page, as BBO shows it",desc:"BBO's own layout, fitted to one landscape page."},J=[{id:"none",name:"Nothing: the card only"},{id:"notes",name:"Notes: the card's notes and supplementary pages"},{id:"acbl",name:"ACBL scoresheet"}],L={template:"classic",printTemplate:"classic",secondPage:"none"};function v(t){const n=t&&typeof t=="object"?t:{},i=o=>S.some(e=>e.id===o);return{template:i(n.template)?n.template:L.template,printTemplate:i(n.printTemplate)||n.printTemplate===O.id?n.printTemplate:L.printTemplate,secondPage:J.some(o=>o.id===n.secondPage)?n.secondPage:L.secondPage,green:n.green!==!1,fillable:n.fillable===!0}}function at(t,n,{template:i,secondPage:o,green:e,fillable:a}){const d={...v(t),secondPage:o,green:e};return n==="print"?d.printTemplate=i:Object.assign(d,{template:i,fillable:a}),v(d)}const _="pdfOptions";async function it(){try{const t=await E.storage.local.get(_);return v(t==null?void 0:t[_])}catch{return v(null)}}async function rt(t){try{await E.storage.local.set({[_]:t})}catch{}}const B={print:{title:"Print",go:"Print"},export:{title:"Export PDF",go:"Download"}},st=`
  dialog { border: none; border-radius: 12px; padding: 20px 22px; width: min(500px, calc(100vw - 40px));
    box-sizing: border-box; box-shadow: 0 12px 40px rgba(0,0,0,.2); color: #1a1a1a;
    font: 14px/1.4 system-ui, -apple-system, sans-serif; }
  dialog::backdrop { background: rgba(17,24,39,.35); }
  .title { font-weight: 600; font-size: 16px; margin: 0 0 14px; }
  fieldset { border: none; margin: 0 0 14px; padding: 0; }
  legend, .legend { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; padding: 0; }
  .hint { font-weight: 400; color: #6b7280; }
  .template { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 1px solid #e0ddd7;
    border-radius: 8px; margin-bottom: 6px; cursor: pointer; }
  .template.chosen { border-color: #40916c; background: #f6faf7; }
  .template input, .check input { margin: 3px 0 0; }
  .name { display: block; font-weight: 600; }
  .desc { display: block; font-size: 12px; color: #6b7280; margin-top: 2px; }
  .second { display: block; margin: 0 0 14px; }
  select { font: inherit; font-size: 13px; padding: 5px 8px; width: 100%; box-sizing: border-box; }
  .notes { display: block; font-size: 12px; color: #6b7280; margin-top: 4px; }
  .notes.some { color: #2d6a4f; }
  .check { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; margin: 0 0 14px; }
  .off { opacity: .45; pointer-events: none; }
  .buttons { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  button { font: inherit; font-size: 14px; padding: 8px 14px; border-radius: 6px; border: 1px solid #d1d5db;
    background: #fff; color: #1a1a1a; cursor: pointer; }
  button.go { background: #2d6a4f; border-color: #2d6a4f; color: #fff; font-weight: 600; }
`;function r(t,n={},...i){const o=document.createElement(t);for(const[e,a]of Object.entries(n))e==="class"?o.className=a:o[e]=a;return o.append(...i),o}async function ct({action:t="export",cardName:n="",hasNotes:i=null}={}){const o=await it(),e=t==="print"?[...S,O]:S,a=t==="print"?o.printTemplate:o.template,d=r("div"),p=d.attachShadow({mode:"open"}),c=r("dialog");p.append(r("style",{textContent:st}),c);const x=r("p",{class:"title",textContent:B[t].title});c.append(x),Promise.resolve(n).then(s=>{s&&(x.textContent=`${B[t].title}: ${s}`)}).catch(()=>{});const w=r("fieldset",{},r("legend",{textContent:"Card"})),f=e.map(s=>{const m=r("input",{type:"radio",name:"template",value:s.id,checked:s.id===a}),u=r("label",{class:"template"},m,r("span",{},r("span",{class:"name",textContent:s.name}),r("span",{class:"desc",textContent:s.desc})));return w.append(u),{input:m,label:u}});c.append(w);const l=r("select");for(const s of J)l.append(r("option",{value:s.id,textContent:s.name,selected:s.id===o.secondPage}));const b=r("span",{class:"notes"}),y=r("label",{class:"second"},r("span",{class:"legend"},"Second page ",r("span",{class:"hint",textContent:"(for printing on both sides)"})),l,b);c.append(y),Promise.resolve(i).then(s=>{s!=null&&(b.textContent=s?"This card has notes for a notes page.":"This card has no notes yet: a notes page would be empty.",b.classList.toggle("some",s))}).catch(()=>{});const h=r("input",{type:"checkbox",checked:o.green}),C=r("label",{class:"check"},h,r("span",{},"What the card says in green",r("span",{class:"desc",textContent:"As BBO's card shows it: your entries stand out from the printed form. Untick for black."})));c.append(C);const A=r("input",{type:"checkbox",checked:o.fillable});t==="export"&&c.append(r("label",{class:"check"},A,r("span",{},"Fillable, to edit in a PDF app",r("span",{class:"desc",textContent:"Edit it in Acrobat or Chrome. On a Mac, Preview and Safari show its boxes in a plain font, and shrink long entries."}))));const R=r("button",{type:"button",textContent:"Cancel"}),P=r("button",{type:"button",class:"go",textContent:B[t].go});c.append(r("div",{class:"buttons"},R,P));const $=()=>{var m;for(const{input:u,label:T}of f)T.classList.toggle("chosen",u.checked);const s=((m=f.find(u=>u.input.checked))==null?void 0:m.input.value)===O.id;y.classList.toggle("off",s),C.classList.toggle("off",s)};for(const{input:s}of f)s.addEventListener("change",$);return $(),document.body.append(d),c.showModal(),P.focus(),new Promise(s=>{let m=null;R.addEventListener("click",()=>c.close()),P.addEventListener("click",()=>{var u;m={template:((u=f.find(T=>T.input.checked))==null?void 0:u.input.value)??a,secondPage:l.value,green:h.checked,fillable:t==="export"&&A.checked},s(m),c.close(),rt(at(o,t,m))}),c.addEventListener("close",()=>{d.remove(),m||s(null)})})}function dt(){const t=navigator.userAgent;return!/^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(t)}function lt(){if(dt())return null;const t=window.open("","_blank");return t&&(t.document.body.textContent="Making the PDF…"),t}function pt(t,n=null,i=""){const o=URL.createObjectURL(new Blob([t],{type:"application/pdf"}));if(setTimeout(()=>URL.revokeObjectURL(o),10*6e4),n){const a=i.replace(/[^\w\s.-]+/g,"").trim().replace(/\s+/g,"-");n.location.href=a?`${o}#${a}`:o;return}const e=document.createElement("iframe");e.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden",e.src=o,e.onload=()=>{try{e.contentWindow.focus(),e.contentWindow.print()}catch{window.open(o,"_blank")}},document.body.appendChild(e),setTimeout(()=>e.remove(),10*6e4)}const k="[better-bbo-cc/editor]",g="better-bbo-cc-editor-toolbar",N="better-bbo-cc-editor-styles";mt();function mt(){tt(),ut(),ft(),console.log(k,"initialized")}function ut(){if(document.getElementById(N))return;const t=document.createElement("style");t.id=N,t.textContent=`
    #${g} {
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
    #${g} button {
      cursor: pointer;
      padding: 3px 8px;
      border: 1px solid #888;
      background: #fff;
      border-radius: 3px;
      font: inherit;
    }
    #${g} button:hover { background: #eef; }
    #${g} button:disabled { opacity: 0.5; cursor: progress; }
    @media screen {
      body { padding-top: var(--better-bbo-cc-toolbar-height, 0); }
    }
    @media print {
      #${g} { display: none !important; }
    }
  `,document.head.appendChild(t)}function ft(){if(document.getElementById(g))return;const t=document.createElement("div");t.id=g;const n=document.createElement("span");if(n.textContent="Better CC:",n.style.alignSelf="center",n.style.fontWeight="bold",t.appendChild(n),window.top!==window.self){const e=document.createElement("button");e.type="button",e.textContent="↗ Open in tab",e.title="Open this card in a new full-size browser tab",e.addEventListener("click",()=>{window.open(window.location.href,"_blank","noopener")}),t.appendChild(e)}const i=/\/acblcc\.html$/i.test(window.location.pathname),o=document.createElement("button");if(o.type="button",o.textContent="Export JSON",o.title="Download this card as portable JSON",o.addEventListener("click",()=>bt(o)),i&&t.appendChild(o),i)z(t,"Print…","Print the card: an ACBL card, or this page as BBO shows it","print"),z(t,"Export PDF…","Download the last saved version as an ACBL card","export"),U(t,"Edit on Bridge Craftwork","Open the last saved version in the card editor at bridge-craftwork.com","Opening…",e=>j(V(e))),U(t,"Save to Bridge Classroom","Open the last saved version in Bridge Classroom, which saves it to your account","Opening…",e=>j(E.storage.local.get(I).catch(()=>({})).then(a=>X(e,a==null?void 0:a[I]))));else{const e=document.createElement("button");e.type="button",e.textContent="Print (fixed)",e.title="Print this card using the landscape fit-to-page layout",e.addEventListener("click",()=>window.print()),t.appendChild(e)}document.body.appendChild(t),new ResizeObserver(()=>{document.documentElement.style.setProperty("--better-bbo-cc-toolbar-height",`${t.offsetHeight+14}px`)}).observe(t)}function z(t,n,i,o){const e=document.createElement("button");e.type="button",e.textContent=n,e.title=i,e.addEventListener("click",async()=>{var x,w,f;const a=D().then(({xml:l})=>M(l));a.catch(()=>{});const d=Y(()=>import("./card-pdf-qESXEiFD.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9])),p=await ct({action:o,cardName:a.then(l=>l.name),hasNotes:Promise.all([d,a]).then(([l,b])=>l.cardHasNotes(b))});if(!p)return;if(p.template==="page"){window.print();return}const c=o==="print"?lt():null;e.disabled=!0,e.textContent=o==="print"?"Preparing…":"Rendering…";try{const{downloadAcblPdf:l,renderAcblPdfBytes:b}=await d,y={secondPage:p.secondPage,ink:p.green?"green":"black",flatten:!p.fillable};if(o==="print"){const h=await a,C=`${((f=(w=(x=h.card_data)==null?void 0:x.metadata)==null?void 0:w.partner_names)==null?void 0:f.trim())||h.name||"Convention card"} ${p.template==="new"?"ACBL New":"ACBL Classic"}`;pt(await b(h,p.template,y),c,C)}else await l(await a,p.template,y)}catch(l){c==null||c.close(),console.error(k,n,l),alert(`${n.replace("…","")} failed: ${l.message}`)}finally{e.disabled=!1,e.textContent=n}}),t.appendChild(e)}function U(t,n,i,o,e){const a=document.createElement("button");a.type="button",a.textContent=n,a.title=i,a.addEventListener("click",async()=>{a.disabled=!0,a.textContent=o;try{const{xml:d}=await D();await e(await M(d))}catch(d){console.error(k,n,d),alert(`${n} failed: ${d.message}`)}finally{a.disabled=!1,a.textContent=n}}),t.appendChild(a)}async function j(t){await E.runtime.sendMessage({type:"open-card-link",url:await t})}async function D(){const t=q(window.location.search),n=t.get("key")??t.get("cckey");if(!n)throw new Error("Could not find this card’s key in the URL.");return{xml:await gt(Q.fetch,{key:n,request_id:String(Date.now()),v3u:"BBO1"}),params:t}}async function bt(t){t.disabled=!0;const n=t.textContent;t.textContent="Exporting…";try{const{xml:i,params:o}=await D(),e=G(i);e.partner=o.get("partner")??"";const a=K([e]),d=xt(e.title||"card")+".json";ht(a,d)}catch(i){console.error(k,"export failed",i),alert(`Export failed: ${i.message}`)}finally{t.disabled=!1,t.textContent=n}}async function gt(t,n){const i=new URLSearchParams(n).toString(),o=await fetch(t,{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:i});if(!o.ok)throw new Error(`POST ${t} → HTTP ${o.status}`);return o.text()}function ht(t,n){const i=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),o=URL.createObjectURL(i),e=document.createElement("a");e.href=o,e.download=n,document.body.appendChild(e),e.click(),e.remove(),setTimeout(()=>URL.revokeObjectURL(o),5e3)}function xt(t){return t.replace(/[^\w.-]+/g,"_").slice(0,60)||"card"}
