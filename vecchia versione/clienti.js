/* ============================================================
   ERP CLIENTI — Vanilla JS Controller
   No dependencies, no frameworks.
   Stile identico a dashboard.js (IIFE, strict, DOM-driven)
============================================================ */

(function () {
    'use strict';

    // ========================= DATA STORE =========================
    // Simulated client database — in production this comes from API/DB

    var nextId = 25;

    var clienti = [
        { id: 1, nome: 'Rossi S.r.l.', email: 'info@rossi-srl.it', telefono: '+39 02 4567890', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Montenapoleone 12', piva: 'IT01234567890', cf: '01234567890', pec: 'rossi@pec.it', sdi: 'ABC1234', stato: 'attivo', fatturato: 45200, ordini: 32, credito: 3200, note: 'Cliente premium con condizioni speciali di pagamento a 60gg.' },
        { id: 2, nome: 'Bianchi & Co.', email: 'admin@bianchico.it', telefono: '+39 06 7891234', citta: 'Roma', provincia: 'RM', indirizzo: 'Via del Corso 88', piva: 'IT09876543210', cf: '09876543210', pec: 'bianchi@pec.it', sdi: 'XYZ7890', stato: 'attivo', fatturato: 32100, ordini: 21, credito: 1500, note: '' },
        { id: 3, nome: 'Verdi Elettronica', email: 'contatti@verdi-el.it', telefono: '+39 011 2345678', citta: 'Torino', provincia: 'TO', indirizzo: 'Corso Francia 45', piva: 'IT11223344556', cf: 'VRDLRC80A01L219X', pec: 'verdi@pec.it', sdi: 'DEF4567', stato: 'attivo', fatturato: 28500, ordini: 18, credito: 0, note: 'Fornitore e cliente — relazione bidirezionale.' },
        { id: 4, nome: 'Gialli Impianti', email: 'gialli@gmail.com', telefono: '+39 055 6789012', citta: 'Firenze', provincia: 'FI', indirizzo: 'Viale Europa 22', piva: 'IT55667788990', cf: '55667788990', pec: '', sdi: '', stato: 'inattivo', fatturato: 8900, ordini: 6, credito: 4200, note: 'Ultimo ordine 6 mesi fa. Follow-up necessario.' },
        { id: 5, nome: 'Neri Logistica', email: 'info@nerilog.it', telefono: '+39 081 3456789', citta: 'Napoli', provincia: 'NA', indirizzo: 'Via Marina 156', piva: 'IT99887766554', cf: '99887766554', pec: 'neri@legalmail.it', sdi: 'GHI1234', stato: 'attivo', fatturato: 52300, ordini: 45, credito: 2100, note: 'Partner strategico area Sud.' },
        { id: 6, nome: 'Blu Tech Solutions', email: 'sales@blutech.it', telefono: '+39 051 8901234', citta: 'Bologna', provincia: 'BO', indirizzo: 'Via Rizzoli 33', piva: 'IT33445566778', cf: '33445566778', pec: 'blutech@pec.it', sdi: 'JKL5678', stato: 'attivo', fatturato: 19800, ordini: 14, credito: 800, note: '' },
        { id: 7, nome: 'Arancio Design', email: 'hello@aranciodesign.it', telefono: '+39 041 5678901', citta: 'Venezia', provincia: 'VE', indirizzo: 'Fondamenta Nuove 5', piva: 'IT66778899001', cf: 'RNCGPP85E15L736Z', pec: '', sdi: '', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Contattato alla fiera di settore. Molto interessato alla linea Pro.' },
        { id: 8, nome: 'Viola Consulting', email: 'info@violaconsulting.it', telefono: '+39 010 1234567', citta: 'Genova', provincia: 'GE', indirizzo: 'Via XX Settembre 90', piva: 'IT22334455667', cf: '22334455667', pec: 'viola@pec.it', sdi: 'MNO9012', stato: 'attivo', fatturato: 15600, ordini: 11, credito: 500, note: '' },
        { id: 9, nome: 'Grigio Metalli', email: 'ordini@grigiometalli.it', telefono: '+39 035 9012345', citta: 'Bergamo', provincia: 'BG', indirizzo: 'Via Borgo Palazzo 120', piva: 'IT44556677889', cf: '44556677889', pec: 'grigio@pec.it', sdi: 'PQR3456', stato: 'attivo', fatturato: 41700, ordini: 29, credito: 6800, note: 'Pagamento lento — monitorare scadenze.' },
        { id: 10, nome: 'Celeste Pharma', email: 'info@celestepharma.it', telefono: '+39 049 2345678', citta: 'Padova', provincia: 'PD', indirizzo: 'Via Euganea 78', piva: 'IT77889900112', cf: '77889900112', pec: 'celeste@pec.it', sdi: 'STU6789', stato: 'attivo', fatturato: 67200, ordini: 38, credito: 1200, note: 'Settore regolamentato — documentazione speciale richiesta.' },
        { id: 11, nome: 'Marrone Edilizia', email: 'info@marroneedil.it', telefono: '+39 091 4567890', citta: 'Palermo', provincia: 'PA', indirizzo: 'Via Libertà 200', piva: 'IT11002233445', cf: '11002233445', pec: '', sdi: '', stato: 'inattivo', fatturato: 5400, ordini: 4, credito: 2900, note: '' },
        { id: 12, nome: 'Turchese Digital', email: 'ciao@turchesedigital.it', telefono: '+39 070 5678901', citta: 'Cagliari', provincia: 'CA', indirizzo: 'Via Roma 15', piva: 'IT88990011223', cf: 'TRCMRK90B20B354W', pec: 'turchese@pec.it', sdi: 'VWX0123', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Startup innovativa. Potenziale alto.' },
        { id: 13, nome: 'Corallo Alimentari', email: 'ordini@coralloalim.it', telefono: '+39 080 6789012', citta: 'Bari', provincia: 'BA', indirizzo: 'Via Sparano 65', piva: 'IT55443322110', cf: '55443322110', pec: 'corallo@pec.it', sdi: 'YZA3456', stato: 'attivo', fatturato: 23400, ordini: 16, credito: 900, note: '' },
        { id: 14, nome: 'Ocra Meccanica', email: 'info@ocrameccanica.it', telefono: '+39 030 7890123', citta: 'Brescia', provincia: 'BS', indirizzo: 'Via Orzinuovi 44', piva: 'IT66554433221', cf: '66554433221', pec: 'ocra@pec.it', sdi: 'BCD5678', stato: 'attivo', fatturato: 38900, ordini: 27, credito: 3100, note: 'Lavorazioni speciali con lead time di 15gg.' },
        { id: 15, nome: 'Ambra Tessuti', email: 'vendite@ambratessuti.it', telefono: '+39 0574 890123', citta: 'Prato', provincia: 'PO', indirizzo: 'Via Galcianese 110', piva: 'IT99001122334', cf: '99001122334', pec: 'ambra@pec.it', sdi: 'EFG7890', stato: 'attivo', fatturato: 29100, ordini: 20, credito: 1600, note: '' },
        { id: 16, nome: 'Indaco Software', email: 'hello@indacosoft.it', telefono: '+39 02 9012345', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Tortona 27', piva: 'IT00112233445', cf: '00112233445', pec: 'indaco@pec.it', sdi: 'HIJ0123', stato: 'attivo', fatturato: 14300, ordini: 9, credito: 0, note: '' },
        { id: 17, nome: 'Smeraldo Energia', email: 'info@smeraldoenergia.it', telefono: '+39 06 0123456', citta: 'Roma', provincia: 'RM', indirizzo: 'Via Cristoforo Colombo 350', piva: 'IT33221100998', cf: '33221100998', pec: 'smeraldo@pec.it', sdi: 'KLM3456', stato: 'attivo', fatturato: 56700, ordini: 34, credito: 4500, note: 'Contratto quadro annuale da rinnovare a Dicembre.' },
        { id: 18, nome: 'Rame Costruzioni', email: 'info@ramecostruzioni.it', telefono: '+39 095 1234567', citta: 'Catania', provincia: 'CT', indirizzo: 'Viale Africa 88', piva: 'IT44332211009', cf: '44332211009', pec: '', sdi: '', stato: 'inattivo', fatturato: 3200, ordini: 2, credito: 1800, note: 'In ristrutturazione aziendale.' },
        { id: 19, nome: 'Platino Medical', email: 'ordini@platinomedical.it', telefono: '+39 045 2345678', citta: 'Verona', provincia: 'VR', indirizzo: 'Via Adigetto 17', piva: 'IT88776655443', cf: '88776655443', pec: 'platino@pec.it', sdi: 'NOP6789', stato: 'attivo', fatturato: 42800, ordini: 31, credito: 2200, note: '' },
        { id: 20, nome: 'Bronzo Trasporti', email: 'info@bronzotrasporti.it', telefono: '+39 011 3456789', citta: 'Torino', provincia: 'TO', indirizzo: 'Strada del Drosso 33', piva: 'IT11998877665', cf: '11998877665', pec: 'bronzo@pec.it', sdi: 'QRS8901', stato: 'attivo', fatturato: 31500, ordini: 22, credito: 1100, note: '' },
        { id: 21, nome: 'Avorio Interior', email: 'studio@avoriointerior.it', telefono: '+39 02 4567891', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Brera 6', piva: 'IT22110099887', cf: 'VRMRCO88C12F205Y', pec: 'avorio@pec.it', sdi: 'TUV1234', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Incontro fissato per il 25 del mese.' },
        { id: 22, nome: 'Titanio Aerospace', email: 'procurement@titanioaero.it', telefono: '+39 050 5678902', citta: 'Pisa', provincia: 'PI', indirizzo: 'Via Livornese 120', piva: 'IT55001122334', cf: '55001122334', pec: 'titanio@pec.it', sdi: 'WXY4567', stato: 'attivo', fatturato: 89400, ordini: 52, credito: 5600, note: 'Certificazioni AS9100 richieste per ogni fornitura.' },
        { id: 23, nome: 'Lilla Cosmetics', email: 'ordini@lillacosmetics.it', telefono: '+39 081 6789013', citta: 'Napoli', provincia: 'NA', indirizzo: 'Via Chiaia 200', piva: 'IT66001122335', cf: '66001122335', pec: 'lilla@pec.it', sdi: 'ZAB5678', stato: 'attivo', fatturato: 17600, ordini: 13, credito: 400, note: '' },
        { id: 24, nome: 'Cobalto Security', email: 'info@cobaltosecurity.it', telefono: '+39 06 7890124', citta: 'Roma', provincia: 'RM', indirizzo: 'Via Tuscolana 520', piva: 'IT77001122336', cf: '77001122336', pec: 'cobalto@pec.it', sdi: 'CDE6789', stato: 'attivo', fatturato: 26300, ordini: 19, credito: 1800, note: '' }
    ];


    // ========================= STATE =========================

    var state = {
        currentPage: 1,
        perPage: 10,
        filter: 'all',
        search: '',
        sortKey: 'id',
        sortDir: 'asc',
        editingId: null     // null = new client, number = editing
    };


    // ========================= SIDEBAR (identico a dashboard.js) =========================

    function initSidebar() {
        var sidebar = document.getElementById('sidebar');
        var toggle = document.getElementById('sidebarToggle');
        if (!sidebar || !toggle) return;

        var isMobile = function () { return window.innerWidth <= 960; };

        toggle.addEventListener('click', function () {
            if (isMobile()) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });

        document.addEventListener('click', function (e) {
            if (isMobile() && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }


    // ========================= KPI COUNTER ANIMATION (identico) =========================

    function animateCounters() {
        var kpiCards = document.querySelectorAll('.kpi-card');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var valEl = entry.target.querySelector('.kpi-value');
                    if (valEl && !valEl.dataset.animated) {
                        valEl.dataset.animated = '1';
                        countUp(valEl);
                    }
                }
            });
        }, { threshold: 0.3 });
        kpiCards.forEach(function (card) { observer.observe(card); });
    }

    function countUp(el) {
        var raw = el.textContent.trim();
        var prefix = raw.replace(/[\d.,]+/g, '').trim();
        var numStr = raw.replace(/[^\d.,]/g, '').replace(/\./g, '');
        var target = parseInt(numStr, 10) || 0;
        var duration = 1200;
        var steps = 50;
        var increment = target / steps;
        var current = 0;
        var step = 0;

        var timer = setInterval(function () {
            step++;
            current += increment;
            if (step >= steps) { current = target; clearInterval(timer); }
            var formatted = Math.round(current).toLocaleString('it-IT');
            el.textContent = prefix ? prefix + ' ' + formatted : formatted;
        }, duration / steps);
    }


    // ========================= ENTRANCE ANIMATION (identico) =========================

    function staggerEntrance() {
        var elements = document.querySelectorAll('.kpi-card, .neu-panel, .toolbar-row');
        elements.forEach(function (el, i) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity .5s ease ' + (i * 80) + 'ms, transform .5s cubic-bezier(.22,1,.36,1) ' + (i * 80) + 'ms';
        });
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                elements.forEach(function (el) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            });
        });
    }


    // ========================= TOAST SYSTEM =========================

    function showToast(message, type) {
        type = type || 'success';
        var container = document.getElementById('toastContainer');
        if (!container) return;

        var icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            info: 'fa-circle-info'
        };

        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.innerHTML =
            '<div class="toast-icon"><i class="fa-solid ' + (icons[type] || icons.info) + '"></i></div>' +
            '<span class="toast-message">' + message + '</span>';
        container.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('removing');
            setTimeout(function () { toast.remove(); }, 400);
        }, 3500);
    }


    // ========================= FILTERS & SEARCH =========================

    function getFilteredClients() {
        var list = clienti.slice();

        // filter by status
        if (state.filter !== 'all') {
            list = list.filter(function (c) { return c.stato === state.filter; });
        }

        // search
        if (state.search) {
            var q = state.search.toLowerCase();
            list = list.filter(function (c) {
                return c.nome.toLowerCase().indexOf(q) !== -1 ||
                    c.email.toLowerCase().indexOf(q) !== -1 ||
                    c.citta.toLowerCase().indexOf(q) !== -1 ||
                    c.telefono.indexOf(q) !== -1 ||
                    (c.piva && c.piva.toLowerCase().indexOf(q) !== -1);
            });
        }

        // sort
        list.sort(function (a, b) {
            var valA = a[state.sortKey];
            var valB = b[state.sortKey];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }

    function initFilters() {
        var chips = document.querySelectorAll('.filter-group .chip-btn');
        chips.forEach(function (btn) {
            btn.addEventListener('click', function () {
                chips.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                state.filter = btn.dataset.filter;
                state.currentPage = 1;
                renderTable();
            });
        });

        var searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                state.search = this.value.trim();
                state.currentPage = 1;
                renderTable();
            });
        }
    }

    function initSort() {
        var ths = document.querySelectorAll('.th-sortable');
        ths.forEach(function (th) {
            th.addEventListener('click', function () {
                var key = th.dataset.sort;
                if (state.sortKey === key) {
                    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortKey = key;
                    state.sortDir = 'asc';
                }
                ths.forEach(function (t) { t.classList.remove('sort-asc', 'sort-desc'); });
                th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
                renderTable();
            });
        });
    }


    // ========================= RENDER TABLE =========================

    function renderTable() {
        var tbody = document.getElementById('clientiBody');
        if (!tbody) return;

        var filtered = getFilteredClients();
        var totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
        if (state.currentPage > totalPages) state.currentPage = totalPages;

        var start = (state.currentPage - 1) * state.perPage;
        var page = filtered.slice(start, start + state.perPage);

        tbody.innerHTML = '';

        if (page.length === 0) {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="8"><div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>Nessun cliente trovato.</p></div></td>';
            tbody.appendChild(tr);
        } else {
            page.forEach(function (c) {
                var tr = document.createElement('tr');
                var initials = c.nome.split(' ').map(function (w) { return w.charAt(0); }).join('').substring(0, 2);
                tr.innerHTML =
                    '<td>' + c.id + '</td>' +
                    '<td>' +
                    '<div class="client-name-cell" data-id="' + c.id + '">' +
                    '<div class="client-avatar-sm">' + initials + '</div>' +
                    '<span class="client-name-text">' + escapeHtml(c.nome) + '</span>' +
                    '</div>' +
                    '</td>' +
                    '<td>' + escapeHtml(c.email) + '</td>' +
                    '<td>' + escapeHtml(c.telefono) + '</td>' +
                    '<td>' + escapeHtml(c.citta) + '</td>' +
                    '<td style="font-weight:600;">€ ' + c.fatturato.toLocaleString('it-IT') + '</td>' +
                    '<td><span class="status-badge status-badge--' + c.stato + '">' + capitalise(c.stato) + '</span></td>' +
                    '<td>' +
                    '<div class="table-actions">' +
                    '<button class="neu-icon-btn neu-icon-btn--sm btn-view" data-id="' + c.id + '" title="Dettaglio" aria-label="Vedi dettaglio"><i class="fa-solid fa-eye"></i></button>' +
                    '<button class="neu-icon-btn neu-icon-btn--sm btn-edit" data-id="' + c.id + '" title="Modifica" aria-label="Modifica"><i class="fa-solid fa-pen"></i></button>' +
                    '<button class="neu-icon-btn neu-icon-btn--sm btn-delete" data-id="' + c.id + '" title="Elimina" aria-label="Elimina"><i class="fa-solid fa-trash-can"></i></button>' +
                    '</div>' +
                    '</td>';
                tbody.appendChild(tr);
            });
        }

        renderPagination(filtered.length, totalPages);
        bindTableActions();
    }


    // ========================= RENDER PAGINATION =========================

    function renderPagination(total, totalPages) {
        var info = document.getElementById('paginationInfo');
        var pagesEl = document.getElementById('paginationPages');
        if (!info || !pagesEl) return;

        var start = Math.min((state.currentPage - 1) * state.perPage + 1, total);
        var end = Math.min(state.currentPage * state.perPage, total);
        info.textContent = 'Mostrando ' + start + '-' + end + ' di ' + total;

        pagesEl.innerHTML = '';
        for (var i = 1; i <= totalPages; i++) {
            var btn = document.createElement('button');
            btn.className = 'page-btn' + (i === state.currentPage ? ' active' : '');
            btn.textContent = i;
            btn.dataset.page = i;
            btn.addEventListener('click', function () {
                state.currentPage = parseInt(this.dataset.page, 10);
                renderTable();
            });
            pagesEl.appendChild(btn);
        }

        var prevBtn = document.getElementById('paginPrev');
        var nextBtn = document.getElementById('paginNext');
        if (prevBtn) {
            prevBtn.onclick = function () {
                if (state.currentPage > 1) { state.currentPage--; renderTable(); }
            };
        }
        if (nextBtn) {
            nextBtn.onclick = function () {
                if (state.currentPage < totalPages) { state.currentPage++; renderTable(); }
            };
        }
    }


    // ========================= TABLE ROW ACTIONS =========================

    function bindTableActions() {
        // View
        document.querySelectorAll('.btn-view').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                openDetail(parseInt(this.dataset.id, 10));
            });
        });

        // Client name click -> also opens detail
        document.querySelectorAll('.client-name-cell').forEach(function (cell) {
            cell.addEventListener('click', function () {
                openDetail(parseInt(this.dataset.id, 10));
            });
        });

        // Edit
        document.querySelectorAll('.btn-edit').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                openModal(parseInt(this.dataset.id, 10));
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                openConfirm(parseInt(this.dataset.id, 10));
            });
        });
    }


    // ========================= DETAIL PANEL =========================

    var currentDetailId = null;

    function openDetail(id) {
        var c = clienti.find(function (x) { return x.id === id; });
        if (!c) return;
        currentDetailId = id;

        document.getElementById('detailName').textContent = c.nome;
        document.getElementById('detailEmail').textContent = c.email || '—';
        document.getElementById('detailPhone').textContent = c.telefono || '—';
        document.getElementById('detailAddress').textContent = c.indirizzo || '—';
        document.getElementById('detailCity').textContent = c.citta + (c.provincia ? ' (' + c.provincia + ')' : '');
        document.getElementById('detailPiva').textContent = c.piva || '—';
        document.getElementById('detailCf').textContent = c.cf || '—';
        document.getElementById('detailPec').textContent = c.pec || '—';
        document.getElementById('detailSdi').textContent = c.sdi || '—';
        document.getElementById('detailFatturato').textContent = '€ ' + c.fatturato.toLocaleString('it-IT');
        document.getElementById('detailOrdini').textContent = c.ordini;
        document.getElementById('detailCredito').textContent = '€ ' + c.credito.toLocaleString('it-IT');
        document.getElementById('detailNotes').textContent = c.note || 'Nessuna nota disponibile.';

        var statusEl = document.getElementById('detailStatus');
        statusEl.className = 'detail-status status-badge status-badge--' + c.stato;
        statusEl.textContent = capitalise(c.stato);

        document.getElementById('detailPanel').classList.add('open');
        document.getElementById('detailOverlay').classList.add('open');
    }

    function closeDetail() {
        document.getElementById('detailPanel').classList.remove('open');
        document.getElementById('detailOverlay').classList.remove('open');
        currentDetailId = null;
    }

    function initDetailPanel() {
        document.getElementById('detailClose').addEventListener('click', closeDetail);
        document.getElementById('detailOverlay').addEventListener('click', closeDetail);

        document.getElementById('detailEdit').addEventListener('click', function () {
            if (currentDetailId !== null) {
                closeDetail();
                setTimeout(function () { openModal(currentDetailId); }, 300);
            }
        });

        document.getElementById('detailDelete').addEventListener('click', function () {
            if (currentDetailId !== null) {
                closeDetail();
                setTimeout(function () { openConfirm(currentDetailId); }, 300);
            }
        });
    }


    // ========================= MODAL (ADD / EDIT) =========================

    function openModal(id) {
        state.editingId = id || null;
        var title = document.getElementById('modalTitle');
        var saveBtn = document.getElementById('modalSave');

        if (id) {
            var c = clienti.find(function (x) { return x.id === id; });
            if (!c) return;
            title.textContent = 'Modifica Cliente';
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Salva Modifiche</span>';
            document.getElementById('fNome').value = c.nome;
            document.getElementById('fEmail').value = c.email;
            document.getElementById('fTelefono').value = c.telefono;
            document.getElementById('fPiva').value = c.piva;
            document.getElementById('fCf').value = c.cf;
            document.getElementById('fPec').value = c.pec;
            document.getElementById('fSdi').value = c.sdi;
            document.getElementById('fStato').value = c.stato;
            document.getElementById('fIndirizzo').value = c.indirizzo;
            document.getElementById('fCitta').value = c.citta;
            document.getElementById('fProvincia').value = c.provincia || '';
            document.getElementById('fNote').value = c.note;
        } else {
            title.textContent = 'Nuovo Cliente';
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Salva Cliente</span>';
            document.getElementById('clientForm').reset();
        }

        document.getElementById('clientModal').classList.add('open');
        document.getElementById('modalOverlay').classList.add('open');
    }

    function closeModal() {
        document.getElementById('clientModal').classList.remove('open');
        document.getElementById('modalOverlay').classList.remove('open');
        state.editingId = null;
    }

    function saveClient() {
        var nome = document.getElementById('fNome').value.trim();
        var email = document.getElementById('fEmail').value.trim();
        if (!nome || !email) {
            showToast('Compila i campi obbligatori (Nome, Email).', 'error');
            return;
        }

        var data = {
            nome: nome,
            email: email,
            telefono: document.getElementById('fTelefono').value.trim(),
            piva: document.getElementById('fPiva').value.trim(),
            cf: document.getElementById('fCf').value.trim(),
            pec: document.getElementById('fPec').value.trim(),
            sdi: document.getElementById('fSdi').value.trim(),
            stato: document.getElementById('fStato').value,
            indirizzo: document.getElementById('fIndirizzo').value.trim(),
            citta: document.getElementById('fCitta').value.trim(),
            provincia: document.getElementById('fProvincia').value.trim().toUpperCase(),
            note: document.getElementById('fNote').value.trim()
        };

        if (state.editingId) {
            var idx = clienti.findIndex(function (c) { return c.id === state.editingId; });
            if (idx !== -1) {
                Object.assign(clienti[idx], data);
                showToast('Cliente "' + data.nome + '" aggiornato con successo.', 'success');
            }
        } else {
            data.id = nextId++;
            data.fatturato = 0;
            data.ordini = 0;
            data.credito = 0;
            clienti.push(data);
            showToast('Cliente "' + data.nome + '" creato con successo.', 'success');
        }

        closeModal();
        renderTable();
        updateKpi();
    }

    function initModal() {
        document.getElementById('btnAddCliente').addEventListener('click', function () { openModal(null); });
        document.getElementById('modalClose').addEventListener('click', closeModal);
        document.getElementById('modalOverlay').addEventListener('click', closeModal);
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', saveClient);

        // close on ESC
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (document.getElementById('confirmDialog').classList.contains('open')) {
                    closeConfirm();
                } else if (document.getElementById('clientModal').classList.contains('open')) {
                    closeModal();
                } else if (document.getElementById('detailPanel').classList.contains('open')) {
                    closeDetail();
                }
            }
        });
    }


    // ========================= CONFIRM DIALOG =========================

    var pendingDeleteId = null;

    function openConfirm(id) {
        var c = clienti.find(function (x) { return x.id === id; });
        if (!c) return;
        pendingDeleteId = id;
        document.getElementById('confirmText').textContent =
            'Sei sicuro di voler eliminare "' + c.nome + '"? L\'azione è irreversibile.';
        document.getElementById('confirmDialog').classList.add('open');
        document.getElementById('confirmOverlay').classList.add('open');
    }

    function closeConfirm() {
        document.getElementById('confirmDialog').classList.remove('open');
        document.getElementById('confirmOverlay').classList.remove('open');
        pendingDeleteId = null;
    }

    function doDelete() {
        if (pendingDeleteId === null) return;
        var idx = clienti.findIndex(function (c) { return c.id === pendingDeleteId; });
        if (idx !== -1) {
            var nome = clienti[idx].nome;
            clienti.splice(idx, 1);
            showToast('Cliente "' + nome + '" eliminato.', 'info');
        }
        closeConfirm();
        renderTable();
        updateKpi();
    }

    function initConfirm() {
        document.getElementById('confirmNo').addEventListener('click', closeConfirm);
        document.getElementById('confirmOverlay').addEventListener('click', closeConfirm);
        document.getElementById('confirmYes').addEventListener('click', doDelete);
    }


    // ========================= EXPORT CSV =========================

    function initExport() {
        var btn = document.getElementById('btnExport');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var filtered = getFilteredClients();
            var headers = ['ID', 'Ragione Sociale', 'Email', 'Telefono', 'Città', 'Provincia', 'P.IVA', 'Cod.Fiscale', 'PEC', 'SDI', 'Stato', 'Fatturato', 'Ordini', 'Credito'];
            var rows = filtered.map(function (c) {
                return [c.id, c.nome, c.email, c.telefono, c.citta, c.provincia, c.piva, c.cf, c.pec, c.sdi, c.stato, c.fatturato, c.ordini, c.credito]
                    .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; })
                    .join(',');
            });
            var csv = headers.join(',') + '\n' + rows.join('\n');
            var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'clienti_export_' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Export CSV completato.', 'success');
        });
    }


    // ========================= UPDATE KPIs =========================

    function updateKpi() {
        var totale = clienti.length;
        var attivi = clienti.filter(function (c) { return c.stato === 'attivo'; }).length;
        var prospect = clienti.filter(function (c) { return c.stato === 'prospect'; }).length;
        var creditoTot = clienti.reduce(function (s, c) { return s + (c.credito || 0); }, 0);

        var el1 = document.getElementById('kpiTotClientiVal');
        var el2 = document.getElementById('kpiClientiAttiviVal');
        var el3 = document.getElementById('kpiNuoviMeseVal');
        var el4 = document.getElementById('kpiCreditoVal');

        if (el1) el1.textContent = totale;
        if (el2) el2.textContent = attivi;
        // "nuovi mese" stays static in demo
        if (el4) el4.textContent = '€ ' + creditoTot.toLocaleString('it-IT');
    }


    // ========================= HELPERS =========================

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    function capitalise(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    // ========================= INIT =========================

    document.addEventListener('DOMContentLoaded', function () {
        initSidebar();
        initFilters();
        initSort();
        initDetailPanel();
        initModal();
        initConfirm();
        initExport();
        renderTable();

        setTimeout(function () {
            animateCounters();
            staggerEntrance();
        }, 100);
    });

})();
