# FreeAI — ChatGPT-style AI chat, free forever

**No limits · No subscriptions · No ads · No sign-up.**  
FreeAI looks and feels like ChatGPT, but everything runs in the visitor's browser
against **free AI providers**, so it costs you **₹0/$0 to host and ₹0/$0 to run**.

![FreeAI](assets/logo.svg)

## ✨ What it does

| Feature | Details |
|---|---|
| 💬 Unlimited chat | Streaming replies, markdown, tables, syntax-highlighted code — like ChatGPT |
| 🤖 Every free model | Model list is **fetched live** from the provider. Defaults to Pollinations' free models (no key). Add a free **OpenRouter** or **Groq** key in Settings to unlock hundreds more (Llama, DeepSeek, Qwen, Gemma, Mistral…). Or plug in **any** OpenAI-compatible API |
| 🎨 Unlimited images | "Create image" mode turns prompts into pictures (free via Pollinations/Flux) |
| 💻 It codes for you | "Build-it-for-me" mode writes the **complete** code — you never type/print code yourself. Every code block has **Copy**, **Download**, and **▶ Run preview**: the app/website runs itself in a live preview panel next to the chat |
| 📎 Attachments | Drop/paste files (text, code, CSV, JSON, images) and ask about them |
| 🎤 Voice in, 🔊 voice out | Mic dictation + read-aloud on every reply |
| 🗂 Chat history | Sidebar with search, rename, delete — stored only in the user's own browser |
| 🔒 Private by design | No FreeAI server, no accounts, no tracking. API keys & chats never leave the device |
| 📱 Works everywhere | Installable PWA, responsive, dark (default) + light theme |

## 🎨 Create Studio — make anything

The **Create Studio** tab (sidebar or `#studio`) makes real downloadable files, instantly, in the browser:

| Maker | What you get |
|---|---|
| 🎮 Game | Playable Snake / Flappy / Breakout / Memory (.html) — or describe any game and the AI builds it |
| 🖼️ Images | AI pictures with styles (photo/anime/pixel/3D…), up to 4 at a time |
| 🎬 Video | Photos / AI images / text slides → downloadable `.webm` video (recorded with the Canvas + MediaRecorder APIs) |
| 🍿 Movie | Your story, one scene per line → AI paints each scene → Ken-Burns film with title & credits, recorded to `.webm` |
| ⛏️ Minecraft Mod | Real Fabric mod project (.zip) with your custom item in Java + build guide to a .jar |
| 🧩 Minecraft Datapack | Vanilla datapack (.zip): welcome message, keep-inventory, starter kit, custom recipe |
| 🧱 Resource Pack | Rename items + paint your own 16×16 textures on the pixel canvas → ready-to-install pack |
| 🌅 Shader Pack | Working GLSL colour-grade shaders (vibrant/sunset/night/horror/retro) for Iris/OptiFine |
| 📦 Modpack | Search Modrinth, add Mods, export a real `.mrpack` (Modrinth App / Prism Launcher import it and download everything) |
| 🖥️ OS | A web OS in one file: desktop, draggable windows, taskbar, Notepad/Calculator/Paint |
| 💾 Software | To-do, calculator, notepad, Pomodoro timer, password generator |
| 🌐 Browser | Your own browser shell with address bar & search (sites that block framing open externally) |
| 🤖 Your Own AI | Downloadable personal chatbot with your name/personality, powered by the same free engine |
| 🌍 Website | Landing page / portfolio / restaurant / shop in one click |

Every maker’s output can be **previewed in-app**, **downloaded**, and **sent to the AI chat** to be improved/extended.

## 🔌 Connect Apps

The **Connect Apps** tab (sidebar or `#apps`) connects 7 services — honestly labelled by how each one really works:

| App | How it connects |
|---|---|
| 💚 **Modrinth** | ✅ Real public API, no key: search Mods/resource packs/shaders/modpacks/datapacks/plugins, direct downloads, “add to modpack” |
| 🐙 **GitHub** | ✅ Real API: public repo search with no token; add your free Personal Access Token to browse your own repos |
| ▶️ **YouTube** | ✅ Player works by link instantly; in-app search with your free YouTube Data API key |
| 📁 **Google Drive** | ✅ Share-link preview/download instantly; full Drive via your own free Google OAuth Client ID (real Google sign-in, read-only, step-by-step guide in-app) |
| 🔥 **CurseForge** | ✅ Real API with your free CurseForge API key (or one-click web search without one) |
| ☁️ **Terabox** | ⚠️ Terabox has **no public API** (never give any site your Terabox password). FreeAI keeps your share links organised, one tap to open |
| 💜 **Lovable** | ⚠️ Lovable has **no public API**. FreeAI writes/copies your app prompt and opens Lovable, and saves your project links |

All keys/tokens are stored **only in the visitor’s browser** (`localStorage`) and sent only to that service’s own API.

## 🚀 Put it online for free (2 minutes)

**Option A — GitHub Pages (recommended):**
1. Push this repo to GitHub.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
3. Wait ~1 minute. Your site is live at `https://<your-username>.github.io/FreeAI/`.

**Option B — Netlify / Vercel / Cloudflare Pages:** drag-and-drop this folder (or connect the repo). No build command needed — it's plain HTML/CSS/JS.

**Run locally:** `python3 -m http.server 8000` in this folder, then open `http://localhost:8000`.

## ⚙️ Make it yours

Edit **ONE file** — [`js/config.js`](js/config.js):

```js
supportUrl: "https://ko-fi.com/yourname",   // shows a Support button to every visitor
creatorName: "Your Name",
```

Everything else (provider, keys, system prompt, theme) is per-user in the in-app ⚙ Settings.

### About "every AI model, free, unlimited" — the honest version
- OpenAI/Anthropic do **not** give away their paid flagship models for free,
  and no website can legally do that. Anyone claiming otherwise is lying or breaking terms.
- What FreeAI *does* do is the real, sustainable version: it routes to providers that
  genuinely offer free access (Pollinations with no key at all; OpenRouter's `:free`
  models; Groq's free tier), fetches their **live model lists** so new free models
  appear automatically, and lets any user plug in their own key/endpoint.
- Free tiers have fair-use/rate limits set by those providers — FreeAI itself adds **none**:
  no message caps, no paywall, no ads, no accounts in the code.

## 💰 About revenue — please read this before you lose money

You asked for *"if they use it 30 seconds I get 35k for one user."* 
**No such program exists. Not from Google, not from anyone.** Whether it's ₹35,000 or
$35,000 — any person/video/app promising that for 30 seconds of one user's time is a
scam, usually trying to sell you a course or steal an "activation fee." Do not pay them.

**The real math:**

- With **no ads and no subscriptions** (your requirement), revenue is **₹0 by default**.
  That's fine — hosting is also ₹0 — but money doesn't appear from usage alone.
- Even *with* ads, one 30-second visit is worth roughly **₹0.5–₹2** (advertisers pay
  ~₹80–₹1,600 per **1,000** ad views). ₹35,000 from ads ≈ **20,000–400,000 visits**, not one.

**Realistic ways FreeAI can actually earn you money:**

1. **Donations / tips** — paste your Ko-fi / Buy Me a Coffee / PayPal / Razorpay-UPI
   link in `js/config.js` → a ❤️ Support button appears for every visitor. 
   (Roughly 0.1–1% of happy users tip.)
2. **Affiliate links** — recommend tools you genuinely use (hosting, courses) and link them.
3. **Sponsorships** — once you have real traffic, small companies pay for a mention.
4. **Services** — use FreeAI as your portfolio: "I built this — I can build yours."
   One freelance client can genuinely pay ₹35k+ — that's the realistic path to that number.
5. **Optional ads later** — if you ever change your mind about "no ads," Google AdSense
   can be added, but expect the math above, and it needs approval + traffic.

Grow traffic first (share the link, post demos, add it to your socials). Revenue follows audience, never the other way around.

## 🛠 Tech

Zero build step, zero dependencies to install: vanilla HTML/CSS/JS +
[marked](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify) +
[highlight.js](https://highlightjs.org) from CDN. All AI calls go browser → provider directly.

```
index.html            # ChatGPT-style UI + Studio & Apps views
css/styles.css        # Dark/light ChatGPT-like theme
js/config.js          # ← owner settings (support link etc.)
js/app.js             # chat engine, streaming, images, code runner (window.FreeAI API)
js/templates.js       # instant generators: games, apps, web OS, browser, AI, websites
js/studio.js          # 🎨 Create Studio (video/movie recorder, Minecraft zip builders…)
js/apps.js            # 🔌 Connect Apps (Modrinth/GitHub/YouTube/Drive/CurseForge/…)
assets/logo.svg       # logo / favicon / PWA icon
manifest.webmanifest  # installable app
```

## 📄 License

Boost Software License 1.0 — see [LICENSE](LICENSE). Use it, fork it, ship it.
FreeAI is not affiliated with OpenAI/ChatGPT; model names belong to their owners.
