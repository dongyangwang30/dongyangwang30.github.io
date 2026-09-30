(() => {
'use strict';
const data=window.PORTFOLIO;
const tabs=[...document.querySelectorAll('[role=tab]')];
const views=[...document.querySelectorAll('[role=tabpanel]')];
const contact=document.getElementById('contact');
const contactToggle=document.getElementById('contact-toggle');
let language='en';
try{language=localStorage.getItem('portfolio-language')==='zh'?'zh':'en';}catch{}
const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
const aliases={home:'about',project:'projects',photography:'art/photography',music:'art/guitar',life:'art/guitar',culture:'art/books',contact:'about/contact'};
const targets={'art/photography':'art-photography','art/guitar':'art-guitar','art/books':'art-books','about/contact':'contact-toggle'};
function setContact(open){contact.hidden=!open;contactToggle.setAttribute('aria-expanded',String(open));contactToggle.setAttribute('aria-label',language==='en'?(open?'Hide contact links':'Show contact links'):(open?'收起联系方式':'显示联系方式'));}
contactToggle.addEventListener('click',()=>setContact(contact.hidden));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setContact(false);});
function activate(raw,focus=false){
 const route=aliases[raw]||raw||'about';let id=route.split('/')[0];if(!views.some(v=>v.id===id))id='about';
 tabs.forEach(tab=>{const selected=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus({preventScroll:true});});
 views.forEach(view=>view.hidden=view.id!==id);
 document.title=tabs.find(tab=>tab.dataset.tab===id).textContent+' — Dongyang Wang';
 if(route==='about/contact')setContact(true);
 const target=targets[route];if(target)requestAnimationFrame(()=>document.getElementById(target).scrollIntoView({block:'start',behavior:'instant'}));else window.scrollTo({top:0,behavior:'instant'});
}
function navigate(route,focus=false){if(location.hash!=='#'+route)history.pushState(null,'','#'+route);activate(route,focus);}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>navigate(tab.dataset.tab));
 tab.addEventListener('keydown',event=>{let n;if(event.key==='ArrowRight')n=(i+1)%3;else if(event.key==='ArrowLeft')n=(i+2)%3;else if(event.key==='Home')n=0;else if(event.key==='End')n=2;else return;event.preventDefault();navigate(tabs[n].dataset.tab,true);});
});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const route=link.getAttribute('href').slice(1);if(route==='main')return;e.preventDefault();navigate(route);document.getElementById(targets[route]||route.split('/')[0])?.focus({preventScroll:true});}));
window.addEventListener('popstate',()=>activate(location.hash.slice(1)));
window.addEventListener('hashchange',()=>activate(location.hash.slice(1)));
const gallery=document.getElementById('photo-wall');
function createMosaic(photos,target){
 photos.forEach(photo=>{
  const figure=element('figure','wall-photo');
  figure.dataset.ratio=photo.width/photo.height;
  const img=element('img');Object.assign(img,{src:photo.thumb,width:photo.width,height:photo.height,loading:'lazy',decoding:'async'});
  img.dataset.altZh=photo.alt;img.dataset.altEn='Portrait photography by Dongyang Wang';
  img.srcset=photo.thumb+' '+photo.thumbWidth+'w, '+photo.src+' '+photo.width+'w';img.sizes='(max-width: 760px) 50vw, 34vw';
  figure.append(img);target.append(figure);
 });
}
// The horizontal positions and sizes are individually composed in content.js.
// Vertical placement respects every original frame and never overlaps another photo.
function calculatePhotoLayout(photos,width){
 const mobile=width<600, gap=width*(mobile?.035:.022), placed=[];
 photos.forEach((photo,index)=>{
  let [left,span,offset]=photo.composition;
  if(mobile){
   const patterns=[[0,56,0],[63,35,24],[4,37,0],[47,53,0],[0,58,10],[66,34,0]];
   [left,span,offset]=patterns[index%patterns.length];
  }
  const x=width*left/100,w=width*span/100,h=w*photo.height/photo.width;
  let y=width*offset/1000;
  for(const prior of placed){
   if(x<prior.x+prior.width+gap && x+w+gap>prior.x)y=Math.max(y,prior.y+prior.height+gap+width*offset/1000);
  }
  placed.push({x,y,width:w,height:h});
 });
 return {items:placed,height:Math.max(...placed.map(p=>p.y+p.height))};
}
let lastGalleryWidth=0;
function layoutMosaic(target){
 const width=target.clientWidth;
 if(!width || width===lastGalleryWidth)return;
 lastGalleryWidth=width;
 const layout=calculatePhotoLayout(data.photos,width);
 target.querySelectorAll('.wall-photo').forEach((figure,index)=>{
  const rect=layout.items[index];
  Object.assign(figure.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px'});
  figure.querySelector('img').sizes=Math.ceil(rect.width)+'px';
 });
 target.style.height=layout.height+'px';
 target.classList.add('is-composed');
}
if(typeof ResizeObserver!=='undefined'){
 const observer=new ResizeObserver(()=>layoutMosaic(gallery));
 observer.observe(gallery);
}
createMosaic(data.photos,gallery);
function renderProjects(){
 const apps=document.getElementById('apps-grid');const games=document.getElementById('games-grid');apps.replaceChildren();games.replaceChildren();
 data.projects.forEach(project=>{
  const text=project[language];const card=element('a','project-card');card.href=project.href;card.dataset.project=project.id;
  card.append(element('h2','',text.name));
  if(text.description)card.append(element('p','project-description',text.description));
  card.append(element('span','project-action',text.action));
  if(project.image){const figure=element('figure','project-figure');const img=element('img');Object.assign(img,{src:project.image,alt:text.imageAlt,loading:'lazy'});figure.append(img);card.append(figure);}
  (project.section==='apps'?apps:games).append(card);
 });
}
function applyLanguage(){
 document.documentElement.lang=language==='zh'?'zh-CN':'en';
 document.querySelectorAll('[data-en][data-zh]').forEach(n=>n.textContent=n.dataset[language]);
 document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(n=>n.alt=language==='zh'?n.dataset.altZh:n.dataset.altEn);
 const button=document.getElementById('language-toggle');button.textContent=language==='en'?'中文':'EN';button.setAttribute('aria-label',language==='en'?'Switch to Chinese':'切换为英文');
 document.querySelector('.tabs').setAttribute('aria-label',language==='en'?'Pages':'页面');

 document.getElementById('art-photography').setAttribute('aria-label',language==='en'?'Photography':'摄影');
 gallery.setAttribute('aria-label',language==='en'?'Photography collage':'摄影拼贴');
 document.querySelector('.contact-icon').setAttribute('aria-label',language==='en'?'Email':'邮件');
 document.querySelector('.contact-icon').title=language==='en'?'Email':'邮件';
 document.querySelector('.skip-link').textContent=language==='en'?'Skip to content':'跳至内容';
 document.querySelector('meta[name=description]').content=language==='en'?'Apps, games, photography and music by Dongyang Wang.':'Dongyang Wang 的应用、游戏、摄影与音乐作品。';
 renderProjects();setContact(!contact.hidden);
 document.title=(tabs.find(t=>t.getAttribute('aria-selected')==='true')?.textContent||'About')+' — Dongyang Wang';
 document.querySelectorAll('a[href^="projects/book-club.html"]').forEach(a=>a.href='projects/book-club.html'+(language==='zh'?'?lang=zh':'?lang=en'));
}
document.getElementById('language-toggle').addEventListener('click',()=>{language=language==='en'?'zh':'en';try{localStorage.setItem('portfolio-language',language);}catch{}applyLanguage();});
applyLanguage();activate(location.hash.slice(1));
})();
