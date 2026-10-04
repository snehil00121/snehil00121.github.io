document.addEventListener('DOMContentLoaded', () => {

    // ========= PARTICLE SYSTEM (Red Embers) =========
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 55;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() { this.reset(true); }

            reset(initial) {
                this.x = Math.random() * canvas.width;
                this.y = initial ? Math.random() * canvas.height : canvas.height + 10;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedY = -(Math.random() * 0.4 + 0.15);
                this.drift = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.fadeSpeed = Math.random() * 0.003 + 0.001;
                this.phase = Math.random() * Math.PI * 2;

                const colors = [
                    [220, 20, 60],
                    [139, 0, 0],
                    [178, 34, 34],
                    [255, 69, 0],
                    [200, 16, 46],
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.y += this.speedY;
                this.x += this.drift + Math.sin(this.phase) * 0.15;
                this.phase += 0.01;
                this.opacity -= this.fadeSpeed;

                if (this.y < -10 || this.opacity <= 0) {
                    this.reset(false);
                }
            }

            draw() {
                const [r, g, b] = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity * 0.15})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // ========= HACKER BOOT SEQUENCE =========
    const bootContainer = document.getElementById('hacker-boot');
    if (bootContainer) {
        const sequence = [
            "> Night mode activated. Senses heightened.",
            "> Scanning the dark... 47 targets acquired.",
            "> They sleep. I hunt.",
            "> The Devil's in the network. Root: GRANTED."
        ];

        bootContainer.innerHTML = '';

        async function typeLine(text) {
            const p = document.createElement('p');
            p.style.margin = '0';
            bootContainer.appendChild(p);

            for (let i = 0; i < text.length; i++) {
                p.textContent += text[i];
                await new Promise(r => setTimeout(r, 18 + Math.random() * 30));
            }
        }

        async function runBoot() {
            for (let i = 0; i < sequence.length; i++) {
                await typeLine(sequence[i]);
                await new Promise(r => setTimeout(r, 350));
            }
            const lastP = bootContainer.lastElementChild;
            if (lastP) {
                const cursor = document.createElement('span');
                cursor.className = 'blink';
                cursor.textContent = '_';
                cursor.style.color = 'var(--accent-primary)';
                lastP.appendChild(cursor);
            }
        }

        setTimeout(runBoot, 500);
    }

    // ========= GSAP SCROLL REVEAL =========
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        document.querySelectorAll('.reveal').forEach(el => {
            gsap.fromTo(el, { y: 40, opacity: 0 }, {
                y: 0, opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        });
    }

    // ========= FETCH & RENDER WRITEUPS (Accordion) =========
    const accordion = document.getElementById('writeups-accordion');
    if (!accordion) return;

    fetch('./api/writeups.json')
        .then(res => res.json())
        .then(data => {
            renderAccordion(data);
        })
        .catch(err => {
            accordion.innerHTML = `<p class="subtitle_mono" style="color:var(--accent-primary);">> Error: Failed to decrypt dossiers.</p>`;
            console.error(err);
        });

    function renderAccordion(writeups) {
        if (writeups.length === 0) {
            accordion.innerHTML = `<p class="subtitle_mono">> No classified files found.</p>`;
            return;
        }

        const groups = {};
        writeups.forEach(w => {
            const cat = w.category || 'UNCATEGORIZED';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(w);
        });

        accordion.innerHTML = '';
        let isFirst = true;

        Object.keys(groups).forEach(category => {
            const items = groups[category];
            const group = document.createElement('div');
            group.className = 'dossier-group';

            const header = document.createElement('div');
            header.className = `dossier-header${isFirst ? '' : ' collapsed'}`;
            header.innerHTML = `
                <span class="dossier-chevron">&#9660;</span>
                <span class="dossier-label">${category.replace(/[_-]/g, ' ')}</span>
                <span class="dossier-count">[${items.length} files]</span>
            `;

            const content = document.createElement('div');
            content.className = `dossier-content${isFirst ? '' : ' collapsed'}`;

            const grid = document.createElement('div');
            grid.className = 'writeups-grid';

            items.forEach(post => {
                const tagsHtml = post.tags.map(tag => `<span class="w-tag">${tag}</span>`).join('');
                const card = document.createElement('div');
                card.className = 'card writeup-card glass';
                card.innerHTML = `
                    <div class="writeup-meta">
                        <span>> ${category.toLowerCase()}</span>
                        <span>${post.date}</span>
                    </div>
                    <h3>${post.title}</h3>
                    <div class="writeup-tags">${tagsHtml}</div>
                    <p>${post.excerpt}</p>
                    <a href="writeup.html?id=${post.id}" class="writeup-link">cat ${post.slug}.md</a>
                `;
                grid.appendChild(card);
            });

            content.appendChild(grid);
            group.appendChild(header);
            group.appendChild(content);
            accordion.appendChild(group);

            header.addEventListener('click', () => {
                const isCollapsed = header.classList.contains('collapsed');
                if (isCollapsed) {
                    header.classList.remove('collapsed');
                    content.classList.remove('collapsed');
                } else {
                    header.classList.add('collapsed');
                    content.classList.add('collapsed');
                }
            });

            isFirst = false;
        });

        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.dossier-group', {
                opacity: 0, y: 20
            }, {
                opacity: 1, y: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out'
            });
        }
    }
});
