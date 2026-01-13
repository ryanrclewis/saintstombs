document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const body = document.body;

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            const isActive = nav.classList.toggle('active');
            menuToggle.classList.toggle('active');

            // Toggle hamburger icon state
            if (isActive) {
                menuToggle.innerHTML = '✕';
                body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            } else {
                menuToggle.innerHTML = '☰';
                body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.innerHTML = '☰';
                body.style.overflow = '';
            });
        });
    }
});
