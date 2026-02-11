(function () {
    const sidebar = document.querySelector('.app-sidebar');
    const toggle = document.querySelector('[data-sidebar-resizer]');
    const themeToggle = document.querySelector('[data-theme-switcher]');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const linkOpener = document.querySelectorAll('[data-open-url]');

    if (!sidebar || !toggle || !themeToggle) return;

    const SIDEBAR_STORAGE_KEY = 'sidebar:collapsed';
    const THEME_STORAGE_KEY = 'theme:switched';

    // Initial State
    if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true') {
        sidebar.classList.add('--resized');
    }

    const applyTheme = (theme) => {
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(`${theme}-mode`);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        // Update icon based on theme
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark'
                ? 'far fa-sun fa-lg'
                : 'far fa-moon fa-lg';
        };
        const text = themeToggle.querySelector('span');
        if (text) {
            text.innerText = theme === 'dark'
                ? 'Nox!'
                : 'Lumos!'
        }
    };

    // Initial theme setup
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
        applyTheme(savedTheme);
    } else if (prefersDarkScheme.matches) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Default fallback
    }

    toggle.addEventListener('click', function () {
        sidebar.classList.toggle('--resized');
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            sidebar.classList.contains('--resized')
        );
    });

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    const openLink = (url) => {
        window.location.assign(url)
    }

    linkOpener.forEach(item => {
        item.addEventListener('click', () => openLink(item.dataset.openUrl));
    })

    // document.body.addEventListener("htmx:beforeSwap", function (evt) {
    //     if (evt.detail.xhr.status === 404 || 500) {
    //         evt.detail.shouldSwap = true;
    //         evt.detail.isError = false;
    //     }
    // });

    // const bar = document.getElementById("progress-bar");

    // document.body.addEventListener("htmx:beforeRequest", () => {
    //     bar.style.width = "40%";
    // });

    // document.body.addEventListener("htmx:afterSwap", () => {
    //     bar.style.width = "100%";
    //     setTimeout(() => {
    //         bar.style.width = "0%";
    //     }, 200);
    // });
})();