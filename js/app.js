/* ============================================================
   0x00 — runtime
   Background: a flowing "void current" — particles streaming along a
   noise field, leaving silky light-trails. Cursor-reactive.
   No external JS dependency; content renders even if this throws.
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOUSE = { x: -9999, y: -9999, on: false };
window.addEventListener('mousemove', (e) => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; MOUSE.on = true; });
window.addEventListener('mouseout', () => { MOUSE.on = false; });

/* smooth, slowly-evolving flow-field angle at a point */
function field(x, y, t) {
    const s = 0.0016;
    return (Math.sin(x * s + t) + Math.cos(y * s * 1.25 - t * 0.8) + Math.sin((x + y) * s * 0.6 + t * 0.5)) * 1.45;
}

/* ============================================================
   Ambient flow-field
   ============================================================ */
function initFlow() {
    const canvas = document.getElementById('tendrils');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, dpr, parts = [], N;

    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        N = Math.min(W < 760 ? 320 : 680, Math.floor(W * H / 2900));
        parts = [];
        for (let i = 0; i < N; i++) parts.push(spawn({}));
    }
    function spawn(p) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.vx = 0; p.vy = 0;
        p.life = 0;
        p.max = 140 + Math.random() * 320;
        p.red = Math.random() < 0.07;
        return p;
    }

    let t = 0;
    function frame() {
        t += 0.0011;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(2,3,8,0.07)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.05;

        for (const p of parts) {
            const a = field(p.x, p.y, t);
            p.vx += Math.cos(a) * 0.09;
            p.vy += Math.sin(a) * 0.09;

            if (MOUSE.on) {
                const dx = p.x - MOUSE.x, dy = p.y - MOUSE.y, d2 = dx * dx + dy * dy;
                if (d2 < 24000) {
                    const d = Math.sqrt(d2) || 1, f = (1 - d / 155);
                    p.vx += (-dy / d) * 0.9 * f + (dx / d) * 0.25 * f;
                    p.vy += (dx / d) * 0.9 * f + (dy / d) * 0.25 * f;
                }
            }
            p.vx *= 0.93; p.vy *= 0.93;
            const sp = Math.hypot(p.vx, p.vy);
            if (sp > 2.6) { p.vx = p.vx / sp * 2.6; p.vy = p.vy / sp * 2.6; }

            const px = p.x, py = p.y;
            p.x += p.vx; p.y += p.vy; p.life++;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = p.red ? 'rgba(255,75,100,0.52)' : 'rgba(125,180,255,0.5)';
            ctx.stroke();

            if (p.life > p.max || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) spawn(p);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (!REDUCED) requestAnimationFrame(frame);
    }

    function staticField() {
        ctx.fillStyle = 'rgba(2,3,8,1)'; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
        for (let i = 0; i < 260; i++) {
            let x = Math.random() * W, y = Math.random() * H;
            ctx.beginPath(); ctx.moveTo(x, y);
            for (let s = 0; s < 6; s++) { const a = field(x, y, 0); x += Math.cos(a) * 4; y += Math.sin(a) * 4; ctx.lineTo(x, y); }
            ctx.strokeStyle = 'rgba(120,175,255,0.22)'; ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    layout();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 160); });
    if (REDUCED) staticField(); else frame();
}

/* ============================================================
   Intro: light "boot" world consumed by the void; streams swirl
   inward and condense into 0x00. Once per visitor, skippable.
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
        setTimeout(() => intro.remove(), 800);
        done();
    };
    document.getElementById('intro-skip')?.addEventListener('click', finish);
    setTimeout(finish, seen || REDUCED ? 120 : 3600);

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
    window.addEventListener('resize', size);
    const cx = () => W / 2, cy = () => H / 2;

    const P = [];
    function seed(p) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.max(W, H) * (0.45 + Math.random() * 0.25);
        p.x = cx() + Math.cos(ang) * rad;
        p.y = cy() + Math.sin(ang) * rad;
        p.vx = 0; p.vy = 0;
        p.red = Math.random() < 0.1;
        return p;
    }
    for (let i = 0; i < 270; i++) P.push(seed({}));

    const START = performance.now();
    const HOLD = 550;
    let revealed = false;

    function run(now) {
        const el = now - START;
        if (el < HOLD) {
            ctx.clearRect(0, 0, W, H);
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

        const el2 = el - HOLD;
        // void builds up and consumes the light; also fades the trails
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(2,3,8,${el2 < 380 ? 0.18 : 0.095})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.1;

        for (const p of P) {
            const dx = cx() - p.x, dy = cy() - p.y, d = Math.hypot(dx, dy) || 1;
            const ang = Math.atan2(dy, dx);
            const sw = ang + 1.2;                       // tangential swirl
            p.vx += Math.cos(ang) * 0.16 + Math.cos(sw) * 0.10;
            p.vy += Math.sin(ang) * 0.16 + Math.sin(sw) * 0.10;
            p.vx *= 0.9; p.vy *= 0.9;
            const px = p.x, py = p.y;
            p.x += p.vx; p.y += p.vy;
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = p.red ? 'rgba(255,80,105,0.6)' : 'rgba(150,195,255,0.6)';
            ctx.stroke();
            if (d < 26) seed(p);
        }
        // core glow at center, tightening as it condenses
        const cr = 95 - Math.min(35, el2 * 0.02);
        const g = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), cr);
        g.addColorStop(0, 'rgba(165,205,255,0.26)');
        g.addColorStop(1, 'rgba(150,195,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx(), cy(), cr, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        if (el2 >= 650 && !revealed) { revealed = true; intro.classList.add('reveal'); }
        if (el2 < 2150) requestAnimationFrame(run);
        else finish();
    }
    requestAnimationFrame(run);
}

/* ============================================================
   Reveal
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
    try { initFlow(); } catch (e) { console.error('flow', e); }
    try { initReveal(); } catch (e) { document.querySelectorAll('.reveal').forEach(x => x.classList.add('visible')); }
    try { initWriteups(); } catch (e) { console.error('writeups', e); }
    try { initIntro(() => {}); } catch (e) { const i = document.getElementById('void-intro'); if (i) i.remove(); }
});
