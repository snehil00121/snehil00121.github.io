/* Cursor glow + nav active-section highlight. Pure vanilla. */
(function () {
    const glow = document.getElementById('cursor-glow');
    if (glow && window.matchMedia('(pointer: fine)').matches) {
        let raf;
        window.addEventListener('mousemove', (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                glow.style.left = e.clientX + 'px';
                glow.style.top = e.clientY + 'px';
                glow.style.opacity = '1';
                raf = null;
            });
        });
        document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    }

    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const map = {};
    links.forEach(a => { const id = a.getAttribute('href').slice(1); const s = document.getElementById(id); if (s) map[id] = a; });
    const sections = Object.keys(map).map(id => document.getElementById(id));
    if ('IntersectionObserver' in window && sections.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    links.forEach(a => a.style.color = '');
                    const a = map[e.target.id];
                    if (a) a.style.color = '#fff';
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => io.observe(s));
    }
})();
