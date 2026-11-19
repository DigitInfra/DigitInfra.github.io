(function(){
  function getLang(){
    var p = new URLSearchParams(window.location.search);
    var l = p.get('lang');
    return (l === 'en') ? 'en' : 'fr';
  }

  function applyLang(lang){
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    var btnFr = document.querySelector('[data-lang-btn="fr"]');
    var btnEn = document.querySelector('[data-lang-btn="en"]');
    if(btnFr && btnEn){
      btnFr.classList.toggle('active', lang === 'fr');
      btnEn.classList.toggle('active', lang === 'en');
    }
    // <option> elements ignore nested HTML — swap text content directly
    document.querySelectorAll('option[data-fr-text]').forEach(function(o){
      o.textContent = (lang === 'en') ? o.getAttribute('data-en-text') : o.getAttribute('data-fr-text');
    });

    // carry the chosen language across every internal link on the site
    document.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href');
      if(!href || href.indexOf('http') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('#') === 0) return;
      var parts = href.split('#');
      var base = parts[0].split('?')[0];
      var hash = parts[1] ? '#' + parts[1] : '';
      a.setAttribute('href', base + '?lang=' + lang + hash);
    });
  }

  function setLang(lang){
    var url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    applyLang(lang);
  }

  document.addEventListener('DOMContentLoaded', function(){
    applyLang(getLang());

    var btnFr = document.querySelector('[data-lang-btn="fr"]');
    var btnEn = document.querySelector('[data-lang-btn="en"]');
    if(btnFr) btnFr.addEventListener('click', function(){ setLang('fr'); });
    if(btnEn) btnEn.addEventListener('click', function(){ setLang('en'); });

    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('nav.links');
    if(menuBtn && nav){
      menuBtn.addEventListener('click', function(){
        nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
      });
      nav.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){ nav.classList.remove('open'); });
      });
    }

    var here = window.location.pathname.split('/').pop() || 'index.html';
    if(/^ginco-.+\.html$/.test(here)) here = 'ginco.html';
    document.querySelectorAll('nav.links a').forEach(function(a){
      var target = a.getAttribute('href').split('?')[0].split('#')[0];
      if(target === here) a.classList.add('active');
    });
  });
})();
