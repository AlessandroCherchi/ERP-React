/* ============================================================
   ERP UI — Modulo condiviso per modali, conferme e toast
   ------------------------------------------------------------
   Vanilla JS, nessuna dipendenza. Stessa impostazione degli altri
   script del progetto (IIFE + strict mode + DOM-driven).

   Espone un unico namespace globale: window.ERPUI

   Convenzioni HTML attese:
   - un solo overlay condiviso  <div class="modal-overlay" id="modalOverlay">
     (se manca, viene creato al volo)
   - ogni modale è  <div class="modal" id="...">  con .modal-header /
     .modal-body / .modal-footer
   - i campi da leggere/validare hanno l'attributo  data-field="nome"
   - i pulsanti che chiudono un modale hanno  data-modal-close

   Dipende da erp-ui.css per lo stile.
============================================================ */

(function (window, document) {
    'use strict';

    // ========================= COSTANTI =========================

    var TOAST_LIFETIME = 3500;   // ms di permanenza del toast
    var TOAST_FADEOUT = 400;     // ms dell'animazione di uscita
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var BOM = String.fromCharCode(0xFEFF);   // marcatore UTF-8 per Excel

    var TOAST_ICONS = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    };

    // Modale attualmente aperto + elemento che aveva il focus prima
    // dell'apertura (per ripristinarlo alla chiusura).
    var activeModal = null;
    var lastFocused = null;

    // Callback della conferma in attesa di risposta
    var pendingConfirm = null;


    // ========================= HELPERS DOM =========================

    /** Scorciatoia per getElementById che accetta anche un nodo già risolto. */
    function el(idOrNode) {
        return typeof idOrNode === 'string' ? document.getElementById(idOrNode) : idOrNode;
    }

    /** Crea un elemento con classi/attributi/HTML in una sola chiamata. */
    function create(tag, className, html) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (html != null) node.innerHTML = html;
        return node;
    }

    /** Escape del testo prima di inserirlo in innerHTML. */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str == null ? '' : str));
        return div.innerHTML;
    }


    // ========================= TOAST =========================

    /** Container dei toast: riusa quello in pagina o lo crea. */
    function toastContainer() {
        var container = document.getElementById('toastContainer');
        if (!container) {
            container = create('div', 'toast-container');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Mostra una notifica temporanea.
     * @param {string} message  testo (viene sempre escapato)
     * @param {'success'|'error'|'info'} [type='success']
     */
    function toast(message, type) {
        type = TOAST_ICONS[type] ? type : 'success';

        var node = create('div', 'toast toast--' + type,
            '<div class="toast-icon"><i class="fa-solid ' + TOAST_ICONS[type] + '"></i></div>' +
            '<span class="toast-message">' + escapeHtml(message) + '</span>');

        // annuncio per screen reader senza rubare il focus
        node.setAttribute('role', 'status');
        node.setAttribute('aria-live', 'polite');

        toastContainer().appendChild(node);

        setTimeout(function () {
            node.classList.add('removing');
            setTimeout(function () { node.remove(); }, TOAST_FADEOUT);
        }, TOAST_LIFETIME);

        return node;
    }


    // ========================= OVERLAY =========================

    /** Overlay condiviso dei modali: riusa quello in pagina o lo crea. */
    function modalOverlay() {
        var overlay = document.getElementById('modalOverlay');
        if (!overlay) {
            overlay = create('div', 'modal-overlay');
            overlay.id = 'modalOverlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }


    // ========================= MODALE =========================

    /**
     * Apre un modale.
     * @param {string|HTMLElement} target  id o nodo del .modal
     * @param {{onOpen?:function}} [options]  onOpen(modal) eseguito prima dell'apertura
     */
    function openModal(target, options) {
        var modal = el(target);
        if (!modal) return null;

        options = options || {};
        if (typeof options.onOpen === 'function') options.onOpen(modal);

        // se un altro modale è aperto lo si chiude senza toccare l'overlay
        if (activeModal && activeModal !== modal) activeModal.classList.remove('open');

        lastFocused = document.activeElement;
        activeModal = modal;

        modalOverlay().classList.add('open');
        modal.classList.add('open');

        // focus sul primo campo utile, a transizione avviata
        setTimeout(function () {
            var first = modal.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
            if (first) first.focus();
        }, 60);

        return modal;
    }

    /** Chiude il modale aperto e ripristina il focus precedente. */
    function closeModal() {
        if (!activeModal) return;

        activeModal.classList.remove('open');
        modalOverlay().classList.remove('open');
        activeModal = null;

        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        lastFocused = null;
    }

    /** True se un modale è attualmente aperto. */
    function isModalOpen() {
        return activeModal !== null;
    }


    // ========================= CONFERMA =========================

    /** Dialogo di conferma: riusa quello in pagina o lo crea una volta sola. */
    function confirmNodes() {
        var dialog = document.getElementById('confirmDialog');
        if (dialog) {
            return { dialog: dialog, overlay: document.getElementById('confirmOverlay') };
        }

        var overlay = create('div', 'confirm-overlay');
        overlay.id = 'confirmOverlay';

        dialog = create('div', 'confirm-dialog',
            '<div class="confirm-icon" id="confirmIcon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
            '<h3 id="confirmTitle">Conferma</h3>' +
            '<p id="confirmText"></p>' +
            '<div class="confirm-actions">' +
            '<button type="button" class="neu-action-btn neu-action-btn--outline" id="confirmNo">Annulla</button>' +
            '<button type="button" class="neu-action-btn neu-action-btn--danger" id="confirmYes">Conferma</button>' +
            '</div>');
        dialog.id = 'confirmDialog';
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'confirmTitle');
        dialog.setAttribute('aria-describedby', 'confirmText');

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // handler registrati una sola volta sui nodi appena creati
        overlay.addEventListener('click', closeConfirm);
        dialog.querySelector('#confirmNo').addEventListener('click', closeConfirm);
        dialog.querySelector('#confirmYes').addEventListener('click', function () {
            var run = pendingConfirm;
            closeConfirm();
            if (typeof run === 'function') run();
        });

        return { dialog: dialog, overlay: overlay };
    }

    /**
     * Chiede conferma prima di un'azione.
     * @param {Object} opts
     * @param {string} [opts.title]         titolo del dialogo
     * @param {string} [opts.text]          descrizione dell'azione
     * @param {string} [opts.confirmLabel]  testo del pulsante di conferma
     * @param {string} [opts.icon]          classe Font Awesome dell'icona
     * @param {'danger'|'accent'} [opts.tone='danger']
     * @param {function} [opts.onConfirm]   eseguito alla conferma
     */
    function confirm(opts) {
        opts = opts || {};
        var nodes = confirmNodes();
        var dialog = nodes.dialog;

        var icon = dialog.querySelector('.confirm-icon');
        var title = dialog.querySelector('h3');
        var text = dialog.querySelector('p');
        var yes = dialog.querySelector('#confirmYes');

        if (title) title.textContent = opts.title || 'Conferma';
        if (text) text.textContent = opts.text || '';

        if (icon) {
            icon.innerHTML = '<i class="fa-solid ' + (opts.icon || 'fa-triangle-exclamation') + '"></i>';
            icon.classList.toggle('confirm-icon--accent', opts.tone === 'accent');
        }

        if (yes) {
            yes.innerHTML = opts.confirmLabel || 'Conferma';
            yes.classList.toggle('neu-action-btn--danger', opts.tone !== 'accent');
        }

        pendingConfirm = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;

        nodes.overlay.classList.add('open');
        dialog.classList.add('open');
        setTimeout(function () { if (yes) yes.focus(); }, 60);
    }

    /** Chiude il dialogo di conferma senza eseguire l'azione. */
    function closeConfirm() {
        var dialog = document.getElementById('confirmDialog');
        var overlay = document.getElementById('confirmOverlay');
        if (dialog) dialog.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        pendingConfirm = null;
    }

    /** True se il dialogo di conferma è aperto. */
    function isConfirmOpen() {
        var dialog = document.getElementById('confirmDialog');
        return !!dialog && dialog.classList.contains('open');
    }


    // ========================= FORM =========================

    /** Tutti i campi marcati con data-field all'interno di uno scope. */
    function fieldsOf(scope) {
        return Array.prototype.slice.call(el(scope).querySelectorAll('[data-field]'));
    }

    /** Contenitore .form-group del campo, per applicare lo stato di errore. */
    function groupOf(field) {
        return field.closest('.form-group');
    }

    /**
     * Legge i campi data-field di uno scope in un oggetto piatto.
     * I valori testuali vengono trimmati.
     * @returns {Object<string,string>}
     */
    function readFields(scope) {
        var out = {};
        fieldsOf(scope).forEach(function (field) {
            out[field.dataset.field] = typeof field.value === 'string' ? field.value.trim() : field.value;
        });
        return out;
    }

    /** Svuota i campi data-field e rimuove eventuali stati di errore. */
    function resetFields(scope) {
        fieldsOf(scope).forEach(function (field) {
            if (field.tagName === 'SELECT') field.selectedIndex = 0;
            else field.value = '';
            var group = groupOf(field);
            if (group) group.classList.remove('has-error');
        });
    }

    /** Precompila i campi data-field a partire da un oggetto. */
    function fillFields(scope, data) {
        if (!data) return;
        fieldsOf(scope).forEach(function (field) {
            var value = data[field.dataset.field];
            if (value !== undefined && value !== null) field.value = value;
        });
    }

    /**
     * Valida i campi required (e i type="email") dello scope.
     * Evidenzia i campi non validi e mostra un toast riassuntivo.
     * @returns {boolean} true se il form è valido
     */
    function validate(scope) {
        var invalid = [];

        fieldsOf(scope).forEach(function (field) {
            var group = groupOf(field);
            var value = typeof field.value === 'string' ? field.value.trim() : field.value;
            var bad = (field.required && !value) ||
                (field.type === 'email' && value && !EMAIL_RE.test(value));

            if (group) group.classList.toggle('has-error', bad);
            if (bad) invalid.push(field);
        });

        if (invalid.length) {
            invalid[0].focus();
            toast('Controlla i campi evidenziati in rosso.', 'error');
            return false;
        }
        return true;
    }

    /**
     * Rimuove lo stato di errore appena l'utente corregge il campo.
     * Da chiamare una volta per modale, in fase di init.
     */
    function clearErrorsOnInput(scope) {
        el(scope).addEventListener('input', function (e) {
            var group = e.target.closest && e.target.closest('.form-group.has-error');
            if (group) group.classList.remove('has-error');
        });
    }


    // ========================= FORMATTAZIONE =========================

    /** Numero → stringa euro in formato italiano ("€ 1.234,50"). */
    function formatEuro(value, decimals) {
        var d = decimals == null ? 2 : decimals;
        return '€ ' + (Number(value) || 0).toLocaleString('it-IT', {
            minimumFractionDigits: d,
            maximumFractionDigits: d
        });
    }

    /** Stringa (anche con virgola decimale italiana) → numero. */
    function parseNum(value) {
        var n = parseFloat(String(value == null ? '' : value).replace(',', '.'));
        return isNaN(n) ? 0 : n;
    }

    /** Data odierna in formato ISO (yyyy-mm-dd), utile per gli input date. */
    function today() {
        var d = new Date();
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    /** Data ISO → formato italiano gg/mm/aaaa. */
    function formatDate(iso) {
        if (!iso) return '';
        var parts = String(iso).split('-');
        return parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : iso;
    }


    // ========================= DOWNLOAD =========================

    /**
     * Scarica un contenuto testuale come file locale.
     * @param {string} filename
     * @param {string} content
     * @param {string} [mime='text/plain;charset=utf-8;']
     */
    function downloadFile(filename, content, mime) {
        var url = URL.createObjectURL(new Blob([content], { type: mime || 'text/plain;charset=utf-8;' }));
        var link = create('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Genera e scarica un CSV (UTF-8 con BOM, così Excel legge gli accenti).
     * @param {string} filename
     * @param {string[]} headers
     * @param {Array<Array<*>>} rows
     */
    function downloadCsv(filename, headers, rows) {
        var quote = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
        var csv = [headers.map(quote).join(',')]
            .concat(rows.map(function (row) { return row.map(quote).join(','); }))
            .join('\n');

        downloadFile(filename, BOM + csv, 'text/csv;charset=utf-8;');
    }

    /** Genera e scarica un JSON indentato. */
    function downloadJson(filename, data) {
        downloadFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8;');
    }


    // ========================= LISTENER GLOBALI =========================
    // Registrati una sola volta: coprono overlay, pulsanti data-modal-close,
    // ESC e trap del focus per qualunque modale della pagina.

    function initGlobalListeners() {
        // click sull'overlay → chiude
        modalOverlay().addEventListener('click', closeModal);

        // qualunque elemento con data-modal-close chiude il modale
        document.addEventListener('click', function (e) {
            var closer = e.target.closest && e.target.closest('[data-modal-close]');
            if (closer) closeModal();
        });

        // ESC: prima la conferma (z-index superiore), poi il modale
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (isConfirmOpen()) closeConfirm();
            else if (activeModal) closeModal();
        });

        // TAB confinato dentro il modale aperto (focus trap)
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab' || !activeModal) return;

            var focusables = activeModal.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables.length) return;

            var first = focusables[0];
            var last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalListeners);
    } else {
        initGlobalListeners();
    }


    // ========================= API PUBBLICA =========================

    window.ERPUI = {
        // notifiche
        toast: toast,
        // modali
        openModal: openModal,
        closeModal: closeModal,
        isModalOpen: isModalOpen,
        // conferme
        confirm: confirm,
        closeConfirm: closeConfirm,
        // form
        readFields: readFields,
        fillFields: fillFields,
        resetFields: resetFields,
        validate: validate,
        clearErrorsOnInput: clearErrorsOnInput,
        // utility
        escapeHtml: escapeHtml,
        formatEuro: formatEuro,
        formatDate: formatDate,
        parseNum: parseNum,
        today: today,
        downloadFile: downloadFile,
        downloadCsv: downloadCsv,
        downloadJson: downloadJson
    };

})(window, document);
