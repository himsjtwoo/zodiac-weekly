(function () {
  const lots = window.LOTS || [];
  const byId = Object.fromEntries(lots.map((l) => [l.id, l]));
  const darkDeities = new Set(["綠度母"]);

  const $ = (id) => document.getElementById(id);
  const homeView = $("view-home");
  const resultView = $("view-result");
  const grid = $("lot-grid");
  const form = $("lot-form");
  const input = $("lot-input");
  const err = $("lot-error");
  const overlay = $("draw-overlay");
  const spinChar = $("spin-char");
  const toast = $("toast");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function buildGrid() {
    const frag = document.createDocumentFragment();
    lots.forEach((lot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.setAttribute("aria-label", "第" + pad(lot.id) + "籤 " + lot.char);
      btn.innerHTML =
        '<span class="n">第 ' + pad(lot.id) + " 籤</span>" +
        '<span class="c">' + escapeHtml(lot.char) + "</span>";
      btn.addEventListener("click", () => goTo(lot.id));
      frag.appendChild(btn);
    });
    grid.appendChild(frag);
  }

  function goTo(id, opts) {
    const n = Number(id);
    if (!byId[n]) return;
    if (opts && opts.animate) {
      playDraw(n);
      return;
    }
    if (location.hash !== "#" + pad(n)) {
      location.hash = pad(n);
    } else {
      renderLot(n);
    }
  }

  function playDraw(finalId) {
    overlay.classList.add("show");
    const chars = lots.map((l) => l.char);
    let i = 0;
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const t = now - start;
      spinChar.textContent = chars[i % chars.length];
      i += 1;
      if (t < duration) {
        setTimeout(() => requestAnimationFrame(tick), 40);
      } else {
        spinChar.textContent = byId[finalId].char;
        setTimeout(() => {
          overlay.classList.remove("show");
          location.hash = pad(finalId);
        }, 260);
      }
    }
    requestAnimationFrame(tick);
  }

  function showHome() {
    resultView.classList.remove("active");
    homeView.classList.add("active");
    err.textContent = "";
    document.title = "論緣堂｜二十四字心籤";
    window.scrollTo(0, 0);
  }

  function renderLot(id) {
    const lot = byId[id];
    if (!lot) {
      showHome();
      return;
    }
    homeView.classList.remove("active");
    resultView.classList.add("active");
    document.title = "第 " + pad(lot.id) + " 籤　" + lot.char + "｜論緣堂二十四字心籤";

    $("lot-no").textContent = "第 " + pad(lot.id) + " 籤";
    $("lot-char").textContent = lot.char;
    $("lot-verse").innerHTML = lot.verse.map(escapeHtml).join("<br>");

    const card = $("deity-card");
    card.classList.toggle("is-dark", darkDeities.has(lot.deity));
    const img = $("deity-img");
    const src = lot.deity_file;
    if (img.getAttribute("src") !== src) {
      img.removeAttribute("src");
      img.src = src;
    }
    img.alt = lot.deity;
    $("deity-name").textContent = "本尊：" + lot.deity;

    $("g-family").textContent = lot.guidance["家庭"];
    $("g-relation").textContent = lot.guidance["關係"];
    $("g-self").textContent = lot.guidance["自身"];
    $("wisdom").textContent = lot.wisdom;
    $("weekly").textContent = lot.weekly;
    $("crystal-name").textContent = lot.crystal;
    $("crystal-cat").textContent = lot.category;
    $("crystal-text").textContent = lot.crystal_text;
    $("crystal-link").href = lot.collection_url;
    $("crystal-link").textContent = "你可能需要的緣拾是…";

    $("copy-btn").onclick = function () {
      const lines = [
        "論緣堂｜二十四字心籤",
        "第 " + pad(lot.id) + " 籤　" + lot.char,
        lot.verse.join("\n"),
        "本尊：" + lot.deity,
        location.href.split("#")[0] + "#" + pad(lot.id),
      ];
      const text = lines.join("\n");
      const done = function () { showToast("已複製"); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          fallbackCopy(text, done);
        });
      } else {
        fallbackCopy(text, done);
      }
    };

    window.scrollTo(0, 0);
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  function route() {
    const raw = (location.hash || "").replace(/^#/, "");
    const n = parseInt(raw, 10);
    if (raw && byId[n]) renderLot(n);
    else showHome();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const n = parseInt((input.value || "").trim(), 10);
    if (!byId[n]) {
      err.textContent = "請輸入 1 到 24 的籤號";
      return;
    }
    err.textContent = "";
    goTo(n);
  });

  $("draw-btn").addEventListener("click", function () {
    const n = lots[Math.floor(Math.random() * lots.length)].id;
    goTo(n, { animate: true });
  });

  $("back-btn").addEventListener("click", function () {
    location.hash = "";
  });
  $("again-btn").addEventListener("click", function () {
    location.hash = "";
  });

  buildGrid();
  route();
  window.addEventListener("hashchange", route);
})();
