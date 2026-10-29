/* ============================================================
   FreeAI Connect Apps — YouTube · Google Drive · Terabox ·
   GitHub · Lovable · Modrinth · CurseForge.
   Real public APIs where they exist; your own FREE keys/OAuth
   where a service requires it; honest link-based handoff where
   a service has no public API (Terabox / Lovable).
   All keys live only in this browser's localStorage.
   ============================================================ */
(() => {
  "use strict";
  const q = (s, el = document) => el.querySelector(s);
  const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const val = (id, el = document) => q("#" + id, el)?.value?.trim() || "";
  const field = (label, inner) => `<label class="field"><span>${label}</span>${inner}</label>`;
  /* Chat-engine API (provided by app.js as window.FreeAI) */
  const FA = () => window.FreeAI || {};
  const toast = (m) => FA().toast?.(m);
  const send = (...a) => FA().send?.(...a);

  const LS = "freeai.apps.v1";
  const store = Object.assign(
    { githubToken: "", githubUser: "", youtubeKey: "", curseforgeKey: "", driveClientId: "", links: { terabox: [], lovable: [] } },
    (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } })()
  );
  store.links = Object.assign({ terabox: [], lovable: [] }, store.links || {});
  const save = () => localStorage.setItem(LS, JSON.stringify(store));

  const fmtNum = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n || 0));
  const errBox = (box, msg) => { box.innerHTML = `<p class="kv-note">⚠️ ${escH(msg)}</p>`; };

  /* ── shared key-connect form ── */
  function keyForm({ id, label, current, placeholder, helpHtml, onSave }) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `${field(label, `<input type="password" id="${id}" placeholder="${escH(placeholder)}" value="${escH(current)}" autocomplete="off">`)}
      <div class="ws-actions" style="margin-top:2px">
        <button class="pill-btn primary" data-k="save">${current ? "🔄 Update key" : "🔌 Connect"}</button>
        ${current ? `<button class="pill-btn" data-k="disc">Disconnect</button>` : ""}
      </div>
      <details class="help-box"><summary>How do I get this (free)?</summary>${helpHtml}</details>`;
    q('[data-k="save"]', wrap).onclick = () => { onSave(val(id, wrap)); save(); renderAppsGrid(); toast("Connected ✓ (saved only in this browser)"); };
    const disc = q('[data-k="disc"]', wrap);
    if (disc) disc.onclick = () => { onSave(""); save(); renderAppsGrid(); toast("Disconnected — key deleted from this browser"); };
    return wrap;
  }

  /* ── shared saved-links library (Terabox / Lovable) ── */
  function linkLibrary(kind, container, { emptyText }) {
    function render() {
      const list = store.links[kind] || [];
      container.innerHTML = `
        <div class="search-row"><input type="text" id="llName-${kind}" placeholder="Name (e.g. My movie folder)"><input type="text" id="llUrl-${kind}" placeholder="Paste link https://…"><button class="pill-btn primary" id="llAdd-${kind}">＋ Save link</button></div>
        <div id="llList-${kind}"></div>`;
      const listBox = q(`#llList-${kind}`, container);
      if (!list.length) listBox.innerHTML = `<p class="kv-note">${emptyText}</p>`;
      list.forEach((l, i) => {
        const row = document.createElement("div");
        row.className = "link-row";
        row.innerHTML = `<span class="l-name">${escH(l.name)}</span><span class="l-url">${escH(l.url)}</span>
          <a class="mini-btn" href="${escH(l.url)}" target="_blank" rel="noopener">Open ↗</a>
          <button class="mini-btn" data-del>✕</button>`;
        q("[data-del]", row).onclick = () => { store.links[kind].splice(i, 1); save(); render(); };
        listBox.appendChild(row);
      });
      q(`#llAdd-${kind}`, container).onclick = () => {
        let url = val(`llUrl-${kind}`, container);
        if (!url) { toast("Paste a link first"); return; }
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        store.links[kind].unshift({ name: val(`llName-${kind}`, container) || url.replace(/^https?:\/\//, "").slice(0, 34), url });
        save(); render(); renderAppsGrid();
        toast("Link saved ✓");
      };
    }
    render();
  }

  /* ════════════════ SERVICES ════════════════ */
  const SERVICES = [
    {
      id: "modrinth", emoji: "💚", name: "Modrinth",
      desc: "Minecraft Mods, resource packs, shaders, modpacks, datapacks & plugins",
      status: () => ["on", "Connected — public API, no key needed"],
      open: openModrinth,
    },
    {
      id: "github", emoji: "🐙", name: "GitHub",
      desc: "Search millions of repos, download code, browse your own projects",
      status: () => store.githubToken ? ["on", "Connected with your token"] : ["partial", "Public search ready · token optional"],
      open: openGitHub,
    },
    {
      id: "youtube", emoji: "▶️", name: "YouTube",
      desc: "Search & watch videos inside FreeAI; play any video by link",
      status: () => store.youtubeKey ? ["on", "Connected — in-app search enabled"] : ["partial", "Player ready · add free API key for search"],
      open: openYouTube,
    },
    {
      id: "drive", emoji: "📁", name: "Google Drive",
      desc: "Preview & download shared files; full Drive with your own Google login",
      status: () => store.driveClientId ? ["on", "OAuth configured — sign in below"] : ["partial", "Link viewer ready · OAuth optional"],
      open: openDrive,
    },
    {
      id: "curseforge", emoji: "🔥", name: "CurseForge",
      desc: "Minecraft Mods, modpacks, resource packs & worlds",
      status: () => store.curseforgeKey ? ["on", "Connected with your API key"] : ["off", "Needs your free API key"],
      open: openCurseForge,
    },
    {
      id: "terabox", emoji: "☁️", name: "Terabox",
      desc: "Your Terabox share links, saved in one place (no public API exists)",
      status: () => store.links.terabox.length ? ["on", `${store.links.terabox.length} link(s) saved`] : ["partial", "Link library ready"],
      open: openTerabox,
    },
    {
      id: "lovable", emoji: "💜", name: "Lovable",
      desc: "Create app prompts with FreeAI, hand them to Lovable, save your projects",
      status: () => store.links.lovable.length ? ["on", `${store.links.lovable.length} project(s) saved`] : ["partial", "Prompt handoff ready"],
      open: openLovable,
    },
  ];

  function renderAppsGrid() {
    const g = q("#appsGrid");
    if (!g) return;
    g.innerHTML = "";
    for (const s of SERVICES) {
      const [dot, text] = s.status();
      const b = document.createElement("button");
      b.className = "app-card";
      b.innerHTML = `<span class="c-emoji">${s.emoji}</span><span class="c-title">${escH(s.name)}</span>
        <span class="c-desc">${escH(s.desc)}</span>
        <span class="c-status"><span class="dot ${dot}"></span> ${escH(text)}</span>`;
      b.onclick = () => openService(s);
      g.appendChild(b);
    }
  }
  function openService(s) {
    const ws = q("#appsWorkspace");
    ws.classList.remove("hidden");
    ws.innerHTML = `<h2>${s.emoji} ${escH(s.name)}</h2>`;
    const body = document.createElement("div");
    ws.appendChild(body);
    s.open(body);
    ws.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.FreeAIOpenApps = () => window.FreeAIShowView("apps");

  /* ── MODRINTH (real, no key) ── */
  function openModrinth(el) {
    el.innerHTML = `<p class="ws-sub">Live from the Modrinth API — no account, no key. Download the latest file directly, or send Mods to the Studio Modpack Builder.</p>
      <div class="search-row">
        <input type="search" id="mrQ" placeholder="Search… e.g. sodium, faithful, terralith">
        <select id="mrType">
          <option value="mod">⛏️ Mods</option><option value="resourcepack">🧱 Resource packs</option>
          <option value="shader">🌅 Shaders</option><option value="modpack">📦 Modpacks</option>
          <option value="datapack">🧩 Datapacks</option><option value="plugin">🔌 Plugins</option>
        </select>
        <button class="pill-btn primary" id="mrGo">Search</button>
      </div>
      <div class="results-grid" id="mrOut"></div>`;
    const run = async () => {
      const out = q("#mrOut", el);
      out.innerHTML = `<p class="kv-note">Searching Modrinth…</p>`;
      try {
        const hits = await window.FreeAIModrinthSearch(val("mrQ", el), val("mrType", el), 18);
        const type = val("mrType", el);
        out.innerHTML = hits.length ? "" : `<p class="kv-note">Nothing found — try different words.</p>`;
        for (const h of hits) {
          const c = document.createElement("div");
          c.className = "result-card";
          c.innerHTML = `${h.icon_url ? `<img class="icon" src="${escH(h.icon_url)}" alt="">` : ""}
            <div class="r-title">${escH(h.title)}</div>
            <div class="r-meta">by ${escH(h.author)} · ⬇ ${fmtNum(h.downloads)} · ❤️ ${fmtNum(h.follows)}<br>${escH((h.description || "").slice(0, 120))}</div>
            <div class="r-btns">
              <button class="mini-btn" data-dl>⬇ Latest file</button>
              ${type === "mod" ? `<button class="mini-btn" data-pack>➕ To modpack</button>` : ""}
              <a class="mini-btn" href="https://modrinth.com/${escH(type)}/${escH(h.slug)}" target="_blank" rel="noopener">View ↗</a>
            </div>`;
          q("[data-dl]", c).onclick = async () => {
            try {
              toast("Finding latest file…");
              const vs = await (await fetch(`https://api.modrinth.com/v2/project/${h.project_id}/version`)).json();
              const f = vs[0]?.files?.find((x) => x.primary) || vs[0]?.files?.[0];
              if (f) open(f.url, "_blank"); else toast("No downloadable file found for the latest version");
            } catch { toast("Couldn't fetch versions — use View ↗"); }
          };
          const packBtn = q("[data-pack]", c);
          if (packBtn) packBtn.onclick = () => dispatchEvent(new CustomEvent("freeai:addToModpack", { detail: { id: h.project_id, title: h.title, icon: h.icon_url, slug: h.slug } }));
          out.appendChild(c);
        }
      } catch (err) { errBox(out, err.message + " — is your internet on? You can always browse modrinth.com directly."); }
    };
    q("#mrGo", el).onclick = run;
    q("#mrQ", el).addEventListener("keydown", (e) => e.key === "Enter" && run());
    run();
  }

  /* ── GITHUB (real; token optional) ── */
  function openGitHub(el) {
    el.innerHTML = `<p class="ws-sub">Search all public GitHub repos — no token needed. Add your (free) Personal Access Token to also list <b>your</b> repos and raise rate limits. Token stays in this browser only.</p>
    <div id="ghKey"></div>
    <div class="search-row">
      <input type="search" id="ghQ" placeholder="Search repos… e.g. whatsapp clone javascript, minecraft mod, ai chatbot">
      <button class="pill-btn primary" id="ghGo">Search</button>
      <button class="pill-btn" id="ghMine">📂 My repos</button>
    </div>
    <div class="results-grid" id="ghOut"></div>`;
    q("#ghKey", el).appendChild(keyForm({
      id: "ghToken", label: "GitHub Personal Access Token (optional)", current: store.githubToken, placeholder: "ghp_… or github_pat_…",
      helpHtml: `<ol><li>Go to <b>github.com</b> → your profile picture → <b>Settings</b>.</li><li>Bottom left: <b>Developer settings → Personal access tokens → Tokens (classic)</b>.</li><li><b>Generate new token</b> — for just browsing your repos, tick only <b>repo → public_repo</b> (or no scopes for public data).</li><li>Copy it once and paste here. FreeAI stores it ONLY in this browser and sends it ONLY to api.github.com.</li></ol>`,
      onSave: (v) => { store.githubToken = v; openService(SERVICES.find((s) => s.id === "github")); },
    }));
    const gh = async (path) => {
      const headers = { Accept: "application/vnd.github+json" };
      if (store.githubToken) headers.Authorization = "Bearer " + store.githubToken;
      const r = await fetch("https://api.github.com" + path, { headers });
      if (r.status === 403) throw new Error("GitHub rate limit hit — add a free token above or wait a few minutes.");
      if (!r.ok) throw new Error("GitHub API: HTTP " + r.status);
      return r.json();
    };
    const renderRepos = (repos, out) => {
      out.innerHTML = repos.length ? "" : `<p class="kv-note">No repos found.</p>`;
      for (const r of repos) {
        const c = document.createElement("div");
        c.className = "result-card";
        c.innerHTML = `<div class="r-title">🐙 ${escH(r.full_name)}</div>
          <div class="r-meta">⭐ ${fmtNum(r.stargazers_count)} · 🍴 ${fmtNum(r.forks_count)}${r.language ? " · " + escH(r.language) : ""}<br>${escH((r.description || "No description").slice(0, 130))}</div>
          <div class="r-btns">
            <a class="mini-btn" href="${escH(r.html_url)}" target="_blank" rel="noopener">Open ↗</a>
            <a class="mini-btn" href="https://codeload.github.com/${escH(r.full_name)}/zip/refs/heads/${escH(r.default_branch || "main")}">⬇ Download ZIP</a>
            <button class="mini-btn" data-ask>🤖 Ask AI about it</button>
          </div>`;
        q("[data-ask]", c).onclick = () => {
          window.FreeAIShowView("chat");
          if (typeof send === "function") send(`Explain this GitHub project to me like a friendly teacher: ${r.html_url} — "${r.full_name}" (${r.description || "no description"}, ${r.language || "unknown language"}, ⭐${r.stargazers_count}). What does it do, who is it for, and how would a beginner run it step by step?`);
        };
        out.appendChild(c);
      }
    };
    const search = async () => {
      const out = q("#ghOut", el);
      const query = val("ghQ", el) || "awesome free tools";
      out.innerHTML = `<p class="kv-note">Searching GitHub…</p>`;
      try { renderRepos((await gh("/search/repositories?q=" + encodeURIComponent(query) + "&sort=stars&per_page=18")).items || [], out); }
      catch (err) { errBox(out, err.message); }
    };
    q("#ghGo", el).onclick = search;
    q("#ghQ", el).addEventListener("keydown", (e) => e.key === "Enter" && search());
    q("#ghMine", el).onclick = async () => {
      const out = q("#ghOut", el);
      out.innerHTML = `<p class="kv-note">Loading your repos…</p>`;
      try {
        if (store.githubToken) renderRepos(await gh("/user/repos?per_page=30&sort=updated"), out);
        else {
          const name = prompt("Your GitHub username (public repos only — or add a token above for private too):", store.githubUser || "");
          if (!name) { out.innerHTML = ""; return; }
          store.githubUser = name.trim(); save();
          renderRepos(await gh("/users/" + encodeURIComponent(name.trim()) + "/repos?per_page=30&sort=updated"), out);
        }
      } catch (err) { errBox(out, err.message + " — check the username/token."); }
    };
    search();
  }

  /* ── YOUTUBE (player always; search with free key) ── */
  function ytIdFrom(url) {
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/) || String(url).match(/^([\w-]{11})$/);
    return m ? m[1] : null;
  }
  function openYouTube(el) {
    el.innerHTML = `<p class="ws-sub">Watch any YouTube video right here by pasting its link. For <b>in-app search</b>, add your free YouTube Data API key (Google gives ~100 free searches/day).</p>
    <div id="ytKey"></div>
    <div class="search-row">
      <input type="text" id="ytQ" placeholder="${store.youtubeKey ? "Search YouTube… or paste a video link" : "Paste a YouTube video link… (add API key above to search by words)"}">
      <button class="pill-btn primary" id="ytGo">${store.youtubeKey ? "Search / Play" : "▶ Play"}</button>
      <a class="pill-btn" href="https://www.youtube.com" target="_blank" rel="noopener">Open YouTube ↗</a>
    </div>
    <div id="ytPlayer"></div>
    <div class="results-grid" id="ytOut"></div>`;
    q("#ytKey", el).appendChild(keyForm({
      id: "ytKeyInput", label: "YouTube Data API v3 key (free, for in-app search)", current: store.youtubeKey, placeholder: "AIza…",
      helpHtml: `<ol><li>Go to <b>console.cloud.google.com</b> (free Google account) → create a project.</li><li><b>APIs &amp; Services → Library</b> → enable <b>YouTube Data API v3</b>.</li><li><b>APIs &amp; Services → Credentials → Create credentials → API key</b>.</li><li>Paste the key here. It never leaves this browser except to googleapis.com.</li></ol>`,
      onSave: (v) => { store.youtubeKey = v; openService(SERVICES.find((s) => s.id === "youtube")); },
    }));
    const play = (id, title = "") => {
      q("#ytPlayer", el).innerHTML = `${title ? `<h3>${escH(title)}</h3>` : ""}<iframe class="media-frame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1" title="YouTube player" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      q("#ytPlayer", el).scrollIntoView({ behavior: "smooth" });
    };
    q("#ytGo", el).onclick = async () => {
      const input = val("ytQ", el);
      const id = ytIdFrom(input);
      if (id) { play(id); return; }
      if (!store.youtubeKey) { open("https://www.youtube.com/results?search_query=" + encodeURIComponent(input), "_blank"); toast("No API key yet — opened YouTube search in a new tab"); return; }
      const out = q("#ytOut", el);
      out.innerHTML = `<p class="kv-note">Searching YouTube…</p>`;
      try {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(input)}&key=${encodeURIComponent(store.youtubeKey)}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error?.message || "HTTP " + r.status);
        out.innerHTML = "";
        for (const it of data.items || []) {
          const vid = it.id.videoId, sn = it.snippet;
          const c = document.createElement("div");
          c.className = "result-card";
          c.innerHTML = `<img class="thumb" src="${escH(sn.thumbnails?.medium?.url || "")}" alt="">
            <div class="r-title">${escH(sn.title)}</div><div class="r-meta">${escH(sn.channelTitle)} · ${new Date(sn.publishedAt).toLocaleDateString()}</div>
            <div class="r-btns"><button class="mini-btn" data-play>▶ Watch here</button>
            <button class="mini-btn" data-sum>🤖 Summarise title/desc</button></div>`;
          q("[data-play]", c).onclick = () => play(vid, sn.title);
          q("[data-sum]", c).onclick = () => { window.FreeAIShowView("chat"); if (typeof send === "function") send(`Based on this YouTube video's title and description, tell me what it's probably about, who should watch it, and 5 things I'll learn. Be honest that you can't watch the video itself.\n\nTitle: ${sn.title}\nChannel: ${sn.channelTitle}\nDescription: ${(sn.description || "").slice(0, 1200)}\nLink: https://www.youtube.com/watch?v=${vid}`); };
          out.appendChild(c);
        }
        if (!out.children.length) out.innerHTML = `<p class="kv-note">No videos found.</p>`;
      } catch (err) { errBox(out, err.message + " — check the key/quota, or paste a video link to just play it."); }
    };
    q("#ytQ", el).addEventListener("keydown", (e) => e.key === "Enter" && q("#ytGo", el).click());
  }

  /* ── GOOGLE DRIVE (link viewer + your OAuth) ── */
  function driveIdFrom(url) {
    const s = String(url);
    return (s.match(/\/file\/d\/([\w-]+)/) || s.match(/\/folders\/([\w-]+)/) || s.match(/[?&]id=([\w-]+)/) || s.match(/^([\w-]{20,})$/))?.[1] || null;
  }
  function openDrive(el) {
    el.innerHTML = `<p class="ws-sub"><b>Instant:</b> paste any Drive share link (“Anyone with the link”) to preview/download it here. <b>Full Drive:</b> Google only allows browsing your private files after you create your own free OAuth Client ID and sign in — guide below. FreeAI never sees your Google password.</p>
    <h3>🔗 Share-link viewer</h3>
    <div class="search-row"><input type="text" id="drLink" placeholder="Paste Google Drive link… https://drive.google.com/file/d/…"><button class="pill-btn primary" id="drView">Preview</button></div>
    <div id="drOut"></div>
    <h3>🔐 Your Drive (OAuth)</h3>
    <div id="drKey"></div>
    <div class="ws-actions"><button class="pill-btn primary" id="drLogin" ${store.driveClientId ? "" : "disabled style=opacity:.45"}>Sign in with Google &amp; list my files</button>
    <a class="pill-btn" href="https://drive.google.com" target="_blank" rel="noopener">Open Google Drive ↗</a></div>
    <div id="drFiles"></div>`;
    q("#drView", el).onclick = () => {
      const id = driveIdFrom(val("drLink", el));
      const out = q("#drOut", el);
      if (!id) { toast("That doesn't look like a Drive file link"); return; }
      const isFolder = /\/folders\//.test(val("drLink", el));
      out.innerHTML = isFolder
        ? `<iframe class="media-frame tall" src="https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}#grid" title="Drive folder"></iframe>`
        : `<iframe class="media-frame tall" src="https://drive.google.com/file/d/${encodeURIComponent(id)}/preview" title="Drive preview" allow="autoplay"></iframe>
           <div class="ws-actions"><a class="pill-btn primary" href="https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}">⬇ Download file</a>
           <a class="pill-btn" href="https://drive.google.com/file/d/${encodeURIComponent(id)}/view" target="_blank" rel="noopener">Open in Drive ↗</a></div>
           <p class="kv-note">Preview works when the file is shared as “Anyone with the link”. Private files need the OAuth sign-in below or open in Drive.</p>`;
    };
    q("#drKey", el).appendChild(keyForm({
      id: "drClientId", label: "Your Google OAuth Client ID (for full Drive access)", current: store.driveClientId, placeholder: "12345-abc…apps.googleusercontent.com",
      helpHtml: `<ol><li><b>console.cloud.google.com</b> → create a project → <b>APIs &amp; Services → Library</b> → enable <b>Google Drive API</b>.</li>
        <li><b>OAuth consent screen</b> → External → fill app name + your email → Save. Add yourself as a <b>Test user</b>.</li>
        <li><b>Credentials → Create credentials → OAuth client ID → Web application</b>.</li>
        <li>Under <b>Authorized JavaScript origins</b> add this site's origin: <code>${escH(location.origin)}</code> ${location.protocol === "file:" ? "(you're on a local file — OAuth needs the hosted https version of FreeAI)" : ""}</li>
        <li>Create → copy the <b>Client ID</b> → paste here → Connect. Then “Sign in with Google”. FreeAI requests read-only Drive access, the token lives only in this tab.</li></ol>`,
      onSave: (v) => { store.driveClientId = v; openService(SERVICES.find((s) => s.id === "drive")); },
    }));
    q("#drLogin", el).onclick = async () => {
      const out = q("#drFiles", el);
      try {
        await new Promise((resolve, reject) => {
          if (window.google?.accounts?.oauth2) return resolve();
          const s = document.createElement("script");
          s.src = "https://accounts.google.com/gsi/client";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
        const token = await new Promise((resolve, reject) => {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: store.driveClientId,
            scope: "https://www.googleapis.com/auth/drive.readonly",
            callback: (resp) => resp.access_token ? resolve(resp.access_token) : reject(new Error(resp.error || "Sign-in cancelled")),
          });
          client.requestAccessToken();
        });
        out.innerHTML = `<p class="kv-note">Signed in ✓ Loading your recent files…</p>`;
        const r = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=40&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)", {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error?.message || "HTTP " + r.status);
        out.innerHTML = `<h3>🗂 Your recent files</h3>`;
        const emoji = (m) => m.includes("folder") ? "📁" : m.includes("image") ? "🖼️" : m.includes("video") ? "🎬" : m.includes("audio") ? "🎵" : m.includes("pdf") ? "📕" : m.includes("spreadsheet") ? "📗" : m.includes("document") ? "📘" : m.includes("presentation") ? "📙" : "📄";
        for (const f of data.files || []) {
          const row = document.createElement("div");
          row.className = "file-row";
          row.innerHTML = `<span>${emoji(f.mimeType || "")}</span><a href="${escH(f.webViewLink)}" target="_blank" rel="noopener">${escH(f.name)}</a>
            <span class="f-meta">${f.size ? (f.size / 1048576).toFixed(1) + " MB · " : ""}${new Date(f.modifiedTime).toLocaleDateString()}</span>`;
          out.appendChild(row);
        }
        if (!data.files?.length) out.innerHTML += `<p class="kv-note">No files found in this Drive.</p>`;
      } catch (err) { errBox(out, err.message + " — make sure the OAuth steps above are done (esp. adding this site's origin + yourself as test user)."); }
    };
  }

  /* ── CURSEFORGE (needs your free key) ── */
  function openCurseForge(el) {
    el.innerHTML = `<p class="ws-sub">CurseForge only lets apps in with an API key — but it's free. Without a key you can still jump to CurseForge search in one click.</p>
    <div id="cfKey"></div>
    <div class="search-row">
      <input type="search" id="cfQ" placeholder="Search CurseForge Minecraft… e.g. JEI, Create, RLCraft">
      <button class="pill-btn primary" id="cfGo">Search</button>
      <a class="pill-btn" href="https://www.curseforge.com/minecraft" target="_blank" rel="noopener">Open CurseForge ↗</a>
    </div>
    <div class="results-grid" id="cfOut"></div>`;
    q("#cfKey", el).appendChild(keyForm({
      id: "cfKeyInput", label: "CurseForge API key (free)", current: store.curseforgeKey, placeholder: "$2a$10$…",
      helpHtml: `<ol><li>Create a free account / sign in at <b>console.curseforge.com</b>.</li><li>Go to <b>API Keys → Generate key</b> (name it “FreeAI”).</li><li>Paste the key here. It's stored only in this browser and sent only to api.curseforge.com.</li></ol>`,
      onSave: (v) => { store.curseforgeKey = v; openService(SERVICES.find((s) => s.id === "curseforge")); },
    }));
    q("#cfGo", el).onclick = async () => {
      const query = val("cfQ", el);
      const out = q("#cfOut", el);
      if (!store.curseforgeKey) { open("https://www.curseforge.com/minecraft/search?search=" + encodeURIComponent(query), "_blank"); toast("No API key yet — opened CurseForge search in a new tab"); return; }
      out.innerHTML = `<p class="kv-note">Searching CurseForge…</p>`;
      try {
        const r = await fetch(`https://api.curseforge.com/v1/Mods/search?gameId=432&pageSize=18&sortField=2&sortOrder=desc&searchFilter=${encodeURIComponent(query)}`, {
          headers: { "x-api-key": store.curseforgeKey, Accept: "application/json" },
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.message || "HTTP " + r.status);
        out.innerHTML = data.data?.length ? "" : `<p class="kv-note">Nothing found.</p>`;
        for (const m of data.data || []) {
          const c = document.createElement("div");
          c.className = "result-card";
          const latest = m.latestFiles?.[0];
          c.innerHTML = `${m.logo?.thumbnailUrl ? `<img class="icon" src="${escH(m.logo.thumbnailUrl)}" alt="">` : ""}
            <div class="r-title">${escH(m.name)}</div>
            <div class="r-meta">by ${escH(m.authors?.[0]?.name || "?")} · ⬇ ${fmtNum(m.downloadCount)}<br>${escH((m.summary || "").slice(0, 120))}</div>
            <div class="r-btns">
              ${latest ? `<a class="mini-btn" href="https://www.curseforge.com/minecraft/mc-Mods/${escH(m.slug)}/files/${latest.id}" target="_blank" rel="noopener">⬇ Latest file page</a>` : ""}
              <a class="mini-btn" href="${escH(m.links?.websiteUrl || "https://www.curseforge.com/minecraft/mc-Mods/" + m.slug)}" target="_blank" rel="noopener">View ↗</a>
            </div>`;
          out.appendChild(c);
        }
      } catch (err) {
        errBox(out, err.message + " — if this keeps failing, CurseForge may be blocking browser calls (CORS); the “Open CurseForge ↗” button always works, and Modrinth (above) has most of the same Mods with no key.");
      }
    };
    q("#cfQ", el).addEventListener("keydown", (e) => e.key === "Enter" && q("#cfGo", el).click());
  }

  /* ── TERABOX (no public API — link library) ── */
  function openTerabox(el) {
    el.innerHTML = `<p class="ws-sub">⚠️ <b>Honest note:</b> Terabox has <b>no public API</b> — no app can truly “connect” to your Terabox account, and any site asking for your Terabox password is unsafe. What FreeAI <i>can</i> do: keep all your Terabox share links organised here, one tap to open. (Never enter your Terabox password anywhere except terabox.com.)</p>
    <div class="ws-actions"><a class="pill-btn primary" href="https://www.terabox.com" target="_blank" rel="noopener">☁️ Open Terabox ↗</a>
    <button class="pill-btn" id="tbAsk">🤖 Ask AI: how to share a Terabox link safely</button></div>
    <h3>🔖 Your saved Terabox links</h3><div id="tbLinks"></div>`;
    linkLibrary("terabox", q("#tbLinks", el), { emptyText: "Nothing saved yet. In Terabox, share a file → copy its link → paste it here with a name." });
    q("#tbAsk", el).onclick = () => { window.FreeAIShowView("chat"); if (typeof send === "function") send("Explain step by step: how do I create a share link for a file in Terabox (app + website), how do I download from a Terabox link someone sent me, and what safety tips should I follow so my account stays safe?"); };
  }

  /* ── LOVABLE (no public API — prompt handoff) ── */
  function openLovable(el) {
    el.innerHTML = `<p class="ws-sub">⚠️ <b>Honest note:</b> Lovable has <b>no public API</b> to build apps from outside. The real workflow FreeAI supports: <b>1)</b> write/perfect your app prompt here (or let the AI write it), <b>2)</b> one click copies it and opens Lovable, <b>3)</b> paste &amp; build, <b>4)</b> save your Lovable project links below. Tip: FreeAI's own 🎨 Create Studio + 💻 Build-it-for-me chat already build complete apps free — many people won't need Lovable at all.</p>
    ${field("Your app prompt for Lovable", `<textarea id="lvPrompt" rows="4" placeholder="Build a… (describe pages, features, colours, login, database…)"></textarea>`)}
    <div class="ws-actions">
      <button class="pill-btn primary" id="lvGo">💜 Copy prompt &amp; open Lovable ↗</button>
      <button class="pill-btn" id="lvAi">🤖 Let FreeAI write my Lovable prompt</button>
      <button class="pill-btn" id="lvStudio">🎨 Or build it free in Create Studio</button>
    </div>
    <h3>🔖 Your Lovable projects</h3><div id="lvLinks"></div>`;
    linkLibrary("lovable", q("#lvLinks", el), { emptyText: "Nothing saved yet. After building in Lovable, copy your project/preview link and save it here." });
    q("#lvGo", el).onclick = async () => {
      const p = q("#lvPrompt", el).value.trim();
      if (p) { try { await navigator.clipboard.writeText(p); toast("Prompt copied ✓ — paste it into Lovable"); } catch { toast("Couldn't auto-copy — select the text and copy manually"); } }
      open("https://lovable.dev", "_blank");
    };
    q("#lvAi", el).onclick = () => {
      const idea = q("#lvPrompt", el).value.trim() || prompt("What app do you want to build? (one line is fine)") || "";
      if (!idea) return;
      window.FreeAIShowView("chat");
      if (typeof send === "function") send(`Write me ONE perfect Lovable.dev prompt for this app idea: "${idea}". Include: app purpose, pages/screens, key features, design style & colours, whether it needs login/database, and any specific details. Give ONLY the ready-to-paste prompt in a code block, with 1-2 line explanation before it.`);
    };
    q("#lvStudio", el).onclick = () => window.FreeAIOpenMaker("software");
  }

  /* ════════════════ INIT ════════════════ */
  document.addEventListener("DOMContentLoaded", renderAppsGrid);
})();
