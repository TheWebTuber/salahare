
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    gallery: $("gallery"),
    count: $("gallery-count"),
    status: $("status"),
    search: $("search"),
    sort: $("sort"),
    empty: $("empty"),
    emptyTitle: $("empty-title"),
    emptyDesc: $("empty-desc"),
    preview: $("preview"),
    previewImg: $("preview-img"),
    previewName: $("preview-name"),
    previewFilename: $("preview-filename"),
    previewOpen: $("preview-open"),
    toast: $("toast"),
  };

  const state = {
    files: [],
    filter: "all",
    query: "",
    sort: "az",
    active: null,
    error: false,
  };

  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  const allowed = /\.(gif|apng|png|webp|jpe?g|avif)$/i;
  const animated = /\.(gif|apng)$/i;

  let toastTimer;

  // ==========================================
  // NAVIGATION
  // ==========================================

  const menuButton = $("nav-toggle");

  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const opened =
        menuButton.getAttribute("aria-expanded") !== "true";

      menuButton.setAttribute("aria-expanded", String(opened));

      const nav = $("primary-nav");
      if (nav) nav.dataset.open = String(opened);
    });

    document.querySelectorAll("#primary-nav a").forEach((a) => {
      a.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");

        const nav = $("primary-nav");
        if (nav) nav.dataset.open = "false";
      });
    });
  }

  // ==========================================
  // FILE VALIDATION
  // ==========================================

  function validFile(file) {
    return (
      typeof file === "string" &&
      file.length > 0 &&
      file.length <= 240 &&
      !file.startsWith(".") &&
      !/[\/\\\u0000-\u001f]/.test(file) &&
      allowed.test(file)
    );
  }

  // ==========================================
  // FILE PATHS
  // ==========================================

  // Correct layout:
  //
  // index.html
  // emotes.html
  // emotes.json
  // emotes/
  //   example.gif
  // css/
  // js/
  //   emotes.js

  function fullUrl(file) {
    return new URL(
      "emotes/" + encodeURIComponent(file),
      window.location.href
    ).href;
  }

  // ==========================================
  // EMOTE NAMES
  // ==========================================

  function readable(file) {
    return file
      .replace(allowed, "")
      .replace(/_\d{4}-\d\d-\d\d-\d\d-\d\d-\d\d$/, "")
      .replace(/^texture_/i, "")
      .replace(/_+/g, " · ")
      .trim();
  }

  function fileDate(file) {
    const m = file.match(
      /(\d{4})-(\d\d)-(\d\d)-(\d\d)-(\d\d)-(\d\d)/
    );

    return m ? m.slice(1).join("") : "";
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================

  function showToast(message) {
    if (!els.toast) return;

    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2400);
  }

  // ==========================================
  // COPY DIRECT GIF LINK
  // ==========================================

  async function copyUrl(url) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");

        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;left:-9999px;top:0";

        document.body.append(ta);
        ta.select();

        const ok = document.execCommand("copy");
        ta.remove();

        if (!ok) {
          throw new Error("Clipboard unavailable");
        }
      }

      showToast("Link copied to clipboard! ✦");
      return true;

    } catch (error) {
      console.error("[Salahare emotes] Copy failed:", error);

      showToast(
        "Could not copy automatically. Open the image to copy its URL."
      );

      return false;
    }
  }

  // ==========================================
  // FULL-SIZE PREVIEW
  // ==========================================

  function openPreview(file) {
    state.active = file;

    const url = fullUrl(file);

    if (!els.preview) {
      window.open(url, "_blank", "noopener");
      return;
    }

    els.previewImg.src = url;
    els.previewImg.alt = readable(file);

    els.previewName.textContent = readable(file);
    els.previewFilename.textContent = file;
    els.previewOpen.href = url;

    if (typeof els.preview.showModal === "function") {
      els.preview.showModal();
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  // ==========================================
  // CREATE EMOTE CARD
  // ==========================================

  function makeCard(file) {
    const card = document.createElement("article");
    card.className = "emote-card";

    // Preview button
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "emote-preview-btn";

    preview.setAttribute(
      "aria-label",
      "Preview " + readable(file)
    );

    // Emote image
    const img = document.createElement("img");

    img.src = fullUrl(file);
    img.alt = readable(file);
    img.loading = "lazy";
    img.decoding = "async";

    preview.append(img);

    preview.addEventListener("click", () => {
      openPreview(file);
    });

    // Details
    const details = document.createElement("div");
    details.className = "emote-details";

    const h3 = document.createElement("h3");
    h3.className = "emote-title";
    h3.textContent = readable(file);
    h3.title = file;

    const meta = document.createElement("div");
    meta.className = "emote-meta";

    meta.textContent = animated.test(file)
      ? "Animated emote"
      : "Image emote";

    // Actions
    const actions = document.createElement("div");
    actions.className = "emote-actions";

    // Copy button
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-button";
    copy.textContent = "Copy link";

    copy.setAttribute(
      "aria-label",
      "Copy link for " + readable(file)
    );

    copy.addEventListener("click", () => {
      copyUrl(fullUrl(file));
    });

    // Open image button
    const open = document.createElement("a");
    open.className = "open-button";
    open.textContent = "Open ↗";
    open.href = fullUrl(file);
    open.target = "_blank";
    open.rel = "noopener noreferrer";

    actions.append(copy, open);
    details.append(h3, meta, actions);
    card.append(preview, details);

    return card;
  }

  // ==========================================
  // DISPLAY EMOTES
  // ==========================================

  function display() {
    let items = state.files.filter((file) => {
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "animated"
          ? animated.test(file)
          : !animated.test(file));

      const matchesSearch = file
        .toLowerCase()
        .includes(state.query);

      return matchesFilter && matchesSearch;
    });

    // Sort emotes
    if (state.sort === "az") {
      items.sort(collator.compare);

    } else if (state.sort === "za") {
      items.sort((a, b) => collator.compare(b, a));

    } else {
      items.sort((a, b) => {
        return (
          fileDate(b).localeCompare(fileDate(a)) ||
          collator.compare(b, a)
        );
      });
    }

    // Clear previous cards
    els.gallery.replaceChildren();

    // Insert new cards
    const fragment = document.createDocumentFragment();

    for (const file of items) {
      fragment.append(makeCard(file));
    }

    els.gallery.append(fragment);

    // Update counter
    els.count.textContent = state.files.length
      ? `Showing ${items.length} of ${state.files.length} emotes`
      : "No emotes uploaded yet";

    // Update status
    els.status.textContent = state.error
      ? "Unable to read emotes.json — check the file path."
      : state.files.length
        ? `${items.length} matching emotes found`
        : "Waiting for the first treasures…";

    // Empty state
    els.empty.hidden = items.length > 0;

    if (!items.length) {
      const filtered = state.files.length > 0;

      els.emptyTitle.textContent = state.error
        ? "Could not load the collection"
        : filtered
          ? "No matching emotes"
          : "The cove is waiting for emotes";

      els.emptyDesc.textContent = state.error
        ? "Check that emotes.json exists beside emotes.html and contains valid JSON."
        : filtered
          ? "Try another search or clear the filters."
          : "Add your GIFs to the emotes/ folder and list their filenames in emotes.json.";

      $("clear-filters").hidden = !filtered;
    }
  }

  // ==========================================
  // LOAD JSON FILE
  // ==========================================

  async function load() {
    els.status.textContent = "Looking for emotes in the cove…";

    $("refresh").disabled = true;

    try {
      // JSON is located beside emotes.html
      const response = await fetch("emotes.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status + " loading emotes.json"
        );
      }

      const result = await response.json();

      // Support a plain array or an object with files array
      const list = Array.isArray(result)
        ? result
        : result && Array.isArray(result.files)
          ? result.files
          : null;

      if (!list) {
        throw new Error(
          "Invalid JSON: expected an array of filenames"
        );
      }

      // Remove invalid filenames and duplicates
      state.files = [
        ...new Set(list.filter(validFile))
      ];

      state.error = false;

      console.log(
        "[Salahare emotes] Loaded",
        state.files.length,
        "emotes"
      );

    } catch (error) {
      console.error("[Salahare emotes]", error);

      state.error = true;
      state.files = [];

    } finally {
      $("refresh").disabled = false;
      display();
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  els.search.addEventListener("input", () => {
    state.query = els.search.value.trim().toLowerCase();
    display();
  });

  // ==========================================
  // SORT
  // ==========================================

  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    display();
  });

  // ==========================================
  // FILTERS
  // ==========================================

  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;

      document.querySelectorAll(".filter").forEach((b) => {
        const active = b === btn;

        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      display();
    });
  });

  // ==========================================
  // REFRESH BUTTON
  // ==========================================

  $("refresh").addEventListener("click", load);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  $("clear-filters").addEventListener("click", () => {
    els.search.value = "";
    els.sort.value = "az";

    state.query = "";
    state.sort = "az";

    const allFilter = document.querySelector(
      '.filter[data-filter="all"]'
    );

    if (allFilter) {
      allFilter.click();
    } else {
      state.filter = "all";
      display();
    }
  });

  // ==========================================
  // PREVIEW CONTROLS
  // ==========================================

  $("preview-close").addEventListener("click", () => {
    els.preview.close();
  });

  $("preview-copy").addEventListener("click", () => {
    if (state.active) {
      copyUrl(fullUrl(state.active));
    }
  });

  els.preview.addEventListener("click", (event) => {
    if (event.target === els.preview) {
      els.preview.close();
    }
  });

  // ==========================================
  // INITIALIZE
  // ==========================================

  load();

})();
