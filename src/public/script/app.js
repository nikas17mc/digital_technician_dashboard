/* ===================== JS ===================== */
(function () {
    const sidebar = document.querySelector('.app-sidebar');
    const toggle = document.querySelector('[data-sidebar-resizer]');


    if (!sidebar || !toggle) return;


    const STORAGE_KEY = 'sidebar:collapsed';


    // Initial State
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
        sidebar.classList.add('is-collapsed');
    }


    toggle.addEventListener('click', function () {
        sidebar.classList.toggle('is-collapsed');
        localStorage.setItem(
            STORAGE_KEY,
            sidebar.classList.contains('is-collapsed')
        );
    });
})();