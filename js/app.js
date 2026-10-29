/* ============================================================
   FreeAI — ChatGPT-style, free-forever front-end.
   No backend: the browser talks directly to free AI providers.
   - Default: Pollinations (no key, no sign-up)
   - Optional free keys: OpenRouter / Groq / any OpenAI-compatible API
   Chats + keys live only in localStorage on this device.
   ============================================================ */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const OWNER = window.FREEAI_CONFIG || {};
const DEFAULT_SYSTEM = "You are FreeAI, a helpful, friendly AI assistant. Answer clearly and completely. Use markdown (headings, lists, tables, code blocks) when it helps. When the user asks for code, write the complete, runnable code for them — never ask them to write or print code themselves. Reply in the user's language.";

const PROVIDERS = {
  pollinations: {
    label: "FreeAI Free",
    chatUrl: "https://text.pollinations.ai/openai",
    modelsUrl: "https://text.pollinations.ai/models",
    needsKey: false,
    help: "✅ No key, no sign-up, works instantly. Free models are provided by Pollinations.ai. Busy times can be slower — if a model fails, pick another one in the model menu or add a free Groq/OpenRouter key below.",
    fallbackModels: [
      { id: "openai", name: "FreeAI GPT — Fast", desc: "Best all-rounder · free (Pollinations)" },
      { id: "openai-large", name: "FreeAI GPT — Smart", desc: "Smarter, a bit slower · free (Pollinations)" },
      { id: "mistral", name: "Mistral", desc: "Fast open model · free (Pollinations)" },
    ],
  },
  openrouter: {
    label: "OpenRouter",
    chatUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelsUrl: "https://openrouter.ai/api/v1/models",
    needsKey: true,
    help: "Get a free key at openrouter.ai → Keys. FreeAI automatically lists only the $0 models (names ending in “:free”) — hundreds of models including Llama, DeepSeek, Qwen, Gemma…",
    fallbackModels: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (free)", desc: "Meta · via OpenRouter" },
      { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (free)", desc: "Deep reasoning · via OpenRouter" },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)", desc: "Google · via OpenRouter" },
    ],
  },
  groq: {
    label: "Groq",
    chatUrl: "https://api.groq.com/openai/v1/chat/completions",
    modelsUrl: "https://api.groq.com/openai/v1/models",
    needsKey: true,
    help: "Get a free key at console.groq.com → API Keys. Groq's free tier is extremely fast (Llama, DeepSeek, Qwen, Gemma…).",
    fallbackModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", desc: "Meta · via Groq (free tier)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", desc: "Fastest · via Groq (free tier)" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B", desc: "Reasoning · via Groq (free tier)" },
    ],
  },
  custom: {
    label: "Custom API",
    needsKey: false,
    help: "Any OpenAI-compatible endpoint: a local LM Studio / Ollama server, OpenAI itself, Together, Fireworks, etc. Fill in the base URL and model name below.",
    fallbackModels: [],
  },
};

/* ── State ─────────────────────────────────────────────────── */
const LS_CHATS = "freeai.chats.v1";
const LS_SETTINGS = "freeai.settings.v1";

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
}

const settings = Object.assign({
  provider: "pollinations",
  model: "openai",
  keys: { openrouter: "", groq: "", custom: "" },
  customBase: "",
  customModel: "",
  temperature: 0.7,
  systemPrompt: DEFAULT_SYSTEM,
  theme: "dark",
  supportUrl: "",
}, loadJSON(LS_SETTINGS, {}));
settings.keys = Object.assign({ openrouter: "", groq: "", custom: "" }, settings.keys || {});

let chats = loadJSON(LS_CHATS, []);
let currentChatId = null;
let models = [];
let isGenerating = false;
let abortCtrl = null;
let imageMode = false;
let codeMode = false;
let pendingAttachments = []; // {name, kind:'text'|'image', text?, dataUrl?}
let editingIndex = null;
let previewHtml = "";
let recognition = null;

const saveSettings = () => saveJSON(LS_SETTINGS, settings);
const saveChats = () => saveJSON(LS_CHATS, chats);
const currentChat = () => chats.find((c) => c.id === currentChatId) || null;
const provider = () => PROVIDERS[settings.provider] || PROVIDERS.pollinations;

/* ── Toast ─────────────────────────────────────────────────── */
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ═══════════════════ MODELS ════════════════════════════════ */
async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}

function prettyModelName(id) {
  return String(id)
    .replace(/:free$/, " (free)")
    .replace(/^.*\//, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadModels(announce = false) {
  const p = provider();
  $("#providerName").textContent = p.label;
  models = [...p.fallbackModels];

  if (settings.provider === "custom") {
    models = settings.customModel
      ? [{ id: settings.customModel, name: settings.customModel, desc: settings.customBase || "Custom endpoint" }]
      : [];
  } else {
    try {
      const headers = {};
      const key = settings.keys[settings.provider];
      if (key) headers.Authorization = "Bearer " + key;
      const res = await fetchWithTimeout(p.modelsUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = normalizeModels(settings.provider, data);
        if (list.length) models = list;
      }
    } catch { /* offline / provider busy → keep fallback list */ }
  }

  if (!models.some((m) => m.id === settings.model) && models.length) {
    settings.model = models[0].id;
  }
  saveSettings();
  renderModelList();
  updateModelButton();
  if (announce) toast(models.length ? `Loaded ${models.length} free model${models.length > 1 ? "s" : ""}` : "No models returned — check Settings");
}

function normalizeModels(providerId, data) {
  const out = [];
  if (providerId === "pollinations") {
    const arr = Array.isArray(data) ? data : data?.data || [];
    for (const m of arr) {
      if (typeof m === "string") out.push({ id: m, name: prettyModelName(m), desc: "Free · Pollinations" });
      else if (m && (m.name || m.id)) {
        const id = m.name || m.id;
        out.push({ id, name: prettyModelName(id), desc: (m.description || "Free · Pollinations").slice(0, 90) });
      }
    }
  } else if (providerId === "openrouter") {
    const arr = data?.data || [];
    const free = arr.filter((m) => String(m?.pricing?.prompt) === "0" && String(m?.pricing?.completion) === "0");
    for (const m of (free.length ? free : arr)) {
      out.push({ id: m.id, name: m.name || prettyModelName(m.id), desc: "Free · OpenRouter" });
    }
  } else if (providerId === "groq") {
    const arr = data?.data || [];
    for (const m of arr) out.push({ id: m.id, name: prettyModelName(m.id), desc: "Free tier · Groq" });
  }
  // de-dupe
  const seen = new Set();
  return out.filter((m) => m.id && !seen.has(m.id) && seen.add(m.id));
}

function updateModelButton() {
  const m = models.find((x) => x.id === settings.model);
  $("#modelName").textContent = m ? m.name : (settings.model || "FreeAI");
  $("#composerHint").textContent = `${provider().label} · ${m ? m.name : settings.model} · Free`;
}

function renderModelList(filter = "") {
  const list = $("#modelList");
  const q = filter.trim().toLowerCase();
  const shown = models.filter((m) => !q || (m.name + " " + m.id + " " + (m.desc || "")).toLowerCase().includes(q));
  if (!shown.length) {
    list.innerHTML = `<div class="chat-empty">No models found.<br/>Open Settings to add a (free) API key or a custom model.</div>`;
    return;
  }
  list.innerHTML = "";
  for (const m of shown) {
    const b = document.createElement("button");
    b.className = "model-item" + (m.id === settings.model ? " selected" : "");
    b.setAttribute("role", "option");
    b.innerHTML = `
      <div class="m-main">
        <div class="m-name">${esc(m.name)}</div>
        <div class="m-desc">${esc(m.desc || m.id)}</div>
      </div>
      <span class="badge-free">FREE</span>
      ${m.id === settings.model ? `<span class="m-check">✓</span>` : ""}`;
    b.onclick = () => {
      settings.model = m.id;
      saveSettings();
      updateModelButton();
      renderModelList($("#modelSearch").value);
      closeDropdowns();
      toast(`Model: ${m.name}`);
    };
    list.appendChild(b);
  }
}

/* ═══════════════════ CHAT CRUD + SIDEBAR ═══════════════════ */
function newChat(focus = true) {
  const c = { id: uid(), title: "New chat", createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
  chats.unshift(c);
  currentChatId = c.id;
  editingIndex = null;
  saveChats();
  renderSidebar();
  renderMessages();
  if (focus) $("#input").focus();
  if (window.innerWidth <= 860) setSidebar(false);
  return c;
}

function groupLabel(ts) {
  const now = new Date(); const d = new Date(ts);
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(now, d)) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(y, d)) return "Yesterday";
  if (now - d < 7 * 864e5) return "Previous 7 days";
  return "Older";
}

function renderSidebar() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const list = $("#chatList");
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)));
  list.innerHTML = "";
  if (!sorted.length) {
    list.innerHTML = `<div class="chat-empty">${q ? "No chats match your search." : "No chats yet.<br/>Ask anything below — it's free &amp; unlimited."}</div>`;
    return;
  }
  let lastGroup = "";
  for (const c of sorted) {
    const g = groupLabel(c.updatedAt);
    if (g !== lastGroup) {
      lastGroup = g;
      const h = document.createElement("div");
      h.className = "chat-group"; h.textContent = g;
      list.appendChild(h);
    }
    const item = document.createElement("div");
    item.className = "chat-item" + (c.id === currentChatId ? " active" : "");
    item.innerHTML = `<span class="title">${esc(c.title)}</span>
      <span class="item-btns">
        <button data-act="rename" title="Rename">✎</button>
        <button data-act="delete" title="Delete">🗑</button>
      </span>`;
    item.title = c.title;
    item.onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "rename") {
        const t = prompt("Rename chat:", c.title);
        if (t && t.trim()) { c.title = t.trim().slice(0, 80); saveChats(); renderSidebar(); }
        return;
      }
      if (act === "delete") {
        if (!confirm(`Delete “${c.title}”?`)) return;
        chats = chats.filter((x) => x.id !== c.id);
        if (currentChatId === c.id) {
          currentChatId = chats[0]?.id || null;
          if (!currentChatId) { saveChats(); newChat(false); return; }
        }
        saveChats(); renderSidebar(); renderMessages();
        return;
      }
      currentChatId = c.id;
      editingIndex = null;
      renderSidebar(); renderMessages();
      if (window.innerWidth <= 860) setSidebar(false);
    };
    list.appendChild(item);
  }
}

/* ═══════════════════ MESSAGE RENDERING ═════════════════════ */
if (window.marked) marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(md) {
  const text = String(md ?? "");
  if (window.marked) {
    const html = marked.parse(text);
    return window.DOMPurify ? DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] }) : html;
  }
  return `<p>${esc(text).replace(/\n/g, "<br/>")}</p>`;
}

function scrollToBottom(smooth = false) {
  const sc = $("#chatScroll");
  sc.scrollTo({ top: sc.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}
const nearBottom = () => {
  const sc = $("#chatScroll");
  return sc.scrollHeight - sc.scrollTop - sc.clientHeight < 260;
};

function messageEl(msg, index, chat) {
  const wrap = document.createElement("article");
  wrap.className = "msg " + msg.role;
  wrap.dataset.id = msg.id;

  if (msg.role === "user") {
    wrap.innerHTML = `<div class="bubble-user">${esc(msg.display ?? msg.content)}</div>
      <div class="msg-actions">
        <button data-act="copy" title="Copy">⧉</button>
        <button data-act="edit" title="Edit &amp; resend">✎</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <div class="who"><img src="assets/logo.svg" alt=""/> FreeAI ${msg.model ? `<span class="model-tag">${esc(prettyModelName(msg.model))}</span>` : ""}</div>
      <div class="content"></div>
      <div class="msg-actions">
        <button data-act="copy" title="Copy">⧉</button>
        <button data-act="speak" title="Read aloud">🔊</button>
        <button data-act="regen" title="Regenerate">↻</button>
      </div>`;
    const contentEl = $(".content", wrap);
    if (msg.pending) contentEl.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
    else if (msg.error) contentEl.innerHTML = `<div class="error-box">${renderMarkdown(msg.content)}</div>`;
    else { contentEl.innerHTML = renderMarkdown(msg.content); enhanceCodeBlocks(contentEl); }
  }

  wrap.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "copy") {
      navigator.clipboard?.writeText(msg.display ?? msg.content).then(() => toast("Copied ✓"), () => toast("Copy failed on this browser"));
    } else if (act === "speak") speak(msg.content);
    else if (act === "regen") regenerate();
    else if (act === "edit") {
      editingIndex = index;
      const inp = $("#input");
      inp.value = msg.display ?? msg.content;
      autoResize(); updateSendBtn(); inp.focus();
      toast("Editing — press Send to resend from here");
    }
  });
  return wrap;
}

function renderMessages() {
  const chat = currentChat();
  const box = $("#messages");
  box.innerHTML = "";
  const has = !!chat && chat.messages.length > 0;
  $("#emptyState").classList.toggle("hidden", has);
  if (has) chat.messages.forEach((m, i) => box.appendChild(messageEl(m, i, chat)));
  scrollToBottom();
}

function updateAssistantBubble(msg, { streaming = false } = {}) {
  const el = $(`.msg[data-id="${msg.id}"] .content`);
  if (!el) return;
  const stick = nearBottom();
  if (msg.pending && !msg.content) {
    el.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
  } else {
    el.innerHTML = renderMarkdown(msg.content) + (streaming ? `<span class="cursor-dot"></span>` : "");
    if (!streaming) enhanceCodeBlocks(el);
  }
  if (stick) scrollToBottom();
}

/* ── Code blocks: copy / download / ▶ Run-it-for-you preview ── */
const LANG_EXT = { html: "html", xml: "html", javascript: "js", js: "js", typescript: "ts", ts: "ts", css: "css", python: "py", py: "py", json: "json", bash: "sh", shell: "sh", java: "java", c: "c", cpp: "cpp", "c++": "cpp", csharp: "cs", php: "php", ruby: "rb", go: "go", rust: "rs", sql: "sql", markdown: "md", md: "md", svg: "svg" };

function enhanceCodeBlocks(root) {
  $$("pre", root).forEach((pre) => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = "1";
    const code = $("code", pre);
    if (!code) return;
    if (window.hljs) { try { hljs.highlightElement(code); } catch { /* unknown lang */ } }
    const lang = (code.className.match(/language-([\w+-]+)/) || [])[1]?.toLowerCase() || "";
    const text = code.textContent;
    const head = document.createElement("div");
    head.className = "code-head";
    const runnable = ["html", "xml", "svg"].includes(lang) || /<!doctype html|<html[\s>]/i.test(text);
    const wrappable = ["javascript", "js", "css"].includes(lang);
    head.innerHTML = `<span>${esc(lang || "code")}</span>
      <span class="code-btns">
        ${(runnable || wrappable) ? `<button class="run" data-run="1">▶ Run preview</button>` : ""}
        <button data-copy="1">⧉ Copy</button>
        <button data-dl="1">⬇ Download</button>
      </span>`;
    pre.prepend(head);
    $("[data-copy]", head).onclick = () => navigator.clipboard?.writeText(text).then(() => toast("Code copied ✓"));
    $("[data-dl]", head).onclick = () => download(`freeai-code.${LANG_EXT[lang] || "txt"}`, text);
    const runBtn = $("[data-run]", head);
    if (runBtn) runBtn.onclick = () => openPreview(buildPreviewDoc(text, lang));
  });
  // open links in a new tab safely
  $$("a", root).forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
}

function buildPreviewDoc(code, lang) {
  const t = code.trim();
  if (/<!doctype html|<html[\s>]/i.test(t)) return t;
  if (lang === "css") return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${code}</style></head><body><h1>CSS preview</h1><p>Your CSS is applied to this sample page. Edit the HTML in a new message like “use this CSS on a landing page”.</p><button>Sample button</button></body></html>`;
  if (lang === "javascript" || lang === "js") return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;margin:24px}#log{background:#0d1117;color:#7ee787;padding:14px;border-radius:10px;white-space:pre-wrap;min-height:90px}</style></head><body><h2>JavaScript output</h2><div id="log"></div><script>const _l=document.getElementById('log');const _c=console.log.bind(console);console.log=(...a)=>{_c(...a);_l.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n';};window.onerror=(m)=>{_l.textContent+='❌ '+m+'\\n';};<\/script><script>${code}<\/script></body></html>`;
  if (lang === "svg") return `<!DOCTYPE html><html><body style="display:flex;justify-content:center;align-items:center;min-height:95vh;margin:0">${code}</body></html>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${code}</body></html>`;
}

function openPreview(html) {
  previewHtml = html;
  $("#previewPanel").classList.remove("hidden");
  $("#previewFrame").srcdoc = html;
}
function closePreview() {
  $("#previewPanel").classList.add("hidden");
  $("#previewFrame").srcdoc = "";
}

function download(filename, text, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ── Speech ────────────────────────────────────────────────── */
function speak(text) {
  if (!("speechSynthesis" in window)) { toast("Read-aloud isn't supported in this browser"); return; }
  speechSynthesis.cancel();
  const clean = String(text).replace(/```[\s\S]*?```/g, " (code block) ").replace(/[#*_`>\[\]()!|]/g, " ").slice(0, 4000);
  speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
}

/* ═══════════════════ API CALLS ═════════════════════════════ */
function chatEndpoint() {
  if (settings.provider === "custom") {
    const base = (settings.customBase || "").replace(/\/+$/, "");
    return base.endsWith("/chat/completions") ? base : base + "/chat/completions";
  }
  return provider().chatUrl;
}
function authHeaders() {
  const h = { "Content-Type": "application/json" };
  const key = settings.keys[settings.provider];
  if (key) h.Authorization = "Bearer " + key;
  if (settings.provider === "openrouter") { h["X-Title"] = "FreeAI"; }
  return h;
}
const activeModel = () => settings.provider === "custom" ? (settings.customModel || settings.model) : settings.model;

function buildApiMessages(chat) {
  const msgs = [{ role: "system", content: settings.systemPrompt || DEFAULT_SYSTEM }];
  if (codeMode) msgs.push({ role: "system", content: "The user wants you to BUILD IT FOR THEM. Reply with complete, ready-to-run code (prefer one single self-contained HTML file for web apps so it can be previewed instantly), plus a very short explanation. Never leave placeholders or ask the user to write code." });
  for (const m of chat.messages.slice(-30)) {
    if (m.pending || m.error) continue;
    msgs.push({ role: m.role, content: m.apiContent ?? m.content });
  }
  return msgs;
}

function contentToText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((p) => p.text || "").join("");
  return content?.text || "";
}

async function callChatAPI(apiMessages, onToken, signal) {
  const body = { model: activeModel(), messages: apiMessages, temperature: Number(settings.temperature) || 0.7 };
  const url = chatEndpoint();
  if (settings.provider === "custom" && !settings.customBase) throw new Error("Set your custom API base URL in Settings first.");
  if (provider().needsKey && !settings.keys[settings.provider]) throw new Error(`Add your free ${provider().label} API key in Settings (⚙), or switch back to “FreeAI Free” which needs no key.`);

  // 1) Streaming attempt
  try {
    const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...body, stream: true }), signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const text = await readStream(res, onToken);
    if (text.trim()) return text;
    throw new Error("Empty stream");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // fall through to non-streaming
    var streamErr = err; // eslint-disable-line no-var
  }

  // 2) Non-streaming attempt
  try {
    const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = contentToText(data?.choices?.[0]?.message?.content) || data?.choices?.[0]?.text || "";
    if (text.trim()) { await typewriter(text, onToken, signal); return text; }
    throw new Error("The model returned an empty reply.");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // 3) Pollinations plain-text GET fallback (very reliable, no key)
    if (settings.provider === "pollinations") {
      const prompt = apiMessages.map((m) => `${m.role === "system" ? "System" : m.role === "user" ? "User" : "Assistant"}: ${contentToText(m.content)}`).join("\n\n") + "\n\nAssistant:";
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(-12000))}?model=${encodeURIComponent(activeModel())}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.trim()) { await typewriter(text, onToken, signal); return text; }
    }
    throw streamErr || err;
  }
}

async function readStream(res, onToken) {
  if (!res.body?.getReader) {
    const data = await res.json();
    const t = contentToText(data?.choices?.[0]?.message?.content);
    if (t) onToken(t);
    return t;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", full = "", raw = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    raw += chunk; buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = contentToText(json?.choices?.[0]?.delta?.content) || contentToText(json?.choices?.[0]?.message?.content) || json?.choices?.[0]?.text || "";
        if (delta) { full += delta; onToken(delta); }
      } catch { /* partial JSON line */ }
    }
  }
  if (!full && raw.trim()) {
    // Server replied with plain JSON instead of SSE
    try {
      const data = JSON.parse(raw);
      full = contentToText(data?.choices?.[0]?.message?.content) || "";
      if (full) onToken(full);
    } catch { /* plain text */ full = raw; onToken(raw); }
  }
  return full;
}

async function typewriter(text, onToken, signal) {
  const step = Math.max(2, Math.round(text.length / 160));
  for (let i = 0; i < text.length; i += step) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onToken(text.slice(i, i + step));
    await new Promise((r) => setTimeout(r, 10));
  }
}

/* ── Image generation (free, unlimited via Pollinations) ───── */
function generateImage(prompt) {
  const seed = Math.floor(Math.random() * 1e9);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
}

/* ═══════════════════ SEND FLOW ═════════════════════════════ */
function setGenerating(on) {
  isGenerating = on;
  $("#sendIcon").classList.toggle("hidden", on);
  $("#stopIcon").classList.toggle("hidden", !on);
  $("#sendBtn").disabled = !on && !$("#input").value.trim();
  $("#sendBtn").title = on ? "Stop generating" : "Send";
}

async function send(rawText) {
  const typed = (rawText ?? $("#input").value).trim();
  if (isGenerating || (!typed && !pendingAttachments.length)) return;

  let chat = currentChat();
  if (!chat) chat = newChat(false);

  if (editingIndex !== null) {
    chat.messages = chat.messages.slice(0, editingIndex);
    editingIndex = null;
  }

  // Build the user message (display text + API content incl. attachments)
  let display = typed;
  let apiContent = typed;
  const images = pendingAttachments.filter((a) => a.kind === "image");
  const texts = pendingAttachments.filter((a) => a.kind === "text");
  for (const t of texts) apiContent += `\n\n--- Attached file: ${t.name} ---\n${t.text.slice(0, 20000)}`;
  if (pendingAttachments.length) display += (display ? "\n" : "") + pendingAttachments.map((a) => `📎 ${a.name}`).join("\n");
  if (images.length) {
    apiContent = [{ type: "text", text: apiContent || "Describe this image." },
      ...images.map((i) => ({ type: "image_url", image_url: { url: i.dataUrl } }))];
  }

  const userMsg = { id: uid(), role: "user", content: display || typed, display, apiContent, ts: Date.now() };
  chat.messages.push(userMsg);
  if (chat.messages.filter((m) => m.role === "user").length === 1) {
    chat.title = (typed || pendingAttachments[0]?.name || "New chat").slice(0, 42) || "New chat";
  }
  pendingAttachments = [];
  renderAttachChips();

  const asst = { id: uid(), role: "assistant", content: "", pending: true, model: imageMode ? "flux-image" : activeModel(), ts: Date.now() };
  chat.messages.push(asst);
  chat.updatedAt = Date.now();
  saveChats(); renderSidebar(); renderMessages();

  $("#input").value = ""; autoResize(); setGenerating(true);
  abortCtrl = new AbortController();

  try {
    if (imageMode) {
      setImageMode(false);
      const url = generateImage(typed);
      const el = $(`.msg[data-id="${asst.id}"] .content`);
      if (el) el.innerHTML = `<div class="img-loading">🎨 Creating your image… (free &amp; unlimited)</div>`;
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error("Image service was busy. Try again in a few seconds."));
        img.src = url;
        abortCtrl.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
      asst.content = `![${typed.replace(/[\[\]]/g, "")}](${url})\n\n**Prompt:** ${typed}\n\n[⬇ Download full-size image](${url})`;
      asst.apiContent = `I created an image for the prompt: “${typed}”.`;
    } else {
      let lastPaint = 0;
      const onToken = (tok) => {
        asst.content += tok;
        asst.pending = false;
        const now = performance.now();
        if (now - lastPaint > 70) { lastPaint = now; updateAssistantBubble(asst, { streaming: true }); }
      };
      const finalText = await callChatAPI(buildApiMessages(chat), onToken, abortCtrl.signal);
      asst.content = finalText || asst.content;
    }
    asst.pending = false;
  } catch (err) {
    asst.pending = false;
    if (err.name === "AbortError") {
      asst.content += asst.content ? "\n\n_⏹ Stopped._" : "_⏹ Stopped._";
    } else {
      asst.error = true;
      asst.content = `⚠️ **That model didn't answer.**\n\n\`${String(err.message || err).slice(0, 320)}\`\n\n**Try this (all free):**\n1. Pick a different model in the menu above (↻ Refresh loads the live list).\n2. Check your internet connection.\n3. Or add a free **Groq** key (console.groq.com) / **OpenRouter** key (openrouter.ai) in ⚙ Settings — both have generous free tiers.\n\nThen press **↻ Regenerate**.`;
    }
  } finally {
    setGenerating(false);
    chat.updatedAt = Date.now();
    saveChats(); renderSidebar();
    updateAssistantBubble(asst);
    const acts = $(`.msg[data-id="${asst.id}"] .msg-actions`);
    if (acts) acts.classList.add("always");
    $("#input").focus();
  }
}

function regenerate() {
  const chat = currentChat();
  if (!chat || isGenerating) return;
  // drop trailing assistant messages, then re-ask the last user message
  while (chat.messages.length && chat.messages.at(-1).role === "assistant") chat.messages.pop();
  const lastUser = chat.messages.at(-1);
  if (!lastUser) return;
  chat.messages.pop();
  saveChats(); renderMessages();
  $("#input").value = lastUser.display ?? lastUser.content;
  send();
}

/* ═══════════════════ COMPOSER / MODES / ATTACHMENTS ════════ */
function autoResize() {
  const ta = $("#input");
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 210) + "px";
}
function updateSendBtn() {
  if (!isGenerating) $("#sendBtn").disabled = !$("#input").value.trim() && !pendingAttachments.length;
}

function renderModeChips() {
  const box = $("#modeChips");
  box.innerHTML = "";
  const chip = (label, off) => {
    const s = document.createElement("span");
    s.className = "mode-chip";
    s.innerHTML = `${label} <button title="Turn off">✕</button>`;
    $("button", s).onclick = off;
    box.appendChild(s);
  };
  if (imageMode) chip("🎨 Image mode — next message becomes a picture", () => setImageMode(false));
  if (codeMode) chip("💻 Build-it-for-me mode — complete runnable code", () => setCodeMode(false));
  $("#imageModeState").textContent = imageMode ? "ON — click to turn off" : "Off — next message becomes a picture";
  $("#codeModeState").textContent = codeMode ? "ON — click to turn off" : "Off — AI writes complete runnable code";
  $("#input").placeholder = imageMode ? "Describe the image you want… (free & unlimited)" : codeMode ? "Describe the app / website / tool to build for you…" : "Ask anything…  (free, unlimited)";
}
function setImageMode(on) { imageMode = on; if (on) codeMode = false; renderModeChips(); $("#input").focus(); }
function setCodeMode(on) { codeMode = on; if (on) imageMode = false; renderModeChips(); $("#input").focus(); }

function renderAttachChips() {
  const box = $("#attachChips");
  box.innerHTML = "";
  pendingAttachments.forEach((a, i) => {
    const s = document.createElement("span");
    s.className = "attach-chip";
    s.innerHTML = `<span>${a.kind === "image" ? "🖼" : "📄"}</span><span class="a-name">${esc(a.name)}</span><button title="Remove">✕</button>`;
    $("button", s).onclick = () => { pendingAttachments.splice(i, 1); renderAttachChips(); updateSendBtn(); };
    box.appendChild(s);
  });
  updateSendBtn();
}

async function handleFiles(files) {
  for (const f of files) {
    if (f.size > 8 * 1024 * 1024) { toast(`“${f.name}” is over 8 MB — skipped`); continue; }
    if (f.type.startsWith("image/")) {
      const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      pendingAttachments.push({ name: f.name, kind: "image", dataUrl });
    } else {
      const text = await f.text().catch(() => "");
      if (!text) { toast(`Couldn't read “${f.name}” as text`); continue; }
      pendingAttachments.push({ name: f.name, kind: "text", text });
    }
  }
  renderAttachChips();
  toast("Attached ✓ — press Send");
}

/* ═══════════════════ DROPDOWNS / SIDEBAR ═══════════════════ */
function closeDropdowns() {
  $("#modelMenu").classList.add("hidden");
  $("#plusMenu").classList.add("hidden");
  $("#modelBtn").setAttribute("aria-expanded", "false");
  $("#plusBtn").setAttribute("aria-expanded", "false");
}
function setSidebar(open) {
  $("#sidebar").classList.toggle("closed", !open);
  $("#app").classList.toggle("sidebar-closed", !open);
  $("#sidebarBackdrop").classList.toggle("hidden", !(open && window.innerWidth <= 860));
}

/* ═══════════════════ SETTINGS ══════════════════════════════ */
function fillSettingsForm() {
  $("#providerSelect").value = settings.provider;
  $("#apiKeyInput").value = settings.keys[settings.provider] || "";
  $("#customBaseInput").value = settings.customBase || "";
  $("#customModelInput").value = settings.customModel || "";
  $("#tempInput").value = settings.temperature;
  $("#tempValue").textContent = settings.temperature;
  $("#systemPromptInput").value = settings.systemPrompt || "";
  $("#themeSelect").value = settings.theme;
  $("#supportUrlInput").value = settings.supportUrl || "";
  refreshProviderUI();
  const about = $("#aboutText");
  if (OWNER.creatorName && !about.dataset.creatorAdded) {
    about.dataset.creatorAdded = "1";
    about.insertAdjacentText("beforeend", ` This copy of FreeAI is run by ${OWNER.creatorName}.`);
  }
}
function refreshProviderUI() {
  const p = PROVIDERS[$("#providerSelect").value];
  $("#providerHelp").textContent = p.help;
  $("#apiKeyField").classList.toggle("hidden", $("#providerSelect").value === "pollinations");
  $("#customFields").classList.toggle("hidden", $("#providerSelect").value !== "custom");
  $("#apiKeyInput").placeholder = p.needsKey ? `Your free ${p.label} key…` : "Optional API key…";
}
function applySupportButton() {
  const url = settings.supportUrl || OWNER.supportUrl || "";
  const btn = $("#supportBtn");
  btn.classList.toggle("hidden", !url);
  if (url) { btn.href = url; $("#supportLabel").textContent = OWNER.supportLabel || "❤️ Support the creator"; }
}
function applyTheme() { document.documentElement.dataset.theme = settings.theme || "dark"; }

/* ═══════════════════ EVENTS ════════════════════════════════ */
function bindEvents() {
  $("#input").addEventListener("input", () => { autoResize(); updateSendBtn(); });
  $("#input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  $("#sendBtn").addEventListener("click", () => {
    if (isGenerating) abortCtrl?.abort();
    else send();
  });

  $("#newChatBtn").onclick = () => newChat();
  $("#topNewChatBtn").onclick = () => newChat();
  $("#brandHome").onclick = (e) => { e.preventDefault(); newChat(); };
  $("#searchInput").addEventListener("input", renderSidebar);

  $("#collapseBtn").onclick = () => setSidebar(false);
  $("#openSidebarBtn").onclick = () => setSidebar(true);
  $("#sidebarBackdrop").onclick = () => setSidebar(false);

  // Model menu
  $("#modelBtn").onclick = (e) => {
    e.stopPropagation();
    const m = $("#modelMenu");
    const willOpen = m.classList.contains("hidden");
    closeDropdowns();
    if (willOpen) { m.classList.remove("hidden"); $("#modelBtn").setAttribute("aria-expanded", "true"); renderModelList($("#modelSearch").value); }
  };
  $("#modelMenu").addEventListener("click", (e) => e.stopPropagation());
  $("#modelSearch").addEventListener("input", (e) => renderModelList(e.target.value));
  $("#refreshModelsBtn").onclick = () => loadModels(true);
  $("#openSettingsFromModels").onclick = () => { closeDropdowns(); openSettings(); };

  // Plus menu
  $("#plusBtn").onclick = (e) => {
    e.stopPropagation();
    const m = $("#plusMenu");
    const willOpen = m.classList.contains("hidden");
    closeDropdowns();
    if (willOpen) { m.classList.remove("hidden"); $("#plusBtn").setAttribute("aria-expanded", "true"); }
  };
  $("#plusMenu").addEventListener("click", (e) => e.stopPropagation());
  $("#attachMenuBtn").onclick = () => { closeDropdowns(); $("#fileInput").click(); };
  $("#imageModeBtn").onclick = () => { closeDropdowns(); setImageMode(!imageMode); };
  $("#codeModeBtn").onclick = () => { closeDropdowns(); setCodeMode(!codeMode); };
  $("#fileInput").addEventListener("change", (e) => { handleFiles([...e.target.files]); e.target.value = ""; });

  document.addEventListener("click", closeDropdowns);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); newChat(); }
    if (e.key === "Escape") { closeDropdowns(); $("#settingsModal").classList.add("hidden"); }
  });

  // Suggestions
  $$(".suggest").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.mode === "image") setImageMode(true);
    else if (b.dataset.mode === "code") setCodeMode(true);
    send(b.dataset.prompt);
  }));

  // Drag & drop files onto the window
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) handleFiles([...e.dataTransfer.files]);
  });
  // Paste images
  $("#input").addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); handleFiles(files); }
  });

  // Share / export
  $("#shareBtn").onclick = async () => {
    const chat = currentChat();
    if (!chat || !chat.messages.length) { toast("Nothing to share yet"); return; }
    const text = chatToMarkdown(chat);
    if (navigator.share) { try { await navigator.share({ title: `FreeAI — ${chat.title}`, text }); return; } catch { /* cancelled */ } }
    navigator.clipboard?.writeText(text).then(() => toast("Chat copied — paste anywhere to share ✓"));
  };
  $("#exportBtn").onclick = () => {
    const chat = currentChat();
    if (!chat || !chat.messages.length) { toast("Nothing to download yet"); return; }
    download(`freeai-${chat.title.replace(/[^\w-]+/g, "_").slice(0, 50) || "chat"}.md`, chatToMarkdown(chat));
  };

  // Preview panel
  $("#previewCloseBtn").onclick = closePreview;
  $("#previewDownloadBtn").onclick = () => download("freeai-app.html", previewHtml, "text/html");
  $("#previewNewTabBtn").onclick = () => {
    const w = window.open("", "_blank");
    if (w) { w.document.write(previewHtml); w.document.close(); }
    else toast("Pop-up blocked — use Download instead");
  };

  // Mic (Web Speech API)
  $("#micBtn").onclick = toggleMic;

  // Settings
  $("#settingsBtn").onclick = openSettings;
  $("#settingsCloseBtn").onclick = closeSettings;
  $("#settingsCancelBtn").onclick = closeSettings;
  $("#settingsModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeSettings(); });
  $("#providerSelect").addEventListener("change", (e) => {
    $("#apiKeyInput").value = settings.keys[e.target.value] || "";
    refreshProviderUI();
  });
  $("#tempInput").addEventListener("input", (e) => { $("#tempValue").textContent = e.target.value; });
  $("#settingsSaveBtn").onclick = async () => {
    settings.provider = $("#providerSelect").value;
    settings.keys[settings.provider] = $("#apiKeyInput").value.trim();
    settings.customBase = $("#customBaseInput").value.trim();
    settings.customModel = $("#customModelInput").value.trim();
    if (settings.provider === "custom" && settings.customModel) settings.model = settings.customModel;
    settings.temperature = Number($("#tempInput").value);
    settings.systemPrompt = $("#systemPromptInput").value.trim() || DEFAULT_SYSTEM;
    settings.theme = $("#themeSelect").value;
    settings.supportUrl = $("#supportUrlInput").value.trim();
    saveSettings(); applyTheme(); applySupportButton();
    closeSettings();
    await loadModels(true);
  };
  $("#clearAllBtn").onclick = () => {
    if (!confirm("Delete ALL chats and settings stored on this device? This can't be undone.")) return;
    localStorage.removeItem(LS_CHATS); localStorage.removeItem(LS_SETTINGS);
    chats = []; currentChatId = null;
    closeSettings(); newChat(false); toast("Everything cleared");
  };

  window.addEventListener("resize", () => { if (window.innerWidth > 860) $("#sidebarBackdrop").classList.add("hidden"); });
}

function chatToMarkdown(chat) {
  const head = `# ${chat.title}\n\n_Exported from FreeAI — free forever, no limits, no ads_\n`;
  return head + chat.messages.map((m) => `\n---\n\n**${m.role === "user" ? "You" : "FreeAI"}:**\n\n${m.display ?? m.content}`).join("\n");
}

function openSettings() { fillSettingsForm(); $("#settingsModal").classList.remove("hidden"); }
function closeSettings() { $("#settingsModal").classList.add("hidden"); }

function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Voice typing needs Chrome/Edge"); return; }
  if (recognition) { recognition.stop(); return; }
  recognition = new SR();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = true;
  const btn = $("#micBtn");
  btn.classList.add("recording");
  recognition.onresult = (e) => {
    let final = "", interim = "";
    for (const r of e.results) (r.isFinal ? (final += r[0].transcript) : (interim += r[0].transcript));
    const inp = $("#input");
    if (final) { inp.value += (inp.value && !inp.value.endsWith(" ") ? " " : "") + final; }
    autoResize(); updateSendBtn();
  };
  recognition.onerror = () => toast("Microphone unavailable or permission denied");
  recognition.onend = () => { recognition = null; btn.classList.remove("recording"); };
  recognition.start();
  toast("🎤 Listening… speak now");
}

/* ═══════════════════ INIT ══════════════════════════════════ */
function init() {
  document.title = `${OWNER.appName || "FreeAI"} — Free AI Chat · No Limits · No Subscriptions · No Ads`;
  applyTheme();
  applySupportButton();
  bindEvents();
  setSidebar(window.innerWidth > 860);
  if (!chats.length) newChat(false);
  else { currentChatId = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)[0].id; renderSidebar(); renderMessages(); }
  renderModeChips();
  autoResize(); updateSendBtn();
  loadModels();
  $("#input").focus();
}
document.addEventListener("DOMContentLoaded", init);

/* Public API for Create Studio (studio.js) & Connect Apps (apps.js) */
window.FreeAI = { toast, openPreview, closePreview, download, send, setCodeMode, setImageMode, setSidebar, newChat };
