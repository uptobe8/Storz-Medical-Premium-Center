const Resources = window.Resources || [];
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const currentPage = () => location.pathname.split('/').pop() || 'index.html';

function guardAccess(){
  const page=currentPage();
  if(page==='index.html'||page==='') return;
  const params=new URLSearchParams(location.search);
  if(params.has('access')){
    try{localStorage.setItem('storz-medical-access','1');}catch(e){}
    try{sessionStorage.setItem('storz-medical-access','1');}catch(e){}
    try{document.cookie='storz-medical-access=1; path=/; max-age=86400';}catch(e){}
    return;
  }
  try{
    if(localStorage.getItem('storz-medical-access')||sessionStorage.getItem('storz-medical-access')) return;
  }catch(e){ return; }
  if((document.cookie||'').includes('storz-medical-access=1')) return;
  return;
}
function setActiveNav(){
  $$('[data-nav]').forEach(a=>{ if(a.getAttribute('href')===currentPage()) a.classList.add('active'); });
}
function initMobile(){
  const btn=$('.menu-toggle'), panel=$('.mobile-panel');
  if(!btn||!panel) return;
  btn.addEventListener('click',()=>panel.classList.toggle('open'));
}
function initLogout(){
  $$('[data-logout]').forEach(a=>a.addEventListener('click',()=>localStorage.removeItem('storz-medical-access')));
}
function initLogin(){
  const form=$('[data-login-form]');
  if(!form) return;
  form.setAttribute('action','plataforma.html');
  form.setAttribute('method','get');
  let hidden=form.querySelector('input[name="access"]');
  if(!hidden){
    hidden=document.createElement('input');
    hidden.type='hidden';
    hidden.name='access';
    hidden.value='1';
    form.appendChild(hidden);
  }
  const grant=()=>{
    try{localStorage.setItem('storz-medical-access','1');}catch(e){}
    try{sessionStorage.setItem('storz-medical-access','1');}catch(e){}
    try{document.cookie='storz-medical-access=1; path=/; max-age=86400';}catch(e){}
  };
  form.addEventListener('submit',grant,true);
  const submit=form.querySelector('button[type="submit"], .btn.primary');
  if(submit) submit.addEventListener('click',grant,true);
}
function esc(v){ return (v||'').toString().replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function cardHTML(r){
  const text=(r.title+' '+r.summary+' '+r.type+' '+r.level+' '+r.specialty+' '+r.access).toLowerCase();
  return `<article class="card resource-card" data-type="${esc(r.type)}" data-level="${esc(r.level)}" data-specialty="${esc(r.specialty)}" data-access="${esc(r.access)}" data-title="${esc(text)}">
    <a href="detalle.html?id=${esc(r.id)}" class="card-media" style="--img:url('${esc(r.image)}')" aria-label="Abrir ${esc(r.title)}"></a>
    <div class="card-pad"><span class="tag">${esc(r.type)}</span><h3><a href="detalle.html?id=${esc(r.id)}">${esc(r.title)}</a></h3><p>${esc(r.summary)}</p>
      <div class="resource-meta"><span class="micro">${esc(r.level)}</span>${r.specialty?`<span class="micro">${esc(r.specialty)}</span>`:''}<span class="micro">${esc(r.access)}</span></div>
      <div class="resource-actions"><a class="btn primary" href="detalle.html?id=${esc(r.id)}">Abrir ficha</a><a class="btn" href="${esc(r.category)}">${esc(r.categoryName)}</a></div>
    </div>
  </article>`;
}
function renderResourceGrid(){
  $$('[data-resource-grid]').forEach(grid=>{
    const category=grid.dataset.category;
    const limit=parseInt(grid.dataset.limit||'0',10);
    const specialty=grid.dataset.specialty;
    let list=[...Resources];
    if(category && category!=='all') list=list.filter(r=>r.category===category);
    if(specialty) list=list.filter(r=>r.specialty===specialty);
    if(limit) list=list.slice(0,limit);
    grid.innerHTML=list.map(cardHTML).join('');
  });
  initFilters();
}
function initFilters(){
  const input=$('[data-search]');
  const buttons=$$('[data-filter]');
  if(!input && !buttons.length) return;
  function apply(){
    const active=$('[data-filter].active');
    const f=active ? active.dataset.filter : 'all';
    const term=(input?.value||'').trim().toLowerCase();
    let shown=0;
    $$('.resource-card').forEach(c=>{
      const values=[c.dataset.type,c.dataset.level,c.dataset.specialty,c.dataset.access].filter(Boolean);
      const okFilter=f==='all'||values.includes(f);
      const okSearch=!term||(c.dataset.title||'').includes(term);
      const ok=okFilter&&okSearch;
      c.style.display=ok?'flex':'none';
      if(ok) shown++;
    });
    const empty=$('[data-empty]');
    if(empty) empty.style.display=shown?'none':'block';
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('active'));b.classList.add('active');apply();}));
  if(input) input.addEventListener('input',apply);
  apply();
}
function initCarousels(){
  Array.from(new Set($$('[data-carousel], .carousel'))).forEach((car,i)=>{
    const prev=$(`[data-carousel-prev="${i}"]`), next=$(`[data-carousel-next="${i}"]`);
    const step=()=>Math.max(260,Math.min(car.clientWidth*.88,460));
    if(prev) prev.addEventListener('click',e=>{e.preventDefault();car.scrollBy({left:-step(),behavior:'smooth'});});
    if(next) next.addEventListener('click',e=>{e.preventDefault();car.scrollBy({left:step(),behavior:'smooth'});});
  });
}
function renderCarousel(){
  $$('[data-resource-carousel]').forEach((car,i)=>{
    const ids=(car.dataset.ids||'').split(',').map(x=>x.trim()).filter(Boolean);
    const category=car.dataset.category;
    let list=ids.length ? ids.map(id=>Resources.find(r=>r.id===id)).filter(Boolean) : [...Resources];
    if(category) list=list.filter(r=>r.category===category);
    car.innerHTML=list.map(cardHTML).join('');
    car.setAttribute('data-carousel','');
  });
}
function downloadsHTML(r){
  const protocol = r.category==='protocolos.html' ? 'descargas/protocolo-clinico-ondas-de-choque.txt' : 'descargas/checklist-seguridad-clinica.txt';
  return `<div class="download-strip"><a class="btn primary" download href="${protocol}">Descargar plantilla clínica</a><a class="btn" download href="descargas/consentimiento-informado-ondas-de-choque.txt">Consentimiento informado</a><a class="btn" download href="descargas/hoja-seguimiento-paciente.txt">Hoja de seguimiento</a></div>`;
}
function renderDetail(){
  const mount=$('[data-detail]');
  if(!mount) return;
  const id=new URLSearchParams(location.search).get('id') || Resources[0]?.id;
  const r=Resources.find(x=>x.id===id) || Resources[0];
  if(!r){ mount.innerHTML='<p>No hay contenido disponible.</p>'; return; }
  document.title = r.title + ' · STORZ Medical Premium Center';
  const hero=$('.hero-image');
  if(hero) hero.style.setProperty('--hero-img',`url('${r.image}')`);
  const related=Resources.filter(x=>x.id!==r.id && (x.category===r.category || (r.specialty && x.specialty===r.specialty))).slice(0,4);
  mount.innerHTML = `<div class="breadcrumb"><a href="plataforma.html">Plataforma</a> / <a href="${esc(r.category)}">${esc(r.categoryName)}</a> / ${esc(r.title)}</div>
    <div class="detail-layout"><article class="article"><span class="tag">${esc(r.type)}</span><h1>${esc(r.title)}</h1><p style="font-size:17px;max-width:940px">${esc(r.detail)}</p>
    <h2>Objetivo clínico</h2><p>${esc(r.objective)}</p>
    <h2>Contenido de la ficha</h2><ul>${(r.bullets||[]).map(b=>`<li>${esc(b)}</li>`).join('')}</ul>
    ${(r.clinical&&r.clinical.length)?`<h2>Recursos incluidos</h2><div class="clinical-list">${r.clinical.map(i=>`<div>${esc(i)}</div>`).join('')}</div>`:''}
    ${downloadsHTML(r)}
    <h2>Uso profesional</h2><p>La ficha está diseñada para apoyar la formación y la organización del trabajo clínico. La indicación final, los parámetros aplicados y la continuidad del tratamiento deben quedar documentados en la historia clínica y ajustarse al paciente, al equipo utilizado y al criterio del especialista.</p>
    ${r.source?`<p class="source-note">${esc(r.source)}</p>`:''}
    <div class="resource-actions"><a class="btn primary" href="${esc(r.category)}">Volver a ${esc(r.categoryName)}</a><a class="btn" href="plataforma.html">Ir a plataforma</a></div>
    ${related.length?`<h2>Contenido relacionado</h2><div class="grid cols-4">${related.map(cardHTML).join('')}</div>`:''}</article>
    <aside class="meta-panel"><dl><div><dt>Categoría</dt><dd>${esc(r.categoryName)}</dd></div><div><dt>Tipo</dt><dd>${esc(r.type)}</dd></div><div><dt>Especialidad</dt><dd>${esc(r.specialty||'Transversal')}</dd></div><div><dt>Nivel formativo</dt><dd>${esc(r.level)}</dd></div><div><dt>Acceso</dt><dd>${esc(r.access)}</dd></div></dl><hr style="border:0;border-top:1px solid rgba(73,88,78,.14);margin:20px 0"><a class="btn primary" href="${esc(r.category)}" style="width:100%">Ver categoría</a></aside></div>`;
}
function renderHighlights(){
  const target=$('[data-dashboard-latest]');
  if(!target) return;
  const ids=['fundamentos-tipos-ondas','fundamentos-indicaciones','consulta-introduccion','protocolo-fascitis-plantar','protocolo-disfuncion-erectil','biblioteca-consentimiento'];
  target.innerHTML=ids.map(id=>Resources.find(r=>r.id===id)).filter(Boolean).map(cardHTML).join('');
}

document.addEventListener('DOMContentLoaded',()=>{
  guardAccess();setActiveNav();initMobile();initLogout();initLogin();
  renderCarousel();renderResourceGrid();renderDetail();renderHighlights();initCarousels();
});

// V6 visual sync: use the existing V4 hero image as full-width hero background without changing HTML content.
function syncPageHeroBackgroundV6(){
  const pageHero = document.querySelector('.page-hero');
  const heroImage = document.querySelector('.page-hero .hero-image');
  if(!pageHero || !heroImage) return;
  const bg = heroImage.style.getPropertyValue('--hero-img');
  if(bg) pageHero.style.setProperty('--page-hero-bg', bg);
}
document.addEventListener('DOMContentLoaded',()=>{
  syncPageHeroBackgroundV6();
  setTimeout(syncPageHeroBackgroundV6, 60);
});


// V8 mobile polish: close mobile menu after selection and normalize carousel touch behavior.
document.addEventListener('DOMContentLoaded',()=>{
  $$('.mobile-panel a').forEach(a=>a.addEventListener('click',()=>{
    const panel=$('.mobile-panel');
    if(panel) panel.classList.remove('open');
  }));
  Array.from(new Set($$('[data-carousel], .carousel'))).forEach(car=>{
    car.style.scrollBehavior='smooth';
    car.setAttribute('tabindex','0');
  });
});
