// Number Counter Animation for Stats
const stats = document.querySelectorAll('.stat-number');
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'));
            animateValue(el, 0, target, 2000);
            observer.unobserve(el);
        }
    });
}, observerOptions);

stats.forEach(stat => {
    observer.observe(stat);
});

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Button Interaction
const exploreBtn = document.getElementById('exploreBtn');
exploreBtn.addEventListener('click', () => {
    exploreBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        exploreBtn.style.transform = 'scale(1)';
        // Here you would navigate to the map/app section
        console.log('Navigating to explore view...');
    }, 150);
});

// Card Stack Parallax Effect
const heroSection = document.querySelector('.hero');
const cards = document.querySelectorAll('.card');

heroSection.addEventListener('mousemove', (e) => {
    const x = (window.innerWidth / 2 - e.pageX) / 25;
    const y = (window.innerHeight / 2 - e.pageY) / 25;

    cards.forEach((card, index) => {
        const speed = (index + 1) * 0.5;
        card.style.transform = `translate(-50%, -50%) translate(${x * speed}px, ${y * speed}px) rotate(${(index * 5) + (x * 0.1)}deg)`;
    });
});

heroSection.addEventListener('mouseleave', () => {
    cards.forEach((card, index) => {
        // Reset styles handled by CSS mostly, but this ensures clean state if needed
        // We rely on the CSS classes .card-1, .card-2 etc for defaults.
        // Actually, let's just clear the inline style to let CSS take over:
        card.style.transform = '';
    });
});

// Card Shuffle Effect
const cardStack = document.querySelector('.card-stack');
// Current order of class indices for the 3 cards
// default HTML order: card[0] has card-1, card[1] has card-2, card[2] has card-3
let cardIndices = [0, 1, 2];

// Make card stack keyboard accessible
cardStack.setAttribute('tabindex', '0');
cardStack.setAttribute('role', 'button');
cardStack.setAttribute('aria-label', 'Shuffle saint cards - Press Enter or Space to cycle through cards');

function shuffleCards() {
    // Rotate indices: last becomes first
    const last = cardIndices.pop();
    cardIndices.unshift(last);

    // Re-assign classes based on new indices
    cards.forEach((card, index) => {
        // Remove all position classes
        card.classList.remove('card-1', 'card-2', 'card-3');

        // Add new position class based on the rotated array
        // The card at index 0 gets the class for index cardIndices[0] + 1
        const newPos = cardIndices[index] + 1;
        card.classList.add(`card-${newPos}`);
    });
}

cardStack.addEventListener('click', shuffleCards);

// Add keyboard support for card shuffle
cardStack.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent space from scrolling the page
        shuffleCards();
    }
});
