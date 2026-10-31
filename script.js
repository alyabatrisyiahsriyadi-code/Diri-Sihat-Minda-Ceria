/* =========================================================
   SIHAT DIRI, CERIA MINDA — Interactive Script (Vanilla JS)
   ========================================================= */

(() => {
  'use strict';

  // Enable JS-dependent reveal styles safely
  document.documentElement.classList.remove('no-js');

  /* ---------- 1. Footer Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- 2. Sticky Navbar, Mobile Menu & Scroll Spy ---------- */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const backTopBtn = document.getElementById('backTop');

  const closeMobileMenu = () => {
    if (!navToggle || !navMenu) return;
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Buka menu');
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });

    document.addEventListener('click', (event) => {
      if (
        navMenu.classList.contains('open') &&
        navbar &&
        !navbar.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMobileMenu();
        navToggle.focus();
      }
    });
  }

  // Map nav links to their target sections for scroll-spy
  const trackedSections = navLinks
    .map((link) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return null;
      const section = document.querySelector(targetId);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const updateOnScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;

    if (navbar) {
      navbar.classList.toggle('scrolled', scrollY > 16);
    }

    if (backTopBtn) {
      backTopBtn.classList.toggle('show', scrollY > 420);
    }

    if (trackedSections.length === 0) return;

    const offset = scrollY + 140;
    const nearBottom =
      window.innerHeight + scrollY >=
      document.documentElement.scrollHeight - 40;

    let activeEntry = trackedSections[0];

    if (nearBottom) {
      activeEntry = trackedSections[trackedSections.length - 1];
    } else {
      for (const entry of trackedSections) {
        if (entry.section.offsetTop <= offset) {
          activeEntry = entry;
        }
      }
    }

    trackedSections.forEach(({ link }) => {
      link.classList.toggle('active', link === activeEntry.link);
    });
  };

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  updateOnScroll();

  if (backTopBtn) {
    backTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 3. Scroll Reveal Animations ---------- */
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el, index) => {
      // Gentle stagger within multi-card grids
      const parent = el.parentElement;
      if (
        parent &&
        (parent.classList.contains('importance-grid') ||
          parent.classList.contains('strategy-grid') ||
          parent.classList.contains('wash-grid'))
      ) {
        const siblingIndex = Array.from(parent.children).indexOf(el);
        el.style.transitionDelay = `${siblingIndex * 70}ms`;
      } else if (index === 0) {
        el.style.transitionDelay = '0ms';
      }
      revealObserver.observe(el);
    });
  }

  /* ---------- 4. Interactive Daily Health Checklist ---------- */
  const STORAGE_KEY = 'sihatMinda_checklist_v1';
  const checklistEl = document.getElementById('checklist');
  const checkScoreEl = document.getElementById('checkScore');
  const scorePillEl = document.getElementById('scorePill');
  const progressRingEl = document.getElementById('progressRing');
  const progressFillEl = document.getElementById('progressFill');
  const checkMessageEl = document.getElementById('checkMessage');
  const resetChecklistBtn = document.getElementById('resetChecklist');

  const getChecklistMessage = (done, total) => {
    if (done === 0) return 'Jom mulakan rutin sihat anda hari ini! 🌱';
    if (done <= 2) return 'Permulaan yang baik! Teruskan langkah kecil anda. ✨';
    if (done <= 5) return 'Separuh jalan! Konsistensi kunci kesejahteraan. 💪';
    if (done < total) return 'Hampir lengkap! Sedikit sahaja lagi untuk hari sempurna. 🌟';
    return 'Syabas! Semua 8 rutin kesihatan harian lengkap hari ini! 🎉';
  };

  if (checklistEl) {
    const checkboxes = Array.from(
      checklistEl.querySelectorAll('input[type="checkbox"]')
    );
    const totalItems = checkboxes.length;

    const saveChecklistState = () => {
      try {
        const state = checkboxes.map((cb) => cb.checked);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage errors in restricted / private contexts
      }
    };

    const loadChecklistState = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === totalItems) {
          checkboxes.forEach((cb, idx) => {
            cb.checked = Boolean(parsed[idx]);
          });
        }
      } catch {
        // Ignore malformed or inaccessible storage
      }
    };

    const renderChecklist = (animateScore = false) => {
      let completed = 0;

      checkboxes.forEach((cb) => {
        const itemLabel = cb.closest('.check-item');
        if (cb.checked) {
          completed += 1;
        }
        if (itemLabel) {
          itemLabel.classList.toggle('is-checked', cb.checked);
        }
      });

      const scoreText = `${completed}/${totalItems}`;
      const percentage = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

      if (checkScoreEl) {
        checkScoreEl.textContent = scoreText;
        if (animateScore) {
          checkScoreEl.classList.remove('bump');
          void checkScoreEl.offsetWidth; // Reflow to restart animation
          checkScoreEl.classList.add('bump');
        }
      }

      if (scorePillEl) {
        scorePillEl.textContent = scoreText;
      }

      if (progressRingEl) {
        progressRingEl.style.setProperty('--p', String(percentage));
      }

      if (progressFillEl) {
        progressFillEl.style.width = `${percentage}%`;
      }

      if (checkMessageEl) {
        checkMessageEl.textContent = getChecklistMessage(completed, totalItems);
      }
    };

    loadChecklistState();
    renderChecklist(false);

    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        renderChecklist(true);
        saveChecklistState();
      });
    });

    if (resetChecklistBtn) {
      resetChecklistBtn.addEventListener('click', () => {
        checkboxes.forEach((cb) => {
          cb.checked = false;
        });
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
        renderChecklist(true);
      });
    }
  }

  /* ---------- 5. Interactive Quiz Engine ---------- */
  const quizForm = document.getElementById('quizForm');
  const quizResult = document.getElementById('quizResult');
  const quizResetBtn = document.getElementById('quizReset');

  if (quizForm && quizResult) {
    const questionCards = Array.from(
      quizForm.querySelectorAll('.quiz-question')
    );
    const allRadios = Array.from(
      quizForm.querySelectorAll('input[type="radio"]')
    );

    const clearGradingStyles = () => {
      quizForm.classList.remove('checked');
      questionCards.forEach((card) => {
        card.classList.remove('unanswered');
        card.querySelectorAll('.q-option').forEach((opt) => {
          opt.classList.remove('correct', 'wrong');
        });
      });
      quizResult.className = 'quiz-result';
      quizResult.innerHTML = '';
    };

    // Highlight selected radio option & clear stale warning state
    allRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const card = radio.closest('.quiz-question');
        if (!card) return;

        // If user modifies an answer after checking, clear old grading badges
        if (quizForm.classList.contains('checked')) {
          clearGradingStyles();
        }

        card.classList.remove('unanswered');
        card.querySelectorAll('.q-option').forEach((opt) => {
          const input = opt.querySelector('input[type="radio"]');
          opt.classList.toggle('selected', Boolean(input && input.checked));
        });

        if (quizResult.classList.contains('warn')) {
          quizResult.className = 'quiz-result';
          quizResult.textContent = '';
        }
      });
    });

    quizForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // Clear previous marks before evaluating
      clearGradingStyles();

      const totalQuestions = questionCards.length;
      const unansweredCards = [];

      questionCards.forEach((card) => {
        const selected = card.querySelector('input[type="radio"]:checked');
        if (!selected) {
          unansweredCards.push(card);
        }
      });

      // Prompt user gently if any question has not been answered yet
      if (unansweredCards.length > 0) {
        const answeredCount = totalQuestions - unansweredCards.length;
        unansweredCards.forEach((card) => {
          card.classList.remove('unanswered');
          void card.offsetWidth;
          card.classList.add('unanswered');
        });

        quizResult.className = 'quiz-result warn show';
        quizResult.textContent = `⚠️ Sila jawab semua soalan terlebih dahulu (${answeredCount}/${totalQuestions} dijawab).`;

        unansweredCards[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }

      // Grade all questions
      let score = 0;

      questionCards.forEach((card) => {
        const correctVal = (card.dataset.answer || '').trim().toUpperCase();
        const options = Array.from(card.querySelectorAll('.q-option'));
        const selectedInput = card.querySelector('input[type="radio"]:checked');
        const selectedVal = selectedInput
          ? selectedInput.value.trim().toUpperCase()
          : '';

        if (selectedVal === correctVal) {
          score += 1;
        }

        options.forEach((opt) => {
          const input = opt.querySelector('input[type="radio"]');
          if (!input) return;
          const val = input.value.trim().toUpperCase();

          if (val === correctVal) {
            opt.classList.add('correct');
          } else if (input.checked && val !== correctVal) {
            opt.classList.add('wrong');
          }
        });
      });

      quizForm.classList.add('checked');

      let feedback = '';
      if (score === totalQuestions) {
        feedback = 'Syabas! Semua jawapan tepat! 🎉';
      } else if (score === totalQuestions - 1) {
        feedback = 'Bagus! Hampir sempurna! 👏';
      } else if (score >= Math.ceil(totalQuestions / 2)) {
        feedback = 'Usaha yang baik! Semak semula jawapan berwarna merah. 💪';
      } else {
        feedback = 'Jangan putus asa! Ulang kaji nota di atas dan cuba lagi. 🌱';
      }

      quizResult.className = 'quiz-result show';
      quizResult.innerHTML = `Markah anda: <span class="score">${score}/${totalQuestions}</span>! ${feedback}`;
    });

    if (quizResetBtn) {
      quizResetBtn.addEventListener('click', () => {
        quizForm.reset();
        clearGradingStyles();
        questionCards.forEach((card) => {
          card.querySelectorAll('.q-option').forEach((opt) => {
            opt.classList.remove('selected');
          });
        });
      });
    }
  }
})();

