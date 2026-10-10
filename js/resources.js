document.addEventListener("DOMContentLoaded",()=>{
  "use strict";

  const grid=document.querySelector("#resource-grid");
  if(!grid)return;

  const search=document.querySelector("#resource-search");
  const category=document.querySelector("#resource-category");
  const chips=[...document.querySelectorAll(".filter-chip")];
  const empty=document.querySelector("#resource-empty");
  const emptyCohort=document.querySelector("#resource-empty-cohort");
  const status=document.querySelector("#resource-search-status");

  const modal=document.querySelector("#preview-modal");
  const frame=document.querySelector("#preview-frame");
  const title=document.querySelector("#preview-title");
  const open=document.querySelector("#preview-open");
  const close=document.querySelector("#preview-close");

  const resources=Array.isArray(window.CCIRC_RESOURCES)?window.CCIRC_RESOURCES:[];
  const index=Array.isArray(window.CCIRC_RESOURCE_SEARCH_INDEX)
    ? window.CCIRC_RESOURCE_SEARCH_INDEX
    : [];

  let currentCohort="all";
  let timer=null;
  let lastFocused=null;
  let savedScrollY=0;

  const labels={"1st":"第一屆","2nd":"第二屆","3rd":"第三屆"};

  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  const normalize=s=>String(s??"")
    .normalize("NFKC")
    .replace(/\s+/g," ")
    .trim()
    .toLocaleLowerCase();

  const previewUrl=url=>{
    try{
      const u=new URL(url);
      u.searchParams.set("type","view");
      return u.toString();
    }catch{return url}
  };

  // Build a lookup once so the generated index can contain only searchable
  // fields while the UI still uses the authoritative resources-data.js.
  const searchable=new Map();
  index.forEach((item)=>{
    if(item && Number.isInteger(item.resourceIndex)){
      searchable.set(item.resourceIndex,item);
    }
  });

  function getSearchItem(resourceIndex){
    const item=searchable.get(resourceIndex);
    const resource=resources[resourceIndex]||{};
    return item||{
      resourceIndex,
      title:resource.title||"",
      category:resource.category||"",
      desc:resource.desc||"",
      content:"",
      headings:[]
    };
  }

  function makeTokens(q){
    return normalize(q)
      .split(/[\s,，、。；;：:!?！？()[\]{}"'`]+/)
      .map(x=>x.trim())
      .filter(x=>x.length>0);
  }

  function scoreItem(item,q){
    if(!q)return 0;

    const query=normalize(q);
    const title=normalize(item.title);
    const category=normalize(item.category);
    const desc=normalize(item.desc);
    const headings=normalize((item.headings||[]).join(" "));
    const content=normalize(item.content);

    let score=0;
    if(title===query)score+=1000;
    if(title.includes(query))score+=500;
    if(headings.includes(query))score+=300;
    if(desc.includes(query))score+=180;
    if(category.includes(query))score+=120;
    if(content.includes(query))score+=80;

    // Multi-word queries: reward entries containing every meaningful token.
    const tokens=makeTokens(q);
    if(tokens.length>1){
      const fields=[title,headings,desc,content];
      const hits=tokens.filter(token=>fields.some(field=>field.includes(token)));
      score+=hits.length*35;
      if(hits.length===tokens.length)score+=120;
    }

    return score;
  }

  function findSnippet(item,q){
    const content=String(item.content||"").replace(/\r/g,"").replace(/\n+/g," ");
    if(!content)return "";

    const query=String(q||"").trim();
    const normalizedContent=normalize(content);
    const normalizedQuery=normalize(query);

    let pos=normalizedContent.indexOf(normalizedQuery);

    // For multi-word queries where the exact phrase isn't present, use the
    // first token that occurs in the note.
    if(pos<0){
      for(const token of makeTokens(query)){
        const p=normalizedContent.indexOf(token);
        if(p>=0){pos=p;break}
      }
    }

    if(pos<0)return "";

    // normalizedContent is whitespace-collapsed, so using the normalized
    // position is safe for a display-oriented snippet.
    const radius=110;
    let start=Math.max(0,pos-radius);
    let end=Math.min(content.length,pos+Math.max(query.length,20)+radius);

    if(start>0){
      const boundary=content.indexOf(" ",start);
      if(boundary>=0 && boundary<start+25)start=boundary+1;
    }
    if(end<content.length){
      const boundary=content.lastIndexOf(" ",end);
      if(boundary>Math.max(start,end-25))end=boundary;
    }

    let snippet=content.slice(start,end).trim();
    if(start>0)snippet="… "+snippet;
    if(end<content.length)snippet+=" …";
    return highlight(snippet,query);
  }

  function escapeRegExp(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  function highlight(text,q){
    const safe=esc(text);
    const tokens=[String(q||"").trim(),...makeTokens(q)]
      .filter(Boolean)
      .sort((a,b)=>b.length-a.length);

    if(!tokens.length)return safe;

    // Highlight the phrase first, then individual tokens that remain.
    let html=safe;
    for(const token of tokens){
      const re=new RegExp(`(${escapeRegExp(esc(token))})`,"giu");
      html=html.replace(re,"<mark>$1</mark>");
    }
    return html;
  }

  function render(){
    const rawQuery=(search?.value||"").trim();
    const q=normalize(rawQuery);

    const candidates=resources
      .map((resource,resourceIndex)=>({resource,resourceIndex,item:getSearchItem(resourceIndex)}))
      .filter(({resource})=>
        (currentCohort==="all"||resource.cohort===currentCohort) &&
        (!category||category.value==="all"||resource.category===category.value)
      );

    const results=candidates
      .map(entry=>({...entry,score:scoreItem(entry.item,rawQuery)}))
      .filter(entry=>!q||entry.score>0)
      .sort((a,b)=>{
        if(q && b.score!==a.score)return b.score-a.score;
        return a.resourceIndex-b.resourceIndex;
      });

    grid.innerHTML=results.map(({resource,resourceIndex,item})=>{
      const snippet=findSnippet(item,rawQuery);
      const hasContent=Boolean(item.content);
      const description=snippet||esc(resource.desc||"");
      const searchBadge=q && item.content
        ? '<span class="search-match-badge">內容命中</span>'
        : "";

      return `<article class="card resource-card">
        <div class="tags">
          <span class="tag">${labels[resource.cohort]||esc(resource.cohort)||"未分類"}</span>
          <span class="tag">${esc(resource.category||"教材")}</span>
          ${searchBadge}
        </div>
        <h3>${esc(resource.title||"未命名筆記")}</h3>
        <p class="${snippet?'resource-snippet':''}">${description}</p>
        <div class="actions">
          <button class="small-btn primary preview-btn" type="button" data-index="${resourceIndex}">預覽筆記</button>
          <a class="small-btn" href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">開啟 HackMD <i class="ext-icon" aria-hidden="true"></i></a>
        </div>
      </article>`;
    }).join("");

    const cohortIsEmptyByData=currentCohort!=="all"&&!resources.some(x=>x.cohort===currentCohort);

    if(empty)empty.hidden=!(results.length===0&&!cohortIsEmptyByData);
    if(emptyCohort)emptyCohort.hidden=!cohortIsEmptyByData;

    if(status){
      if(!q){
        status.textContent=index.length
          ? `全文搜尋已啟用 · 共 ${resources.length} 份教材`
          : "全文索引尚未建立，目前先搜尋教材基本資料";
      }else{
        status.textContent=`找到 ${results.length} 筆相關教材`;
      }
    }

    grid.querySelectorAll(".preview-btn").forEach(btn=>{
      btn.addEventListener("click",()=>openPreview(resources[Number(btn.dataset.index)]));
    });
  }

  function openPreview(item){
    if(!item||!modal||!frame)return;

    lastFocused=document.activeElement;
    savedScrollY=window.scrollY;
    title.textContent=item.title||"HackMD 筆記預覽";
    open.href=item.url||"#";
    frame.title=`HackMD 筆記預覽：${item.title||""}`;
    delete frame.dataset.loaded;
    clearFallback();

    if(timer)clearTimeout(timer);

    document.body.classList.add("modal-is-open");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    frame.src="about:blank";

    requestAnimationFrame(()=>{frame.src=previewUrl(item.url)});

    timer=setTimeout(()=>{
      if(modal.classList.contains("open")&&!frame.dataset.loaded)showFallback();
    },12000);

    window.requestAnimationFrame(()=>close?.focus({preventScroll:true}));
  }

  function clearFallback(){
    modal?.querySelector(".preview-fallback")?.remove();
  }

  function showFallback(){
    if(!modal||modal.querySelector(".preview-fallback"))return;

    const fallback=document.createElement("div");
    fallback.className="preview-fallback";
    fallback.innerHTML="<strong>筆記預覽載入較慢</strong><span>如果 HackMD 尚未完成載入，可以直接開啟完整筆記閱讀。</span>";
    modal.querySelector(".modal-box")?.insertBefore(
      fallback,
      modal.querySelector(".modal-foot")
    );
  }

  function closePreview(){
    if(!modal)return;

    if(timer)clearTimeout(timer);
    clearFallback();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-is-open");
    frame.src="about:blank";

    if(Math.abs(window.scrollY-savedScrollY)>1){
      window.scrollTo(0,savedScrollY);
    }

    if(lastFocused&&typeof lastFocused.focus==="function"){
      lastFocused.focus({preventScroll:true});
    }
    lastFocused=null;
  }

  frame?.addEventListener("load",()=>{
    frame.dataset.loaded="true";
    if(timer)clearTimeout(timer);
    clearFallback();
  });

  [search,category].filter(Boolean).forEach(el=>{
    el.addEventListener(el.tagName==="INPUT"?"input":"change",render);
  });

  const clearBtn=document.querySelector("#resource-search-clear");
  function syncClear(){ if(clearBtn&&search)clearBtn.hidden=!search.value; }
  search?.addEventListener("input",syncClear);
  clearBtn?.addEventListener("click",()=>{
    search.value="";
    syncClear();
    search.dispatchEvent(new Event("input",{bubbles:true}));
    search.focus();
  });
  syncClear();

  chips.forEach(chip=>chip.addEventListener("click",()=>{
    chips.forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    currentCohort=chip.dataset.cohort||"all";
    render();
  }));

  close?.addEventListener("click",closePreview);
  modal?.addEventListener("click",e=>{
    if(e.target===modal)closePreview();
  });
  modal?.addEventListener("wheel",e=>{
    if(e.target===modal)e.preventDefault();
  },{passive:false});

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&modal?.classList.contains("open")){
      e.preventDefault();
      closePreview();
    }
  });

  render();
});
