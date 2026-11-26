import{c as _,h as I,W as N,r as T,E as g,i as L,g as P,p as A,f as D,m as R,k as U,s as j,l as F,j as J,a as q}from"./auth-DNeVZU1L.js";function W({title:e,importedTitle:t,exportedAt:n,differences:o,bothTitle:r,fileSaved:c,bboSaved:a,newer:s}){return new Promise(h=>{const d=document.createElement("dialog");d.style.cssText="max-width:32em;font:14px sans-serif;padding:1.2em;border:1px solid #888;border-radius:6px";const l=document.createElement("h3");l.textContent=`The file holds a different copy of “${e}”`,l.style.cssText="margin:0 0 .6em;font-size:16px",d.appendChild(l);const p=new Date(n),f=c?`, saved ${c.toLocaleString()}`:Number.isNaN(p.getTime())?"":`, exported ${p.toLocaleDateString()}`,k=[`The file's copy${t&&t!==e?`, called “${t}”`:""}${f}: ${o===1?"1 setting differs":`${o} settings differ`} from the card on BBO.`,a?`The card on BBO was saved ${a.toLocaleString()}.`:"The card on BBO has no saved date.",s?`The ${s==="file"?"file's copy":"card on BBO"} is newer.`:"We can't tell which is newer: a card saved without this extension has no date."];for(const m of k){const b=document.createElement("p");b.textContent=m,b.style.margin="0 0 .6em",d.appendChild(b)}const u=document.createElement("form");u.method="dialog",u.style.cssText="display:flex;flex-direction:column;gap:.4em;margin-top:1em";const y=[["keep",`Keep the card on BBO${s==="bbo"?" (newer)":""}`],["replace",`Use the file's copy${s==="file"?", the newer one":""} (replaces “${e}”)`],["both",`Keep both (adds “${r}”)`]];for(const[m,b]of y){const $=document.createElement("button");$.value=m,$.textContent=b,$.style.cssText="padding:.4em .8em;cursor:pointer;text-align:left",u.appendChild($)}d.appendChild(u),d.addEventListener("close",()=>{const m=d.returnValue;d.remove(),h(m==="replace"||m==="both"?m:"keep")}),document.body.appendChild(d),d.showModal()})}function K({style:e,cc_key:t,partner:n,edit:o},r=window.location.href){const c=_({style:e,cc_key:t,partner:n,edit:o}),a=I(r);return a?`${c}&${a}`:c}function Y(e,t=window.location.href){const n=K(e,t);return window.open(n,"_blank","noopener")}function M(e=(t=>(t=globalThis.location)==null?void 0:t.href)()){let n="";try{n=new URL(e).searchParams.get("v3u")??""}catch{n=""}return`${N}/www_notify.php?v3u=${encodeURIComponent(n||"bbo1")}`}function z({cc_key:e,partner:t="",style:n="ACBL"},o){return new URLSearchParams({u:o.user,p:o.token,c:"wc_convcard_saved",d:`${e}|${t??""}|${n??"ACBL"}`})}function X(e,t,n=""){const o=t.filter(r=>r.cc_key===e).map(r=>r.partner??"");return[...new Set(o.length>0?o:[n??""])]}const C="[better-bbo-cc/list]",w="better-bbo-cc-list-toolbar",x="better-bbo-cc-open-btn",G="data-bbcc-card",v="better-bbo-cc-list-styles";H();function H(){V(),Z(),ee(),te(),Q(),console.log(C,"initialized")}function Q(){document.addEventListener("click",e=>{var r,c;const t=(c=(r=e.target).closest)==null?void 0:c.call(r,`.${x}`);if(!t)return;e.preventDefault(),e.stopPropagation(),e.stopImmediatePropagation();const n=t.closest("a.card-item");if(!n)return;const o=ne(n);if(!o){console.warn(C,"no cc_data yet on row",n);return}Y({style:o.type,cc_key:o.cc_key,partner:o.partner??"",edit:!1})},!0)}function V(){if(document.getElementById(v))return;const e=document.createElement("style");e.id=v,e.textContent=`
    #${w} {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #f4f4f4;
      border-bottom: 1px solid #ccc;
      font: 13px/1.4 system-ui, sans-serif;
    }
    #${w} button {
      cursor: pointer;
      padding: 4px 10px;
      border: 1px solid #888;
      background: #fff;
      border-radius: 3px;
    }
    #${w} button:disabled {
      opacity: 0.5;
      cursor: progress;
    }
    a.card-item { position: relative; }
    .${x} {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      padding: 2px 8px;
      border: 1px solid #888;
      background: #fff;
      color: #333;
      text-decoration: none;
      border-radius: 3px;
      font: 14px/1.4 system-ui, sans-serif;
      cursor: pointer;
      z-index: 2;
    }
    .${x}:hover { background: #eef; }
  `,document.head.appendChild(e)}function Z(){if(document.getElementById(w))return;const e=document.createElement("div");e.id=w;const t=document.createElement("span");t.textContent="Better BBO CC:",t.style.alignSelf="center",t.style.fontWeight="bold",e.appendChild(t);const n=document.createElement("button");n.type="button",n.textContent="Export my cards as JSON",n.title="Download your own cards and cards shared with you. Stock cards are left out: export one from its own page.",n.addEventListener("click",()=>oe(n)),e.appendChild(n);const o=document.createElement("button");o.type="button",o.textContent="Import from JSON or PDF",o.title="Add cards from a previously-exported JSON file or an ACBL card PDF. You are asked before a card of yours is replaced; a card you don't own becomes a private copy.",o.addEventListener("click",()=>re(o)),e.appendChild(o),document.body.insertBefore(e,document.body.firstChild)}function ee(){document.querySelectorAll("a.card-item").forEach(S)}function te(){new MutationObserver(t=>{var n,o;for(const r of t)for(const c of r.addedNodes)c instanceof Element&&((n=c.matches)!=null&&n.call(c,"a.card-item")&&S(c),(o=c.querySelectorAll)==null||o.call(c,"a.card-item").forEach(S))}).observe(document.body,{childList:!0,subtree:!0})}function S(e){if(e.querySelector(`.${x}`))return;const t=document.createElement("span");t.className=x,t.textContent="↗",t.title="Open this card in a new tab",t.setAttribute("role","button"),e.appendChild(t)}function ne(e){const t=e.getAttribute(G);if(!t)return null;try{return JSON.parse(t)}catch{return null}}async function oe(e){var o;const t=T();if(!t){alert("Could not read BBO auth from this page. Try reopening Account → Convention cards in the BBO lobby.");return}e.disabled=!0;const n=e.textContent;e.textContent="Exporting…";try{const r=await B(g.list,{user:t.user,password:t.token}),c=L(r),a=P(c);if(a.length===0){alert("You have no cards of your own to export. To export a stock card, open it and use Export JSON.");return}const s=[];let h=0;for(const l of a){const p=await B(g.fetch,{key:l,request_id:String(Date.now()),v3u:"BBO1"}),f=(o=c.find(i=>i.cc_key===l&&i.partner))==null?void 0:o.partner;s.push({...A(p),partner:f??""}),h+=1,e.textContent=`Exporting… (${h}/${a.length})`}const d=D(s);se(d,`bbo-cards-${t.user}-${ie()}.json`)}catch(r){console.error(C,"export failed",r),alert(`Export failed: ${r.message}`)}finally{e.disabled=!1,e.textContent=n}}async function re(e){const t=T();if(!t){alert("Could not read BBO auth from this page. Try reopening Account → Convention cards in the BBO lobby.");return}const n=await ae();if(!n)return;let o;try{o=await R(n)}catch(s){alert(`Could not read ${n.name}: ${s.message}`);return}const r=Array.isArray(o==null?void 0:o.cards)?o.cards:null;if(!r||r.length===0){alert("This file holds no cards.");return}e.disabled=!0;const c=e.textContent;e.textContent="Checking…";let a=0;try{const s=await B(g.list,{user:t.user,password:t.token}),h=async i=>A(await B(g.fetch,{key:i,request_id:String(Date.now()),v3u:"BBO1"})),d=L(s),l=await U(r,d,t.user,h,{exportedAt:o.exported_at});for(const i of l)i.action==="ask"&&(i.choice=await W({title:i.target.title,importedTitle:i.card.title,exportedAt:o.exported_at,fileSaved:j(i.card),bboSaved:i.bboSaved,newer:i.newer,differences:i.differences,bothTitle:i.bothTitle}));const p=F(l);if(p.length>0&&!window.confirm(`${[O(l,p),...o.notes].join(`

`)}

Save these to your BBO account?`))return;const f=[];for(const[i,{cmd:k,card:u}]of p.entries()){e.textContent=`Importing… (${i+1}/${p.length})`;try{const y=J(await E(g.cud,q(k,u,t).toString()));a+=1,await ce({...u,cc_key:y||u.cc_key},d,t)}catch(y){f.push(`${u.title||u.cc_key}: ${y.message}`)}}alert(`Import complete.

${O(l,p)}`+(f.length>0?`

Failed:
- ${f.join(`
- `)}`:""))}catch(s){console.error(C,"import failed",s),alert(`Import failed: ${s.message}`)}finally{e.disabled=!1,e.textContent=c}a>0&&window.location.reload()}function O(e,t){const n=a=>e.filter(s=>s.action===a).length,o=e.filter(a=>a.choice==="keep").length,r=[[t.filter(a=>a.cmd==="replace").length,"replaced with the file's copy"],[n("add")+e.filter(a=>a.choice==="both").length,"added as new cards"],[n("copy"),"added as private copies of cards you don't own"],[n("same"),"already the same on BBO"],[o,"kept as they are on BBO"]].filter(([a])=>a>0).map(([a,s])=>`${a} ${s}`),c=e.filter(a=>a.action==="skip");return c.length>0&&r.push(`${c.length} skipped: ${[...new Set(c.map(a=>a.reason))].join("; ")}`),r.join(`
`)}function ae(){return new Promise(e=>{const t=document.createElement("input");t.type="file",t.accept="application/json,.json,application/pdf,.pdf",t.addEventListener("change",()=>{var n;e(((n=t.files)==null?void 0:n[0])??null)}),t.addEventListener("cancel",()=>e(null)),t.click()})}async function ce(e,t,n){for(const o of X(e.cc_key,t,e.partner))try{await E(M(),z({...e,partner:o},n).toString())}catch(r){console.warn(C,"could not tell BBO about the save of",e.cc_key,r)}}async function B(e,t){return E(e,new URLSearchParams(t).toString())}async function E(e,t){const n=await fetch(e,{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t});if(!n.ok)throw new Error(`POST ${e} → HTTP ${n.status}`);return n.text()}function se(e,t){const n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),o=URL.createObjectURL(n),r=document.createElement("a");r.href=o,r.download=t,document.body.appendChild(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(o),5e3)}function ie(){const e=new Date,t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${t}${n}${o}`}
