// Dynamically load the navbar and initialize mobile menu behavior
fetch('nav/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
        if (typeof window.initializeNavbar === 'function') {
            window.initializeNavbar();
        }
    })
    .catch(error => console.error('Error loading navbar:', error));
