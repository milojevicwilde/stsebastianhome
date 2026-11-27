/* English / Serbian switch.
   The page opens in English with a small Serbian flag in the header.
   Clicking it fades every text into Serbian (Cyrillic) and the flag
   becomes the American one; clicking again goes back. */
(function(){
  var root = document.documentElement;
  var btn  = document.querySelector('.lang-btn');
  if(!btn) return;

  var TITLE = {
    en: 'St. Sebastian Home — Jackson, California',
    sr: 'Дом Светог Севастијана — Џексон, Калифорнија'
  };
  var BTN_LABEL = { en: 'Српски', sr: 'English' };   // names the language you switch TO

  function set(lang){
    root.classList.toggle('lang-sr', lang === 'sr');
    root.classList.toggle('lang-en', lang !== 'sr');
    root.setAttribute('lang', lang === 'sr' ? 'sr-Cyrl' : 'en');
    document.title = TITLE[lang];
    btn.setAttribute('aria-label', BTN_LABEL[lang]);
    // hide the faded-out language from screen readers
    var all = document.querySelectorAll('.bi > [data-l]');
    for(var i = 0; i < all.length; i++){
      all[i].setAttribute('aria-hidden', all[i].getAttribute('data-l') === lang ? 'false' : 'true');
    }
  }

  btn.addEventListener('click', function(){
    set(root.classList.contains('lang-sr') ? 'en' : 'sr');
  });

  // link straight to Serbian with ?lang=sr
  set(/[?&]lang=sr\b/.test(location.search) ? 'sr' : 'en');
})();
