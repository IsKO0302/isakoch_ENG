/* Inkwell — английский через чтение. Telegram Mini App. */
(function () {
  'use strict';

  // =====================================================================
  // 0. Окружение
  // =====================================================================
  var D = window.APP_DATA;
  var tg = window.Telegram && window.Telegram.WebApp;
  var inTG = !!(tg && tg.initData);
  var BOT_LINK = 'https://t.me/Isakoch_bot';
  function ver(v) { return !!(inTG && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); }

  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
    try { if (ver('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  }

  // =====================================================================
  // 1. Утилиты
  // =====================================================================
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    if (html != null) el.innerHTML = html;
    return el;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(a) { var s = {}, out = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; out.push(x); } }); return out; }
  function dayNum(d) { d = d || new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function today() { return dayNum(); }
  var MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  function dayLabel(n) { var d = new Date(n * 86400000); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  function inDays(n) {
    if (n <= 0) return 'сегодня';
    if (n === 1) return 'завтра';
    return 'через ' + n + ' ' + plural(n, 'день', 'дня', 'дней');
  }
  function haptic(kind) {
    try {
      if (!ver('6.1')) return;
      var hf = tg.HapticFeedback;
      if (kind === 'success' || kind === 'error' || kind === 'warning') hf.notificationOccurred(kind);
      else if (kind === 'select') hf.selectionChanged();
      else hf.impactOccurred(kind || 'light');
    } catch (e) {}
  }

  // Иконки (stroke, currentColor)
  function svg(p, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + p + '</svg>'; }
  var I = {
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    feed: svg('<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="m10 9 5 3-5 3z"/>'),
    book: svg('<path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>'),
    vol: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>'),
    share: svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>'),
    words: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/>'),
    back: svg('<path d="m15 18-6-6 6-6"/>'),
    filter: svg('<path d="M3 5h18M6 12h12M10 19h4"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    swap: svg('<path d="M7 16V4M7 4 3 8M7 4l4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>'),
    eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>'),
    play: svg('<path d="m6 4 14 8-14 8z"/>')
  };

  // =====================================================================
  // 2. Данные и индексы
  // =====================================================================
  var CATS = D.cats, MOODS = D.moods, ITEMS = D.items, STORIES = D.stories, GLOSS = D.glossary;
  var CAT = {}, MOOD = {}, BY_ID = {}, BY_CAT = {};
  CATS.forEach(function (c) { CAT[c.key] = c; BY_CAT[c.key] = []; });
  MOODS.forEach(function (m) { MOOD[m.key] = m; });
  ITEMS.forEach(function (it) { BY_ID[it.id] = it; if (BY_CAT[it.c]) BY_CAT[it.c].push(it); });
  var STORY = {}; STORIES.forEach(function (s) { STORY[s.id] = s; });

  // Индекс глоссария по отдельным словам: "sink (sank)" -> sink, sank
  var TOK = {};
  Object.keys(GLOSS).forEach(function (k) {
    (k.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).forEach(function (t) {
      if (!TOK[t]) TOK[t] = [];
      if (TOK[t].length < 6) TOK[t].push(k);
    });
  });

  // Самые частые слова — чтобы тап по любому слову работал без интернета
  var BASIC = {
    the: 'определённый артикль (этот, тот)', a: 'неопределённый артикль (один, какой-то)', an: 'неопределённый артикль (перед гласной)',
    i: 'я', me: 'меня, мне', my: 'мой', mine: 'мой (без сущ.)', you: 'ты, вы', your: 'твой, ваш', yours: 'твой, ваш (без сущ.)',
    he: 'он', him: 'его, ему', his: 'его', she: 'она', her: 'её, ей', hers: 'её (без сущ.)', it: 'оно, это', its: 'его, её (о предмете)',
    we: 'мы', us: 'нас, нам', our: 'наш', they: 'они', them: 'их, им', their: 'их', myself: 'себя, сам', yourself: 'себя, сам', himself: 'себя, сам', herself: 'себя, сама', itself: 'себя, само', ourselves: 'себя, сами', themselves: 'себя, сами',
    is: 'есть (является) — форма be', am: 'есть (я) — форма be', are: 'есть (являются) — форма be', was: 'был, была — форма be', were: 'были — форма be', be: 'быть', been: 'был (3-я форма be)', being: 'будучи; существо',
    do: 'делать; вспомогательный глагол', does: 'делает; вспом. глагол', did: 'сделал; вспом. глагол', done: 'сделанный, готово', doing: 'делая',
    have: 'иметь; вспом. глагол', has: 'имеет; вспом. глагол', had: 'имел; вспом. глагол',
    will: 'будет (будущее время); воля', would: 'бы; стал бы', shall: 'буду, будем (торж.)', should: 'следует, должен бы', can: 'мочь, уметь', could: 'мог бы; мог', may: 'можно; может быть', might: 'мог бы, возможно', must: 'должен',
    not: 'не', no: 'нет; никакой', yes: 'да', never: 'никогда', always: 'всегда', ever: 'когда-либо', often: 'часто', sometimes: 'иногда', again: 'снова', still: 'всё ещё', already: 'уже', yet: 'ещё; уже (в вопросе); однако', just: 'просто; только что', only: 'только', even: 'даже', also: 'также', too: 'тоже; слишком', very: 'очень', so: 'так; поэтому', such: 'такой', much: 'много', many: 'много (исчисл.)', more: 'больше', most: 'больше всего; самый', less: 'меньше', little: 'маленький; мало', few: 'мало (исчисл.)', all: 'все, всё', every: 'каждый', each: 'каждый', some: 'некоторые; немного', any: 'любой; какой-нибудь', other: 'другой', another: 'ещё один, другой', same: 'тот же самый', own: 'собственный',
    and: 'и', or: 'или', but: 'но', if: 'если', because: 'потому что', than: 'чем', then: 'тогда, потом', as: 'как; когда; так как', that: 'тот; что; который', this: 'этот', these: 'эти', those: 'те', there: 'там', here: 'здесь', where: 'где, куда', when: 'когда', what: 'что, какой', who: 'кто; который', whom: 'кого, кому', whose: 'чей', why: 'почему', how: 'как', which: 'который', while: 'пока; в то время как', though: 'хотя', although: 'хотя', whether: 'ли', until: 'пока не, до', since: 'с тех пор как; так как', before: 'до, перед', after: 'после', once: 'однажды; как только',
    of: 'из, (родительный падеж)', in: 'в', on: 'на', at: 'в, у, на (точка)', to: 'к, в; частица перед глаголом', from: 'от, из', with: 'с', without: 'без', by: 'у, около; (кем)', for: 'для; в течение', about: 'о, про; около', into: 'в (внутрь)', over: 'над; через; свыше', under: 'под', up: 'вверх', down: 'вниз', out: 'наружу, вне', off: 'прочь, с', through: 'через, сквозь', between: 'между', among: 'среди', against: 'против', around: 'вокруг', near: 'рядом', behind: 'позади', upon: 'на (книжн.)', within: 'внутри', toward: 'к, по направлению к', towards: 'к, по направлению к',
    one: 'один; (некто)', two: 'два', three: 'три', first: 'первый', last: 'последний', new: 'новый', old: 'старый', good: 'хороший', bad: 'плохой', great: 'великий, отличный', big: 'большой', small: 'маленький', long: 'длинный, долгий', true: 'истинный, правдивый', real: 'настоящий',
    man: 'человек; мужчина', men: 'люди; мужчины', woman: 'женщина', people: 'люди', world: 'мир', life: 'жизнь', time: 'время', day: 'день', night: 'ночь', way: 'путь, способ', thing: 'вещь', things: 'вещи', heart: 'сердце', love: 'любовь; любить', death: 'смерть', god: 'бог', eye: 'глаз', eyes: 'глаза', hand: 'рука', head: 'голова', home: 'дом', house: 'дом (здание)', word: 'слово', words: 'слова', light: 'свет', dark: 'тёмный; тьма',
    say: 'сказать', said: 'сказал', see: 'видеть', saw: 'увидел', seen: 'увиденный', know: 'знать', knew: 'знал', known: 'известный', think: 'думать', thought: 'думал; мысль', come: 'приходить', came: 'пришёл', go: 'идти', went: 'пошёл', gone: 'ушедший', get: 'получать; становиться', got: 'получил', make: 'делать, создавать', made: 'сделал, создан', take: 'брать', took: 'взял', taken: 'взятый', give: 'давать', gave: 'дал', given: 'данный', find: 'находить', found: 'нашёл', tell: 'рассказать, сказать', told: 'сказал', want: 'хотеть', look: 'смотреть', like: 'нравиться; как, подобно', live: 'жить', die: 'умирать', feel: 'чувствовать', felt: 'чувствовал', keep: 'держать, продолжать', let: 'позволять; давай', need: 'нуждаться', try: 'пытаться', leave: 'уходить, оставлять', left: 'ушёл; левый', turn: 'поворачивать', put: 'класть', stand: 'стоять', stood: 'стоял', mean: 'значить', become: 'становиться', became: 'стал', begin: 'начинать', call: 'звать, называть', ask: 'спрашивать', seem: 'казаться',
    nothing: 'ничто, ничего', something: 'что-то', everything: 'всё', anything: 'что-нибудь', nobody: 'никто', someone: 'кто-то', everyone: 'каждый, все', anyone: 'кто-нибудь', none: 'ни один', thee: 'тебя (устар.)', thou: 'ты (устар.)', thy: 'твой (устар.)', thine: 'твой (устар.)', art: 'искусство; (thou art) ты есть', hath: 'имеет (устар.)', doth: 'делает (устар.)', ye: 'вы (устар.)', 'tis': 'это есть (устар. it is)', ere: 'прежде (устар.)',
    "don't": 'не (do not)', "can't": 'не могу (cannot)', "won't": 'не буду (will not)', "isn't": 'не есть (is not)', "i'm": 'я есть (I am)', "it's": 'это (it is)', "you're": 'ты есть (you are)', "i'll": 'я буду (I will)', "i've": 'у меня есть / я уже (I have)', "that's": 'это (that is)', "there's": 'есть, имеется (there is)', "didn't": 'не (did not)', "doesn't": 'не (does not)', "we're": 'мы есть (we are)', "they're": 'они есть (they are)', "let's": 'давай (let us)', gonna: 'собираюсь (going to)', wanna: 'хочу (want to)'
  };

  // =====================================================================
  // 3. Состояние и сохранение
  // =====================================================================
  var KEY = 'inkwell_v1';
  function DEF() {
    return {
      v: 1, seen: {}, rate: {}, fav: {}, words: {}, xp: 0, days: {}, goalDays: {},
      streak: { cur: 0, best: 0, last: 0 }, quiz: { best: 0, perfect: 0, played: 0 },
      stories: {}, ach: {}, trHist: [],
      st: { self: 0, partial: 0, miss: 0, tts: 0, tr: 0, qc: 0, rev: 0, night: 0, early: 0, dark: 0, touch: 0, anime: 0 },
      set: { theme: 'auto', font: 1, goal: 15, rate: 0.9, hide: true, auto: true },
      onb: false, upd: 0
    };
  }
  function mergeState(base, s) {
    Object.keys(s).forEach(function (k) {
      var v = s[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) base[k] = Object.assign(base[k], v);
      else base[k] = v;
    });
    return base;
  }
  function loadLocal() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return mergeState(DEF(), s); } catch (e) {}
    return DEF();
  }
  var S = loadLocal();
  var saveTimer = null;
  function save() {
    S.upd = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(cloud.save, 2500);
  }

  // Синхронизация между устройствами через Telegram CloudStorage (кусками по 3800 символов)
  var cloud = {
    ok: function () { return ver('6.9') && tg.CloudStorage; },
    save: function () {
      if (!cloud.ok()) return;
      try {
        var json = JSON.stringify(S), n = Math.ceil(json.length / 3800);
        for (var i = 0; i < n; i++) tg.CloudStorage.setItem('s' + i, json.slice(i * 3800, (i + 1) * 3800));
        tg.CloudStorage.setItem('meta', JSON.stringify({ n: n, t: S.upd }));
      } catch (e) {}
    },
    load: function (done) {
      if (!cloud.ok()) return done();
      try {
        tg.CloudStorage.getItem('meta', function (err, val) {
          if (err || !val) return done();
          var meta; try { meta = JSON.parse(val); } catch (e) { return done(); }
          if (!meta || !(meta.t > S.upd) || !meta.n) return done();
          var keys = []; for (var i = 0; i < meta.n; i++) keys.push('s' + i);
          tg.CloudStorage.getItems(keys, function (err2, vals) {
            if (err2 || !vals) return done();
            try {
              var json = keys.map(function (k) { return vals[k] || ''; }).join('');
              var s = JSON.parse(json);
              if (s && s.v === 1 && !booted) { S = mergeState(DEF(), s); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} return done(true); }
            } catch (e) {}
            done();
          });
        });
      } catch (e) { done(); }
    }
  };

  // =====================================================================
  // 4. Прогресс: XP, уровни, серия, цель, интервальные повторения
  // =====================================================================
  var LEVELS = [
    [0, 'Новичок', '🐣'], [60, 'Любопытный', '🔍'], [180, 'Читатель', '📖'], [400, 'Книжный червь', '🐛'],
    [750, 'Искатель слов', '🗝'], [1200, 'Знаток', '🎓'], [1800, 'Полиглот', '🌍'], [2600, 'Сказитель', '🪶'],
    [3600, 'Мудрец', '🦉'], [5000, 'Ниндзя слов', '🥷'], [6800, 'Сэнсэй', '🏯'], [9000, 'Бард', '🎻'],
    [12000, 'Хранитель библиотеки', '🏛'], [16000, 'Легенда', '⚡'], [21000, 'Шекспир', '👑']
  ];
  function levelInfo(xp) {
    var i = 0;
    while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    var cur = LEVELS[i], nx = LEVELS[i + 1];
    return { i: i, n: i + 1, name: cur[1], emoji: cur[2], from: cur[0], to: nx ? nx[0] : cur[0], next: nx, pct: nx ? (xp - cur[0]) / (nx[0] - cur[0]) : 1 };
  }
  function streakNow() { return S.streak.last >= today() - 1 ? S.streak.cur : 0; }

  function addXP(n, anchor) {
    var before = levelInfo(S.xp).i;
    S.xp += n;
    flyXP('+' + n + ' XP', anchor);
    var after = levelInfo(S.xp);
    if (after.i > before) {
      setTimeout(function () { confetti(); toast(after.emoji + ' Новый уровень: <b>' + after.name + '</b>!', 'big'); haptic('success'); }, 300);
    }
  }

  // Учебное действие: двигает серию дней и дневную цель
  function activity(n) {
    var t = today();
    S.days[t] = (S.days[t] || 0) + (n || 1);
    if (S.streak.last !== t) {
      S.streak.cur = S.streak.last === t - 1 ? S.streak.cur + 1 : 1;
      S.streak.last = t;
      if (S.streak.cur > S.streak.best) S.streak.best = S.streak.cur;
    }
    var hr = new Date().getHours();
    if (hr < 5) S.st.night++; else if (hr < 8) S.st.early++;
    if (!S.goalDays[t] && S.days[t] >= S.set.goal) {
      S.goalDays[t] = 1;
      setTimeout(function () { confetti(); toast('✅ Цель дня выполнена! +20 XP', 'big'); haptic('success'); }, 450);
      S.xp += 20;
    }
  }

  var IV = [0, 1, 3, 7, 14, 30, 60];
  function schedule(rec, grade) {
    var b = rec ? rec.b : -1;
    if (grade === 2) b = b < 0 ? 3 : Math.min(b + 1, 6);
    else if (grade === 1) b = b > 1 ? b - 1 : 1;
    else b = 0;
    return { b: b, d: today() + IV[b], n: (rec ? rec.n : 0) + 1, g: grade };
  }
  function dueSentences() {
    var t = today();
    return Object.keys(S.rate).filter(function (id) { return BY_ID[id] && S.rate[id].d <= t; });
  }
  function dueWords() {
    var t = today();
    return Object.keys(S.words).filter(function (w) { return S.words[w].d <= t; });
  }
  function dueCount() { return dueSentences().length + dueWords().length; }

  function markSeen(it) {
    if (!BY_ID[it.id] || S.seen[it.id]) return false;
    S.seen[it.id] = Date.now();
    if (it.t.indexOf('dark') >= 0 || it.t.indexOf('creepy') >= 0) S.st.dark++;
    if (it.t.indexOf('touching') >= 0) S.st.touch++;
    if (it.c === 'anime') S.st.anime++;
    S.xp += 1;
    checkAch();
    save();
    return true;
  }

  var GRADE_TXT = ['😵 Не понял', '🤏 Частично', '😎 Понял сам'];
  function rateItem(it, g, anchor) {
    S.rate[it.id] = schedule(S.rate[it.id], g);
    S.st[['miss', 'partial', 'self'][g]]++;
    markSeen(it);
    activity(1);
    addXP([1, 2, 3][g], anchor);
    haptic(g === 2 ? 'success' : 'light');
    checkAch();
    save();
    refreshBadges();
  }

  function addWord(en, ru, ctxId) {
    var k = en.toLowerCase();
    if (S.words[k]) return false;
    S.words[k] = { en: en, ru: ru, b: -1, d: today(), n: 0, ctx: ctxId || '', at: Date.now() };
    S.xp += 1;
    checkAch(); save(); refreshBadges();
    return true;
  }
  function rateWord(k, g) {
    var w = S.words[k]; if (!w) return;
    var r = schedule({ b: w.b, n: w.n }, g);
    w.b = r.b; w.d = r.d; w.n = r.n;
    S.st.rev++;
  }

  // =====================================================================
  // 5. Достижения
  // =====================================================================
  function seenCount() { return Object.keys(S.seen).length; }
  function catsTouched() { var c = {}; Object.keys(S.seen).forEach(function (id) { if (BY_ID[id]) c[BY_ID[id].c] = 1; }); return Object.keys(c).length; }
  function storiesDone() { return Object.keys(S.stories).filter(function (k) { return S.stories[k].done; }).length; }
  var ACH = [
    ['first', '👣', 'Первый шаг', 'Прочитать первую карточку', function () { return seenCount() >= 1; }],
    ['r50', '📚', 'Разогрев', 'Прочитать 50 карточек', function () { return seenCount() >= 50; }],
    ['r200', '🔥', 'Запойный читатель', 'Прочитать 200 карточек', function () { return seenCount() >= 200; }],
    ['r500', '🏛', 'Хранитель', 'Прочитать 500 карточек', function () { return seenCount() >= 500; }],
    ['rall', '👑', 'Прочитал всё', 'Прочитать все карточки', function () { return seenCount() >= ITEMS.length; }],
    ['s25', '🧠', 'Переводчик в голове', '25 раз «Понял сам»', function () { return S.st.self >= 25; }],
    ['s100', '🦉', 'Мудрая сова', '100 раз «Понял сам»', function () { return S.st.self >= 100; }],
    ['dark', '🖤', 'Тёмная сторона', '20 мрачных или жутких', function () { return S.st.dark >= 20; }],
    ['touch', '🥹', 'Мягкое сердце', '20 трогательных', function () { return S.st.touch >= 20; }],
    ['otaku', '🌸', 'Отаку', '50 цитат из аниме', function () { return S.st.anime >= 50; }],
    ['explorer', '🧭', 'Исследователь', 'Заглянуть во все разделы', function () { return catsTouched() >= CATS.length; }],
    ['night', '🌙', 'Ночная сова', 'Учиться после полуночи', function () { return S.st.night >= 1; }],
    ['early', '🌅', 'Ранняя пташка', 'Учиться до 8 утра', function () { return S.st.early >= 1; }],
    ['st3', '✨', 'Огонёк', '3 дня подряд', function () { return S.streak.best >= 3; }],
    ['st7', '🔥', 'Неделя силы', '7 дней подряд', function () { return S.streak.best >= 7; }],
    ['st30', '💎', 'Железная воля', '30 дней подряд', function () { return S.streak.best >= 30; }],
    ['perfect', '🎯', 'Безупречно', '10 из 10 в квизе', function () { return S.quiz.perfect >= 1; }],
    ['story1', '📖', 'Первая история', 'Дочитать рассказ', function () { return storiesDone() >= 1; }],
    ['storyall', '🏆', 'Все рассказы', 'Дочитать все рассказы', function () { return storiesDone() >= STORIES.length; }],
    ['w20', '📒', 'Коллекционер', '20 слов в словаре', function () { return Object.keys(S.words).length >= 20; }],
    ['w100', '🗝', 'Словарный запас', '100 слов в словаре', function () { return Object.keys(S.words).length >= 100; }],
    ['fav10', '❤️', 'Ценитель', '10 в избранном', function () { return Object.keys(S.fav).length >= 10; }],
    ['tr', '🌍', 'Толмач', 'Перевести текст', function () { return S.st.tr >= 1; }],
    ['tts', '🎧', 'Слушатель', '20 прослушиваний', function () { return S.st.tts >= 20; }],
    ['goal', '✅', 'Цель дня', 'Выполнить дневную цель', function () { return Object.keys(S.goalDays).length >= 1; }],
    ['rev', '🔁', 'Мать учения', '50 повторений', function () { return S.st.rev >= 50; }],
    ['lv5', '🎓', 'Знаток', 'Достичь 6 уровня', function () { return levelInfo(S.xp).n >= 6; }],
    ['quiz5', '🕹', 'Игроман', 'Сыграть 5 квизов', function () { return S.quiz.played >= 5; }]
  ];
  function checkAch() {
    ACH.forEach(function (a) {
      if (S.ach[a[0]]) return;
      var ok = false; try { ok = a[4](); } catch (e) {}
      if (ok) {
        S.ach[a[0]] = Date.now();
        setTimeout(function () { toast(a[1] + ' Достижение: <b>' + a[2] + '</b>', 'big'); confetti(); haptic('success'); }, 650);
      }
    });
  }

  // =====================================================================
  // 6. Озвучка
  // =====================================================================
  var tts = {
    voices: [], audio: null, queue: [], btn: null,
    init: function () {
      if (!('speechSynthesis' in window)) return;
      var load = function () {
        try {
          var vs = window.speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang); });
          var score = function (v) {
            var s = 0, n = v.name.toLowerCase();
            if (/natural|neural|online/.test(n)) s += 5;
            if (/google/.test(n)) s += 3;
            if (/samantha|daniel|serena|karen|aria|jenny|sonia|libby|ryan|guy/.test(n)) s += 2;
            if (/en[-_]gb/i.test(v.lang)) s += 1;
            return -s;
          };
          tts.voices = vs.sort(function (a, b) { return score(a) - score(b); });
        } catch (e) {}
      };
      load();
      try { window.speechSynthesis.onvoiceschanged = load; } catch (e) {}
    },
    stop: function () {
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      if (tts.audio) { try { tts.audio.pause(); } catch (e) {} tts.audio = null; }
      tts.queue = [];
      if (tts.btn) { tts.btn.classList.remove('playing'); tts.btn = null; }
    },
    speak: function (text, btn, rate) {
      tts.stop();
      text = String(text).replace(/\n+/g, ' ').replace(/[“”«»]/g, '"').replace(/—/g, ', ').trim();
      if (!text) return;
      S.st.tts++; checkAch(); save();
      if (btn) { tts.btn = btn; btn.classList.add('playing'); }
      var done = function () { if (tts.btn) { tts.btn.classList.remove('playing'); tts.btn = null; } };
      if (tts.voices.length) {
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.voice = tts.voices[0]; u.lang = tts.voices[0].lang;
          u.rate = rate || S.set.rate; u.onend = done; u.onerror = done;
          window.speechSynthesis.speak(u);
          return;
        } catch (e) {}
      }
      // Запасной вариант: голос Google (если в WebView нет встроенных голосов)
      tts.queue = chunk(text, 180);
      var next = function () {
        if (!tts.queue.length) return done();
        var a = new Audio('https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&ttsspeed=' + ((rate || S.set.rate) < 0.85 ? 0.6 : 1) + '&q=' + encodeURIComponent(tts.queue.shift()));
        tts.audio = a; a.onended = next; a.onerror = function () { done(); toast('Озвучка недоступна на этом устройстве 😕'); };
        a.play().catch(function () { done(); });
      };
      next();
    }
  };
  function chunk(text, max) {
    var parts = text.match(/[^.!?;:,]+[.!?;:,]*\s*/g) || [text], out = [], cur = '';
    parts.forEach(function (p) {
      if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; }
      while (p.length > max) { out.push(p.slice(0, max)); p = p.slice(max); }
      cur += p;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  tts.init();

  // =====================================================================
  // 7. Перевод (онлайн) и поиск слов
  // =====================================================================
  var trCache = {};
  try { trCache = JSON.parse(localStorage.getItem('inkwell_tr') || '{}'); } catch (e) {}
  function isRu(text) { return /[а-яё]/i.test(text); }
  function translateText(text) {
    var ru = isRu(text), sl = ru ? 'ru' : 'en', tl = ru ? 'en' : 'ru';
    var key = sl + ':' + text.toLowerCase();
    if (trCache[key]) return Promise.resolve(trCache[key]);
    var g = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=' + tl + '&dt=t&q=' + encodeURIComponent(text);
    var mm = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + sl + '|' + tl;
    var remember = function (out) {
      trCache[key] = out;
      var keys = Object.keys(trCache); if (keys.length > 400) delete trCache[keys[0]];
      try { localStorage.setItem('inkwell_tr', JSON.stringify(trCache)); } catch (e) {}
      return out;
    };
    return fetch(g).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var out = (j && j[0] || []).map(function (x) { return x && x[0] || ''; }).join('').trim();
      if (!out) throw 0;
      return remember(out);
    }).catch(function () {
      return fetch(mm).then(function (r) { return r.json(); }).then(function (j) {
        var out = j && j.responseData && j.responseData.translatedText;
        if (!out || /MYMEMORY WARNING|QUERY LENGTH/i.test(out)) throw new Error('no');
        return remember(out);
      });
    });
  }
  function openGoogleTranslate(text) {
    var ru = isRu(text);
    var url = 'https://translate.google.com/?sl=' + (ru ? 'ru' : 'en') + '&tl=' + (ru ? 'en' : 'ru') + '&text=' + encodeURIComponent(text) + '&op=translate';
    if (inTG && tg.openLink) tg.openLink(url); else window.open(url, '_blank');
  }

  function lemmas(w) {
    var c = [w];
    var add = function (x) { if (x && x.length > 1 && c.indexOf(x) < 0) c.push(x); };
    add(w.replace(/'s$/, ''));
    if (/ies$/.test(w)) add(w.replace(/ies$/, 'y'));
    if (/ied$/.test(w)) add(w.replace(/ied$/, 'y'));
    if (/ier$|iest$/.test(w)) add(w.replace(/i(er|est)$/, 'y'));
    if (/es$/.test(w)) add(w.replace(/es$/, ''));
    if (/s$/.test(w)) add(w.replace(/s$/, ''));
    if (/ed$/.test(w)) { add(w.replace(/ed$/, '')); add(w.replace(/d$/, '')); add(w.replace(/([b-df-hj-np-tv-z])\1ed$/, '$1')); }
    if (/ing$/.test(w)) { add(w.replace(/ing$/, '')); add(w.replace(/ing$/, 'e')); add(w.replace(/([b-df-hj-np-tv-z])\1ing$/, '$1')); }
    if (/er$/.test(w)) { add(w.replace(/er$/, '')); add(w.replace(/r$/, '')); }
    if (/est$/.test(w)) { add(w.replace(/est$/, '')); add(w.replace(/st$/, '')); }
    if (/ly$/.test(w)) add(w.replace(/ly$/, ''));
    if (/ves$/.test(w)) { add(w.replace(/ves$/, 'f')); add(w.replace(/ves$/, 'fe')); }
    return c;
  }
  // Ищет перевод слова: сначала в словах карточки, потом в общем глоссарии, потом в базовом словаре
  function lookup(raw, it) {
    var w = raw.toLowerCase().replace(/’/g, "'");
    var cands = lemmas(w);
    var own = (it && (it.w || [])) || [];
    var i, j, c, k;
    for (i = 0; i < cands.length; i++) for (j = 0; j < own.length; j++) if (own[j][0].toLowerCase() === cands[i]) return { en: own[j][0], ru: own[j][1], src: 'Из этой карточки' };
    for (i = 0; i < cands.length; i++) if (GLOSS[cands[i]]) return { en: cands[i], ru: GLOSS[cands[i]], src: 'Словарь Inkwell' };
    for (i = 0; i < cands.length; i++) if (BASIC[cands[i]]) return { en: cands[i], ru: BASIC[cands[i]], src: 'Базовое слово' };
    for (i = 0; i < cands.length; i++) {
      c = cands[i];
      if (c.length < 3) continue;
      for (j = 0; j < own.length; j++) {
        k = own[j][0].toLowerCase();
        if ((k.match(/[a-z']+/g) || []).indexOf(c) >= 0) return { en: own[j][0], ru: own[j][1], src: 'В выражении из карточки' };
      }
    }
    for (i = 0; i < cands.length; i++) if (TOK[cands[i]]) { var key = TOK[cands[i]][0]; return { en: key, ru: GLOSS[key], src: 'В выражении' }; }
    return null;
  }

  // Английский текст -> HTML, где каждое слово можно нажать
  function wordsHTML(text, kw) {
    var set = {};
    (kw || []).forEach(function (p) { (p[0].toLowerCase().match(/[a-z']+/g) || []).forEach(function (t) { if (t.length > 2 && !BASIC[t]) set[t] = 1; }); });
    var out = '', re = /[A-Za-z][A-Za-z'’]*/g, last = 0, m;
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index));
      var wd = m[0], low = wd.toLowerCase().replace(/’/g, "'");
      var isKw = set[low] || lemmas(low).some(function (x) { return set[x]; });
      out += '<span class="w' + (isKw ? ' kw' : '') + '">' + esc(wd) + '</span>';
      last = m.index + wd.length;
    }
    out += esc(text.slice(last));
    return out.replace(/\n/g, '<br>');
  }

  // =====================================================================
  // 8. UI-примитивы: тосты, XP, конфетти, слои, шторки
  // =====================================================================
  function toast(html, cls) {
    var t = h('div', { class: 'toast ' + (cls || '') }, html);
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }, cls === 'big' ? 2600 : 1800);
  }
  function flyXP(text, anchor) {
    var r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: window.innerWidth / 2 - 30, top: window.innerHeight / 2 };
    var el = h('div', { class: 'xpfly', style: 'left:' + Math.max(10, Math.min(window.innerWidth - 80, r.left + (r.width || 0) / 2 - 24)) + 'px;top:' + (r.top - 6) + 'px' }, text);
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }
  function confetti() {
    var colors = ['#8b7bff', '#36c2ff', '#ff4f9a', '#ffb547', '#2fd08a', '#ff6a3d'];
    for (var i = 0; i < 46; i++) {
      var c = h('i', { class: 'confetti', style: 'left:' + rnd(100) + 'vw;background:' + pick(colors) + ';animation-duration:' + (1.4 + Math.random() * 1.4) + 's;animation-delay:' + Math.random() * 0.3 + 's;transform:rotate(' + rnd(360) + 'deg)' });
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 3200); })(c);
    }
  }

  var stack = [];
  function syncBack() {
    if (!ver('6.1')) return;
    try { if (stack.length) tg.BackButton.show(); else tg.BackButton.hide(); } catch (e) {}
  }
  function pushLayer(title, build, opts) {
    opts = opts || {};
    var L = h('section', { class: 'layer' });
    var head = h('div', { class: 'layer-head' });
    var back = h('button', { class: 'iconbtn', 'aria-label': 'Назад' }, I.back);
    back.addEventListener('click', popLayer);
    head.appendChild(back);
    head.appendChild(h('div', { class: 'ttl' }, title));
    if (opts.right) head.appendChild(opts.right);
    var body = h('div', { class: 'layer-body' });
    L.appendChild(head); L.appendChild(body);
    $('#layers').appendChild(L);
    stack.push({ el: L, onClose: opts.onClose });
    syncBack();
    build(body, L);
    return L;
  }
  function openSheet(build, opts) {
    opts = opts || {};
    var bd = h('div', { class: 'backdrop' });
    var sh = h('div', { class: 'sheet' + (opts.cls ? ' ' + opts.cls : '') });
    sh.appendChild(h('div', { class: 'handle' }));
    bd.addEventListener('click', popLayer);
    $('#layers').appendChild(bd); $('#layers').appendChild(sh);
    stack.push({ el: sh, bd: bd, onClose: opts.onClose });
    syncBack();
    build(sh);
    return sh;
  }
  function popLayer() {
    var top = stack.pop();
    if (!top) return;
    tts.stop();
    top.el.classList.add('out');
    if (top.bd) top.bd.classList.add('out');
    setTimeout(function () { top.el.remove(); if (top.bd) top.bd.remove(); }, 230);
    if (top.onClose) top.onClose();
    syncBack();
  }
  function closeAll() { while (stack.length) popLayer(); }
  if (ver('6.1')) { try { tg.BackButton.onClick(popLayer); } catch (e) {} }

  function share(it) {
    var text = '“' + it.en + '”' + (it.a ? '\n— ' + it.a : '') + '\n\n🇷🇺 ' + it.ru + '\n\n📚 Учу английский в Inkwell';
    var url = 'https://t.me/share/url?url=' + encodeURIComponent(BOT_LINK) + '&text=' + encodeURIComponent(text);
    if (inTG && tg.openTelegramLink) tg.openTelegramLink(url);
    else if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else window.open(url, '_blank');
  }

  // =====================================================================
  // 9. Карточка
  // =====================================================================
  function enSize(it) {
    var L = it.en.length;
    return L < 45 ? 30 : L < 100 ? 25 : L < 190 ? 21 : L < 340 ? 18.5 : L < 600 ? 16.5 : 15;
  }
  function whoLine(it) {
    if (it.a && it.s) return esc(it.a) + ' <span>· ' + esc(it.s) + '</span>';
    if (it.a) return esc(it.a);
    if (it.s) return '<span>' + esc(it.s) + '</span>';
    return '';
  }
  function ratedHTML(rec) {
    return '<div class="rated"><i>✓</i> ' + GRADE_TXT[rec.g] + ' · повторим ' + inDays(rec.d - today()) + '</div>';
  }

  // opts: sheet (в шторке), reveal (сразу показать перевод), onRated(it, g), review
  function cardEl(it, opts) {
    opts = opts || {};
    var c = CAT[it.c] || CATS[0];
    var el = h('article', { class: 'fcard' + (opts.sheet ? ' in-sheet' : ''), 'data-id': it.id, style: '--c:' + c.color });
    var rec = S.rate[it.id];
    var open = opts.reveal || !S.set.hide;
    var moods = (it.t || []).map(function (t) { return MOOD[t] ? '<span class="mood" title="' + esc(MOOD[t].name) + '">' + MOOD[t].emoji + '</span>' : ''; }).join('');
    var showTitle = (it.c === 'poems' || it.c === 'russian') && it.s;
    var who = whoLine(showTitle ? { a: it.a } : it);
    el.innerHTML =
      '<div class="fc-head"><span class="badge">' + c.emoji + ' ' + esc(c.name) + '</span>' + moods +
      '<span class="lvl" title="Сложность">' + '●●●'.slice(0, it.l) + '○○○'.slice(0, 3 - it.l) + '</span></div>' +
      '<div class="fc-body"><div class="fc-inner">' +
      (showTitle ? '<div class="fc-title">' + esc(it.s) + '</div>' : '') +
      '<div class="fc-en serif" style="--en-size:' + enSize(it) + 'px">' + wordsHTML(it.en, it.w) + '</div>' +
      (who ? '<div class="fc-who">— ' + who + '</div>' : '') +
      '<div class="veil' + (open ? ' open' : '') + '"><div class="flag">Перевод</div><div class="ru serif">' + esc(it.ru) + '</div>' +
      '<div class="cover">🤔 Сначала переведи в голове<b>Нажми, чтобы проверить себя</b></div></div>' +
      '<div class="after' + (open ? '' : ' hidden') + '">' +
      (rec && !opts.review ? ratedHTML(rec) : rateHTML()) +
      (it.n ? '<div class="note">💡 ' + esc(it.n) + '</div>' : '') +
      '</div>' +
      '</div></div>' +
      '<div class="fc-side">' +
      '<button class="fab fav' + (S.fav[it.id] ? ' on' : '') + '" data-act="fav" aria-label="В избранное">' + I.heart + '</button>' +
      '<button class="fab" data-act="tts" aria-label="Послушать">' + I.vol + '</button>' +
      '<button class="fab" data-act="words" aria-label="Слова">' + I.words + ((it.w || []).length ? '<i>' + it.w.length + '</i>' : '') + '</button>' +
      '<button class="fab" data-act="share" aria-label="Поделиться">' + I.share + '</button>' +
      '</div>';

    var lastTap = 0;
    el.addEventListener('click', function (e) {
      var t = e.target;
      var w = t.closest('.w');
      if (w) { wordSheet(w.textContent, it, w); return; }
      var act = t.closest('[data-act]');
      if (act) {
        var a = act.getAttribute('data-act');
        if (a === 'fav') toggleFav(it, act);
        else if (a === 'tts') { if (act.classList.contains('playing')) tts.stop(); else tts.speak(it.en, act); }
        else if (a === 'words') wordsSheet(it);
        else if (a === 'share') share(it);
        return;
      }
      var g = t.closest('[data-g]');
      if (g) {
        var grade = +g.getAttribute('data-g');
        rateItem(it, grade, g);
        var after = el.querySelector('.after');
        var r3 = after.querySelector('.rate3');
        if (r3) r3.outerHTML = ratedHTML(S.rate[it.id]);
        if (opts.onRated) opts.onRated(it, grade);
        return;
      }
      var veil = t.closest('.veil');
      if (veil && !veil.classList.contains('open')) { reveal(); return; }
      // двойной тап по карточке — в избранное
      var now = Date.now();
      if (now - lastTap < 320 && !t.closest('button')) {
        if (!S.fav[it.id]) toggleFav(it, el.querySelector('[data-act=fav]'));
        var b = h('div', { class: 'burst' }, '❤️'); el.appendChild(b); setTimeout(function () { b.remove(); }, 800);
      }
      lastTap = now;
    });
    function reveal() {
      el.querySelector('.veil').classList.add('open');
      el.querySelector('.after').classList.remove('hidden');
      haptic('light');
      markSeen(it);
    }
    el.reveal = reveal;
    return el;
  }
  function rateHTML() {
    return '<div class="rate3"><button data-g="0"><b>😵</b>Не понял</button><button data-g="1"><b>🤏</b>Частично</button><button data-g="2" class="g2"><b>😎</b>Понял сам</button></div>';
  }
  function toggleFav(it, btn) {
    if (S.fav[it.id]) { delete S.fav[it.id]; toast('Убрано из избранного'); }
    else { S.fav[it.id] = Date.now(); toast('❤️ В избранном'); haptic('medium'); }
    if (btn) btn.classList.toggle('on', !!S.fav[it.id]);
    checkAch(); save();
  }

  function itemSheet(it, opts) {
    openSheet(function (sh) {
      sh.appendChild(cardEl(it, Object.assign({ sheet: true }, opts || {})));
    });
  }

  // Шторка со словом
  function wordSheet(raw, it, spanEl) {
    if (spanEl) { spanEl.classList.add('hl'); setTimeout(function () { spanEl.classList.remove('hl'); }, 600); }
    var word = raw.replace(/’/g, "'").replace(/^'+|'+$/g, '');
    var found = lookup(word, it);
    haptic('select');
    tts.speak(word, null, 0.85);
    openSheet(function (sh) {
      sh.classList.add('wordsheet');
      var key = found ? found.en : word.toLowerCase();
      var inDict = function () { return !!S.words[key.toLowerCase()]; };
      sh.innerHTML += '<div class="big serif">' + esc(word) + '</div>' +
        '<div class="tr">' + (found ? esc(found.ru) : '<span class="muted">Ищу перевод…</span>') + '</div>' +
        '<div class="src">' + (found ? (found.en.toLowerCase() !== word.toLowerCase() ? 'Форма слова: <b>' + esc(found.en) + '</b> · ' : '') + esc(found.src) : '') + '</div>' +
        '<div class="actions"></div>' +
        (it ? '<div class="ctx serif">' + highlightIn(it.en, word) + '</div>' : '');
      var acts = sh.querySelector('.actions');
      var bSay = h('button', { class: 'btn sm' }, I.vol + ' Произнести');
      bSay.addEventListener('click', function () { tts.speak(word, null, 0.8); });
      var bAdd = h('button', { class: 'btn sm primary' }, inDict() ? I.check + ' В словаре' : I.plus + ' В мой словарь');
      bAdd.addEventListener('click', function () {
        var ru = sh.querySelector('.tr').textContent;
        if (inDict() || !ru || /Ищу перевод|не нашёл/i.test(ru)) return;
        if (addWord(key, ru, it && it.id)) { bAdd.innerHTML = I.check + ' В словаре'; toast('📒 Слово добавлено в словарь'); haptic('success'); flyXP('+1 XP', bAdd); }
      });
      var bG = h('button', { class: 'btn sm ghost' }, I.globe + ' Google');
      bG.addEventListener('click', function () { openGoogleTranslate(word); });
      acts.appendChild(bSay); acts.appendChild(bAdd); acts.appendChild(bG);
      if (!found) {
        translateText(word).then(function (out) {
          sh.querySelector('.tr').textContent = out;
          sh.querySelector('.src').textContent = 'Автоперевод';
        }).catch(function () {
          sh.querySelector('.tr').innerHTML = '<span class="muted">Не нашёл перевод офлайн. Нажми «Google».</span>';
        });
      }
    });
  }
  function highlightIn(text, word) {
    var re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'i');
    var parts = text.split(re);
    if (parts.length < 2) return esc(text);
    return esc(parts[0]) + '<b style="color:var(--accent)">' + esc(parts[1]) + '</b>' + esc(parts.slice(2).join(''));
  }

  // Шторка со списком слов карточки
  function wordsSheet(it) {
    openSheet(function (sh) {
      sh.appendChild(h('h2', { style: 'margin-top:4px' }, '📚 Ключевые слова'));
      var list = h('div', { class: 'wlist' });
      (it.w || []).forEach(function (p) { list.appendChild(wordRow(p[0], p[1], it.id)); });
      if (!(it.w || []).length) list.innerHTML = '<div class="empty"><b>🔎</b>Здесь нет отдельных слов. Нажми на любое слово в тексте — я переведу.</div>';
      sh.appendChild(list);
      if (it.n) sh.appendChild(h('div', { class: 'note' }, '💡 ' + esc(it.n)));
      sh.appendChild(h('div', { class: 'note' }, '👆 Подсказка: нажми на <b>любое</b> слово в тексте карточки, чтобы увидеть перевод.'));
    });
  }
  function wordRow(en, ru, ctx, opts) {
    opts = opts || {};
    var row = h('div', { class: 'wrow' });
    row.innerHTML = '<div class="tx"><div class="en">' + esc(en) + '</div><div class="ru">' + esc(ru) + '</div></div>';
    var say = h('button', { class: 'iconbtn' }, I.vol);
    say.addEventListener('click', function () { tts.speak(en.replace(/\(.*?\)/g, ''), null, 0.85); });
    row.appendChild(say);
    if (opts.del) {
      var del = h('button', { class: 'iconbtn' }, I.trash);
      del.addEventListener('click', function () { delete S.words[en.toLowerCase()]; save(); row.remove(); refreshBadges(); toast('Удалено из словаря'); });
      row.appendChild(del);
    } else {
      var k = en.toLowerCase();
      var add = h('button', { class: 'iconbtn' + (S.words[k] ? ' on' : '') }, S.words[k] ? I.check : I.plus);
      add.addEventListener('click', function () {
        if (S.words[k]) return;
        if (addWord(en, ru, ctx)) { add.innerHTML = I.check; add.classList.add('on'); toast('📒 «' + esc(en) + '» в словаре'); haptic('success'); }
      });
      row.appendChild(add);
    }
    return row;
  }

  // =====================================================================
  // 10. Навигация по вкладкам
  // =====================================================================
  var TABS = [
    ['home', 'Главная', I.home], ['feed', 'Лента', I.feed], ['library', 'Читалка', I.book],
    ['practice', 'Тренировка', I.target], ['profile', 'Профиль', I.user]
  ];
  var curTab = null;
  function buildNav() {
    var nav = $('#nav');
    nav.innerHTML = '';
    TABS.forEach(function (t) {
      var b = h('button', { 'data-tab': t[0] }, t[2] + '<small>' + t[1] + '</small>');
      b.addEventListener('click', function () { if (curTab !== t[0]) haptic('select'); if (t[0] === 'feed') openFeed(feedState.filter, true); else showTab(t[0]); });
      nav.appendChild(b);
    });
  }
  function refreshBadges() {
    var b = $('#nav [data-tab=practice]');
    if (!b) return;
    var n = dueCount(), dot = b.querySelector('.dot');
    if (n > 0) { if (!dot) { dot = h('span', { class: 'dot' }); b.appendChild(dot); } dot.textContent = n > 99 ? '99+' : n; }
    else if (dot) dot.remove();
  }
  var RENDER = {};
  function showTab(name, keep) {
    tts.stop();
    closeAll();
    curTab = name;
    $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === name); });
    $$('.tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-tab') === name); });
    var root = $('.tab[data-tab=' + name + ']');
    if (name === 'feed') { if (!keep || !root.firstChild) RENDER.feed(root); }
    else RENDER[name](root);
    if (name === 'feed') { sizeFeed(); setTimeout(sizeFeed, 350); }
    if (name !== 'feed') window.scrollTo(0, 0);
    refreshBadges();
  }

  // =====================================================================
  // 11. Главная
  // =====================================================================
  var TIPS = [
    ['🧠', 'Не переводи каждое слово. Сначала пойми общий смысл, а детали — потом. Так читают носители.'],
    ['🔁', 'Оценивай себя честно. Карточки «Не понял» вернутся завтра — это и есть секрет запоминания.'],
    ['🗣', 'Читай вслух. Нажми 🔊, послушай и повтори фразу за диктором — это называется shadowing.'],
    ['🌸', 'Смотри аниме с английскими субтитрами, а не русскими. Сначала тяжело, через месяц — привычно.'],
    ['📖', 'Читай то, что тебе интересно, даже если сложно. Интерес важнее идеального уровня.'],
    ['✍️', 'Пиши одно предложение в день по-английски. Например, о том, что прочитал здесь.'],
    ['🎧', 'Слушай английский фоном: подкасты, аудиокниги, музыку. Мозг привыкает к звучанию сам.'],
    ['🪄', 'Учи слова фразами, а не по одному. «Break the ice» запомнится лучше, чем «ice».'],
    ['⏱', '15 минут каждый день лучше, чем 2 часа раз в неделю. Серия дней 🔥 не врёт.'],
    ['📚', 'Перечитывай любимые цитаты. Знакомый текст — лучший учебник грамматики.'],
    ['🎮', 'Переключи язык в играх и на телефоне на английский — ты уже знаешь, где что находится.'],
    ['🦉', 'Делай ошибки. Каждое «Не понял» — это слово, которое ты скоро будешь знать.'],
    ['🔍', 'Нажимай на любое слово в тексте — перевод появится сразу. Понравилось слово — добавь в словарь.'],
    ['🪆', 'Начни с «Русской классики по-английски»: ты знаешь смысл, поэтому понимать английский легче.'],
    ['😴', 'Повторяй перед сном — мозг закрепляет выученное во сне.'],
    ['📱', 'Читай мангу и вебтуны на английском: короткие фразы, картинки помогают понять смысл.']
  ];
  function greeting() {
    var hr = new Date().getHours();
    if (hr < 5) return 'Доброй ночи, полуночник 🌙';
    if (hr < 12) return 'Доброе утро ☀️';
    if (hr < 18) return 'Добрый день 👋';
    return 'Добрый вечер 🌆';
  }
  function userName() {
    var u = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
    return (u && u.first_name) || 'друг';
  }
  function dailyItem() {
    var pool = ITEMS.filter(function (it) { return it.en.length < 260 && ['idioms', 'slang', 'twisters', 'riddles'].indexOf(it.c) < 0; });
    return pool[(today() * 7919) % pool.length];
  }
  function dailyWord() {
    var keys = Object.keys(GLOSS).filter(function (k) { return /^[a-z][a-z-]{3,}$/.test(k); });
    var k = keys[(today() * 104729) % keys.length];
    return { en: k, ru: GLOSS[k] };
  }
  function ringSVG(pct, size, stroke) {
    var r = (size - stroke) / 2, cf = 2 * Math.PI * r;
    return '<svg viewBox="0 0 ' + size + ' ' + size + '"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="var(--card2)" stroke-width="' + stroke + '" fill="none"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="url(#rg)" stroke-width="' + stroke + '" fill="none" stroke-linecap="round" stroke-dasharray="' + cf + '" stroke-dashoffset="' + cf * (1 - Math.max(0.02, Math.min(1, pct))) + '"/></svg>';
  }

  RENDER.home = function (root) {
    var lv = levelInfo(S.xp), t = today(), done = S.days[t] || 0, goal = S.set.goal, due = dueCount();
    root.innerHTML =
      '<div class="topline"><div class="logo"><i>✒</i>Inkwell</div><button class="iconbtn" data-go="settings" aria-label="Настройки">' + I.gear + '</button></div>' +
      '<h1>' + greeting() + '</h1><div class="sub">' + esc(userName()) + ', сегодня читаем по-английски</div>' +
      '<div class="spacer"></div>' +
      '<div class="surface hero">' +
      '<div class="ring">' + ringSVG(lv.pct, 84, 8) + '<div class="lv">' + lv.emoji + '</div></div>' +
      '<div><div class="lvname">Уровень ' + lv.n + ' · ' + esc(lv.name) + '</div>' +
      '<div class="xpline">' + S.xp + ' XP' + (lv.next ? ' · до «' + esc(lv.next[1]) + '» ' + (lv.to - S.xp) + ' XP' : ' · максимальный уровень!') + '</div>' +
      '</div><div class="minis"><span class="mini">🔥 ' + streakNow() + ' ' + plural(streakNow(), 'день', 'дня', 'дней') + '</span><span class="mini">📖 ' + seenCount() + ' прочитано</span><span class="mini">📒 ' + Object.keys(S.words).length + ' ' + plural(Object.keys(S.words).length, 'слово', 'слова', 'слов') + '</span></div>' +
      '<div class="goalbar"><div class="row"><span>Цель дня</span><span>' + Math.min(done, goal) + ' / ' + goal + (done >= goal ? ' ✅' : '') + '</span></div><div class="bar"><i style="width:' + Math.min(100, done / goal * 100) + '%"></i></div></div>' +
      '</div>' +
      '<h2>✨ Находка дня</h2><div id="daily"></div>' +
      '<h2>⚡ Быстрый старт</h2>' +
      '<div class="qgrid">' +
      '<button class="qbtn" data-go="feed"><b>▶️</b>Лента</button>' +
      '<button class="qbtn" data-go="review"><b>🔁</b>Повторить' + (due ? '<span class="cnt">' + due + '</span>' : '') + '</button>' +
      '<button class="qbtn" data-go="practice"><b>🎯</b>Квизы</button>' +
      '<button class="qbtn" data-go="stories"><b>📖</b>Рассказы</button>' +
      '<button class="qbtn" data-go="translator"><b>🌍</b>Переводчик</button>' +
      '<button class="qbtn" data-go="dict"><b>📒</b>Мой словарь</button>' +
      '</div>' +
      '<h2>🗂 Разделы <button data-go="library">Все</button></h2><div class="hscroll" id="cats"></div>' +
      '<h2>🎭 Настроение</h2><div class="chips" id="moods"></div>' +
      '<h2>💎 Слово дня</h2><div id="wday"></div>' +
      '<h2>🧭 Совет дня</h2><div class="surface tip"><b>' + TIPS[t % TIPS.length][0] + '</b><div>' + TIPS[t % TIPS.length][1] + '</div></div>';

    var daily = dailyItem();
    var dc = cardEl(daily, { sheet: true });
    $('#daily', root).appendChild(dc);

    var cats = $('#cats', root);
    CATS.forEach(function (c) { cats.appendChild(catTile(c)); });

    var moods = $('#moods', root);
    MOODS.forEach(function (m) {
      var b = h('button', { class: 'chip' }, m.emoji + ' ' + m.name);
      b.addEventListener('click', function () { openFeed({ cat: null, mood: m.key }); });
      moods.appendChild(b);
    });

    var wd = dailyWord();
    var wbox = h('div', { class: 'surface wordday' });
    wbox.innerHTML = '<div class="grow"><div class="w-en serif">' + esc(wd.en) + '</div><div class="w-ru">' + esc(wd.ru) + '</div></div>';
    var s1 = h('button', { class: 'iconbtn' }, I.vol); s1.addEventListener('click', function () { tts.speak(wd.en, s1, 0.85); });
    var a1 = h('button', { class: 'iconbtn' + (S.words[wd.en] ? ' on' : '') }, S.words[wd.en] ? I.check : I.plus);
    a1.addEventListener('click', function () { if (addWord(wd.en, wd.ru)) { a1.innerHTML = I.check; a1.classList.add('on'); toast('📒 Слово дня в словаре'); } });
    wbox.appendChild(s1); wbox.appendChild(a1);
    $('#wday', root).appendChild(wbox);

    root.onclick = function (e) {
      var g = e.target.closest('[data-go]'); if (!g) return;
      go(g.getAttribute('data-go'));
    };
  };
  function go(where) {
    haptic('light');
    if (where === 'feed') openFeed(feedState.filter, true);
    else if (where === 'review') startReview();
    else if (where === 'practice') showTab('practice');
    else if (where === 'library') showTab('library');
    else if (where === 'stories') { showTab('library'); setTimeout(function () { var s = $('#stories'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }, 60); }
    else if (where === 'translator') openTranslator();
    else if (where === 'dict') openDictionary();
    else if (where === 'settings') openSettings();
  }
  function catTile(c) {
    var total = BY_CAT[c.key].length, seen = BY_CAT[c.key].filter(function (it) { return S.seen[it.id]; }).length;
    var b = h('button', { class: 'cattile', style: '--c:' + c.color });
    b.innerHTML = '<b>' + c.emoji + '</b><span>' + esc(c.name) + '</span><small>' + seen + ' / ' + total + '</small><div class="mbar"><i style="width:' + (total ? seen / total * 100 : 0) + '%"></i></div>';
    b.addEventListener('click', function () { openCategory(c.key); });
    return b;
  }

  // =====================================================================
  // 12. Лента
  // =====================================================================
  var feedState = { filter: { cat: null, mood: null, lvl: 0 }, queue: [], rendered: 0, active: null, built: false };
  function openFeed(filter, keepIfSame) {
    var f = filter || { cat: null, mood: null, lvl: 0 };
    var same = feedState.built && f.cat === feedState.filter.cat && f.mood === feedState.filter.mood && (f.lvl || 0) === (feedState.filter.lvl || 0);
    feedState.filter = { cat: f.cat || null, mood: f.mood || null, lvl: f.lvl || 0 };
    if (!(keepIfSame && same)) feedState.built = false;
    showTab('feed', feedState.built);
  }
  function feedMatches(it) {
    var f = feedState.filter;
    return (!f.cat || it.c === f.cat) && (!f.mood || it.t.indexOf(f.mood) >= 0) && (!f.lvl || it.l === f.lvl);
  }
  function buildQueue() {
    var arr = ITEMS.filter(feedMatches);
    var unseen = shuffle(arr.filter(function (it) { return !S.seen[it.id]; }));
    var seen = shuffle(arr.filter(function (it) { return S.seen[it.id]; }));
    feedState.queue = unseen.concat(seen);
    feedState.rendered = 0;
  }
  function filterLabel() {
    var f = feedState.filter, parts = [];
    if (f.cat) parts.push(CAT[f.cat].emoji + ' ' + CAT[f.cat].name);
    if (f.lvl) parts.push(['', 'Лёгкие', 'Средние', 'Сложные'][f.lvl]);
    return parts.length ? parts.join(' · ') : 'Все разделы';
  }
  var feedObserver = null;
  RENDER.feed = function (root) {
    feedState.built = true;
    buildQueue();
    root.innerHTML = '';
    var wrap = h('div', { class: 'feedwrap' });
    var top = h('div', { class: 'feedtop' });
    var fb = h('button', { class: 'filterbtn' }, I.filter + '<span>' + esc(filterLabel()) + '</span>');
    fb.addEventListener('click', filterSheet);
    var chips = h('div', { class: 'chips' });
    var all = h('button', { class: 'chip' + (!feedState.filter.mood ? ' on' : '') }, '✨ Всё');
    all.addEventListener('click', function () { openFeed({ cat: feedState.filter.cat, mood: null, lvl: feedState.filter.lvl }); });
    chips.appendChild(all);
    MOODS.forEach(function (m) {
      var b = h('button', { class: 'chip' + (feedState.filter.mood === m.key ? ' on' : '') }, m.emoji + ' ' + m.name);
      b.addEventListener('click', function () { openFeed({ cat: feedState.filter.cat, mood: feedState.filter.mood === m.key ? null : m.key, lvl: feedState.filter.lvl }); });
      chips.appendChild(b);
    });
    top.appendChild(fb); top.appendChild(chips);
    var feed = h('div', { class: 'feed', id: 'feed' });
    wrap.appendChild(top); wrap.appendChild(feed);
    root.appendChild(wrap);
    setTimeout(function () { var on = $('.chip.on', chips); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 30);

    if (feedObserver) feedObserver.disconnect();
    feedObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          var slot = en.target, idx = +slot.getAttribute('data-i');
          if (feedState.active !== slot) { tts.stop(); feedState.active = slot; }
          var it = BY_ID[slot.getAttribute('data-id')];
          if (it) setTimeout(function () { if (feedState.active === slot) { if (markSeen(it)) {} } }, 900);
          if (idx >= feedState.rendered - 3) appendFeed(5);
        }
      });
    }, { root: feed, threshold: [0.6] });

    sizeFeed();
    if (!feedState.queue.length) {
      feed.innerHTML = '<div class="slot"><div class="fcard"><div class="endcard"><b style="font-size:48px">🔍</b><div>По этому фильтру ничего нет.</div></div></div></div>';
      return;
    }
    appendFeed(6);
  };
  function appendFeed(n) {
    var feed = $('#feed'); if (!feed) return;
    for (var k = 0; k < n; k++) {
      if (feedState.rendered >= feedState.queue.length) {
        // круг пройден — начинаем новый, перемешав заново
        var q = shuffle(ITEMS.filter(feedMatches));
        if (!q.length) return;
        feedState.queue = feedState.queue.concat(q);
      }
      var it = feedState.queue[feedState.rendered];
      var slot = h('div', { class: 'slot', 'data-i': feedState.rendered, 'data-id': it.id });
      slot.appendChild(cardEl(it, { onRated: onFeedRated }));
      feed.appendChild(slot);
      feedObserver.observe(slot);
      feedState.rendered++;
    }
  }
  function onFeedRated(it) {
    if (!S.set.auto) return;
    setTimeout(function () {
      var cur = feedState.active; if (!cur) return;
      var nx = cur.nextElementSibling;
      if (nx) $('#feed').scrollTo({ top: nx.offsetTop, behavior: 'smooth' });
    }, 650);
  }
  function sizeFeed() {
    var feed = $('#feed'); if (!feed) return;
    var hgt = feed.clientHeight;
    if (hgt > 100) document.documentElement.style.setProperty('--card-h', hgt + 'px');
  }
  window.addEventListener('resize', sizeFeed);
  if (tg && tg.onEvent) { try { tg.onEvent('viewportChanged', function () { setTimeout(sizeFeed, 50); }); } catch (e) {} }

  function filterSheet() {
    var f = { cat: feedState.filter.cat, mood: feedState.filter.mood, lvl: feedState.filter.lvl };
    openSheet(function (sh) {
      sh.appendChild(h('h2', { style: 'margin-top:4px' }, 'Раздел'));
      var cg = h('div', { class: 'chips', style: 'flex-wrap:wrap;margin:0;padding:0' });
      var mk = function (key, label) {
        var b = h('button', { class: 'chip' + (f.cat === key ? ' on' : '') }, label);
        b.addEventListener('click', function () { f.cat = key; $$('.chip', cg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); haptic('select'); });
        cg.appendChild(b);
      };
      mk(null, '✨ Все');
      CATS.forEach(function (c) { mk(c.key, c.emoji + ' ' + c.name); });
      sh.appendChild(cg);
      sh.appendChild(h('h2', {}, 'Сложность'));
      var seg = h('div', { class: 'seg' });
      ['Любая', 'Лёгкие', 'Средние', 'Сложные'].forEach(function (lbl, i) {
        var b = h('button', { class: f.lvl === i ? 'on' : '' }, lbl);
        b.addEventListener('click', function () { f.lvl = i; $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); haptic('select'); });
        seg.appendChild(b);
      });
      sh.appendChild(seg);
      var ok = h('button', { class: 'btn primary block mt' }, 'Показать');
      ok.addEventListener('click', function () { popLayer(); setTimeout(function () { openFeed(f); }, 240); });
      sh.appendChild(ok);
    });
  }

  // =====================================================================
  // 13. Читалка: рассказы, разделы, поиск, избранное
  // =====================================================================
  RENDER.library = function (root) {
    root.innerHTML =
      '<div class="topline"><h1 style="margin:0">Читалка</h1><button class="iconbtn" id="favbtn" aria-label="Избранное">' + I.heart + '</button></div>' +
      '<div class="search">' + I.search + '<input id="q" type="search" placeholder="Поиск: Naruto, love, Шекспир, судьба…" autocomplete="off"></div>' +
      '<div id="results"></div>' +
      '<div id="libmain">' +
      '<h2 id="stories">📖 Рассказы целиком</h2><div class="list" id="storylist"></div>' +
      '<h2>🗂 Разделы</h2><div class="catgrid" id="catgrid"></div>' +
      '</div>';
    var sl = $('#storylist', root);
    var colors = { creepy: '#a855f7', dark: '#64748b', touching: '#ff6a8d', love: '#ff4f9a', funny: '#f5a524', weird: '#14b8a6', motivation: '#22c55e' };
    STORIES.forEach(function (s) {
      var prog = S.stories[s.id] || {}, p = prog.done ? 1 : (prog.p || 0) / s.paras.length;
      var b = h('button', { class: 'storycard', style: '--c:' + (colors[s.tags[0]] || 'var(--accent)') });
      b.innerHTML = '<div class="st-title serif">' + esc(s.title) + '</div>' +
        '<div class="st-meta">' + esc(s.author) + ' · ' + esc(s.year) + ' · ' + s.minutes + ' мин · ' + s.tags.map(function (t) { return MOOD[t] ? MOOD[t].emoji : ''; }).join('') + (prog.done ? ' · ✅ прочитано' : '') + '</div>' +
        '<div class="st-about">' + esc(s.about) + '</div>' +
        '<div class="bar"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
      b.addEventListener('click', function () { openStory(s.id); });
      sl.appendChild(b);
    });
    var cg = $('#catgrid', root);
    CATS.forEach(function (c) { cg.appendChild(catTile(c)); });
    $('#favbtn', root).addEventListener('click', openFavorites);
    var q = $('#q', root), timer;
    q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { doSearch(q.value, root); }, 180); });
  };
  function doSearch(qs, root) {
    var res = $('#results', root), main = $('#libmain', root);
    qs = qs.trim().toLowerCase();
    if (qs.length < 2) { res.innerHTML = ''; main.classList.remove('hidden'); return; }
    main.classList.add('hidden');
    var found = ITEMS.filter(function (it) {
      return it.en.toLowerCase().indexOf(qs) >= 0 || it.ru.toLowerCase().indexOf(qs) >= 0 || (it.a || '').toLowerCase().indexOf(qs) >= 0 || (it.s || '').toLowerCase().indexOf(qs) >= 0;
    });
    res.innerHTML = '<h2>Найдено: ' + found.length + '</h2>';
    var list = h('div', { class: 'list' });
    found.slice(0, 80).forEach(function (it) { list.appendChild(rowItem(it)); });
    if (!found.length) list.innerHTML = '<div class="empty"><b>🔎</b>Ничего не нашлось. Попробуй другое слово — по-английски или по-русски.</div>';
    res.appendChild(list);
  }
  function rowItem(it) {
    var c = CAT[it.c];
    var b = h('button', { class: 'row-item', style: '--c:' + c.color });
    var first = it.en.split('\n')[0];
    b.innerHTML = '<div class="em">' + c.emoji + '</div><div class="tx"><div class="t serif">' + esc(first.length > 160 ? first.slice(0, 157) + '…' : first) + '</div>' +
      '<div class="a">' + (it.a || it.s ? esc(it.a || it.s) : esc(c.name)) + '</div></div>' +
      '<div class="marks">' + (S.fav[it.id] ? '❤️' : '') + (S.rate[it.id] ? ['😵', '🤏', '😎'][S.rate[it.id].g] : S.seen[it.id] ? '✓' : '') + '</div>';
    b.addEventListener('click', function () { itemSheet(it); });
    return b;
  }
  function openCategory(key) {
    var c = CAT[key], items = BY_CAT[key];
    pushLayer(c.emoji + ' ' + esc(c.name), function (body) {
      var seen = items.filter(function (it) { return S.seen[it.id]; }).length;
      body.innerHTML = '<div class="sub" style="margin-bottom:6px">' + esc(c.desc) + '</div><div class="sub" style="margin-bottom:14px">' + items.length + ' ' + plural(items.length, 'запись', 'записи', 'записей') + ' · прочитано ' + seen + '</div>';
      var play = h('button', { class: 'btn primary block' }, I.play + ' Читать лентой');
      play.addEventListener('click', function () { openFeed({ cat: key }); });
      body.appendChild(play);
      body.appendChild(h('div', { class: 'spacer' }));
      var list = h('div', { class: 'list' });
      items.forEach(function (it) { list.appendChild(rowItem(it)); });
      body.appendChild(list);
    });
  }
  function openFavorites() {
    pushLayer('❤️ Избранное', function (body) {
      var ids = Object.keys(S.fav).sort(function (a, b) { return S.fav[b] - S.fav[a]; }).filter(function (id) { return BY_ID[id]; });
      if (!ids.length) { body.innerHTML = '<div class="empty"><b>🤍</b>Пока пусто.<br>Нажми ♥ на карточке или дважды тапни по ней — она появится здесь.</div>'; return; }
      var list = h('div', { class: 'list' });
      ids.forEach(function (id) { list.appendChild(rowItem(BY_ID[id])); });
      body.appendChild(list);
    });
  }

  // Рассказ с параллельным переводом
  function openStory(id) {
    var s = STORY[id];
    var prog = S.stories[id] || (S.stories[id] = { p: 0, done: false, read: {} });
    if (!prog.read) prog.read = {};
    var mode = S.set.hide ? 'think' : 'parallel';
    pushLayer(esc(s.title), function (body, L) {
      var head = h('div', { class: 'reader-head' });
      head.innerHTML = '<div class="t serif">' + esc(s.title) + '</div><div class="m">' + esc(s.author) + ' · ' + esc(s.year) + ' · ' + s.minutes + ' мин · ' + s.paras.length + ' абзацев</div><div class="ab">' + esc(s.about) + '</div>';
      body.appendChild(head);
      var seg = h('div', { class: 'seg' });
      [['think', '🤔 Сначала сам'], ['parallel', '📖 Параллельно']].forEach(function (m) {
        var b = h('button', { class: mode === m[0] ? 'on' : '' }, m[1]);
        b.addEventListener('click', function () {
          mode = m[0]; $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
          $$('.para', body).forEach(function (p) { p.querySelector('.ru').classList.toggle('hidden', mode === 'think' && !p.classList.contains('shown')); });
        });
        seg.appendChild(b);
      });
      body.appendChild(seg);
      var wrap = h('div', { class: 'mt' });
      s.paras.forEach(function (p, i) {
        var pit = { id: s.id + ':' + i, en: p.en, ru: p.ru, w: p.w || [], c: 'books' };
        var el = h('div', { class: 'para' + (prog.read[i] ? ' read' : ''), 'data-i': i });
        el.innerHTML = '<div class="num">' + (i + 1) + '</div><div class="en serif">' + wordsHTML(p.en, p.w) + '</div>' +
          '<div class="tools"><button data-a="tr">' + I.eye + ' Перевод</button><button data-a="say">' + I.vol + ' Слушать</button>' + ((p.w || []).length ? '<button data-a="w">' + I.words + ' Слова · ' + p.w.length + '</button>' : '') + '</div>' +
          '<div class="ru serif' + (mode === 'think' ? ' hidden' : '') + '">' + esc(p.ru) + '</div>';
        el.addEventListener('click', function (e) {
          var w = e.target.closest('.w'); if (w) { wordSheet(w.textContent, pit, w); return; }
          var a = e.target.closest('[data-a]'); if (!a) return;
          var act = a.getAttribute('data-a');
          if (act === 'tr') {
            var ru = el.querySelector('.ru'); ru.classList.toggle('hidden'); el.classList.add('shown');
            markPara(i, el);
          } else if (act === 'say') { if (a.classList.contains('playing')) tts.stop(); else tts.speak(p.en, a); }
          else if (act === 'w') wordsSheet(pit);
        });
        wrap.appendChild(el);
      });
      body.appendChild(wrap);
      var fin = h('div', { class: 'finish' });
      var fb = h('button', { class: 'btn primary' }, prog.done ? '✅ Рассказ прочитан' : '🎉 Я дочитал рассказ!');
      fb.addEventListener('click', function () {
        if (prog.done) return;
        prog.done = true; prog.p = s.paras.length;
        activity(3); addXP(30, fb); confetti(); haptic('success');
        fb.textContent = '✅ Рассказ прочитан';
        checkAch(); save();
      });
      fin.appendChild(fb);
      body.appendChild(fin);

      // абзац считается прочитанным, когда его пролистали
      var obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (!en.isIntersecting && en.boundingClientRect.top < 0) markPara(+en.target.getAttribute('data-i'), en.target); });
      }, { root: L, threshold: 0 });
      $$('.para', wrap).forEach(function (p) { obs.observe(p); });
      // вернуться к месту, где остановился
      if (prog.p > 1 && !prog.done) setTimeout(function () {
        var target = $('.para[data-i="' + Math.min(prog.p, s.paras.length - 1) + '"]', wrap);
        if (target) { L.scrollTo({ top: target.offsetTop - 70 }); toast('📍 Продолжаем с абзаца ' + (prog.p + 1)); }
      }, 320);
    }, { onClose: function () { save(); if (curTab === 'library') RENDER.library($('.tab[data-tab=library]')); } });

    function markPara(i, el) {
      if (prog.read[i]) return;
      prog.read[i] = 1;
      prog.p = Math.max(prog.p, i + 1);
      el.classList.add('read');
      S.xp += 1; activity(1);
      save();
    }
  }

  // =====================================================================
  // 14. Тренировка: повторение, квизы, словарь
  // =====================================================================
  var MODES = [
    ['w2r', '🔤', 'Слово → перевод', 'Выбери верный перевод', '#8b7bff'],
    ['r2w', '🔄', 'Перевод → слово', 'Вспомни английское слово', '#36c2ff'],
    ['cloze', '✍️', 'Вставь слово', 'Восстанови цитату', '#22c55e'],
    ['listen', '🎧', 'На слух', 'Послушай и пойми', '#f5a524'],
    ['who', '🗣', 'Кто это сказал?', 'Герои, злодеи, гении', '#d946ef'],
    ['anime', '🌸', 'Угадай аниме', 'Для настоящих отаку', '#ff4f9a'],
    ['aorp', '🎭', 'Аниме или философ?', 'Сложнее, чем кажется', '#14b8a6'],
    ['tf', '🤯', 'Правда или ложь?', 'Странные факты', '#ef4444']
  ];
  RENDER.practice = function (root) {
    var ds = dueSentences().length, dw = dueWords().length, total = ds + dw;
    root.innerHTML = '<h1>Тренировка</h1><div class="sub">Повторяй вовремя — и слова останутся в голове навсегда</div><div class="spacer"></div>';
    var rb = h('div', { class: 'surface reviewbox' });
    rb.innerHTML = '<div class="num">' + total + '</div><div class="tx"><b>' + (total ? 'Пора повторить' : 'Всё повторено ✨') + '</b>' +
      (total ? ds + ' ' + plural(ds, 'карточка', 'карточки', 'карточек') + ' и ' + dw + ' ' + plural(dw, 'слово', 'слова', 'слов') : 'Новые карточки появятся, когда подойдёт их время') + '</div>';
    var rbtn = h('button', { class: 'btn primary sm' + (total ? '' : ' hidden') }, 'Начать');
    rbtn.addEventListener('click', startReview);
    rb.appendChild(rbtn);
    root.appendChild(rb);
    root.appendChild(h('h2', {}, '🎯 Квизы <span class="faint" style="text-transform:none;letter-spacing:0">рекорд: ' + S.quiz.best + '/10</span>'));
    var mg = h('div', { class: 'modes' });
    MODES.forEach(function (m) {
      var b = h('button', { class: 'mode', style: '--c:' + m[4] });
      b.innerHTML = '<b>' + m[1] + '</b><span>' + m[2] + '</span><small>' + m[3] + '</small>';
      b.addEventListener('click', function () { startQuiz(m[0]); });
      mg.appendChild(b);
    });
    root.appendChild(mg);
    root.appendChild(h('h2', {}, '📒 Мой словарь'));
    var n = Object.keys(S.words).length;
    var db = h('button', { class: 'surface reviewbox', style: 'width:100%;text-align:left' });
    db.innerHTML = '<div class="num">' + n + '</div><div class="tx"><b>' + plural(n, 'слово', 'слова', 'слов') + ' в словаре</b>Нажимай на слова в карточках и добавляй их сюда</div>';
    db.addEventListener('click', openDictionary);
    root.appendChild(db);
  };

  function openDictionary() {
    pushLayer('📒 Мой словарь', function (body) {
      var keys = Object.keys(S.words).sort(function (a, b) { return S.words[b].at - S.words[a].at; });
      if (!keys.length) { body.innerHTML = '<div class="empty"><b>📒</b>Словарь пока пуст.<br>Нажми на любое слово в карточке и выбери «В мой словарь».</div>'; return; }
      var tr = h('button', { class: 'btn primary block' }, '🃏 Тренировать карточки (' + keys.length + ')');
      tr.addEventListener('click', function () { startFlash(shuffle(keys)); });
      body.appendChild(tr);
      body.appendChild(h('div', { class: 'spacer' }));
      var list = h('div', { class: 'wlist' });
      keys.forEach(function (k) { list.appendChild(wordRow(S.words[k].en, S.words[k].ru, '', { del: true })); });
      body.appendChild(list);
    }, { onClose: function () { if (curTab === 'practice') RENDER.practice($('.tab[data-tab=practice]')); } });
  }

  // Повторение: сначала карточки, потом слова
  function startReview() {
    var ids = shuffle(dueSentences()), words = shuffle(dueWords());
    if (!ids.length && !words.length) { toast('✨ Сейчас нечего повторять — читай ленту!'); return; }
    var i = 0, total = ids.length, done = 0;
    pushLayer('🔁 Повторение', function (body) {
      var bar = h('div', {}), box = h('div', {});
      body.appendChild(bar); body.appendChild(box);
      function next() {
        if (i >= ids.length) {
          if (words.length) { popLayer(); setTimeout(function () { startFlash(words, true); }, 250); return; }
          return finish();
        }
        bar.innerHTML = '<div class="qtop"><span>Карточка ' + (i + 1) + ' из ' + total + '</span><span>✅ ' + done + '</span></div><div class="qprog"><i style="width:' + (i / total * 100) + '%"></i></div>';
        box.innerHTML = '';
        var it = BY_ID[ids[i]];
        var card = cardEl(it, { sheet: true, review: true, onRated: function () { done++; S.st.rev++; i++; setTimeout(next, 450); } });
        box.appendChild(card);
      }
      function finish() {
        box.innerHTML = '<div class="result"><div class="score">✓</div><div class="msg">Повторение завершено!</div><div class="sub">Повторено: ' + done + '</div></div>';
        bar.innerHTML = '';
        var b = h('button', { class: 'btn primary block' }, 'Готово'); b.addEventListener('click', popLayer); box.appendChild(b);
        confetti(); haptic('success'); checkAch(); save();
      }
      next();
    }, { onClose: function () { refreshBadges(); if (curTab === 'practice') RENDER.practice($('.tab[data-tab=practice]')); if (curTab === 'home') RENDER.home($('.tab[data-tab=home]')); } });
  }

  // Флеш-карточки для слов
  function startFlash(keys, isReview) {
    keys = keys.filter(function (k) { return S.words[k]; });
    if (!keys.length) return;
    var i = 0, known = 0;
    pushLayer(isReview ? '🔁 Повторение слов' : '🃏 Карточки слов', function (body) {
      function show() {
        if (i >= keys.length) {
          body.innerHTML = '<div class="result"><div class="score">' + known + '/' + keys.length + '</div><div class="msg">' + (known === keys.length ? 'Ты знаешь все слова! 🌟' : 'Отлично потренировались! 💪') + '</div><div class="sub">Слова «Забыл» вернутся уже завтра</div></div>';
          var b = h('button', { class: 'btn primary block' }, 'Готово'); b.addEventListener('click', popLayer); body.appendChild(b);
          checkAch(); save(); refreshBadges();
          return;
        }
        var w = S.words[keys[i]];
        body.innerHTML = '<div class="qtop"><span>Слово ' + (i + 1) + ' из ' + keys.length + '</span><span>✅ ' + known + '</span></div><div class="qprog"><i style="width:' + (i / keys.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface flash' });
        card.innerHTML = '<div class="big serif">' + esc(w.en) + '</div><div class="veil" style="margin-top:20px"><div class="flag">Перевод</div><div class="ru">' + esc(w.ru) + '</div><div class="cover">🤔 Вспомни перевод<b>Нажми, чтобы проверить</b></div></div>';
        body.appendChild(card);
        var say = h('button', { class: 'btn sm ghost mt' }, I.vol + ' Произнести');
        say.addEventListener('click', function () { tts.speak(w.en, null, 0.85); });
        card.appendChild(say);
        var rate = h('div', { class: 'rate3 hidden' }, '<button data-g="0"><b>😵</b>Забыл</button><button data-g="1"><b>🤔</b>Трудно</button><button data-g="2" class="g2"><b>😎</b>Знаю</button>');
        body.appendChild(rate);
        card.querySelector('.veil').addEventListener('click', function () { this.classList.add('open'); rate.classList.remove('hidden'); haptic('light'); });
        rate.addEventListener('click', function (e) {
          var g = e.target.closest('[data-g]'); if (!g) return;
          var grade = +g.getAttribute('data-g');
          rateWord(keys[i], grade);
          if (grade === 2) known++;
          activity(1); addXP(grade === 2 ? 2 : 1, g);
          i++; save(); setTimeout(show, 250);
        });
        setTimeout(function () { tts.speak(w.en, null, 0.85); }, 200);
      }
      show();
    }, { onClose: function () { refreshBadges(); if (curTab === 'practice') RENDER.practice($('.tab[data-tab=practice]')); } });
  }

  // ---------- Квизы ----------
  function singleWordGloss() { return Object.keys(GLOSS).filter(function (k) { return /^[a-z][a-z'-]+$/.test(k) && k.length > 2; }); }
  function distinctOpts(correct, pool, n) {
    var out = [correct], seen = {}; seen[correct] = 1;
    shuffle(pool).some(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } return out.length >= n; });
    return shuffle(out);
  }
  function buildQuestions(mode) {
    var qs = [], words, pool;
    if (mode === 'w2r' || mode === 'r2w') {
      var mine = Object.keys(S.words).map(function (k) { return [S.words[k].en, S.words[k].ru]; });
      var seenW = [];
      Object.keys(S.seen).forEach(function (id) { var it = BY_ID[id]; if (it && it.w) it.w.forEach(function (p) { seenW.push(p); }); });
      var allW = Object.keys(GLOSS).map(function (k) { return [k, GLOSS[k]]; });
      words = mine.length >= 12 ? mine : seenW.length >= 30 ? seenW : allW;
      var ruPool = allW.map(function (p) { return p[1]; }), enPool = allW.map(function (p) { return p[0]; });
      shuffle(words).slice(0, 10).forEach(function (p) {
        if (mode === 'w2r') qs.push({ hint: 'Выбери перевод', q: p[0], say: p[0], ans: p[1], opts: distinctOpts(p[1], ruPool, 4) });
        else qs.push({ hint: 'Как это по-английски?', q: p[1], ans: p[0], opts: distinctOpts(p[0], enPool, 4), sayAns: true });
      });
    } else if (mode === 'cloze') {
      var sw = singleWordGloss();
      var cands = [];
      ITEMS.forEach(function (it) {
        if (it.en.length > 230 || !it.w) return;
        for (var j = 0; j < it.w.length; j++) {
          var w = it.w[j][0];
          if (!/^[A-Za-z]+$/.test(w) || w.length < 4) continue;
          var re = new RegExp('\\b' + w + '\\b', 'i');
          var m = it.en.match(re);
          if (m) { cands.push({ it: it, word: m[0], ru: it.w[j][1] }); break; }
        }
      });
      shuffle(cands).slice(0, 10).forEach(function (c) {
        var re = new RegExp('\\b' + c.word + '\\b');
        var parts = c.it.en.split(re);
        var html = esc(parts[0]) + '<span class="gap">?</span>' + esc(parts.slice(1).join(c.word));
        qs.push({ hint: 'Какое слово пропущено?', qhtml: html.replace(/\n/g, '<br>'), small: c.it.en.length > 90, ans: c.word, opts: distinctOpts(c.word, sw, 4), explain: '<b>' + esc(c.word) + '</b> — ' + esc(c.ru) + '<br><span class="muted">' + esc(c.it.ru) + '</span>', item: c.it });
      });
    } else if (mode === 'listen') {
      pool = ITEMS.filter(function (it) { return it.en.length < 90 && it.en.indexOf('\n') < 0 && ['twisters', 'idioms'].indexOf(it.c) < 0; });
      var ruP = pool.map(function (it) { return it.ru; });
      shuffle(pool).slice(0, 10).forEach(function (it) {
        qs.push({ hint: 'Послушай и выбери перевод', listen: it.en, ans: it.ru, opts: distinctOpts(it.ru, ruP, 4), explain: '<span class="serif">' + esc(it.en) + '</span>', item: it });
      });
    } else if (mode === 'who') {
      pool = ITEMS.filter(function (it) { return it.a && ['anime', 'movies', 'games', 'books', 'wisdom', 'speeches'].indexOf(it.c) >= 0 && it.en.length < 220; });
      shuffle(pool).slice(0, 10).forEach(function (it) {
        var same = BY_CAT[it.c].filter(function (x) { return x.a; }).map(function (x) { return x.a; });
        var others = pool.map(function (x) { return x.a; });
        var opts = distinctOpts(it.a, uniq(same).length >= 4 ? same : others, 4);
        qs.push({ hint: 'Кто это сказал?', q: it.en, small: it.en.length > 80, serif: true, ans: it.a, opts: opts, explain: '— <b>' + esc(it.a) + '</b>' + (it.s ? ', ' + esc(it.s) : '') + '<br><span class="muted">' + esc(it.ru) + '</span>', item: it });
      });
    } else if (mode === 'anime') {
      pool = BY_CAT.anime.filter(function (it) { return it.s && it.en.length < 220; });
      var titles = uniq(pool.map(function (it) { return it.s; }));
      shuffle(pool).slice(0, 10).forEach(function (it) {
        qs.push({ hint: 'Из какого это аниме?', q: it.en, small: it.en.length > 80, serif: true, ans: it.s, opts: distinctOpts(it.s, titles, 4), explain: '— <b>' + esc(it.a || '') + '</b>, ' + esc(it.s) + '<br><span class="muted">' + esc(it.ru) + '</span>', item: it });
      });
    } else if (mode === 'aorp') {
      var an = shuffle(BY_CAT.anime.filter(function (it) { return it.en.length < 200 && it.en.length > 25; })).slice(0, 5);
      var ph = shuffle(BY_CAT.wisdom.concat(BY_CAT.books).filter(function (it) { return it.en.length < 200 && it.en.length > 25; })).slice(0, 5);
      shuffle(an.concat(ph)).forEach(function (it) {
        var a = it.c === 'anime' ? '🌸 Аниме' : '🏛 Великий ум';
        qs.push({ hint: 'Аниме или великий ум?', q: it.en, small: it.en.length > 80, serif: true, ans: a, opts: ['🌸 Аниме', '🏛 Великий ум'], two: true, explain: '— <b>' + esc(it.a || '') + '</b>' + (it.s ? ', ' + esc(it.s) : '') + '<br><span class="muted">' + esc(it.ru) + '</span>', item: it });
      });
    } else if (mode === 'tf') {
      // Правда или ложь: настоящий факт или факт с подменённым числом/словом
      var facts = shuffle(BY_CAT.facts).slice(0, 10);
      facts.forEach(function (it) {
        var fake = fakeFact(it.en);
        var isTrue = !fake || Math.random() < 0.5;
        qs.push({ hint: 'Правда или ложь?', q: isTrue ? it.en : fake, small: true, serif: true, ans: isTrue ? '✅ Правда' : '❌ Ложь', opts: ['✅ Правда', '❌ Ложь'], two: true, explain: (isTrue ? '' : 'На самом деле: ') + '<span class="serif">' + esc(it.en) + '</span><br><span class="muted">' + esc(it.ru) + (it.n ? '<br>💡 ' + esc(it.n) : '') + '</span>', item: it });
      });
    }
    return qs;
  }
  function fakeFact(en) {
    var swaps = [[/\bthree\b/, 'five'], [/\bblue\b/, 'green'], [/\bberries\b/, 'nuts'], [/\bfeet\b/, 'wings'], [/\bcube-shaped\b/, 'star-shaped'], [/\blonger\b/, 'shorter'], [/\bbefore\b/, 'after'], [/\bolder\b/, 'younger'], [/\bmore\b/, 'fewer'], [/\btaller\b/, 'shorter'], [/\bfive times hotter\b/, 'twice as cold'], [/\beight minutes\b/, 'eight hours'], [/\b(\d+)\b/, function (m) { return String(Math.round(+m * 3 + 7)); }], [/\bRussian\b/, 'French'], [/\bCzech\b/, 'Greek'], [/\bnever\b/, 'often']];
    for (var i = 0; i < swaps.length; i++) if (swaps[i][0].test(en)) return en.replace(swaps[i][0], swaps[i][1]);
    return null;
  }

  function startQuiz(mode) {
    var qs = buildQuestions(mode);
    if (!qs.length) { toast('Недостаточно материала для этого квиза'); return; }
    var meta = MODES.filter(function (m) { return m[0] === mode; })[0];
    var i = 0, score = 0, xp = 0;
    S.quiz.played++;
    pushLayer(meta[1] + ' ' + meta[2], function (body) {
      function show() {
        if (i >= qs.length) return result();
        var q = qs[i];
        body.innerHTML = '<div class="qtop"><span>Вопрос ' + (i + 1) + ' из ' + qs.length + '</span><span>✅ ' + score + '</span></div><div class="qprog"><i style="width:' + (i / qs.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface qcard' });
        card.innerHTML = '<div class="hint">' + q.hint + '</div>' +
          (q.listen ? '<button class="btn primary" id="play">' + I.vol + ' Слушать ещё раз</button>' :
            '<div class="q' + (q.small ? ' small' : '') + (q.serif || q.qhtml ? ' serif' : '') + '">' + (q.qhtml || esc(q.q)) + '</div>') +
          (q.say ? '<div class="extra"><button class="btn sm ghost" id="say">' + I.vol + ' Произношение</button></div>' : '');
        body.appendChild(card);
        if (q.listen) { var pb = $('#play', card); pb.addEventListener('click', function () { tts.speak(q.listen, pb, 0.85); }); setTimeout(function () { tts.speak(q.listen, pb, 0.85); }, 250); }
        if (q.say) { var sb = $('#say', card); sb.addEventListener('click', function () { tts.speak(q.say, null, 0.85); }); }
        var opts = h('div', { class: 'opts' + (q.two ? ' two' : '') });
        q.opts.forEach(function (o) {
          var b = h('button', { class: 'opt' }, esc(o));
          b.addEventListener('click', function () { answer(o, b, opts); });
          opts.appendChild(b);
        });
        body.appendChild(opts);
      }
      var locked = false;
      function answer(o, b, opts) {
        if (locked) return; locked = true;
        var q = qs[i], ok = o === q.ans;
        $$('.opt', opts).forEach(function (x) {
          if (x.textContent === q.ans) x.classList.add('good');
          else if (x !== b) x.classList.add('dim');
        });
        if (ok) { score++; xp += 2; S.st.qc++; addXP(2, b); haptic('success'); } else { b.classList.add('bad'); haptic('error'); }
        activity(1);
        if (q.sayAns) tts.speak(q.ans, null, 0.85);
        if (q.item) markSeen(q.item);
        var needNext = !ok || q.explain;
        if (needNext) {
          if (q.explain) body.appendChild(h('div', { class: 'explain' }, q.explain));
          var nb = h('button', { class: 'btn primary block mt' }, i + 1 < qs.length ? 'Дальше →' : 'Результат');
          nb.addEventListener('click', function () { i++; locked = false; show(); });
          body.appendChild(nb);
          nb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else setTimeout(function () { i++; locked = false; show(); }, 700);
      }
      function result() {
        var perfect = score === qs.length && qs.length >= 10;
        if (perfect) { S.quiz.perfect++; S.xp += 10; xp += 10; }
        var record = score > S.quiz.best;
        if (record) S.quiz.best = score;
        var msg = score >= 9 ? 'Великолепно! 🌟' : score >= 7 ? 'Очень хорошо! 💪' : score >= 5 ? 'Неплохо! Дальше — лучше 📖' : 'Не сдавайся — повторение творит чудеса 🦉';
        body.innerHTML = '<div class="result"><div class="score">' + score + '/' + qs.length + '</div><div class="msg">' + msg + '</div><div class="sub">+' + xp + ' XP' + (record ? ' · 🏆 Новый рекорд!' : '') + (perfect ? ' · бонус за 10/10!' : '') + '</div></div>';
        var again = h('button', { class: 'btn primary block' }, 'Ещё раз');
        again.addEventListener('click', function () { popLayer(); setTimeout(function () { startQuiz(mode); }, 240); });
        var back = h('button', { class: 'btn block mt' }, 'К тренировкам');
        back.addEventListener('click', popLayer);
        body.appendChild(again); body.appendChild(back);
        if (score >= 7) confetti();
        haptic('success'); checkAch(); save();
      }
      show();
    }, { onClose: function () { if (curTab === 'practice') RENDER.practice($('.tab[data-tab=practice]')); } });
  }

  // =====================================================================
  // 15. Переводчик
  // =====================================================================
  function openTranslator(prefill) {
    pushLayer('🌍 Переводчик', function (body) {
      body.innerHTML = '<div class="sub" style="margin-bottom:12px">Пиши по-русски или по-английски — язык я определю сам.</div>';
      var box = h('div', { class: 'surface trbox' });
      var ta = h('textarea', { placeholder: 'Например: «Удача любит смелых» или «Fortune favors the bold»', maxlength: '500' });
      if (prefill) ta.value = prefill;
      var bar = h('div', { class: 'trbar' });
      var dir = h('div', { class: 'dir' }, 'EN → RU');
      var goBtn = h('button', { class: 'btn primary sm' }, 'Перевести');
      bar.appendChild(dir); bar.appendChild(goBtn);
      box.appendChild(ta); box.appendChild(bar);
      body.appendChild(box);
      var out = h('div', {}); body.appendChild(out);
      var hist = h('div', {}); body.appendChild(hist);
      var upd = function () { dir.textContent = isRu(ta.value) ? 'RU → EN' : 'EN → RU'; };
      ta.addEventListener('input', upd); upd();
      function renderHist() {
        hist.innerHTML = '';
        if (!S.trHist.length) return;
        hist.appendChild(h('h2', {}, '🕘 Недавние'));
        var list = h('div', { class: 'wlist' });
        S.trHist.slice(0, 15).forEach(function (p) {
          var row = h('button', { class: 'wrow', style: 'text-align:left;width:100%' }, '<div class="tx"><div class="en">' + esc(p[0]) + '</div><div class="ru">' + esc(p[1]) + '</div></div>');
          row.addEventListener('click', function () { ta.value = p[0]; upd(); run(); });
          list.appendChild(row);
        });
        hist.appendChild(list);
      }
      function run() {
        var text = ta.value.trim();
        if (!text) return;
        goBtn.disabled = true; goBtn.textContent = '…';
        translateText(text).then(function (res) {
          S.st.tr++; checkAch();
          var src = text, dst = res, en = isRu(text) ? res : text;
          S.trHist = [[src, dst]].concat(S.trHist.filter(function (p) { return p[0] !== src; })).slice(0, 30);
          save();
          out.innerHTML = '';
          var card = h('div', { class: 'surface trout serif' }, esc(dst));
          var tools = h('div', { class: 'tools' });
          var say = h('button', { class: 'btn sm' }, I.vol + ' Слушать');
          say.addEventListener('click', function () { tts.speak(en, say); });
          var copy = h('button', { class: 'btn sm' }, I.copy + ' Копировать');
          copy.addEventListener('click', function () { try { navigator.clipboard.writeText(dst); toast('Скопировано'); } catch (e) {} });
          tools.appendChild(say); tools.appendChild(copy);
          if (en.split(/\s+/).length <= 4) {
            var add = h('button', { class: 'btn sm' }, I.plus + ' В словарь');
            add.addEventListener('click', function () {
              var ruTxt = isRu(text) ? text : res;
              if (addWord(en, ruTxt)) { toast('📒 Добавлено в словарь'); add.disabled = true; }
            });
            tools.appendChild(add);
          }
          card.appendChild(tools);
          out.appendChild(card);
          renderHist();
          haptic('light');
        }).catch(function () {
          out.innerHTML = '';
          var card = h('div', { class: 'surface trout' }, 'Не получилось перевести — нет связи с сервисом перевода. ');
          var g = h('button', { class: 'btn sm mt' }, I.globe + ' Открыть Google Переводчик');
          g.addEventListener('click', function () { openGoogleTranslate(text); });
          card.appendChild(g); out.appendChild(card);
        }).then(function () { goBtn.disabled = false; goBtn.textContent = 'Перевести'; });
      }
      goBtn.addEventListener('click', run);
      renderHist();
      if (prefill) run(); else setTimeout(function () { ta.focus(); }, 300);
    });
  }

  // =====================================================================
  // 16. Профиль и настройки
  // =====================================================================
  RENDER.profile = function (root) {
    var lv = levelInfo(S.xp), u = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
    var rated = S.st.self + S.st.partial + S.st.miss;
    var selfPct = rated ? Math.round(S.st.self / rated * 100) : 0;
    root.innerHTML = '<div class="topline"><h1 style="margin:0">Профиль</h1><button class="iconbtn" id="setbtn" aria-label="Настройки">' + I.gear + '</button></div>';
    var prof = h('div', { class: 'surface prof' });
    prof.innerHTML = '<div class="avatar">' + (u && u.photo_url ? '<img src="' + esc(u.photo_url) + '" alt="">' : esc((userName()[0] || '?').toUpperCase())) + '</div>' +
      '<div style="flex:1;min-width:0"><div class="nm">' + esc(userName()) + '</div><div class="sub">' + lv.emoji + ' Уровень ' + lv.n + ' · ' + esc(lv.name) + '</div>' +
      '<div class="bar mt"><i style="width:' + Math.round(lv.pct * 100) + '%"></i></div><div class="faint" style="font-size:12px;margin-top:5px;font-weight:700">' + S.xp + ' XP' + (lv.next ? ' / ' + lv.to : '') + '</div></div>';
    root.appendChild(prof);
    root.appendChild(h('h2', {}, '📊 Статистика'));
    var st = h('div', { class: 'stats' });
    [[seenCount(), 'прочитано карточек'], [selfPct + '%', 'понял сам'], [Object.keys(S.words).length, 'слов в словаре'],
      ['🔥 ' + streakNow(), 'дней подряд'], [S.streak.best, 'лучшая серия'], [S.quiz.best + '/10', 'рекорд квиза'],
      [storiesDone() + '/' + STORIES.length, 'рассказов'], [Object.keys(S.fav).length, 'в избранном'], [Object.keys(S.ach).length + '/' + ACH.length, 'достижений']
    ].forEach(function (s) { st.appendChild(h('div', { class: 'stat' }, '<b>' + s[0] + '</b><small>' + s[1] + '</small>')); });
    root.appendChild(st);

    // Календарь активности за 15 недель
    root.appendChild(h('h2', {}, '🗓 Активность'));
    var hw = h('div', { class: 'surface heatwrap' });
    var grid = h('div', { class: 'heat' });
    var t = today(), weeks = 15;
    var dow = (new Date().getDay() + 6) % 7; // пн = 0
    var start = t - dow - (weeks - 1) * 7;
    var info = h('div', { class: 'heatinfo' }, 'Нажми на день, чтобы увидеть, сколько ты занимался');
    for (var d = start; d < start + weeks * 7; d++) {
      var n = S.days[d] || 0;
      var lvl = d > t ? -1 : n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4;
      var cell = h('i', { 'data-l': lvl < 0 ? '' : String(lvl), class: d === t ? 'today' : '', style: lvl < 0 ? 'opacity:.25' : '' });
      (function (dd, nn) { cell.addEventListener('click', function () { info.textContent = dayLabel(dd) + ': ' + nn + ' ' + plural(nn, 'действие', 'действия', 'действий'); haptic('select'); }); })(d, n);
      grid.appendChild(cell);
    }
    hw.appendChild(grid);
    hw.appendChild(h('div', { class: 'heatlegend' }, 'меньше <i style="background:var(--card2)"></i><i style="background:color-mix(in srgb,var(--accent) 30%,var(--card2))"></i><i style="background:color-mix(in srgb,var(--accent) 55%,var(--card2))"></i><i style="background:color-mix(in srgb,var(--accent) 80%,var(--card2))"></i><i style="background:var(--accent)"></i> больше'));
    hw.appendChild(info);
    root.appendChild(hw);

    root.appendChild(h('h2', {}, '🏅 Достижения <span class="faint" style="text-transform:none;letter-spacing:0">' + Object.keys(S.ach).length + ' из ' + ACH.length + '</span>'));
    var ag = h('div', { class: 'achgrid' });
    ACH.forEach(function (a) {
      var got = !!S.ach[a[0]];
      var b = h('button', { class: 'ach' + (got ? '' : ' locked') }, '<b>' + a[1] + '</b><small>' + esc(a[2]) + '</small>');
      b.addEventListener('click', function () { toast(a[1] + ' <b>' + esc(a[2]) + '</b><br><span class="muted">' + esc(a[3]) + (got ? ' · получено ✅' : '') + '</span>'); });
      ag.appendChild(b);
    });
    root.appendChild(ag);
    $('#setbtn', root).addEventListener('click', openSettings);
    var sb = h('button', { class: 'btn block mt' }, I.gear + ' Настройки');
    sb.addEventListener('click', openSettings);
    root.appendChild(h('div', { class: 'spacer' }));
    root.appendChild(sb);
    root.appendChild(h('div', { class: 'center faint mt', style: 'font-size:12px' }, 'Inkwell · ' + ITEMS.length + ' карточек · ' + STORIES.length + ' рассказов · сделано с ❤️'));
  };

  function openSettings() {
    pushLayer('⚙️ Настройки', function (body) {
      var box = h('div', { class: 'surface', style: 'overflow:hidden' });
      box.appendChild(h('div', { class: 'setrow' }, '<div class="lbl">Тема оформления</div>'));
      var th = h('div', { class: 'themes' });
      [['auto', '🤖 Как в Telegram'], ['night', '🌙 Ночь'], ['day', '☀️ День'], ['paper', '📜 Бумага'], ['sakura', '🌸 Сакура']].forEach(function (o) {
        var b = h('button', { class: S.set.theme === o[0] ? 'on' : '' }, o[1]);
        b.addEventListener('click', function () { S.set.theme = o[0]; save(); applyTheme(); $$('button', th).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); haptic('select'); });
        th.appendChild(b);
      });
      box.appendChild(th);
      box.appendChild(segRow('Размер текста', 'Для карточек и рассказов', [['0.9', 'A−'], ['1', 'A'], ['1.12', 'A+'], ['1.25', 'A++']], String(S.set.font), function (v) { S.set.font = +v; applyTheme(); }));
      box.appendChild(segRow('Цель дня', 'Сколько действий в день', [['10', '10'], ['15', '15'], ['25', '25'], ['40', '40']], String(S.set.goal), function (v) { S.set.goal = +v; }));
      box.appendChild(segRow('Скорость речи', 'Озвучка английского', [['0.7', '🐢'], ['0.9', 'Обычно'], ['1.05', '🐇']], String(S.set.rate), function (v) { S.set.rate = +v; tts.speak('This is how I sound.'); }));
      box.appendChild(switchRow('Сначала думай', 'Прятать перевод, пока сам не переведёшь', 'hide'));
      box.appendChild(switchRow('Автолистание', 'После оценки переходить к следующей карточке', 'auto'));
      body.appendChild(box);

      body.appendChild(h('h2', {}, '💾 Данные'));
      var info = h('div', { class: 'surface pad sub' }, cloud.ok() ? '☁️ Прогресс сохраняется в облаке Telegram — он будет с тобой на телефоне и на компьютере.' : '💾 Прогресс сохраняется на этом устройстве.');
      body.appendChild(info);
      var reset = h('button', { class: 'btn ghost block mt', style: 'color:var(--bad)' }, I.trash + ' Сбросить весь прогресс');
      reset.addEventListener('click', function () {
        var doIt = function (ok) { if (!ok) return; var keepSet = S.set; S = DEF(); S.set = keepSet; S.onb = true; save(); cloud.save(); toast('Прогресс сброшен'); closeAll(); showTab('home'); };
        if (ver('6.2')) tg.showConfirm('Точно сбросить весь прогресс? Это нельзя отменить.', doIt);
        else doIt(window.confirm('Точно сбросить весь прогресс? Это нельзя отменить.'));
      });
      body.appendChild(reset);
      var onb = h('button', { class: 'btn block mt' }, '👋 Показать приветствие ещё раз');
      onb.addEventListener('click', function () { closeAll(); onboarding(); });
      body.appendChild(onb);
    }, { onClose: function () { if (curTab === 'profile' || curTab === 'home') RENDER[curTab]($('.tab[data-tab=' + curTab + ']')); } });
  }
  function segRow(label, sub, opts, cur, onPick) {
    var row = h('div', { class: 'setrow' }, '<div class="lbl">' + label + '<small>' + sub + '</small></div>');
    var seg = h('div', { class: 'seg' });
    opts.forEach(function (o) {
      var b = h('button', { class: o[0] === cur ? 'on' : '' }, o[1]);
      b.addEventListener('click', function () { $$('button', seg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); onPick(o[0]); save(); haptic('select'); });
      seg.appendChild(b);
    });
    row.appendChild(seg);
    return row;
  }
  function switchRow(label, sub, key) {
    var row = h('div', { class: 'setrow' }, '<div class="lbl">' + label + '<small>' + sub + '</small></div>');
    var sw = h('button', { class: 'switch' + (S.set[key] ? ' on' : ''), 'aria-label': label });
    sw.addEventListener('click', function () { S.set[key] = !S.set[key]; sw.classList.toggle('on', S.set[key]); save(); haptic('select'); feedState.built = false; });
    row.appendChild(sw);
    return row;
  }

  // =====================================================================
  // 17. Тема и приветствие
  // =====================================================================
  var THEME_BG = { night: '#0b0d18', day: '#f4f5fb', paper: '#f3ead6', sakura: '#fff1f6' };
  function applyTheme() {
    var t = S.set.theme;
    if (t === 'auto') t = (tg && tg.colorScheme === 'light') || (!inTG && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'day' : 'night';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.setProperty('--fs', S.set.font);
    try {
      if (ver('6.1')) { tg.setHeaderColor(THEME_BG[t]); tg.setBackgroundColor(THEME_BG[t]); }
      if (ver('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(THEME_BG[t]);
    } catch (e) {}
  }
  if (tg && tg.onEvent) { try { tg.onEvent('themeChanged', function () { if (S.set.theme === 'auto') applyTheme(); }); } catch (e) {} }

  function onboarding() {
    var slides = [
      ['📚', 'Добро пожаловать в Inkwell', 'Здесь больше ' + Math.floor(ITEMS.length / 100) * 100 + ' цитат, стихов, диалогов, жутких и трогательных историй — от Шекспира до аниме. Целые рассказы с переводом. И всё это — чтобы ты заговорил по-английски.'],
      ['🤔', 'Сначала думай сам', 'Читай по-английски и переводи в голове. Перевод спрятан — нажми, когда будешь готов себя проверить. Любое слово можно нажать и узнать перевод.'],
      ['🔁', 'Честно оцени себя', '«Понял сам», «Частично» или «Не понял». То, что было сложно, вернётся завтра — так работает интервальное повторение, и слова остаются в памяти надолго.'],
      ['🔥', 'Каждый день понемногу', 'Выполняй цель дня, держи серию, получай уровни и достижения. Твой прогресс сохраняется в Telegram.']
    ];
    var i = 0;
    var L = h('section', { class: 'layer', style: 'z-index:70' });
    document.body.appendChild(L);
    function render() {
      var s = slides[i];
      L.innerHTML = '<div class="onb"><div class="big">' + s[0] + '</div><h1>' + s[1] + '</h1><p>' + s[2] + '</p>' +
        '<div class="dots">' + slides.map(function (_, j) { return '<i class="' + (j === i ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
      var onb = $('.onb', L);
      if (i === 1) {
        var demo = cardEl({ id: 'demo', c: 'anime', en: 'A lesson without pain is meaningless.', ru: 'Урок без боли бессмыслен.', a: 'Edward Elric', s: 'Fullmetal Alchemist', t: ['wise'], l: 1, w: [['lesson', 'урок'], ['meaningless', 'бессмысленный']] }, { sheet: true });
        demo.classList.add('demo');
        demo.querySelector('.fc-side').remove();
        onb.insertBefore(demo, $('.dots', onb));
      }
      var b = h('button', { class: 'btn primary block' }, i < slides.length - 1 ? 'Дальше' : 'Поехали! 🚀');
      b.addEventListener('click', function () {
        haptic('light');
        if (i < slides.length - 1) { i++; render(); }
        else { S.onb = true; save(); L.classList.add('out'); setTimeout(function () { L.remove(); }, 230); }
      });
      onb.appendChild(b);
    }
    render();
  }

  // =====================================================================
  // 18. Старт
  // =====================================================================
  function start() {
    applyTheme();
    buildNav();
    var startTab = 'home';
    try {
      var sp = inTG && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
      if (sp === 'feed') startTab = 'feed';
      else if (sp === 'review') startTab = 'practice';
    } catch (e) {}
    showTab(startTab);
    checkAch();
    if (!S.onb) onboarding();
  }
  var booted = false;
  function boot(changed) {
    if (booted) return;
    booted = true;
    start();
    if (changed) toast('☁️ Прогресс загружен из облака');
  }
  setTimeout(boot, 1500);
  cloud.load(boot);
})();
