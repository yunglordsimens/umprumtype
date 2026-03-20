/* ═══════════════════════════════════════════════════════
   UMPRUM TYPE — Main Application
═══════════════════════════════════════════════════════ */

const fallbackFamilies={
  'Ananas':"'DM Serif Display',serif",'Chlebiczech':"'Newsreader',serif",
  'Korchma':"'DM Serif Display',serif",'März Grotesk':"'Space Mono',monospace",
  'Walbert':"'Newsreader',serif",'Basteleur':"'Instrument Serif',serif",
  'Garamond UMPRUM':"'Instrument Serif',serif"
};
const fallbackStyles={
  'Chlebiczech':'font-weight:600','Korchma':'font-style:italic',
  'März Grotesk':'font-weight:700','Walbert':'font-weight:300',
  'Garamond UMPRUM':'font-style:italic'
};
function getFam(name){return fallbackFamilies[name]||"'DM Serif Display',serif"}
function getSty(name){return fallbackStyles[name]||''}

let DATA={typefaces:[],posts:[]};

/* ═══ LOAD DATA — fetches generated index.json ═══ */
async function loadData(){
  try{
    const [tfs,ps]=await Promise.all([
      fetch('/content/typefaces/index.json').then(r=>{if(!r.ok)throw 0;return r.json()}),
      fetch('/content/posts/index.json').then(r=>{if(!r.ok)throw 0;return r.json()})
    ]);
    DATA.typefaces=tfs.sort((a,b)=>(a.order||0)-(b.order||0));
    DATA.posts=ps.sort((a,b)=>new Date(b.date)-new Date(a.date));
  }catch(e){
    console.warn('Fetch failed, using inline fallback');
    loadFallback();
  }
  renderAll();
}

function loadFallback(){
  DATA.typefaces=[
    {order:1,name:'Ananas',author:'Květoň',year:'2025',type:'Display Serif',script:'Latin Extended',styles:['Regular','Italic','Bold'],sampleText:'Imituje žhavý pohled, vítězně se usmívá a nechává za sebou stopu hořkosladké nostalgie.',bigLetter:'Aa',charset:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z Á Č Ď É Ě Í Ň Ó Ř Š Ť Ú Ů Ý Ž 0 1 2 3 4 5 6 7 8 9',description:'Display serif for editorial headlines.',otFeatures:['liga','kern'],hasWeight:false,weightMin:400,weightMax:400,available:true},
    {order:2,name:'Chlebiczech',author:'Kosová',year:'2025',type:'Text Serif',script:'Latin + Cyrillic',styles:['Regular','Italic','Bold','Bold Italic','Black','Black Italic'],sampleText:'Jeho jméno jsem zapomněl, prý provádí nárazové obchody s exotickým kořením.',bigLetter:'Cc',charset:'A B C D E F G H I J K L M А Б В Г Д Е Ж З И К Л М Н О П Р С Т У',description:'Text face for Latin and Cyrillic.',otFeatures:['liga','kern','onum','smcp'],hasWeight:true,weightMin:100,weightMax:900,available:true},
    {order:3,name:'Korchma',author:'Sherlupenkova',year:'2025',type:'Display Serif',script:'Cyrillic',styles:['Regular','Italic'],sampleText:'Вона імітує запальний погляд, тріумфально оживаючи у темряві ночі.',bigLetter:'Кк',charset:'А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я',description:'Cyrillic serif rooted in Ukrainian traditions.',otFeatures:['liga','kern'],hasWeight:false,weightMin:400,weightMax:400,available:false},
    {order:4,name:'März Grotesk',author:'Vlasák',year:'2025',type:'Display Grotesk',script:'Latin',styles:['Bold','Heavy'],sampleText:"DURING THE THIRTY YEARS' WAR, THE SWEDES WANTED TO USE IT AS A WEAPON OF MASS TYPOGRAPHY.",bigLetter:'Mm',charset:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 0 1 2 3 4 5 6 7 8 9',description:'Display grotesk inspired by Märzdorf cemetery.',otFeatures:['kern'],hasWeight:true,weightMin:700,weightMax:900,available:true},
    {order:5,name:'Walbert',author:'Nečásková',year:'2026',type:'Text',script:'Latin',styles:['Regular'],sampleText:'The quick brown fox jumps over the lazy dog, exploring typographic frontiers.',bigLetter:'Ww',charset:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9',description:'Text face for long reading.',otFeatures:['liga','kern'],hasWeight:false,weightMin:300,weightMax:300,available:false},
    {order:6,name:'Basteleur',author:'Studio',year:'2024',type:'Studio Collaborative',script:'Latin',styles:['Regular','Bold'],sampleText:'Typography is the craft of endowing human language with a durable visual form.',bigLetter:'Bb',charset:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z',description:'Studio collaborative typeface.',otFeatures:['liga','kern','ss01'],hasWeight:false,weightMin:400,weightMax:700,available:true},
    {order:7,name:'Garamond UMPRUM',author:'Studio',year:'2023',type:'Historical Revival',script:'Latin',styles:['Regular','Italic'],sampleText:'Classic elegance meets contemporary Czech design philosophy.',bigLetter:'Gg',charset:'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z',description:'Historical revival of 16th-century Garamond.',otFeatures:['liga','kern','onum'],hasWeight:false,weightMin:400,weightMax:400,available:false}
  ];
  DATA.posts=[
    {_slug:'czech-lettering-heritage',title:'Czech Lettering Heritage',date:'2025-03-10',tag:'blog',cover:'https://images.unsplash.com/photo-1600172454132-057053e18a99?q=80&w=800',available:false,body:'Czech lettering traditions run deep — from hand-painted shop signs in Vinohrady to Vojtěch Preissig.'},
    {_slug:'anatomy-of-ananas',title:'Anatomy of Ananas',date:'2025-02-15',tag:'project',cover:'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800',available:true,body:'Documenting the two-year process of designing Ananas — a display serif that started as a grotesque experiment.'},
    {_slug:'marz-display-study',title:'März Grotesk — Display Study',date:'2025-01-20',tag:'project',cover:'https://images.unsplash.com/photo-1520616110034-73891461f008?q=80&w=800',available:true,body:'A display grotesk inspired by cemetery lettering in Märzdorf.'},
    {_slug:'cyrillic-design',title:'Cyrillic Design Challenges',date:'2024-11-20',tag:'blog',cover:'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800',available:false,body:'Extending a Latin typeface to Cyrillic is not translation — it is redesign.'},
    {_slug:'basteleur-process',title:'Basteleur — Studio Process',date:'2024-06-01',tag:'project',cover:'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=800',available:true,body:'Basteleur was designed collectively by the entire studio over one semester.'},
    {_slug:'garamond-revival',title:'Garamond Revival — Process',date:'2023-12-15',tag:'project',cover:'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800',available:false,body:"The studio's first project: a careful revival of Claude Garamond's types."}
  ];
}

/* ═══ RENDER ALL ═══ */
function renderAll(){
  renderHome();renderTf();renderTfFilters();renderWork();renderWkFilters();renderTryFonts();renderTryControls();
  document.getElementById('tfCount').textContent=String(DATA.typefaces.length).padStart(2,'0');
  setupMobileScroll();
}

/* ═══ HOME ═══ */
function renderHome(){
  const tf=DATA.typefaces,ps=DATA.posts;
  let cells=[];let fi=0,pi=0;
  while(fi<tf.length||pi<ps.length){
    if(fi<tf.length){cells.push({type:'font',data:tf[fi],idx:fi});fi++}
    if(fi<tf.length){cells.push({type:'font',data:tf[fi],idx:fi});fi++}
    if(pi<ps.length){cells.push({type:'post',data:ps[pi]});pi++}
  }
  let rows=[];for(let i=0;i<cells.length;i+=3)rows.push(cells.slice(i,i+3));
  document.getElementById('homeGrid').innerHTML=rows.map(row=>`<div class="home-row">${row.map(c=>{
    if(c.type==='font'){
      const f=c.data;
      return `<div class="home-cell" onclick="goPage('typefaces');setTimeout(()=>openTf(${c.idx}),100)"><div class="cell-name" style="font-family:${getFam(f.name)};${getSty(f.name)}">${f.name.toUpperCase()}</div><div class="cell-under"><div class="cu-top"><span>${String(f.order).padStart(2,'0')} · TYPEFACE</span><span>${f.author} · ${f.year}</span></div><div class="cu-bot"><div>${f.type.toUpperCase()}</div><span class="bbtn">VIEW →</span></div></div></div>`;
    }else{
      const p=c.data,img=p.cover||'',slug=p._slug||'';
      return `<div class="home-cell post-cell" onclick="openPost('${slug}')">${img?`<img src="${img}" class="img-c img-l"><img src="${img}" class="img-c img-r">`:''}<div class="cell-name">${p.title.toUpperCase()}</div><div class="cell-under"><div class="cu-top"><span>${p.tag.toUpperCase()}</span><span>${p.date.slice(0,4)}</span></div><div class="cu-bot"><div>${p.available?'AVAILABLE':'ARCHIVE'}</div><span class="bbtn">READ →</span></div></div></div>`;
    }
  }).join('')}</div>`).join('');
}

/* ═══ TYPEFACES ═══ */
function renderTf(){
  document.getElementById('tfList').innerHTML=DATA.typefaces.map((f,i)=>{
    const fam=getFam(f.name),sty=getSty(f.name);
    return `<div class="tf-row" data-y="${f.year}" data-a="${f.author}" onclick="toggleTf(this)"><div class="tf-head"><span class="tf-num">${String(f.order).padStart(2,'0')}</span><span class="tf-name" style="font-family:${fam};${sty}">${f.name}</span><span class="tf-meta">${f.author} · ${f.year}</span></div><div class="tf-body"><div class="tf-big" style="font-family:${fam};${sty}">${f.bigLetter}</div><div class="tf-styles">${(f.styles||[]).map((s,j)=>`<div class="tf-sbtn${j===0?' on':''}" onclick="event.stopPropagation()">${s}</div>`).join('')}</div><div class="tf-ctrl" onclick="event.stopPropagation()"><label>SIZE <input type="range" min="14" max="80" value="26" oninput="this.closest('.tf-body').querySelector('.tf-specimen').style.fontSize=this.value+'px';this.parentElement.querySelector('.v').textContent=this.value"><span class="v">26</span></label><label>COLS <input type="range" min="1" max="3" value="1" oninput="this.closest('.tf-body').querySelector('.tf-specimen').style.columns=this.value;this.parentElement.querySelector('.v').textContent=this.value"><span class="v">1</span></label></div><div class="tf-specimen" style="font-family:${fam}">${f.sampleText}</div><div class="tf-chars" style="font-family:${fam}">${f.charset}</div><div class="tf-about"><div><div class="al">ABOUT</div><p>${f.description}</p></div><div><div class="al">AUTHOR</div><p>${f.author} — Studio of Typography, UMPRUM.</p></div></div><div class="tf-acts"><a href="#" class="btn btn-fill" onclick="event.stopPropagation();selectTryFont(${i});goPage('try')">TRY →</a><button class="btn" onclick="event.stopPropagation()">SPECIMEN PDF</button></div></div></div>`;
  }).join('');
}

function renderTfFilters(){
  const years=[...new Set(DATA.typefaces.map(f=>f.year))].sort((a,b)=>b-a);
  const authors=[...new Set(DATA.typefaces.map(f=>f.author))].sort();
  document.getElementById('tfFilters').innerHTML=`<span class="f-label">YEAR</span><button class="f-btn on" onclick="filtTf('y','all',this)">ALL</button>${years.map(y=>`<button class="f-btn" onclick="filtTf('y','${y}',this)">${y}</button>`).join('')}<div class="f-sep"></div><span class="f-label">AUTHOR</span><button class="f-btn on" onclick="filtTf('a','all',this)">ALL</button>${authors.map(a=>`<button class="f-btn" onclick="filtTf('a','${a}',this)">${a.toUpperCase()}</button>`).join('')}`;
}

/* ═══ ARCHIVE + POST DETAIL ═══ */
function renderWork(){
  document.getElementById('wkList').innerHTML=DATA.posts.map(w=>`<div class="wk-row" data-tag="${w.tag}" data-year="${w.date.slice(0,4)}" data-avail="${w.available}" data-img="${w.cover||''}" data-slug="${w._slug||''}" onclick="openPost('${w._slug||''}')" onmouseenter="showPrev(event,this)" onmouseleave="hidePrev()"><span class="wk-date">${w.date.slice(0,4)}</span><span class="wk-title">${w.title}</span><span class="wk-tags"><span class="wk-tag">${w.tag.toUpperCase()}</span>${w.available?'<span class="wk-tag avail">AVAILABLE</span>':''}</span><span class="wk-arrow">→</span></div>`).join('');
}

function renderWkFilters(){
  const years=[...new Set(DATA.posts.map(p=>p.date.slice(0,4)))].sort((a,b)=>b-a);
  document.getElementById('wkFilters').innerHTML=`<span class="f-label">TYPE</span><button class="f-btn on" onclick="filtWk('t','all',this)">ALL</button><button class="f-btn" onclick="filtWk('t','blog',this)">BLOG</button><button class="f-btn" onclick="filtWk('t','project',this)">PROJECT</button><button class="f-btn" onclick="filtWk('t','available',this)">AVAILABLE</button><div class="f-sep"></div><span class="f-label">YEAR</span><button class="f-btn on" onclick="filtWk('y','all',this)">ALL</button>${years.map(y=>`<button class="f-btn" onclick="filtWk('y','${y}',this)">${y}</button>`).join('')}`;
}

function openPost(slug){
  const post=DATA.posts.find(p=>p._slug===slug);
  if(!post)return;
  const cont=document.getElementById('postDetail');
  cont.innerHTML=`<div class="post-detail">
    <span class="pd-back" onclick="closePost()">← BACK TO ARCHIVE</span>
    <div class="pd-tag">${post.tag.toUpperCase()}</div>
    <div class="pd-title">${post.title.toUpperCase()}</div>
    <div class="pd-date">${new Date(post.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase()}</div>
    ${post.available?'<span class="pd-avail">PHYSICAL EDITION AVAILABLE — INQUIRE</span>':''}
    ${post.cover?`<img class="pd-cover" src="${post.cover}">`:''} 
    <div class="pd-body">${(post.body||'').split('\n').map(p=>'<p>'+p+'</p>').join('')}</div>
  </div>`;
  goPage('post');
}
function closePost(){goPage('work')}

/* ═══ TRY ═══ */
function renderTryFonts(){
  document.getElementById('tryFonts').innerHTML=DATA.typefaces.map((f,i)=>`<div class="try-font-btn${i===0?' on':''}" onclick="selectTryFont(${i})">${f.name}</div>`).join('');
}
function renderTryControls(){
  const f=DATA.typefaces[currentTryFont]||DATA.typefaces[0];if(!f)return;
  const hasW=f.hasWeight;
  document.getElementById('tryHeader').innerHTML=`<div class="try-ctrl"><label>SIZE</label><input type="range" min="20" max="300" value="120" oninput="setTry('fontSize',this.value+'px')"></div><div class="try-ctrl"><label>TRACKING</label><input type="range" min="-20" max="50" value="0" oninput="setTry('letterSpacing',(this.value/100)+'em')"></div><div class="try-ctrl"><label>LEADING</label><input type="range" min="60" max="200" value="85" oninput="setTry('lineHeight',(this.value/100))"></div><div class="try-ctrl${hasW?'':' disabled'}"><label>WEIGHT${hasW?'':' (N/A)'}</label><input type="range" min="${f.weightMin||100}" max="${f.weightMax||900}" value="${f.weightMin||400}" oninput="setTry('fontWeight',this.value)"${hasW?'':' disabled'}></div>`;
  const ot=f.otFeatures||[];
  document.getElementById('tryOt').innerHTML=ot.length?`<span class="try-ot-label">OPENTYPE</span>${ot.map(ft=>`<div class="try-ot-btn" onclick="toggleOt(this,'${ft}')">${ft.toUpperCase()}</div>`).join('')}`:'';
  const hasItalic=(f.styles||[]).some(s=>s.toLowerCase().includes('italic'));
  document.getElementById('tryFx').innerHTML=`<div class="try-fx-btn" onclick="toggleFx(this,'outline')">OUTLINE</div><div class="try-fx-btn" onclick="toggleFx(this,'invert')">INVERT</div><div class="try-fx-btn${hasItalic?'':' disabled'}" onclick="${hasItalic?"toggleFx(this,'italic')":""}">ITALIC${hasItalic?'':' (N/A)'}</div><div class="try-fx-btn" onclick="toggleFx(this,'blur')">BLUR</div>`;
}
let currentTryFont=0;
function selectTryFont(i){
  currentTryFont=i;const f=DATA.typefaces[i];if(!f)return;
  const inp=document.getElementById('tryInput');
  inp.style.fontFamily=getFam(f.name);inp.style.webkitTextStroke='';inp.style.color='var(--fg)';
  inp.style.fontStyle='normal';inp.style.filter='none';inp.style.fontFeatureSettings='normal';
  fxS={outline:false,invert:false,italic:false,blur:false};otState={};
  document.querySelectorAll('.try-font-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.try-font-btn')[i]?.classList.add('on');
  renderTryControls();
}
function setTry(p,v){document.getElementById('tryInput').style[p]=v}
let fxS={outline:false,invert:false,italic:false,blur:false};
function toggleFx(btn,fx){
  fxS[fx]=!fxS[fx];btn.classList.toggle('on');const inp=document.getElementById('tryInput');
  inp.style.webkitTextStroke=fxS.outline?'2px var(--fg)':'';
  inp.style.color=fxS.outline?'transparent':'var(--fg)';
  inp.style.fontStyle=fxS.italic?'italic':'normal';
  let fl=[];if(fxS.invert)fl.push('invert(1)');if(fxS.blur)fl.push('blur(4px)');
  inp.style.filter=fl.join(' ')||'none';
}
let otState={};
function toggleOt(btn,feat){
  otState[feat]=!otState[feat];btn.classList.toggle('on');
  const s=Object.entries(otState).filter(([k,v])=>v).map(([k])=>`"${k}" 1`).join(', ');
  document.getElementById('tryInput').style.fontFeatureSettings=s||'normal';
}
document.getElementById('tryInput').addEventListener('input',function(){this.style.height='auto';this.style.height=this.scrollHeight+'px'});

/* ═══ NAV ═══ */
function goPage(p,el){
  document.querySelectorAll('.pg').forEach(x=>x.classList.remove('on'));
  document.getElementById('p-'+p).classList.add('on');
  document.querySelectorAll('.hc-nav a').forEach(a=>a.classList.remove('on'));
  if(el)el.classList.add('on');
  else{const a=document.querySelector('[data-p="'+p+'"]');if(a)a.classList.add('on')}
  window.scrollTo(0,0);
  document.getElementById('infoMega').classList.remove('open');
}

/* ═══ COLOR MODES ═══ */
const modes=['mono','night','ocean','ember','acid','violet'];
const modeLabels=['MONO','NIGHT','OCEAN','EMBER','ACID','VIOLET'];
let modeIdx=0;
function cycleMode(){
  modeIdx=(modeIdx+1)%modes.length;
  document.documentElement.setAttribute('data-mode',modes[modeIdx]);
  document.getElementById('modeBtn').innerHTML=`<span class="mode-label">${modeLabels[modeIdx]}</span>`;
}
if(window.matchMedia('(prefers-color-scheme:dark)').matches){modeIdx=1;document.documentElement.setAttribute('data-mode','night');document.getElementById('modeBtn').innerHTML='<span class="mode-label">NIGHT</span>'}

/* ═══ MARQUEE ═══ */
function toggleMarquee(){document.getElementById('marqueeWrap').classList.toggle('hidden');document.getElementById('mqBtn').textContent=document.getElementById('marqueeWrap').classList.contains('hidden')?'▲':'▼'}

/* ═══ INFO ═══ */
const logo=document.querySelector('.hc-logo');let infoT;
logo.addEventListener('mouseenter',()=>{clearTimeout(infoT);document.getElementById('infoMega').classList.add('open')});
logo.addEventListener('mouseleave',()=>{infoT=setTimeout(()=>document.getElementById('infoMega').classList.remove('open'),400)});
document.getElementById('infoMega').addEventListener('mouseenter',()=>clearTimeout(infoT));
document.getElementById('infoMega').addEventListener('mouseleave',()=>{infoT=setTimeout(()=>document.getElementById('infoMega').classList.remove('open'),250)});

/* ═══ ACCORDION ═══ */
function toggleTf(row){const w=row.classList.contains('open');document.querySelectorAll('.tf-row.open').forEach(r=>r.classList.remove('open'));if(!w)row.classList.add('open')}
function openTf(i){const r=document.querySelectorAll('.tf-row');if(r[i]){r[i].classList.add('open');r[i].scrollIntoView({behavior:'smooth',block:'start'})}}

/* ═══ FILTERS ═══ */
function getGroup(btn){const s=[...btn.closest('.filter-strip').children];const idx=s.indexOf(btn);let a=idx,b=s.length;for(let i=idx-1;i>=0;i--)if(!s[i].classList.contains('f-btn')){a=i+1;break}for(let i=idx+1;i<s.length;i++)if(!s[i].classList.contains('f-btn')){b=i;break}return s.slice(a,b).filter(x=>x.classList.contains('f-btn'))}
let tfY='all',tfA='all';
function filtTf(dim,val,btn){getGroup(btn).forEach(b=>b.classList.remove('on'));btn.classList.add('on');if(dim==='y')tfY=val;else tfA=val;document.querySelectorAll('.tf-row.open').forEach(r=>r.classList.remove('open'));document.querySelectorAll('.tf-row').forEach(r=>{r.style.display=(tfY==='all'||r.dataset.y===tfY)&&(tfA==='all'||r.dataset.a===tfA)?'':'none'})}
let wkT='all',wkY='all';
function filtWk(dim,val,btn){getGroup(btn).forEach(b=>b.classList.remove('on'));btn.classList.add('on');if(dim==='t')wkT=val;else wkY=val;document.querySelectorAll('.wk-row').forEach(r=>{const mt=wkT==='all'||r.dataset.tag===wkT||(wkT==='available'&&r.dataset.avail==='true');r.style.display=mt&&(wkY==='all'||r.dataset.year===wkY)?'':'none'})}

/* ═══ HOVER PREVIEW ═══ */
const prev=document.getElementById('wkPreview'),prevImg=document.getElementById('wkPrevImg');
function showPrev(e,row){const s=row.dataset.img;if(!s)return;prevImg.src=s;prev.classList.add('show')}
function hidePrev(){prev.classList.remove('show')}
document.addEventListener('mousemove',e=>{if(prev.classList.contains('show')){prev.style.left=e.clientX+'px';prev.style.top=e.clientY+'px'}});

/* ═══ MOBILE ═══ */
function setupMobileScroll(){
  if(window.innerWidth>900){document.querySelectorAll('.home-cell.in-view').forEach(c=>c.classList.remove('in-view'));return}
  const obs=new IntersectionObserver(es=>{es.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting&&e.intersectionRatio>=0.4))},{threshold:[0,.2,.4,.6,.8,1],rootMargin:'-15% 0px -15% 0px'});
  document.querySelectorAll('#homeGrid .home-cell').forEach(c=>obs.observe(c));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('infoMega').classList.remove('open')});
window.addEventListener('resize',setupMobileScroll);

/* ═══ INIT ═══ */
loadData();
