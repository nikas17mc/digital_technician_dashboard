(function () {
            if (!window.Dashboard) {
                window.Dashboard = {};
            }

            Dashboard.config = {
                realtime: true,
                virtualization: true,
                refreshInterval: 30000
            };

            document.addEventListener('DOMContentLoaded', function () {
                if (window.Realtime && Dashboard.config.realtime) {
                    Realtime.connect();
                }

                if (Dashboard.config.virtualization) {
                    document.querySelectorAll('[data-virtualized="true"]').forEach(function (el) {
                        el.classList.add('is-virtualized');
                    });
                }
            });
        })();