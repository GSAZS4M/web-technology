import { sliderData } from './sliderData.js';

const STORAGE_KEY = 'fhoto_works_v1';

function $(selector){return document.querySelector(selector)}

let works = []; // {id,name,images:[{id,dataUrl,category}]} 
let currentWorkId = null;

function loadWorks(){
  const raw = localStorage.getItem(STORAGE_KEY);
  works = raw ? JSON.parse(raw) : [];
}

function saveWorks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}

function uid(prefix='id'){return prefix+'_'+Math.random().toString(36).slice(2,9)}

function renderWorksList(){
  const ul = $('#works-ul');
  ul.innerHTML = '';
  works.forEach(w=>{
    const li = document.createElement('li');
    li.className = 'work-item';
    li.dataset.id = w.id;
    li.innerHTML = `<button class="work-select">${escapeHtml(w.name)}</button>`;
    const selBtn = li.querySelector('.work-select');
    selBtn.addEventListener('click', ()=>selectWork(w.id));
    ul.appendChild(li);
  });
}

function escapeHtml(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

function selectWork(id){
  currentWorkId = id;
  const w = works.find(x=>x.id===id);
  if(!w) return;
  $('#no-selection').style.display='none';
  $('#work-panel').classList.remove('hidden');
  $('#work-title').textContent = w.name;
  renderImages(w);
}

function renderImages(work){
  const grid = $('#image-grid');
  grid.innerHTML = '';
  if(!work.images || work.images.length===0){
    grid.innerHTML = '<p class="muted">No images added yet</p>';
    return;
  }
  work.images.forEach(img=>{
    const card = document.createElement('div');
    card.className = 'image-card';
    // If the image has a url (link to feature page), make the thumbnail clickable
    const thumbHtml = img.url ? `<a class="thumb-link" href="${img.url}"><div class="thumb"><img src="${img.dataUrl}" alt="img"/></div></a>` : `<div class="thumb"><img src="${img.dataUrl}" alt="img"/></div>`;
    card.innerHTML = `
      ${thumbHtml}
      <div class="meta"><span class="cat">${escapeHtml(img.category||'Uncategorized')}</span>
      <button class="del-img">Delete</button></div>
    `;
    card.querySelector('.del-img').addEventListener('click', ()=>{
      if(!confirm('Delete this image?')) return;
      work.images = work.images.filter(i=>i.id!==img.id);
      saveWorks();
      renderImages(work);
    });
    grid.appendChild(card);
  });
}

// import existing slider images as a Work so users can access the gallery from Work UI
function importGalleryAsWork(){
  if(!Array.isArray(sliderData) || sliderData.length===0) return;
  const exists = works.some(w => w.name === 'Imported Gallery');
  if(exists) return;

  const imgs = sliderData.map(item => ({
    id: uid('img'),
    dataUrl: item.img,
    category: 'Imported',
    // append image path as query param so feature page can show the specific image
    url: (item.url || '') + (item.url && item.img ? `?img=${encodeURIComponent(item.img)}` : '')
  }));
  const gallery = { id: uid('work'), name: 'Imported Gallery', images: imgs };
  works.unshift(gallery);
  saveWorks();
  return gallery.id;
}

function init(){
  loadWorks();
  // Ensure gallery from sliderData is available as a Work
  const importedId = importGalleryAsWork();
  renderWorksList();
  // If we just imported the gallery, select it so images appear immediately
  if(importedId){
    selectWork(importedId);
  }

  $('#create-work-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#work-name').value.trim();
    if(!name) return;
    const w = {id:uid('work'), name, images:[]};
    works.push(w);
    saveWorks();
    renderWorksList();
    $('#work-name').value='';
    selectWork(w.id);
  });

  $('#add-image').addEventListener('click', (e)=>{
    e.preventDefault();
    const fileInput = $('#image-file');
    const file = fileInput.files && fileInput.files[0];
  if(!currentWorkId){alert('Please select a Work first');return}
  if(!file){alert('Please select an image file');return}
    const category = $('#image-category').value.trim();
    const reader = new FileReader();
    reader.onload = function(ev){
      const dataUrl = ev.target.result;
      const w = works.find(x=>x.id===currentWorkId);
      if(!w) return;
      const img = {id:uid('img'), dataUrl, category};
      w.images.push(img);
      saveWorks();
      renderImages(w);
      fileInput.value='';
      $('#image-category').value='';
    }
    reader.readAsDataURL(file);
  });

  $('#delete-work').addEventListener('click', ()=>{
    if(!currentWorkId) return;
  if(!confirm('Delete the current Work and all its images?')) return;
    works = works.filter(w=>w.id!==currentWorkId);
    saveWorks();
    currentWorkId = null;
    renderWorksList();
    $('#no-selection').style.display='block';
    $('#work-panel').classList.add('hidden');
  });
}

// expose for debugging
window.fhoto = {init, loadWorks, saveWorks}

document.addEventListener('DOMContentLoaded', init);
