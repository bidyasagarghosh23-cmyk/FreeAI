/* ============================================================
   FreeAI Create Studio — make games, images, videos, movies,
   Minecraft Mods / datapacks / resource packs / shaders /
   modpacks, a web OS, software, a browser, your own AI & more.
   Everything is generated locally → real downloadable files.
   ============================================================ */
(() => {
  "use strict";
  const q = (s, el = document) => el.querySelector(s);
  const qa = (s, el = document) => [...el.querySelectorAll(s)];
  const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s, fb = "my_pack") => String(s || "").toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || fb;
  const val = (id, el = document) => q("#" + id, el)?.value?.trim() || "";
  const field = (label, inner) => `<label class="field"><span>${label}</span>${inner}</label>`;
  /* Chat-engine API (provided by app.js as window.FreeAI) */
  const FA = () => window.FreeAI || {};
  const toast = (m) => FA().toast?.(m);
  const openPreview = (html) => FA().openPreview?.(html);
  const download = (...a) => FA().download?.(...a);
  const send = (...a) => FA().send?.(...a);
  const setCodeMode = (on) => FA().setCodeMode?.(on);
  const setSidebar = (open) => FA().setSidebar?.(open);
  const txt = (id, ph, v = "") => `<input type="text" id="${id}" placeholder="${escH(ph)}" value="${escH(v)}">`;
  const sel = (id, opts) => `<select id="${id}">${opts.map((o) => `<option value="${escH(o[0])}">${escH(o[1])}</option>`).join("")}</select>`;
  const colorF = (id, v = "#10a37f") => `<input type="color" id="${id}" value="${v}" style="width:100%;height:42px;background:var(--bg);border:1px solid var(--border);border-radius:11px;padding:4px">`;

  function downloadBlob(filename, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  async function zipDownload(files, filename) {
    if (!window.JSZip) { toast("Zip library couldn't load (CDN offline) — check connection and retry"); throw new Error("JSZip missing"); }
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) zip.file(path, content);
    downloadBlob(filename, await zip.generateAsync({ type: "blob" }));
  }

  function askAI(prompt) {
    window.FreeAIShowView("chat");
    if (typeof setCodeMode === "function") setCodeMode(true);
    if (typeof send === "function") send(prompt);
  }
  const aiCustomBox = (id, label, makePrompt) => `
    <details class="help-box"><summary>✨ Or describe your own — the AI builds it for you</summary>
      <div class="search-row" style="margin-top:10px"><input type="text" id="${id}" placeholder="${escH(label)}">
      <button class="pill-btn primary" data-aicustom="${id}">Build with AI →</button></div>
    </details>`;
  function bindAiCustom(ws, makePrompt) {
    q("[data-aicustom]", ws)?.addEventListener("click", () => {
      const id = q("[data-aicustom]", ws).dataset.aicustom;
      const v = val(id, ws);
      if (!v) { toast("Describe what you want first"); return; }
      askAI(makePrompt(v));
    });
  }

  // Result bar for HTML creations: preview in-app, download, improve with AI
  function htmlResult(ws, html, filename, describe) {
    let bar = q(".result-bar", ws);
    if (!bar) { bar = document.createElement("div"); bar.className = "result-bar"; ws.appendChild(bar); }
    bar.innerHTML = `<span>✅ <b>Done!</b> It's running in the preview panel →</span>
      <button class="pill-btn primary" data-r="preview">▶ Preview again</button>
      <button class="pill-btn" data-r="dl">⬇ Download .html</button>
      <button class="pill-btn" data-r="ai">✨ Improve / change it with AI chat</button>`;
    q('[data-r="preview"]', bar).onclick = () => openPreview(html);
    q('[data-r="dl"]', bar).onclick = () => download(filename, html, "text/html");
    q('[data-r="ai"]', bar).onclick = () =>
      askAI(`Here is a ${describe} I made with FreeAI Create Studio. Improve it: make it more beautiful and add more features. Give me the complete updated code in one file.\n\n\`\`\`html\n${html.slice(0, 9000)}\n\`\`\``);
    openPreview(html);
    bar.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function successBar(ws, msg) {
    let bar = q(".result-bar", ws);
    if (!bar) { bar = document.createElement("div"); bar.className = "result-bar"; ws.appendChild(bar); }
    bar.innerHTML = `<span>${msg}</span>`;
    bar.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ════════════════ VIEW SWITCHING ════════════════ */
  window.FreeAIShowView = function (name) {
    q("#chatScroll").classList.toggle("hidden", name !== "chat");
    q("#composerWrap").classList.toggle("hidden", name !== "chat");
    q("#studioView").classList.toggle("hidden", name !== "studio");
    q("#appsView").classList.toggle("hidden", name !== "apps");
    q("#navChatBtn")?.classList.toggle("active", name === "chat");
    q("#navStudioBtn")?.classList.toggle("active", name === "studio");
    q("#navAppsBtn")?.classList.toggle("active", name === "apps");
    if (window.innerWidth <= 860 && typeof setSidebar === "function") setSidebar(false);
    if (name === "chat") q("#input")?.focus();
    try { history.replaceState(null, "", name === "chat" ? location.pathname + location.search : "#" + name); } catch { /* file:// */ }
  };

  /* ════════════════ STUDIO GRID ════════════════ */
  const MAKERS = [
    ["game", "🎮", "Game", "Snake, Flappy, Breakout, Memory instantly — or AI builds any game you describe"],
    ["image", "🖼️", "Images", "AI pictures in any style, up to 4 at once, free & unlimited"],
    ["video", "🎬", "Video", "Turn photos / AI images / text into a downloadable video (.webm)"],
    ["movie", "🍿", "Movie", "Type your story scene-by-scene → FreeAI paints it & films it"],
    ["mc-mod", "⛏️", "Minecraft Mod", "A real Fabric mod project (.zip) with your own custom item"],
    ["mc-datapack", "🧩", "Minecraft Datapack", "Custom recipes, starter kits & rules — no Mods needed, vanilla-friendly"],
    ["mc-resource", "🧱", "Resource Pack", "Rename items & paint your own 16×16 textures, exported as a pack"],
    ["mc-shader", "🌅", "Shader Pack", "Colour-grade styles (vibrant, sunset, night, horror) for Iris/OptiFine"],
    ["mc-modpack", "📦", "Modpack", "Search Modrinth, add Mods, export a real .mrpack for launchers"],
    ["os", "🖥️", "Operating System", "Your own web OS — desktop, draggable windows, taskbar, apps"],
    ["software", "💾", "Software / App", "To-do, calculator, notepad, focus timer, password generator…"],
    ["browser", "🌐", "Web Browser", "Your own browser shell with address bar & search"],
    ["ai", "🤖", "Your Own AI", "Name it, give it a personality, download your personal chatbot"],
    ["website", "🌍", "Website", "Landing page, portfolio, restaurant or shop site in one click"],
  ];

  function renderStudioGrid() {
    const g = q("#studioGrid");
    g.innerHTML = "";
    for (const [key, emoji, title, desc] of MAKERS) {
      const b = document.createElement("button");
      b.className = "make-card";
      b.innerHTML = `<span class="c-emoji">${emoji}</span><span class="c-title">${escH(title)}</span><span class="c-desc">${escH(desc)}</span>`;
      b.onclick = () => openMaker(key);
      g.appendChild(b);
    }
  }
  function openMaker(key) {
    const ws = q("#studioWorkspace");
    ws.classList.remove("hidden");
    (RENDERERS[key] || (() => {}))(ws);
    ws.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.FreeAIOpenMaker = (key) => { window.FreeAIShowView("studio"); openMaker(key); };

  /* ════════════════ GAMES ════════════════ */
  function rGame(ws) {
    ws.innerHTML = `<h2>🎮 Game Maker</h2><p class="ws-sub">Pick a game, customise it, play it instantly in the preview — then download it as one file you can share with anyone.</p>
    <div class="ws-grid">
      ${field("Game", sel("gType", [["snake", "🐍 Snake"], ["flappy", "🐦 Flappy Bird"], ["breakout", "🧱 Breakout"], ["memory", "🃏 Memory Match"]]))}
      ${field("Game title", txt("gTitle", "My Awesome Game"))}
      ${field("Theme colour", colorF("gColor", "#10a37f"))}
      ${field("Snake speed (Snake only)", sel("gSpeed", [["180", "🐢 Relaxed"], ["130", "🚶 Normal"], ["90", "🚀 Fast"]]))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="gGo">🎮 Make my game</button></div>
    ${aiCustomBox("gCustom", "e.g. a space shooter where I protect Earth from asteroids…", "")}`;
    q("#gGo", ws).onclick = () => {
      const type = val("gType", ws);
      const title = val("gTitle", ws) || ({ snake: "Snake", flappy: "Flappy Bird", breakout: "Breakout", memory: "Memory Match" })[type];
      const html = FreeAITemplates[type]({ title, accent: q("#gColor", ws).value, speed: +val("gSpeed", ws) });
      htmlResult(ws, html, slug(title, "game") + ".html", title + " game");
    };
    bindAiCustom(ws, (v) => `Build me a complete web game in ONE single HTML file (all CSS and JS inside). The game: ${v}. It must be fully playable with keyboard AND touch/mouse, have a score, a start/restart button and nice graphics. Write all the code for me — I'll run it with the Preview button.`);
  }

  /* ════════════════ IMAGES ════════════════ */
  function rImage(ws) {
    const STYLES = { none: "", photo: ", ultra realistic photograph, 4k, detailed", anime: ", anime style, studio ghibli inspired", digital: ", digital art, vibrant, trending on artstation", pixel: ", pixel art, 16-bit game style", "3d": ", 3d render, octane, soft lighting", sketch: ", pencil sketch, hand drawn", cinematic: ", cinematic film still, dramatic lighting" };
    ws.innerHTML = `<h2>🖼️ Image Studio</h2><p class="ws-sub">Describe anything. Free &amp; unlimited (Flux via Pollinations).</p>
    <div class="ws-grid">
      ${field("What should I draw?", txt("iPrompt", "a cute robot drinking tea in Kolkata, raining…"))}
      ${field("Style", sel("iStyle", Object.keys(STYLES).map((k) => [k, { none: "No style", photo: "📷 Realistic photo", anime: "🌸 Anime", digital: "🎨 Digital art", pixel: "👾 Pixel art", "3d": "🧊 3D render", sketch: "✏️ Pencil sketch", cinematic: "🎬 Cinematic" }[k]])))}
      ${field("Shape", sel("iSize", [["1024x1024", "Square 1:1"], ["1280x720", "Wide 16:9"], ["720x1280", "Tall 9:16 (phone/reels)"]]))}
      ${field("How many?", sel("iCount", [["1", "1 image"], ["2", "2 images"], ["4", "4 images"]]))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="iGo">🎨 Generate</button></div>
    <div class="gen-images" id="iOut"></div>`;
    q("#iGo", ws).onclick = () => {
      const p = val("iPrompt", ws);
      if (!p) { toast("Describe an image first"); return; }
      const [w, h] = val("iSize", ws).split("x");
      const full = p + (STYLES[val("iStyle", ws)] || "");
      const out = q("#iOut", ws);
      out.innerHTML = "";
      for (let i = 0; i < +val("iCount", ws); i++) {
        const seed = Math.floor(Math.random() * 1e9);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w}&height=${h}&seed=${seed}&model=flux&nologo=true`;
        const fig = document.createElement("figure");
        fig.innerHTML = `<img alt="${escH(p)}" src="${url}"><figcaption>
          <a class="mini-btn" href="${url}" target="_blank" rel="noopener">⬇ Full size</a>
          <button class="mini-btn">💬 Send to chat</button></figcaption>`;
        q("button", fig).onclick = () => { window.FreeAIShowView("chat"); if (typeof send === "function") send(`I made this image: "${p}" — ${url} — Give it a catchy title and a short caption I can post on social media.`); };
        out.appendChild(fig);
      }
      toast("Creating your images… they appear as they finish ✨");
    };
  }

  /* ════════════════ VIDEO + MOVIE ════════════════ */
  function wrapCanvasText(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = String(text).split(/\s+/);
    let line = "", lines = 0;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + lines * lineH); line = w; if (++lines >= maxLines) return; }
      else line = test;
    }
    if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineH);
  }
  function loadSlideImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => { const i2 = new Image(); i2.onload = () => resolve(i2); i2.onerror = () => resolve(null); i2.src = src; };
      img.src = src;
    });
  }

  function rVideoMovie(ws, movie) {
    let slides = []; // {img, src, caption, textOnly}
    ws.innerHTML = `<h2>${movie ? "🍿 Movie Maker" : "🎬 Video Maker"}</h2>
    <p class="ws-sub">${movie
      ? "Write your story one scene per line. FreeAI paints every scene, adds a title & credits, pans/zooms like a film, and records a real <b>.webm video</b> you can download and share (works in Chrome/Edge/Firefox)."
      : "Build a slideshow video from your photos, AI images or text slides — recorded right in your browser as a downloadable <b>.webm video</b>."}</p>
    ${movie ? `<div class="ws-grid">
        ${field("Movie title", txt("mTitle", "The Last Robot"))}
        ${field("Film style", sel("mGenre", [["cinematic film still, dramatic lighting", "🎬 Cinematic"], ["anime movie style", "🌸 Anime"], ["pixar 3d animation style", "🧊 3D Animation"], ["dark horror movie style", "👻 Horror"], ["epic fantasy movie style", "🐉 Fantasy"]]))}
      </div>
      ${field("Your story — one scene per line", `<textarea id="mScenes" rows="5" placeholder="A small robot wakes up alone in a ruined city\nIt finds a glowing flower growing through concrete\nRain begins to fall for the first time in years\nThe robot smiles at the rainbow">A small robot wakes up alone in a ruined city
It finds a glowing flower growing through concrete
Rain begins to fall for the first time in years
The robot smiles at the rainbow</textarea>`)}
      <div class="ws-actions"><button class="pill-btn primary" id="mGen">🎨 1 · Paint my scenes</button></div>`
    : `<div class="ws-grid">
        ${field("📷 Add your photos", `<input type="file" id="vFiles" accept="image/*" multiple>`)}
        ${field("🎨 …or generate an AI image slide", `<div class="search-row" style="margin:0"><input type="text" id="vAiPrompt" placeholder="sunset over mountains…"><button class="mini-btn" id="vAiAdd">Add slide</button></div>`)}
        ${field("📝 …or add a text slide", `<div class="search-row" style="margin:0"><input type="text" id="vText" placeholder="My Trip 2026 ✈️"><button class="mini-btn" id="vTextAdd">Add slide</button></div>`)}
      </div>`}
    <div class="slide-thumbs" id="vSlides"></div>
    <div class="ws-grid">
      ${field("Seconds per slide/scene", sel("vSecs", [["2", "2 sec"], ["3", "3 sec"], ["4", "4 sec"], ["5", "5 sec"]]))}
      ${field("Captions", sel("vCaps", [["1", "Show text on each slide"], ["0", "No captions"]]))}
    </div>
    <div class="video-stage"><canvas id="vCanvas" width="960" height="540"></canvas></div>
    <div class="ws-actions"><button class="pill-btn primary" id="vRecord">⏺ 2 · Record video</button></div>
    <div class="progress-line" id="vProg"></div>
    <div id="vOut"></div>`;

    const thumbs = () => {
      const box = q("#vSlides", ws);
      box.innerHTML = "";
      slides.forEach((s, i) => {
        const d = document.createElement("div");
        d.className = "slide-thumb";
        d.innerHTML = `${s.src ? `<img src="${s.src}" alt="">` : `<div class="txt-slide">${escH(s.caption)}</div>`}<button title="Remove">✕</button><div class="cap">${i + 1}. ${escH(s.caption || "")}</div>`;
        q("button", d).onclick = () => { slides.splice(i, 1); thumbs(); };
        box.appendChild(d);
      });
    };

    if (movie) {
      q("#mGen", ws).onclick = async () => {
        const title = val("mTitle", ws) || "My Movie";
        const scenes = q("#mScenes", ws).value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
        if (!scenes.length) { toast("Write at least one scene"); return; }
        const style = val("mGenre", ws);
        const prog = q("#vProg", ws);
        slides = [{ img: null, src: "", caption: "🎬 " + title, textOnly: true }];
        thumbs();
        for (let i = 0; i < scenes.length; i++) {
          prog.textContent = `🎨 Painting scene ${i + 1} of ${scenes.length}… (free AI images can take a few seconds each)`;
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scenes[i] + ", " + style)}?width=1280&height=720&seed=${Math.floor(Math.random() * 1e9)}&model=flux&nologo=true`;
          const img = await loadSlideImage(url);
          slides.push({ img, src: url, caption: scenes[i] });
          thumbs();
        }
        slides.push({ img: null, src: "", caption: "✨ THE END ✨\nMade with FreeAI Movie Maker", textOnly: true });
        thumbs();
        prog.textContent = "✅ Scenes ready! Press “⏺ Record video” below.";
      };
    } else {
      q("#vFiles", ws).addEventListener("change", async (e) => {
        for (const f of [...e.target.files]) {
          const src = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
          slides.push({ img: await loadSlideImage(src), src, caption: f.name.replace(/\.[^.]+$/, "") });
        }
        thumbs();
      });
      q("#vAiAdd", ws).onclick = async () => {
        const p = val("vAiPrompt", ws); if (!p) return;
        q("#vProg", ws).textContent = "🎨 Generating slide image…";
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1280&height=720&seed=${Math.floor(Math.random() * 1e9)}&model=flux&nologo=true`;
        slides.push({ img: await loadSlideImage(url), src: url, caption: p });
        thumbs(); q("#vProg", ws).textContent = "";
      };
      q("#vTextAdd", ws).onclick = () => {
        const t = val("vText", ws); if (!t) return;
        slides.push({ img: null, src: "", caption: t, textOnly: true });
        thumbs(); q("#vText", ws).value = "";
      };
    }

    q("#vRecord", ws).onclick = async () => {
      if (!slides.length) { toast(movie ? "Paint your scenes first" : "Add at least one slide first"); return; }
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { toast("This browser can't record canvas video — try Chrome/Edge/Firefox"); return; }
      const canvas = q("#vCanvas", ws), ctx = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height, secs = +val("vSecs", ws) || 3, caps = val("vCaps", ws) === "1";
      const prog = q("#vProg", ws), out = q("#vOut", ws);

      // CORS taint check: if an image taints the canvas, recording is blocked → fall back to styled text scenes.
      let imagesBlocked = false;
      const firstImg = slides.find((s) => s.img);
      if (firstImg) {
        ctx.drawImage(firstImg.img, 0, 0, 8, 8);
        try { canvas.toDataURL(); } catch { imagesBlocked = true; }
        ctx.clearRect(0, 0, W, H);
      }
      if (imagesBlocked) prog.textContent = "⚠️ This browser blocked the AI images inside video (CORS) — using styled text scenes instead. Uploaded photos always work.";

      function drawSlide(s, p, idx) {
        // background
        const grad = ctx.createLinearGradient(0, 0, W, H);
        const hues = [[ "#0f2027", "#2c5364" ], [ "#41295a", "#2F0743" ], [ "#134e5e", "#71b280" ], [ "#3a1c71", "#d76d77" ]];
        const [c1, c2] = hues[idx % hues.length];
        grad.addColorStop(0, c1); grad.addColorStop(1, c2);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        if (s.img && !imagesBlocked) {
          const iw = s.img.naturalWidth || 1280, ih = s.img.naturalHeight || 720;
          const zoom = movie ? 1.02 + p * 0.10 : 1.0;
          const scale = Math.max(W / iw, H / ih) * zoom;
          const dw = iw * scale, dh = ih * scale;
          const panX = movie ? (p - 0.5) * 26 * (idx % 2 ? -1 : 1) : 0;
          ctx.drawImage(s.img, (W - dw) / 2 + panX, (H - dh) / 2, dw, dh);
        }
        ctx.textAlign = "center";
        if (s.textOnly || !s.img || imagesBlocked) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "700 44px system-ui, sans-serif";
          const lines = String(s.caption || "").split("\n");
          lines.forEach((ln, i) => wrapCanvasText(ctx, ln, W / 2, H / 2 - (lines.length - 1) * 28 + i * 56, W - 130, 52, 3));
        } else if (caps && s.caption) {
          ctx.fillStyle = "rgba(0,0,0,.55)";
          ctx.fillRect(0, H - 86, W, 86);
          ctx.fillStyle = "#fff";
          ctx.font = "600 25px system-ui, sans-serif";
          wrapCanvasText(ctx, s.caption, W / 2, H - 48, W - 110, 32, 2);
        }
        ctx.textAlign = "left";
      }

      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const rec = new MediaRecorder(canvas.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onStop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        out.innerHTML = `<div class="result-bar"><span>🎉 <b>Your ${movie ? "movie" : "video"} is ready!</b></span>
          <a class="pill-btn primary" href="${url}" download="freeai-${movie ? "movie" : "video"}.webm">⬇ Download .webm (${(blob.size / 1048576).toFixed(1)} MB)</a></div>
          <video class="media-frame" src="${url}" controls playsinline></video>
          <p class="kv-note">Tip: .webm plays in Chrome/Android/WhatsApp. To convert to MP4 free, search “webm to mp4 converter” — or ask in chat.</p>`;
        prog.textContent = "";
        q("#vRecord", ws).disabled = false;
        out.scrollIntoView({ behavior: "smooth" });
      };
      q("#vRecord", ws).disabled = true;
      rec.start(250);
      const total = slides.length * secs;
      const t0 = performance.now();
      (function frame(now) {
        const t = (now - t0) / 1000;
        if (t >= total) { rec.stop(); return; }
        const idx = Math.min(slides.length - 1, Math.floor(t / secs));
        drawSlide(slides[idx], (t - idx * secs) / secs, idx);
        prog.textContent = `⏺ Recording… slide ${idx + 1}/${slides.length} · ${Math.round((t / total) * 100)}% — please keep this tab open`;
        requestAnimationFrame(frame);
      })(t0);
    };
  }

  /* ════════════════ MINECRAFT ════════════════ */
  const MCV = [["1.21.1", 48, 34], ["1.21", 48, 34], ["1.20.6", 41, 32], ["1.20.4", 26, 22], ["1.20.1", 15, 15]];
  const mcVersionSel = (id) => `<select id="${id}">${MCV.map((v) => `<option value="${v[0]}">Minecraft ${v[0]}</option>`).join("")}</select>`;
  const mcFormats = (v) => { const f = MCV.find((x) => x[0] === v) || MCV[0]; return { data: f[1], res: f[2], is121: v.startsWith("1.21") }; };
  const MC_ITEMS = ["diamond_sword", "netherite_sword", "diamond_pickaxe", "diamond_chestplate", "bow", "shield", "totem_of_undying", "enchanted_golden_apple", "elytra", "trident", "diamond", "netherite_ingot", "stick", "apple"];

  function rMcDatapack(ws) {
    ws.innerHTML = `<h2>🧩 Datapack Maker</h2><p class="ws-sub">Datapacks work on <b>vanilla Minecraft Java</b> (no Mods, no Forge/Fabric). Download the .zip → put it in your world's <code>datapacks</code> folder → <code>/reload</code>.</p>
    <div class="ws-grid">
      ${field("Pack name", txt("dName", "My Awesome Pack"))}
      ${field("Pack description", txt("dDesc", "Made with FreeAI"))}
      ${field("Minecraft version", mcVersionSel("dVer"))}
      ${field("Custom recipe result item", txt("dItem", "minecraft:enchanted_golden_apple", "minecraft:enchanted_golden_apple"))}
    </div>
    <label class="check-row"><input type="checkbox" id="dWelcome" checked><span>👋 Welcome message<small>Shows a message when the world loads / reloads</small></span></label>
    <label class="check-row"><input type="checkbox" id="dKeep" checked><span>🎒 Keep inventory on death<small>Sets the keepInventory gamerule automatically</small></span></label>
    <label class="check-row"><input type="checkbox" id="dKit" checked><span>🎁 Starter kit command<small>Run <code>/function &lt;namespace&gt;:kit</code> to get gear (needs OP/cheats)</small></span></label>
    <label class="check-row"><input type="checkbox" id="dRecipe" checked><span>🍏 Gold-apple style custom recipe<small>8 gold ingots around an apple → your chosen item</small></span></label>
    <div class="ws-actions"><button class="pill-btn primary" id="dGo">📦 Download datapack (.zip)</button></div>
    ${aiCustomBox("dCustom", "e.g. a datapack that makes creepers drop diamonds…", "")}`;
    q("#dGo", ws).onclick = async () => {
      const name = val("dName", ws) || "My Awesome Pack";
      const ns = slug(name);
      const ver = val("dVer", ws);
      const { data, is121 } = mcFormats(ver);
      const fnDir = is121 ? "function" : "functions", rcDir = is121 ? "recipe" : "recipes";
      const load = [];
      if (q("#dWelcome", ws).checked) load.push(`tellraw @a {"text":"✨ ${name.replace(/"/g, "")} loaded — have fun!","color":"gold","bold":true}`);
      if (q("#dKeep", ws).checked) load.push("gamerule keepInventory true");
      if (!load.length) load.push("# " + name + " loaded");
      const files = {
        "pack.mcmeta": JSON.stringify({ pack: { pack_format: data, description: val("dDesc", ws) || name } }, null, 2),
        [`data/${ns}/${fnDir}/load.mcfunction`]: load.join("\n") + "\n",
        [`data/minecraft/tags/${fnDir}/load.json`]: JSON.stringify({ values: [`${ns}:load`] }, null, 2),
        "README.txt": `${name} — datapack for Minecraft Java ${ver}\n\nHOW TO INSTALL:\n1) Open Minecraft > Singleplayer > select your world > Edit > Open World Folder\n2) Copy this .zip into the "datapacks" folder (do NOT unzip it)\n3) Join the world and type /reload\n${q("#dKit", ws).checked ? `4) Get your starter gear any time with: /function ${ns}:kit\n` : ""}\nMade free with FreeAI Create Studio.`,
      };
      if (q("#dKit", ws).checked) files[`data/${ns}/${fnDir}/kit.mcfunction`] = "give @s minecraft:iron_sword 1\ngive @s minecraft:iron_pickaxe 1\ngive @s minecraft:cooked_beef 16\ngive @s minecraft:torch 32\ngive @s minecraft:oak_planks 64\ntellraw @s {\"text\":\"🎁 Starter kit delivered!\",\"color\":\"green\"}\n";
      if (q("#dRecipe", ws).checked) {
        const item = (val("dItem", ws) || "minecraft:enchanted_golden_apple").replace(/\s/g, "");
        files[`data/${ns}/${rcDir}/golden_craft.json`] = JSON.stringify({
          type: "minecraft:crafting_shaped", pattern: ["GGG", "GAG", "GGG"],
          key: { G: { item: "minecraft:gold_ingot" }, A: { item: "minecraft:apple" } },
          result: is121 ? { id: item, count: 1 } : { item, count: 1 },
        }, null, 2);
      }
      await zipDownload(files, ns + "-datapack.zip");
      successBar(ws, `✅ <b>${escH(name)}</b> datapack downloaded! Put it in your world's <code>datapacks</code> folder, then type <code>/reload</code> in game. (Full steps inside README.txt)`);
    };
    bindAiCustom(ws, (v) => `Create a Minecraft Java 1.21 datapack for me that does this: ${v}. Give me every file with its full path and complete contents (pack.mcmeta, .mcfunction files, JSON files), ready to copy into a zip. No placeholders.`);
  }

  function rMcResource(ws) {
    let painted = false;
    ws.innerHTML = `<h2>🧱 Resource Pack Maker</h2><p class="ws-sub">Rename an item and/or give it your own texture — paint it pixel-by-pixel below (16×16, just like real Minecraft items) or upload a PNG. Install: Options → Resource Packs → Open Pack Folder → drop the .zip in.</p>
    <div class="ws-grid">
      ${field("Pack name", txt("rName", "My Resource Pack"))}
      ${field("Minecraft version", mcVersionSel("rVer"))}
      ${field("Item to customise", sel("rItem", MC_ITEMS.map((i) => [i, "minecraft:" + i])))}
      ${field("New display name (optional)", txt("rNewName", "⚔️ Dragon Slayer 3000"))}
    </div>
    <h3>🎨 Paint the item texture</h3>
    <canvas id="pixelCanvas" width="16" height="16"></canvas>
    <div class="ws-actions">
      <label class="field" style="margin:0"><span>Colour</span><input type="color" id="pxColor" value="#22d3ee" style="width:90px;height:38px;background:var(--bg);border:1px solid var(--border);border-radius:10px"></label>
      <button class="pill-btn" id="pxEraser">🧽 Eraser</button>
      <button class="pill-btn" id="pxFill">🪣 Fill all</button>
      <button class="pill-btn" id="pxClear">🗑 Clear</button>
    </div>
    ${field("…or upload a texture PNG instead (overrides painting)", `<input type="file" id="rPng" accept="image/png">`)}
    <div class="ws-actions"><button class="pill-btn primary" id="rGo">📦 Download resource pack (.zip)</button></div>`;
    const cv = q("#pixelCanvas", ws), ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let drawing = false, erasing = false;
    const paint = (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * 16), y = Math.floor(((e.clientY - r.top) / r.height) * 16);
      if (x < 0 || y < 0 || x > 15 || y > 15) return;
      if (erasing) ctx.clearRect(x, y, 1, 1); else { ctx.fillStyle = q("#pxColor", ws).value; ctx.fillRect(x, y, 1, 1); }
      painted = true;
    };
    cv.addEventListener("pointerdown", (e) => { drawing = true; paint(e); });
    cv.addEventListener("pointermove", (e) => drawing && paint(e));
    addEventListener("pointerup", () => (drawing = false));
    q("#pxEraser", ws).onclick = () => { erasing = !erasing; toast(erasing ? "Eraser ON 🧽" : "Eraser OFF 🖌️"); };
    q("#pxFill", ws).onclick = () => { ctx.fillStyle = q("#pxColor", ws).value; ctx.fillRect(0, 0, 16, 16); painted = true; };
    q("#pxClear", ws).onclick = () => { ctx.clearRect(0, 0, 16, 16); painted = false; };
    q("#rGo", ws).onclick = async () => {
      const item = val("rItem", ws);
      const { res } = mcFormats(val("rVer", ws));
      const files = { "pack.mcmeta": JSON.stringify({ pack: { pack_format: res, description: (val("rName", ws) || "My Resource Pack") + " · Made with FreeAI" } }, null, 2) };
      const newName = val("rNewName", ws);
      if (newName) files["assets/minecraft/lang/en_us.json"] = JSON.stringify({ [`item.minecraft.${item}`]: newName }, null, 2);
      const up = q("#rPng", ws).files[0];
      if (up) files[`assets/minecraft/textures/item/${item}.png`] = await up.arrayBuffer();
      else if (painted) files[`assets/minecraft/textures/item/${item}.png`] = await new Promise((r) => cv.toBlob((b) => b.arrayBuffer().then(r), "image/png"));
      if (!newName && !up && !painted) { toast("Paint/upload a texture or enter a new name first"); return; }
      files["README.txt"] = `${val("rName", ws) || "My Resource Pack"} — Minecraft Java ${val("rVer", ws)}\n\nINSTALL: Minecraft > Options > Resource Packs > Open Pack Folder > copy this .zip in > move it to "Selected".\nRenames minecraft:${item}${newName ? ` to "${newName}"` : ""}${up || painted ? " and replaces its texture." : "."}\nMade free with FreeAI.`;
      await zipDownload(files, slug(val("rName", ws), "resource_pack") + ".zip");
      successBar(ws, `✅ Resource pack downloaded! In Minecraft: <b>Options → Resource Packs → Open Pack Folder</b>, drop the .zip in, then select it. Your <code>${escH(item)}</code> is now customised 🎉`);
    };
  }

  function rMcShader(ws) {
    ws.innerHTML = `<h2>🌅 Shader Pack Maker</h2><p class="ws-sub">Generates a colour-grading shader pack (works with <b>Iris</b> or <b>OptiFine</b>). Install: put the .zip in your <code>shaderpacks</code> folder → Options → Video Settings → Shaders.</p>
    <div class="ws-grid">
      ${field("Pack name", txt("sName", "FreeAI Vibrant"))}
      ${field("Style", sel("sStyle", [["vibrant", "🌈 Vibrant & colourful"], ["warm", "🌇 Warm sunset"], ["cool", "🌙 Cool night"], ["horror", "👻 Horror (dark + desaturated)"], ["retro", "📺 Retro warm film"]]))}
      ${field("Intensity", `<input type="range" id="sInt" min="10" max="100" value="60">`)}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="sGo">📦 Download shader pack (.zip)</button></div>
    <p class="kv-note">ℹ️ Honest note: this is a real, working colour-grade shader (saturation/tint/brightness (+ vignette for Horror)) written in GLSL — it's a great starter pack. Movie-level packs (ray-traced shadows, waving water) are thousands of lines; for those, download a famous pack free from the Modrinth section in 🔌 Connect Apps, or ask the AI chat to extend this one.</p>
    ${aiCustomBox("sCustom", "e.g. add waving leaves and brighter water to my shader…", "")}`;
    q("#sGo", ws).onclick = async () => {
      const style = val("sStyle", ws), k = (+val("sInt", ws) || 60) / 100;
      const P = {
        vibrant: { sat: 0.45 * k, tint: [1.03, 1.01, 1.0], bright: 0.03 * k, vig: 0 },
        warm: { sat: 0.2 * k, tint: [1 + 0.14 * k, 1.0, 1 - 0.16 * k], bright: 0.02 * k, vig: 0.12 * k },
        cool: { sat: 0.08 * k, tint: [1 - 0.1 * k, 1.0, 1 + 0.16 * k], bright: -0.02 * k, vig: 0.15 * k },
        horror: { sat: -0.6 * k, tint: [0.96, 1.0, 0.94], bright: -0.09 * k, vig: 0.45 * k },
        retro: { sat: 0.25 * k, tint: [1 + 0.09 * k, 1 + 0.03 * k, 1 - 0.1 * k], bright: 0.05 * k, vig: 0.2 * k },
      }[style];
      const f = (n) => n.toFixed(3);
      const finalFsh =
`#version 120
/* ${val("sName", ws) || "FreeAI Shader"} — colour grade by FreeAI Create Studio */
uniform sampler2D colortex0;
uniform float viewWidth;
uniform float viewHeight;
varying vec2 texcoord;
void main() {
    vec3 color = texture2D(colortex0, texcoord).rgb;
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, 1.0 + ${f(P.sat)});            /* saturation */
    color *= vec3(${f(P.tint[0])}, ${f(P.tint[1])}, ${f(P.tint[2])}); /* tint */
    color += ${f(P.bright)};                                        /* brightness */
    ${P.vig > 0 ? `float dist = distance(texcoord, vec2(0.5));\n    color *= smoothstep(0.95, ${f(0.95 - P.vig)}, dist); /* vignette */` : "/* no vignette in this style */"}
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
      const finalVsh =
`#version 120
varying vec2 texcoord;
void main() {
    gl_Position = ftransform();
    texcoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).xy;
}
`;
      const files = {
        "shaders/final.fsh": finalFsh,
        "shaders/final.vsh": finalVsh,
        "shaders/shaders.properties": "# " + (val("sName", ws) || "FreeAI Shader") + "\n",
        "README.txt": `${val("sName", ws) || "FreeAI Shader"} — shader pack for Minecraft Java (Iris or OptiFine)\n\nINSTALL:\n1) Put this .zip in your .minecraft/shaderpacks folder (do not unzip)\n2) Minecraft > Options > Video Settings > Shaders (OptiFine) or Iris shader settings > select the pack\n\nStyle: ${style}, intensity ${Math.round(k * 100)}%.\nMade free with FreeAI Create Studio.`,
      };
      await zipDownload(files, slug(val("sName", ws), "shader_pack") + ".zip");
      successBar(ws, `✅ Shader pack downloaded! Drop it in your <code>shaderpacks</code> folder and select it in Iris/OptiFine.`);
    };
    bindAiCustom(ws, (v) => `Here is a basic Minecraft Iris/OptiFine colour-grade shader pack (final.fsh/final.vsh, GLSL 120). Improve/extend it: ${v}. Give me the complete updated shader files with paths, no placeholders.`);
  }

  function rMcMod(ws) {
    ws.innerHTML = `<h2>⛏️ Minecraft Mod Maker (Fabric)</h2><p class="ws-sub">Generates a <b>real Fabric mod project</b> with your own custom item registered in Java. You'll get a .zip project — open it, run <code>gradlew build</code> (needs free JDK 21), and your mod .jar appears in <code>build/libs</code>. The README inside explains every step.</p>
    <div class="ws-grid">
      ${field("Mod name", txt("mmName", "Dragon Tools"))}
      ${field("Your name (author)", txt("mmAuthor", "YourName"))}
      ${field("Custom item name", txt("mmItem", "Dragon Gem"))}
      ${field("Minecraft version", sel("mmVer", [["1.21.1", "1.21.1"], ["1.21", "1.21"]]))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="mmGo">📦 Download mod project (.zip)</button></div>
    <p class="kv-note">Want a mod <i>without any building</i>? Use the 🧩 Datapack Maker — same folder-drop simplicity, works on vanilla. Or browse 1000s of ready mods in 🔌 Connect Apps → Modrinth.</p>
    ${aiCustomBox("mmCustom", "e.g. a Fabric mod where my gem gives speed when held…", "")}`;
    q("#mmGo", ws).onclick = async () => {
      const name = val("mmName", ws) || "My Mod";
      const modid = slug(name, "mymod");
      const itemName = val("mmItem", ws) || "Magic Gem";
      const itemId = slug(itemName, "magic_gem");
      const author = val("mmAuthor", ws) || "FreeAI User";
      const mc = val("mmVer", ws);
      const cls = modid.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("") + "Mod";
      const pkg = `com.freeai.${modid}`;
      const constName = itemId.toUpperCase();
      const java =
`package ${pkg};

import net.fabricmc.api.ModInitializer;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// ${name} — made with FreeAI Create Studio
public class ${cls} implements ModInitializer {
    public static final String MOD_ID = "${modid}";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    // Your custom item: ${itemName}
    public static final Item ${constName} = new Item(new Item.Settings());

    @Override
    public void onInitialize() {
        Registry.register(Registries.ITEM, Identifier.of(MOD_ID, "${itemId}"), ${constName});
        LOGGER.info("${name} loaded — give yourself the item with: /give @s ${modid}:${itemId}");
    }
}
`;
      const files = {
        "build.gradle":
`plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}
version = project.mod_version
group = project.maven_group
base { archivesName = project.archives_base_name }
repositories { }
dependencies {
    minecraft "com.mojang:minecraft:\${project.minecraft_version}"
    mappings "net.fabricmc:yarn:\${project.yarn_mappings}:v2"
    modImplementation "net.fabricmc:fabric-loader:\${project.loader_version}"
    modImplementation "net.fabricmc.fabric-api:fabric-api:\${project.fabric_version}"
}
processResources {
    inputs.property "version", project.version
    filesMatching("fabric.mod.json") { expand "version": project.version }
}
tasks.withType(JavaCompile).configureEach { it.options.release = 21 }
java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
`,
        "settings.gradle": "pluginManagement {\n    repositories {\n        maven { name = 'Fabric'; url = 'https://maven.fabricmc.net/' }\n        gradlePluginPortal()\n    }\n}\n",
        "gradle.properties":
`org.gradle.jvmargs=-Xmx1G
org.gradle.parallel=true
minecraft_version=${mc}
yarn_mappings=${mc}+build.3
loader_version=0.16.3
fabric_version=0.102.0+${mc}
mod_version=1.0.0
maven_group=${pkg}
archives_base_name=${modid}
`,
        [`src/main/java/${pkg.replace(/\./g, "/")}/${cls}.java`]: java,
        "src/main/resources/fabric.mod.json": JSON.stringify({
          schemaVersion: 1, id: modid, version: "${version}", name,
          description: `Adds the ${itemName} item. Made free with FreeAI Create Studio.`,
          authors: [author], contact: {}, license: "MIT", environment: "*",
          entrypoints: { main: [`${pkg}.${cls}`] },
          depends: { fabricloader: ">=0.16", minecraft: `~${mc}`, java: ">=21", "fabric-api": "*" },
        }, null, 2),
        [`src/main/resources/assets/${modid}/lang/en_us.json`]: JSON.stringify({ [`item.${modid}.${itemId}`]: itemName }, null, 2),
        [`src/main/resources/assets/${modid}/models/item/${itemId}.json`]: JSON.stringify({ parent: "minecraft:item/generated", textures: { layer0: `${modid}:item/${itemId}` } }, null, 2),
        "README-FIRST.txt":
`${name} — Fabric mod project for Minecraft ${mc}
Adds item: ${itemName}  (${modid}:${itemId})

BUILD YOUR .JAR (one-time, free):
1) Install JDK 21 (free, e.g. adoptium.net) 
2) This project needs the Gradle wrapper files. Easiest free way:
   go to fabricmc.net/develop/template → generate a template with the
   same Minecraft version → copy these from it into this folder:
   gradlew, gradlew.bat, and the "gradle" folder.
   (or paste this project's files into that template)
3) Open a terminal in this folder and run:  gradlew build   (Windows)
                                             ./gradlew build (Mac/Linux)
4) Your mod is at build/libs/${modid}-1.0.0.jar — drop it in .minecraft/Mods
   (Fabric Loader + Fabric API required in the launcher)

TEXTURE: the item model expects a 16x16 PNG at
src/main/resources/assets/${modid}/textures/item/${itemId}.png
Paint one free in FreeAI Create Studio → Resource Pack Maker, or any image editor.

GET THE ITEM IN GAME: /give @s ${modid}:${itemId}

Made free with FreeAI Create Studio — ask the FreeAI chat to add powers,
recipes, blocks and more to ${cls}.java!`,
      };
      await zipDownload(files, modid + "-fabric-mod-project.zip");
      successBar(ws, `✅ <b>${escH(name)}</b> mod project downloaded! Unzip it and read <b>README-FIRST.txt</b> — it walks you to a finished .jar. Your item: <code>/give @s ${modid}:${itemId}</code>`);
    };
    bindAiCustom(ws, (v) => `Write a complete Minecraft Fabric mod (Java, Minecraft 1.21.1) that does this: ${v}. Give me every file with full path and complete contents (Java classes, fabric.mod.json, lang/model JSON). No placeholders — ready to build with gradlew build.`);
  }

  /* ── Modpack builder (Modrinth) ── */
  const LS_PACK = "freeai.modpack.v1";
  const loadPack = () => { try { return JSON.parse(localStorage.getItem(LS_PACK)) || []; } catch { return []; } };
  const savePack = (p) => localStorage.setItem(LS_PACK, JSON.stringify(p));
  addEventListener("freeai:addToModpack", (e) => {
    const d = e.detail || {};
    const pack = loadPack();
    if (pack.some((x) => x.id === d.id)) { toast("Already in your modpack"); return; }
    pack.push({ id: d.id, title: d.title || d.id, icon: d.icon || "", slug: d.slug || "" });
    savePack(pack);
    toast(`➕ “${d.title || d.id}” added to your modpack (Studio → Modpack)`);
    q("#mpList") && renderPackList(document);
  });
  function renderPackList(root) {
    const box = q("#mpList", root);
    if (!box) return;
    const pack = loadPack();
    box.innerHTML = pack.length ? "" : `<p class="kv-note">Your pack is empty — search Mods above and press “＋ Add”, or add them from 🔌 Connect Apps → Modrinth.</p>`;
    pack.forEach((p, i) => {
      const d = document.createElement("div");
      d.className = "pack-item";
      d.innerHTML = `${p.icon ? `<img src="${escH(p.icon)}" alt="">` : "📦"}<div class="p-meta"><b>${escH(p.title)}</b><small>modrinth.com/mod/${escH(p.slug || p.id)}</small></div><button class="mini-btn">✕ Remove</button>`;
      q("button", d).onclick = () => { const arr = loadPack(); arr.splice(i, 1); savePack(arr); renderPackList(root); };
      box.appendChild(d);
    });
  }
  async function modrinthSearch(query, type, limit = 18) {
    const facets = encodeURIComponent(JSON.stringify([["project_type:" + type]]));
    const r = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${facets}&limit=${limit}&index=downloads`);
    if (!r.ok) throw new Error("Modrinth API: HTTP " + r.status);
    return (await r.json()).hits || [];
  }
  window.FreeAIModrinthSearch = modrinthSearch;

  function rMcModpack(ws) {
    ws.innerHTML = `<h2>📦 Modpack Builder</h2><p class="ws-sub">Search real Mods on Modrinth, add them, then export a <b>.mrpack</b> file — import it in the Modrinth App / Prism Launcher / ATLauncher and it downloads everything for you.</p>
    <div class="search-row"><input type="search" id="mpQ" placeholder="Search Mods… e.g. sodium, appleskin, waystones"><button class="pill-btn primary" id="mpSearch">Search</button></div>
    <div class="results-grid" id="mpResults"></div>
    <h3>🧺 Your pack</h3><div id="mpList"></div>
    <div class="ws-grid">
      ${field("Pack name", txt("mpName", "My Dream Modpack"))}
      ${field("Pack version", txt("mpVer", "1.0.0", "1.0.0"))}
      ${field("Minecraft version", mcVersionSel("mpMc"))}
      ${field("Mod loader", sel("mpLoader", [["fabric", "Fabric"], ["forge", "Forge"], ["neoforge", "NeoForge"], ["quilt", "Quilt"]]))}
    </div>
    <div class="ws-actions">
      <button class="pill-btn primary" id="mpExport">📦 Export .mrpack</button>
      <button class="pill-btn" id="mpListDl">📄 Download mod list (.txt)</button>
      <button class="pill-btn" id="mpClear">🗑 Empty pack</button>
    </div>
    <div class="progress-line" id="mpProg"></div>`;
    renderPackList(ws);
    const doSearch = async () => {
      const box = q("#mpResults", ws);
      box.innerHTML = `<p class="kv-note">Searching Modrinth…</p>`;
      try {
        const hits = await modrinthSearch(val("mpQ", ws) || "sodium", "mod");
        box.innerHTML = "";
        for (const h of hits) {
          const c = document.createElement("div");
          c.className = "result-card";
          c.innerHTML = `${h.icon_url ? `<img class="icon" src="${escH(h.icon_url)}" alt="">` : ""}<div class="r-title">${escH(h.title)}</div>
            <div class="r-meta">by ${escH(h.author)} · ⬇ ${(h.downloads || 0).toLocaleString()}<br>${escH((h.description || "").slice(0, 110))}</div>
            <div class="r-btns"><button class="mini-btn" data-add>＋ Add to pack</button><a class="mini-btn" href="https://modrinth.com/mod/${escH(h.slug)}" target="_blank" rel="noopener">View ↗</a></div>`;
          q("[data-add]", c).onclick = () => dispatchEvent(new CustomEvent("freeai:addToModpack", { detail: { id: h.project_id, title: h.title, icon: h.icon_url, slug: h.slug } }));
          box.appendChild(c);
        }
        if (!hits.length) box.innerHTML = `<p class="kv-note">No Mods found — try another search.</p>`;
      } catch (err) { box.innerHTML = `<p class="kv-note">⚠️ ${escH(err.message)} — check connection. You can also browse at modrinth.com/Mods</p>`; }
    };
    q("#mpSearch", ws).onclick = doSearch;
    q("#mpQ", ws).addEventListener("keydown", (e) => e.key === "Enter" && doSearch());
    doSearch();
    q("#mpClear", ws).onclick = () => { savePack([]); renderPackList(ws); };
    q("#mpListDl", ws).onclick = () => {
      const pack = loadPack();
      download((slug(val("mpName", ws), "modpack")) + "-modlist.txt", (val("mpName", ws) || "My Modpack") + "\n" + pack.map((p, i) => `${i + 1}. ${p.title} — https://modrinth.com/mod/${p.slug || p.id}`).join("\n") + "\n\nMade with FreeAI Modpack Builder");
    };
    q("#mpExport", ws).onclick = async () => {
      const pack = loadPack();
      if (!pack.length) { toast("Add at least one mod first"); return; }
      const mc = val("mpMc", ws), loader = val("mpLoader", ws), prog = q("#mpProg", ws);
      const files = [], skipped = [];
      for (let i = 0; i < pack.length; i++) {
        const p = pack[i];
        prog.textContent = `📥 Resolving ${i + 1}/${pack.length}: ${p.title}…`;
        try {
          const r = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(p.id)}/version`);
          const versions = await r.json();
          const v = versions.find((x) => x.game_versions?.includes(mc) && x.loaders?.includes(loader)) || versions[0];
          const file = v?.files?.find((f) => f.primary) || v?.files?.[0];
          if (!file) { skipped.push(p.title); continue; }
          files.push({
            path: "Mods/" + file.filename,
            hashes: { sha1: file.hashes.sha1, sha512: file.hashes.sha512 },
            env: { client: "required", server: "required" },
            downloads: [file.url],
            fileSize: file.size,
          });
        } catch { skipped.push(p.title); }
      }
      const loaderDeps = { fabric: { "fabric-loader": "0.16.3" }, forge: { forge: "47.2.0" }, neoforge: { neoforge: "21.1.0" }, quilt: { "quilt-loader": "0.27.0" } }[loader] || {};
      const index = {
        game: "minecraft", formatVersion: 1,
        versionId: val("mpVer", ws) || "1.0.0",
        name: val("mpName", ws) || "My Modpack",
        summary: "Made free with FreeAI Modpack Builder. If the launcher complains about the loader version, pick the latest " + loader + " for Minecraft " + mc + " in the launcher — your Mods stay the same.",
        files, dependencies: { minecraft: mc, ...loaderDeps },
      };
      if (!window.JSZip) { toast("Zip library offline — retry"); return; }
      const zip = new JSZip();
      zip.file("modrinth.index.json", JSON.stringify(index, null, 2));
      downloadBlob(slug(val("mpName", ws), "modpack") + ".mrpack", await zip.generateAsync({ type: "blob" }));
      prog.textContent = "";
      successBar(ws, `✅ <b>.mrpack exported</b> with ${files.length} mod(s)${skipped.length ? ` — skipped (no matching file found): ${escH(skipped.join(", "))}` : ""}. Open it with the <b>Modrinth App</b> or <b>Prism Launcher</b> (Add Instance → Import) and everything downloads automatically.`);
    };
  }

  /* ════════════════ OS / SOFTWARE / BROWSER / AI / WEBSITE ════════════════ */
  function rOS(ws) {
    ws.innerHTML = `<h2>🖥️ Web OS Maker</h2><p class="ws-sub">Your own pocket operating system in one HTML file: desktop icons, draggable windows, taskbar + live clock, Notepad (auto-save), Calculator and Paint. Honest note: this is a <b>web OS</b> that runs in any browser — a bootable Windows/Linux-style OS is a whole different (huge) project.</p>
    <div class="ws-grid">
      ${field("OS name", txt("osName", "FreeOS", "FreeOS"))}
      ${field("Your user name", txt("osUser", "Guest", "Guest"))}
      ${field("Wallpaper / theme colour", colorF("osColor", "#0ea5e9"))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="osGo">🖥️ Build my OS</button></div>
    ${aiCustomBox("osCustom", "e.g. a retro Windows-XP-style web OS with a snake game app…", "")}`;
    q("#osGo", ws).onclick = () => {
      const name = val("osName", ws) || "FreeOS";
      htmlResult(ws, FreeAITemplates.webOS({ title: name, user: val("osUser", ws) || "Guest", accent: q("#osColor", ws).value }), slug(name, "os") + ".html", name + " web OS");
    };
    bindAiCustom(ws, (v) => `Build me a web-based desktop OS simulation in ONE single HTML file: ${v}. Include a desktop, taskbar with clock, draggable windows and at least 3 working mini-apps. Complete code, ready to run with the Preview button.`);
  }

  function rSoftware(ws) {
    ws.innerHTML = `<h2>💾 Software / App Maker</h2><p class="ws-sub">Real working apps as a single file — open them on any phone or computer, no installation.</p>
    <div class="ws-grid">
      ${field("App", sel("swType", [["todo", "✅ To-Do List (saves automatically)"], ["calculator", "🧮 Calculator"], ["notepad", "📝 Notepad (auto-save + word count)"], ["pomodoro", "🍅 Focus / Pomodoro Timer"], ["passwordGen", "🔐 Password Generator"]]))}
      ${field("App title", txt("swTitle", "My App"))}
      ${field("Theme colour", colorF("swColor", "#10a37f"))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="swGo">💾 Build my app</button></div>
    ${aiCustomBox("swCustom", "e.g. an expense tracker with monthly chart…", "")}`;
    q("#swGo", ws).onclick = () => {
      const type = val("swType", ws);
      const title = val("swTitle", ws) || ({ todo: "My To-Do List", calculator: "Calculator", notepad: "Notepad", pomodoro: "Focus Timer", passwordGen: "Password Generator" })[type];
      htmlResult(ws, FreeAITemplates[type]({ title, accent: q("#swColor", ws).value }), slug(title, "app") + ".html", title + " app");
    };
    bindAiCustom(ws, (v) => `Build me this app as ONE complete HTML file (CSS+JS inside, save data in localStorage if useful): ${v}. Make it beautiful and fully working. Write all the code — I'll run it with the Preview button.`);
  }

  function rBrowser(ws) {
    ws.innerHTML = `<h2>🌐 Browser Maker</h2><p class="ws-sub">Creates your own browser app (address bar, back/reload, search) that runs inside any browser. Honest note: websites themselves can refuse to be displayed inside frames (Google/YouTube/Facebook do) — your browser includes an “Open externally” button for those, exactly like real embedded browsers do.</p>
    <div class="ws-grid">
      ${field("Browser name", txt("brName", "FreeBrowser", "FreeBrowser"))}
      ${field("Theme colour", colorF("brColor", "#10a37f"))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="brGo">🌐 Build my browser</button></div>`;
    q("#brGo", ws).onclick = () => {
      const name = val("brName", ws) || "FreeBrowser";
      htmlResult(ws, FreeAITemplates.browser({ title: name, accent: q("#brColor", ws).value }), slug(name, "browser") + ".html", name + " browser");
    };
  }

  function rAI(ws) {
    ws.innerHTML = `<h2>🤖 Create Your Own AI</h2><p class="ws-sub">Design a personal AI assistant and download it as a single file you can share with anyone. It thinks using the same free AI engine as FreeAI (needs internet, no key).</p>
    <div class="ws-grid">
      ${field("AI's name", txt("aiName", "Nova", "Nova"))}
      ${field("Greeting message", txt("aiGreet", "Hi! I'm Nova — ask me anything ✨", "Hi! I'm Nova — ask me anything ✨"))}
      ${field("Theme colour", colorF("aiColor", "#8b5cf6"))}
    </div>
    ${field("Personality — describe how it should behave & what it's an expert in", `<textarea id="aiPersona" rows="4">You are Nova, a cheerful study buddy for school students. Explain everything in simple words with fun examples, use emojis sometimes, and always encourage the student. Reply in the student's language.</textarea>`)}
    <div class="ws-actions"><button class="pill-btn primary" id="aiGo">🤖 Create my AI</button>
    <button class="pill-btn" id="aiTryHere">💬 Also try this personality in FreeAI chat</button></div>`;
    q("#aiGo", ws).onclick = () => {
      const name = val("aiName", ws) || "MyBot";
      htmlResult(ws, FreeAITemplates.aiBot({
        name, greeting: val("aiGreet", ws) || "Hi! Ask me anything.",
        personality: q("#aiPersona", ws).value.trim() || "You are a helpful assistant.",
        accent: q("#aiColor", ws).value,
      }), slug(name, "ai") + "-ai.html", name + " AI assistant");
    };
    q("#aiTryHere", ws).onclick = () => {
      const name = val("aiName", ws) || "MyBot";
      window.FreeAIShowView("chat");
      if (typeof send === "function") send(`From now on in this chat, act exactly like this personality (your new name is ${name}): ${q("#aiPersona", ws).value.trim()} — Introduce yourself as ${name} in character.`);
    };
  }

  function rWebsite(ws) {
    ws.innerHTML = `<h2>🌍 Website Maker</h2><p class="ws-sub">A complete, beautiful website page — download it and host it free on GitHub Pages/Netlify exactly like FreeAI itself.</p>
    <div class="ws-grid">
      ${field("Website type", sel("wType", [["landing", "🚀 Business / Landing page"], ["portfolio", "👤 Portfolio"], ["restaurant", "🍽️ Restaurant"], ["shop", "🛍️ Shop"]]))}
      ${field("Site / business name", txt("wTitle", "My Business"))}
      ${field("Tagline", txt("wTag", "The best in town — quality you can trust."))}
      ${field("Theme colour", colorF("wColor", "#10a37f"))}
    </div>
    <div class="ws-actions"><button class="pill-btn primary" id="wGo">🌍 Build my website</button></div>
    ${aiCustomBox("wCustom", "e.g. a photography portfolio with gallery and pricing…", "")}`;
    q("#wGo", ws).onclick = () => {
      const title = val("wTitle", ws) || "My Website";
      htmlResult(ws, FreeAITemplates.website({
        type: val("wType", ws), title,
        tagline: val("wTag", ws) || "Welcome to my website.",
        accent: q("#wColor", ws).value,
      }), slug(title, "website") + ".html", title + " website");
    };
    bindAiCustom(ws, (v) => `Build me a complete, beautiful website in ONE HTML file: ${v}. Modern design, mobile-friendly, with header, hero, features/sections and a contact area. All code written for me, ready for the Preview button.`);
  }

  const RENDERERS = {
    game: rGame, image: rImage,
    video: (ws) => rVideoMovie(ws, false), movie: (ws) => rVideoMovie(ws, true),
    "mc-mod": rMcMod, "mc-datapack": rMcDatapack, "mc-resource": rMcResource, "mc-shader": rMcShader, "mc-modpack": rMcModpack,
    os: rOS, software: rSoftware, browser: rBrowser, ai: rAI, website: rWebsite,
  };

  /* ════════════════ INIT ════════════════ */
  document.addEventListener("DOMContentLoaded", () => {
    renderStudioGrid();
    q("#navChatBtn")?.addEventListener("click", () => window.FreeAIShowView("chat"));
    q("#navStudioBtn")?.addEventListener("click", () => window.FreeAIShowView("studio"));
    q("#navAppsBtn")?.addEventListener("click", () => window.FreeAIShowView("apps"));
    q("#heroStudioBtn")?.addEventListener("click", () => window.FreeAIShowView("studio"));
    q("#heroAppsBtn")?.addEventListener("click", () => window.FreeAIShowView("apps"));
    if (location.hash === "#studio") window.FreeAIShowView("studio");
    else if (location.hash === "#apps") window.FreeAIShowView("apps");
  });
})();
