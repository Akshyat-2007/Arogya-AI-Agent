// Handle Theme Toggling and Persistence
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // Check local storage or prefer dark mode as default
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    } else {
        // Default to dark mode
        document.body.classList.add('dark-mode');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
        localStorage.setItem('theme', 'dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            if (themeIcon) {
                themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }
});
