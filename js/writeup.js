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
        })
        .catch(err => {
            console.error(err);
            contentBox.innerHTML = `<p class="subtitle_mono" style="color:#ff3366;">> Fatal Error establishing connection pipeline.</p>`;
        });
});
