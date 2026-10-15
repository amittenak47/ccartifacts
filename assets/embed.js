/* Lets a page sit inside the one-page index (index.html) as an iframe.
   Standalone, this does nothing. Embedded, it hides the page's own navigation,
   drops the outer padding, and keeps telling the index how tall the page is
   and where its sections start, so the frame never needs its own scrollbar. */
(function () {
  if (window.parent === window) return;
  var root = document.documentElement;
  root.classList.add('embedded');

  var style = document.createElement('style');
  style.textContent =
    'html.embedded,html.embedded body{overflow:hidden}' +
    'html.embedded body{margin:0;padding:0;display:flow-root;background:transparent}' +
    'html.embedded .crumb,html.embedded nav.toc,html.embedded header.top{display:none}';
  document.head.appendChild(style);

  var last = '';
  function report() {
    if (!document.body) return;
    var anchors = {};
    document.querySelectorAll('section[id]').forEach(function (s) {
      anchors[s.id] = Math.round(s.getBoundingClientRect().top + window.scrollY);
    });
    var msg = { ccartifacts: 'size', h: Math.ceil(document.body.getBoundingClientRect().height), anchors: anchors };
    var key = JSON.stringify(msg);
    if (key === last) return;
    last = key;
    window.parent.postMessage(msg, '*');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Links to other sites open in a new tab instead of inside the frame.
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      a.target = '_blank';
      a.rel = 'noopener';
    });
    new ResizeObserver(report).observe(document.body);
    report();
  });
  window.addEventListener('load', report);
  if (document.fonts) document.fonts.ready.then(report);
})();
