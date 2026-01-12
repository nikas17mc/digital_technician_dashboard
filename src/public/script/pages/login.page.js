document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            if (tab.dataset.tab === 'login') {
                loginForm.classList.remove('is-hidden');
                registerForm.classList.add('is-hidden');
            } else {
                registerForm.classList.remove('is-hidden');
                loginForm.classList.add('is-hidden');
            }
        });
    });
});