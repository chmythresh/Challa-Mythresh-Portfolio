/* =========================================================
   /contact — entry animation, mailto form, dotted globe
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasGsap = typeof window.gsap !== 'undefined'
  const EMAIL = ''

  /* ---------- smooth scroll (same feel as the home page) ---------- */
  if (!reduced && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
  }

  /* ---------- entry animation ---------- */
  if (hasGsap && !reduced) {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.c-wipe', { scaleY: 0, duration: 0.9, ease: 'power4.inOut' })
      .from('.c-top', { y: -30, opacity: 0, duration: 0.8 }, '-=0.3')
      .from('.c-mail', { y: 20, opacity: 0, duration: 0.8 }, '<')
      .from('.c-line > span', { yPercent: 110, rotate: 3, duration: 1.1, stagger: 0.08 }, '<0.1')
      .from('.c-lede', { y: 20, opacity: 0, duration: 0.8 }, '<0.4')
      .from('.c-field', { y: 30, opacity: 0, duration: 0.9, stagger: 0.08 }, '<0.1')
      .from('.c-actions, .c-socials', { y: 20, opacity: 0, duration: 0.8, stagger: 0.08 }, '<0.2')
      .from('.c-gtitle, .c-gtext', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.6)
      .from('.c-globe', { scale: 0.8, opacity: 0, rotate: -12, duration: 1.6 }, 0.7)
      .from('.c-legend li', { y: 12, opacity: 0, duration: 0.6, stagger: 0.06 }, 1.3)
  } else {
    const w = $('.c-wipe')
    w && w.remove()
  }

  /* ---------- form: validate, then hand off to the visitor's email app ---------- */
  const form = $('#contactForm')
  const status = $('.c-status')
  const send = $('.c-send')
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    let firstBad = null
    $$('input, textarea', form).forEach((el) => {
      const ok = el.value.trim() && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()))
      el.closest('.c-field').classList.toggle('is-bad', !ok)
      el.setAttribute('aria-invalid', String(!ok))
      if (!ok && !firstBad) firstBad = el
    })
    if (firstBad) {
      status.classList.remove('is-ok')
      status.textContent = 'Please fill in your name, a valid email and a message.'
      firstBad.focus()
      return
    }
    const name = form.name.value.trim()
    const subject = encodeURIComponent(`Hello from ${name}`)
    const body = encodeURIComponent(`${form.message.value.trim()}\n\n— ${name} (${form.email.value.trim()})`)
    send.classList.remove('is-sent')
    void send.offsetWidth
    send.classList.add('is-sent')
    status.classList.add('is-ok')
    status.textContent = 'Opening your email app with the message ready to send…'
    setTimeout(() => (window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`), 350)
  })
  ;(form ? $$('input, textarea', form) : []).forEach((el) =>
    el.addEventListener('input', () => {
      el.closest('.c-field').classList.remove('is-bad')
      el.removeAttribute('aria-invalid')
    }),
  )

  /* ---------- dotted globe (2D canvas, orthographic projection) ---------- */
  const canvas = $('#globe')
  const ctx = canvas.getContext && canvas.getContext('2d')
  if (!ctx) return

  const HOME = { name: 'Vijayawada', lat: 16.51, lon: 80.65 }
  const PINS = []
  const rad = (d) => (d * Math.PI) / 180
  let land = []
  let rotLon = -80 // start with India facing the viewer
  const tilt = rad(-12)
  let size = 0, dpr = 1

  function resize() {
    const r = canvas.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    size = r.width
    canvas.width = Math.round(r.width * dpr)
    canvas.height = Math.round(r.height * dpr)
  }

  // returns screen x, y and depth z (z > 0 means facing the viewer)
  function project(lat, lon, R, cx, cy) {
    const la = rad(lat), lo = rad(lon + rotLon)
    let x = Math.cos(la) * Math.sin(lo)
    let y = Math.sin(la)
    let z = Math.cos(la) * Math.cos(lo)
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt)
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt)
    return { x: cx + x * R, y: cy - y2 * R, z: z2 }
  }

  // great-circle points between two places, lifted off the surface toward the middle
  function arcPoints(a, b, n = 48) {
    const toV = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))]
    const va = toV(a), vb = toV(b)
    const dot = Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])
    const om = Math.acos(dot)
    const pts = []
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om)
      const v = [va[0] * s1 + vb[0] * s2, va[1] * s1 + vb[1] * s2, va[2] * s1 + vb[2] * s2]
      const lat = (Math.asin(v[2]) * 180) / Math.PI
      const lon = (Math.atan2(v[1], v[0]) * 180) / Math.PI
      pts.push({ lat, lon, lift: 1 + Math.sin(t * Math.PI) * 0.12 })
    }
    return pts
  }
  const arcs = PINS.map((p) => arcPoints(HOME, p))

  let t0 = performance.now()
  function draw(now) {
    const W = canvas.width, H = canvas.height
    const R = (Math.min(W, H) / 2) * 0.86
    const cx = W / 2, cy = H / 2
    const time = (now - t0) / 1000
    ctx.clearRect(0, 0, W, H)

    // sphere body
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R)
    g.addColorStop(0, '#3a2620')
    g.addColorStop(0.6, '#1c1412')
    g.addColorStop(1, '#0e0b0a')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
    // rim light
    ctx.strokeStyle = 'rgba(206,179,166,0.25)'
    ctx.lineWidth = 1.2 * dpr
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

    // land dots, brighter toward the viewer
    const dotR = Math.max(0.9, R / 260) * 1.0
    for (const [lat, lon] of land) {
      const p = project(lat, lon, R, cx, cy)
      if (p.z <= 0) continue
      ctx.globalAlpha = 0.25 + p.z * 0.75
      ctx.fillStyle = '#ceb3a6'
      ctx.fillRect(p.x - dotR, p.y - dotR, dotR * 2, dotR * 2)
    }
    ctx.globalAlpha = 1

    // arcs from home, drawn progressively and looping
    arcs.forEach((pts, k) => {
      const prog = ((time * 0.45 + k * 0.33) % 1.4) / 1.0
      const upto = Math.min(pts.length - 1, Math.floor(Math.min(1, prog) * (pts.length - 1)))
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= upto; i++) {
        const q = pts[i]
        const p = project(q.lat, q.lon, R * q.lift, cx, cy)
        if (p.z < -0.05) { started = false; continue }
        started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
        started = true
      }
      ctx.strokeStyle = 'rgba(232,168,124,0.85)'
      ctx.lineWidth = 1.6 * dpr
      ctx.stroke()
      // travelling spark at the head of the arc
      if (prog < 1) {
        const q = pts[upto]
        const p = project(q.lat, q.lon, R * q.lift, cx, cy)
        if (p.z > 0) {
          ctx.fillStyle = '#fff4ea'
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * dpr, 0, Math.PI * 2); ctx.fill()
        }
      }
    })

    // pins with pulsing rings
    const pulse = (time % 2) / 2
    ;[HOME, ...PINS].forEach((pin, i) => {
      const p = project(pin.lat, pin.lon, R, cx, cy)
      if (p.z <= 0) return
      const home = i === 0
      const base = (home ? 5 : 3.6) * dpr
      ctx.strokeStyle = home ? `rgba(236,232,221,${1 - pulse})` : `rgba(232,168,124,${1 - pulse})`
      ctx.lineWidth = 1.2 * dpr
      ctx.beginPath(); ctx.arc(p.x, p.y, base + pulse * 14 * dpr, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = home ? '#ece8dd' : '#e8a87c'
      ctx.beginPath(); ctx.arc(p.x, p.y, base, 0, Math.PI * 2); ctx.fill()
      // labels on wider canvases only
      if (size > 320) {
        ctx.font = `${11 * dpr}px "Geist Mono", monospace`
        ctx.fillStyle = 'rgba(236,232,221,0.85)'
        ctx.textAlign = home ? 'right' : 'left'
        ctx.fillText(pin.name.toUpperCase(), p.x + (home ? -12 : 10) * dpr, p.y + (pin.name === 'Bengaluru' ? 14 : -8) * dpr)
      }
    })
  }

  // spin + drag
  let dragging = false, lastX = 0, vel = 0
  const wrap = $('.c-globe')
  wrap.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; wrap.setPointerCapture(e.pointerId) })
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    vel = dx * 0.25
    rotLon += vel
  })
  const stop = () => (dragging = false)
  wrap.addEventListener('pointerup', stop)
  wrap.addEventListener('pointercancel', stop)

  let visible = true
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas)
  function loop(now) {
    if (visible) {
      if (!dragging && !reduced) {
        vel *= 0.94
        rotLon += vel + 0.06 // gentle idle drift
      }
      draw(now)
    }
    requestAnimationFrame(loop)
  }

  resize()
  addEventListener('resize', () => { resize(); if (reduced) draw(performance.now()) })
  fetch('assets/data/globe-land.json')
    .then((r) => r.json())
    .then((d) => {
      land = d
      if (reduced) draw(performance.now())
      else requestAnimationFrame(loop)
    })
    .catch(() => draw(performance.now()))
})()
