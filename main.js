// QCom Documentation - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Splitting.js for text animations
    if (typeof Splitting !== 'undefined') {
        Splitting();
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all service cards and tech stack items
    document.querySelectorAll('.service-card, .tech-stack-item').forEach(el => {
        observer.observe(el);
    });
    
    // Typewriter effect for hero section
    if (typeof Typed !== 'undefined') {
        const typedElement = document.querySelector('.typed-text');
        if (typedElement) {
            new Typed('.typed-text', {
                strings: [
                    'Multi-Seller Platform',
                    'Quick Commerce',
                    'Microservices Architecture',
                    'Event-Driven System'
                ],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        }
    }
    
    // Parallax effect for hero background
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-bg');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Service card hover effects
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this,
                    scale: 1.02,
                    rotateY: 2,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this,
                    scale: 1,
                    rotateY: 0,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
    });
    
    // Tech stack item interactions
    document.querySelectorAll('.tech-stack-item').forEach(item => {
        item.addEventListener('click', function() {
            // Add a pulse effect on click
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this,
                    scale: [1, 1.1, 1],
                    duration: 400,
                    easing: 'easeInOutQuad'
                });
            }
        });
    });
    
    // Navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
    
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.md\\:hidden button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }
    
    // Loading animation
    function showLoading() {
        const loader = document.createElement('div');
        loader.className = 'fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center';
        loader.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div class="text-white text-lg">Loading...</div>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }
    
    function hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
    
    // Page transition effects
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const loader = showLoading();
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
    
    // Initialize animations on page load
    setTimeout(() => {
        // Animate hero text
        if (typeof anime !== 'undefined') {
            anime.timeline()
                .add({
                    targets: '.hero-content h1 span',
                    translateY: [50, 0],
                    opacity: [0, 1],
                    duration: 800,
                    delay: anime.stagger(100),
                    easing: 'easeOutQuad'
                })
                .add({
                    targets: '.hero-content p',
                    translateY: [30, 0],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutQuad'
                }, '-=400')
                .add({
                    targets: '.hero-content .flex',
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 500,
                    easing: 'easeOutQuad'
                }, '-=300');
        }
        
        // Animate service cards
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.service-card',
                translateY: [30, 0],
                opacity: [0, 1],
                duration: 600,
                delay: anime.stagger(100),
                easing: 'easeOutQuad'
            });
        }
    }, 100);
    
    // Floating particles animation
    const particles = document.querySelectorAll('.floating-particle');
    particles.forEach((particle, index) => {
        if (typeof anime !== 'undefined') {
            anime({
                targets: particle,
                translateY: [0, -20, 0],
                translateX: [0, 10, -10, 0],
                duration: 4000 + (index * 500),
                loop: true,
                easing: 'easeInOutSine',
                delay: index * 1000
            });
        }
    });
    
    // Interactive architecture diagram
    const archDiagram = document.querySelector('.architecture-diagram img');
    if (archDiagram) {
        archDiagram.addEventListener('click', function() {
            // Create modal for larger view
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8';
            modal.innerHTML = `
                <div class="relative max-w-4xl w-full">
                    <button class="absolute -top-12 right-0 text-white text-2xl hover:text-amber-400 transition-colors">
                        ✕
                    </button>
                    <img src="${this.src}" alt="${this.alt}" class="w-full h-auto rounded-lg shadow-2xl">
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal
            modal.addEventListener('click', function(e) {
                if (e.target === modal || e.target.tagName === 'BUTTON') {
                    document.body.removeChild(modal);
                }
            });
        });
    }
    
    // Smooth reveal animations
    const revealElements = document.querySelectorAll('.service-card, .tech-stack-item, .architecture-diagram');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: entry.target,
                        translateY: [50, 0],
                        opacity: [0, 1],
                        duration: 800,
                        easing: 'easeOutQuad'
                    });
                }
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        revealObserver.observe(el);
    });
    
    // Console easter egg
    console.log('%c🚀 QCom Platform Documentation', 'color: #f59e0b; font-size: 16px; font-weight: bold;');
    console.log('%cBuilt with modern web technologies and love for clean architecture.', 'color: #64748b; font-size: 12px;');
    console.log('%cExplore the codebase: https://github.com/qcom/platform', 'color: #10b981; font-size: 12px;');
});