/* ============================================================
   ERP DASHBOARD — Vanilla JS Controller
   No dependencies, no frameworks
============================================================ */

(function () {
    'use strict';

    // ========================= DATI DEMO =========================
    // Unica fonte per grafici, tabelle ed export: in produzione arrivano da API.

    var REVENUE_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    var REVENUE_DATA = [42, 58, 45, 72, 68, 85, 96, 78, 110, 95, 124, 118];

    var ACTIVITIES = [
        { icon: 'fa-file-invoice-dollar', title: 'Fattura #1284 emessa', desc: 'Cliente: Rossi S.r.l.', time: '5 min fa' },
        { icon: 'fa-cart-shopping', title: 'Nuovo ordine #3092', desc: '12 articoli — € 2.340', time: '18 min fa' },
        { icon: 'fa-user-plus', title: 'Nuovo cliente registrato', desc: 'Mario Bianchi — Milano', time: '42 min fa' },
        { icon: 'fa-boxes-stacked', title: 'Stock aggiornato', desc: 'SKU-4521: +200 unità', time: '1 ora fa' },
        { icon: 'fa-truck-fast', title: 'Spedizione #890 partita', desc: 'Corriere: BRT Express', time: '2 ore fa' },
        { icon: 'fa-circle-check', title: 'Ordine #3088 completato', desc: 'Pagamento confermato', time: '3 ore fa' }
    ];

    var PRODUCTS = [
        { rank: 1, name: 'Widget Pro X200', cat: 'Elettronica', sold: 342, revenue: '€ 18.430', up: true, pct: '+14%' },
        { rank: 2, name: 'Sensore IoT Mk3', cat: 'Componenti', sold: 289, revenue: '€ 12.750', up: true, pct: '+9%' },
        { rank: 3, name: 'Pannello LED Ultra', cat: 'Illuminazione', sold: 215, revenue: '€ 9.890', up: false, pct: '-3%' },
        { rank: 4, name: 'Cavo Cat.7 Premium', cat: 'Networking', sold: 198, revenue: '€ 4.356', up: true, pct: '+22%' },
        { rank: 5, name: 'Adattatore USB-C Hub', cat: 'Accessori', sold: 176, revenue: '€ 7.040', up: true, pct: '+6%' }
    ];

    // Anagrafica usata dalle select "Cliente" dei modali (allineata a clienti.js)
    var CLIENTI = [
        'Rossi S.r.l.',
        'Bianchi & Co.',
        'Verdi Elettronica',
        'Gialli Impianti',
        'Neri Costruzioni',
        'Azzurri Logistica'
    ];

    // Progressivi dei documenti creati dalle azioni rapide
    var counters = { ordine: 3093, fattura: 142, sku: 4522 };


    // ========================= GREETING =========================

    function setGreeting() {
        const h = new Date().getHours();
        let saluto = 'Buongiorno';
        if (h >= 13 && h < 18) saluto = 'Buon pomeriggio';
        else if (h >= 18) saluto = 'Buonasera';

        const title = document.getElementById('greetingTitle');
        if (title) title.textContent = saluto + ', Admin';

        const dateEl = document.getElementById('greetingDate');
        if (dateEl) {
            const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = new Date().toLocaleDateString('it-IT', opts);
        }
    }


    // ========================= SIDEBAR TOGGLE =========================

    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        if (!sidebar || !toggle) return;

        const isMobile = () => window.innerWidth <= 960;

        toggle.addEventListener('click', function () {
            if (isMobile()) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });

        // close mobile sidebar when clicking outside
        document.addEventListener('click', function (e) {
            if (isMobile() && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }


    // ========================= KPI COUNTER ANIMATION =========================

    function animateCounters() {
        const kpiCards = document.querySelectorAll('.kpi-card');

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const valEl = entry.target.querySelector('.kpi-value');
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
        const raw = el.textContent.trim();
        const prefix = raw.replace(/[\d.,]+/g, '').trim();   // e.g. "€"
        const numStr = raw.replace(/[^\d.,]/g, '').replace(/\./g, '');  // strip dots (thousand separators)
        const target = parseInt(numStr, 10) || 0;
        const duration = 1200;
        const steps = 50;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(function () {
            step++;
            current += increment;
            if (step >= steps) {
                current = target;
                clearInterval(timer);
            }
            const formatted = Math.round(current).toLocaleString('it-IT');
            el.textContent = prefix ? prefix + ' ' + formatted : formatted;
        }, duration / steps);
    }


    // ========================= CHIP BUTTONS =========================

    function initChips() {
        const chips = document.querySelectorAll('.chip-btn');
        chips.forEach(function (btn) {
            btn.addEventListener('click', function () {
                chips.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                // future: update chart data based on btn.dataset.range
            });
        });
    }


    // ========================= REVENUE CHART (pure canvas) =========================

    function drawRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const data = REVENUE_DATA;
        const labels = REVENUE_LABELS;
        const w = canvas.width;
        const h = canvas.height;
        const padL = 50;
        const padR = 20;
        const padT = 20;
        const padB = 40;

        const maxVal = Math.max.apply(null, data) * 1.15;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;
        const stepX = chartW / (data.length - 1);

        // grid lines
        ctx.strokeStyle = 'rgba(195,195,195,.25)';
        ctx.lineWidth = 1;
        for (var g = 0; g < 5; g++) {
            var gy = padT + (chartH / 4) * g;
            ctx.beginPath();
            ctx.moveTo(padL, gy);
            ctx.lineTo(w - padR, gy);
            ctx.stroke();

            // y-axis labels
            ctx.fillStyle = '#9a9a9a';
            ctx.font = '500 10px Poppins';
            ctx.textAlign = 'right';
            var yLabel = Math.round(maxVal - (maxVal / 4) * g);
            ctx.fillText(yLabel + 'k', padL - 8, gy + 4);
        }

        // gradient fill
        var gradient = ctx.createLinearGradient(0, padT, 0, h - padB);
        gradient.addColorStop(0, 'rgba(161,15,15,.18)');
        gradient.addColorStop(1, 'rgba(161,15,15,.01)');

        // build path
        var points = [];
        for (var i = 0; i < data.length; i++) {
            var x = padL + stepX * i;
            var y = padT + chartH - (data[i] / maxVal) * chartH;
            points.push({ x: x, y: y });
        }

        // fill area
        ctx.beginPath();
        ctx.moveTo(points[0].x, h - padB);
        for (var i = 0; i < points.length; i++) {
            if (i === 0) { ctx.lineTo(points[i].x, points[i].y); continue; }
            var cp1x = points[i - 1].x + stepX * .4;
            var cp1y = points[i - 1].y;
            var cp2x = points[i].x - stepX * .4;
            var cp2y = points[i].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, h - padB);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // line
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
            if (i === 0) { ctx.moveTo(points[i].x, points[i].y); continue; }
            var cp1x = points[i - 1].x + stepX * .4;
            var cp1y = points[i - 1].y;
            var cp2x = points[i].x - stepX * .4;
            var cp2y = points[i].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#a10f0f';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // dots
        for (var i = 0; i < points.length; i++) {
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#e8e8e8';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#a10f0f';
            ctx.stroke();
        }

        // x-axis labels
        ctx.fillStyle = '#9a9a9a';
        ctx.font = '500 10px Poppins';
        ctx.textAlign = 'center';
        for (var i = 0; i < labels.length; i++) {
            var xPos = padL + stepX * i;
            ctx.fillText(labels[i], xPos, h - padB + 18);
        }
    }


    // ========================= DONUT CHART (pure canvas) =========================

    function drawDonutChart() {
        const canvas = document.getElementById('ordersDonut');
        if (!canvas) return;

        const container = canvas.parentElement;
        const size = Math.min(container.offsetWidth, container.offsetHeight);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        const cx = size / 2;
        const cy = size / 2;
        const outerR = size / 2 - 10;
        const innerR = outerR * .6;

        const segments = [
            { value: 64, color: '#a10f0f' },   // completati
            { value: 24, color: '#b8860b' },   // in attesa
            { value: 12, color: '#c3c3c3' }    // annullati
        ];

        const total = segments.reduce(function (s, seg) { return s + seg.value; }, 0);
        let startAngle = -Math.PI / 2;

        segments.forEach(function (seg) {
            const sliceAngle = (seg.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();

            // subtle shadow per slice
            ctx.shadowColor = 'rgba(0,0,0,.08)';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowColor = 'transparent';

            startAngle += sliceAngle;
        });

        // center text
        ctx.fillStyle = '#4a4a4a';
        ctx.font = '800 28px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 6);
        ctx.font = '500 10px Poppins';
        ctx.fillStyle = '#9a9a9a';
        ctx.fillText('Totale', cx, cy + 14);
    }


    // ========================= RECENT ACTIVITIES =========================

    function populateActivities() {
        const list = document.getElementById('activityList');
        if (!list) return;

        ACTIVITIES.forEach(function (a) {
            var li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML =
                '<div class="activity-icon"><i class="fa-solid ' + a.icon + '"></i></div>' +
                '<div class="activity-text"><strong>' + a.title + '</strong><span>' + a.desc + '</span></div>' +
                '<div class="activity-time">' + a.time + '</div>';
            list.appendChild(li);
        });
    }


    // ========================= TOP PRODUCTS TABLE =========================

    function populateTable() {
        const tbody = document.getElementById('topProductsBody');
        if (!tbody) return;

        PRODUCTS.forEach(function (p) {
            var tr = document.createElement('tr');
            var trendClass = p.up ? 'table-trend--up' : 'table-trend--down';
            var trendIcon = p.up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            tr.innerHTML =
                '<td>' + p.rank + '</td>' +
                '<td style="font-weight:600; color:#4a4a4a;">' + p.name + '</td>' +
                '<td>' + p.cat + '</td>' +
                '<td>' + p.sold.toLocaleString('it-IT') + '</td>' +
                '<td style="font-weight:600;">' + p.revenue + '</td>' +
                '<td><span class="table-trend ' + trendClass + '"><i class="fa-solid ' + trendIcon + '"></i> ' + p.pct + '</span></td>';
            tbody.appendChild(tr);
        });
    }


    // ========================= ENTRANCE ANIMATIONS =========================

    function staggerEntrance() {
        var elements = document.querySelectorAll('.kpi-card, .neu-panel, .activity-item');
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


    // ========================= AZIONI RAPIDE =========================
    // Ogni pulsante della card "Azioni Rapide" apre il modale corrispondente
    // (markup/stile in dashboard.html, comportamento comune in erp-ui.js).
    // Non essendoci un backend, il "salvataggio" aggiorna lo stato locale
    // della dashboard (contatori, feed attività) e conferma con un toast —
    // stesso pattern di clienti.js.

    /** Riempie tutte le <select data-client-select> con l'anagrafica clienti. */
    function populateClientSelects() {
        var selects = document.querySelectorAll('[data-client-select]');
        var options = '<option value="" disabled selected>Seleziona un cliente…</option>' +
            CLIENTI.map(function (nome) {
                return '<option value="' + ERPUI.escapeHtml(nome) + '">' + ERPUI.escapeHtml(nome) + '</option>';
            }).join('');
        selects.forEach(function (select) { select.innerHTML = options; });
    }

    /** Aggiunge una riga in cima al feed "Attività Recenti" senza ricaricare la pagina. */
    function pushActivity(icon, title, desc) {
        var list = document.getElementById('activityList');
        if (!list) return;

        var li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML =
            '<div class="activity-icon"><i class="fa-solid ' + icon + '"></i></div>' +
            '<div class="activity-text"><strong>' + ERPUI.escapeHtml(title) + '</strong><span>' + ERPUI.escapeHtml(desc) + '</span></div>' +
            '<div class="activity-time">Adesso</div>';

        list.insertBefore(li, list.firstChild);
        if (list.children.length > 6) list.removeChild(list.lastChild);
    }

    /** Apre un modale azione rapida precompilando eventuali valori di default. */
    function openQuickModal(id, defaults) {
        ERPUI.openModal(id, {
            onOpen: function (modal) {
                var form = modal.querySelector('form');
                ERPUI.resetFields(form);
                if (defaults) ERPUI.fillFields(form, defaults);
            }
        });
    }

    // ------------------------- Nuovo Ordine -------------------------

    function initOrdineModal() {
        document.getElementById('qaNuovoOrdine').addEventListener('click', function () {
            openQuickModal('modalOrdine', {
                riferimento: 'ORD-' + (counters.ordine + 1),
                data: ERPUI.today()
            });
        });

        document.getElementById('saveOrdine').addEventListener('click', function () {
            var form = document.getElementById('formOrdine');
            if (!ERPUI.validate(form)) return;

            var data = ERPUI.readFields(form);
            counters.ordine++;

            pushActivity('fa-cart-shopping', 'Nuovo ordine ' + data.riferimento,
                data.cliente + ' — ' + data.articoli + ' articoli, ' + ERPUI.formatEuro(ERPUI.parseNum(data.importo), 0));

            ERPUI.closeModal();
            ERPUI.toast('Ordine "' + data.riferimento + '" creato con successo.', 'success');
        });
    }

    // ------------------------- Nuova Fattura -------------------------

    /** Ricalcola il totale (imponibile + IVA) mostrato nel modale fattura. */
    function updateFatturaTotale() {
        var imponibile = ERPUI.parseNum(document.getElementById('iImponibile').value);
        var iva = ERPUI.parseNum(document.getElementById('iIva').value);
        var totale = imponibile + (imponibile * iva / 100);
        document.getElementById('fatturaTotale').textContent = ERPUI.formatEuro(totale);
    }

    function initFatturaModal() {
        document.getElementById('qaNuovaFattura').addEventListener('click', function () {
            openQuickModal('modalFattura', {
                numero: new Date().getFullYear() + '/' + String(counters.fattura + 1).padStart(4, '0'),
                data: ERPUI.today()
            });
            updateFatturaTotale();
        });

        ['iImponibile', 'iIva'].forEach(function (id) {
            document.getElementById(id).addEventListener('input', updateFatturaTotale);
        });

        document.getElementById('saveFattura').addEventListener('click', function () {
            var form = document.getElementById('formFattura');
            if (!ERPUI.validate(form)) return;

            var data = ERPUI.readFields(form);
            counters.fattura++;

            pushActivity('fa-file-invoice-dollar', 'Fattura ' + data.numero + ' emessa', 'Cliente: ' + data.cliente);

            ERPUI.closeModal();
            ERPUI.toast('Fattura "' + data.numero + '" emessa con successo.', 'success');
        });
    }

    // ------------------------- Nuovo Cliente -------------------------
    // Stessi campi/validazione del modale "Nuovo Cliente" di clienti.html:
    // qui si limita a confermare la creazione e ad aggiornare il feed —
    // l'anagrafica completa resta gestita nella pagina Clienti.

    function initClienteModal() {
        document.getElementById('qaAggiungiCliente').addEventListener('click', function () {
            openQuickModal('modalCliente');
        });

        document.getElementById('saveCliente').addEventListener('click', function () {
            var form = document.getElementById('formCliente');
            if (!ERPUI.validate(form)) return;

            var data = ERPUI.readFields(form);
            CLIENTI.push(data.nome);
            populateClientSelects();

            pushActivity('fa-user-plus', 'Nuovo cliente registrato', data.nome + (data.citta ? ' — ' + data.citta : ''));

            ERPUI.closeModal();
            ERPUI.toast('Cliente "' + data.nome + '" creato con successo.', 'success');
        });
    }

    // ------------------------- Nuovo Prodotto -------------------------

    /** Ricalcola il margine unitario (prezzo - costo) mostrato nel modale prodotto. */
    function updateProdottoMargine() {
        var costo = ERPUI.parseNum(document.getElementById('pCosto').value);
        var prezzo = ERPUI.parseNum(document.getElementById('pPrezzo').value);
        document.getElementById('prodottoMargine').textContent = ERPUI.formatEuro(prezzo - costo);
    }

    function initProdottoModal() {
        document.getElementById('qaAggiungiProdotto').addEventListener('click', function () {
            openQuickModal('modalProdotto', { sku: 'SKU-' + (counters.sku + 1) });
            updateProdottoMargine();
        });

        ['pCosto', 'pPrezzo'].forEach(function (id) {
            document.getElementById(id).addEventListener('input', updateProdottoMargine);
        });

        document.getElementById('saveProdotto').addEventListener('click', function () {
            var form = document.getElementById('formProdotto');
            if (!ERPUI.validate(form)) return;

            var data = ERPUI.readFields(form);
            counters.sku++;

            pushActivity('fa-box', 'Nuovo prodotto a catalogo', data.nome + ' (' + data.sku + ')');

            ERPUI.closeModal();
            ERPUI.toast('Prodotto "' + data.nome + '" salvato con successo.', 'success');
        });
    }

    // ------------------------- Scarica Report -------------------------

    var REPORT_LABELS = {
        fatturato: 'Andamento fatturato',
        prodotti: 'Top prodotti del mese',
        attivita: 'Registro attività',
        kpi: 'Riepilogo KPI'
    };

    /** Righe [headers, rows] del report selezionato, lette dai dati già in dashboard. */
    function buildReportRows(tipo) {
        switch (tipo) {
            case 'fatturato':
                return {
                    headers: ['Mese', 'Fatturato (k€)'],
                    rows: REVENUE_LABELS.map(function (m, i) { return [m, REVENUE_DATA[i]]; })
                };
            case 'prodotti':
                return {
                    headers: ['#', 'Prodotto', 'Categoria', 'Venduti', 'Ricavo', 'Trend'],
                    rows: PRODUCTS.map(function (p) { return [p.rank, p.name, p.cat, p.sold, p.revenue, p.pct]; })
                };
            case 'attivita':
                return {
                    headers: ['Titolo', 'Dettaglio', 'Quando'],
                    rows: ACTIVITIES.map(function (a) { return [a.title, a.desc, a.time]; })
                };
            default: // kpi
                return {
                    headers: ['Indicatore', 'Valore'],
                    rows: [
                        ['Fatturato Mensile', document.getElementById('kpiRevenueVal').textContent.trim()],
                        ['Ordini Aperti', document.getElementById('kpiOrdersVal').textContent.trim()],
                        ['Nuovi Clienti', document.getElementById('kpiClientsVal').textContent.trim()],
                        ['Articoli in Stock', document.getElementById('kpiStockVal').textContent.trim()]
                    ]
                };
        }
    }

    function initReportModal() {
        var periodoSelect = document.getElementById('rPeriodo');
        var customRange = document.getElementById('reportCustomRange');

        document.getElementById('qaReport').addEventListener('click', function () {
            openQuickModal('modalReport');
            customRange.hidden = periodoSelect.value !== 'custom';
        });

        periodoSelect.addEventListener('change', function () {
            customRange.hidden = periodoSelect.value !== 'custom';
        });

        document.getElementById('saveReport').addEventListener('click', function () {
            var form = document.getElementById('formReport');
            if (!ERPUI.validate(form)) return;

            var data = ERPUI.readFields(form);
            var report = buildReportRows(data.tipo);
            var stamp = ERPUI.today();
            var basename = 'report_' + data.tipo + '_' + stamp;

            if (data.formato === 'json') {
                ERPUI.downloadJson(basename + '.json', {
                    report: REPORT_LABELS[data.tipo],
                    periodo: data.periodo,
                    generato: stamp,
                    colonne: report.headers,
                    righe: report.rows
                });
            } else {
                ERPUI.downloadCsv(basename + '.csv', report.headers, report.rows);
            }

            pushActivity('fa-download', 'Report generato', REPORT_LABELS[data.tipo]);

            ERPUI.closeModal();
            ERPUI.toast('Report "' + REPORT_LABELS[data.tipo] + '" scaricato con successo.', 'success');
        });
    }

    // ------------------------- Backup Dati -------------------------
    // Azione di sistema, non un form: richiede conferma perché potenzialmente
    // pesante/bloccante in un ERP reale, poi simula l'esecuzione.

    function initBackupAction() {
        document.getElementById('qaBackup').addEventListener('click', function () {
            ERPUI.confirm({
                title: 'Avviare il backup?',
                text: 'Verrà creata una copia completa dei dati dell\'ERP. L\'operazione può richiedere alcuni minuti.',
                confirmLabel: '<i class="fa-solid fa-database"></i> Avvia Backup',
                icon: 'fa-database',
                tone: 'accent',
                onConfirm: function () {
                    ERPUI.toast('Backup avviato in background…', 'info');
                    setTimeout(function () {
                        pushActivity('fa-database', 'Backup completato', 'Copia di sicurezza salvata correttamente.');
                        ERPUI.toast('Backup completato con successo.', 'success');
                    }, 1400);
                }
            });
        });
    }

    /** Inizializza tutte le azioni rapide della dashboard. */
    function initQuickActions() {
        populateClientSelects();
        initOrdineModal();
        initFatturaModal();
        initClienteModal();
        initProdottoModal();
        initReportModal();
        initBackupAction();
    }


    // ========================= RESIZE HANDLER =========================

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            drawRevenueChart();
            drawDonutChart();
        }, 200);
    });


    // ========================= INIT =========================

    document.addEventListener('DOMContentLoaded', function () {
        setGreeting();
        initSidebar();
        initChips();
        populateActivities();
        populateTable();
        initQuickActions();

        // draw charts after a tiny delay so layout is settled
        setTimeout(function () {
            drawRevenueChart();
            drawDonutChart();
            animateCounters();
            staggerEntrance();
        }, 100);
    });

})();
