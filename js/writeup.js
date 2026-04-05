document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const contentBox = document.getElementById('writeup-content');

    if (!id) {
        contentBox.innerHTML = '<h2 style="color:var(--text-main)">> Error: No Writeup ID provided. Run ./execute with arguments.</h2>';
        return;
    }

    fetch('./api/writeups.json')
        .then(res => res.json())
        .then(data => {
            const post = data.find(w => w.id === id);
            
            if (!post) {
                contentBox.innerHTML = '<h2 style="color:var(--text-main)">> Error: 404 Writeup not found in active directory cache.</h2>';
                return;
            }

            // Update DOM Title gracefully
            document.title = `Snehil | ${post.title.replace('.md', '')}`;

            // Formatting Metadata and injecting Obsidian Pre-Processed Content
            contentBox.innerHTML = `
                <div class="writeup-meta" style="margin-bottom:2rem; border-bottom:1px solid #333; padding-bottom:1rem; font-family: var(--font-mono); color: var(--text-muted);">
                    <span>> category: /${post.category}</span>
                    <span style="float:right"><span style="color:var(--accent-primary)">></span> ${post.date}</span>
                    <h1 style="color:var(--text-main); margin-top:1.5rem; font-family:var(--font-sans); font-weight:800; font-size:2.5rem;">${post.title}</h1>
                </div>
                ${post.content}
            `;

            // Trigger Syntax Highlighting
            contentBox.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            // Generate Table of Contents dynamically
            const headings = contentBox.querySelectorAll('h2, h3, h4');
            const tocSidebar = document.getElementById('toc-sidebar');
            
            if (headings.length > 0 && tocSidebar) {
                let tocHTML = '<div class="toc-title">&gt; Table of Contents</div><ul class="toc-list">';
                let headingCounts = {};
                
                headings.forEach((h) => {
                    // Ignore error messages
                    if (h.innerText.includes('> Error:')) return;
                    
                    let idText = h.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    if (!idText) idText = 'section';
                    
                    if (headingCounts[idText]) {
                        headingCounts[idText]++;
                        idText = `${idText}-${headingCounts[idText]}`;
                    } else {
                        headingCounts[idText] = 1;
                    }
                    
                    if (!h.id) {
                        h.id = idText;
                    }
                    
                    let padding = '';
                    if (h.tagName.toLowerCase() === 'h3') padding = 'style="padding-left: 1rem;"';
                    else if (h.tagName.toLowerCase() === 'h4') padding = 'style="padding-left: 2rem;"';
                    
                    tocHTML += `<li ${padding}><a href="#${h.id}">${h.innerText}</a></li>`;
                });
                tocHTML += '</ul>';
                tocSidebar.innerHTML = tocHTML;
            } else if (tocSidebar) {
                // Hide sidebar if no headings
                tocSidebar.style.display = 'none';
                const layout = document.querySelector('.writeup-layout');
                if (layout) layout.style.gridTemplateColumns = '1fr';
            }
        })
        .catch(err => {
            console.error(err);
            contentBox.innerHTML = `<p class="subtitle_mono" style="color:#ff3366;">> Fatal Error establishing connection pipeline.</p>`;
        });
});
