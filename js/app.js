/* ============================================================
   Snehil Shourya — portfolio runtime
   Self-contained: no external JS dependency. If anything here
   throws, content still renders (reveal failsafe + plain cards).
   ============================================================ */

/* ---- Embedded world land grid (rasterized from world-atlas) ---- */
const WORLD = {
    cols: 150, rows: 64, latTop: 80, latSpan: 138,
    data: ["0000000063f8fffff8003c0000000780000000","0000003006f8fffff0000000004001c0000000","0000000201e007fff80000000c007fe0000000","0000006fbde803fff00000001021ffffe1c000","003e0003c67f83ffc00001c0006fffffffff00","1fffffffffffffffffffe006c0400000000000","23ffffffffffffffffffc01c00000000000000","003ffffffe51c1f00c007bfffffffffffffffe","00fffffffc0600e00001f3fffffffffffffff8","00381ffffc0700000001f97fffffffffffe880","001007fffc07e000001033fffffffffffe0380","004003ffffcff000001083fffffffffffc0300","000001ffffeffc000059ffffffffffffff8200","000000fffffff400001bffffffffffffff8000","0000003fffff4e00001ffffffffffffffe8000","0000007fffffc000000ffff7dffffffffe0000","0000007fffffc000000fdf87bffffffffc8000","0000007fffff0000007c27839ffffffff18000","0000007ffffc000000789cffdffffffec10000","0000003ffffc0000007822ff9ffffffc610000","0000003ffff800000007c00ffffffffe230000","0000000ffff00000003fc00ffffffffe1c0000","0000000bffe00000007ff71fffffffff100000","00000007f9200000007fffffbfffffff000000","00000005f010000001ffffefdffffffe000000","00000002f008000001ffffffc07fffff000000","000000007030000003fffff7fc3ffff9000000","000000007184000003fffff7f81f9f80000000","000000003b01800003fffffbf81f0fa0000000","000000000f00000003fffff9e00e0bc1000000","0000000001c0000003fffffd800c03c1000000","000000000040000003fffffe000c02e0000000","000000000047e00001ffffffc0040002800000","00000000001ff00000ffffffc0020200400000","000000000007fe000079ffff80000104000000","000000000007ff0000007fff8000050c000000","00000000000fff0000007fff0000033c200000","00000000001fff8000007ffe0000011c080000","00000000000ffff000007ffc0000018d2b0000","00000000001ffffc00003ff80000008003d000","00000000000ffffe00003ff80000007001c200","00000000000ffffc00003ffc00000000002000","000000000007fff800001ffc00000000088000","000000000007fff800003ffc400000001c8000","000000000003fff800003ffcc00000007cc000","000000000000fff800003ff1c0000000ffc000","000000000000fff000003fe180000001ffe040","000000000000fff000001ff18000000ffff000","000000000000ff8000001fe18000000ffff000","000000000001ff8000001fe00000000ffff800","000000000001ff8000000fc000000007fff800","000000000001ff0000000fc000000007fff800","000000000001fe00000007000000000787f000","000000000001f800000000000000000001f004","000000000003f800000000000000000001e000","000000000003e0000000000000000000000002","000000000003c000000000000000000000600c","000000000001c0000000000000000000000018","00000000000380000000000000000000000030","00000000000380000000000000000000000000","00000000000300000000000000000000000000","00000000000300000000000000000000000000","000000000001c0000000000000000000000000","00000000000000000000000000000000000000"]
};

function landCells() {
    const cells = [];
    for (let r = 0; r < WORLD.rows; r++) {
        const bits = WORLD.data[r].split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
        for (let c = 0; c < WORLD.cols; c++) {
            if (bits[c] === '1') cells.push([c, r]);
        }
    }
    return cells;
}

/* ============================================================
   World threat-map animation
   ============================================================ */
function initWorldMap() {
    const canvas = document.getElementById('world-map');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cells = landCells();

    let W, H, dots, dpr, attacks = [];

    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Fit grid to viewport, biased slightly right/up, preserve aspect.
        const gridAspect = WORLD.cols / WORLD.rows;
        let mapW = W * (W < 760 ? 1.35 : 1.02);
        let mapH = mapW / gridAspect * 1.08;
        if (mapH > H * 1.25) { mapH = H * 1.25; mapW = mapH * gridAspect; }
        const offX = (W - mapW) / 2 + (W < 760 ? 0 : W * 0.14);
        const offY = (H - mapH) / 2 - H * 0.04;
        const stepX = mapW / WORLD.cols;
        const stepY = mapH / WORLD.rows;

        dots = cells.map(([c, r]) => ({
            x: offX + c * stepX,
            y: offY + r * stepY,
            c, r,
            tw: Math.random() * Math.PI * 2
        }));
    }

    function randLand() { return dots[(Math.random() * dots.length) | 0]; }

    function spawnAttack() {
        if (dots.length < 2) return;
        const a = randLand(), b = randLand();
        if (a === b) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120 || dist > W * 0.9) return;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const lift = Math.min(dist * 0.4, 180);
        attacks.push({ a, b, cx: mx, cy: my - lift, t: 0, speed: 0.006 + Math.random() * 0.006 });
    }

    function bez(p, a, cx, cy, b) {
        const u = 1 - p;
        return [u*u*a.x + 2*u*p*cx + p*p*b.x, u*u*a.y + 2*u*p*cy + p*p*b.y];
    }

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        // dots
        for (const d of dots) {
            const tw = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(frame * 0.02 + d.tw);
            const alpha = 0.10 + tw * 0.14;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150,150,165,${alpha})`;
            ctx.fill();
        }

        if (!reduced) {
            // attacks
            for (let i = attacks.length - 1; i >= 0; i--) {
                const at = attacks[i];
                at.t += at.speed;
                // trailing arc
                ctx.beginPath();
                for (let s = 0; s <= 1; s += 0.04) {
                    const tt = Math.min(s, at.t);
                    const [x, y] = bez(tt, at.a, at.cx, at.cy, at.b);
                    s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    if (tt >= at.t) break;
                }
                ctx.strokeStyle = 'rgba(255,42,61,0.35)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // head
                const [hx, hy] = bez(Math.min(at.t, 1), at.a, at.cx, at.cy, at.b);
                ctx.beginPath();
                ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ff5a68';
                ctx.shadowColor = '#ff2a3d';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;

                // endpoints glow
                for (const p of [at.a, at.b]) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,90,104,0.7)';
                    ctx.fill();
                }
                if (at.t >= 1) {
                    // ripple at target then remove
                    const rp = (at.t - 1) * 60;
                    ctx.beginPath();
                    ctx.arc(at.b.x, at.b.y, rp, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,42,61,${Math.max(0, 0.5 - rp / 50)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    at.t += 0.02;
                    if (at.t > 1.8) attacks.splice(i, 1);
                }
            }
            if (attacks.length < 6 && Math.random() < 0.04) spawnAttack();
        }

        requestAnimationFrame(draw);
    }

    layout();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    if (reduced) { draw(); } else { for (let i = 0; i < 3; i++) spawnAttack(); draw(); }
}

/* ============================================================
   Reveal on scroll (with hard failsafe)
   ============================================================ */
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        els.forEach(e => e.classList.add('visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    // failsafe: never leave content hidden
    setTimeout(() => els.forEach(e => e.classList.add('visible')), 2500);
}

/* ============================================================
   Animated stat counters
   ============================================================ */
function initCounters() {
    const nums = document.querySelectorAll('.stat-num');
    const run = (el) => {
        const target = +el.dataset.count;
        const dur = 1400, start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            let v = Math.round(target * eased);
            el.textContent = target >= 1000 ? (v >= 1000 ? (v / 1000).toFixed(v === target ? 0 : 1) + 'k' : v) : v;
            if (p < 1) requestAnimationFrame(tick); else { el.textContent = target >= 1000 ? (target / 1000) + 'k' : target; el.classList.add('done'); }
        };
        requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
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
        .replace(/\s+/g, ' ')
        .replace(/^[\s:.\-–—)\]|>]+/, '')   // drop leading punctuation/colon
        .trim()
        .slice(0, 150);
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
    list.forEach((w, i) => {
        const m = parseMeta(w.content || '');
        const card = document.createElement('a');
        card.href = `writeup.html?id=${encodeURIComponent(w.id)}`;
        card.className = 'wu-card reveal visible';
        card.style.transitionDelay = (i % 6 * 0.04) + 's';
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
            grid.innerHTML = '<p class="muted loading">Could not load the archive. It lives at <a href="api/writeups.json" style="color:var(--red-soft)">api/writeups.json</a>.</p>';
        });
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    try { initWorldMap(); } catch (e) { console.error('map', e); }
    try { initReveal(); } catch (e) { document.querySelectorAll('.reveal').forEach(x => x.classList.add('visible')); }
    try { initCounters(); } catch (e) { console.error('counters', e); }
    try { initWriteups(); } catch (e) { console.error('writeups', e); }
});
