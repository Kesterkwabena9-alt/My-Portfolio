
const app=document.getElementById('app'),palette=document.getElementById('palette'),mode=document.getElementById('mode'),menu=document.getElementById('menu'),mobile=document.getElementById('mobile-nav');
let currentPalette='ocean',currentMode='dark';
try{
    const saved=JSON.parse(localStorage.getItem('khobbytech-theme'));if(saved&&['dark','light'].includes(saved.mode)){currentMode=saved.mode}}catch(e){}

function applyTheme(){
    const target=document.body;
    if (app) {
        app.dataset.palette=currentPalette;
        app.dataset.mode=currentMode;
    }
    target.dataset.mode=currentMode;
    target.dataset.palette=currentPalette;
    document.documentElement.style.colorScheme=currentMode;
    if (palette) palette.value=currentPalette;
    if (mode) {
        mode.setAttribute('aria-pressed',String(currentMode==='light'));
        mode.setAttribute('aria-label',currentMode==='light'?'Switch to dark mode':'Switch to light mode');
    }
    const sun=document.getElementById('sun');
    const moon=document.getElementById('moon');
    if (sun) sun.hidden=currentMode==='light';
    if (moon) moon.hidden=currentMode!=='light';
    try{localStorage.setItem('khobbytech-theme',JSON.stringify({mode:currentMode,palette:currentPalette}))}catch(e){}
}
if (palette) {
    palette.addEventListener('change',()=>{currentPalette=palette.value;if(currentPalette==='light')currentMode='light';applyTheme()});
}
if (mode) mode.addEventListener('click',()=>{currentMode=currentMode==='dark'?'light':'dark';applyTheme()});
applyTheme();
if (menu && mobile) {
    function setMenu(open){mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')}
    menu.addEventListener('click',()=>setMenu(mobile.hidden));
    mobile.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobile.hidden){setMenu(false);menu.focus()}});
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window){
    const reveals=document.querySelectorAll('.reveal');
    if(!reduced.matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target)}})},{threshold:.08});reveals.forEach(el=>{el.classList.add('pending');observer.observe(el)});reduced.addEventListener('change',()=>{if(reduced.matches){reveals.forEach(el=>el.classList.remove('pending'));observer.disconnect()}})}
    const links=document.querySelectorAll('[data-section]');
    const activeObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(link=>{const active=link.dataset.section===entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}})},{rootMargin:'-15% 0px -55% 0px',threshold:0});
    document.querySelectorAll('main section[id]').forEach(section=>activeObserver.observe(section));
}
if(window.lucide)lucide.createIcons();
