(function () {
  'use strict';

  /* ---------- 메뉴 막대 시계 ---------- */
  var clock = document.querySelector('[data-clock]');
  if (clock && window.Intl) {
    var fmtFull = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' });
    var tick = function () {
      var now = new Date();
      clock.textContent = fmtFull.format(now);
      clock.setAttribute('datetime', now.toISOString());
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- 코드 블록: 터미널 창 제목 막대 + 복사 버튼 ---------- */
  document.querySelectorAll('.prose div.highlighter-rouge').forEach(function (block) {
    var m = block.className.match(/language-([\w+-]+)/);
    var lang = m && m[1] !== 'plaintext' ? m[1] : '';
    var bar = document.createElement('div');
    bar.className = 'code-bar';
    bar.innerHTML = '<span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="code-lang"></span>';
    bar.querySelector('.code-lang').textContent = lang || 'terminal';
    if (navigator.clipboard) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '복사';
      btn.addEventListener('click', function () {
        var code = block.querySelector('pre code') || block.querySelector('pre');
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.textContent = '복사됨';
          setTimeout(function () { btn.textContent = '복사'; }, 1500);
        });
      });
      bar.appendChild(btn);
    }
    block.insertBefore(bar, block.firstChild);
  });

  /* ---------- 스크롤: 읽기 진행률 + 맨 위로 ---------- */
  var bar = document.querySelector('.reading-progress span');
  var dock = document.querySelector('.dock');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';

    // Dock: 내릴 때 숨김, 올릴 때·맨 위·맨 아래에서 표시
    if (dock) {
      var dy = y - lastY;
      var atEdge = y < 80 || y >= max - 40;
      if (atEdge || dy < -4 || dock.contains(document.activeElement)) dock.classList.remove('is-hidden');
      else if (dy > 4) dock.classList.add('is-hidden');
      if (Math.abs(dy) > 4 || atEdge) lastY = y;
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  document.querySelectorAll('[data-to-top]').forEach(function (b) {
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  /* ---------- 검색 ---------- */
  var modal = document.getElementById('search');
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var posts = null;
  var active = -1;
  var lastFocus = null;

  function load() {
    if (posts) return Promise.resolve(posts);
    return fetch('/assets/search.json').then(function (r) { return r.json(); }).then(function (d) { posts = d; return d; });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function mark(text, q) {
    var t = esc(text);
    if (!q) return t;
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return t.replace(re, '<mark>$1</mark>');
  }
  function render(q) {
    q = q.trim();
    active = -1;
    if (!q) { list.innerHTML = ''; return; }
    var lq = q.toLowerCase();
    var hits = posts.filter(function (p) {
      return (p.title + ' ' + p.tags + ' ' + p.category + ' ' + p.excerpt).toLowerCase().indexOf(lq) !== -1;
    }).slice(0, 10);
    if (!hits.length) { list.innerHTML = '<li class="search-empty">검색 결과가 없습니다</li>'; return; }
    list.innerHTML = hits.map(function (p) {
      return '<li><a href="' + esc(p.url) + '"><strong>' + mark(p.title, q) + '</strong><span>' +
        esc(p.date) + (p.tags ? ' · ' + mark(p.tags, q) : '') + '</span></a></li>';
    }).join('');
  }
  function setActive(i) {
    var items = list.querySelectorAll('a');
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach(function (a, k) { a.classList.toggle('active', k === active); });
    items[active].scrollIntoView({ block: 'nearest' });
  }
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    input.focus();
    load().then(function () { render(input.value); });
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  if (modal) {
    document.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', open); });
    modal.querySelectorAll('[data-search-close]').forEach(function (b) { b.addEventListener('click', close); });
    input.addEventListener('input', function () { if (posts) render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); list.querySelectorAll('a')[active].click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) { close(); return; }
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if (!typing && modal.hidden && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        open();
      }
    });
  }
})();
