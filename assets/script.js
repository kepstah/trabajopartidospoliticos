const sectionIds = [
  "introduccion",
  "marco-teorico",
  "fichas-de-partidos",
  "comparacion-general",
  "conclusion",
  "fuentes"
];

const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const navLinks = document.querySelectorAll(".nav-link");
const contentSections = document.querySelectorAll("[data-content-source]");

const closeMenu = () => {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  mobileMenu.classList.add("invisible", "opacity-0", "pointer-events-none");
  mobileMenu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

const openMenu = () => {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  mobileMenu.classList.remove("invisible", "opacity-0", "pointer-events-none");
  mobileMenu.classList.add("is-open");
  menuToggle.setAttribute("aria-expanded", "true");
};

const initMenu = () => {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  const mobileMenuLinks = mobileMenu.querySelectorAll("a");

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) {
      return;
    }

    if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      closeMenu();
    }
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
};

const setActiveLink = (currentId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("is-active", isActive);
    link.classList.toggle("bg-surface", isActive);
    link.classList.toggle("text-ink", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const initSectionObserver = () => {
  const observedSections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!observedSections.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries[0]) {
        setActiveLink(visibleEntries[0].target.id);
      }
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0.2, 0.35, 0.5]
    }
  );

  observedSections.forEach((section) => {
    observer.observe(section);
  });
};

const renderSectionError = (section) => {
  const fallback = section.querySelector("[data-content-fallback]");

  if (fallback) {
    fallback.classList.remove("content-loading");
    fallback.classList.add("content-error");
    fallback.innerHTML = '<p class="text-base leading-7 text-slate">No se pudo cargar esta sección.</p>';
    return;
  }

  section.innerHTML = `
    <div class="mx-auto max-w-7xl">
      <div class="section-shell border-t border-line/80 pt-8">
        <div class="content-error rounded-[1.75rem] border border-line/80 bg-surface p-6 shadow-soft sm:p-8">
          <p class="text-base leading-7 text-slate">No se pudo cargar esta sección.</p>
        </div>
      </div>
    </div>
  `;
};

const loadSectionContent = async (section) => {
  const source = section.dataset.contentSource;

  if (!source) {
    section.removeAttribute("aria-busy");
    return;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error("content_not_found");
    }

    const markup = await response.text();
    if (!markup.trim()) {
      throw new Error("empty_content");
    }

    section.innerHTML = markup;
  } catch {
    renderSectionError(section);
  } finally {
    section.removeAttribute("aria-busy");
  }
};

const syncHashTarget = () => {
  const { hash } = window.location;
  if (!hash) {
    return;
  }

  const target = document.querySelector(hash);
  if (target) {
    const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
    window.scrollTo({ top: Math.max(targetTop, 0) });
  }
};

const init = async () => {
  initMenu();

  if (contentSections.length) {
    await Promise.all(Array.from(contentSections, loadSectionContent));
  }

  initSectionObserver();
  syncHashTarget();
};

init();
