/**
 * controllers/actions.js — Delegación de eventos click/change
 * ---
 * Responsabilidad:
 *   - mapeo de data-action a funciones del sistema
 *   - __ACTIONS: registro central de acciones UI
 *   - __refreshAll: recarga completa de barra, sedes y vistas
 *
 * Dependencias:
 *   - Todos los renderers y controladores (navegación, editor, SNIES, etc.)
 *
 * Estado:
 *   Estable. Capa de enlace entre DOM (data-action) y lógica de negocio.
 */

function __refreshAll(){renderFacBar();populateSedes();renderViews();}

var __ACTIONS = {
  'show-tab': function(b){ showTab(b.dataset.tab); },
  'sel-fac':  function(b){ selFac(parseInt(b.dataset.fac,10)); __refreshAll();var _actTab=document.querySelector('.tb.act');if(_actTab)showTab(_actTab.dataset.tab); },
  'reset-filters': function(){ resetFilters(); },
  'snies-set-fac': function(b){ snSetFac(b.dataset.fac); },
  'snies-set-prog': function(b){ snSetProg(b.dataset.prog); },
  'toggle-section': function(b){ toggleSec(b.dataset.secId); },
  'download-html': function(){ downloadHTML(); },
  'print': function(){ window.print(); },
  'reset-db': function(){ resetDB(); },
  'open-edit-prog': function(b){ showTab('editor'); openEditProg(b.dataset.pid); },
  'del-linea': function(b){ delLinea(b.dataset.lineaId); },
  'del-mae': function(b){ delMae(b.dataset.maeId); },
  'add-linea': function(){ addLinea(); },
  'add-mae': function(){ addMae(); },
  'save-prog': function(b){ saveProg(b.dataset.pid, b.dataset.isNew === 'true'); },
  'cancel-edit': function(){ cancelEdit(); },
  'delete-prog': function(b){ deleteProg(b.dataset.pid); },
  'save-doc': function(){ saveDoc(); },
  'toggle-doc-form': function(){ toggleDocForm(); },
  'open-new-prog': function(){ openNewProg(); },
  'open-edit-fac': function(){ openEditFac(); },
  'open-new-fac': function(){ openNewFac(); },
  'save-fac': function(b){ saveFac(b.dataset.isNew === 'true'); },
  'delete-fac': function(){ deleteFac(); },
  'open-program-link': function(b){
    var url = b.getAttribute('data-url');
    if(url) window.open(url, '_blank', 'noopener,noreferrer');
  },
  'show-learning-route': function(b){
    openLearningRouteModal(b.dataset.espId, b.dataset.sede);
  },
  'rc-show-detail': function(b){
    renderIndicadorRCDetalle(b.getAttribute('data-filter'));
  },
  'rc-close-detail': function(){
    var o = document.getElementById('rc-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'prof-show-detail': function(b){
    renderIndicadorProfDetalle(b.getAttribute('data-filter'));
  },
  'prof-close-detail': function(){
    var o = document.getElementById('prof-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'prof-filter-type': function(b){
    profSetTipo(b.getAttribute('data-tipo'));
  },
  'mae-show-detail': function(b){
    renderIndicadorMaeDetalle(b.getAttribute('data-filter'));
  },
  'mae-close-detail': function(){
    var o = document.getElementById('mae-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'mae-filter-type': function(b){
    maeSetTipo(b.getAttribute('data-tipo'));
  },
  'mae-rc-show-detail': function(b){
    renderIndicadorMaeRcDetalle(b.getAttribute('data-filter'));
  },
  'mae-rc-close-detail': function(){
    var o = document.getElementById('mae-rc-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'esf-show-detail': function(b){
    renderIndicadorEsfDetalle(b.getAttribute('data-filter'));
  },
  'esf-close-detail': function(){
    var o = document.getElementById('esf-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'pre-show-detail': function(b){ renderIndicadorPreDetalle(b.getAttribute('data-filter')); },
  'pre-close-detail': function(){
    var o = document.getElementById('pre-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'doc-show-detail': function(b){ renderIndicadorDocDetalle(b.getAttribute('data-filter')); },
  'doc-close-detail': function(){
    var o = document.getElementById('doc-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'posg-show-detail': function(b){ renderPosgDetalle(b.getAttribute('data-filter')); },
  'posg-show-detail-vigente': function(b){ renderPosgDetalle(b.getAttribute('data-filter'), 'V'); },
  'posg-show-detail-proyectada': function(b){ renderPosgDetalle(b.getAttribute('data-filter'), 'P'); },
  'posg-close-detail': function(){
    var o = document.getElementById('posg-detail-overlay');
    if(o && o.parentNode) document.body.removeChild(o);
  },
  'toggle-sedes-list': function(b){ toggleSedesList(b.getAttribute('data-pid')); },
  'select-sede-prog': function(b){ setSedeProg(b.getAttribute('data-pid'), b.getAttribute('data-sede')); },
  'toggle-mae': function(b){ toggleMaeNode(b.getAttribute('data-key')); },
  'close-lr-modal': function(){
    var o = document.getElementById('lr-modal-overlay');
    if(o) document.body.removeChild(o);
  },
  'edit-lr-from-modal': function(){
    var overlay = document.getElementById('lr-modal-overlay');
    if(!overlay) return;
    var espId = overlay.dataset.espId;
    var sede = overlay.dataset.sede || 'ALL';
    if(!espId || !_getLearningRoute(espId, sede)){ toast('Ruta no disponible para edición'); return; }
    document.body.removeChild(overlay);
    showTab('editor');
    _lrSetTab('rutas');
    _lrEditRoute(espId, sede);
  },
  // ===== Editor de rutas =====
  'lr-set-tab': function(b){ _lrSetTab(b.dataset.tab); },
  'lr-edit-route': function(b){ _lrEditRoute(b.dataset.espId, b.dataset.sede); },
  'lr-delete-route': function(b){ _lrDeleteRoute(b.dataset.espId, b.dataset.sede); },
  'create-route-for-prog': function(b){
    _lrEditRoute(b.dataset.progId, 'ALL', {name:b.dataset.progName, type:b.dataset.progType});
  },
  'lr-create-sede-route': function(b){
    var sel=document.getElementById('lr-new-sede-'+b.dataset.progId);
    var sede=sel?sel.value:'';
    if(!sede){ toast('Selecciona una sede'); return; }
    _lrEditRoute(b.dataset.progId, sede, {copyFrom:'ALL', name:b.dataset.progName, type:b.dataset.progType});
  },
  'lr-back-to-list': function(){ _lrCancelDraft(); renderEditor(); },
  'lr-reassign-route': function(b){
    var espId=b.dataset.orphanId;
    var sel=document.getElementById('lr-reassign-'+espId);
    var target=sel?sel.value:'';
    if(!target){ toast('Selecciona un programa destino'); return; }
    _lrReassignRoute(espId, target);
  },
  'lr-keep-orphan': function(){ backupDB(); },
  'lr-delete-orphan': function(b){ _lrDeleteOrphan(b.dataset.orphanId); },
  'lr-add-semester': function(){ _lrAddSemester(); },
  'lr-delete-semester': function(b){ _lrDeleteSemester(parseInt(b.dataset.si,10)); },
  'lr-add-subject': function(b){ _lrAddSubject(parseInt(b.dataset.si,10)); },
  'lr-delete-subject': function(b){ _lrDeleteSubject(parseInt(b.dataset.si,10),parseInt(b.dataset.ji,10)); },
  'lr-save-route': function(b){ _lrSaveRoute(b.dataset.espId, b.dataset.sede); },
  'lr-preview-route': function(b){ _lrPreviewRoute(b.dataset.espId, b.dataset.sede); },
  'restore-default-routes': function(){ restoreDefaultRoutes(function(){ renderEditor(); }); },
  'restore-lr-backup': function(){ restoreLearningRoutesBackup(function(){ renderEditor(); }); },
  'download-lr-excel': function(){ exportLearningRoutesExcel(); },
  'backup-db': function(){ backupDB(); },
  'restore-db': function(){ document.getElementById('restore-input').click(); },
  'manage-sedes': function(){ openSedesManager(); },
  'download-admin-html': function(){ downloadAdminHTML(); },
  'toggle-tools-menu': function(){
    var m=document.getElementById('tools-menu');
    if(m) m.classList.toggle('show');
  },
};
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-action]');
  if(!b) return;
  var fn = __ACTIONS[b.getAttribute('data-action')];
  if(fn) fn(b);
});
document.addEventListener('click', function(e){
  var menu=document.getElementById('tools-menu');
  if(!menu||!menu.classList.contains('show')) return;
  if(!e.target.closest('.tools-toggle')) menu.classList.remove('show');
});
var __CHANGE = {
  'apply-filters': function(){ applyFilters(); },
  'lr-update-sem-credits': function(b){
    var sem = b.closest('.lr-semester');
    if(!sem) return;
    var total = 0;
    sem.querySelectorAll('.lr-subj-credits').forEach(function(i){ total += parseInt(i.value)||0; });
    var display = sem.querySelector('.lr-sem-credits-display');
    if(display) display.textContent = total;
    _lrRecalcCredits();
  },
  'lr-touch-homologa': function(b){
    var subject = b.closest('.lr-subject');
    if(!subject) return;
    var inp = subject.querySelector('.lr-subj-homo');
    if(!inp) return;
    inp.disabled = !b.checked;
  },
  'prog-linea-tipo': function(b){
    var lid = b.id.slice(2);
    var box = document.getElementById('llbox'+lid);
    var inp = document.getElementById('ll'+lid);
    var mbox = document.getElementById('lmbox'+lid);
    var minp = document.getElementById('lm'+lid);
    if(!box || !inp || !mbox || !minp) return;
    var hide = (b.value === TIPO_SIN_LINEA);
    box.style.display = hide ? 'none' : '';
    inp.disabled = hide;
    mbox.style.display = hide ? '' : 'none';
    minp.disabled = !hide;
  },
};
document.addEventListener('change', function(e){
  var b = e.target.closest('[data-action]');
  if(!b) return;
  var fn = __CHANGE[b.getAttribute('data-action')];
  if(fn) fn(b);
});
