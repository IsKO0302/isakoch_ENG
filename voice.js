/* Inkwell Voice — нейронная озвучка (Microsoft Edge: Ava, Andrew) с подсветкой слов.
 * Самостоятельный модуль, от app.js не зависит.
 *
 *   InkVoice.has(text)                          — есть ли клип (false, пока индекс не загружен)
 *   InkVoice.play(text, {rate, onWord, onEnd, onFail}) — true, если клип найден и запускается
 *        rate   — скорость 0.6…1.2 (тон сохраняется)
 *        onWord(i) — i = номер слова среди совпадений /[A-Za-z][A-Za-z'’]*\/g в этом тексте
 *        onEnd()   — дослушали или остановили
 *        onFail()  — не удалось загрузить (тогда можно включить запасной голос)
 *   InkVoice.stop()
 *   InkVoice.prefetch(text)  — заранее скачать клип (например, когда карточка появилась на экране)
 *   InkVoice.ready()         — Promise, который выполнится после загрузки индекса
 *
 * Данные: audio/index.json + пачки audio/pNN.mp3 (их собирает tools/make_audio.py).
 * Клип скачивается кусочком через HTTP Range, поэтому пачки можно держать крупными.
 */
(function () {
  'use strict';
  var BASE = 'audio/';
  var IDX = null, loading = null;
  var audio = null, seq = 0, raf = 0, curOpts = null;
  var urls = {}, order = [], inflight = {};
  var SILENT = 'data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

  function key(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
  function cyrb53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57, ch;
    for (var i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function clipFor(text) {
    if (!IDX) return null;
    var k = key(text), h = cyrb53(k), c = IDX.clips[h];
    if (!c && k && k.indexOf(' ') < 0) {
      // отдельное слово: регистр не важен (I / i, Allah / allah)
      var alts = [k.toLowerCase(), k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()];
      for (var i = 0; i < alts.length && !c; i++) { h = cyrb53(alts[i]); c = IDX.clips[h]; }
    }
    return c ? { h: h, c: c } : null;
  }

  function load() {
    if (loading) return loading;
    loading = fetch(BASE + 'index.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('no index'); return r.json(); })
      .then(function (j) { IDX = j && j.clips ? j : { packs: [], clips: {} }; return IDX; })
      .catch(function () { IDX = { packs: [], clips: {} }; return IDX; });
    return loading;
  }

  function getAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      try { audio.preservesPitch = true; audio.mozPreservesPitch = true; audio.webkitPreservesPitch = true; } catch (e) {}
    }
    return audio;
  }
  // iOS/WebView: звук разрешается только после касания — «разблокируем» элемент при первом касании
  var unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      var a = getAudio();
      if (!a.src || a.src.indexOf('data:') === 0) {
        a.src = SILENT;
        var p = a.play();
        if (p && p.then) p.then(function () { a.pause(); }).catch(function () {});
      }
    } catch (e) {}
  }
  ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, unlock, { capture: true, passive: true, once: true });
  });

  function remember(h, url) {
    urls[h] = url;
    order.push(h);
    while (order.length > 40) {
      var old = order.shift();
      if (urls[old] && old !== (curOpts && curOpts.h)) { try { URL.revokeObjectURL(urls[old]); } catch (e) {} delete urls[old]; }
    }
  }
  function fetchClip(h, c) {
    if (urls[h]) return Promise.resolve(urls[h]);
    if (inflight[h]) return inflight[h];
    var file = BASE + IDX.packs[c[0]], from = c[1], len = c[2];
    var p = fetch(file, { headers: { Range: 'bytes=' + from + '-' + (from + len - 1) } })
      .then(function (r) {
        if (r.status === 206) return r.arrayBuffer();
        if (r.ok) return r.arrayBuffer().then(function (b) { return b.slice(from, from + len); });
        throw new Error('HTTP ' + r.status);
      })
      .then(function (buf) {
        var url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
        remember(h, url);
        delete inflight[h];
        return url;
      }, function (e) { delete inflight[h]; throw e; });
    inflight[h] = p;
    return p;
  }

  function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function finish(fail) {
    var o = curOpts;
    curOpts = null;
    stopLoop();
    if (!o) return;
    try { if (fail && o.onFail) o.onFail(); else if (o.onEnd) o.onEnd(); } catch (e) {}
  }

  function stop() {
    seq++;
    if (audio) { try { audio.pause(); } catch (e) {} }
    finish(false);
  }

  function play(text, opts) {
    opts = opts || {};
    var f = clipFor(text);
    if (!f) { if (!IDX) load(); return false; }
    stop();
    var my = ++seq;
    var c = f.c, starts = c[4] || [];
    curOpts = { h: f.h, onWord: opts.onWord, onEnd: opts.onEnd, onFail: opts.onFail };
    var a = getAudio();
    var rate = Math.max(0.5, Math.min(1.5, +opts.rate || 1));
    var start = function (url) {
      if (my !== seq) return;
      a.src = url;
      try { a.playbackRate = rate; a.defaultPlaybackRate = rate; } catch (e) {}
      var last = -1;
      a.onended = function () { if (my === seq) finish(false); };
      a.onerror = function () { if (my === seq) finish(true); };
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { if (my === seq) finish(true); });
      if (curOpts && curOpts.onWord && starts.length) {
        var tick = function () {
          if (my !== seq) return;
          var t = a.currentTime * 1000, i = last;
          while (i + 1 < starts.length && starts[i + 1] <= t + 40) i++;
          if (i !== last && i >= 0) { last = i; try { curOpts.onWord(i); } catch (e) {} }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    };
    if (urls[f.h]) start(urls[f.h]);
    else fetchClip(f.h, c).then(start, function () { if (my === seq) finish(true); });
    return true;
  }

  function prefetch(text) {
    var f = clipFor(text);
    if (f) fetchClip(f.h, f.c).catch(function () {});
  }

  window.InkVoice = {
    has: function (text) { return !!clipFor(text); },
    play: play,
    stop: stop,
    prefetch: prefetch,
    ready: load,
    playing: function () { return !!curOpts; },
    count: function () { return IDX ? Object.keys(IDX.clips).length : 0; },
    hash: function (text) { return cyrb53(key(text)); }
  };
  // индекс грузим, когда страница уже показалась
  if (document.readyState === 'complete') setTimeout(load, 300);
  else window.addEventListener('load', function () { setTimeout(load, 300); });
})();
