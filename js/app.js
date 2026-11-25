/* World Zero · idioma y dibujo del progreso, sin librerias.
   Los datos viven en data/progreso.json. Las funciones view* devuelven HTML (texto), asi
   tools/prerender.js las usa para dejar el HTML en ingles ya escrito (sin JavaScript). */
(function (root) {
  'use strict';
  var LANGS = ['en', 'es', 'pt', 'fr', 'de'];
  var I18N = root.WZ_I18N || (typeof require !== 'undefined' ? require('./i18n.js') : {});
  var SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  var YT = 'https://www.youtube.com/shorts/';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(lang, key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (vars) for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function pick(obj, lang) { return obj ? (obj[lang] || obj.en || '') : ''; }
  function num(n) { return String(Math.round(n * 10) / 10).replace(/\.0$/, ''); }
  function person(data, id) {
    for (var i = 0; i < data.people.length; i++) if (data.people[i].id === id) return data.people[i];
    return null;
  }
  function img(src, alt, w, h, lazy) {
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="' + w + '" height="' + h + '"' +
      (lazy === false ? '' : ' loading="lazy" decoding="async"') + '>';
  }

  /* ---------- vistas ---------- */
  function lastDay(data) { return data.days[data.days.length - 1]; }

  function viewCounters(data, lang) {
    var d = lastDay(data), tt = d.totals;
    var found = 0;
    data.milestones.forEach(function (m) { if (m.reached_day != null) found++; });
    var items = [
      ['c_year', d.year], ['c_alive', tt.alive], ['c_births', tt.births],
      ['c_deaths', tt.deaths], ['c_arrived', tt.arrivals], ['c_found', found]
    ];
    var h = '<ul class="counters">';
    items.forEach(function (it) {
      h += '<li><span class="num">' + esc(it[1]) + '</span><span class="lbl">' + esc(t(lang, it[0])) + '</span></li>';
    });
    return h + '</ul><p class="note">' + esc(t(lang, 'births_hint')) + '</p>';
  }

  function viewFood(data, lang) {
    var d = lastDay(data), max = 0;
    SEASONS.forEach(function (s) { if (d.seasons[s]) max = Math.max(max, d.seasons[s].food); });
    var h = '<ul class="bars">';
    SEASONS.forEach(function (s) {
      var x = d.seasons[s]; if (!x) return;
      var w = max ? Math.max(4, Math.round(x.food / max * 100)) : 0;
      h += '<li class="s-' + s + '"><span class="bl">' + esc(t(lang, 's_' + s)) + '</span>' +
        '<span class="bar"><span style="width:' + w + '%"></span></span>' +
        '<span class="bv">' + esc(x.food) + '</span></li>';
    });
    return h + '</ul>';
  }

  function viewMilestones(data, lang) {
    var h = '<ul class="miles">';
    data.milestones.forEach(function (m) {
      var ok = m.reached_day != null;
      h += '<li class="' + (ok ? 'yes' : 'no') + '"><span class="mark" aria-hidden="true">' + (ok ? '✓' : '○') + '</span>' +
        '<span class="mn">' + esc(pick(m.name, lang)) + '</span>' +
        '<span class="ms">' + esc(ok ? t(lang, 'ms_yes', { d: m.reached_day }) : t(lang, 'ms_no')) + '</span></li>';
    });
    return h + '</ul>';
  }

  function viewTimeline(data, lang) {
    var h = '';
    data.days.slice().reverse().forEach(function (d) {
      h += '<article class="day"><header><h3>' + esc(t(lang, 'day_head', { d: d.day, y: d.year })) +
        '<span class="dt">' + esc(pick(d.headline, lang)) + '</span></h3>' +
        '<a class="link" href="' + YT + esc(d.ytid) + '">' + esc(t(lang, 'watch_yt')) + '</a></header>';
      h += '<ol class="seasons">';
      SEASONS.forEach(function (s) {
        var x = d.seasons[s]; if (!x) return;
        h += '<li class="season s-' + s + '">' +
          (x.image ? img(x.image, t(lang, 'season_alt', { s: t(lang, 's_' + s), d: d.day, a: x.alive, f: x.food }), 360, 640) : '') +
          '<div class="sbody"><h4>' + esc(t(lang, 's_' + s)) + '</h4><ul>' +
          '<li>' + esc(t(lang, 'ss_alive', { n: x.alive })) + '</li>' +
          '<li>' + esc(t(lang, 'ss_food', { n: x.food })) + '</li>' +
          (x.gathered && x.gathered.times ? '<li>' + esc(t(lang, 'ss_gath', { t: x.gathered.times, p: num(x.gathered.portions) })) + '</li>' : '') +
          (x.hunted && x.hunted.times ? '<li>' + esc(t(lang, 'ss_hunt', { t: x.hunted.times })) + '</li>' : '') +
          (x.fished && x.fished.times ? '<li>' + esc(t(lang, 'ss_fish', { t: x.fished.times, p: num(x.fished.portions) })) + '</li>' : '') +
          '</ul></div></li>';
      });
      h += '</ol><h4 class="evh">' + esc(t(lang, 'ev_title')) + '</h4><ul class="events">';
      d.events.forEach(function (e) {
        h += '<li class="ev' + (e.image ? ' withimg' : '') + '">' +
          (e.image ? img(e.image, t(lang, 'event_alt', { d: d.day }), 360, 640) : '') +
          '<div><span class="chip s-' + esc(e.season) + '">' + esc(t(lang, 's_' + e.season)) + '</span>' +
          '<p>' + esc(pick(e.text, lang)) + '</p></div></li>';
      });
      h += '</ul></article>';
    });
    return h;
  }

  function viewPeople(data, lang) {
    var h = '<ul class="people">';
    data.people.forEach(function (p) {
      var couple = null;
      (data.couples || []).forEach(function (c) {
        if (c.people.indexOf(p.id) >= 0) {
          var other = person(data, c.people[0] === p.id ? c.people[1] : c.people[0]);
          couple = t(lang, 'p_couple', { name: other ? other.name : '', d: c.day });
        }
      });
      h += '<li class="person' + (p.portrait ? '' : ' noimg') + '">';
      if (p.portrait) {
        h += img(p.portrait, t(lang, 'p_alt', { name: p.name, n: p.age_start }), 330, 440);
      }
      h += '<div class="pbody"><h3>' + esc(p.name) + '</h3><p class="alive">' + esc(t(lang, 'p_alive')) + '</p>' +
        (p.portrait ? '<p class="small">' + esc(t(lang, 'p_age', { n: p.age_start })) + '</p>' : '<p class="small">' + esc(t(lang, 'p_arrived', { d: p.arrived_day })) + '</p>') +
        (couple ? '<p class="small couple">' + esc(couple) + '</p>' : '') +
        '</div></li>';
    });
    return h + '</ul>';
  }

  function viewEpisodes(data, lang) {
    var h = '<ul class="eps">';
    function card(ytid, title, thumb, badge) {
      return '<li class="ep"><a href="' + YT + esc(ytid) + '">' +
        img(thumb, t(lang, 'ep_thumb_alt', { t: title }), 480, 360) +
        '<span class="badge">' + esc(badge) + '</span>' +
        '<span class="et">' + esc(title) + '</span></a></li>';
    }
    data.days.slice().reverse().forEach(function (d) {
      h += card(d.ytid, pick(d.title, lang), d.thumb, t(lang, 'ep_day', { d: d.day }));
    });
    (data.specials || []).forEach(function (s) {
      h += card(s.ytid, pick(s.title, lang), s.thumb, t(lang, 'ep_intro'));
    });
    return h + '</ul>';
  }

  var views = {
    counters: viewCounters, food: viewFood, milestones: viewMilestones,
    timeline: viewTimeline, people: viewPeople, episodes: viewEpisodes
  };

  var api = { LANGS: LANGS, t: t, views: views };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WZ = api;
  if (typeof document === 'undefined') return;

  /* ---------- navegador ---------- */
  var data = null, lang = 'en';

  function detect() {
    var q = null, saved = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q && LANGS.indexOf(q) >= 0) return q;
    try { saved = localStorage.getItem('wz-lang'); } catch (e) {}
    if (saved && LANGS.indexOf(saved) >= 0) return saved;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i]).toLowerCase().split('-')[0];
      if (LANGS.indexOf(c) >= 0) return c;
    }
    return 'en';
  }

  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function paintStatic() {
    document.documentElement.lang = lang;
    document.title = t(lang, 'title');
    var md = document.getElementById('meta-desc');
    if (md) md.setAttribute('content', t(lang, 'meta_desc'));
    $all('[data-i18n]').forEach(function (el) { el.textContent = t(lang, el.getAttribute('data-i18n')); });
    $all('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(lang, el.getAttribute('data-i18n-alt'))); });
    $all('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(lang, el.getAttribute('data-i18n-aria'))); });
    $all('.langs a').forEach(function (a) {
      var on = a.getAttribute('lang') === lang;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function paintData() {
    if (!data) return;
    $all('[data-view]').forEach(function (el) {
      var v = views[el.getAttribute('data-view')];
      if (v) el.innerHTML = v(data, lang);
    });
  }

  function setLang(l, save) {
    lang = l;
    if (save) { try { localStorage.setItem('wz-lang', l); } catch (e) {} }
    paintStatic();
    paintData();
  }

  function start() {
    document.documentElement.className += ' js';
    $all('.langs a').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        setLang(a.getAttribute('lang'), true);
        try { history.replaceState(null, '', '?lang=' + a.getAttribute('lang')); } catch (e) {}
      });
    });
    lang = detect();
    paintStatic();
    var err = document.getElementById('load-error');
    if (typeof fetch === 'function') {
      fetch('data/progreso.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { data = j; paintData(); })
        .catch(function () { if (err) { err.hidden = false; err.textContent = t(lang, 'load_error'); } });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
