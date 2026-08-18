(async function () {
  const cfg = window.ANNE_SUPABASE_CONFIG || {};

  const demo = {
    sources: [
      {
        source_id: "anne-demo",
        title: "Anne Demo",
        source_type: "book",
        license_label: "public",
        sample_limit: 20,
      },
    ],
    sentences: [
      {
        source_row: 2,
        source_text: "I hope I will be able to confide everything to you, as I have never been able to confide in anyone, and I hope you will be a great source of comfort and support.",
        p_ko: "당신에게 모든 것을 털어놓고 싶어요. 지금까지 누구에게도 그렇게 말해본 적이 없었거든요. 그리고 당신이 큰 위로와 지지가 되어 줄 거라 기대해요.",
        question: {
          q_en: "What does the speaker hope the listener will be?",
          q_ko: "말하는 사람이 듣는 사람에게 바라는 것은 무엇인가요?",
          choices: [
            { no: 1, en: "A source of comfort and support", ko: "위로와 지지가 되는 사람" },
            { no: 2, en: "A strict teacher", ko: "엄한 선생님" },
            { no: 3, en: "A new neighbor", ko: "새 이웃" },
            { no: 4, en: "A famous writer", ko: "유명한 작가" },
          ],
          answer: 1,
          explanation_en: "The sentence says the listener will be a great source of comfort and support.",
          explanation_ko: "문장에 듣는 사람이 큰 위로와 지지가 되어 줄 것이라고 나옵니다.",
        },
        chunks: [
          { en: "confide", ko: "털어놓다" },
          { en: "source of comfort and support", ko: "위로와 지지가 되는 사람" },
          { en: "never been able to", ko: "한 번도 해본 적이 없었던" },
        ],
      },
      {
        source_row: 3,
        source_text: "On Friday, June 12, I was awake at six o'clock, which isn't surprising, since it was my birthday.",
        p_ko: "6월 12일 금요일, 나는 여섯 시에 깨어 있었는데, 그날이 내 생일이었으니 이상한 일은 아니었다.",
        question: null,
        chunks: [
          { en: "On Friday, June 12", ko: "6월 12일 금요일" },
          { en: "at six o'clock", ko: "여섯 시에" },
          { en: "since it was my birthday", ko: "그날이 내 생일이었기 때문에" },
        ],
      },
      {
        source_row: 4,
        source_text: "But I'm not allowed to get up at that hour, so I had to control my curiosity until quarter to seven.",
        p_ko: "하지만 그 시간에 일어나는 건 허락되지 않았기 때문에, 나는 6시 45분까지 호기심을 참아야 했다.",
        question: null,
        chunks: [
          { en: "control my curiosity", ko: "호기심을 참다" },
          { en: "quarter to seven", ko: "6시 45분" },
          { en: "not allowed to get up", ko: "일어나는 것이 허락되지 않다" },
        ],
      },
      {
        source_row: 5,
        source_text: "When I couldn't wait any longer, I went to the dining room, where Moortje (the cat) welcomed me by rubbing against my legs.",
        p_ko: "더는 기다릴 수 없어서 식당으로 갔더니, 모르트제(고양이)가 내 다리에 몸을 비비며 반겨주었다.",
        question: {
          q_en: "How did Moortje welcome the speaker?",
          q_ko: "모르트제는 화자를 어떻게 반겼나요?",
          choices: [
            { no: 1, en: "By rubbing against the speaker's legs", ko: "화자의 다리에 몸을 비비며" },
            { no: 2, en: "By bringing a gift", ko: "선물을 가져와서" },
            { no: 3, en: "By singing loudly", ko: "크게 노래해서" },
            { no: 4, en: "By opening the door", ko: "문을 열어서" },
          ],
          answer: 1,
          explanation_en: "The sentence says Moortje welcomed the speaker by rubbing against their legs.",
          explanation_ko: "문장에 모르트제가 다리를 비비며 반겨주었다고 나옵니다.",
        },
        chunks: [
          { en: "couldn't wait any longer", ko: "더는 기다릴 수 없었다" },
          { en: "went to the dining room", ko: "식당으로 갔다" },
          { en: "rubbing against my legs", ko: "내 다리에 몸을 비비며" },
        ],
      },
    ],
  };

  const $ = (s) => document.querySelector(s);
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const state = {
    sources: [],
    sentences: [],
    sourceId: "",
    index: 0,
    loading: false,
    mode: "public",
  };

  function setStatus(text) {
    const el = $("#status");
    if (el) el.textContent = text;
  }

  function normalizeSentence(row) {
    const learning = Array.isArray(row.anne_sentence_learning) ? row.anne_sentence_learning[0] : row.anne_sentence_learning || {};
    const chunksRaw = Array.isArray(row.anne_sentence_chunks) ? row.anne_sentence_chunks : row.anne_sentence_chunks ? [row.anne_sentence_chunks] : [];
    const chunks = chunksRaw
      .map((x) => ({
        order: Number(x.chunk_order || x.chunk_no || 0),
        en: String(x.chunk_en || x.en || ""),
        ko: String(x.chunk_ko || x.ko || ""),
      }))
      .filter((x) => x.en)
      .sort((a, b) => a.order - b.order);

    return {
      source_row: Number(row.source_row || 0),
      source_text: String(row.source_text || ""),
      p_ko: String(learning.p_ko || ""),
      question: learning.q_en
        ? {
            q_en: String(learning.q_en || ""),
            q_ko: String(learning.q_ko || ""),
            choices: [1, 2, 3, 4].map((n) => ({
              no: n,
              en: String(learning[`choice_${n}_en`] || ""),
              ko: String(learning[`choice_${n}_ko`] || ""),
            })),
            answer: Number(learning.answer || 0),
            explanation_en: String(learning.explanation_en || ""),
            explanation_ko: String(learning.explanation_ko || ""),
          }
        : null,
      chunks,
    };
  }

  function renderCatalog() {
    const target = $("#catalog");
    if (!target) return;
    if (!state.sources.length) {
      target.textContent = "No enabled sources yet.";
      return;
    }
    target.innerHTML =
      "<div class='catalog-grid'>" +
      state.sources
        .map(
          (s) =>
            `<button class="catalog-card${s.source_id === state.sourceId ? " active" : ""}" data-source="${esc(s.source_id)}">` +
            `<div class="catalog-title">${esc(s.title || s.source_id)}</div>` +
            `<div class="catalog-meta">${esc(s.source_id)} · public reader</div>` +
            `</button>`,
        )
        .join("") +
      "</div>";

    target.querySelectorAll("[data-source]").forEach((btn) => {
      btn.addEventListener("click", () => loadSource(btn.getAttribute("data-source")));
    });
  }

  function renderReader() {
    const sentence = state.sentences[state.index];
    const reader = $("#reader");
    const chunks = $("#chunks");
    if (!reader || !chunks) return;

    if (!sentence) {
      reader.innerHTML = "<div class='empty'>No sentence loaded.</div>";
      chunks.innerHTML = "";
      return;
    }

    const question = sentence.question;
    reader.innerHTML =
      `<div class="sentence-card">` +
      `<div class="sentence-meta">Sentence ${state.index + 1} / ${state.sentences.length}</div>` +
      `<div class="sentence-en">${esc(sentence.source_text)}</div>` +
      `<div class="sentence-ko">${esc(sentence.p_ko || "")}</div>` +
      (question
        ? `<div class="question-block"><div class="question-en">${esc(question.q_en)}</div><div class="question-ko">${esc(question.q_ko)}</div>` +
          `<div class="choices">${question.choices
            .map(
              (c) =>
                `<div class="choice"><b>${c.no}</b> <span class="choice-en">${esc(c.en)}</span><span class="choice-ko">${esc(c.ko)}</span></div>`,
            )
            .join("")}</div>` +
          `<div class="answer-line"><b>Answer</b> ${esc(String(question.answer))}</div>` +
          `<div class="explain"><b>Explain</b><div>${esc(question.explanation_ko || question.explanation_en || "")}</div></div></div>`
        : `<div class="no-question">No question for this sentence.</div>`) +
      `</div>`;

    chunks.innerHTML =
      "<div class='chunk-head'>Chunk</div>" +
      "<div class='chunk-grid'>" +
      (sentence.chunks.length
        ? sentence.chunks
            .map(
              (c, i) =>
                `<div class="chunk-card"><div class="chunk-no">${i + 1}</div><div class="chunk-en">${esc(c.en)}</div><div class="chunk-ko">${esc(c.ko)}</div></div>`,
            )
            .join("")
        : "<div class='empty'>No chunks.</div>") +
      "</div>";

    $("#prevBtn").disabled = state.index <= 0;
    $("#nextBtn").disabled = state.index >= state.sentences.length - 1;
    $("#counter").textContent = `${state.index + 1} / ${state.sentences.length}`;
  }

  function render() {
    renderCatalog();
    renderReader();
  }

  async function api(action, payload) {
    if (!cfg.url || !cfg.publishableKey || !cfg.functionName) {
      throw new Error("Supabase config is not set yet.");
    }
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
    state.loading = true;
    setStatus("Loading...");
    state.sourceId = sourceId;
    try {
      if (!cfg.url || !cfg.publishableKey || !cfg.functionName) {
        state.sources = demo.sources;
        state.sentences = demo.sentences;
        state.index = 0;
        state.mode = "demo";
        setStatus("Demo mode");
        render();
        return;
      }

      const payload = await api("sentences", { source_id: sourceId, limit: 100 });
      state.sentences = (payload.data || []).map(normalizeSentence);
      state.index = 0;
      state.mode = "public";
      setStatus(payload.access === "public" ? "Public reader" : "Loaded");
      render();
    } catch (e) {
      state.sources = demo.sources;
      state.sentences = demo.sentences;
      state.index = 0;
      state.mode = "demo";
      setStatus(e.message || String(e));
      render();
    } finally {
      state.loading = false;
    }
  }

  async function boot() {
    try {
      if (!cfg.url || !cfg.publishableKey || !cfg.functionName) {
        state.sources = demo.sources;
        state.sentences = demo.sentences;
        state.sourceId = demo.sources[0].source_id;
        state.index = 0;
        setStatus("Demo mode");
        render();
        return;
      }

      const payload = await api("catalog");
      state.sources = payload.sources || [];
      if (!state.sources.length) {
        state.sources = demo.sources;
        state.sentences = demo.sentences;
        state.sourceId = demo.sources[0].source_id;
        state.index = 0;
        setStatus("No enabled sources yet");
        render();
        return;
      }
      state.sourceId = state.sources[0].source_id;
      await loadSource(state.sourceId);
    } catch (e) {
      state.sources = demo.sources;
      state.sentences = demo.sentences;
      state.sourceId = demo.sources[0].source_id;
      state.index = 0;
      setStatus(e.message || String(e));
      render();
    }
  }

  $("#prevBtn").addEventListener("click", () => {
    if (state.index > 0) state.index -= 1;
    renderReader();
  });
  $("#nextBtn").addEventListener("click", () => {
    if (state.index < state.sentences.length - 1) state.index += 1;
    renderReader();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") $("#prevBtn").click();
    if (event.key === "ArrowRight") $("#nextBtn").click();
  });

  await boot();
})();
