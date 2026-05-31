// Fetch updates JSON and render the latest update and previous updates list
(function(){
    const DATA_URL = 'res/updates.json';

    function renderList(listEl, items) {
        listEl.innerHTML = '';
        items.forEach((it, idx) => {
            const li = document.createElement('li');
            li.className = 'update-item';
            if (idx === 0) li.classList.add('highlight');

            li.innerHTML = `
                <div class="item-head">
                    <div class="item-meta"><time datetime="${it.date}">${it.date}</time></div>
                    <h4 class="item-title">${it.title}</h4>
                </div>
                <p class="item-summary">${it.summary}</p>
                <details class="item-details"><summary>Details</summary><div>${it.details}</div></details>
            `;
            listEl.appendChild(li);
        });
    }

    function init() {
        const listEl = document.getElementById('updates-list');
        if (!listEl) return;

        fetch(DATA_URL)
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) return;
                renderList(listEl, data);
            })
            .catch(err => {
                listEl.innerHTML = '<li class="error">Failed to load updates.</li>';
                console.error('Failed to load updates.json', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
