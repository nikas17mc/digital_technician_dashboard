/* ===================== JS ===================== */
(function () {
    const sidebar = document.querySelector('.app-sidebar');
    const toggle = document.querySelector('[data-sidebar-resizer]');
    const themeToggle = document.querySelector('[data-theme-switcher]');
    const doc = document.documentElement;


    if (!sidebar || !toggle) return;
    if (!themeToggle) return;


    const SIDEBAR_STORAGE_KEY = 'sidebar:collapsed';
    const THEME_STORAGE_KEY = 'themeSwitched';

    // Initial State
    if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true') {
        sidebar.classList.add('--resized');
    }
    if (localStorage.getItem(THEME_STORAGE_KEY) === 'night') {
        doc.classList.add('--dark-mode');
    }


    toggle.addEventListener('click', function () {
        sidebar.classList.toggle('--resized');
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            sidebar.classList.contains('--resized')
        );
    });
    themeToggle.addEventListener('click', function () {
        doc.classList.toggle('--dark-mode');
        localStorage.setItem(
            THEME_STORAGE_KEY,
            doc.classList.contains('--resized')
        );
    });
})();