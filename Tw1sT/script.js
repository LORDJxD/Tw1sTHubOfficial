window.initializeNavbar = function() {
    if (window.initializeNavbar._initialized) {
        return;
    }

    const navMenu = document.querySelector('.nav-center');
    const toggleButton = document.querySelector('.nav-toggle');
    if (!navMenu) {
        return;
    }

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navMenu.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    window.initializeNavbar._initialized = true;
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initializeNavbar === 'function') {
        window.initializeNavbar();
    }
});
