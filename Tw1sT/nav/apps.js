(function() {
    const apps = [
        {
            name: 'Browser Hub',
            description: 'A fast browser app with tabs, bookmarks, and secure browsing features.',
            howTo: 'Open the app, choose a site, and use the toolbar to navigate or save bookmarks.',
            page: 'browser-hub.html',
            icon: 'res/browser-hub.png'
        },
        {
            name: 'Media Vault',
            description: 'A lightweight media manager for audio and video playback directly in the browser.',
            howTo: 'Select a media file, then use the controls to play, pause, and navigate tracks.',
            page: 'media-vault.html',
            icon: 'res/media-vault.png'
        },
        {
            name: 'Cloud Sketch',
            description: 'A drawing and note-taking app with support for quick sketches and annotations.',
            howTo: 'Pick a brush, draw on the canvas, and save your design for later edits.',
            page: 'cloud-sketch.html',
            icon: 'res/cloud-sketch.png'
        }
    ];

    function createCard(app) {
        const card = document.createElement('article');
        card.className = 'app-card';
        card.innerHTML = `
            <img class="app-icon" src="${app.icon}" alt="${app.name}">
            <h3>${app.name}</h3>
        `;
        card.addEventListener('click', () => openModal(app));
        return card;
    }

    function openModal(app) {
        const modal = document.getElementById('app-modal');
        const title = document.getElementById('modal-title');
        const description = document.getElementById('modal-description');
        const howto = document.getElementById('modal-howto');
        const playButton = document.getElementById('modal-play-button');

        title.textContent = app.name;
        description.textContent = app.description;
        howto.textContent = app.howTo;
        playButton.href = app.page;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        const modal = document.getElementById('app-modal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    function init() {
        const grid = document.getElementById('apps-grid');
        const modal = document.getElementById('app-modal');
        const closeButton = modal ? modal.querySelector('.modal-close') : null;

        if (!grid) return;
        grid.innerHTML = '';

        apps.forEach(app => {
            grid.appendChild(createCard(app));
        });

        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
