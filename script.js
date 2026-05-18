

(function () {
  "use strict";


  const THEMES = {
    default: {
      bg: "#000000",
      fg: "#f87171",
      dim: "#8f3a3a",
      accent: "#ff3b3b",
      ok: "#ff5252",
      warn: "#ff9f6e",
      err: "#ffc9c9",
    },
    matrix: {
      bg: "#000000",
      fg: "#00ff41",
      dim: "#007729",
      accent: "#39ff14",
      ok: "#00ff88",
      warn: "#88ff00",
      err: "#ff0055",
    },
  };

  const MATRIX_CHARS =
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅ0123456789";

  const HOME_PATH = "C:\\Users\\Guest";

  const BGM_SRC = "https://file.garden/aTTWdSzGbgwzK_RD/Ariana%20Grande%20-%20Bye%20%5BAltare%20Remix%5D%20%23trendingsong%20%23bye%20%23arianagrande%20%23lyrics%20%23englishsongs%20%23song%20%5BPISfHwgA_eg%5D.mp3";

 
  const ROSTER_NAMES = [
    "YVES ",
    "YSA ",
    "COSTA ",
    "RORO ",
    "PATSU ",
    "XOA",
    "SATO",
    "SHAUN ",
    "ZAYKO  ",
    "RHON ",
    "VAL ",
    "HIZO ",
    "VISAGE ",
    "KAZUE",
    "FOKO ",
    "JIN ",
    "AZURA ",
    "ZIYEL",
    "RED ",
    "ACO ",
    "ARON ",
    "DREI ",
    "EIZ ",
    "GARDO ",
    "KAZU ",
    "KENCHIE ",
    "XAYSHU ",
    "ANTON ",
    "???",
    "???",
    "???",
    "???",
    "???",
    "???",
    "???",
  ];

  const MEMBERS_FILE = {
    path: "C:\\System\\cfg\\@♱⛧.LST",
    subtitle: "triad.xyz",
    members: ROSTER_NAMES.map((name) => ({ name, detail: "" })),
  };

  const MEMBERS_MAX = 35;


  const LINK_ENTRIES = [
    { label: "founder", url: "https://www.facebook.com/yv9sk/" },
    { label: "discord", url: "https://discord.gg/sanzio" },
  ];

  const LINKS_FILE = {
    path: "C:\\System\\cfg\\LINKS.URL",
    subtitle: "@triad",
    links: LINK_ENTRIES,
  };



  let cwd = HOME_PATH;
  /** @type {ReturnType<typeof setInterval> | null} */
  let matrixTimer = null;
  /** @type {Promise<void>} */
  let printQueue = Promise.resolve();

  const TYPEWRITER_BASE_MS = 18;
  const TYPEWRITER_ASCII_MS = 3;



  const out = document.getElementById("out");
  const cmd = document.getElementById("cmd");
  const promptText = document.getElementById("promptText");
  const bgm = document.getElementById("bgm");

  if (!out || !cmd || !promptText) {
    console.error("Terminal shell: missing required elements.");
    return;
  }

  if (bgm && BGM_SRC) {
    bgm.src = BGM_SRC;
    bgm.loop = true;

    function startBgm() {
      if (!bgm.paused) return;
      const p = bgm.play();
      if (p !== undefined) p.catch(function () {});
    }

    function unlockBgm() {
      startBgm();
      if (!bgm.paused) {
        document.removeEventListener("pointerdown", unlockBgm);
        document.removeEventListener("keydown", unlockBgm);
      }
    }

    bgm.addEventListener("canplay", startBgm, { once: true });
    startBgm();
    document.addEventListener("pointerdown", unlockBgm);
    document.addEventListener("keydown", unlockBgm);
  }



  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeHref(url) {
    const u = String(url == null ? "" : url).trim();
    return /^https?:\/\//i.test(u) ? u : "";
  }

  function applyTheme(name) {
    const t = THEMES[name] || THEMES.default;
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--fg", t.fg);
    r.setProperty("--dim", t.dim);
    r.setProperty("--accent", t.accent);
    r.setProperty("--ok", t.ok);
    r.setProperty("--warn", t.warn);
    r.setProperty("--err", t.err);
    if (window.setFluidCursorColor) {
      window.setFluidCursorColor(name === "matrix" ? { r: 0, g: 1, b: 0 } : null);
    }
  }

  function stopMatrix() {
    if (matrixTimer) {
      clearInterval(matrixTimer);
      matrixTimer = null;
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function charDelay(totalChars, baseMs) {
    if (totalChars > 500) return 5;
    if (totalChars > 250) return 8;
    if (totalChars > 120) return 12;
    return baseMs;
  }

  function asciiCharDelay(totalChars) {
    if (totalChars > 400) return 1;
    if (totalChars > 200) return 2;
    return TYPEWRITER_ASCII_MS;
  }

  function countTextNodes(node) {
    let n = 0;
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.length;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      n += countTextNodes(node.childNodes[i]);
    }
    return n;
  }

  function scrollOut() {
    out.scrollTop = out.scrollHeight;
  }

  async function typewriterReveal(target, sourceRoot, baseMs) {
    const total = countTextNodes(sourceRoot);
    const step = charDelay(total, baseMs);
    const cursor = document.createElement("span");
    cursor.className = "tw-cursor";
    cursor.textContent = "▌";
    target.appendChild(cursor);

    function place(dest, node) {
      if (dest === target) {
        dest.insertBefore(node, cursor);
      } else {
        dest.appendChild(node);
      }
    }

    async function walk(source, dest) {
      for (let i = 0; i < source.childNodes.length; i++) {
        const child = source.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent;
          if (!text) continue;
          const live = document.createTextNode("");
          place(dest, live);
          for (let c = 0; c < text.length; c++) {
            live.textContent += text[c];
            scrollOut();
            await delay(step);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const clone = child.cloneNode(false);
          place(dest, clone);
          await walk(child, clone);
        }
      }
    }

    await walk(sourceRoot, target);
    cursor.remove();
  }

  function enqueuePrint(task) {
    printQueue = printQueue.then(task).catch(function (err) {
      console.error("Terminal print error:", err);
    });
    return printQueue;
  }

  function printInstant(html, className) {
    const p = document.createElement("p");
    p.className = "line" + (className ? " " + className : "");
    p.innerHTML = html;
    out.appendChild(p);
    scrollOut();
  }

  async function printTyped(html, className) {
    const p = document.createElement("p");
    p.className = "line" + (className ? " " + className : "");
    out.appendChild(p);
    const src = document.createElement("div");
    src.innerHTML = html;
    await typewriterReveal(p, src, TYPEWRITER_BASE_MS);
    scrollOut();
  }

  async function printBlockTyped(html, className) {
    const block = document.createElement("pre");
    block.className = "line" + (className ? " " + className : "");
    out.appendChild(block);
    const src = document.createElement("div");
    src.innerHTML = html;
    await typewriterReveal(block, src, TYPEWRITER_BASE_MS);
    scrollOut();
  }

  function print(html, className, opts) {
    const options = opts || {};
    if (options.instant) {
      printInstant(html, className);
      return Promise.resolve();
    }
    return enqueuePrint(function () {
      return printTyped(html, className);
    });
  }

  function printBlock(html, className, opts) {
    const options = opts || {};
    if (options.instant) {
      const block = document.createElement("pre");
      block.className = "line" + (className ? " " + className : "");
      block.innerHTML = html;
      out.appendChild(block);
      scrollOut();
      return Promise.resolve();
    }
    return enqueuePrint(function () {
      return printBlockTyped(html, className);
    });
  }

  async function typeAsciiBanner() {
    const banner = document.getElementById("banner");
    if (!banner) return;
    const raw = banner.textContent.replace(/^\n+|\n+$/g, "");
    banner.textContent = "";

    const step = asciiCharDelay(raw.length);
    for (let i = 0; i < raw.length; i++) {
      banner.textContent += raw[i];
      await delay(step);
    }
  }

  function isInteractiveTarget(el) {
    if (!el || !el.closest) return false;
    return !!el.closest("#cmd, .input-wrap, .output--prompt-area, a, button, input, textarea");
  }

  function initSourceProtection() {
    document.addEventListener("contextmenu", function (e) {
      if (isInteractiveTarget(e.target)) return;
      e.preventDefault();
    });

    document.addEventListener("keydown", function (e) {
      const key = e.key.toLowerCase();
      if (
        key === "f12" ||
        (e.ctrlKey && e.shiftKey && /^(i|j|c|k|\.)$/.test(key)) ||
        ((e.ctrlKey || e.metaKey) && /^(u|s|p)$/.test(key))
      ) {
        e.preventDefault();
      }
    });

    document.addEventListener("dragstart", function (e) {
      if (isInteractiveTarget(e.target)) return;
      e.preventDefault();
    });
  }

  function updatePromptDisplay() {
    promptText.textContent = cwd + ">";
  }



  function cmdCls() {
    stopMatrix();
    printQueue = Promise.resolve();
    out.innerHTML = "";
  }

  function cmdHelp() {
    print(
      [
        "<span class='ok'>Available commands:</span>",
        "  <span class='accent'>help</span>     show cmd",
        "  <span class='accent'>cls</span>      clear screen",
        "  <span class='accent'>echo</span>     print text (echo hello)",
        "  <span class='accent'>date</span>     current date/time",
        "  <span class='accent'>color</span>    default (red/black) or matrix",
        "  <span class='accent'>matrix</span>   toggle matrix",
        "  <span class='accent'>members</span>  list of verified members",
        "  <span class='accent'>links</span>    list of links",
        "",
      ].join("\n")
    );
  }

  function cmdEcho(rest) {
    print(escapeHtml(rest) || ".");
  }

  function cmdMembers() {
    const raw = MEMBERS_FILE.members || [];
    const rows = raw.slice(0, MEMBERS_MAX);

    let html = "";
    html += `<span class="members-file__path">${escapeHtml(MEMBERS_FILE.path || "MEMBERS.LST")}</span>\n`;
    if (MEMBERS_FILE.subtitle) {
      html += `<span class="dim">${escapeHtml(MEMBERS_FILE.subtitle)}</span>\n`;
    }

    if (rows.length === 0) {
      html += `<span class="dim">  (empty file — add objects to MEMBERS_FILE.members)</span>\n`;
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};
        const name = String(r.name != null ? r.name : "");
        const branch = i === rows.length - 1 ? "└── " : "├── ";
        html += `<span class="dim">${escapeHtml(branch)}</span><span class="ok">${escapeHtml(name)}</span>\n`;
      }
    }

    printBlock(html, "members-file");
  }

  function cmdLinks() {
    const rows = LINKS_FILE.links || [];

    let html = "";
    html += `<span class="links-file__path">${escapeHtml(LINKS_FILE.path || "LINKS.URL")}</span>\n`;
    if (LINKS_FILE.subtitle) {
      html += `<span class="dim">${escapeHtml(LINKS_FILE.subtitle)}</span>\n`;
    }

    if (rows.length === 0) {
      html += `<span class="dim">  (empty — add rows to LINK_ENTRIES in script.js)</span>\n`;
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};
        const label = String(
          r.label != null ? r.label : r.name != null ? r.name : ""
        );
        const href = safeHref(r.url);
        const urlText = String(r.url != null ? r.url : "");
        const branch = i === rows.length - 1 ? "└── " : "├── ";
        const labelHtml = href
          ? `<a class="links-file__link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || urlText)}</a>`
          : `<span class="warn">${escapeHtml(label || "(no label)")}</span>`;
        html += `<span class="dim">${escapeHtml(branch)}</span>${labelHtml} <span class="dim">${escapeHtml(urlText)}</span>\n`;
      }
    }

    printBlock(html, "links-file");
  }

  function cmdColor(parts) {
    stopMatrix();
    const sub = (parts[1] || "default").toLowerCase();
    if (THEMES[sub]) {
      applyTheme(sub);
      print(`<span class='ok'>Color scheme:</span> ${escapeHtml(sub)}`);
    } else {
      print(
        "<span class='err'>Unknown scheme.</span> Use: default, matrix",
        "err"
      );
    }
  }

  function cmdMatrix() {
    if (matrixTimer) {
      stopMatrix();
      applyTheme("default");
      print("<span class='ok'>Matrix rain stopped.</span>");
      return;
    }

    applyTheme("matrix");
    const cols = Math.min(48, Math.floor(out.clientWidth / 9) || 32);
    const pre = document.createElement("pre");
    pre.className = "line matrix-rain";
    out.appendChild(pre);

    matrixTimer = setInterval(() => {
      let line = "";
      for (let i = 0; i < cols; i++) {
        const ch =
          MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const bright = Math.random() > 0.92;
        line += bright
          ? `<span style="color:var(--ok);text-shadow:0 0 6px var(--ok)">${ch}</span>`
          : `<span style="color:var(--dim)">${ch}</span>`;
      }
      pre.innerHTML =
        line +
        "<br/>" +
        pre.innerHTML.split("<br/>").slice(0, 18).join("<br/>");
      out.scrollTop = out.scrollHeight;
    }, 90);

    print(
      "<span class='ok'>type <span class='accent'>matrix</span> again to stop.</span>"
    );
  }

  function cmdUnknown(commandName) {
    print(
      `<span class='err'>'${escapeHtml(commandName)}' is not recognized as an internal or external command,</span>\n<span class='err'>operable program or batch file.</span>`
    );
  }

  /**
   * @param {string} raw - full input line
   */
  function run(raw) {
    const line = raw.trim();
    if (!line) return;

    enqueuePrint(async function () {
      await printTyped(
        `<span class="prompt">${escapeHtml(cwd)}&gt;</span> ${escapeHtml(line)}`
      );

      const parts = line.split(/\s+/);
      const head = parts[0].toLowerCase();
      const rest = parts.slice(1).join(" ");

      switch (head) {
        case "cls":
        case "clear":
          cmdCls();
          break;
        case "help":
        case "?":
          cmdHelp();
          break;
        case "echo":
          cmdEcho(rest);
          break;
        case "date":
        case "time":
          await printTyped(escapeHtml(new Date().toString()));
          break;
        case "color":
          cmdColor(parts);
          break;
        case "matrix":
          cmdMatrix();
          break;
        case "members":
          cmdMembers();
          break;
        case "links":
        case "link":
          cmdLinks();
          break;
        case "exit":
          await printTyped(
            "<span class='warn'>You cannot exit the browser from here. Close the tab instead.</span>"
          );
          break;
        default:
          cmdUnknown(parts[0]);
      }
    });
  }


  cmd.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const v = cmd.value;
      cmd.value = "";
      run(v);
    }
  });

  window.addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    cmd.focus();
    if (bgm && bgm.paused) {
      const p = bgm.play();
      if (p !== undefined) p.catch(function () {});
    }
  });

  cmd.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });

  initSourceProtection();
  cmd.focus();
  applyTheme("default");
  typeAsciiBanner();
  print(
    "<span class='dim'>@snz\nType </span><span class='accent'>help</span><span class='dim'> for commands.</span>"
  );
})();
