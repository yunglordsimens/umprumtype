// ==================== UMPRUM TYPE - SHARED JS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.querySelector('.headerMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            toggle.textContent = menu.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('active')) {
                menu.classList.remove('active');
                toggle.textContent = '☰';
            }
        });
    }
    
    // Highlight active page
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menuItem a');
    menuItems.forEach(item => {
        const itemPath = item.getAttribute('href');
        if ((currentPath === '/' && itemPath === '/index.html') ||
            (currentPath === itemPath) ||
            (currentPath.includes(itemPath.replace('.html', '')) && itemPath !== '/index.html')) {
            item.classList.add('active');
        }
    });
    
    // Prevent dark mode class on main site pages
    if (!document.body.classList.contains('playground')) {
        document.body.classList.remove('dark-mode');
    }
});