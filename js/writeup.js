document.addEventListener('DOMContentLoaded', () => {
    const id = new URLSearchParams(location.search).get('id');
    const box = document.getElementById('writeup-content');
    const toc = document.getElementById('toc-sidebar');

    if (!id) {
        box.innerHTML = '<h1>No file specified</h1><p>Head back to the <a href="index.html#writeups">writeups index</a>.</p>';
        if (toc) toc.remove();
        return;
    }

    const CAT = { ACTIVE_DIRECTORY: 'Active Directory', General: 'General' };

    fetch('api/writeups.json')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            const post = data.find(w => w.id === id);
            if (!post) {
                box.innerHTML = '<h1>404 — file not found</h1><p>That writeup isn\'t in the archive. <a href="index.html#writeups">Back to index</a>.</p>';
                if (toc) toc.remove();
                return;
            }

            document.title = `${post.title} — Snehil Shourya`;
            box.innerHTML = `
                <div class="read-head">
                    <span class="wu-cat">${CAT[post.category] || post.category}</span>
                    <h1>${post.title}</h1>
                    <p class="read-date">${post.date || ''}</p>
                </div>
                ${post.content}`;

            // syntax highlight (optional dependency)
            if (window.hljs) {
                box.querySelectorAll('pre code').forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
            }

            // build table of contents
            const heads = box.querySelectorAll('h1, h2, h3, h4');
            if (heads.length > 1 && toc) {
                const seen = {};
                let html = '<div class="toc-title">On this page</div><ul class="toc-list">';
                heads.forEach(h => {
                    if (h.closest('.read-head')) return;
                    let slug = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
                    if (seen[slug]) slug += '-' + (++seen[slug]); else seen[slug] = 1;
                    if (!h.id) h.id = slug;
                    const pad = (h.tagName === 'H3' || h.tagName === 'H4') ? ' style="padding-left:0.8rem"' : '';
                    html += `<li${pad}><a href="#${h.id}">${h.textContent}</a></li>`;
                });
                html += '</ul>';
                toc.innerHTML = html;
            } else if (toc) {
                toc.remove();
                const layout = document.querySelector('.writeup-layout');
                if (layout) layout.style.gridTemplateColumns = '1fr';
            }
        })
        .catch(err => {
            console.error(err);
            box.innerHTML = '<h1>Failed to load</h1><p>The archive could not be read. <a href="index.html#writeups">Back to index</a>.</p>';
            if (toc) toc.remove();
        });
});
