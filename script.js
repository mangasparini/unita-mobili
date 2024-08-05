document.addEventListener('DOMContentLoaded', function() {
    let units = JSON.parse(localStorage.getItem('units')) || [];
    let catalog = [];

    const unitsContainer = document.getElementById('units-container');
    const addUnitBtn = document.getElementById('add-unit-btn');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const toggleTipsBtn = document.getElementById('toggle-tips-btn');
    const showFaqBtn = document.getElementById('show-faq-btn');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.getElementsByClassName('close')[0];
    const tipsContainer = document.getElementById('tips-container');

    const categories = [
        { name: 'Conservativa', color: '#388E3C' },
        { name: 'Chirurgia', color: '#D32F2F' },
        { name: 'Endodonzia', color: '#1976D2' },
        { name: 'Protesi', color: '#FFA000' },
        { name: 'Ortodonzia', color: '#7B1FA2' }
    ];

    const tips = [
        "Usa il pulsante 'Aggiungi Unità' per creare una nuova unità mobile.",
        "Puoi modificare il nome e la categoria di un'unità cliccando sull'icona di modifica.",
        "Aggiungi cassetti a un'unità utilizzando il pulsante 'Aggiungi Cassetto'.",
        "Inserisci gli articoli nei cassetti usando 'Aggiungi Articolo' o selezionandoli dal catalogo.",
        "Il valore totale di ogni unità e cassetto viene calcolato automaticamente.",
        "Usa la funzione di importazione/esportazione per salvare o caricare i tuoi dati.",
    ];

    let currentTipIndex = 0;
    let tipInterval;

    function renderUnits() {
        unitsContainer.innerHTML = '';
        units.forEach((unit, unitIndex) => {
            const unitElement = document.createElement('div');
            unitElement.className = 'unit';
            unitElement.innerHTML = `
                <div class="unit-header">
                    <h2 class="unit-title">${unit.name}</h2>
                    <span class="category-tag" style="background-color: ${unit.categoryColor}">${unit.category}</span>
                </div>
                <div class="unit-value">Valore Totale: €${calculateUnitValue(unit).toFixed(2)}</div>
                <div class="unit-actions">
                    <button onclick="editUnit(${unitIndex})" class="btn-icon"><i class="fas fa-edit"></i></button>
                    <button onclick="editUnitCategory(${unitIndex})" class="btn-icon"><i class="fas fa-tag"></i></button>
                    <button onclick="deleteUnit(${unitIndex})" class="btn-icon"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="drawers-container">
                    ${renderDrawers(unit.drawers, unitIndex)}
                </div>
                <button class="action-btn" onclick="addDrawer(${unitIndex})">
                    <i class="fas fa-plus"></i> Aggiungi Cassetto
                </button>`;
            unitsContainer.appendChild(unitElement);
        });
    }

    function renderDrawers(drawers, unitIndex) {
        return drawers.map((drawer, drawerIndex) => `
            <div class="drawer">
                <div class="drawer-header">
                    <h3 class="drawer-title">${drawer.name}</h3>
                    <span class="drawer-value">Valore: €${calculateDrawerValue(drawer).toFixed(2)}</span>
                    <div class="drawer-actions">
                        <button onclick="editDrawer(${unitIndex}, ${drawerIndex})" class="btn-icon"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteDrawer(${unitIndex}, ${drawerIndex})" class="btn-icon"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="item-grid">
                    ${renderItems(drawer.items, unitIndex, drawerIndex)}
                </div>
                <button class="action-btn" onclick="addItem(${unitIndex}, ${drawerIndex})">
                    <i class="fas fa-plus"></i> Aggiungi Articolo
                </button>
            </div>
        `).join('');
    }

    function renderItems(items, unitIndex, drawerIndex) {
        return items.map((item, itemIndex) => `
            <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    <span>Quantità: ${item.quantity}</span>
                    <span>€${item.price.toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <button onclick="editItem(${unitIndex}, ${drawerIndex}, ${itemIndex})" class="btn-icon"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteItem(${unitIndex}, ${drawerIndex}, ${itemIndex})" class="btn-icon"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }

    function calculateUnitValue(unit) {
        return unit.drawers.reduce((total, drawer) => {
            return total + calculateDrawerValue(drawer);
        }, 0);
    }

    function calculateDrawerValue(drawer) {
        return drawer.items.reduce((total, item) => total + (item.quantity * item.price), 0);
    }

    function showModal(title, content) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.style.display = 'block';
    }

    function showNextTip() {
        tipsContainer.innerHTML = `<div class="tip">${tips[currentTipIndex]}</div>`;
        currentTipIndex = (currentTipIndex + 1) % tips.length;
    }

    addUnitBtn.onclick = function() {
        showModal('Aggiungi Unità', `
            <input type="text" id="unit-name" placeholder="Nome Unità">
            <select id="unit-category">
                ${categories.map(cat => `<option value="${cat.name}" data-color="${cat.color}">${cat.name}</option>`).join('')}
            </select>
            <button onclick="addUnit()" class="action-btn">Aggiungi</button>
        `);
    }

    importBtn.onclick = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const importedData = JSON.parse(e.target.result);
                units = importedData.units.map(unit => ({
                    ...unit,
                    drawers: importedData.drawers.filter(drawer => drawer.unitId === unit.id).map(drawer => ({
                        ...drawer,
                        items: importedData.items.filter(item => item.drawerId === drawer.id)
                    }))
                }));
                localStorage.setItem('units', JSON.stringify(units));
                renderUnits();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportBtn.onclick = function() {
        const exportData = {
            units: units.map(unit => ({ 
                id: unit.id, 
                name: unit.name, 
                category: unit.category, 
                categoryColor: unit.categoryColor 
            })),
            drawers: units.flatMap(unit => unit.drawers.map(drawer => ({ 
                id: drawer.id, 
                unitId: unit.id, 
                name: drawer.name 
            }))),
            items: units.flatMap(unit => unit.drawers.flatMap(drawer => drawer.items.map(item => ({
                id: item.id,
                drawerId: drawer.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }))))
        };
        const data = JSON.stringify(exportData);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unita_mobili.json';
        a.click();
    }

    calculateBtn.onclick = function() {
        const totalValue = units.reduce((total, unit) => total + calculateUnitValue(unit), 0);
        showModal('Valore Totale', `<p>Il valore totale delle unità mobili è: €${totalValue.toFixed(2)}</p>`);
    }

    toggleThemeBtn.onclick = function() {
        document.body.classList.toggle('dark-mode');
        this.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    toggleTipsBtn.onclick = function() {
        if (tipsContainer.style.display === 'none' || tipsContainer.style.display === '') {
            tipsContainer.style.display = 'block';
            showNextTip();
            tipInterval = setInterval(showNextTip, 10000); // Cambia il suggerimento ogni 10 secondi
        } else {
            tipsContainer.style.display = 'none';
            clearInterval(tipInterval);
        }
    }

    showFaqBtn.onclick = function() {
        showModal('FAQ', `
            <div class="faq-item">
                <div class="faq-question">Come aggiungo una nuova unità mobile?</div>
                <div class="faq-answer">Clicca sul pulsante 'Aggiungi Unità' in alto, inserisci il nome e seleziona la categoria.</div>
            </div>
            <div class="faq-item">
                <div class="faq-question">Come posso modificare un'unità esistente?</div>
                <div class="faq-answer">Clicca sull'icona di modifica accanto al nome dell'unità per cambiare il nome o la categoria.</div>
            </div>
            <div class="faq-item">
                <div class="faq-question">Come aggiungo articoli a un cassetto?</div>
                <div class="faq-answer">Usa il pulsante 'Aggiungi Articolo' all'interno di un cassetto o seleziona 'Scegli dal Catalogo' per aggiungerli dal catalogo predefinito.</div>
            </div>
            <div class="faq-item">
                <div class="faq-question">Come calcolo il valore totale di tutte le unità?</div>
                <div class="faq-answer">Clicca sul pulsante 'Calcola Valore' in alto per vedere il valore totale di tutte le unità mobili.</div>
            </div>
        `);
    }

    closeModal.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    window.addUnit = function() {
        const name = document.getElementById('unit-name').value;
        const categorySelect = document.getElementById('unit-category');
        const category = categorySelect.value;
        const categoryColor = categorySelect.options[categorySelect.selectedIndex].dataset.color;
        const newUnit = { id: Date.now(), name, category, categoryColor, drawers: [] };
        units.push(newUnit);
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.editUnit = function(unitIndex) {
        const unit = units[unitIndex];
        showModal('Modifica Unità', `
            <input type="text" id="edit-unit-name" value="${unit.name}">
            <select id="edit-unit-category">
                ${categories.map(cat => `<option value="${cat.name}" data-color="${cat.color}" ${unit.category === cat.name ? 'selected' : ''}>${cat.name}</option>`).join('')}
            </select>
            <button onclick="updateUnit(${unitIndex})" class="action-btn">Aggiorna</button>
        `);
    }

    window.updateUnit = function(unitIndex) {
        const name = document.getElementById('edit-unit-name').value;
        const categorySelect = document.getElementById('edit-unit-category');
        const category = categorySelect.value;
        const categoryColor = categorySelect.options[categorySelect.selectedIndex].dataset.color;
        units[unitIndex].name = name;
        units[unitIndex].category = category;
        units[unitIndex].categoryColor = categoryColor;
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.editUnitCategory = function(unitIndex) {
        const unit = units[unitIndex];
        showModal('Modifica Categoria', `
            <select id="edit-unit-category">
                ${categories.map(cat => `<option value="${cat.name}" data-color="${cat.color}" ${unit.category === cat.name ? 'selected' : ''}>${cat.name}</option>`).join('')}
            </select>
            <button onclick="updateUnitCategory(${unitIndex})" class="action-btn">Aggiorna Categoria</button>
        `);
    }

    window.updateUnitCategory = function(unitIndex) {
        const categorySelect = document.getElementById('edit-unit-category');
        const category = categorySelect.value;
        const categoryColor = categorySelect.options[categorySelect.selectedIndex].dataset.color;
        units[unitIndex].category = category;
        units[unitIndex].categoryColor = categoryColor;
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.deleteUnit = function(unitIndex) {
        if (confirm('Sei sicuro di voler eliminare questa unità?')) {
            units.splice(unitIndex, 1);
            localStorage.setItem('units', JSON.stringify(units));
            renderUnits();
        }
    }

    window.addDrawer = function(unitIndex) {
        showModal('Aggiungi Cassetto', `
            <input type="text" id="drawer-name" placeholder="Nome Cassetto">
            <button onclick="createDrawer(${unitIndex})" class="action-btn">Aggiungi</button>
        `);
    }

    window.createDrawer = function(unitIndex) {
        const name = document.getElementById('drawer-name').value;
        units[unitIndex].drawers.push({ id: Date.now(), name, items: [] });
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.editDrawer = function(unitIndex, drawerIndex) {
        const drawer = units[unitIndex].drawers[drawerIndex];
        showModal('Modifica Cassetto', `
            <input type="text" id="edit-drawer-name" value="${drawer.name}">
            <button onclick="updateDrawer(${unitIndex}, ${drawerIndex})" class="action-btn">Aggiorna</button>
        `);
    }

    window.updateDrawer = function(unitIndex, drawerIndex) {
        const name = document.getElementById('edit-drawer-name').value;
        units[unitIndex].drawers[drawerIndex].name = name;
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.deleteDrawer = function(unitIndex, drawerIndex) {
        if (confirm('Sei sicuro di voler eliminare questo cassetto?')) {
            units[unitIndex].drawers.splice(drawerIndex, 1);
            localStorage.setItem('units', JSON.stringify(units));
            renderUnits();
        }
    }

    window.addItem = function(unitIndex, drawerIndex) {
        showModal('Aggiungi Articolo', `
            <input type="text" id="item-name" placeholder="Nome Articolo">
            <input type="number" id="item-quantity" placeholder="Quantità" min="1" value="1">
            <input type="number" id="item-price" placeholder="Prezzo" step="0.01" min="0">
            <button onclick="createItem(${unitIndex}, ${drawerIndex})" class="action-btn">Aggiungi</button>
            <button onclick="showCatalog(${unitIndex}, ${drawerIndex})" class="action-btn">Scegli dal Catalogo</button>
        `);
    }

    window.createItem = function(unitIndex, drawerIndex) {
        const name = document.getElementById('item-name').value;
        const quantity = parseInt(document.getElementById('item-quantity').value);
        const price = parseFloat(document.getElementById('item-price').value);
        units[unitIndex].drawers[drawerIndex].items.push({ id: Date.now(), name, quantity, price });
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.editItem = function(unitIndex, drawerIndex, itemIndex) {
        const item = units[unitIndex].drawers[drawerIndex].items[itemIndex];
        showModal('Modifica Articolo', `
            <input type="text" id="edit-item-name" value="${item.name}">
            <input type="number" id="edit-item-quantity" value="${item.quantity}" min="1">
            <input type="number" id="edit-item-price" value="${item.price}" step="0.01" min="0">
            <button onclick="updateItem(${unitIndex}, ${drawerIndex}, ${itemIndex})" class="action-btn">Aggiorna</button>
        `);
    }

    window.updateItem = function(unitIndex, drawerIndex, itemIndex) {
        const name = document.getElementById('edit-item-name').value;
        const quantity = parseInt(document.getElementById('edit-item-quantity').value);
        const price = parseFloat(document.getElementById('edit-item-price').value);
        units[unitIndex].drawers[drawerIndex].items[itemIndex] = { ...units[unitIndex].drawers[drawerIndex].items[itemIndex], name, quantity, price };
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    window.deleteItem = function(unitIndex, drawerIndex, itemIndex) {
        if (confirm('Sei sicuro di voler eliminare questo articolo?')) {
            units[unitIndex].drawers[drawerIndex].items.splice(itemIndex, 1);
            localStorage.setItem('units', JSON.stringify(units));
            renderUnits();
        }
    }

    window.showCatalog = function(unitIndex, drawerIndex) {
        showModal('Catalogo', `
            <input type="text" id="catalog-search" placeholder="Cerca nel catalogo...">
            <div id="catalog-results" class="catalog-grid"></div>
        `);

        const searchInput = document.getElementById('catalog-search');
        const resultsDiv = document.getElementById('catalog-results');

        function renderCatalogResults(results) {
            resultsDiv.innerHTML = results.map(item => `
                <div class="catalog-item" onclick="selectCatalogItem(${unitIndex}, ${drawerIndex}, '${item.name}', ${item.price})">
                    <h4>${item.name}</h4>
                    <p>${item.category}</p>
                    <p>€${item.price.toFixed(2)}</p>
                </div>
            `).join('');
        }

        searchInput.oninput = function() {
            const query = this.value.toLowerCase();
            const results = catalog.filter(item => 
                item.name.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
            renderCatalogResults(results);
        };

        renderCatalogResults(catalog);
    }

    window.selectCatalogItem = function(unitIndex, drawerIndex, name, price) {
        showModal('Aggiungi Articolo dal Catalogo', `
            <h3>${name}</h3>
            <p>Prezzo: €${price.toFixed(2)}</p>
            <input type="number" id="item-quantity" placeholder="Quantità" min="1" value="1">
            <button onclick="createItemFromCatalog(${unitIndex}, ${drawerIndex}, '${name}', ${price})" class="action-btn">Aggiungi</button>
        `);
    }

    window.createItemFromCatalog = function(unitIndex, drawerIndex, name, price) {
        const quantity = parseInt(document.getElementById('item-quantity').value);
        units[unitIndex].drawers[drawerIndex].items.push({ id: Date.now(), name, quantity, price });
        localStorage.setItem('units', JSON.stringify(units));
        renderUnits();
        modal.style.display = 'none';
    }

    // Carica il catalogo
    fetch('Inventario.csv')
        .then(response => response.text())
        .then(data => {
            catalog = Papa.parse(data, { header: true }).data;
            catalog = catalog.map(item => ({
                name: item['Nome articolo'],
                category: item['Categoria'],
                price: parseFloat(item['Prezzo unitario'].replace('€', '').trim())
            }));
        })
        .catch(error => console.error('Errore nel caricamento del catalogo:', error));

    // Inizializzazione
    renderUnits();
});