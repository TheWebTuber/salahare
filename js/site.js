(()=>{'use strict';
 const toggle=document.querySelector('.nav-toggle');const nav=document.getElementById('primary-nav');
 if(toggle&&nav){const close=()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation')};toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))close()});}
 const entries=[
  {head:'LOG 001 · LOST AND FOUND',body:'Kirni crash-landed somewhere in the magical forest. Engines offline, curiosity fully operational.'},
  {head:'LOG 002 · SONAR CONTACT',body:'A curious narwhal-shaped shadow passed beneath the ship. Is it a creature… or another very creative machine?'},
  {head:'LOG 003 · COORDINATES UNKNOWN',body:'Stars above, sea below. The next destination remains unwritten, and that might be the best part.'},
  {head:'LOG 004 · CREW STATUS',body:'Drawing supplies accounted for. Mech sketches secured. A new adventure with friends is always possible.'}
 ];
 const btn=document.getElementById('mission-btn');const log=document.getElementById('mission-log');let current=0;
 if(btn&&log)btn.addEventListener('click',()=>{const item=entries[current++%entries.length];log.hidden=false;log.replaceChildren();const tag=document.createElement('strong');tag.textContent=item.head;const p=document.createElement('p');p.textContent=item.body;log.append(tag,p);btn.innerHTML='Read the next entry <span aria-hidden="true">✧</span>';});
})();
