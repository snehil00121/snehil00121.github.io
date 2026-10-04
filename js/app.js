/* ============================================================
   0x00 — runtime
   Knull/Venom theme: living symbiote tendrils + intro sequence.
   No external JS dependency; content renders even if this throws.
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let MOUSE = { x: -9999, y: -9999, on: false };
window.addEventListener('mousemove', (e) => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; MOUSE.on = true; });
window.addEventListener('mouseout', () => { MOUSE.on = false; });

/* ---- shared tentacle renderer ----
   Draws one writhing symbiote tentacle: a filled body thick at the
   rooted base, tapering to a fine tip, with a glowing wet rim. */
function drawTendril(ctx, t, o) {
    // o: {x,y, angle, segs, segLen, bend, phase, speed, grow(0..1), reach, width(=base half-width)}
    const segs = o.segs;
    let x = o.x, y = o.y, dir = o.angle;
    const maxSeg = Math.max(2, Math.floor(segs * (o.grow == null ? 1 : o.grow)));
    const pts = [[x, y]];
    for (let i = 0; i < maxSeg; i++) {
        dir += Math.sin(t * o.speed + i * 0.55 + o.phase) * o.bend;
        if (o.reach && MOUSE.on) {
            const dx = MOUSE.x - x, dy = MOUSE.y - y, d = Math.hypot(dx, dy);
            if (d < 280) { dir += (Math.atan2(dy, dx) - dir) * 0.06 * (1 - d / 280); }
        }
        const taper = 1 - i / segs;
        x += Math.cos(dir) * o.segLen * (0.72 + 0.28 * taper);
        y += Math.sin(dir) * o.segLen * (0.72 + 0.28 * taper);
        pts.push([x, y]);
    }
    const n = pts.length;
    if (n < 2) return pts;

    const base = o.width || 8;   // half-width at the root
    // half-width per point: thick at base, keeps body, tapers to a point
    const hw = new Array(n);
    for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        hw[i] = Math.max(0.35, base * Math.pow(1 - u, 0.68) * (0.85 + 0.15 * Math.sin(u * 7 + o.phase)));
    }
    // build left/right edges from perpendicular normals
    const L = new Array(n), R = new Array(n);
    for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = (b[0] - a[0]);
        const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        L[i] = [pts[i][0] + nx * hw[i], pts[i][1] + ny * hw[i]];
        R[i] = [pts[i][0] - nx * hw[i], pts[i][1] - ny * hw[i]];
    }

    // filled tentacle body (dark-blue so the silhouette reads on black)
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    const grad = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[n - 1][0], pts[n - 1][1]);
    grad.addColorStop(0, 'rgba(22,30,52,0.96)');
    grad.addColorStop(0.5, 'rgba(14,20,36,0.88)');
    grad.addColorStop(1, 'rgba(10,14,26,0.3)');
    ctx.fillStyle = grad;
    ctx.fill();

    // rooted base bulb
    ctx.beginPath();
    ctx.arc(pts[0][0], pts[0][1], base * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(22,30,52,0.96)';
    ctx.fill();

    // wet sheen spine down the middle
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth = Math.max(0.6, base * 0.3);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90,150,230,0.14)';
    ctx.stroke();

    // glowing wet rims along BOTH tapered edges (so thick->thin reads)
    ctx.save();
    ctx.shadowColor = 'rgba(120,185,255,0.9)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = `rgba(190,215,255,${o.rim == null ? 0.42 : o.rim})`;
    for (const E of [L, R]) {
        ctx.beginPath();
        ctx.moveTo(E[0][0], E[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(E[i][0], E[i][1]);
        ctx.stroke();
    }
    ctx.restore();

    // glistening tip
    const tip = pts[n - 1];
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 1.6, 0, Math.PI * 2);
    ctx.fillStyle = o.tipRed ? 'rgba(255,87,108,0.95)' : 'rgba(205,228,255,0.85)';
    ctx.fill();
    return pts;
}

/* ============================================================
   Ambient background tendrils
   ============================================================ */
function initTendrils() {
    const canvas = document.getElementById('tendrils');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, dpr, tendrils = [], motes = [];

    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
    }

    function edgeAnchor() {
        const side = (Math.random() * 4) | 0;
        if (side === 0) return { x: Math.random() * W, y: -10, angle: Math.PI / 2 };
        if (side === 1) return { x: W + 10, y: Math.random() * H, angle: Math.PI };
        if (side === 2) return { x: Math.random() * W, y: H + 10, angle: -Math.PI / 2 };
        return { x: -10, y: Math.random() * H, angle: 0 };
    }

    function build() {
        const count = W < 760 ? 8 : 14;
        tendrils = [];
        for (let i = 0; i < count; i++) {
            const a = edgeAnchor();
            tendrils.push({
                x: a.x, y: a.y,
                angle: a.angle + (Math.random() - 0.5) * 0.8,
                segs: 13 + ((Math.random() * 7) | 0),
                segLen: 18 + Math.random() * 14,
                bend: 0.1 + Math.random() * 0.09,
                phase: Math.random() * Math.PI * 2,
                speed: 0.004 + Math.random() * 0.004,
                width: 11 + Math.random() * 8,
                rim: 0.26 + Math.random() * 0.28,
                reach: Math.random() < 0.6,
                tipRed: Math.random() < 0.18
            });
        }
        motes = [];
        const mc = W < 760 ? 24 : 46;
        for (let i = 0; i < mc; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3, vy: -(0.1 + Math.random() * 0.25), vx: (Math.random() - 0.5) * 0.15, a: Math.random() * 0.5 + 0.1, red: Math.random() < 0.15 });
    }

    let t = 0;
    function frame() {
        t++;
        ctx.clearRect(0, 0, W, H);
        // motes
        for (const m of motes) {
            m.y += m.vy; m.x += m.vx;
            if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; }
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
            ctx.fillStyle = m.red ? `rgba(255,87,108,${m.a})` : `rgba(159,208,255,${m.a})`;
            ctx.fill();
        }
        if (!REDUCED) for (const td of tendrils) drawTendril(ctx, t, td);
        else for (const td of tendrils) drawTendril(ctx, 0, Object.assign({}, td, { speed: 0 }));
        if (!REDUCED) requestAnimationFrame(frame);
    }
    layout();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    frame();
}

/* ============================================================
   Intro: normal world consumed by the void
   ============================================================ */
function initIntro(done) {
    const intro = document.getElementById('void-intro');
    if (!intro) { done(); return; }
    let seen = false;
    try { seen = localStorage.getItem('voidIntroSeen') === '1'; } catch (e) {}

    let fin = false;
    const finish = () => {
        if (fin) return;
        fin = true;
        try { localStorage.setItem('voidIntroSeen', '1'); } catch (e) {}
        intro.classList.add('gone');
        setTimeout(() => { intro.remove(); }, 800);
        done();
    };

    document.getElementById('intro-skip')?.addEventListener('click', finish);
    // Safety net: never let a stalled rAF leave the overlay stuck on screen.
    setTimeout(finish, seen || REDUCED ? 120 : 3400);

    if (seen || REDUCED) {
        intro.classList.add('gone');
        setTimeout(() => intro.remove(), 50);
        done();
        return;
    }

    const canvas = document.getElementById('intro-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, dpr;
    function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    const cx = () => W / 2, cy = () => H / 2;

    // tendrils erupting from center outward
    const strands = [];
    for (let i = 0; i < 26; i++) {
        const ang = (i / 26) * Math.PI * 2 + Math.random() * 0.2;
        strands.push({ x: cx(), y: cy(), angle: ang, segs: 20, segLen: 26 + Math.random() * 10, bend: 0.14 + Math.random() * 0.08, phase: Math.random() * 6, speed: 0.02, width: 9 + Math.random() * 3, rim: 0.5, tipRed: Math.random() < 0.2 });
    }

    const START = performance.now();
    const HOLD = 550;        // "normal" world visible before the void
    const DUR_FILL = 1200;   // void covers screen
    let revealed = false;

    function run(now) {
        const el = now - START;
        ctx.clearRect(0, 0, W, H);

        if (el < HOLD) {
            // normal-world hold: dark hint on the light screen, slowly dimming in
            const a = 0.5 + 0.5 * Math.sin(el * 0.012);
            ctx.font = '600 13px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(30,34,44,${0.55 + 0.25 * a})`;
            ctx.fillText('> booting 0x00 . . .', cx(), cy());
            ctx.beginPath(); ctx.arc(cx(), cy(), 40 + a * 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(30,34,44,${0.12 + 0.1 * a})`; ctx.lineWidth = 1; ctx.stroke();
            requestAnimationFrame(run);
            return;
        }

        const fp = Math.min((el - HOLD) / DUR_FILL, 1);
        const ease = 1 - Math.pow(1 - fp, 3);

        // expanding black void disc that swallows the light
        const R = ease * Math.hypot(W, H) * 0.62;
        const g = ctx.createRadialGradient(cx(), cy(), R * 0.2, cx(), cy(), R + 1);
        g.addColorStop(0, 'rgba(2,3,8,1)');
        g.addColorStop(0.82, 'rgba(2,3,8,1)');
        g.addColorStop(1, 'rgba(2,3,8,0)');
        ctx.beginPath(); ctx.arc(cx(), cy(), R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();

        // leading shock ring
        ctx.beginPath(); ctx.arc(cx(), cy(), R, 0, Math.PI * 2);
        ctx.lineWidth = 2; ctx.strokeStyle = `rgba(111,180,255,${0.5 * (1 - fp)})`; ctx.stroke();

        // erupting symbiote tendrils
        const grow = Math.min(1, (el - HOLD) / 1500);
        for (const s of strands) { s.x = cx(); s.y = cy(); drawTendril(ctx, (el - HOLD) * 0.06, Object.assign({}, s, { grow, reach: false })); }

        if (fp >= 0.45 && !revealed) { revealed = true; intro.classList.add('reveal'); }
        if (el < HOLD + 2100) requestAnimationFrame(run);
        else finish();
    }
    window.addEventListener('resize', size);
    requestAnimationFrame(run);
}

/* ============================================================
   Reveal + counters
   ============================================================ */
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    setTimeout(() => els.forEach(e => e.classList.add('visible')), 2500);
}

/* ============================================================
   Writeups
   ============================================================ */
const CAT_LABEL = { ACTIVE_DIRECTORY: 'Active Directory', General: 'General' };

function parseMeta(html) {
    const text = html.replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    const diff = (text.match(/Difficulty\s*:\s*([A-Za-z]+)/i) || [])[1] || '';
    const os = (text.match(/\bOS\s*:\s*(Windows|Linux|FreeBSD|Android|macOS|[A-Za-z]+)/i) || [])[1] || '';
    const sum = text.search(/Executive Summary/i);
    let ex = (sum >= 0 ? text.slice(sum + 17) : text)
        .replace(/\s+/g, ' ').replace(/^[\s:.\-–—)\]|>]+/, '').trim().slice(0, 150);
    if (ex) ex = ex.replace(/\s+\S*$/, '') + '…';
    return { diff, os, excerpt: ex };
}
function diffClass(d) {
    const x = (d || '').toLowerCase();
    if (x.startsWith('easy')) return 'easy';
    if (x.startsWith('med')) return 'medium';
    if (x.startsWith('hard') || x.startsWith('insane')) return 'hard';
    return 'na';
}
function renderWriteups(list, grid) {
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<p class="muted loading">no files in this category.</p>'; return; }
    list.forEach(w => {
        const m = parseMeta(w.content || '');
        const card = document.createElement('a');
        card.href = `writeup.html?id=${encodeURIComponent(w.id)}`;
        card.className = 'wu-card';
        card.innerHTML = `
            <div class="wu-meta">
                <span class="wu-cat">${CAT_LABEL[w.category] || w.category}</span>
                ${m.os ? `<span class="wu-os">${m.os}</span>` : ''}
            </div>
            <h3>${w.title}</h3>
            ${m.diff ? `<div class="wu-diff ${diffClass(m.diff)}">◈ ${m.diff}</div>` : ''}
            <p class="wu-excerpt">${m.excerpt || 'Full technical writeup — recon to root.'}</p>
            <div class="wu-foot">
                <span class="wu-date">${w.date || ''}</span>
                <span class="wu-open">open <span aria-hidden="true">→</span></span>
            </div>`;
        grid.appendChild(card);
    });
}
function initWriteups() {
    const grid = document.getElementById('writeups-grid');
    const tabs = document.getElementById('filter-tabs');
    const countEl = document.getElementById('wu-count');
    if (!grid) return;
    fetch('api/writeups.json')
        .then(r => { if (!r.ok) throw new Error('fetch ' + r.status); return r.json(); })
        .then(data => {
            data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            if (countEl) countEl.textContent = `${data.length} logged.`;
            const cats = ['all', ...Array.from(new Set(data.map(d => d.category)))];
            tabs.innerHTML = '';
            cats.forEach((cat, idx) => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn' + (idx === 0 ? ' active' : '');
                const n = cat === 'all' ? data.length : data.filter(d => d.category === cat).length;
                btn.innerHTML = `${cat === 'all' ? 'All' : (CAT_LABEL[cat] || cat)}<span class="c">${n}</span>`;
                btn.onclick = () => {
                    tabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderWriteups(cat === 'all' ? data : data.filter(d => d.category === cat), grid);
                };
                tabs.appendChild(btn);
            });
            renderWriteups(data, grid);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p class="muted loading">Could not load the archive. It lives at <a href="api/writeups.json" style="color:var(--blue-soft)">api/writeups.json</a>.</p>';
        });
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    try { initTendrils(); } catch (e) { console.error('tendrils', e); }
    try { initReveal(); } catch (e) { document.querySelectorAll('.reveal').forEach(x => x.classList.add('visible')); }
    try { initWriteups(); } catch (e) { console.error('writeups', e); }
    try { initIntro(() => {}); } catch (e) { const i = document.getElementById('void-intro'); if (i) i.remove(); }
});
