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
    play: svg('<path d="m6 4 14 8-14 8z"/>'),
    moon: svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/><path d="m17 3 .7 1.6L19.3 5l-1.6.7L17 7.3l-.7-1.6L14.7 5l1.6-.4z"/>'),
    pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
    head: svg('<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>'),
    cap: svg('<path d="M22 9 12 4 2 9l10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>'),
    layers: svg('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>')
  };

  // =====================================================================
  // 2. Данные и индексы
  // =====================================================================
  var CATS = D.cats, MOODS = D.moods, ITEMS = D.items, STORIES = D.stories, GLOSS = D.glossary;
  var LEARN = window.LEARN_DATA || { course: [], grammar: [], test: [] };
  // Свои находки пользователя — отдельный раздел, живёт только в состоянии
  CATS.push({ key: 'mine', name: 'Мои находки', emoji: '⭐', color: '#facc15', desc: 'Фразы, которые ты сам нашёл в аниме, играх и книгах', g: 'main' });
  var CAT = {}, MOOD = {}, BY_ID = {}, BY_CAT = {};
  CATS.forEach(function (c) { CAT[c.key] = c; BY_CAT[c.key] = []; });
  MOODS.forEach(function (m) { MOOD[m.key] = m; });
  ITEMS.forEach(function (it) { BY_ID[it.id] = it; if (BY_CAT[it.c]) BY_CAT[it.c].push(it); });
  var STORY = {}; STORIES.forEach(function (s) { STORY[s.id] = s; });
  function grp(it) { var c = CAT[it.c]; return c ? c.g : 'main'; }
  function isIslam(it) { return grp(it) === 'islam'; }
  var MAIN_CATS = CATS.filter(function (c) { return c.g === 'main' && c.key !== 'mine'; });
  var ISLAM_CATS = CATS.filter(function (c) { return c.g === 'islam'; });
  // Уровни CEFR
  var CEFR = ['', 'A1', 'A2', 'B1', 'B2', 'C1'];
  var CEFR_NAME = ['', 'Новичок', 'Начальный', 'Средний', 'Выше среднего', 'Продвинутый'];
  var CEFR_COLOR = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  function lvChip(l) { return '<span class="cefr" style="--lc:' + CEFR_COLOR[l || 1] + '">' + CEFR[l || 1] + '</span>'; }
  var COURSE = LEARN.course || [], GRAMMAR = LEARN.grammar || [], LTEST = LEARN.test || [];
  var COURSE_IDX = {}; COURSE.forEach(function (c, i) { COURSE_IDX[c[0]] = i; });
  var DAY_SIZE = 10, COURSE_DAYS = Math.ceil(COURSE.length / DAY_SIZE);

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
      st: { self: 0, partial: 0, miss: 0, tts: 0, tr: 0, qc: 0, rev: 0, night: 0, early: 0, dark: 0, touch: 0, anime: 0, faith: 0, dict: 0, back: 0, gram: 0 },
      set: { theme: 'auto', font: 1, goal: 15, rate: 0.9, hide: true, auto: true, islamFeed: false, karaoke: true },
      onb: false, upd: 0,
      lvl: 0,                 // уровень CEFR 1..5 (0 — ещё не выбран)
      course: { done: {} },   // курс «1000 слов»: номер дня -> время прохождения
      gram: {},               // уроки грамматики: id -> { s: лучший результат, n: вопросов, t: время }
      finds: [],              // мои находки: { id, en, ru, src, at }
      texts: [],              // мои тексты: { id, title, text, at }
      plan: {},               // занятие дня: шаг -> номер дня
      ver: 0                  // какое «Что нового» уже показано
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
    if (isIslam(it)) S.st.faith++;
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
    ['explorer', '🧭', 'Исследователь', 'Заглянуть во все разделы', function () { return catsTouched() >= MAIN_CATS.length; }],
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
    ['quiz5', '🕹', 'Игроман', 'Сыграть 5 квизов', function () { return S.quiz.played >= 5; }],
    ['test', '🎯', 'Знаю свой уровень', 'Пройти тест уровня', function () { return S.lvl > 0; }],
    ['course1', '🧱', 'Первые кирпичи', 'Пройти день курса «1000 слов»', function () { return Object.keys(S.course.done).length >= 1; }],
    ['course10', '🏗', 'Строитель', '10 дней курса «1000 слов»', function () { return Object.keys(S.course.done).length >= 10; }],
    ['course50', '🏰', 'Крепость слов', '50 дней курса «1000 слов»', function () { return Object.keys(S.course.done).length >= 50; }],
    ['gram1', '📘', 'Первое правило', 'Пройти урок грамматики', function () { return Object.keys(S.gram).length >= 1; }],
    ['gram10', '📗', 'Знаток правил', '10 уроков грамматики', function () { return Object.keys(S.gram).length >= 10; }],
    ['faith', '🤲', 'Свет знания', '20 аятов, хадисов и дуа', function () { return S.st.faith >= 20; }],
    ['dict', '✍️', 'Писарь', '10 диктантов или обратных переводов', function () { return S.st.dict + S.st.back >= 10; }],
    ['find', '⭐', 'Охотник за фразами', 'Добавить свою находку', function () { return S.finds.length >= 1; }]
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
      tts.tok = null;
      try { if (window.InkVoice && window.InkVoice.stop) window.InkVoice.stop(); } catch (e) {}
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      if (tts.audio) { try { tts.audio.pause(); } catch (e) {} tts.audio = null; }
      tts.queue = [];
      tts.reciteTok = null;
      tts.unmark();
      if (tts.btn) { tts.btn.classList.remove('playing'); tts.btn = null; }
    },
    kel: null, kcur: null, reciteTok: null,
    // Караоке: подсветка слова, которое сейчас звучит (i — номер слова-span .w внутри kel)
    mark: function (i) {
      if (!tts.kel) return;
      var w = tts.kel.querySelectorAll('.w')[i];
      if (tts.kcur && tts.kcur !== w) tts.kcur.classList.remove('say');
      if (w) { w.classList.add('say'); tts.kcur = w; }
    },
    unmark: function () { if (tts.kcur) tts.kcur.classList.remove('say'); tts.kcur = null; tts.kel = null; },
    // Есть ли качественная (нейро) запись для текста
    hasNeural: function (text) { try { return !!(window.InkVoice && window.InkVoice.has && window.InkVoice.has(String(text))); } catch (e) { return false; } },
    // Чей голос у записи: 'dan' — диктор Dan (ElevenLabs), '' — Ava/Andrew или нет записи
    voiceOf: function (text) { try { return (window.InkVoice && window.InkVoice.voice) ? window.InkVoice.voice(String(text)) : ''; } catch (e) { return ''; } },
    // Подпись голоса по метке: 'dan' — ElevenLabs, 'g:Имя' — Google Gemini, 'f:Имя' — Fish Audio
    voiceInfo: function (tag) {
      if (!tag) return null;
      if (tag === 'dan') return { badge: 'DAN', chip: '🎙 Читает Dan · голос ElevenLabs' };
      var name = tag.slice(2), who = tag.charAt(0) === 'g' ? 'Google Gemini' : 'Fish Audio';
      return { badge: 'HD+', chip: '🎙 Читает ' + name + ' · голос ' + who };
    },
    proAttr: function (text) {
      var vi = tts.voiceInfo(tts.voiceOf(text));
      return vi ? ' pro" data-v="' + vi.badge : '';
    },
    // text — английский текст; btn — кнопка (мигает во время речи); rate — скорость; el — где подсвечивать слова
    speak: function (text, btn, rate, el, onEnd) {
      tts.stop();
      var raw = String(text == null ? '' : text);
      if (!raw.trim()) return;
      text = raw.replace(/\n+/g, ' ').replace(/[“”«»]/g, '"').replace(/—/g, ', ').trim();
      S.st.tts++; checkAch(); save();
      if (btn) { tts.btn = btn; btn.classList.add('playing'); }
      if (el && S.set.karaoke !== false) tts.kel = el;
      var r = rate || S.set.rate || 0.9;
      var tok = tts.tok = {};
      // done срабатывает только для текущей озвучки (старые события после stop() игнорируются)
      var done = function () {
        if (tts.tok !== tok) return;
        tts.tok = null; tts.unmark();
        if (tts.btn) { tts.btn.classList.remove('playing'); tts.btn = null; }
        if (onEnd) onEnd();
      };
      // 1) Нейроголос (заранее записанный, с таймингами слов)
      if (window.InkVoice && window.InkVoice.play) {
        try {
          if (window.InkVoice.play(raw, {
            rate: r,
            onWord: function (i) { if (tts.tok === tok) tts.mark(i); },
            onEnd: done,
            onFail: function () { if (tts.tok === tok) fallback(); }
          })) return;
        } catch (e) {}
      }
      fallback();
      function fallback() {
      // 2) Голос устройства
      if (tts.voices.length) {
        try {
          var starts = [], m, re = /[A-Za-z][A-Za-z'’]*/g;
          while ((m = re.exec(text))) starts.push(m.index);
          var u = new SpeechSynthesisUtterance(text);
          u.voice = tts.voices[0]; u.lang = tts.voices[0].lang;
          u.rate = r; u.onend = done; u.onerror = done;
          u.onboundary = function (ev) {
            if (ev.name && ev.name !== 'word') return;
            var k = 0; while (k + 1 < starts.length && starts[k + 1] <= ev.charIndex) k++;
            tts.mark(k);
          };
          window.speechSynthesis.speak(u);
          return;
        } catch (e) {}
      }
      // 3) Запасной вариант: голос Google (если в WebView нет встроенных голосов)
      tts.queue = chunk(text, 180);
      var next = function () {
        if (!tts.queue.length) return done();
        var a = new Audio('https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&ttsspeed=' + (r < 0.85 ? 0.6 : 1) + '&q=' + encodeURIComponent(tts.queue.shift()));
        tts.audio = a; a.onended = next; a.onerror = function () { done(); toast('Озвучка недоступна на этом устройстве 😕'); };
        a.play().catch(function () { done(); });
      };
      next();
      }
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

  // Чтение Корана (Мишари Рашид Аль-Афаси, everyayah.com): аяты по порядку
  function pad3(n) { return ('00' + n).slice(-3); }
  function recite(vk, btn) {
    tts.stop();
    if (!vk) return;
    var s = vk[0], a = vk[1], b = vk[2] || vk[1];
    if (btn) { tts.btn = btn; btn.classList.add('playing'); }
    var tok = tts.reciteTok = {};
    var done = function () { if (tts.btn) { tts.btn.classList.remove('playing'); tts.btn = null; } };
    var next = function () {
      if (a > b || tts.reciteTok !== tok) return done();
      var au = new Audio('https://everyayah.com/data/Alafasy_128kbps/' + pad3(s) + pad3(a) + '.mp3');
      tts.audio = au; a++;
      au.onended = next;
      au.onerror = function () { done(); toast('Нет связи с сервером чтения Корана 😕'); };
      au.play().catch(function () { done(); });
    };
    S.st.faith++; save();
    next();
  }
  function openLink(url) { if (inTG && tg.openLink) tg.openLink(url); else window.open(url, '_blank'); }
  function refURL(ref) {
    var m = /^quran:(\d+):(\d+)/.exec(ref || '');
    if (m) return 'https://quran.com/' + m[1] + '/' + m[2];
    return 'https://sunnah.com/' + ref;
  }
  function openRef(ref) { if (ref) openLink(refURL(ref)); }
  var REF_NAMES = { bukhari: 'Сахих аль-Бухари', muslim: 'Сахих Муслим', nawawi40: '40 хадисов ан-Навави', riyadussalihin: 'Рияд ас-Салихин', tirmidhi: 'Сунан ат-Тирмизи', abudawud: 'Сунан Абу Дауда', ibnmajah: 'Сунан Ибн Маджа', nasai: 'Сунан ан-Насаи', adab: 'Аль-Адаб аль-Муфрад' };
  function refLabel(ref) {
    var m = /^quran:(\d+):(\d+)(?:-(\d+))?/.exec(ref || '');
    if (m) return 'Коран ' + m[1] + ':' + m[2] + (m[3] ? '–' + m[3] : '');
    var p = String(ref || '').split(':');
    return (REF_NAMES[p[0]] || p[0]) + (p[1] ? ', ' + p[1] : '');
  }

  // Произношение слова: транскрипция и живой голос из Free Dictionary API (dictionaryapi.dev)
  var pronCache = {};
  function pronounce(word) {
    var w = word.toLowerCase();
    if (pronCache[w]) return Promise.resolve(pronCache[w]);
    return fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w)).then(function (r) {
      if (!r.ok) throw 0; return r.json();
    }).then(function (j) {
      var out = { ipa: '', audio: '' };
      (j || []).forEach(function (e) {
        (e.phonetics || []).forEach(function (p) {
          if (!out.ipa && p.text) out.ipa = p.text;
          if (p.audio && (!out.audio || /-uk\.mp3$/.test(p.audio))) out.audio = p.audio;
        });
        if (!out.ipa && e.phonetic) out.ipa = e.phonetic;
      });
      pronCache[w] = out;
      return out;
    });
  }

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
    // live: экран пересобирается, когда к нему возвращаются (например, курс после пройденного дня)
    stack.push({ el: L, onClose: opts.onClose, live: opts.live ? function () { body.innerHTML = ''; build(body, L); } : null });
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
    var nt = stack[stack.length - 1];
    if (nt && nt.live && !top.bd) { try { nt.live(); } catch (e) {} }
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
    var islam = isIslam(it);
    if (islam) el.classList.add('islamic');
    var arBlock = it.ar ? '<div class="fc-ar' + (it.c === 'names' ? ' big' : '') + '" dir="rtl" lang="ar">' + esc(it.ar) + '</div>' : '';
    var trBlock = it.tr ? '<div class="fc-tr">' + esc(it.tr) + '</div>' : '';
    var srcBtns = (it.ref ? '<button class="srcbtn" data-act="src">' + I.globe + ' ' + (it.ref.indexOf('quran:') === 0 ? 'quran.com' : 'sunnah.com') + '</button>' : '') +
      (it.wbw ? '<button class="srcbtn" data-act="wbw">' + I.words + ' По словам</button>' : '');
    el.innerHTML =
      '<div class="fc-head"><span class="badge">' + c.emoji + ' ' + esc(c.name) + '</span>' + moods +
      '<span class="lvl" title="Уровень сложности">' + lvChip(it.l) + '</span></div>' +
      '<div class="fc-body"><div class="fc-inner">' +
      (showTitle ? '<div class="fc-title">' + esc(it.s) + '</div>' : '') +
      arBlock + trBlock +
      '<div class="fc-en serif' + (islam ? ' sm' : '') + '" style="--en-size:' + enSize(it) + 'px">' + wordsHTML(it.en, it.w) + '</div>' +
      (who ? '<div class="fc-who">— ' + who + '</div>' : '') +
      (srcBtns ? '<div class="srcrow">' + srcBtns + '</div>' : '') +
      '<div class="veil' + (open ? ' open' : '') + '"><div class="flag">Перевод</div><div class="ru serif">' + esc(it.ru) + '</div>' +
      '<div class="cover">🤔 Сначала переведи в голове<b>Нажми, чтобы проверить себя</b></div></div>' +
      '<div class="after' + (open ? '' : ' hidden') + '">' +
      (rec && !opts.review ? ratedHTML(rec) : rateHTML()) +
      (it.n ? '<div class="note">💡 ' + esc(it.n) + '</div>' : '') +
      '</div>' +
      '</div></div>' +
      '<div class="fc-side">' +
      '<button class="fab fav' + (S.fav[it.id] ? ' on' : '') + '" data-act="fav" aria-label="В избранное">' + I.heart + '</button>' +
      (it.vk ? '<button class="fab recite" data-act="recite" aria-label="Чтение Корана">' + I.moon + '</button>' : '') +
      '<button class="fab' + (tts.hasNeural(it.en) ? ' hq' : '') + tts.proAttr(it.en) + '" data-act="tts" aria-label="Послушать">' + I.vol + '</button>' +
      '<button class="fab" data-act="words" aria-label="Слова">' + I.words + ((it.w || []).length ? '<i>' + it.w.length + '</i>' : '') + '</button>' +
      '<button class="fab" data-act="share" aria-label="Поделиться">' + I.share + '</button>' +
      '</div>';

    if (opts.listen) {
      el.classList.add('listen');
      el.querySelector('.fc-en').insertAdjacentHTML('afterend', '<div class="listen-hint">🎧 Слушай и попробуй понять на слух.<b>Нажми, чтобы увидеть текст</b></div>');
    }
    var lastTap = 0;
    el.addEventListener('click', function (e) {
      var t = e.target;
      if (el.classList.contains('listen') && (t.closest('.fc-en') || t.closest('.listen-hint'))) {
        el.classList.remove('listen'); haptic('light'); return;
      }
      var w = t.closest('.w');
      if (w) { wordSheet(w.textContent, it, w); return; }
      var act = t.closest('[data-act]');
      if (act) {
        var a = act.getAttribute('data-act');
        if (a === 'fav') toggleFav(it, act);
        else if (a === 'tts') { if (act.classList.contains('playing')) tts.stop(); else tts.speak(it.en, act, null, el.querySelector('.fc-en')); }
        else if (a === 'recite') { if (act.classList.contains('playing')) tts.stop(); else recite(it.vk, act); }
        else if (a === 'src') openRef(it.ref);
        else if (a === 'wbw') wbwSheet(it);
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
      var ci = COURSE_IDX[key.toLowerCase()];
      if (ci == null) ci = COURSE_IDX[word.toLowerCase()];
      var cIpa = ci != null && COURSE[ci][2] ? '/' + COURSE[ci][2] + '/' : '';
      sh.innerHTML += '<div class="big serif">' + esc(word) + '</div>' +
        '<div class="ipa">' + esc(cIpa) + '</div>' +
        '<div class="tr">' + (found ? esc(found.ru) : '<span class="muted">Ищу перевод…</span>') + '</div>' +
        (ci != null ? '<div class="src">🧱 Слово №' + (ci + 1) + ' из курса «1000 главных слов»</div>' : '') +
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
      // Транскрипция и живой голос (запись человека) из открытого словаря
      if (/^[a-z][a-z'-]*$/i.test(word)) pronounce(word.replace(/'s$/i, '')).then(function (p) {
        if (p.ipa && !cIpa) sh.querySelector('.ipa').textContent = p.ipa;
        if (p.audio) {
          var bLive = h('button', { class: 'btn sm' }, '🎙 Живой голос');
          bLive.addEventListener('click', function () { tts.stop(); var a = new Audio(p.audio); tts.audio = a; a.playbackRate = 1; a.play().catch(function () {}); });
          acts.insertBefore(bLive, bAdd);
        }
      }).catch(function () {});
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
  // Аят по словам: арабское слово — транслитерация — английский смысл (из quran.com)
  function wbwSheet(it) {
    openSheet(function (sh) {
      sh.appendChild(h('h2', { style: 'margin-top:4px' }, '🔍 Аят по словам'));
      sh.appendChild(h('div', { class: 'sub', style: 'margin-bottom:12px' }, 'Каждое арабское слово и его смысл по-английски. Английские слова тоже можно учить!'));
      var list = h('div', { class: 'wbw' });
      (it.wbw || []).forEach(function (w) {
        list.appendChild(h('div', { class: 'wbw-row' }, '<div class="a" dir="rtl" lang="ar">' + esc(w[0]) + '</div><div class="t">' + esc(w[1]) + '</div><div class="e">' + esc(w[2]) + '</div>'));
      });
      sh.appendChild(list);
      sh.appendChild(h('div', { class: 'note' }, '📖 Перевод слов — quran.com (word by word). ' + esc(refLabel(it.ref))));
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
    ['home', 'Главная', I.home], ['feed', 'Лента', I.feed], ['library', 'Библиотека', I.book],
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
    // новичку (A1) — находка ровно его уровня и покороче; остальным — свой уровень и на ступень выше
    var max = S.lvl === 1 ? 1 : (S.lvl || 4) + 1, maxLen = S.lvl === 1 ? 150 : 260;
    var pool = ITEMS.filter(function (it) { return !isIslam(it) && it.c !== 'mine' && it.l <= max && it.en.length < maxLen && ['idioms', 'slang', 'twisters', 'riddles', 'basics'].indexOf(it.c) < 0; });
    if (!pool.length) pool = ITEMS.filter(function (it) { return !isIslam(it); });
    return pool[(today() * 7919) % pool.length];
  }
  // Аят / хадис / дуа дня — одни и те же на весь день
  function islamDaily(cat) {
    var pool = BY_CAT[cat] || [];
    if (!pool.length) return null;
    var short = pool.filter(function (it) { return it.en.length < 320; });
    var p = short.length ? short : pool;
    return p[(today() * (cat === 'quran' ? 4099 : 2087)) % p.length];
  }
  function dailyWord() {
    if (COURSE.length) { var c = COURSE[(today() * 104729) % Math.min(COURSE.length, 600)]; return { en: c[0], ru: c[1], ipa: c[2] }; }
    var keys = Object.keys(GLOSS).filter(function (k) { return /^[a-z][a-z-]{3,}$/.test(k); });
    var k = keys[(today() * 104729) % keys.length];
    return { en: k, ru: GLOSS[k] };
  }
  function seenToday() {
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); t0 = t0.getTime();
    var n = 0; for (var k in S.seen) if (S.seen[k] >= t0) n++;
    return n;
  }
  function planDone(step) { return S.plan[step] === today(); }
  function markPlan(step) {
    if (S.plan[step] === today()) return;
    S.plan[step] = today(); save();
    checkPlanBonus();
  }
  function checkPlanBonus() {
    if (S.plan.bonus === today() || !PLAN.every(function (p) { return planStatus(p[0]); })) return;
    S.plan.bonus = today(); S.xp += 30; save();
    setTimeout(function () { confetti(); toast('🏆 Занятие дня выполнено полностью! +30 XP', 'big'); haptic('success'); }, 500);
  }
  function nextLesson() { for (var i = 0; i < GRAMMAR.length; i++) if (!S.gram[GRAMMAR[i].id]) return GRAMMAR[i]; return GRAMMAR[0]; }
  function courseDay() { var n = 0; while (S.course.done[n]) n++; return Math.min(n, COURSE_DAYS - 1); }
  // Занятие дня: 6 шагов по методике «слова → повторение → правило → чтение → слух → вера»
  var PLAN = [
    ['words', '🧱', 'Новые слова', function () { return 'День ' + (courseDay() + 1) + ' курса «1000 слов» · 10 слов'; }, function () { openCourse(); }],
    ['review', '🔁', 'Повторение', function () { var d = dueCount(); return d ? d + ' на повторение' : 'Всё повторено — отлично!'; }, function () { startReview(); }],
    ['gram', '📘', 'Правило дня', function () { var l = nextLesson(); return l ? l.title : ''; }, function () { var l = nextLesson(); if (l) openLesson(l.id); }],
    ['read', '📖', 'Чтение', function () { return 'Прочитай 10 карточек своего уровня · ' + Math.min(10, seenToday()) + '/10'; }, function () { openFeed(myFeed()); }],
    ['listen', '🎧', 'Слушание', function () { return 'Диктант: услышь и напиши 5 фраз'; }, function () { startQuiz('dict'); }],
    ['faith', '☪️', 'Аят и хадис дня', function () { return 'Коран и Сунна — по-английски'; }, function () { openIslam(); }]
  ];
  function planStatus(step) {
    if (step === 'review' && !dueCount() && Object.keys(S.rate).length + Object.keys(S.words).length > 0) return true;
    if (step === 'read' && seenToday() >= 10) return true;
    return planDone(step);
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
      '<div id="lvlbox"></div>' +
      '<h2>📅 Занятие на сегодня <span class="faint" id="plancnt" style="text-transform:none;letter-spacing:0"></span></h2><div class="surface plan" id="plan"></div>' +
      '<h2>✨ Находка дня</h2><div id="daily"></div>' +
      (ISLAM_CATS.some(function (c) { return BY_CAT[c.key].length; }) ? '<h2>☪️ Ислам <button data-go="islam">Все разделы</button></h2><div id="islambox"></div>' : '') +
      '<h2>⚡ Быстрый старт</h2>' +
      '<div class="qgrid">' +
      '<button class="qbtn" data-go="feed"><b>▶️</b>Лента</button>' +
      '<button class="qbtn" data-go="course"><b>🧱</b>1000 слов</button>' +
      '<button class="qbtn" data-go="grammar"><b>📘</b>Грамматика</button>' +
      '<button class="qbtn" data-go="basics"><b>🌱</b>Основы</button>' +
      '<button class="qbtn" data-go="anime"><b>🌸</b>Аниме</button>' +
      '<button class="qbtn" data-go="review"><b>🔁</b>Повторить' + (due ? '<span class="cnt">' + due + '</span>' : '') + '</button>' +
      '<button class="qbtn" data-go="mytext"><b>📥</b>Мой текст</button>' +
      '<button class="qbtn" data-go="finds"><b>⭐</b>Находки</button>' +
      '<button class="qbtn" data-go="translator"><b>🌍</b>Переводчик</button>' +
      '</div>' +
      '<h2>🗂 Разделы <button data-go="library">Все</button></h2><div class="hscroll" id="cats"></div>' +
      '<h2>🎭 Настроение</h2><div class="chips" id="moods"></div>' +
      '<h2>💎 Слово дня</h2><div id="wday"></div>' +
      '<h2>🧭 Совет дня</h2><div class="surface tip"><b>' + TIPS[t % TIPS.length][0] + '</b><div>' + TIPS[t % TIPS.length][1] + '</div></div>' +
      '<button class="surface methodbtn" data-go="method"><b>🧪</b><span><b>Как люди на самом деле учат языки</b>Что говорит наука — и как это устроено в Inkwell</span></button>';

    // Уровень
    var lb = $('#lvlbox', root);
    if (S.lvl) {
      lb.innerHTML = '<button class="surface lvlbox" data-go="test">' + lvChip(S.lvl) + '<span><b>Твой уровень: ' + CEFR[S.lvl] + ' · ' + CEFR_NAME[S.lvl] + '</b>Лента подбирает карточки ' + CEFR[S.lvl] + '–' + CEFR[Math.min(5, S.lvl + 1)] + '. Нажми, чтобы пройти тест заново.</span></button>';
    } else {
      lb.innerHTML = '<button class="surface lvlbox cta" data-go="test"><b class="em">🎯</b><span><b>Узнай свой уровень за 3 минуты</b>17 вопросов — и лента, курс и озвучка подстроятся под тебя</span></button>';
    }

    // Занятие дня
    var plan = $('#plan', root), nDone = 0;
    PLAN.forEach(function (p) {
      var ok = planStatus(p[0]); if (ok) nDone++;
      var row = h('button', { class: 'planrow' + (ok ? ' ok' : '') });
      row.innerHTML = '<span class="pi">' + (ok ? '✓' : p[1]) + '</span><span class="pt"><b>' + p[2] + '</b><small>' + esc(p[3]()) + '</small></span><span class="pa">›</span>';
      row.addEventListener('click', function () { haptic('light'); p[4](); });
      plan.appendChild(row);
    });
    $('#plancnt', root).textContent = nDone + ' / ' + PLAN.length;

    var daily = dailyItem();
    var dc = cardEl(daily, { sheet: true });
    $('#daily', root).appendChild(dc);

    // Ислам: аят и хадис дня
    var ib = $('#islambox', root);
    if (ib) {
      [['quran', 'Аят дня'], ['hadith', 'Хадис дня']].forEach(function (k) {
        var it = islamDaily(k[0]); if (!it) return;
        var b = h('button', { class: 'surface iday' });
        b.innerHTML = '<div class="k">' + CAT[k[0]].emoji + ' ' + k[1] + ' · ' + esc(refLabel(it.ref)) + '</div>' +
          (it.ar ? '<div class="a" dir="rtl" lang="ar">' + esc(it.ar.length > 140 ? it.ar.slice(0, 140) + '…' : it.ar) + '</div>' : '') +
          '<div class="e serif">' + esc(it.en.length > 160 ? it.en.slice(0, 157) + '…' : it.en) + '</div>';
        b.addEventListener('click', function () { markPlan('faith'); itemSheet(it); });
        ib.appendChild(b);
      });
      var row = h('div', { class: 'chips' });
      ISLAM_CATS.forEach(function (c) {
        if (!BY_CAT[c.key].length) return;
        var cb = h('button', { class: 'chip' }, c.emoji + ' ' + c.name);
        cb.addEventListener('click', function () { openCategory(c.key); });
        row.appendChild(cb);
      });
      ib.appendChild(row);
    }

    var cats = $('#cats', root);
    MAIN_CATS.concat([CAT.basics]).filter(Boolean).forEach(function (c) { if (BY_CAT[c.key].length) cats.appendChild(catTile(c)); });

    var moods = $('#moods', root);
    MOODS.forEach(function (m) {
      if (m.key === 'faith') return;
      var b = h('button', { class: 'chip' }, m.emoji + ' ' + m.name);
      b.addEventListener('click', function () { openFeed({ cat: null, mood: m.key, lvl: S.lvl ? -1 : 0 }); });
      moods.appendChild(b);
    });

    var wd = dailyWord();
    var wbox = h('div', { class: 'surface wordday' });
    wbox.innerHTML = '<div class="grow"><div class="w-en serif">' + esc(wd.en) + '</div>' + (wd.ipa ? '<div class="w-ipa">/' + esc(wd.ipa) + '/</div>' : '') + '<div class="w-ru">' + esc(wd.ru) + '</div></div>';
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
    else if (where === 'course') openCourse();
    else if (where === 'grammar') openGrammar();
    else if (where === 'basics') openCategory('basics');
    else if (where === 'anime') openAnimeTitles();
    else if (where === 'mytext') openMyText();
    else if (where === 'finds') openFinds();
    else if (where === 'islam') openIslam();
    else if (where === 'test') startLevelTest();
    else if (where === 'method') openMethod();
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
  // lvl: 0 — любой, -1 — «мой уровень» (свой и на ступень выше), 1..5 — ровно A1..C1; src — тайтл/источник
  var feedState = { filter: { cat: null, mood: null, lvl: 0, src: null }, queue: [], rendered: 0, active: null, built: false, listen: false };
  function myFeed() { return { cat: null, mood: null, lvl: S.lvl ? -1 : 0, src: null }; }
  function openFeed(filter, keepIfSame) {
    var f = filter || myFeed();
    var cur = feedState.filter;
    var same = feedState.built && f.cat == cur.cat && f.mood == cur.mood && (f.lvl || 0) === (cur.lvl || 0) && (f.src || null) === (cur.src || null);
    feedState.filter = { cat: f.cat || null, mood: f.mood || null, lvl: f.lvl || 0, src: f.src || null };
    if (!(keepIfSame && same)) feedState.built = false;
    showTab('feed', feedState.built);
  }
  function feedMatches(it) {
    var f = feedState.filter;
    if (f.cat && it.c !== f.cat) return false;
    if (f.src && groupKey(it) !== f.src) return false;
    if (f.mood && it.t.indexOf(f.mood) < 0) return false;
    // Исламские карточки — только в своих разделах, в «Вере» и (по желанию) в общей ленте
    if (isIslam(it) && !f.cat && f.mood !== 'faith' && (f.mood || !S.set.islamFeed)) return false;
    if (f.lvl === -1) { if (it.l > (S.lvl || 1) + 1) return false; }
    else if (f.lvl > 0 && it.l !== f.lvl) return false;
    return true;
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
    if (f.src) parts.push(f.src);
    else if (f.cat) parts.push(CAT[f.cat].emoji + ' ' + CAT[f.cat].name);
    if (f.lvl === -1) parts.push('мой уровень ' + CEFR[S.lvl || 1] + '–' + CEFR[Math.min(5, (S.lvl || 1) + 1)]);
    else if (f.lvl > 0) parts.push(CEFR[f.lvl]);
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
    var lb = h('button', { class: 'filterbtn listenbtn' + (feedState.listen ? ' on' : ''), 'aria-label': 'Аудио-режим' }, I.head);
    lb.addEventListener('click', function () {
      feedState.listen = !feedState.listen;
      toast(feedState.listen ? '🎧 Аудио-режим: сначала слушай, потом смотри текст' : '📖 Обычный режим');
      haptic('select'); openFeed(feedState.filter);
    });
    var chips = h('div', { class: 'chips' });
    var f0 = feedState.filter;
    var withMood = function (mood) { return { cat: f0.cat, mood: mood, lvl: f0.lvl, src: f0.src }; };
    var all = h('button', { class: 'chip' + (!f0.mood ? ' on' : '') }, '✨ Всё');
    all.addEventListener('click', function () { openFeed(withMood(null)); });
    chips.appendChild(all);
    var catIslam = f0.cat && CAT[f0.cat].g === 'islam';
    MOODS.forEach(function (m) {
      if (catIslam && m.key !== 'faith') return; // в исламских разделах только «Вера»
      if (m.key === 'faith' && f0.cat && !catIslam) return;
      var b = h('button', { class: 'chip' + (f0.mood === m.key ? ' on' : '') }, m.emoji + ' ' + m.name);
      b.addEventListener('click', function () { openFeed(withMood(f0.mood === m.key ? null : m.key)); });
      chips.appendChild(b);
    });
    top.appendChild(fb); top.appendChild(lb); top.appendChild(chips);
    var feed = h('div', { class: 'feed', id: 'feed' });
    wrap.appendChild(top); wrap.appendChild(feed);
    root.appendChild(wrap);
    setTimeout(function () { var on = $('.chip.on', chips); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 30);

    if (feedObserver) feedObserver.disconnect();
    feedObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          var slot = en.target, idx = +slot.getAttribute('data-i');
          var it = BY_ID[slot.getAttribute('data-id')];
          if (feedState.active !== slot) {
            tts.stop(); feedState.active = slot;
            // заранее скачиваем нейро-озвучку, чтобы она играла мгновенно (важно для iPhone)
            try { if (it && window.InkVoice && window.InkVoice.prefetch) window.InkVoice.prefetch(it.en); } catch (e) {}
            // Аудио-режим: карточка сама читается вслух, текст скрыт до нажатия
            if (feedState.listen && it) setTimeout(function () {
              if (feedState.active !== slot) return;
              var fc = slot.querySelector('.fcard');
              tts.speak(it.en, fc.querySelector('[data-act=tts]'), null, fc.querySelector('.fc-en'));
            }, 450);
          }
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
      slot.appendChild(cardEl(it, { onRated: onFeedRated, listen: feedState.listen }));
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
    var f = { cat: feedState.filter.cat, mood: feedState.filter.mood, lvl: feedState.filter.lvl, src: feedState.filter.src };
    openSheet(function (sh) {
      sh.appendChild(h('h2', { style: 'margin-top:4px' }, 'Уровень'));
      var lg = h('div', { class: 'chips wrap' });
      var lvOpts = [[0, '🌈 Любой']].concat(S.lvl ? [[-1, '🎯 Мой: ' + CEFR[S.lvl] + '–' + CEFR[Math.min(5, S.lvl + 1)]]] : []).concat([[1, 'A1'], [2, 'A2'], [3, 'B1'], [4, 'B2'], [5, 'C1']]);
      lvOpts.forEach(function (o) {
        var b = h('button', { class: 'chip' + (f.lvl === o[0] ? ' on' : '') }, o[1]);
        b.addEventListener('click', function () { f.lvl = o[0]; $$('.chip', lg).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); haptic('select'); });
        lg.appendChild(b);
      });
      sh.appendChild(lg);
      var groups = [['Раздел', CATS.filter(function (c) { return c.g !== 'islam'; })], ['☪️ Ислам', ISLAM_CATS]];
      var all = [];
      groups.forEach(function (gp, gi) {
        sh.appendChild(h('h2', {}, gp[0]));
        var cg = h('div', { class: 'chips wrap' });
        var mk = function (key, label) {
          var b = h('button', { class: 'chip' + (f.cat === key && !f.src ? ' on' : '') }, label);
          b.addEventListener('click', function () { f.cat = key; f.src = null; if (key && CAT[key].g === 'islam') f.mood = null; all.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); haptic('select'); });
          cg.appendChild(b); all.push(b);
        };
        if (gi === 0) mk(null, '✨ Все');
        gp[1].forEach(function (c) { mk(c.key, c.emoji + ' ' + c.name); });
        sh.appendChild(cg);
      });
      var ok = h('button', { class: 'btn primary block mt' }, 'Показать');
      ok.addEventListener('click', function () { popLayer(); setTimeout(function () { openFeed(f); }, 240); });
      sh.appendChild(ok);
    });
  }

  // =====================================================================
  // 13. Читалка: рассказы, разделы, поиск, избранное
  // =====================================================================
  var STORY_COLORS = { creepy: '#a855f7', dark: '#64748b', touching: '#ff6a8d', love: '#ff4f9a', funny: '#f5a524', weird: '#14b8a6', motivation: '#22c55e', wise: '#06b6d4', faith: '#10b981' };
  function storyCard(s) {
    var prog = S.stories[s.id] || {}, p = prog.done ? 1 : (prog.p || 0) / s.paras.length;
    var b = h('button', { class: 'storycard', style: '--c:' + (s.g === 'islam' ? '#10b981' : STORY_COLORS[s.tags[0]] || 'var(--accent)') });
    b.innerHTML = '<div class="st-title serif">' + esc(s.title) + '</div>' +
      '<div class="st-meta">' + lvChip(s.l) + ' ' + esc(s.author) + (s.year ? ' · ' + esc(s.year) : '') + ' · ' + s.minutes + ' мин ' + s.tags.map(function (t) { return MOOD[t] ? MOOD[t].emoji : ''; }).join('') + (prog.done ? ' · ✅' : '') + '</div>' +
      '<div class="st-about">' + esc(s.about) + '</div>' +
      '<div class="bar"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
    b.addEventListener('click', function () { openStory(s.id); });
    return b;
  }
  // Тайтлы аниме: [название, число цитат], любимые — наверху
  var FRANCHISE_ALIAS = { 'The End of Evangelion': 'Neon Genesis Evangelion', 'Evangelion': 'Neon Genesis Evangelion', 'Hellsing Ultimate': 'Hellsing' };
  function franchise(s) {
    // «Re:Zero» не режем (двоеточие без пробела), «Code Geass: R2» → «Code Geass»
    var f = String(s || '—').split(/: | — | - /)[0].replace(/\s+(Shippuden|Shippūden|R2|Z|GT|Super|Brotherhood|II|III|0|Season \d+|2nd Season|the Movie|Movie)$/i, '').trim();
    return FRANCHISE_ALIAS[f] || f;
  }
  // Подборка внутри раздела: тайтл аниме, тема «Основ», сура, сборник хадисов
  function groupKey(it) {
    var f = franchise(it.s);
    if (it.c === 'anime') return f;
    // «Аль-Бакара 2:255 · Аят аль-Курси» → «Аль-Бакара», «Сахих аль-Бухари, 6306 · …» → «Сахих аль-Бухари»
    return f.split(/\s*·\s*/)[0].replace(/[,\s]+\d+(\s*[:–-]\s*\d+)*\s*$/, '').trim() || f;
  }
  function animeTitles() {
    var cnt = {};
    BY_CAT.anime.forEach(function (it) { var s = franchise(it.s); cnt[s] = (cnt[s] || 0) + 1; });
    var fav = ['Code Geass', 'Sword Art Online'];
    return Object.keys(cnt).map(function (k) { return [k, cnt[k]]; }).sort(function (a, b) {
      var fa = fav.some(function (f) { return a[0].indexOf(f) === 0; }), fb = fav.some(function (f) { return b[0].indexOf(f) === 0; });
      if (fa !== fb) return fa ? -1 : 1;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }

  RENDER.library = function (root) {
    root.innerHTML =
      '<div class="topline"><h1 style="margin:0">Библиотека</h1><button class="iconbtn" id="favbtn" aria-label="Избранное">' + I.heart + '</button></div>' +
      '<div class="search">' + I.search + '<input id="q" type="search" placeholder="Поиск: Lelouch, love, Шекспир, терпение…" autocomplete="off"></div>' +
      '<div id="results"></div>' +
      '<div id="libmain">' +
      '<h2>🎓 Учёба с нуля</h2><div class="modes" id="learn"></div>' +
      '<button class="surface animebtn" data-go="anime"><b>🌸</b><span><b>Аниме по тайтлам</b>' + animeTitles().length + ' тайтлов · Code Geass, SAO, Naruto, AoT…</span><i>›</i></button>' +
      '<h2 id="stories">📖 Рассказы целиком</h2><div class="chips" id="stfilter"></div><div class="list" id="storylist"></div>' +
      (ISLAM_CATS.some(function (c) { return BY_CAT[c.key].length; }) ? '<h2>☪️ Ислам <button data-go="islam">Открыть</button></h2><div class="hscroll" id="islamcats"></div>' : '') +
      '<h2>🛠 Мои инструменты</h2><div class="modes" id="tools"></div>' +
      '<h2>🗂 Разделы</h2><div class="catgrid" id="catgrid"></div>' +
      '</div>';
    var lg = $('#learn', root);
    [['basics', '🌱', 'Основы', BY_CAT.basics.length + ' фраз на каждый день', '#84cc16'],
      ['course', '🧱', '1000 слов', 'День ' + (courseDay() + 1) + ' из ' + COURSE_DAYS, '#f59e0b'],
      ['grammar', '📘', 'Грамматика', Object.keys(S.gram).length + ' из ' + GRAMMAR.length + ' уроков', '#3b82f6'],
      ['test', '🎯', 'Тест уровня', S.lvl ? 'Твой уровень: ' + CEFR[S.lvl] : '3 минуты', '#ef4444']
    ].forEach(function (m) {
      var b = h('button', { class: 'mode', style: '--c:' + m[4], 'data-go': m[0] });
      b.innerHTML = '<b>' + m[1] + '</b><span>' + m[2] + '</span><small>' + esc(m[3]) + '</small>';
      lg.appendChild(b);
    });
    var tl = $('#tools', root);
    [['mytext', '📥', 'Мой текст', 'Вставь любой английский текст', '#8b5cf6'],
      ['finds', '⭐', 'Мои находки', S.finds.length + ' своих карточек', '#facc15'],
      ['translator', '🌍', 'Переводчик', 'RU ⇄ EN', '#06b6d4'],
      ['dict', '📒', 'Мой словарь', Object.keys(S.words).length + ' слов', '#22c55e']
    ].forEach(function (m) {
      var b = h('button', { class: 'mode', style: '--c:' + m[4], 'data-go': m[0] });
      b.innerHTML = '<b>' + m[1] + '</b><span>' + m[2] + '</span><small>' + esc(m[3]) + '</small>';
      tl.appendChild(b);
    });
    var ic = $('#islamcats', root);
    if (ic) ISLAM_CATS.forEach(function (c) { if (BY_CAT[c.key].length) ic.appendChild(catTile(c)); });
    // Рассказы с фильтром по уровню
    var hasEasy = STORIES.some(function (s) { return s.g !== 'islam' && s.l <= 2; });
    var sl = $('#storylist', root), sf = $('#stfilter', root), stLv = S.lvl && S.lvl <= 2 && hasEasy ? 'easy' : 'all';
    var drawStories = function () {
      sl.innerHTML = '';
      STORIES.filter(function (s) { return s.g !== 'islam' && (stLv === 'all' || (stLv === 'easy' ? s.l <= 2 : s.l >= 3)); })
        .sort(function (a, b) { return a.l - b.l; })
        .forEach(function (s) { sl.appendChild(storyCard(s)); });
      if (!sl.children.length) sl.innerHTML = '<div class="empty"><b>📖</b>Таких рассказов пока нет</div>';
    };
    [['all', '✨ Все'], ['easy', '🌱 Лёгкие A1–A2'], ['hard', '📚 Классика B1+']].forEach(function (o) {
      var b = h('button', { class: 'chip' + (stLv === o[0] ? ' on' : '') }, o[1]);
      b.addEventListener('click', function () { stLv = o[0]; $$('.chip', sf).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); drawStories(); });
      sf.appendChild(b);
    });
    drawStories();
    var cg = $('#catgrid', root);
    MAIN_CATS.forEach(function (c) { cg.appendChild(catTile(c)); });
    root.onclick = function (e) { var g = e.target.closest('[data-go]'); if (g) go(g.getAttribute('data-go')); };
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
      if (key === 'anime') {
        var at = h('button', { class: 'btn block mt' }, '🌸 Выбрать тайтл');
        at.addEventListener('click', openAnimeTitles); body.appendChild(at);
      }
      if (key === 'mine') {
        var mf = h('button', { class: 'btn block mt' }, I.plus + ' Добавить находку');
        mf.addEventListener('click', openFinds); body.appendChild(mf);
      }
      // Темы внутри раздела (Основы — по темам, Коран — по сурам, хадисы — по сборникам)
      if (key !== 'anime') {
        var groups = []; items.forEach(function (it) { var g = groupKey(it); if (it.s && groups.indexOf(g) < 0) groups.push(g); });
        if (groups.length >= 2 && groups.length <= 60) {
          body.appendChild(h('h2', {}, key === 'basics' ? 'Темы' : 'Подборки'));
          var gc = h('div', { class: 'chips wrap' });
          groups.forEach(function (g) {
            var n = items.filter(function (it) { return groupKey(it) === g; }).length;
            var b = h('button', { class: 'chip' }, esc(g) + ' <span class="faint">' + n + '</span>');
            b.addEventListener('click', function () { openFeed({ cat: key, src: g }); });
            gc.appendChild(b);
          });
          body.appendChild(gc);
        }
      }
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
    var play = { tok: null };
    pushLayer(esc(s.title), function (body, L) {
      var head = h('div', { class: 'reader-head' });
      head.innerHTML = '<div class="t serif">' + esc(s.title) + '</div><div class="m">' + lvChip(s.l) + ' ' + esc(s.author) + (s.year ? ' · ' + esc(s.year) : '') + ' · ' + s.minutes + ' мин · ' + s.paras.length + ' абзацев</div><div class="ab">' + esc(s.about) + '</div>';
      body.appendChild(head);
      // Рассказ озвучен диктором Dan — подпись (и требование бесплатного тарифа ElevenLabs указывать источник)
      try {
        if (window.InkVoice && window.InkVoice.ready) window.InkVoice.ready().then(function () {
          var vi = tts.voiceInfo(tts.voiceOf(s.paras[0].en));
          if (vi && !$('.voice-by', head)) head.appendChild(h('div', { class: 'voice-by' }, vi.chip));
        });
      } catch (e) {}
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
      // Слушать рассказ целиком: абзац за абзацем, с подсветкой слов и автопрокруткой
      var pb = h('button', { class: 'btn block mt' }, I.head + ' Слушать рассказ');
      pb.addEventListener('click', function () {
        if (play.tok) { stopPlay(); return; }
        var from = 0;
        if (prog.p > 0 && prog.p < s.paras.length) from = prog.p;
        playFrom(from);
      });
      body.appendChild(pb);
      function stopPlay() { play.tok = null; tts.stop(); pb.innerHTML = I.head + ' Слушать рассказ'; pb.classList.remove('primary'); }
      function playFrom(i) {
        var tok = play.tok = {};
        pb.innerHTML = '⏸ Остановить'; pb.classList.add('primary');
        var step = function (k) {
          if (play.tok !== tok) return;
          if (k >= s.paras.length) { stopPlay(); toast('🎧 Рассказ дослушан до конца'); return; }
          var el = $('.para[data-i="' + k + '"]', wrap);
          if (!el) return stopPlay();
          L.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
          var fired = false;
          tts.speak(s.paras[k].en, null, null, el.querySelector('.en'), function () {
            if (fired || play.tok !== tok) return; fired = true;
            markPara(k, el);
            setTimeout(function () { step(k + 1); }, 450);
          });
        };
        step(i);
      }
      var wrap = h('div', { class: 'mt' });
      s.paras.forEach(function (p, i) {
        var pit = { id: s.id + ':' + i, en: p.en, ru: p.ru, w: p.w || [], c: 'books' };
        var el = h('div', { class: 'para' + (prog.read[i] ? ' read' : ''), 'data-i': i });
        el.innerHTML = '<div class="num">' + (i + 1) + '</div><div class="en serif">' + wordsHTML(p.en, p.w) + '</div>' +
          '<div class="tools"><button data-a="tr">' + I.eye + ' Перевод</button><button data-a="say">' + I.vol + ' Слушать</button>' + ((p.w || []).length ? '<button data-a="w">' + I.words + ' Слова · ' + p.w.length + '</button>' : '') + '</div>' +
          '<div class="ru serif' + (mode === 'think' ? ' hidden' : '') + '">' + esc(p.ru) + (p.n ? '<div class="pnote">💡 ' + esc(p.n) + '</div>' : '') + '</div>';
        el.addEventListener('click', function (e) {
          var w = e.target.closest('.w'); if (w) { wordSheet(w.textContent, pit, w); return; }
          var a = e.target.closest('[data-a]'); if (!a) return;
          var act = a.getAttribute('data-a');
          if (act === 'tr') {
            var ru = el.querySelector('.ru'); ru.classList.toggle('hidden'); el.classList.add('shown');
            markPara(i, el);
          } else if (act === 'say') { if (a.classList.contains('playing')) tts.stop(); else tts.speak(p.en, a, null, el.querySelector('.en')); }
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
    }, { onClose: function () { play.tok = null; save(); if (curTab === 'library') RENDER.library($('.tab[data-tab=library]')); } });

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
    ['tf', '🤯', 'Правда или ложь?', 'Странные факты', '#ef4444'],
    ['dict', '🎧', 'Диктант', 'Услышь и напиши', '#0ea5e9'],
    ['back', '✍️', 'Обратный перевод', 'С русского на английский', '#84cc16'],
    ['faith', '🤲', 'Квиз о вере', 'Слова, источники, смыслы', '#10b981']
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
    root.appendChild(h('h2', {}, '🎓 Учёба'));
    var lg = h('div', { class: 'modes' });
    [['course', '🧱', '1000 слов', 'День ' + (courseDay() + 1) + ' из ' + COURSE_DAYS, '#f59e0b'],
      ['grammar', '📘', 'Грамматика', Object.keys(S.gram).length + ' из ' + GRAMMAR.length + ' уроков', '#3b82f6']].forEach(function (m) {
      var b = h('button', { class: 'mode', style: '--c:' + m[4] });
      b.innerHTML = '<b>' + m[1] + '</b><span>' + m[2] + '</span><small>' + m[3] + '</small>';
      b.addEventListener('click', function () { go(m[0]); });
      lg.appendChild(b);
    });
    root.appendChild(lg);
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
        if (it.en.length > 230 || !it.w || isIslam(it)) return;
        for (var j = 0; j < it.w.length; j++) {
          var w = it.w[j][0];
          if (!/^[A-Za-z]+$/.test(w) || w.length < 4) continue;
          var re = new RegExp('\\b' + w + '\\b', 'i');
          var m = it.en.match(re);
          if (m) { cands.push({ it: it, word: m[0], ru: it.w[j][1] }); break; }
        }
      });
      if (S.lvl) {  // по уровню ученика, если подходящих фраз хватает
        var fitC = cands.filter(function (c) { return (c.it.l || 3) <= S.lvl + 1; });
        if (fitC.length >= 15) cands = fitC;
      }
      shuffle(cands).slice(0, 10).forEach(function (c) {
        var re = new RegExp('\\b' + c.word + '\\b');
        var parts = c.it.en.split(re);
        var html = esc(parts[0]) + '<span class="gap">?</span>' + esc(parts.slice(1).join(c.word));
        qs.push({ hint: 'Какое слово пропущено?', qhtml: html.replace(/\n/g, '<br>'), small: c.it.en.length > 90, ans: c.word, opts: distinctOpts(c.word, sw, 4), explain: '<b>' + esc(c.word) + '</b> — ' + esc(c.ru) + '<br><span class="muted">' + esc(c.it.ru) + '</span>', item: c.it });
      });
    } else if (mode === 'listen') {
      pool = ITEMS.filter(function (it) { return it.en.length < 90 && it.en.indexOf('\n') < 0 && !isIslam(it) && ['twisters', 'idioms'].indexOf(it.c) < 0 && it.l <= Math.max(2, (S.lvl || 3) + 1); });
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
    } else if (mode === 'faith') {
      // Квиз о вере: значения слов и имён, источник (Коран или хадис), смысл аята/хадиса/дуа
      var iw = (BY_CAT.iwords || []).concat(BY_CAT.names || []).filter(function (it) { return it.tr; });
      var texts = (BY_CAT.quran || []).concat(BY_CAT.hadith || [], BY_CAT.dua || []).filter(function (it) { return it.en.length < 260; });
      // по уровню ученика: новичку — короткие и простые аяты и хадисы (если таких хватает)
      if (S.lvl) {
        var maxLen = S.lvl <= 1 ? 170 : S.lvl === 2 ? 220 : 260;
        var fit = texts.filter(function (it) { return (it.l || 3) <= S.lvl + 1 && it.en.length < maxLen; });
        if (fit.length >= 10) texts = fit;
      }
      var ruW = iw.map(function (it) { return it.ru; }), ruT = texts.map(function (it) { return it.ru; });
      shuffle(iw).slice(0, 4).forEach(function (it) {
        qs.push({ hint: it.c === 'names' ? 'Что означает это имя Аллаха?' : 'Что означает это слово?', q: it.tr, ar: it.ar, ans: it.ru, opts: distinctOpts(it.ru, ruW, 4), explain: '<span class="serif">' + esc(it.en) + '</span>', item: it });
      });
      shuffle(texts.filter(function (it) { return it.c !== 'dua'; })).slice(0, 3).forEach(function (it) {
        var a = it.c === 'quran' ? '📖 Коран' : '📿 Хадис';
        qs.push({ hint: 'Откуда эти слова?', q: it.en, small: true, serif: true, ans: a, opts: ['📖 Коран', '📿 Хадис'], two: true, explain: '<b>' + esc(refLabel(it.ref)) + '</b><br><span class="muted">' + esc(it.ru) + '</span>', item: it });
      });
      shuffle(texts).slice(0, 3).forEach(function (it) {
        qs.push({ hint: 'Выбери правильный перевод', q: it.en, small: true, serif: true, ans: it.ru, opts: distinctOpts(it.ru, ruT, 3), explain: esc(refLabel(it.ref)), item: it });
      });
      qs = shuffle(qs);
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
    if (mode === 'dict' || mode === 'back') return startTyping(mode);
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
          (q.ar ? '<div class="q-ar" dir="rtl" lang="ar">' + esc(q.ar) + '</div>' : '') +
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
  // 14b. Универсальный квиз с вариантами ответа
  // =====================================================================
  // q: { hint, q | qhtml, ans, opts, explain, say, serif, small }; o.onDone(score, total, body)
  function runQuiz(title, qs, o) {
    o = o || {};
    var i = 0, score = 0;
    pushLayer(title, function (body) {
      function show() {
        if (i >= qs.length) return o.onDone(score, qs.length, body);
        var q = qs[i];
        body.innerHTML = '<div class="qtop"><span>Вопрос ' + (i + 1) + ' из ' + qs.length + '</span><span>✅ ' + score + '</span></div><div class="qprog"><i style="width:' + (i / qs.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface qcard' });
        card.innerHTML = '<div class="hint">' + q.hint + '</div>' +
          (q.ar ? '<div class="q-ar" dir="rtl" lang="ar">' + esc(q.ar) + '</div>' : '') +
          '<div class="q' + (q.small ? ' small' : '') + (q.serif ? ' serif' : '') + '">' + (q.qhtml || esc(q.q)) + '</div>' +
          (q.say ? '<div class="extra"><button class="btn sm ghost" id="say">' + I.vol + ' Произношение</button></div>' : '');
        body.appendChild(card);
        if (q.say) { var sb = $('#say', card); sb.addEventListener('click', function () { tts.speak(q.say, sb, 0.85); }); setTimeout(function () { tts.speak(q.say, null, 0.85); }, 250); }
        var opts = h('div', { class: 'opts' + (q.two ? ' two' : '') });
        q.opts.forEach(function (op) {
          var b = h('button', { class: 'opt' }, esc(op));
          b.addEventListener('click', function () { answer(op, b, opts); });
          opts.appendChild(b);
        });
        body.appendChild(opts);
      }
      var locked = false;
      function answer(op, b, opts) {
        if (locked) return; locked = true;
        var q = qs[i], ok = op === q.ans;
        $$('.opt', opts).forEach(function (x) { if (x.textContent === q.ans) x.classList.add('good'); else if (x !== b) x.classList.add('dim'); });
        if (ok) { score++; addXP(2, b); haptic('success'); } else { b.classList.add('bad'); haptic('error'); }
        activity(1);
        if (q.item) markSeen(q.item);
        if (o.onAnswer) o.onAnswer(q, ok);
        if (!ok || q.explain) {
          if (q.explain) body.appendChild(h('div', { class: 'explain' }, q.explain));
          var nb = h('button', { class: 'btn primary block mt' }, i + 1 < qs.length ? 'Дальше →' : 'Результат');
          nb.addEventListener('click', function () { i++; locked = false; show(); });
          body.appendChild(nb);
          nb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else setTimeout(function () { i++; locked = false; show(); }, 650);
      }
      show();
    }, o.layer);
  }
  function resultHTML(score, total, msg) {
    return '<div class="result"><div class="score">' + score + '/' + total + '</div><div class="msg">' + msg + '</div></div>';
  }
  function scoreMsg(score, total) {
    var p = score / total;
    return p >= 0.9 ? 'Великолепно! 🌟' : p >= 0.7 ? 'Очень хорошо! 💪' : p >= 0.5 ? 'Неплохо! Дальше — лучше 📖' : 'Не сдавайся — повторение творит чудеса 🦉';
  }

  // =====================================================================
  // 14c. Аниме по тайтлам
  // =====================================================================
  var TITLE_COLORS = ['#ff4f9a', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#d946ef', '#14b8a6', '#f97316'];
  function openAnimeTitles() {
    pushLayer('🌸 Аниме по тайтлам', function (body) {
      var titles = animeTitles();
      body.innerHTML = '<div class="sub" style="margin-bottom:14px">Выбери тайтл и читай цитаты только из него. Так одни и те же слова встречаются снова и снова — это называется «узкое чтение», и оно отлично работает.</div>';
      var all = h('button', { class: 'btn primary block' }, I.play + ' Все аниме лентой · ' + BY_CAT.anime.length);
      all.addEventListener('click', function () { openFeed({ cat: 'anime' }); });
      body.appendChild(all);
      body.appendChild(h('div', { class: 'spacer' }));
      var grid = h('div', { class: 'titles' });
      titles.forEach(function (t, k) {
        var items = BY_CAT.anime.filter(function (it) { return franchise(it.s) === t[0]; });
        var seen = items.filter(function (it) { return S.seen[it.id]; }).length;
        var minL = Math.min.apply(null, items.map(function (it) { return it.l; }));
        var hue = TITLE_COLORS[(t[0].length * 7 + t[0].charCodeAt(0)) % TITLE_COLORS.length];
        var b = h('button', { class: 'titlecard', style: '--c:' + hue });
        b.innerHTML = '<b>' + esc(t[0]) + '</b><small>' + t[1] + ' ' + plural(t[1], 'цитата', 'цитаты', 'цитат') + ' · от ' + CEFR[minL] + (seen ? ' · ✓ ' + seen : '') + '</small><div class="mbar"><i style="width:' + Math.round(seen / t[1] * 100) + '%"></i></div>';
        b.addEventListener('click', function () { openFeed({ cat: 'anime', src: t[0] }); });
        grid.appendChild(b);
      });
      body.appendChild(grid);
    });
  }

  // =====================================================================
  // 14d. Ислам
  // =====================================================================
  function openIslam() {
    markPlan('faith');
    pushLayer('☪️ Ислам', function (body) {
      body.innerHTML = '<div class="surface bism"><div class="a" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div><div class="e serif">In the name of Allah, the Most Gracious, the Most Merciful.</div><div class="r">Во имя Аллаха, Милостивого, Милосердного.</div></div>' +
        '<div class="sub" style="margin:12px 2px 0">Учим английский на словах Корана и Сунны. Переводы смыслов простые — для начинающих. У каждой карточки есть источник: quran.com и sunnah.com.</div>';
      var daily = [['quran', '📖 Аят дня'], ['hadith', '📿 Хадис дня'], ['dua', '🤲 Дуа дня']];
      daily.forEach(function (d) {
        var it = islamDaily(d[0]); if (!it) return;
        body.appendChild(h('h2', {}, d[1]));
        body.appendChild(cardEl(it, { sheet: true }));
      });
      body.appendChild(h('h2', {}, '📚 Разделы'));
      var grid = h('div', { class: 'catgrid' });
      ISLAM_CATS.forEach(function (c) { if (BY_CAT[c.key].length) grid.appendChild(catTile(c)); });
      body.appendChild(grid);
      var prophets = STORIES.filter(function (s) { return s.g === 'islam'; });
      if (prophets.length) {
        body.appendChild(h('h2', {}, '🕋 Истории пророков'));
        var pl = h('div', { class: 'list' });
        prophets.forEach(function (s) { pl.appendChild(storyCard(s)); });
        body.appendChild(pl);
      }
      body.appendChild(h('h2', {}, '🎯 Проверь себя'));
      var qb = h('button', { class: 'mode', style: '--c:#10b981;width:100%' }, '<b>🤲</b><span>Квиз о вере</span><small>Значения слов, источники, переводы аятов и хадисов</small>');
      qb.addEventListener('click', function () { startQuiz('faith'); });
      body.appendChild(qb);
      var feedBtn = h('button', { class: 'btn block mt' }, I.play + ' Все исламские карточки лентой');
      feedBtn.addEventListener('click', function () { openFeed({ mood: 'faith' }); });
      body.appendChild(feedBtn);
      body.appendChild(switchRowBox('Показывать в общей ленте', 'Аяты и хадисы будут иногда появляться среди обычных карточек (но никогда — в «смешном» и «жутком»)', 'islamFeed'));
    });
  }
  function switchRowBox(label, sub, key) {
    var box = h('div', { class: 'surface mt', style: 'overflow:hidden' });
    box.appendChild(switchRow(label, sub, key));
    return box;
  }

  // =====================================================================
  // 14e. Курс «1000 главных слов»
  // =====================================================================
  function courseWords(d) {
    // «i» в словаре курса — это местоимение I, пишем с большой буквы
    return COURSE.slice(d * DAY_SIZE, d * DAY_SIZE + DAY_SIZE).map(function (c) { return c[0] === 'i' ? ['I'].concat(c.slice(1)) : c; });
  }
  function openCourse() {
    pushLayer('🧱 1000 главных слов', function (body) {
      var cur = courseDay(), nDone = Object.keys(S.course.done).length;
      body.innerHTML = '<div class="surface coursehead"><div class="big">День ' + (cur + 1) + ' <small>из ' + COURSE_DAYS + '</small></div>' +
        '<div class="bar"><i style="width:' + (nDone / COURSE_DAYS * 100) + '%"></i></div>' +
        '<div class="sub mt">Выучено слов: <b>' + Math.min(COURSE.length, nDone * DAY_SIZE) + '</b> из ' + COURSE.length + '</div></div>' +
        '<div class="note">💡 Самая частая тысяча слов покрывает примерно три четверти любого обычного текста. По 10 слов в день — и через 100 дней ты понимаешь большую часть простого английского.</div>';
      var start = h('button', { class: 'btn primary block mt' }, I.play + (S.course.done[cur] ? ' Повторить день ' : ' Начать день ') + (cur + 1));
      start.addEventListener('click', function () { courseDayFlow(cur); });
      body.appendChild(start);
      body.appendChild(h('h2', {}, '📋 Слова дня ' + (cur + 1)));
      var list = h('div', { class: 'wlist' });
      courseWords(cur).forEach(function (c) { list.appendChild(courseRow(c)); });
      body.appendChild(list);
      body.appendChild(h('h2', {}, '🗓 Все дни'));
      var grid = h('div', { class: 'daygrid' });
      for (var d = 0; d < COURSE_DAYS; d++) (function (d) {
        var st = S.course.done[d] ? 'done' : d === cur ? 'cur' : d > cur ? 'lock' : '';
        var b = h('button', { class: 'day ' + st }, S.course.done[d] ? '✓' : String(d + 1));
        b.addEventListener('click', function () {
          if (d > cur) { toast('🔒 Сначала пройди день ' + (cur + 1)); return; }
          courseDayFlow(d);
        });
        grid.appendChild(b);
      })(d);
      body.appendChild(grid);
    }, { onClose: refreshCurrent, live: true });
  }
  function courseRow(c) {
    var row = h('div', { class: 'wrow' });
    row.innerHTML = '<div class="tx"><div class="en">' + esc(c[0]) + (c[2] ? ' <span class="ipa-s">/' + esc(c[2]) + '/</span>' : '') + '</div><div class="ru">' + esc(c[1]) + '</div></div>';
    var say = h('button', { class: 'iconbtn' }, I.vol);
    say.addEventListener('click', function () { tts.speak(c[0], say, 0.85); });
    row.appendChild(say);
    return row;
  }
  function courseDayFlow(d) {
    var words = courseWords(d), i = 0;
    pushLayer('🧱 День ' + (d + 1), function (body) {
      function learn() {
        if (i >= words.length) return quiz();
        var c = words[i], ex = c[3] && BY_ID[c[3]];
        body.innerHTML = '<div class="qtop"><span>Слово ' + (i + 1) + ' из ' + words.length + '</span><span>Знакомство</span></div><div class="qprog"><i style="width:' + (i / words.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface flash learncard' });
        card.innerHTML = '<div class="big serif">' + esc(c[0]) + '</div>' + (c[2] ? '<div class="ipa">/' + esc(c[2]) + '/</div>' : '') +
          '<div class="tr">' + esc(c[1]) + '</div>' +
          (ex ? '<div class="exbox"><div class="k">Пример' + (ex.a || ex.s ? ' · ' + esc(ex.a || ex.s) : '') + '</div><div class="en serif">' + wordsHTML(ex.en, ex.w) + '</div><div class="veil"><div class="ru">' + esc(ex.ru) + '</div><div class="cover">Нажми, чтобы увидеть перевод</div></div></div>' : '');
        body.appendChild(card);
        var row = h('div', { class: 'tools-row' });
        var say = h('button', { class: 'btn sm' }, I.vol + ' Слово');
        say.addEventListener('click', function () { tts.speak(c[0], say, 0.8); });
        row.appendChild(say);
        if (ex) {
          var sayEx = h('button', { class: 'btn sm' }, I.vol + ' Пример');
          sayEx.addEventListener('click', function () { tts.speak(ex.en, sayEx, null, card.querySelector('.exbox .en')); });
          row.appendChild(sayEx);
        }
        body.appendChild(row);
        card.addEventListener('click', function (e) {
          var w = e.target.closest('.w'); if (w && ex) { wordSheet(w.textContent, ex, w); return; }
          var v = e.target.closest('.veil'); if (v) v.classList.add('open');
        });
        var nb = h('button', { class: 'btn primary block mt' }, i + 1 < words.length ? 'Дальше →' : '🎯 Проверить себя');
        nb.addEventListener('click', function () { i++; learn(); });
        body.appendChild(nb);
        setTimeout(function () { tts.speak(c[0], say, 0.8); }, 250);
      }
      function quiz() {
        popLayer();
        // в вариантах — только главное значение: «из; (родительный падеж…)» → «из», иначе верный ответ видно по длине
        var short = function (ru) { return String(ru).split(/\s*[;(]/)[0].trim() || String(ru); };
        var ruPool = COURSE.map(function (c) { return short(c[1]); });
        var qs = shuffle(words).map(function (c) {
          return { hint: 'Что значит это слово?', q: c[0], say: c[0], ans: short(c[1]), opts: distinctOpts(short(c[1]), ruPool, 4), word: c, explain: short(c[1]) !== c[1] ? esc(c[1]) : undefined };
        });
        var res = {};
        setTimeout(function () {
          runQuiz('🧱 Проверка: день ' + (d + 1), qs, {
            onAnswer: function (q, ok) { res[q.word[0]] = ok; },
            onDone: function (score, total, qb) {
              // Слова уходят в интервальные повторения
              words.forEach(function (c) {
                var k = c[0].toLowerCase();
                var ok = res[c[0]];
                if (!S.words[k]) S.words[k] = { en: c[0], ru: c[1], b: ok ? 1 : 0, d: today() + (ok ? 1 : 0), n: 1, ctx: 'course', at: Date.now() };
              });
              var first = !S.course.done[d];
              S.course.done[d] = Date.now();
              markPlan('words');
              activity(5);
              if (first) S.xp += 20;
              qb.innerHTML = resultHTML(score, total, scoreMsg(score, total)) + '<div class="sub center">' + (first ? '+20 XP за день · ' : '') + 'слова добавлены в повторения 🔁</div>';
              var nx = h('button', { class: 'btn primary block mt' }, 'Готово');
              nx.addEventListener('click', function () { popLayer(); });
              qb.appendChild(nx);
              confetti(); haptic('success'); checkAch(); save(); refreshBadges();
            }
          }, { onClose: refreshCurrent });
        }, 250);
      }
      learn();
    });
  }
  function refreshCurrent() { if (curTab && curTab !== 'feed' && RENDER[curTab]) RENDER[curTab]($('.tab[data-tab=' + curTab + ']')); refreshBadges(); }

  // =====================================================================
  // 14f. Грамматика
  // =====================================================================
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function openGrammar() {
    pushLayer('📘 Грамматика', function (body) {
      var nDone = Object.keys(S.gram).length;
      body.innerHTML = '<div class="sub" style="margin-bottom:12px">Короткие уроки: правило по-русски — примеры из аниме, кино и игр — упражнение. Пройдено ' + nDone + ' из ' + GRAMMAR.length + '.</div>';
      [1, 2, 3].forEach(function (lv) {
        var ls = GRAMMAR.filter(function (l) { return l.lv === lv; });
        if (!ls.length) return;
        body.appendChild(h('h2', {}, lvChip(lv) + ' ' + CEFR_NAME[lv]));
        var list = h('div', { class: 'list' });
        ls.forEach(function (l) {
          var g = S.gram[l.id];
          var b = h('button', { class: 'row-item lesson' + (g ? ' done' : '') });
          b.innerHTML = '<div class="em">' + l.icon + '</div><div class="tx"><div class="t">' + esc(l.title) + '</div><div class="a">' + esc(l.short) + '</div></div><div class="marks">' + (g ? '✅ ' + g.s + '/' + g.n : '') + '</div>';
          b.addEventListener('click', function () { openLesson(l.id); });
          list.appendChild(b);
        });
        body.appendChild(list);
      });
    }, { onClose: refreshCurrent, live: true });
  }
  function openLesson(id) {
    var les = GRAMMAR.filter(function (l) { return l.id === id; })[0];
    if (!les) return;
    pushLayer(les.icon + ' ' + esc(les.title), function (body) {
      body.innerHTML = '<div class="lesson-head">' + lvChip(les.lv) + '<h1>' + esc(les.title) + '</h1><div class="sub">' + esc(les.short) + '</div></div>';
      les.parts.forEach(function (p) {
        if (p[0] === 't') body.appendChild(h('p', { class: 'ltext' }, md(p[1])));
        else if (p[0] === 'tip') body.appendChild(h('div', { class: 'ltip' }, '💡 ' + md(p[1])));
        else if (p[0] === 'tb') {
          var rows = p[1];
          var html = '<table><thead><tr>' + rows[0].map(function (c) { return '<th>' + md(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
            rows.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + md(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
          body.appendChild(h('div', { class: 'ltable' }, html));
        }
      });
      if (les.ex.length) {
        body.appendChild(h('h2', {}, '🎬 Примеры из жизни'));
        les.ex.forEach(function (ex) {
          var pit = { id: 'g:' + les.id, en: ex[0], ru: ex[1], w: [], c: 'books' };
          var el = h('div', { class: 'surface lex' });
          el.innerHTML = '<div class="en serif">' + wordsHTML(ex[0]) + '</div>' + (ex[2] ? '<div class="src">— ' + esc(ex[2]) + '</div>' : '') +
            '<div class="veil"><div class="ru">' + esc(ex[1]) + '</div><div class="cover">Переведи в голове — и нажми</div></div>';
          var say = h('button', { class: 'iconbtn' }, I.vol);
          say.addEventListener('click', function (e) { e.stopPropagation(); tts.speak(ex[0], say, null, el.querySelector('.en')); });
          el.appendChild(say);
          el.addEventListener('click', function (e) {
            var w = e.target.closest('.w'); if (w) { wordSheet(w.textContent, pit, w); return; }
            var v = e.target.closest('.veil'); if (v) v.classList.add('open');
          });
          body.appendChild(el);
        });
      }
      var qb = h('button', { class: 'btn primary block mt' }, '✍️ Упражнение · ' + les.q.length + ' ' + plural(les.q.length, 'вопрос', 'вопроса', 'вопросов'));
      qb.addEventListener('click', function () { lessonQuiz(les); });
      body.appendChild(qb);
    });
  }
  function lessonQuiz(les) {
    var qs = shuffle(les.q).map(function (q) {
      return { hint: 'Выбери правильный вариант', qhtml: esc(q[0]).replace(/___/g, '<span class="gap">?</span>'), serif: true, small: q[0].length > 50, ans: q[1], opts: shuffle(q.slice(1)) };
    });
    runQuiz('✍️ ' + esc(les.title), qs, {
      onDone: function (score, total, body) {
        var prev = S.gram[les.id];
        if (!prev || score > prev.s) S.gram[les.id] = { s: score, n: total, t: Date.now() };
        if (!prev) { S.xp += 15; S.st.gram++; }
        markPlan('gram');
        body.innerHTML = resultHTML(score, total, scoreMsg(score, total)) + (!prev ? '<div class="sub center">+15 XP за новый урок</div>' : '');
        var nx = nextLesson();
        if (nx && nx.id !== les.id && !S.gram[nx.id]) {
          var b = h('button', { class: 'btn primary block mt' }, 'Следующий урок: ' + esc(nx.title));
          b.addEventListener('click', function () { popLayer(); popLayer(); setTimeout(function () { openLesson(nx.id); }, 250); });
          body.appendChild(b);
        }
        var again = h('button', { class: 'btn block mt' }, 'Ещё раз');
        again.addEventListener('click', function () { popLayer(); setTimeout(function () { lessonQuiz(les); }, 240); });
        body.appendChild(again);
        if (score >= total * 0.8) confetti();
        haptic('success'); checkAch(); save();
      }
    });
  }

  // =====================================================================
  // 14g. Тест уровня
  // =====================================================================
  var LEVEL_TEXT = ['',
    'Ты в самом начале пути — это лучшее место для старта! Лента покажет короткие и простые фразы, озвучка будет медленнее. Начни с «Основ» и курса «1000 слов».',
    'Ты знаешь базу. Лента подберёт фразы попроще и чуть сложнее. Продолжай курс слов и уроки грамматики A2.',
    'Средний уровень — ты уже многое понимаешь. Читай рассказы целиком и цитаты из аниме без подсказок.',
    'Выше среднего! Бери классику, стихи и сложные цитаты — и смотри аниме с английскими субтитрами.',
    'Продвинутый уровень. Тебе доступно всё: поэзия, Шекспир, философы. Ищи в тексте редкие слова и добавляй их в словарь.'];
  function setLevel(l) {
    S.lvl = l;
    if (l <= 1 && S.set.rate >= 0.9) S.set.rate = 0.8;
    feedState.filter = myFeed(); feedState.built = false;
    checkAch(); save();
  }
  function startLevelTest() {
    pushLayer('🎯 Тест уровня', function (body) {
      body.innerHTML = '<div class="onb" style="min-height:auto;padding:20px 4px"><div class="big">🎯</div><h1>Какой у тебя уровень?</h1><p>' + LTEST.length + ' вопросов от простого к сложному, около 3 минут. Если вопросы станут слишком трудными, тест закончится сам. Не угадывай — если не знаешь, выбирай честно.</p></div>';
      var go1 = h('button', { class: 'btn primary block' }, 'Начать тест');
      go1.addEventListener('click', function () { popLayer(); setTimeout(runLevelTest, 240); });
      var beg = h('button', { class: 'btn block mt' }, '🌱 Я совсем новичок — сразу A1');
      beg.addEventListener('click', function () { setLevel(1); popLayer(); setTimeout(function () { levelResult(1); }, 240); });
      body.appendChild(go1); body.appendChild(beg);
      if (S.lvl) body.appendChild(h('div', { class: 'center faint mt' }, 'Сейчас у тебя: ' + CEFR[S.lvl]));
    });
  }
  function runLevelTest() {
    var byLv = {}; LTEST.forEach(function (q) { (byLv[q[0]] = byLv[q[0]] || []).push(q); });
    var order = []; [1, 2, 3, 4, 5].forEach(function (l) { (byLv[l] || []).forEach(function (q) { order.push(q); }); });
    var i = 0, right = {}, asked = {}, result = 0;
    pushLayer('🎯 Тест уровня', function (body) {
      function show() {
        if (i >= order.length) return finish(5);
        var q = order[i], lv = q[0];
        body.innerHTML = '<div class="qtop"><span>Вопрос ' + (i + 1) + ' из ' + order.length + '</span><span>' + lvChip(lv) + '</span></div><div class="qprog"><i style="width:' + (i / order.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface qcard' });
        card.innerHTML = '<div class="hint">Выбери ответ</div><div class="q serif' + (q[1].length > 40 ? ' small' : '') + '">' + esc(q[1]).replace(/___/g, '<span class="gap">?</span>') + '</div>';
        body.appendChild(card);
        var opts = h('div', { class: 'opts' });
        shuffle(q.slice(2)).concat(['🤷 Не знаю']).forEach(function (op) {
          var b = h('button', { class: 'opt' }, esc(op));
          b.addEventListener('click', function () {
            asked[lv] = (asked[lv] || 0) + 1;
            if (op === q[2]) right[lv] = (right[lv] || 0) + 1;
            haptic('select');
            i++;
            // уровень закончился — проверяем, прошёл ли его
            if (i >= order.length || order[i][0] !== lv) {
              var n = byLv[lv].length;
              if ((right[lv] || 0) < Math.ceil(n * 0.6)) return finish(Math.max(1, lv - 1));
            }
            show();
          });
          opts.appendChild(b);
        });
        body.appendChild(opts);
      }
      function finish(l) { result = l; setLevel(l); popLayer(); setTimeout(function () { levelResult(l); }, 240); }
      show();
    });
  }
  function levelResult(l) {
    pushLayer('🎯 Твой уровень', function (body) {
      body.innerHTML = '<div class="result"><div class="cefr-big" style="--lc:' + CEFR_COLOR[l] + '">' + CEFR[l] + '</div><div class="msg">' + CEFR_NAME[l] + '</div><div class="sub" style="max-width:420px;margin:8px auto 0;line-height:1.55">' + LEVEL_TEXT[l] + '</div></div>';
      if (l <= 2) {
        var c = h('button', { class: 'btn primary block' }, '🧱 Начать курс «1000 слов»');
        c.addEventListener('click', function () { popLayer(); setTimeout(openCourse, 240); });
        body.appendChild(c);
        var b = h('button', { class: 'btn block mt' }, '🌱 Открыть «Основы»');
        b.addEventListener('click', function () { popLayer(); setTimeout(function () { openCategory('basics'); }, 240); });
        body.appendChild(b);
      }
      var f = h('button', { class: 'btn' + (l > 2 ? ' primary' : '') + ' block mt' }, '▶️ Лента моего уровня');
      f.addEventListener('click', function () { openFeed(myFeed()); });
      body.appendChild(f);
      confetti(); haptic('success');
    }, { onClose: refreshCurrent });
  }

  // =====================================================================
  // 14h. Мои находки и мой текст
  // =====================================================================
  function roughLevel(en) {
    var n = (en.match(/[A-Za-z']+/g) || []).length;
    return n <= 6 ? 1 : n <= 12 ? 2 : n <= 22 ? 3 : 4;
  }
  function syncFinds() {
    for (var i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i].c === 'mine') { delete BY_ID[ITEMS[i].id]; ITEMS.splice(i, 1); }
    BY_CAT.mine = [];
    (S.finds || []).forEach(function (f) {
      var it = { id: f.id, c: 'mine', en: f.en, ru: f.ru, t: [], l: roughLevel(f.en), a: 'Моя находка' };
      if (f.src) it.s = f.src;
      ITEMS.push(it); BY_ID[it.id] = it; BY_CAT.mine.push(it);
    });
  }
  function addFind(en, ru, src) {
    en = String(en || '').trim(); ru = String(ru || '').trim();
    if (!en || !ru) return false;
    if (S.finds.some(function (f) { return f.en.toLowerCase() === en.toLowerCase(); })) { toast('Такая находка уже есть'); return false; }
    S.finds.unshift({ id: 'f' + Date.now().toString(36), en: en.slice(0, 600), ru: ru.slice(0, 600), src: String(src || '').trim().slice(0, 60), at: Date.now() });
    syncFinds();
    S.xp += 3; activity(1); checkAch(); save();
    toast('⭐ Находка сохранена — она появится в ленте и повторениях'); haptic('success');
    return true;
  }
  function openFinds() {
    pushLayer('⭐ Мои находки', function (body) {
      body.innerHTML = '<div class="sub" style="margin-bottom:12px">Услышал крутую фразу в аниме, игре или книге? Запиши её — я переведу, и она станет твоей карточкой: с лентой, повторениями и озвучкой.</div>';
      var box = h('div', { class: 'surface trbox' });
      var ta = h('textarea', { placeholder: 'Английская фраза, например: People die when they are killed.', maxlength: '600' });
      var src = h('input', { class: 'srcinput', placeholder: 'Откуда? (аниме, игра, книга — необязательно)', maxlength: '60' });
      var bar = h('div', { class: 'trbar' });
      var tb = h('button', { class: 'btn primary sm' }, 'Перевести');
      bar.appendChild(h('div', { class: 'dir' }, 'EN → RU')); bar.appendChild(tb);
      box.appendChild(ta); box.appendChild(src); box.appendChild(bar);
      body.appendChild(box);
      var out = h('div', {}); body.appendChild(out);
      tb.addEventListener('click', function () {
        var en = ta.value.trim(); if (!en) { ta.focus(); return; }
        if (isRu(en)) { toast('Сюда — английскую фразу 🙂'); return; }
        tb.disabled = true; tb.textContent = '…';
        translateText(en).catch(function () { return ''; }).then(function (ru) {
          tb.disabled = false; tb.textContent = 'Перевести';
          out.innerHTML = '';
          var card = h('div', { class: 'surface trbox mt' });
          var rta = h('textarea', { placeholder: 'Перевод (можно поправить)', maxlength: '600' });
          rta.value = ru || '';
          card.appendChild(h('div', { class: 'sub', style: 'padding:12px 14px 0' }, ru ? 'Проверь перевод — можно исправить:' : 'Не получилось перевести автоматически — напиши перевод сам:'));
          card.appendChild(rta);
          var sb = h('button', { class: 'btn primary block' }, I.star + ' Сохранить карточку');
          sb.addEventListener('click', function () {
            if (addFind(en, rta.value, src.value)) { popLayer(); setTimeout(openFinds, 240); }
          });
          out.appendChild(card); out.appendChild(h('div', { class: 'spacer' })); out.appendChild(sb);
        });
      });
      if (S.finds.length) {
        body.appendChild(h('h2', {}, '⭐ Мои карточки · ' + S.finds.length));
        var play = h('button', { class: 'btn block' }, I.play + ' Читать лентой');
        play.addEventListener('click', function () { openFeed({ cat: 'mine' }); });
        body.appendChild(play); body.appendChild(h('div', { class: 'spacer' }));
        var list = h('div', { class: 'list' });
        S.finds.forEach(function (f) {
          var it = BY_ID[f.id]; if (!it) return;
          var row = rowItem(it);
          var del = h('button', { class: 'iconbtn del' }, I.trash);
          del.addEventListener('click', function (e) {
            e.stopPropagation();
            S.finds = S.finds.filter(function (x) { return x.id !== f.id; });
            delete S.rate[f.id]; delete S.fav[f.id];
            syncFinds(); save(); row.remove(); toast('Удалено');
          });
          row.appendChild(del);
          list.appendChild(row);
        });
        body.appendChild(list);
      }
    }, { onClose: refreshCurrent });
  }

  function splitSentences(text) {
    return (text.match(/[^.!?…]+[.!?…]+["'”’)\]]*\s*|[^.!?…]+$/g) || [text]).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function openMyText() {
    pushLayer('📥 Мой текст', function (body) {
      body.innerHTML = '<div class="sub" style="margin-bottom:12px">Вставь любой английский текст: субтитры, мангу, пост, главу книги. Каждое слово можно будет нажать, каждое предложение — послушать и перевести.</div>';
      var box = h('div', { class: 'surface trbox' });
      var title = h('input', { class: 'srcinput', placeholder: 'Название (необязательно)', maxlength: '60' });
      var ta = h('textarea', { placeholder: 'Вставь английский текст сюда…', maxlength: '6000', style: 'min-height:170px' });
      box.appendChild(title); box.appendChild(ta);
      body.appendChild(box);
      var ob = h('button', { class: 'btn primary block mt' }, I.book + ' Открыть в читалке');
      ob.addEventListener('click', function () {
        var text = ta.value.trim();
        if (text.length < 3) { ta.focus(); return; }
        var t = title.value.trim() || text.split(/\s+/).slice(0, 5).join(' ') + '…';
        S.texts = [{ id: 't' + Date.now().toString(36), title: t.slice(0, 60), text: text.slice(0, 6000), at: Date.now() }].concat(S.texts.filter(function (x) { return x.text !== text; })).slice(0, 6);
        save();
        readText(S.texts[0]);
      });
      body.appendChild(ob);
      if (S.texts.length) {
        body.appendChild(h('h2', {}, '🕘 Мои тексты'));
        var list = h('div', { class: 'list' });
        S.texts.forEach(function (tx) {
          var b = h('button', { class: 'row-item' });
          b.innerHTML = '<div class="em">📄</div><div class="tx"><div class="t">' + esc(tx.title) + '</div><div class="a">' + splitSentences(tx.text).length + ' предложений · ' + dayLabel(dayNum(new Date(tx.at))) + '</div></div>';
          b.addEventListener('click', function () { readText(tx); });
          var del = h('button', { class: 'iconbtn del' }, I.trash);
          del.addEventListener('click', function (e) { e.stopPropagation(); S.texts = S.texts.filter(function (x) { return x.id !== tx.id; }); save(); b.remove(); });
          b.appendChild(del);
          list.appendChild(b);
        });
        body.appendChild(list);
      }
    });
  }
  function readText(tx) {
    pushLayer('📄 ' + esc(tx.title), function (body) {
      body.appendChild(h('div', { class: 'sub', style: 'margin-bottom:6px' }, '👆 Нажми на слово — перевод. 🔊 — послушать. 🌍 — перевод предложения. ⭐ — в находки.'));
      var paras = tx.text.split(/\n\s*\n|\n/).map(function (p) { return p.trim(); }).filter(Boolean);
      var n = 0;
      paras.forEach(function (p) {
        splitSentences(p).forEach(function (s) {
          n++;
          var pit = { id: 'mytext', en: s, ru: '', w: [], c: 'books' };
          var el = h('div', { class: 'para' });
          el.innerHTML = '<div class="num">' + n + '</div><div class="en serif">' + wordsHTML(s) + '</div>' +
            '<div class="tools"><button data-a="say">' + I.vol + '</button><button data-a="tr">' + I.globe + ' Перевод</button><button data-a="find">' + I.star + '</button></div><div class="ru serif hidden"></div>';
          el.addEventListener('click', function (e) {
            var w = e.target.closest('.w'); if (w) { wordSheet(w.textContent, pit, w); return; }
            var a = e.target.closest('[data-a]'); if (!a) return;
            var act = a.getAttribute('data-a'), ru = el.querySelector('.ru');
            if (act === 'say') { if (a.classList.contains('playing')) tts.stop(); else tts.speak(s, a, null, el.querySelector('.en')); }
            else if (act === 'tr') {
              if (!ru.classList.contains('hidden')) { ru.classList.add('hidden'); return; }
              ru.classList.remove('hidden'); ru.textContent = '…';
              translateText(s).then(function (r) { ru.textContent = r; pit.ru = r; activity(1); }).catch(function () { ru.textContent = 'Нет связи с переводчиком 😕'; });
            } else if (act === 'find') {
              var save1 = function (r) { addFind(s, r, tx.title); };
              if (pit.ru) save1(pit.ru); else translateText(s).then(save1).catch(function () { toast('Нужен интернет для перевода'); });
            }
          });
          body.appendChild(el);
        });
      });
      S.st.tr++; activity(2); save();
    });
  }

  // =====================================================================
  // 14i. Диктант и обратный перевод (ввод с клавиатуры)
  // =====================================================================
  function normWords(s) {
    return String(s).toLowerCase().replace(/[’']/g, "'").replace(/\b(i'm)\b/g, 'i am').replace(/\b(it's)\b/g, 'it is').replace(/\b(don't)\b/g, 'do not').replace(/\b(can't)\b/g, 'can not').replace(/\bcannot\b/g, 'can not')
      .replace(/\b(you're)\b/g, 'you are').replace(/\b(we're)\b/g, 'we are').replace(/\b(they're)\b/g, 'they are').replace(/\b(i'll)\b/g, 'i will').replace(/\b(that's)\b/g, 'that is').replace(/\b(doesn't)\b/g, 'does not').replace(/\b(didn't)\b/g, 'did not').replace(/\b(isn't)\b/g, 'is not').replace(/\b(won't)\b/g, 'will not')
      .replace(/[^a-z0-9' ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  }
  // Сравнение ответа с оригиналом: какие слова оригинала совпали (наибольшая общая подпоследовательность)
  function diffWords(orig, answer) {
    var a = normWords(orig), b = normWords(answer);
    var dp = []; for (var i = 0; i <= a.length; i++) { dp.push([]); for (var j = 0; j <= b.length; j++) dp[i].push(0); }
    for (i = a.length - 1; i >= 0; i--) for (j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var ok = [], x = 0, y = 0;
    while (x < a.length && y < b.length) { if (a[x] === b[y]) { ok[x] = true; x++; y++; } else if (dp[x + 1][y] >= dp[x][y + 1]) x++; else y++; }
    return { words: a, ok: ok, score: a.length ? dp[0][0] / Math.max(a.length, b.length) : 0 };
  }
  function typingPool(mode) {
    var max = Math.max(1, S.lvl || 1) + (mode === 'dict' ? 0 : 1);
    var pool = ITEMS.filter(function (it) {
      if (isIslam(it) || it.c === 'mine' || it.en.indexOf('\n') >= 0 || ['twisters', 'riddles', 'words', 'slang'].indexOf(it.c) >= 0) return false;
      var n = (it.en.match(/[A-Za-z']+/g) || []).length;
      return it.l <= max && n >= 2 && n <= (mode === 'dict' ? 9 : 11) && /^[A-Za-z0-9 ,.!?'’"“”-]+$/.test(it.en);
    });
    var hq = pool.filter(function (it) { return tts.hasNeural(it.en); });
    var base = hq.length >= 15 ? hq : pool;
    if ((S.lvl || 1) <= 2) {
      var easy = base.filter(function (it) { return it.c === 'basics' || it.l === 1; });
      if (easy.length >= 10) base = easy;
    }
    return base;
  }
  function startTyping(mode) {
    var qs = shuffle(typingPool(mode)).slice(0, 5);
    if (!qs.length) { toast('Пока не хватает фраз для этого режима'); return; }
    var i = 0, total = 0;
    var title = mode === 'dict' ? '🎧 Диктант' : '✍️ Обратный перевод';
    pushLayer(title, function (body) {
      function show() {
        if (i >= qs.length) return finish();
        var it = qs[i];
        body.innerHTML = '<div class="qtop"><span>Фраза ' + (i + 1) + ' из ' + qs.length + '</span><span>' + lvChip(it.l) + '</span></div><div class="qprog"><i style="width:' + (i / qs.length * 100) + '%"></i></div>';
        var card = h('div', { class: 'surface qcard' });
        if (mode === 'dict') {
          card.innerHTML = '<div class="hint">Послушай и напиши по-английски</div>';
          var row = h('div', { class: 'tools-row', style: 'justify-content:center' });
          var p1 = h('button', { class: 'btn primary' }, I.vol + ' Слушать');
          var p2 = h('button', { class: 'btn' }, '🐢 Медленно');
          p1.addEventListener('click', function () { tts.speak(it.en, p1); });
          p2.addEventListener('click', function () { tts.speak(it.en, p2, 0.65); });
          row.appendChild(p1); row.appendChild(p2); card.appendChild(row);
          setTimeout(function () { tts.speak(it.en, p1); }, 300);
        } else {
          card.innerHTML = '<div class="hint">Переведи на английский</div><div class="q serif small">' + esc(it.ru) + '</div>' +
            (it.w && it.w.length ? '<button class="btn sm ghost mt" id="hint">💡 Подсказка: слова</button><div class="hintbox hidden">' + it.w.map(function (p) { return '<b>' + esc(p[0]) + '</b> — ' + esc(p[1]); }).join('<br>') + '</div>' : '');
          var hb = $('#hint', card);
          if (hb) hb.addEventListener('click', function () { hb.remove(); $('.hintbox', card).classList.remove('hidden'); });
        }
        body.appendChild(card);
        var inp = h('textarea', { class: 'typein', placeholder: 'Пиши здесь…', rows: '2', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
        body.appendChild(inp);
        var check = h('button', { class: 'btn primary block mt' }, 'Проверить');
        check.addEventListener('click', function () {
          var d = diffWords(it.en, inp.value);
          total += d.score;
          if (mode === 'dict') S.st.dict++; else S.st.back++;
          activity(1); markSeen(it);
          var pct = Math.round(d.score * 100);
          var verdict = pct >= 90 ? '🌟 Отлично!' : pct >= 60 ? '👍 Почти!' : '💪 Ничего, в следующий раз получится';
          var orig = d.words.map(function (w, k) { return '<span class="' + (d.ok[k] ? 'okw' : 'missw') + '">' + esc(w) + '</span>'; }).join(' ');
          var res = h('div', { class: 'explain' }, '<b>' + verdict + '</b> · совпало ' + pct + '%<div class="diff">' + orig + '</div><div class="serif" style="margin-top:8px">' + esc(it.en) + '</div><div class="muted">' + esc(it.ru) + '</div>');
          var say = h('button', { class: 'btn sm mt' }, I.vol + ' Послушать ещё раз');
          say.addEventListener('click', function () { tts.speak(it.en, say); });
          res.appendChild(say);
          check.replaceWith(res);
          inp.disabled = true;
          if (pct >= 90) { addXP(3, res); haptic('success'); } else { addXP(1, res); haptic(pct >= 60 ? 'light' : 'error'); }
          var nb = h('button', { class: 'btn primary block mt' }, i + 1 < qs.length ? 'Дальше →' : 'Результат');
          nb.addEventListener('click', function () { i++; show(); });
          body.appendChild(nb);
          nb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        body.appendChild(check);
        if (mode !== 'dict') setTimeout(function () { inp.focus(); }, 300);
      }
      function finish() {
        var pct = Math.round(total / qs.length * 100);
        if (mode === 'dict') markPlan('listen');
        body.innerHTML = '<div class="result"><div class="score">' + pct + '%</div><div class="msg">' + (pct >= 80 ? 'Ты отлично слышишь английский! 🎧' : pct >= 50 ? 'Хороший результат! 💪' : 'Слух тренируется — продолжай каждый день 🦉') + '</div><div class="sub">Средняя точность по ' + qs.length + ' фразам</div></div>';
        var again = h('button', { class: 'btn primary block' }, 'Ещё раз');
        again.addEventListener('click', function () { popLayer(); setTimeout(function () { startTyping(mode); }, 240); });
        var back = h('button', { class: 'btn block mt' }, 'Готово');
        back.addEventListener('click', popLayer);
        body.appendChild(again); body.appendChild(back);
        if (pct >= 70) confetti();
        checkAch(); save();
      }
      show();
    }, { onClose: refreshCurrent });
  }

  // =====================================================================
  // 14j. Как люди учат языки (методика)
  // =====================================================================
  var METHOD = [
    ['📖', 'Понятный ввод', 'Лингвист Стивен Крашен показал: язык усваивается, когда мы читаем и слушаем то, что понимаем почти полностью, — с небольшой долей нового. Исследования чтения (Пол Нейшн и др.) говорят: комфортно, когда знакомы около 95–98% слов.', 'Поэтому у каждой карточки есть уровень A1–C1, а лента «мой уровень» показывает твой уровень и на ступень выше.'],
    ['🧱', 'Сначала самые частые слова', 'Слова встречаются очень неравномерно: первая тысяча самых частых слов покрывает примерно три четверти обычного текста, а в разговорной речи — ещё больше. Учить их первыми — самый быстрый путь к пониманию.', 'Курс «1000 главных слов» составлен по частотному словарю wordfreq: по 10 слов в день.'],
    ['🔁', 'Интервальное повторение', 'Ещё в 1885 году Герман Эббингауз открыл «кривую забывания»: без повторения мы теряем бо́льшую часть нового за пару дней. Если повторять через растущие промежутки (1, 3, 7, 14, 30 дней), память закрепляется надолго.', 'Каждая оценка «Понял сам / Частично / Не понял» ставит карточку в такое расписание.'],
    ['🧠', 'Вспоминать, а не перечитывать', 'Эксперименты Рёдигера и Карпике (2006) показали «эффект тестирования»: попытка вспомнить ответ укрепляет память сильнее, чем повторное чтение.', 'Поэтому перевод спрятан: сначала переводишь сам, потом проверяешь.'],
    ['🎧', 'Читать и слушать одновременно', 'Когда видишь слово и тут же слышишь его, мозг связывает написание и звучание. Это помогает и чтению, и пониманию на слух.', 'Нейроголос подсвечивает каждое произносимое слово — как караоке. Есть медленная скорость.'],
    ['🗣', 'Шэдоуинг: повторяй вслух', 'Повторять фразу вслух сразу за диктором — популярная техника переводчиков. Она тренирует произношение, ритм и уверенность в речи.', 'Нажми 🔊, послушай и повтори. В окне слова есть запись живого человеческого голоса.'],
    ['✍️', 'Не только понимать, но и выдавать', 'Мерил Суэйн показала: когда пытаешься сам сказать или написать, замечаешь пробелы в знаниях («гипотеза вывода»).', 'Диктант и обратный перевод (с русского на английский) — в «Тренировке».'],
    ['🧩', 'Фразы целиком', 'Носители говорят готовыми кусками: «How are you?», «Let\'s go», «I don\'t know». Если учить такие куски целиком, речь становится естественной.', 'Раздел «Основы» — 200+ готовых фраз на каждый день.'],
    ['🌸', 'Интерес и эмоции', 'Эмоционально значимое запоминается лучше. Мотивация — один из самых сильных факторов успеха в языке.', 'Отсюда аниме, мрачные и трогательные истории, игры и книги, которые ты любишь.'],
    ['🎯', 'Узкое чтение', 'Если читать много текстов на одну тему или одного автора, одни и те же слова возвращаются снова и снова и запоминаются сами (Стивен Крашен).', '«Аниме по тайтлам»: читай подряд Code Geass или SAO.'],
    ['📘', 'Грамматика через примеры', 'Правила полезны, но запоминаются через живые примеры и практику, а не через зубрёжку таблиц.', 'Каждый урок: короткое правило, цитаты из аниме и кино, упражнение.'],
    ['⏱', 'Каждый день понемногу', 'Распределённая практика работает лучше, чем одно долгое занятие: 15–20 минут каждый день дают больше, чем 2 часа в выходные. Сон помогает закрепить выученное.', '«Занятие на сегодня» — 6 коротких шагов. Серия дней 🔥 помогает не бросить.']
  ];
  function openMethod() {
    pushLayer('🧪 Как учат языки', function (body) {
      body.innerHTML = '<h1 style="margin:4px 0 6px">Как люди на самом деле учат языки</h1><div class="sub" style="margin-bottom:16px">Не «просто читать цитаты». Вот что говорят исследования — и как каждый принцип устроен в Inkwell.</div>';
      METHOD.forEach(function (m, k) {
        body.appendChild(h('div', { class: 'surface mcard' }, '<div class="mn">' + (k + 1) + '</div><div><b>' + m[0] + ' ' + esc(m[1]) + '</b><p>' + esc(m[2]) + '</p><div class="how">✨ ' + esc(m[3]) + '</div></div>'));
      });
      body.appendChild(h('h2', {}, '🗺 Твой путь от A1'));
      body.appendChild(h('div', { class: 'surface pad roadmap' },
        '<p><b>Месяц 1.</b> «Основы» (по 10 фраз в день) + курс слов (дни 1–30) + уроки грамматики A1. Лента — только A1.</p>' +
        '<p><b>Месяц 2.</b> Курс слов (дни 31–60), уроки A2, диктант каждый день. Лёгкие рассказы и басни. Цитаты аниме уровня A1–A2.</p>' +
        '<p><b>Месяц 3.</b> Курс слов до 100-го дня. Читаешь любимые тайтлы целиком, рассказы A2, «Мой текст» с субтитрами аниме.</p>' +
        '<p><b>Дальше.</b> Тест уровня ещё раз, уровень B1: классика, речи, стихи. Аниме с английскими субтитрами.</p>'));
      body.appendChild(h('div', { class: 'surface pad hadithbox' }, '<div class="k">📿 О пользе знания</div><div class="serif">«Кто встал на путь поиска знания, тому Аллах облегчит путь в Рай».</div><div class="faint" style="margin-top:6px">Сахих Муслим, 2699</div>'));
    });
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
    [[S.lvl ? CEFR[S.lvl] : '—', 'мой уровень'], [Object.keys(S.course.done).length + '/' + COURSE_DAYS, 'дней курса'], [Object.keys(S.gram).length + '/' + GRAMMAR.length, 'уроков'],
      [seenCount(), 'прочитано карточек'], [selfPct + '%', 'понял сам'], [Object.keys(S.words).length, 'слов в словаре'],
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
      box.appendChild(segRow('Скорость речи', 'Для новичка лучше помедленнее', [['0.7', '🐢'], ['0.8', '0.8'], ['0.9', '0.9'], ['1', '1×']], String(S.set.rate), function (v) { S.set.rate = +v; tts.speak('Hello! This is how I sound. Nice to meet you.'); }));
      box.appendChild(switchRow('Подсветка слов', 'Караоке: слово светится, пока звучит', 'karaoke'));
      box.appendChild(switchRow('Сначала думай', 'Прятать перевод, пока сам не переведёшь', 'hide'));
      box.appendChild(switchRow('Автолистание', 'После оценки переходить к следующей карточке', 'auto'));
      box.appendChild(switchRow('☪️ Ислам в общей ленте', 'Аяты и хадисы среди обычных карточек (никогда — в смешном и жутком)', 'islamFeed'));
      body.appendChild(box);
      var vline = h('div', { class: 'sub', style: 'margin:8px 4px 0;font-size:12.5px' }, '🎙 Голоса: Ava и Andrew — нейроголоса Microsoft.');
      body.appendChild(vline);
      try {
        if (window.InkVoice && window.InkVoice.ready) window.InkVoice.ready().then(function () {
          var t = window.InkVoice.tags ? window.InkVoice.tags() : {};
          var parts = Object.keys(t).sort(function (a, b) { return t[b] - t[a]; }).map(function (k) {
            var vi = tts.voiceInfo(k); return vi ? vi.chip.replace('🎙 Читает ', '').replace(' · голос ', ' — ') : '';
          }).filter(Boolean);
          parts.push('Ava и Andrew — Microsoft');
          vline.textContent = '🎙 Голоса: ' + parts.join(' · ') + '. Значок на кнопке звука показывает голос диктора.';
        });
      } catch (e) {}

      body.appendChild(h('h2', {}, '🎯 Мой уровень'));
      var lb = h('div', { class: 'surface', style: 'overflow:hidden' });
      lb.appendChild(segRow('Уровень', S.lvl ? CEFR_NAME[S.lvl] : 'Не выбран — пройди тест', [['1', 'A1'], ['2', 'A2'], ['3', 'B1'], ['4', 'B2'], ['5', 'C1']], String(S.lvl), function (v) { setLevel(+v); toast('Уровень: ' + CEFR[+v]); }));
      var tb = h('button', { class: 'btn ghost block', style: 'border:0;border-radius:0' }, '🎯 Пройти тест уровня');
      tb.addEventListener('click', startLevelTest);
      lb.appendChild(tb);
      body.appendChild(lb);

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
    // Для новичка (A1) текст карточек чуть крупнее
    document.documentElement.style.setProperty('--fs', S.set.font * (S.lvl === 1 ? 1.06 : 1));
    try {
      if (ver('6.1')) { tg.setHeaderColor(THEME_BG[t]); tg.setBackgroundColor(THEME_BG[t]); }
      if (ver('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(THEME_BG[t]);
    } catch (e) {}
  }
  if (tg && tg.onEvent) { try { tg.onEvent('themeChanged', function () { if (S.set.theme === 'auto') applyTheme(); }); } catch (e) {} }

  function onboarding() {
    var slides = [
      ['📚', 'Добро пожаловать в Inkwell', 'Больше ' + Math.floor(ITEMS.length / 100) * 100 + ' карточек: фразы на каждый день, аниме, кино, книги, аяты и хадисы. Курс «1000 слов», грамматика, целые рассказы с живым голосом. Всё — чтобы ты заговорил по-английски.'],
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
        else { S.onb = true; S.ver = APP_VER; save(); L.classList.add('out'); setTimeout(function () { L.remove(); }, 230); if (!S.lvl) setTimeout(startLevelTest, 300); }
      });
      onb.appendChild(b);
    }
    render();
  }

  // =====================================================================
  // 18. Старт
  // =====================================================================
  var APP_VER = 4;
  function start() {
    applyTheme();
    syncFinds();
    feedState.filter = myFeed();
    buildNav();
    var startTab = 'home', sp = '';
    try {
      sp = (inTG && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
      if (!sp) { var mq = /[?&]open=([a-z]+)/.exec(location.search); if (mq) sp = mq[1]; }
      if (sp === 'feed') startTab = 'feed';
      else if (sp === 'review') startTab = 'practice';
    } catch (e) {}
    showTab(startTab);
    checkAch();
    // Когда загрузится индекс нейро-озвучки — пометить кнопки 🔊 значком HD
    try {
      if (window.InkVoice && window.InkVoice.ready) window.InkVoice.ready().then(function () {
        $$('.fcard[data-id]').forEach(function (el) {
          var it = BY_ID[el.getAttribute('data-id')], b = el.querySelector('[data-act=tts]');
          if (it && b && tts.hasNeural(it.en)) b.classList.add('hq');
          var vi = it && b && tts.voiceInfo(tts.voiceOf(it.en));
          if (vi) { b.classList.add('pro'); b.setAttribute('data-v', vi.badge); }
        });
      });
    } catch (e) {}
    if (!S.onb) onboarding();
    else if ((S.ver || 0) < APP_VER) whatsNew();
    else if (sp === 'islam') openIslam();
    else if (sp === 'course') openCourse();
    else if (sp === 'grammar') openGrammar();
    else if (sp === 'test') startLevelTest();
  }

  // «Что нового» — один раз после большого обновления
  function whatsNew() {
    var slides = [
      ['🎉', 'Большое обновление!', 'Inkwell теперь учит английскому с самого нуля — и не только им. Вот что появилось.'],
      ['🎯', 'Твой уровень', 'У каждой карточки есть уровень A1–C1. Пройди тест за 3 минуты — и лента покажет то, что тебе по силам, а озвучка станет медленнее.'],
      ['🧱', 'Учёба с нуля', '«1000 главных слов» по 10 в день, 200+ фраз «Основы» на каждый день и ' + GRAMMAR.length + ' уроков грамматики на цитатах из аниме и кино.'],
      ['☪️', 'Ислам', 'Аяты с арабским текстом, чтением и переводом смыслов, достоверные хадисы, дуа, 99 имён Аллаха, истории пророков. Всё с источниками.'],
      ['🎧', 'Живой голос', 'Нейроголос читает карточки и рассказы и подсвечивает каждое слово, как караоке. Диктант, обратный перевод и аудио-режим в ленте.'],
      ['🛠', 'Твои инструменты', '«Мой текст» — вставь любой английский текст. «Мои находки» — сохраняй фразы из любимых аниме. «Занятие на сегодня» — 6 коротких шагов каждый день.']
    ];
    if ((S.ver || 0) >= 3) slides = [];  // большое обновление уже видели — покажем только новое
    slides.push(['🎙', 'Живые голоса дикторов', 'Пять басен Эзопа читает диктор Dan (ElevenLabs), а рассказы, «Основы» и карточки постепенно переходят на Algieba — очень чёткий голос нейросети Google: за несколько дней он озвучит всё приложение. Значок на кнопке звука показывает, кто читает.']);
    var i = 0;
    var L = h('section', { class: 'layer', style: 'z-index:70' });
    document.body.appendChild(L);
    function close() { S.ver = APP_VER; save(); L.classList.add('out'); setTimeout(function () { L.remove(); }, 230); }
    function render() {
      var s = slides[i], last = i === slides.length - 1;
      L.innerHTML = '<div class="onb"><div class="big">' + s[0] + '</div><h1>' + s[1] + '</h1><p>' + s[2] + '</p>' +
        '<div class="dots">' + slides.map(function (_, j) { return '<i class="' + (j === i ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
      var onb = $('.onb', L);
      var b = h('button', { class: 'btn primary block' }, last ? (S.lvl ? 'Поехали! 🚀' : '🎯 Пройти тест уровня') : 'Дальше');
      b.addEventListener('click', function () {
        haptic('light');
        if (!last) { i++; render(); return; }
        close();
        if (!S.lvl) setTimeout(startLevelTest, 260);
      });
      onb.appendChild(b);
      if (last && !S.lvl) {
        var later = h('button', { class: 'btn ghost block' }, 'Позже');
        later.addEventListener('click', close);
        onb.appendChild(later);
      }
    }
    render();
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
