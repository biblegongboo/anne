(async function () {
  const cfg = window.ANNE_SUPABASE_CONFIG || {};
  const STORAGE_KEY = "anne_public_reader_v1";

  const demo = {
    sources: [
      { source_id: "anne-demo", title: "Anne Demo", source_type: "book", license_label: "public", sample_limit: 20 },
    ],
    sentences: [
      {
        source_row: 2,
        source_text: "I hope I will be able to confide everything to you, as I have never been able to confide in anyone, and I hope you will be a great source of comfort and support.",
        p_ko: "당신에게 모든 것을 털어놓고 싶어요. 지금까지 누구에게도 그렇게 말해본 적이 없었거든요. 그리고 당신이 큰 위로와 지지가 되어 줄 거라 기대해요.",
        question: {
          q_en: "What does the speaker hope the listener will be?",
          q_ko: "말하는 사람이 듣는 사람에게 바라는 것은 무엇인가요?",
          answer: 1,
          explanation_en: "The sentence says the listener will be a great source of comfort and support.",
          explanation_ko: "문장에 듣는 사람이 큰 위로와 지지가 되어 줄 것이라고 나옵니다.",
          choices: [
            { no: 1, en: "A source of comfort and support", ko: "위로와 지지가 되는 사람" },
            { no: 2, en: "A strict teacher", ko: "엄한 선생님" },
            { no: 3, en: "A new neighbor", ko: "새 이웃" },
            { no: 4, en: "A famous writer", ko: "유명한 작가" },
          ],
        },
        chunks: [
          { chunk_order: 1, chunk_en: "confide", chunk_ko: "털어놓다" },
          { chunk_order: 2, chunk_en: "source of comfort and support", chunk_ko: "위로와 지지가 되는 사람" },
          { chunk_order: 3, chunk_en: "never been able to", chunk_ko: "한 번도 해본 적이 없었던" },
        ],
      },
      {
        source_row: 3,
        source_text: "On Friday, June 12, I was awake at six o'clock, which isn't surprising, since it was my birthday.",
        p_ko: "6월 12일 금요일, 나는 여섯 시에 깨어 있었는데, 그날이 내 생일이었으니 이상한 일은 아니었다.",
        question: null,
        chunks: [
          { chunk_order: 1, chunk_en: "On Friday, June 12", chunk_ko: "6월 12일 금요일" },
          { chunk_order: 2, chunk_en: "at six o'clock", chunk_ko: "여섯 시에" },
          { chunk_order: 3, chunk_en: "since it was my birthday", chunk_ko: "그날이 내 생일이었기 때문에" },
        ],
      },
      {
        source_row: 4,
        source_text: "But I'm not allowed to get up at that hour, so I had to control my curiosity until quarter to seven.",
        p_ko: "하지만 그 시간에 일어나는 건 허락되지 않았기 때문에, 나는 6시 45분까지 호기심을 참아야 했다.",
        question: null,
        chunks: [
          { chunk_order: 1, chunk_en: "control my curiosity", chunk_ko: "호기심을 참다" },
          { chunk_order: 2, chunk_en: "quarter to seven", chunk_ko: "6시 45분" },
          { chunk_order: 3, chunk_en: "not allowed to get up", chunk_ko: "일어나는 것이 허락되지 않다" },
        ],
      },
      {
        source_row: 5,
        source_text: "When I couldn't wait any longer, I went to the dining room, where Moortje (the cat) welcomed me by rubbing against my legs.",
        p_ko: "더는 기다릴 수 없어서 식당으로 갔더니, 모르트제(고양이)가 내 다리에 몸을 비비며 반겨주었다.",
        question: {
          q_en: "How did Moortje welcome the speaker?",
          q_ko: "모르트제는 화자를 어떻게 반겼나요?",
          answer: 1,
          explanation_en: "The sentence says Moortje welcomed the speaker by rubbing against their legs.",
          explanation_ko: "문장에 모르트제가 다리를 비비며 반겨주었다고 나옵니다.",
          choices: [
            { no: 1, en: "By rubbing against the speaker's legs", ko: "화자의 다리에 몸을 비비며" },
            { no: 2, en: "By bringing a gift", ko: "선물을 가져와서" },
            { no: 3, en: "By singing loudly", ko: "크게 노래해서" },
            { no: 4, en: "By opening the door", ko: "문을 열어서" },
          ],
        },
        chunks: [
          { chunk_order: 1, chunk_en: "couldn't wait any longer", chunk_ko: "더는 기다릴 수 없었다" },
          { chunk_order: 2, chunk_en: "went to the dining room", chunk_ko: "식당으로 갔다" },
          { chunk_order: 3, chunk_en: "rubbing against my legs", chunk_ko: "내 다리에 몸을 비비며" },
        ],
      },
    ],
  };

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SYSTEMS = [
    { id: "BIBLE", name: "Bible", url: "https://biblegongboo.github.io/bible/supabase/app/" },
    { id: "LICENSE", name: "License", url: "https://biblegongboo.github.io/license/app/" },
    { id: "ANNE", name: "Anne", url: "https://biblegongboo.github.io/anne/supabase/app/" },
  ];

  const state = {
    sources: [],
    sentences: [],
    sourceId: "",
    index: 0,
    mode: "Std",
    auto: false,
    speed: 1,
    speechId: 0,
    selectedAnswer: 0,
    currentSystem: "ANNE",
  };

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sourceId: state.sourceId,
      index: state.index,
      mode: state.mode,
      auto: state.auto,
      speed: state.speed,
    }));
  }

  function systemFromPath() {
    const path = String(location.pathname || "").toLowerCase();
    if (path.indexOf("/license/") >= 0) return "LICENSE";
    if (path.indexOf("/bible/") >= 0) return "BIBLE";
    return "ANNE";
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function setStatus(text) {
    $("#status").textContent = text;
  }

  function renderSystemButton() {
    const host = $("#studyNavHost");
    const current = SYSTEMS.find((x) => x.id === state.currentSystem) || SYSTEMS[2];
    host.innerHTML = `<button class="study-nav-btn" type="button" id="studyNavBtn"><span class="study-nav-label">${esc(current.name)}</span><span>▾</span></button>`;
    $("#studyNavBtn").addEventListener("click", () => {
      $("#studyBackdrop").hidden = false;
      $("#studyPath").textContent = "Select Study";
      const list = $("#studyList");
      list.innerHTML = SYSTEMS.map((item) => `<button class="study-item" type="button" data-system="${esc(item.id)}"><span>${esc(item.name)}</span><span></span></button>`).join("");
      list.querySelectorAll("[data-system]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sys = SYSTEMS.find((x) => x.id === btn.getAttribute("data-system"));
          if (!sys) return;
          localStorage.setItem("gongboo_last_system_v1", JSON.stringify({ id: sys.id, name: sys.name }));
          if (sys.id === "ANNE") {
            $("#studyBackdrop").hidden = true;
            return;
          }
          location.href = sys.url;
        });
      });
    });
  }

  function asRows(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function normalizeSentence(row) {
    const learning = asRows(row.anne_sentence_learning)[0] || {};
    const chunks = asRows(row.anne_sentence_chunks)
      .map((x) => ({
        chunk_order: Number(x.chunk_order || 0),
        chunk_en: String(x.chunk_en || x.en || ""),
        chunk_ko: String(x.chunk_ko || x.ko || ""),
      }))
      .filter((x) => x.chunk_en)
      .sort((a, b) => a.chunk_order - b.chunk_order);

    return {
      source_row: Number(row.source_row || 0),
      source_text: String(row.source_text || ""),
      p_ko: String(learning.p_ko || ""),
      question: learning.q_en
        ? {
            q_en: String(learning.q_en || ""),
            q_ko: String(learning.q_ko || ""),
            answer: Number(learning.answer || 0),
            explanation_en: String(learning.explanation_en || ""),
            explanation_ko: String(learning.explanation_ko || ""),
            choices: [1, 2, 3, 4].map((n) => ({
              no: n,
              en: String(learning[`choice_${n}_en`] || ""),
              ko: String(learning[`choice_${n}_ko`] || ""),
            })),
          }
        : null,
      chunks,
    };
  }

  function selectedSentence() {
    return state.sentences[state.index];
  }

  function stopSpeech() {
    state.speechId += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function speechSegments() {
    const sentence = selectedSentence();
    if (!sentence) return [];
    const out = [{ text: sentence.source_text, lang: "en-US" }];
    if (sentence.question) {
      out.push({ text: sentence.question.q_en, lang: "en-US" });
      for (const choice of sentence.question.choices) {
        out.push({ text: `${choice.no}. ${choice.en}`, lang: "en-US" });
      }
      if (state.mode === "Lrn") {
        out.push({ text: sentence.question.explanation_en || sentence.question.explanation_ko || "", lang: "en-US" });
      }
    }
    return out.filter((x) => x.text);
  }

  function speak(replay) {
    if (!("speechSynthesis" in window)) return;
    stopSpeech();
    const run = state.speechId;
    const segments = speechSegments();
    const rate = Number(state.speed) || 1;
    function next(i) {
      if (run !== state.speechId) return;
      if (i >= segments.length) {
        if (state.auto && !replay && state.index < state.sentences.length - 1) {
          state.index += 1;
          render();
          setTimeout(() => speak(false), 200);
        }
        return;
      }
      const u = new SpeechSynthesisUtterance(segments[i].text);
      u.lang = segments[i].lang;
      u.rate = rate;
      u.onend = () => next(i + 1);
      u.onerror = () => {};
      speechSynthesis.speak(u);
    }
    next(0);
  }

  function renderCatalog() {
    const host = $("#catalog");
    host.innerHTML = state.sources.map((s) => `
      <button class="catalog-card${s.source_id === state.sourceId ? " active" : ""}" data-source="${esc(s.source_id)}">
        <div class="catalog-title">${esc(s.title || s.source_id)}</div>
        <div class="catalog-meta">${esc(s.source_id)} · public reader</div>
      </button>
    `).join("");
    host.querySelectorAll("[data-source]").forEach((btn) => {
      btn.addEventListener("click", () => loadSource(btn.getAttribute("data-source")));
    });
  }

  function renderReader() {
    const sentence = selectedSentence();
    const reader = $("#reader");
    const chunks = $("#chunks");
    const counter = $("#counter");
    $("#prevBtn").disabled = state.index <= 0;
    $("#nextBtn").disabled = state.index >= state.sentences.length - 1;
    counter.textContent = `${state.index + 1} / ${state.sentences.length}`;

    if (!sentence) {
      reader.innerHTML = "<div class='empty'>No sentence loaded.</div>";
      chunks.innerHTML = "";
      return;
    }

    const q = sentence.question;
    const answerVisible = state.mode === "Lrn" || (state.mode !== "Exm" && state.selectedAnswer > 0);
    reader.innerHTML = `
      <article class="question-card">
        <div class="sentence-meta">Sentence ${state.index + 1} / ${state.sentences.length}</div>
        <div class="sentence-en">${esc(sentence.source_text)}</div>
        <div class="sentence-ko">${esc(sentence.p_ko)}</div>
        ${q ? `
          <div class="question">
            <div class="question-en">${esc(q.q_en)}</div>
            <div class="question-ko">${esc(q.q_ko)}</div>
            <div class="choices">
              ${q.choices.map((c) => `
                <button class="choice" data-answer="${c.no}">
                  <b>${c.no}</b>
                  <span class="choice-en">${esc(c.en)}</span>
                  <span class="choice-ko">${esc(c.ko)}</span>
                </button>
              `).join("")}
            </div>
            ${answerVisible ? `<div class="answer"><b>Answer</b> ${esc(String(q.answer))}</div>` : ""}
            ${answerVisible ? `<div class="explain"><b>Explain</b><div>${esc(q.explanation_ko || q.explanation_en)}</div></div>` : ""}
          </div>
        ` : `<div class="empty">No question for this sentence.</div>`}
      </article>
    `;

    reader.querySelectorAll("[data-answer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selected = Number(btn.getAttribute("data-answer"));
        if (!q) return;
        if (state.mode === "Exm") {
          state.selectedAnswer = selected;
          save();
          renderReader();
          return;
        }
        state.selectedAnswer = selected;
        save();
        renderReader();
      });
    });

    chunks.innerHTML = `
      <div class="chunk-grid">
        ${(sentence.chunks || []).map((c, i) => `
          <div class="chunk-card">
            <div class="chunk-no">${i + 1}</div>
            <div class="chunk-en">${esc(c.chunk_en)}</div>
            <div class="chunk-ko">${esc(c.chunk_ko)}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function render() {
    renderCatalog();
    renderReader();
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === state.mode);
    });
    $("#autoBtn").textContent = state.auto ? "AUTO ON" : "AUTO";
    $("#speedSelect").value = String(state.speed);
  }

  async function api(action, payload) {
    if (!cfg.url || !cfg.publishableKey || !cfg.functionName) throw new Error("Supabase config is not set yet.");
    const response = await fetch(cfg.url.replace(/\/+$/, "") + "/functions/v1/" + cfg.functionName, {
      method: "POST",
      headers: {
        apikey: cfg.publishableKey,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(Object.assign({ action }, payload || {})),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function loadSource(sourceId) {
    state.sourceId = sourceId;
    state.selectedAnswer = 0;
    setStatus("Loading...");
    try {
      if (!cfg.url || !cfg.publishableKey || !cfg.functionName) throw new Error("Demo mode");
      const payload = await api("sentences", { source_id: sourceId, limit: 100 });
      state.sentences = (payload.data || []).map(normalizeSentence);
      if (!state.sentences.length) throw new Error("No enabled sentences yet.");
      state.index = 0;
      setStatus("Public reader");
    } catch (e) {
      state.sentences = demo.sentences;
      state.index = 0;
      setStatus("Demo mode");
    }
    save();
    render();
  }

  async function boot() {
    const saved = load();
    state.mode = saved?.mode || "Std";
    state.auto = !!saved?.auto;
    state.speed = Number(saved?.speed || 1);
    state.currentSystem = systemFromPath();
    renderSystemButton();
    $("#studyBackdrop").querySelector("[data-back]").addEventListener("click", () => { $("#studyBackdrop").hidden = true; });
    $("#studyBackdrop").querySelector("[data-close]").addEventListener("click", () => { $("#studyBackdrop").hidden = true; });
    $("#studyBackdrop").addEventListener("click", (event) => { if (event.target === $("#studyBackdrop")) $("#studyBackdrop").hidden = true; });

    if (!cfg.url || !cfg.publishableKey || !cfg.functionName) {
      state.sources = demo.sources;
      state.sourceId = demo.sources[0].source_id;
      state.sentences = demo.sentences;
      state.index = 0;
      setStatus("Demo mode");
      render();
      return;
    }
    try {
      const payload = await api("catalog");
      state.sources = payload.sources || [];
      if (!state.sources.length) {
        state.sources = demo.sources;
        state.sourceId = demo.sources[0].source_id;
        state.sentences = demo.sentences;
        state.index = 0;
        setStatus("No enabled sources yet");
        render();
        return;
      }
      state.sourceId = saved?.sourceId || state.sources[0].source_id;
      await loadSource(state.sourceId);
      state.index = Math.min(Number(saved?.index || 0), Math.max(0, state.sentences.length - 1));
      render();
    } catch (e) {
      state.sources = demo.sources;
      state.sourceId = demo.sources[0].source_id;
      state.sentences = demo.sentences;
      state.index = 0;
      setStatus("Demo mode");
      render();
    }
  }

  $("#prevBtn").addEventListener("click", () => {
    if (state.index > 0) {
      state.index -= 1;
      state.selectedAnswer = 0;
      save();
      render();
    }
  });
  $("#nextBtn").addEventListener("click", () => {
    if (state.index < state.sentences.length - 1) {
      state.index += 1;
      state.selectedAnswer = 0;
      save();
      render();
    }
  });
  $("#playBtn").addEventListener("click", () => speak(false));
  $("#replayBtn").addEventListener("click", () => speak(true));
  $("#stopBtn").addEventListener("click", () => stopSpeech());
  $("#autoBtn").addEventListener("click", () => {
    state.auto = !state.auto;
    save();
    render();
  });
  $("#speedSelect").addEventListener("change", (event) => {
    state.speed = Number(event.target.value || 1);
    save();
  });
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.getAttribute("data-mode");
      state.selectedAnswer = 0;
      save();
      render();
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") $("#prevBtn").click();
    if (event.key === "ArrowRight") $("#nextBtn").click();
  });

  await boot();
})();
