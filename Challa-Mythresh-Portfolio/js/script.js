/* =========================================================
   Challa Mythresh — portfolio
   Vanilla JS + GSAP/ScrollTrigger + Lenis.
   Magic UI patterns re-implemented here: Marquee, NumberTicker,
   TextReveal, WordRotate, Dock, BlurFade (BorderBeam and
   ShimmerButton are pure CSS in style.css).
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'
  if (hasGsap) gsap.registerPlugin(ScrollTrigger)

  /* ---------- smooth scroll ---------- */
  let lenis = null
  if (!reduced && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: typeof target === 'number' ? 0 : -10 })
    else if (typeof target === 'number') window.scrollTo(0, target)
    else target.scrollIntoView()
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')
      const el = id === '#top' ? null : $(id)
      if (id !== '#top' && !el) return
      e.preventDefault()
      scrollTo(id === '#top' ? 0 : el)
      const focusTarget = el || $('#main')
      focusTarget.setAttribute('tabindex', '-1')
      focusTarget.focus({ preventScroll: true })
    }),
  )

  /* ---------- text splitting ---------- */
  // hero name: one span per letter so each can move in 3D
  $$('[data-split]').forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c}</span>`).join('')
  })
  // about lede and mission: one masked span per word
  $$('.split-reveal').forEach((el) => {
    const t = el.textContent.trim()
    el.setAttribute('aria-label', t)
    el.innerHTML = t.split(/\s+/).map((w) => `<span class="wd" aria-hidden="true"><span>${w}</span></span>`).join(' ')
  })
  const rt = $('.reveal-text')
  if (rt) {
    const text = rt.textContent.trim()
    rt.setAttribute('aria-label', text)
    rt.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ')
  }

  /* ---------- tech stack cylinder tiles ---------- */
  const RING = [["tensorflow", "TensorFlow"], ["python", "Python"], ["java", "Java"], ["cplusplus", "C++"], ["javascript", "JavaScript"], ["html5", "HTML"], ["css3", "CSS"], ["fastapi", "FastAPI"], ["flask", "Flask"], ["spring", "Spring Boot"], ["maven", "Maven"], ["react", "React"], ["vite", "Vite"], ["tailwind", "Tailwind CSS"], ["reactrouter", "React Router"], ["mysql", "MySQL"], ["mlflow", "MLflow"], ["docker", "Docker"], ["githubactions", "GitHub Actions"], ["git", "Git"], ["github", "GitHub"], ["postman", "Postman"]]
  const ring = $('.orbit__ring')
  function layoutRing() {
    if (!ring) return
    const small = innerWidth <= 860
    const tile = small ? 64 : 92
    const n = RING.length
    // radius so tiles sit edge to edge with a little air
    const R = Math.round(((tile + (small ? 8 : 18)) / 2) / Math.tan(Math.PI / n))
    ring.innerHTML = RING.map(([k, name], i) =>
      `<div class="orbit__tile" style="transform: rotateY(${(360 / n) * i}deg) translateZ(${R}px)"><img src="assets/tech/${k}.svg" alt="" width="48" height="48" /><span>${name}</span></div>`,
    ).join('')
  }
  layoutRing()

  /* ---------- logo cards: keyboard focus + screen-reader note ---------- */
  $$('.logo').forEach((li) => {
    li.tabIndex = 0
    const sr = document.createElement('span')
    sr.className = 'sr-only'
    sr.textContent = `: ${li.dataset.note}`
    li.appendChild(sr)
  })

  /* ---------- preloader ---------- */
  const loader = $('.loader')
  const loadNum = $('#loadNum')
  async function boot() {
    document.body.classList.add('is-loading')
    lenis && lenis.stop()
    if (!reduced) {
      const t0 = performance.now()
      await new Promise((done) => {
        const tick = () => {
          const p = Math.min(1, (performance.now() - t0) / 1300)
          const eased = 1 - Math.pow(1 - p, 3)
          loadNum && (loadNum.textContent = String(Math.round(eased * 100)).padStart(3, '0'))
          p < 1 ? requestAnimationFrame(tick) : done()
        }
        requestAnimationFrame(tick)
      })
    }
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    reveal()
  }

  function reveal() {
    document.body.classList.remove('is-loading')
    lenis && lenis.start()
    if (!hasGsap || reduced) {
      loader && loader.remove()
      initScroll()
      return
    }
    gsap.timeline()
      .to('.loader__logo', { scale: 0.6, rotate: -14, opacity: 0, duration: 0.6, ease: 'power3.in' })
      .to('.loader__name span', { yPercent: -110, stagger: 0.06, duration: 0.6, ease: 'power3.in' }, '<')
      .to('.loader__count', { opacity: 0, duration: 0.3 }, '<')
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.inOut' })
      .add(() => loader.remove())
      // letters flip up out of the floor
      .from('.hero__word .ch', { yPercent: 115, rotateX: -90, transformPerspective: 800, transformOrigin: '50% 100%', duration: 1.1, stagger: 0.035, ease: 'expo.out', onComplete: tx('.hero__word .ch') }, '-=0.35')
      // the rule draws out from the centre, then the columns and the statement follow
      .from('.hero__rule span', { scaleX: 0, duration: 1.3, ease: 'expo.inOut' }, '<0.25')
      .from('.hero__cols li', { y: 18, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'expo.out' }, '-=0.6')
      .from('.hero__mark', { opacity: 0, x: -10, duration: 0.6, ease: 'expo.out' }, '<0.2')
      .from('.hero__statement .wd > span', { yPercent: 110, duration: 0.9, stagger: 0.025, ease: 'expo.out' }, '<')
      .from('.topbar, .dock', { opacity: 0, y: -10, duration: 0.6 }, '<0.2')
      .from('.hero__scroll', { opacity: 0, y: 12, duration: 0.8, ease: 'expo.out' }, '<0.2')
      .add(initScroll, '<')
  }

  /* hover transitions on transformed elements switch on only after their GSAP intro (see .tx in style.css) */
  const TX = '.hero__word .ch, .icon3d, .logo'
  const tx = (els) => () => (Array.isArray(els) ? els : $$(els)).forEach((e) => e.classList.add('tx'))
  if (reduced || !hasGsap) tx(TX)()

  /* ---------- scroll-driven pieces (GSAP) ---------- */
  function initScroll() {
    if (!hasGsap) return
    const mm = gsap.matchMedia()
    const words = $$('.reveal-text .w')
    if (!reduced && words.length) {
      ScrollTrigger.create({
        trigger: '.mission', start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: (s) => {
          const n = Math.round(s.progress * 1.15 * words.length)
          words.forEach((w, i) => w.classList.toggle('on', i < n))
        },
      })
    }
    if (reduced) return

    const P = { transformPerspective: 1200 }
    // stat tiles, link cards and logos sit below the fold when the page loads
    gsap.set(['.icon3d', '.logo'], { transformPerspective: 1200 })

    /* hero: the name tilts back into the floor as you scroll away */
    // scrolling away: the name lifts and opens up slightly, the rule shrinks back, the rest fades
    gsap.to('.hero__title', { ...P, rotateX: 22, y: -70, letterSpacing: '-0.02em', opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '80% top', scrub: true } })
    gsap.to('.hero__rule span', { scaleX: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '10% top', end: '70% top', scrub: true } })
    gsap.to(['.hero__cols', '.hero__statement'], { y: -40, opacity: 0, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: '.hero', start: '10% top', end: '60% top', scrub: true } })

    /* section headings stand up out of the page */
    $$('.section__head .label, .bring__title').forEach((el) =>
      gsap.from(el, { ...P, rotateX: -75, y: 60, opacity: 0, transformOrigin: '50% 100%', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }),
    )
    /* everything else eases up out of a blur: section notes, eyebrows, the closing CTA and the footer */
    $$('.section__note, .eyebrow, .findme__k, .cta .label, .cta__text, .cta__actions .btn-shimmer, .cv-cta, .footer__row > p').forEach((el) =>
      gsap.from(el, { y: 28, opacity: 0, filter: 'blur(6px)', duration: 1, ease: 'expo.out', clearProps: 'transform,filter', scrollTrigger: { trigger: el, start: 'top 94%' } }),
    )
    gsap.from('.socials li', { y: 20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.socials', start: 'top 96%' } })
    gsap.from('.hack__index li', { x: -18, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '.hack__index', start: 'top 90%' } })
    $$('.ghost').forEach((g) =>
      gsap.fromTo(g, { xPercent: -50, x: 140 }, { x: -140, ease: 'none', scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }),
    )
    $$('.row, .exp__row').forEach((el) =>
      gsap.from(el, { ...P, rotateX: -40, y: 50, opacity: 0, transformOrigin: '50% 0%', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }),
    )

    /* about: lede words, 3D video card, beats and link cards */
    gsap.from('.about__lede .wd > span', { yPercent: 110, rotate: 4, duration: 1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '.about__lede', start: 'top 85%' } })
    gsap.fromTo('.about__media', { ...P, rotateY: -28, rotateX: 10, scale: 0.86 }, { rotateY: 0, rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 20%', scrub: true } })
    $$('.beat').forEach((b) =>
      gsap.from(b, { ...P, rotateX: -60, y: 40, opacity: 0, transformOrigin: '50% 0%', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 88%' } }),
    )
    gsap.from('.icon3d', { ...P, rotateY: -90, scale: 0.6, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'back.out(1.6)', onComplete: tx('.icon3d'), scrollTrigger: { trigger: '.findme', start: 'top 88%' } })

    /* tech stack: the cylinder spins as you scroll; desktop pins it */
    if (ring) {
      mm.add('(min-width: 861px)', () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.orbit', start: 'center center', end: '+=140%', pin: true, scrub: 0.6 } })
        tl.fromTo(ring, { rotateY: 0, rotateX: -12 }, { rotateY: -360, rotateX: -4, ease: 'none' })
          .fromTo('.orbit__core', { scale: 0.8, opacity: 0.4 }, { scale: 1, opacity: 1, ease: 'none' }, 0)
        return () => tl.kill()
      })
      mm.add('(max-width: 860px)', () => {
        const t = gsap.fromTo(ring, { rotateY: 40 }, { rotateY: -320, ease: 'none', scrollTrigger: { trigger: '.orbit', start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
        return () => t.kill()
      })
    }
    $$('.family').forEach((f) => {
      gsap.from(f, { ...P, rotateX: -18, y: 70, opacity: 0, transformOrigin: '50% 0%', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 90%' } })
      gsap.from($$('.logo', f), { ...P, rotateX: -80, y: 30, opacity: 0, transformOrigin: '50% 0%', duration: 0.9, stagger: 0.05, ease: 'expo.out', onComplete: tx($$('.logo', f)), scrollTrigger: { trigger: f, start: 'top 80%' } })
    })

    /* work: stacked cards tip backwards as the next one lands */
    mm.add('(min-width: 861px)', () => {
      const cases = $$('.case')
      cases.forEach((c, i) => {
        c.style.setProperty('--i', i)
        const next = cases[i + 1]
        if (!next) return
        gsap.to(c.querySelector('.case__card'), { ...P, scale: 0.93, rotateX: 7, ease: 'none', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 25%', scrub: true } })
      })
    })

    /* hackathon chapters */
    $$('.chapter').forEach((ch) => {
      gsap.from(ch.querySelector('.chapter__text').children, { y: 36, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: ch, start: 'top 75%' } })
      gsap.fromTo(ch.querySelector('.chapter__n'), { yPercent: 12 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } })
      $$('.shot', ch).forEach((s, i) => {
        gsap.fromTo(s, { ...P, rotateX: 24, y: 60, transformOrigin: '50% 100%' }, { rotateX: 0, y: 0, duration: 1.3, ease: 'expo.out', delay: (i % 2) * 0.08, scrollTrigger: { trigger: s, start: 'top 92%' } })
        gsap.fromTo(s.querySelector('.shot__btn'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', delay: (i % 2) * 0.08, scrollTrigger: { trigger: s, start: 'top 92%' } })
        gsap.fromTo(s.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 92%' } })
      })
    })
    mm.add('(min-width: 861px)', () => {
      $$('.chapter__media:not(.chapter__media--single):not(.chapter__media--stack) .shot').forEach((s, i) => {
        gsap.fromTo(s.querySelector('.shot__btn'), { y: i % 2 ? 50 : 0 }, { y: i % 2 ? -50 : 0, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    })

    /* experience timeline: the rail fills with scroll, each stage lights up and slides in from its side */
    gsap.to('.tl__fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 65%', end: 'bottom 65%', scrub: true } })
    $$('.tl__stage').forEach((st, i) => {
      const fromLeft = innerWidth > 860 && i % 2 === 0
      gsap.from(st.querySelector('.tl__card'), { ...P, x: innerWidth > 860 ? (fromLeft ? -60 : 60) : 30, rotateY: innerWidth > 860 ? (fromLeft ? 14 : -14) : 0, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: st, start: 'top 80%' } })
      gsap.from(st.querySelector('.tl__node'), { scale: 0, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: st, start: 'top 80%' } })
      ScrollTrigger.create({ trigger: st, start: 'top 65%', onEnter: () => st.classList.add('is-on'), onLeaveBack: () => st.classList.remove('is-on') })
    })

    /* experience panel lifts flat from a tilt */
    gsap.fromTo('.panel', { ...P, rotateX: 16, scale: 0.92, transformOrigin: '50% 100%' }, { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.experience', start: 'top bottom', end: 'top 30%', scrub: true } })

    $$('.cta__line').forEach((l) =>
      gsap.fromTo(l, { ...P, xPercent: 22 * Number(l.dataset.dir), rotateY: -20 * Number(l.dataset.dir) }, { xPercent: 0, rotateY: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } }),
    )

    $$('img[loading="lazy"]').forEach((img) => img.complete || img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }))
    ScrollTrigger.refresh()
  }

  /* ---------- Marquee: duplicate tracks for a seamless loop ---------- */
  $$('.marquee').forEach((m) => {
    const clone = m.querySelector('.marquee__track').cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    m.appendChild(clone)
  })

  /* ---------- NumberTicker (every .ticker counts up when it scrolls into view) ---------- */
  const fmtNum = (n, el) => {
    const d = Number(el.dataset.decimals || 0)
    const v = el.dataset.format === 'in' ? Math.round(n).toLocaleString('en-IN') : n.toFixed(d)
    return (el.dataset.prefix || '') + v + (el.dataset.suffix || '')
  }
  function runTicker(el) {
    const to = Number(el.dataset.to)
    if (reduced) { el.textContent = fmtNum(to, el); return }
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1800)
      el.textContent = fmtNum(p === 1 ? to : to * (1 - Math.pow(2, -10 * p)), el)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  $$('.ticker').forEach((el) => (el.textContent = fmtNum(0, el)))
  const tickIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      runTicker(e.target)
      tickIO.unobserve(e.target)
    })
  }, { threshold: 0.4 })
  $$('.ticker').forEach((el) => tickIO.observe(el))

  /* ---------- BlurFade + case "in" states ---------- */
  const fadeIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); fadeIO.unobserve(e.target) }
    })
  }, { rootMargin: '0px 0px -12% 0px' })
  $$('.fade, .case').forEach((el, i) => {
    if (el.classList.contains('fade')) el.style.transitionDelay = `${(i % 3) * 0.1}s`
    fadeIO.observe(el)
  })


  /* ---------- Dock: magnification + active section ---------- */
  const dockItems = $$('.dock__item')
  if (fine && !reduced) {
    const BASE = 44, MAG = 64, DIST = 140
    const list = $('.dock__list')
    let mouseX = Infinity
    const sizes = dockItems.map(() => BASE)
    list.addEventListener('pointermove', (e) => (mouseX = e.clientX))
    list.addEventListener('pointerleave', () => (mouseX = Infinity))
    const loop = () => {
      dockItems.forEach((it, i) => {
        const r = it.getBoundingClientRect()
        const d = Math.abs(mouseX - (r.left + r.width / 2))
        const target = d > DIST ? BASE : BASE + (MAG - BASE) * (1 - d / DIST)
        sizes[i] += (target - sizes[i]) * 0.2
        it.style.width = it.style.height = sizes[i].toFixed(1) + 'px'
      })
      requestAnimationFrame(loop)
    }
    loop()
  }
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      dockItems.forEach((it) => {
        const on = it.getAttribute('href') === '#' + e.target.id
        it.classList.toggle('is-active', on)
        on ? it.setAttribute('aria-current', 'true') : it.removeAttribute('aria-current')
      })
      $$('.topbar__nav a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id))
    })
  }, { rootMargin: '-45% 0px -50% 0px' })
  ;['top', 'service', 'about', 'stack', 'work', 'hackathons', 'experience', 'contact'].forEach((id) => {
    const el = document.getElementById(id)
    el && secIO.observe(el)
  })

  /* ---------- hackathon chapter tracker (HUD + index) ---------- */
  const chapters = $$('.chapter')
  const hudN = $('.hack__hud-n'), hudName = $('.hack__hud-name'), hudBar = $('.hack__hud-bar i')
  const indexLinks = $$('.hack__index a')
  const chIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      const i = chapters.indexOf(e.target)
      hudN.textContent = String(i + 1).padStart(2, '0')
      hudName.textContent = e.target.dataset.name
      hudBar.style.transform = `scaleX(${(i + 1) / chapters.length})`
      indexLinks.forEach((a, k) => a.classList.toggle('is-active', k === i))
    })
  }, { rootMargin: '-40% 0px -55% 0px' })
  chapters.forEach((c) => chIO.observe(c))

  /* ---------- photo lightbox ---------- */
  const box = $('.lightbox')
  const boxImg = $('.lightbox__img'), boxCap = $('.lightbox__cap')
  const shots = $$('.shot')
  let shotIndex = 0, opener = null
  const largest = (img) => {
    const set = (img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    return set[set.length - 1] || img.src
  }
  function showShot(i) {
    shotIndex = (i + shots.length) % shots.length
    const fig = shots[shotIndex]
    const img = fig.querySelector('img')
    boxImg.src = largest(img)
    boxImg.alt = img.alt
    const chapter = fig.closest('.chapter')
    boxCap.textContent = `${chapter ? chapter.dataset.name + ' · ' : ''}${fig.querySelector('figcaption').textContent}`
  }
  shots.forEach((fig, i) =>
    fig.querySelector('.shot__btn').addEventListener('click', (e) => {
      opener = e.currentTarget
      showShot(i)
      if (box.showModal) box.showModal(); else box.setAttribute('open', '')
      lenis && lenis.stop()
    }),
  )
  const closeBox = () => box.open && box.close()
  box.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus() })
  $('.lightbox__close').addEventListener('click', closeBox)
  $('.lightbox__nav--prev').addEventListener('click', () => showShot(shotIndex - 1))
  $('.lightbox__nav--next').addEventListener('click', () => showShot(shotIndex + 1))
  box.addEventListener('click', (e) => { if (e.target === box) closeBox() })
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showShot(shotIndex - 1)
    if (e.key === 'ArrowRight') showShot(shotIndex + 1)
  })

  /* ---------- pointer-driven 3D: hero tilt + spotlight, about card tilt ---------- */
  if (fine && !reduced && hasGsap) {
    const hero = $('.hero__stage')
    // the scroll tween owns .hero__title's transform, so the mouse tilts the inner lines
    const lines = $$('.hero__title .line')
    gsap.set(lines, { transformPerspective: 1200 })
    const rx = gsap.quickTo(lines, 'rotationX', { duration: 0.8, ease: 'power3' })
    const ry = gsap.quickTo(lines, 'rotationY', { duration: 0.8, ease: 'power3' })
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      ry(nx * 10)
      rx(-ny * 8)
      hero.style.setProperty('--sx', `${(nx + 0.5) * 100}%`)
      hero.style.setProperty('--sy', `${(ny + 0.5) * 100}%`)
    })
    hero.addEventListener('pointerleave', () => { rx(0); ry(0) })

    const card = $('[data-tilt]')
    if (card) {
      const crx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' })
      const cry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' })
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        cry(nx * 14)
        crx(-ny * 12)
        card.style.setProperty('--glare', `${nx * 140}%`)
      })
      card.addEventListener('pointerleave', () => { crx(0); cry(0); card.style.setProperty('--glare', '-60%') })
    }
  }

  /* ---------- cursor + preview card ---------- */
  const PREVIEWS = {
    agents: `<div class="pv pv--dark"><span>AI & Machine Learning</span>
      <svg viewBox="0 0 260 130"><g stroke="#CEB3A6" fill="none"><path d="M30 65h50M110 65l40-35M110 65h40M110 65l40 35M180 30h50M180 65h50M180 100h50"/></g>
      <g fill="#FDFDFD"><circle cx="30" cy="65" r="7"/><circle cx="95" cy="65" r="12" fill="#9C6455"/><circle cx="165" cy="30" r="7"/><circle cx="165" cy="65" r="7"/><circle cx="165" cy="100" r="7"/></g></svg>
      <span>data → model → prediction</span></div>`,
    rag: `<div class="pv pv--sand"><span>Data Science</span>
      <svg viewBox="0 0 260 130"><g fill="#0A0909">${Array.from({ length: 18 }, (_, i) => { const h = 10 + Math.abs(Math.sin(i * 0.9) * 40); return `<rect x="${12 + i * 7}" y="${65 - h / 2}" width="3" height="${h}"/>` }).join('')}</g>
      <path d="M145 65h30" stroke="#5E3A30" stroke-width="2"/><g fill="#FDFDFD" stroke="#5E3A30"><rect x="185" y="30" width="60" height="40"/><rect x="192" y="45" width="60" height="40"/><rect x="199" y="60" width="52" height="40"/></g></svg>
      <span>data → transform → analyze</span></div>`,
    stack: `<div class="pv pv--clay"><span>Full Stack · MLOps</span>
      <svg viewBox="0 0 260 130"><g stroke="#CEB3A6" stroke-dasharray="3 4">${[0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2; return `<line x1="130" y1="65" x2="${130 + Math.cos(a) * 80}" y2="${65 + Math.sin(a) * 48}"/>` }).join('')}</g>
      <g fill="#FDFDFD">${[0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2; return `<rect x="${124 + Math.cos(a) * 80}" y="${59 + Math.sin(a) * 48}" width="12" height="12"/>` }).join('')}</g>
      <circle cx="130" cy="65" r="14" fill="#CEB3A6"/></svg>
      <span>FastAPI · React · MLflow · DVC</span></div>`,
  }

  if (fine && !reduced) {
    document.documentElement.classList.add('has-cursor')
    const cursor = $('.cursor'), preview = $('.preview'), pvInner = $('.preview__inner')
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, px = mx, py = my, lastX = mx
    addEventListener('pointermove', (e) => {
      mx = e.clientX
      my = e.clientY
      const t = e.target
      const onShot = !!t.closest('.shot__btn')
      const link = t.closest('a, button, .logo')
      const label = cursor.querySelector('.cursor__label')
      const raw = link && (link.getAttribute('aria-label') || link.getAttribute('data-cursor-label') || link.innerText || link.getAttribute('title') || '')
      const clean = raw ? raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim().replace(/^(.+?)\1$/u, '$1') : ''
      label.textContent = onShot || t.closest('[data-preview]') ? 'View' : (clean.length > 45 ? 'Open link' : clean || 'Open')
      cursor.classList.toggle('is-link', !onShot && !!link)
      cursor.style.opacity = '1'
      cursor.classList.toggle('on-dark', !!t.closest('.panel, .stats, .loader, .lightbox'))
      if (!t.closest('[data-preview]')) cursor.classList.toggle('is-view', onShot)
    }, { passive: true })
    document.documentElement.addEventListener('pointerleave', () => { cursor.style.opacity = '0' })
    $$('[data-preview]').forEach((row) => {
      row.addEventListener('pointerenter', () => {
        pvInner.innerHTML = PREVIEWS[row.dataset.preview] || ''
        preview.classList.add('is-on')
        cursor.classList.add('is-view')
      })
      row.addEventListener('pointerleave', () => {
        preview.classList.remove('is-on')
        cursor.classList.remove('is-view')
      })
    })
    const loop = () => {
      cx += (mx - cx) * 0.35; cy += (my - cy) * 0.35
      px += (mx - px) * 0.15; py += (my - py) * 0.15
      const vel = Math.max(-10, Math.min(10, (px - lastX) * 0.6))
      lastX = px
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      preview.style.transform = `translate3d(${px + 40}px, ${py - 120}px, 0)`
      pvInner.style.setProperty('--tilt', vel.toFixed(2) + 'deg')
      requestAnimationFrame(loop)
    }
    loop()
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect()
        const dx = (e.clientX - r.left - r.width / 2) * 0.18
        const dy = (e.clientY - r.top - r.height / 2) * 0.3
        b.style.transform = `translate(${Math.max(-8, Math.min(8, dx))}px, ${Math.max(-8, Math.min(8, dy))}px)`
      })
      b.addEventListener('pointerleave', () => (b.style.transform = ''))
    })
  }

  /* ---------- About video: play only while visible ---------- */
  const vid = $('#loop'), toggle = $('.about__toggle')
  if (vid && toggle) {
    let userPaused = reduced
    const syncBtn = () => {
      toggle.textContent = vid.paused ? 'Play' : 'Pause'
      toggle.setAttribute('aria-pressed', String(vid.paused))
      toggle.setAttribute('aria-label', vid.paused ? 'Play video' : 'Pause video')
    }
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) { vid.preload = 'auto'; vid.play().catch(() => {}) }
      else vid.pause()
    }, { rootMargin: '200px' }).observe(vid)
    vid.addEventListener('play', syncBtn)
    vid.addEventListener('pause', syncBtn)
    toggle.addEventListener('click', () => {
      if (vid.paused) { userPaused = false; vid.play().catch(() => {}) }
      else { userPaused = true; vid.pause() }
    })
    syncBtn()
  }

  /* ---------- copy email + toast ---------- */
  const toast = $('.toast')
  const say = (msg) => {
    toast.textContent = msg
    toast.classList.add('on')
    clearTimeout(say.t)
    say.t = setTimeout(() => toast.classList.remove('on'), 1800)
  }
  $('#copyEmail')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('Email coming soon'); say('Email copied') }
    catch { say('Email coming soon') }
  })

  /* ---------- clock + progress ---------- */
  const clock = $('#clock')
  const fmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
  const tickClock = () => clock && (clock.textContent = fmt.format(new Date()))
  tickClock()
  setInterval(tickClock, 30000)

  const bar = $('.progress span')
  const topbar = $('.topbar')
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
    topbar.classList.toggle('is-scrolled', scrollY > 40)
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  let rz, lastW = innerWidth
  addEventListener('resize', () => {
    clearTimeout(rz)
    rz = setTimeout(() => {
      if ((lastW <= 860) !== (innerWidth <= 860)) layoutRing()
      lastW = innerWidth
      hasGsap && ScrollTrigger.refresh()
    }, 150)
  })

  boot()
})()
