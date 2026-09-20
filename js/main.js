document.addEventListener("DOMContentLoaded",()=>{
  "use strict";

  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* Mobile navigation */
  const toggle=document.querySelector(".nav-toggle");
  const links=document.querySelector(".nav-links");
  if(toggle&&links){
    toggle.addEventListener("click",()=>{
      const open=links.classList.toggle("open");
      toggle.setAttribute("aria-expanded",String(open));
    });
    links.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded","false");
    }));
  }

  /* Active page */
  const normalizePath=(value)=>{
    const path=(value||"/").split("?")[0].split("#")[0].replace(/\/+/g,"/");
    if(path.endsWith("/index.html")) return path.slice(0,-10)+"/";
    if(path.endsWith(".html")) return path.slice(0,-5);
    return path.endsWith("/")?path:path+"/";
  };
  const current=normalizePath(location.pathname);
  document.querySelectorAll(".nav-links a").forEach(a=>{
    const href=normalizePath(new URL(a.getAttribute("href")||"/",location.href).pathname);
    if(href===current){a.classList.add("active");a.setAttribute("aria-current","page")}
  });

  /* Compact announcement bar — inspired by modern announcement components. */
  const header=document.querySelector(".site-header");
  if(header&&!document.querySelector(".ccirc-announcement")){
    const resLink=document.querySelector('.nav-links a[href$="resources.html"]');
    const resHref=resLink?resLink.getAttribute("href"):(location.pathname.includes("/pages/")?"resources.html":"pages/resources.html");
    const bar=document.createElement("div");
    bar.className="ccirc-announcement";
    bar.innerHTML=`<div class="wrap ccirc-announcement-inner">
      <span class="announce-dot" aria-hidden="true"></span>
      <span>CCIRC 2026 · 歷屆教材庫持續整理中</span>
      <a href="${resHref}">前往教材庫 →</a>
    </div>`;
    header.insertAdjacentElement("afterend",bar);
  }

  /* Header state + reading progress */
  const progress=document.createElement("div");
  progress.className="scroll-progress";
  progress.setAttribute("aria-hidden","true");
  document.body.appendChild(progress);

  const syncScroll=()=>{
    const y=window.scrollY||0;
    header?.classList.toggle("is-scrolled",y>12);
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    progress.style.transform=`scaleX(${Math.min(1,Math.max(0,y/max))})`;
  };
  window.addEventListener("scroll",syncScroll,{passive:true});
  window.addEventListener("pageshow",syncScroll);
  syncScroll();

  /* Reveal-on-scroll */
  // 教材庫的講義卡片（及包住它們的區塊）不套用上移出現動畫
  const targets=[...document.querySelectorAll(
    ".section,.resource-grid,.resource-card,.timeline-item,.hero-panel,.card,.roadmap-step,.info-block,.support-equal-card"
  )].filter(el=>!el.closest(".resource-grid")&&!el.querySelector(".resource-grid"));
  if(reduce||!("IntersectionObserver" in window)){
    targets.forEach(el=>el.classList.add("is-visible"));
  }else{
    targets.forEach(el=>el.classList.add("ccirc-reveal"));
    const observer=new IntersectionObserver((entries,obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },{threshold:.06,rootMargin:"0px 0px -35px 0px"});
    targets.forEach(el=>observer.observe(el));
  }

  /* Pointer-reactive card highlight, intentionally subtle. */
  if(!reduce){
    document.querySelectorAll(".card,.info-block.panel,.roadmap-content,.support-equal-card").forEach(card=>{
      card.addEventListener("pointermove",e=>{
        const r=card.getBoundingClientRect();
        card.style.setProperty("--mx",`${e.clientX-r.left}px`);
        card.style.setProperty("--my",`${e.clientY-r.top}px`);
      });
    });
  }

  /* Back to top */
  const topButton=document.createElement("button");
  topButton.type="button";
  topButton.className="back-to-top";
  topButton.setAttribute("aria-label","回到頁面頂端");
  topButton.innerHTML="↑";
  document.body.appendChild(topButton);
  const syncTop=()=>topButton.classList.toggle("is-visible",window.scrollY>480);
  window.addEventListener("scroll",syncTop,{passive:true});
  syncTop();
  topButton.addEventListener("click",()=>window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}));
});
