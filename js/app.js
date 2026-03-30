document.addEventListener('DOMContentLoaded', () => {

    // === 0. Hacker Boot Sequence ===
    const bootContainer = document.getElementById('hacker-boot');
    if (bootContainer) {
        const sequence = [
            "> Establishing secure connection...",
            "> Bypassing WAF rulesets...",
            "> Extracting vulnerability signatures...",
            "> Payload delivered. Root access granted."
        ];
        
        bootContainer.innerHTML = ''; // Clear fallback text
        
        async function typeLine(text) {
            const p = document.createElement('p');
            p.style.margin = '0';
            p.style.color = 'var(--accent-secondary)'; 
            p.style.opacity = '0.8';
            bootContainer.appendChild(p);
            
            for (let i = 0; i < text.length; i++) {
                p.textContent += text[i];
                // Random typing speed delay
                await new Promise(r => setTimeout(r, 15 + Math.random() * 35));
            }
        }
        
        async function runBoot() {
            for (let i = 0; i < sequence.length; i++) {
                await typeLine(sequence[i]);
                await new Promise(r => setTimeout(r, 400)); // Sleep between lines
            }
            
            // Add a permanent blinking cursor to the last line
            const lastP = bootContainer.lastElementChild;
            if (lastP) {
                const cursor = document.createElement('span');
                cursor.className = 'blink';
                cursor.textContent = '_';
                lastP.appendChild(cursor);
            }
        }
        
        // Start sequence after a small initial delay
        setTimeout(runBoot, 400);
    }

    // === 1. Setup GSAP Scroll Reveal ===
    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
        gsap.fromTo(el, {
            y: 50,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%", // when top of the element hits 85% of viewport
                toggleActions: "play none none none"
            }
        });
    });

    // === 2. Fetch and Render Writeups ===
    const container = document.getElementById('writeups-container');
    
    let allWriteups = [];

    // Fetch statically compiled JSON dump for GitHub Pages
    fetch('./api/writeups.json')
        .then(res => res.json())
        .then(data => {
            allWriteups = data;
            setupFilters(allWriteups);
            renderWriteups(allWriteups); // Initial Render (All)
        })
        .catch(err => {
            container.innerHTML = `<p class="subtitle_mono" style="color:red;">> Error: Failed to load directory tree. Check if backend is running.</p>`;
            console.error(err);
        });

    function renderWriteups(writeups) {
        if (writeups.length === 0) {
             container.innerHTML = `<p class="subtitle_mono">> Directory empty.</p>`;
             return;
        }

        container.innerHTML = ''; // Clear loading/existing
        
        writeups.forEach(post => {
            // Generate tags string
            const tagsHtml = post.tags.map(tag => `<span class="w-tag">${tag}</span>`).join('');

            const card = document.createElement('div');
            card.className = 'card writeup-card glass';
            card.innerHTML = `
                <div class="writeup-meta">
                    <span>> category: /${post.category}</span>
                    <span>${post.date}</span>
                </div>
                <h3>${post.title}</h3>
                <div class="writeup-tags">${tagsHtml}</div>
                <p>${post.excerpt}</p>
                <a href="writeup.html?id=${post.id}" class="writeup-link">cat ${post.slug}.md</a>
            `;
            container.appendChild(card);
        });

        // Minor GSAP staggered pop-in for cards on filter
        gsap.fromTo('.writeup-card', {
            opacity: 0, scale: 0.95
        }, {
            opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)'
        });
    }

    // === 3. Filtering Logic ===
    function setupFilters(writeups) {
        const filterTabs = document.querySelector('.filter-tabs');
        filterTabs.innerHTML = ''; // clear existing
        
        // Add "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.setAttribute('data-filter', 'all');
        allBtn.textContent = 'All';
        filterTabs.appendChild(allBtn);
        
        // Get unique categories
        const categories = [...new Set(writeups.map(w => w.category))];
        
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', cat);
            btn.textContent = cat.replace(/[_-]/g, ' '); // Beautify category name slightly
            filterTabs.appendChild(btn);
        });

        // Re-attach event listeners
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                if (filter === 'all') {
                    renderWriteups(allWriteups);
                } else {
                    const filtered = allWriteups.filter(w => w.category === filter);
                    renderWriteups(filtered);
                }
            });
        });
    }



});
