/* Inkwell Voice — нейронная озвучка (Dan — ElevenLabs; Algieba — Google Gemini; Ava, Andrew — Microsoft) с подсветкой слов.
 * Самостоятельный модуль, от app.js не зависит.
 *
 *   InkVoice.has(text)                          — есть ли клип (false, пока индекс не загружен)
 *   InkVoice.play(text, {rate, onStart, onWord, onEnd, onFail}) — true, если озвучка запущена (или ждёт индекс)
 *        rate    — скорость 0.6…1.2 (тон сохраняется)
 *        onStart() — звук реально пошёл (до этого клип скачивается)
 *        onWord(i) — i = номер слова среди совпадений /[A-Za-z][A-Za-z'’]*\/g в этом тексте
 *        onEnd()   — дослушали или остановили
 *        onFail()  — не удалось (тогда можно включить запасной голос)
 *   InkVoice.playWord(text, i, {rate, onEnd, onFail}) — только i-е слово из записи фразы text (тот же диктор)
 *   InkVoice.stop()
 *   InkVoice.prefetch(text)  — заранее скачать клип (например, когда карточка появилась на экране)
 *   InkVoice.ready()         — Promise, который выполнится после загрузки индекса
 *
 * Данные: audio/index.json + пачки audio/pNN.mp3 (их собирает tools/make_audio.py).
 * Клип скачивается кусочком через HTTP Range, поэтому пачки можно держать крупными.
 *
 * Надёжность (почему звук «не всегда» включался): у скачивания есть предел времени и повтор; если звук не пошёл
 * за 6 с — клип скачивается заново; если систему поставила звук на паузу — озвучка честно завершается (кнопка
 * не «залипает»); пока индекс грузится — ждём его, а не отдаём фразу молчащему голосу устройства.
 */
(function () {
  'use strict';
  var BASE = 'audio/';
  var FETCH_TIMEOUT = 8000, START_TIMEOUT = 6000, INDEX_WAIT = 9000;
  var IDX = null, loading = null;
  var audio = null, seq = 0, raf = 0, curOpts = null, stopping = false;
  var urls = {}, order = [], inflight = {};
  var SILENT = 'data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

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
    var attempt = function () {
      return fetch(BASE + 'index.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('no index'); return r.json(); });
    };
    loading = attempt()
      .catch(function () { return new Promise(function (ok) { setTimeout(ok, 1500); }).then(attempt); })  // второй шанс
      .then(function (j) { IDX = j && j.clips ? j : { packs: [], clips: {} }; return IDX; })
      .catch(function () { loading = null; IDX = null; return { packs: [], clips: {} }; });  // позже попробуем снова
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
        // ставим на паузу только «тишину»: если к этому моменту уже пошла настоящая фраза — её не трогаем
        if (p && p.then) p.then(function () { if (a.src.indexOf('data:') === 0) a.pause(); }).catch(function () {});
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
  function fetchRange(file, from, len) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, FETCH_TIMEOUT) : 0;
    var opts = { headers: { Range: 'bytes=' + from + '-' + (from + len - 1) } };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(file, opts)
      .then(function (r) {
        if (r.status === 206) return r.arrayBuffer();
        if (r.ok) return r.arrayBuffer().then(function (b) { return b.byteLength > len ? b.slice(from, from + len) : b; });
        throw new Error('HTTP ' + r.status);
      })
      .then(function (buf) {
        clearTimeout(timer);
        if (!buf || buf.byteLength < 100) throw new Error('empty clip');
        return buf;
      }, function (e) { clearTimeout(timer); throw e; });
  }
  function fetchClip(h, c, fresh) {
    if (fresh && urls[h]) { try { URL.revokeObjectURL(urls[h]); } catch (e) {} delete urls[h]; }
    if (urls[h]) return Promise.resolve(urls[h]);
    if (inflight[h]) return inflight[h];
    var file = BASE + IDX.packs[c[0]], from = c[1], len = c[2];
    var p = fetchRange(file, from, len)
      .catch(function () { return fetchRange(file, from, len); })  // сеть моргнула — ещё раз
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
    if (o.timer) clearTimeout(o.timer);
    try { if (fail && o.onFail) o.onFail(); else if (o.onEnd) o.onEnd(); } catch (e) {}
  }

  function stop() {
    seq++;
    if (audio) { stopping = true; try { audio.pause(); } catch (e) {} stopping = false; }
    finish(false);
  }

  function play(text, opts) {
    opts = opts || {};
    if (!IDX) {
      // индекс ещё грузится (первые секунды после открытия или медленный интернет) — ждём его
      stop();
      var w = ++seq;
      curOpts = { h: null, onEnd: opts.onEnd, onFail: opts.onFail };
      curOpts.timer = setTimeout(function () { if (w === seq) finish(true); }, INDEX_WAIT);
      load().then(function () {
        if (w !== seq) return;
        if (curOpts && curOpts.timer) clearTimeout(curOpts.timer);
        curOpts = null;
        if (!IDX || !play(text, opts)) { try { if (opts.onFail) opts.onFail(); } catch (e) {} }
      });
      return true;
    }
    var f = clipFor(text);
    if (!f) return false;
    stop();
    var my = ++seq;
    var c = f.c, starts = c[4] || [];
    curOpts = { h: f.h, onWord: opts.onWord, onEnd: opts.onEnd, onFail: opts.onFail };
    var a = getAudio();
    var rate = Math.max(0.5, Math.min(1.5, +opts.rate || 1));
    var started = false, retried = false, startTimer = 0;

    function retryOrFail() {
      if (my !== seq) return;
      clearTimeout(startTimer);
      if (!retried && !started) {
        // второй и последний шанс: скачать клип заново (вдруг кусок пришёл битым) и запустить ещё раз
        retried = true;
        fetchClip(f.h, c, true).then(begin, function () { if (my === seq) finish(true); });
        return;
      }
      finish(true);
    }
    function begin(url) {
      if (my !== seq) return;
      a.onplaying = a.onended = a.onerror = a.onpause = null;
      a.src = url;
      try { a.playbackRate = rate; a.defaultPlaybackRate = rate; } catch (e) {}
      var last = -1;
      a.onplaying = function () {
        if (my !== seq || started) return;
        started = true;
        clearTimeout(startTimer);
        try { if (opts.onStart) opts.onStart(); } catch (e) {}
      };
      a.onended = function () { if (my === seq) finish(false); };
      a.onerror = function () { if (my === seq) retryOrFail(); };
      // пауза не от нас (система, звонок, другое приложение) — завершаем честно, чтобы кнопка не «залипала»
      a.onpause = function () { if (my === seq && !stopping && started) finish(false); };
      var pr;
      try { pr = a.play(); } catch (e) { retryOrFail(); return; }
      if (pr && pr.catch) pr.catch(function (e) {
        if (my !== seq) return;
        if (e && e.name === 'AbortError') return;  // прервано новой загрузкой — это не ошибка
        retryOrFail();
      });
      clearTimeout(startTimer);
      startTimer = setTimeout(function () { if (my === seq && !started) retryOrFail(); }, START_TIMEOUT);
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
    }
    if (urls[f.h]) begin(urls[f.h]);
    else fetchClip(f.h, c).then(begin, function () { if (my === seq) finish(true); });
    return true;
  }

  // Одно слово из фразы: кусочек клипа фразы от начала i-го слова до начала следующего — тем же диктором.
  // Так звучит любое слово, на которое нажали, даже если отдельной записи у него нет.
  function playWord(text, i, opts) {
    opts = opts || {};
    if (!IDX) return false;
    var f = clipFor(text);
    if (!f) return false;
    var st = f.c[4] || [];
    if (!(i >= 0 && i < st.length)) return false;
    stop();
    var my = ++seq;
    curOpts = { h: f.h, onEnd: opts.onEnd, onFail: opts.onFail };
    var a = getAudio();
    var rate = Math.max(0.5, Math.min(1.5, +opts.rate || 1));
    var from = Math.max(0, st[i] - 60) / 1000;
    var to = (i + 1 < st.length ? st[i + 1] - 10 : (f.c[3] || st[i] + 900)) / 1000;
    if (to - from < 0.2) to = from + 0.45;
    if (to - from > 2.5) to = from + 2.5;  // последнее слово фразы — без длинной тишины после него
    var go = function () {
      if (my !== seq) return;
      a.onloadedmetadata = null;
      try { a.currentTime = from; } catch (e) {}
      try { a.playbackRate = rate; a.defaultPlaybackRate = rate; } catch (e) {}
      a.onended = function () { if (my === seq) finish(false); };
      var pr;
      try { pr = a.play(); } catch (e) { finish(true); return; }
      if (pr && pr.catch) pr.catch(function (e) { if (my === seq && !(e && e.name === 'AbortError')) finish(true); });
      curOpts.timer = setTimeout(function () {
        if (my !== seq) return;
        stopping = true; try { a.pause(); } catch (e) {} stopping = false;
        finish(false);
      }, (to - from) / rate * 1000 + 80);
    };
    var begin = function (url) {
      if (my !== seq) return;
      a.onplaying = a.onended = a.onerror = a.onpause = null;
      a.onerror = function () { if (my === seq) finish(true); };
      a.src = url;
      if (a.readyState >= 1) go(); else a.onloadedmetadata = go;
    };
    if (urls[f.h]) begin(urls[f.h]);
    else fetchClip(f.h, f.c).then(begin, function () { if (my === seq) finish(true); });
    return true;
  }

  function prefetch(text) {
    var f = clipFor(text);
    if (f) fetchClip(f.h, f.c).catch(function () {});
  }

  window.InkVoice = {
    has: function (text) { return !!clipFor(text); },
    play: play,
    playWord: playWord,
    stop: stop,
    prefetch: prefetch,
    ready: load,
    playing: function () { return !!curOpts; },
    count: function () { return IDX ? Object.keys(IDX.clips).length : 0; },
    hash: function (text) { return cyrb53(key(text)); },
    voice: function (text) { var f = clipFor(text); return (f && f.c[5]) || ''; },  // 'dan' | 'g:Имя' | 'f:Имя'
    tags: function () {  // {метка голоса: сколько клипов}
      var t = {};
      if (IDX) for (var h in IDX.clips) { var v = IDX.clips[h][5]; if (v) t[v] = (t[v] || 0) + 1; }
      return t;
    }
  };
  // индекс начинаем грузить сразу — чтобы к первому нажатию 🔊 он уже был
  load();
})();
