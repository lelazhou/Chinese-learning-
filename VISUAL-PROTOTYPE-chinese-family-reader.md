# Visual prototype — Family Chinese Reader

**Runnable copy:** [chinese-family-reader-prototype/index.html](chinese-family-reader-prototype/index.html) — open that file in a browser (double-click). See [chinese-family-reader-prototype/README.md](chinese-family-reader-prototype/README.md).

The HTML below stays in sync as a **copy-paste source** if you prefer a single file in email or snippets.

## How to open it

1. Prefer: open **`chinese-family-reader-prototype/index.html`** in your browser.
2. Or: **Copy** from the fenced `html` code block below into your own `index.html` and save.
3. Optional: in a terminal in that folder, run `npx --yes serve -l 3333` and visit `http://localhost:3333`.

## What this prototype demonstrates

- **玩** hub: 识字卡片 / 游戏 / 故事 (故事 dims when AI off or offline — toggle in **设置**).
- **Bottom nav:** 玩 · 词库 · 设置 (matches [DESIGN-chinese-family-reader.md](DESIGN-chinese-family-reader.md)).
- **识字卡片:** tap to flip; 全部 / 本周新字; prev/next.
- **游戏:** 配对 (4 pairs demo); **看字选义** (multiple choice).
- **故事:** scope (全部 / 本周新字), length, theme; **生成（演示）** shows fake story text (no real API).
- **词库:** sample rows + **本周新字** toggle (updates card filter behavior).
- **设置:** AI toggle, text size (小/中/大), export placeholder.

Sample vocabulary: 学、大、小、人、口、手 (with pinyin/meaning).

---

## `index.html` (copy from next line through end of fence)

```html
<!DOCTYPE html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Family Chinese Reader — 原型</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --surface: #faf8f5;
        --surface-elevated: #ffffff;
        --primary: #2d7d7d;
        --primary-contrast: #fff;
        --accent-cards: #e8f4f4;
        --accent-games: #f0e8f8;
        --accent-story: #fff4e6;
        --text: #1a1a1a;
        --muted: #5c5c5c;
        --border: #e6e2dc;
        --danger: #c43c3c;
        --success: #2d8a4e;
        --radius-lg: 16px;
        --radius-md: 12px;
        --tap: 48px;
        --font-scale: 1;
      }
      [data-size="large"] { --font-scale: 1.15; }
      [data-size="small"] { --font-scale: 0.95; }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        height: 100%;
        margin: 0;
        font-family: "Noto Sans SC", system-ui, sans-serif;
        font-size: calc(16px * var(--font-scale));
        background: var(--surface);
        color: var(--text);
        -webkit-tap-highlight-color: transparent;
      }
      #app {
        max-width: 480px;
        margin: 0 auto;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0));
      }
      .screen {
        display: none;
        flex: 1;
        flex-direction: column;
        padding: 16px;
        padding-top: max(16px, env(safe-area-inset-top));
        animation: fadeIn 0.22s ease;
      }
      .screen.active { display: flex; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: none; }
      }
      .topbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
      .back {
        min-width: var(--tap);
        min-height: var(--tap);
        border: none;
        background: var(--surface-elevated);
        border-radius: var(--radius-md);
        font-size: 1.25rem;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      }
      .title { font-weight: 700; font-size: 1.35rem; margin: 0; }
      .chip {
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--border);
        color: var(--muted);
        margin-left: auto;
      }
      .chip.offline { background: #ffe8e8; color: var(--danger); }
      .play-hero { text-align: center; margin: 8px 0 20px; }
      .play-hero h1 { margin: 0 0 6px; font-size: 1.5rem; }
      .play-hero p { margin: 0; color: var(--muted); font-size: 0.95rem; }
      .big-cards { display: flex; flex-direction: column; gap: 14px; }
      .big-card {
        border: none;
        text-align: left;
        padding: 20px 20px 18px;
        border-radius: var(--radius-lg);
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
        font: inherit;
        color: inherit;
      }
      .big-card:active { transform: scale(0.98); }
      .big-card .icon { font-size: 2rem; line-height: 1; margin-bottom: 8px; }
      .big-card .label { font-weight: 700; font-size: 1.2rem; display: block; }
      .big-card .sub {
        display: block;
        margin-top: 6px;
        font-size: 0.88rem;
        color: var(--muted);
        line-height: 1.35;
      }
      .big-card.cards { background: linear-gradient(135deg, var(--accent-cards), var(--surface-elevated)); }
      .big-card.games { background: linear-gradient(135deg, var(--accent-games), var(--surface-elevated)); }
      .big-card.story { background: linear-gradient(135deg, var(--accent-story), var(--surface-elevated)); }
      .big-card.dim { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
      .big-card.dim:active { transform: none; }
      .seg { display: flex; background: var(--border); border-radius: var(--radius-md); padding: 4px; margin-bottom: 16px; }
      .seg button {
        flex: 1;
        border: none;
        padding: 10px;
        border-radius: 10px;
        background: transparent;
        font: inherit;
        cursor: pointer;
        color: var(--muted);
      }
      .seg button.on {
        background: var(--surface-elevated);
        color: var(--text);
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      .flash-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        perspective: 1000px;
        min-height: 280px;
      }
      .flash-card {
        width: min(92vw, 400px);
        min-height: 220px;
        cursor: pointer;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.45s ease;
      }
      .flash-card.flipped { transform: rotateY(180deg); }
      .flash-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
      }
      .flash-front { background: var(--surface-elevated); border: 2px solid var(--border); }
      .flash-back {
        background: var(--primary);
        color: var(--primary-contrast);
        transform: rotateY(180deg);
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      .hanzi-lg { font-size: clamp(3rem, 14vw, 4.5rem); font-weight: 700; line-height: 1.1; }
      .pinyin { font-size: 1.35rem; opacity: 0.95; }
      .meaning { font-size: 1rem; opacity: 0.9; }
      .footer-bar { display: flex; gap: 10px; margin-top: auto; padding-top: 16px; }
      .btn {
        flex: 1;
        min-height: var(--tap);
        border: none;
        border-radius: var(--radius-md);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary { background: var(--primary); color: var(--primary-contrast); }
      .btn-ghost { background: var(--surface-elevated); color: var(--text); border: 1px solid var(--border); }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .list-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: var(--surface-elevated);
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
      }
      .list-row .hz { font-size: 1.5rem; font-weight: 700; min-width: 2.5rem; }
      .list-row .meta { flex: 1; min-width: 0; }
      .list-row .meta small { color: var(--muted); display: block; font-size: 0.8rem; }
      .toggle {
        width: 52px;
        height: 30px;
        border-radius: 999px;
        border: none;
        background: var(--border);
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
      }
      .toggle.on { background: var(--primary); }
      .toggle::after {
        content: "";
        position: absolute;
        width: 24px;
        height: 24px;
        background: #fff;
        border-radius: 50%;
        top: 3px;
        left: 4px;
        transition: transform 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }
      .toggle.on::after { transform: translateX(20px); }
      .memory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
      .tile {
        aspect-ratio: 1;
        border-radius: var(--radius-md);
        border: none;
        background: var(--primary);
        color: #fff;
        font-size: 1.5rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }
      .tile.hidden { background: var(--border); color: transparent; }
      .tile.matched { background: var(--success); color: #fff; }
      .story-box {
        background: var(--surface-elevated);
        border-radius: var(--radius-lg);
        padding: 18px;
        border: 1px solid var(--border);
        line-height: 1.65;
        font-size: 1.15rem;
        margin-top: 12px;
      }
      .field { margin-bottom: 14px; }
      .field label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
      .options { display: flex; flex-direction: column; gap: 8px; }
      .radio-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--surface-elevated);
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        cursor: pointer;
      }
      .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        max-width: 480px;
        margin: 0 auto;
        display: flex;
        background: var(--surface-elevated);
        border-top: 1px solid var(--border);
        padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0));
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
        z-index: 20;
      }
      .nav-btn {
        flex: 1;
        border: none;
        background: transparent;
        padding: 8px 4px;
        font: inherit;
        font-size: 0.72rem;
        color: var(--muted);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .nav-btn .sym { font-size: 1.35rem; line-height: 1; }
      .nav-btn.on { color: var(--primary); font-weight: 700; }
      .hint { font-size: 0.85rem; color: var(--muted); margin-top: 8px; }
      @media (min-width: 600px) {
        #app { max-width: 560px; }
        .memory-grid { grid-template-columns: repeat(4, 72px); justify-content: center; }
      }
    </style>
  </head>
  <body data-size="normal">
    <div id="app">
      <section class="screen active" id="screen-play" data-screen="play">
        <div class="play-hero">
          <h1>玩一玩</h1>
          <p>用认识的字来练习</p>
        </div>
        <div class="big-cards">
          <button type="button" class="big-card cards" data-go="flashcards">
            <span class="icon" aria-hidden="true">字</span>
            <span class="label">识字卡片</span>
            <span class="sub">翻翻卡片，看看拼音和意思</span>
          </button>
          <button type="button" class="big-card games" data-go="games">
            <span class="icon" aria-hidden="true">游</span>
            <span class="label">游戏</span>
            <span class="sub">配对、看字选义（示例数据）</span>
          </button>
          <button type="button" class="big-card story" id="story-card" data-go="story">
            <span class="icon" aria-hidden="true">书</span>
            <span class="label">故事</span>
            <span class="sub" id="story-card-sub">用认识的字写小故事</span>
          </button>
        </div>
        <p class="hint">可点击原型：示例词；故事为演示文案。</p>
      </section>
      <section class="screen" id="screen-flashcards" data-screen="flashcards">
        <div class="topbar">
          <button type="button" class="back" aria-label="返回" data-back="play">←</button>
          <h2 class="title">识字卡片</h2>
          <span class="chip" id="online-chip">在线</span>
        </div>
        <div class="seg" role="tablist">
          <button type="button" class="on" data-filter="all">全部</button>
          <button type="button" data-filter="new">本周新字</button>
        </div>
        <div class="flash-wrap">
          <div class="flash-card" id="flash-card" role="button" tabindex="0" aria-label="点按翻面">
            <div class="flash-face flash-front"><span class="hanzi-lg" id="fc-hanzi">学</span></div>
            <div class="flash-face flash-back">
              <span class="pinyin" id="fc-pinyin">xué</span>
              <span class="meaning" id="fc-meaning">to study / learn</span>
            </div>
          </div>
        </div>
        <div class="footer-bar">
          <button type="button" class="btn btn-ghost" id="fc-prev">上一张</button>
          <button type="button" class="btn btn-primary" id="fc-next">下一张</button>
        </div>
      </section>
      <section class="screen" id="screen-games" data-screen="games">
        <div class="topbar">
          <button type="button" class="back" aria-label="返回" data-back="play">←</button>
          <h2 class="title">游戏</h2>
        </div>
        <ul class="list">
          <li>
            <button type="button" class="big-card games" style="width: 100%" data-go="memory">
              <span class="label">配对</span><span class="sub">翻翻乐：找出一样的字</span>
            </button>
          </li>
          <li>
            <button type="button" class="big-card cards" style="width: 100%" data-go="meaning">
              <span class="label">看字选义</span><span class="sub">看汉字，选对意思</span>
            </button>
          </li>
        </ul>
      </section>
      <section class="screen" id="screen-memory" data-screen="memory">
        <div class="topbar">
          <button type="button" class="back" aria-label="返回" data-back="games">←</button>
          <h2 class="title">配对</h2>
        </div>
        <p class="hint">点击翻开；两个字一样即成功。</p>
        <div class="memory-grid" id="memory-grid"></div>
      </section>
      <section class="screen" id="screen-meaning" data-screen="meaning">
        <div class="topbar">
          <button type="button" class="back" aria-label="返回" data-back="games">←</button>
          <h2 class="title">看字选义</h2>
        </div>
        <div class="flash-wrap" style="min-height: 160px">
          <div class="flash-card" style="pointer-events: none; transform: none">
            <div class="flash-face flash-front" style="position: relative; transform: none">
              <span class="hanzi-lg" id="mq-hanzi">学</span>
            </div>
          </div>
        </div>
        <p class="hint" id="mq-feedback">选一个意思：</p>
        <div class="footer-bar" style="flex-wrap: wrap" id="mq-choices"></div>
      </section>
      <section class="screen" id="screen-story" data-screen="story">
        <div class="topbar">
          <button type="button" class="back" aria-label="返回" data-back="play">←</button>
          <h2 class="title">故事</h2>
        </div>
        <div id="story-form">
          <div class="field">
            <label>用哪些字</label>
            <div class="options">
              <label class="radio-row"><input type="radio" name="scope" value="all" checked /><span>全部认识的字</span></label>
              <label class="radio-row"><input type="radio" name="scope" value="new" /><span>只有本周新字</span></label>
            </div>
          </div>
          <div class="field">
            <label>长度</label>
            <div class="seg" style="margin-bottom: 0">
              <button type="button" class="on len-btn" data-len="short">很短</button>
              <button type="button" class="len-btn" data-len="med">短</button>
              <button type="button" class="len-btn" data-len="long">稍长</button>
            </div>
          </div>
          <div class="field">
            <label>主题（可选）</label>
            <div class="seg" style="margin-bottom: 0">
              <button type="button" class="on theme-btn" data-theme="动物">动物</button>
              <button type="button" class="theme-btn" data-theme="学校">学校</button>
              <button type="button" class="theme-btn" data-theme="家庭">家庭</button>
            </div>
          </div>
          <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 8px" id="btn-generate">生成（演示）</button>
        </div>
        <div id="story-result" style="display: none">
          <p style="margin: 0 0 8px; font-weight: 600">读一读</p>
          <article class="story-box" id="story-text"></article>
          <div class="footer-bar">
            <button type="button" class="btn btn-ghost" id="btn-story-back">改选项</button>
            <button type="button" class="btn btn-primary" id="btn-story-again">再生成</button>
          </div>
        </div>
      </section>
      <section class="screen" id="screen-library" data-screen="library">
        <h2 class="title" style="margin: 0 0 12px">词库</h2>
        <p class="hint">示例词；可切换「本周新字」。</p>
        <ul class="list" id="library-list"></ul>
        <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 16px">添加 / 批量（占位）</button>
      </section>
      <section class="screen" id="screen-settings" data-screen="settings">
        <h2 class="title" style="margin: 0 0 16px">设置</h2>
        <div class="list-row" style="margin-bottom: 10px">
          <div class="meta"><strong>AI 故事</strong><small>关闭后「故事」变灰</small></div>
          <button type="button" class="toggle on" id="toggle-ai" aria-pressed="true" aria-label="AI 故事"></button>
        </div>
        <div class="list-row" style="margin-bottom: 10px">
          <div class="meta"><strong>文字大小</strong><small>演示</small></div>
          <div style="display: flex; gap: 6px">
            <button type="button" class="btn btn-ghost" data-size-btn="small" style="flex: 0; min-width: 44px">小</button>
            <button type="button" class="btn btn-primary" data-size-btn="normal" style="flex: 0; min-width: 44px">中</button>
            <button type="button" class="btn btn-ghost" data-size-btn="large" style="flex: 0; min-width: 44px">大</button>
          </div>
        </div>
        <div class="list-row">
          <div class="meta"><strong>导出 / 导入 JSON</strong><small>正式版接备份</small></div>
        </div>
        <button type="button" class="btn btn-ghost" style="width: 100%; margin-top: 12px">导出备份（占位）</button>
      </section>
    </div>
    <nav class="bottom-nav" aria-label="主导航">
      <button type="button" class="nav-btn on" data-nav="play"><span class="sym" aria-hidden="true">玩</span>玩</button>
      <button type="button" class="nav-btn" data-nav="library"><span class="sym" aria-hidden="true">词</span>词库</button>
      <button type="button" class="nav-btn" data-nav="settings"><span class="sym" aria-hidden="true">设</span>设置</button>
    </nav>
    <script>
      const VOCAB = [
        { hanzi: "学", pinyin: "xué", meaning: "to study / learn", new: true },
        { hanzi: "大", pinyin: "dà", meaning: "big", new: true },
        { hanzi: "小", pinyin: "xiǎo", meaning: "small", new: false },
        { hanzi: "人", pinyin: "rén", meaning: "person", new: false },
        { hanzi: "口", pinyin: "kǒu", meaning: "mouth", new: false },
        { hanzi: "手", pinyin: "shǒu", meaning: "hand", new: false },
      ];
      let aiEnabled = true;
      let online = navigator.onLine;
      let flashFilter = "all";
      let flashIndex = 0;
      let storyLen = "short";
      let storyTheme = "动物";
      const $ = (s, e = document) => e.querySelector(s);
      const $$ = (s, e = document) => [...e.querySelectorAll(s)];
      function getDeck() {
        return VOCAB.filter((w) => (flashFilter === "new" ? w.new : true));
      }
      function showScreen(name) {
        $$(".screen").forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
        $$(".nav-btn").forEach((b) => b.classList.toggle("on", b.dataset.nav === name));
      }
      function updateStoryCard() {
        const card = $("#story-card");
        const sub = $("#story-card-sub");
        if (!aiEnabled) {
          card.classList.add("dim");
          card.disabled = true;
          sub.textContent = "在「设置」里打开 AI 故事";
        } else if (!online) {
          card.classList.add("dim");
          card.disabled = true;
          sub.textContent = "需要网络才能生成故事";
        } else {
          card.classList.remove("dim");
          card.disabled = false;
          sub.textContent = "用认识的字写小故事（演示）";
        }
      }
      function updateOnlineChip() {
        const chip = $("#online-chip");
        if (!chip) return;
        chip.textContent = online ? "在线" : "离线";
        chip.classList.toggle("offline", !online);
      }
      function renderFlashcard() {
        const deck = getDeck();
        if (!deck.length) {
          $("#fc-hanzi").textContent = "—";
          $("#fc-pinyin").textContent = "没有字";
          $("#fc-meaning").textContent = flashFilter === "new" ? "本周还没有新字" : "先去词库添加";
          return;
        }
        flashIndex = Math.min(flashIndex, deck.length - 1);
        const w = deck[flashIndex];
        $("#fc-hanzi").textContent = w.hanzi;
        $("#fc-pinyin").textContent = w.pinyin;
        $("#fc-meaning").textContent = w.meaning;
        $("#flash-card").classList.remove("flipped");
      }
      function wireFlashcards() {
        $("#flash-card").addEventListener("click", () => $("#flash-card").classList.toggle("flipped"));
        $("#flash-card").addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            $("#flash-card").classList.toggle("flipped");
          }
        });
        $$(".seg button", $("#screen-flashcards")).forEach((btn) => {
          btn.addEventListener("click", () => {
            $$(".seg button", $("#screen-flashcards")).forEach((b) => b.classList.remove("on"));
            btn.classList.add("on");
            flashFilter = btn.dataset.filter === "new" ? "new" : "all";
            flashIndex = 0;
            renderFlashcard();
          });
        });
        $("#fc-next").addEventListener("click", () => {
          const deck = getDeck();
          if (!deck.length) return;
          flashIndex = (flashIndex + 1) % deck.length;
          $("#flash-card").classList.remove("flipped");
          renderFlashcard();
        });
        $("#fc-prev").addEventListener("click", () => {
          const deck = getDeck();
          if (!deck.length) return;
          flashIndex = (flashIndex - 1 + deck.length) % deck.length;
          $("#flash-card").classList.remove("flipped");
          renderFlashcard();
        });
      }
      function buildMemory() {
        const pick = VOCAB.slice(0, 4);
        const pairs = [...pick, ...pick].sort(() => Math.random() - 0.5);
        const grid = $("#memory-grid");
        grid.innerHTML = "";
        let first = null;
        pairs.forEach((w, i) => {
          const t = document.createElement("button");
          t.type = "button";
          t.className = "tile hidden";
          t.dataset.hanzi = w.hanzi;
          t.textContent = w.hanzi;
          t.addEventListener("click", () => {
            if (t.classList.contains("matched")) return;
            t.classList.remove("hidden");
            if (!first) {
              first = t;
              return;
            }
            if (first === t) return;
            if (first.dataset.hanzi === t.dataset.hanzi) {
              first.classList.add("matched");
              t.classList.add("matched");
              first = null;
            } else {
              const a = first,
                b = t;
              first = null;
              setTimeout(() => {
                a.classList.add("hidden");
                b.classList.add("hidden");
              }, 550);
            }
          });
          grid.appendChild(t);
        });
      }
      let mqIndex = 0;
      function buildMeaning() {
        const w = VOCAB[mqIndex % VOCAB.length];
        $("#mq-hanzi").textContent = w.hanzi;
        const wrong = VOCAB.filter((x) => x !== w)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const choices = [w, ...wrong].sort(() => Math.random() - 0.5);
        const box = $("#mq-choices");
        box.innerHTML = "";
        $("#mq-feedback").textContent = "选一个意思：";
        choices.forEach((c) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-ghost";
          b.style.flex = "1 1 100%";
          b.textContent = c.meaning;
          b.addEventListener("click", () => {
            if (c === w) {
              $("#mq-feedback").textContent = "对了！";
              mqIndex++;
              setTimeout(buildMeaning, 650);
            } else $("#mq-feedback").textContent = "再想想～";
          });
          box.appendChild(b);
        });
      }
      function fakeStory() {
        const scope = document.querySelector('input[name="scope"]:checked').value;
        const allowed = VOCAB.filter((w) => (scope === "new" ? w.new : true)).map((w) => w.hanzi);
        if (scope === "new" && !allowed.length) return "本周还没有新字，请先在词库里标记「本周新字」。";
        const themeLine = storyTheme === "动物" ? "小动物" : storyTheme === "学校" ? "学校" : "家里";
        const samples = [`${allowed.join("")}。${themeLine}。人小口大手。学学。`, `大人小人。${themeLine}。口口手手。学学学。`];
        let text = samples[Math.floor(Math.random() * samples.length)];
        if (storyLen === "short") text = text.slice(0, 24) + "…";
        return text;
      }
      function renderLibrary() {
        const ul = $("#library-list");
        ul.innerHTML = "";
        VOCAB.forEach((w, i) => {
          const li = document.createElement("li");
          li.className = "list-row";
          li.innerHTML = `<span class="hz">${w.hanzi}</span><div class="meta"><strong>${w.pinyin}</strong><small>${w.meaning}</small></div><button type="button" class="toggle ${w.new ? "on" : ""}" aria-label="本周新字" data-i="${i}"></button>`;
          li.querySelector(".toggle").addEventListener("click", () => {
            w.new = !w.new;
            li.querySelector(".toggle").classList.toggle("on", w.new);
            updateStoryCard();
            renderFlashcard();
          });
          ul.appendChild(li);
        });
      }
      document.addEventListener("click", (e) => {
        const go = e.target.closest("[data-go]");
        if (go) {
          const name = go.dataset.go;
          if (name === "story" && (go.disabled || go.classList.contains("dim"))) return;
          if (name === "story") {
            $("#story-form").style.display = "block";
            $("#story-result").style.display = "none";
          }
          showScreen(name);
          if (name === "memory") buildMemory();
          if (name === "meaning") buildMeaning();
        }
        const back = e.target.closest("[data-back]");
        if (back) showScreen(back.dataset.back);
        const nav = e.target.closest("[data-nav]");
        if (nav) showScreen(nav.dataset.nav);
      });
      $("#toggle-ai").addEventListener("click", () => {
        aiEnabled = !aiEnabled;
        $("#toggle-ai").classList.toggle("on", aiEnabled);
        $("#toggle-ai").setAttribute("aria-pressed", String(aiEnabled));
        updateStoryCard();
      });
      window.addEventListener("online", () => {
        online = true;
        updateOnlineChip();
        updateStoryCard();
      });
      window.addEventListener("offline", () => {
        online = false;
        updateOnlineChip();
        updateStoryCard();
      });
      $$(".len-btn").forEach((b) => {
        b.addEventListener("click", () => {
          $$(".len-btn").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          storyLen = b.dataset.len;
        });
      });
      $$(".theme-btn").forEach((b) => {
        b.addEventListener("click", () => {
          $$(".theme-btn").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          storyTheme = b.dataset.theme;
        });
      });
      $("#btn-generate").addEventListener("click", () => {
        $("#story-form").style.display = "none";
        $("#story-result").style.display = "block";
        $("#story-text").textContent = fakeStory();
      });
      $("#btn-story-back").addEventListener("click", () => {
        $("#story-form").style.display = "block";
        $("#story-result").style.display = "none";
      });
      $("#btn-story-again").addEventListener("click", () => {
        $("#story-text").textContent = fakeStory();
      });
      $$("[data-size-btn]").forEach((b) => {
        b.addEventListener("click", () => {
          const s = b.dataset.sizeBtn;
          document.body.dataset.size = s;
          $$("[data-size-btn]").forEach((x) => {
            x.classList.toggle("btn-primary", x.dataset.sizeBtn === s);
            x.classList.toggle("btn-ghost", x.dataset.sizeBtn !== s);
          });
        });
      });
      wireFlashcards();
      renderLibrary();
      renderFlashcard();
      updateStoryCard();
      updateOnlineChip();
    </script>
  </body>
</html>
```
