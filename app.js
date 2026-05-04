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
if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
        exploreBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            exploreBtn.style.transform = 'scale(1)';
            // Here you would navigate to the map/app section
            console.log('Navigating to explore view...');
        }, 150);
    });
}

// Card Stack Parallax Effect
const heroSection = document.querySelector('.hero');
const cards = document.querySelectorAll('.card');
const cardStack = document.querySelector('.card-stack');
const cardPositionClasses = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];

if (heroSection && cards.length) {
    heroSection.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 25;
        const y = (window.innerHeight / 2 - e.pageY) / 25;

        cards.forEach((card, index) => {
            const speed = (index + 1) * 0.5;
            card.style.transform = `translate(-50%, -50%) translate(${x * speed}px, ${y * speed}px) rotate(${(index * 5) + (x * 0.1)}deg)`;
        });
    });

    heroSection.addEventListener('mouseleave', () => {
        cards.forEach((card) => {
            card.style.transform = '';
        });
    });
}

// Card Shuffle Effect
let cardOrder = Array.from({ length: cards.length }, (_, index) => index + 1);

function applyCardOrder() {
    cards.forEach((card, index) => {
        card.classList.remove(...cardPositionClasses);
        card.classList.add(`card-${cardOrder[index]}`);
    });
}

function shuffleCards() {
    if (!cards.length) {
        return;
    }

    const last = cardOrder.pop();
    cardOrder.unshift(last);
    applyCardOrder();
}

applyCardOrder();

if (cardStack) {
    cardStack.addEventListener('click', shuffleCards);

    // Add keyboard support for card shuffle
    cardStack.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            shuffleCards();
        }
    });
}
