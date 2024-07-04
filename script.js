document.addEventListener('DOMContentLoaded', function() {
    const predefinedCategories = [
        { id: 1, name: 'Chirurgia', color: '#033663' },
        { id: 2, name: 'Implantologia', color: '#008C73' },
        { id: 3, name: 'Parodontologia', color: '#78CFB3' },
        { id: 4, name: 'Conservativa', color: '#6B8E23' },
        { id: 5, name: 'Endodonzia', color: '#F3C178' },
        { id: 6, name: 'Pedodonzia', color: '#FE5E41' }
    ];

    let units = JSON.parse(localStorage.getItem('units')) || [];
    let drawers = JSON.parse(localStorage.getItem('drawers')) || [];
    let items = JSON.parse(localStorage.getItem('items')) || [];
    let inventory = [];

    const unitForm = document.getElementById('unit-form');
    const drawerForm = document.getElementById('drawer-form');
    const itemForm = document.getElementById('item-form');

    const unitCategory = document.getElementById('unit-category');
    const drawerUnit = document.getElementById('drawer-unit');
    const itemDrawer = document.getElementById('item-drawer');
    const itemMaterial = document.getElementById('item-material');

    const summaryTable = document.getElementById('summary-table');
    const summaryTableBody = document.querySelector('#summary-table tbody');
    const summaryTableFooter = document.querySelector('#summary-table tfoot');
    const orgChart = document.getElementById('org-chart');
    const tableContainer = document.getElementById('table-container');
    const toggleTableButton = document.getElementById('toggle-table');
    const toggleIcon = document.getElementById('toggle-icon');

    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const loadFileInput = document.getElementById('load-file');
    const exportButton = document.getElementById('export-button');

    const materialPopup = document.getElementById('material-popup');
    const closePopupButton = materialPopup.querySelector('.close');
    const searchMaterial = document.getElementById('search-material');
    const materialTableBody = document.querySelector('#material-table tbody');
    const selectMaterialButton = document.getElementById('select-material-button');

    async function loadInventory() {
        try {
            const response = await fetch('Inventario.csv');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const csvData = await response.text();
            const data = Papa.parse(csvData, { header: true }).data;
            inventory = data;
            localStorage.setItem('inventory', JSON.stringify(inventory));  // Save inventory to local storage
            renderInventoryTable(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore di caricamento',
                text: 'Non è stato possibile caricare i dati dell\'inventario. Assicurati che il file Inventario.csv sia presente.',
            });
        }
    }
    
    

    function saveData() {
        localStorage.setItem('units', JSON.stringify(units));
        localStorage.setItem('drawers', JSON.stringify(drawers));
        localStorage.setItem('items', JSON.stringify(items));
    }

    function renderOptions(element, list, renderOption) {
        element.innerHTML = '';
        list.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = renderOption(item);
            element.appendChild(option);
        });
    }

    function renderSummaryTable() {
        summaryTableBody.innerHTML = '';
        let totalOverall = 0;
        items.forEach(item => {
            const drawer = drawers.find(d => d.id === item.drawerId);
            const unit = units.find(u => u.id === drawer.unitId);
            const category = predefinedCategories.find(c => c.id === unit.categoryId);
            const totalValue = item.quantity * item.price;
            totalOverall += totalValue;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="border: 2px solid ${category.color}; color: ${category.color};">${category.name}</td>
                <td>${unit.name}</td>
                <td>${drawer.name}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>€${item.price.toFixed(2)}</td>
                <td>€${totalValue.toFixed(2)}</td>
            `;
            summaryTableBody.appendChild(row);
        });
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="6" style="text-align: right;">Totale complessivo:</td>
            <td id="total-overall">€${totalOverall.toFixed(2)}</td>
        `;
        summaryTableFooter.innerHTML = '';
        summaryTableFooter.appendChild(totalRow);
        document.getElementById('total-overall-button').textContent = `Totale complessivo: €${totalOverall.toFixed(2)}`;
    }

    function renderOrgChart() {
        orgChart.innerHTML = '';
        let rowDiv;
        predefinedCategories.forEach((category, index) => {
            if (index % 2 === 0) {
                rowDiv = document.createElement('div');
                rowDiv.classList.add('category-row');
                orgChart.appendChild(rowDiv);
            }
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category');
            categoryDiv.style.borderColor = category.color;
            categoryDiv.innerHTML = `<strong>${category.name}</strong>`;
            const unitsDiv = document.createElement('div');
            unitsDiv.classList.add('units');
            const unitsInCategory = units.filter(unit => unit.categoryId === category.id);
            unitsInCategory.forEach(unit => {
                const unitDiv = document.createElement('div');
                unitDiv.classList.add('unit');
                let unitTotalValue = 0;
                const drawersDiv = document.createElement('div');
                drawersDiv.classList.add('drawers');
                const drawersInUnit = drawers.filter(drawer => drawer.unitId === unit.id);
                drawersInUnit.forEach(drawer => {
                    let drawerTotalValue = 0;
                    const drawerDiv = document.createElement('div');
                    drawerDiv.classList.add('drawer');
                    const itemsInDrawer = items.filter(item => item.drawerId === drawer.id);
                    itemsInDrawer.forEach(item => {
                        drawerTotalValue += item.quantity * item.price;
                    });
                    drawerDiv.innerHTML = `
                        <div>
                            <i class="fas fa-drawer"></i> 
                            <span class="drawer-name" data-drawer-id="${drawer.id}">${drawer.name}</span> 
                            <span class="drawer-total">Totale: €${drawerTotalValue.toFixed(2)}</span>
                            <button class="delete-button" data-id="${drawer.id}" data-type="drawer">✖</button>
                        </div>
                    `;
                    drawersDiv.appendChild(drawerDiv);
                    unitTotalValue += drawerTotalValue;
                });
                unitDiv.innerHTML = `
                    <div>
                        <i class="fas fa-cube"></i> ${unit.name} 
                        <span class="unit-total" style="float: right;">Totale Unità: €${unitTotalValue.toFixed(2)}</span>
                        <button class="delete-button" data-id="${unit.id}" data-type="unit">✖</button>
                    </div>
                `;
                unitDiv.appendChild(drawersDiv);
                unitsDiv.appendChild(unitDiv);
            });
            categoryDiv.appendChild(unitsDiv);
            rowDiv.appendChild(categoryDiv);
        });

        document.querySelectorAll('.drawer-name').forEach(drawerName => {
            drawerName.addEventListener('click', function() {
                const drawerId = this.getAttribute('data-drawer-id');
                const drawer = drawers.find(d => d.id == drawerId);
                const itemsInDrawer = items.filter(item => item.drawerId == drawerId);
                let drawerTotalValue = 0;
                const drawerContent = itemsInDrawer.map(item => {
                    const itemTotal = item.quantity * item.price;
                    drawerTotalValue += itemTotal;
                    return `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>€${item.price.toFixed(2)}</td>
                            <td>€${itemTotal.toFixed(2)}</td>
                            <td><button class="delete-item-button" data-id="${item.id}" data-drawer-id="${drawerId}">✖</button></td>
                        </tr>
                    `;
                }).join('');
                Swal.fire({
                    title: drawer.name,
                    html: `
                        <table>
                            <thead>
                                <tr>
                                    <th>Materiale</th>
                                    <th>Quantità</th>
                                    <th>Valore Unitario</th>
                                    <th>Totale</th>
                                    <th>Elimina</th>
                                </tr>
                            </thead>
                            <tbody>${drawerContent}</tbody>
                        </table>
                        <p>Valore Totale Cassetto: €${drawerTotalValue.toFixed(2)}</p>
                    `,
                    showCloseButton: true,
                    focusConfirm: false,
                    confirmButtonText: 'Chiudi'
                }).then(() => {
                    document.querySelectorAll('.delete-item-button').forEach(button => {
                        button.addEventListener('click', function() {
                            const itemId = parseInt(this.getAttribute('data-id'), 10);
                            const drawerId = parseInt(this.getAttribute('data-drawer-id'), 10);
                            items = items.filter(item => item.id !== itemId);
                            saveData();
                            renderSummaryTable();
                            renderOrgChart();
                            Swal.close();
                            setTimeout(() => {
                                document.querySelector(`[data-drawer-id="${drawerId}"]`).click();
                            }, 500);
                        });
                    });
                });
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = parseInt(this.getAttribute('data-id'), 10);
                const itemType = this.getAttribute('data-type');
                if (itemType === 'unit') {
                    const unitDrawers = drawers.filter(drawer => drawer.unitId === itemId);
                    unitDrawers.forEach(drawer => {
                        items = items.filter(item => item.drawerId !== drawer.id);
                    });
                    drawers = drawers.filter(drawer => drawer.unitId !== itemId);
                    units = units.filter(unit => unit.id !== itemId);
                } else if (itemType === 'drawer') {
                    items = items.filter(item => item.drawerId !== itemId);
                    drawers = drawers.filter(drawer => drawer.id !== itemId);
                }
                renderSummaryTable();
                renderOrgChart();
                saveData();
            });
        });
    }

    toggleTableButton.addEventListener('click', function() {
        if (summaryTableBody.style.display === 'none') {
            summaryTableBody.style.display = 'table-row-group';
            summaryTableFooter.style.display = 'table-footer-group';
            toggleIcon.classList.remove('fa-angle-down');
            toggleIcon.classList.add('fa-angle-up');
        } else {
            summaryTableBody.style.display = 'none';
            summaryTableFooter.style.display = 'none';
            toggleIcon.classList.remove('fa-angle-up');
            toggleIcon.classList.add('fa-angle-down');
        }
    });

    saveButton.addEventListener('click', function() {
        const data = {
            units: units,
            drawers: drawers,
            items: items         };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    
        loadButton.addEventListener('click', function() {
            loadFileInput.click();
        });
    
        loadFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                units = data.units || [];
                drawers = data.drawers || [];
                items = data.items || [];
                saveData();
                initialize();
            };
            reader.readAsText(file);
        });
    
        exportButton.addEventListener('click', function() {
            const table = document.getElementById('summary-table');
            const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
            XLSX.writeFile(wb, "summary.xlsx");
        });
    
        function initialize() {
            const savedUnits = localStorage.getItem('units');
            const savedDrawers = localStorage.getItem('drawers');
            const savedItems = localStorage.getItem('items');
            const savedInventory = localStorage.getItem('inventory');
        
            if (savedUnits && savedDrawers && savedItems && savedInventory) {
                units = JSON.parse(savedUnits);
                drawers = JSON.parse(savedDrawers);
                items = JSON.parse(savedItems);
                inventory = JSON.parse(savedInventory);
                renderInventoryTable(inventory);
            } else {
                loadInventory();  // Load from CSV if not available in local storage
            }
        
            renderOptions(unitCategory, predefinedCategories, category => category.name);
            renderOptions(drawerUnit, units, unit => unit.name);
            renderOptions(itemDrawer, drawers, drawer => drawer.name);
            renderSummaryTable();
            renderOrgChart();
        }
        
    
        unitForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const categoryId = parseInt(unitCategory.value, 10);
            const name = document.getElementById('unit-name').value;
            const id = units.length + 1;
            units.push({ id, categoryId, name });
            renderOptions(drawerUnit, units, unit => unit.name);
            unitForm.reset();
            saveData();
            renderOrgChart();
        });
    
        drawerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const unitId = parseInt(drawerUnit.value, 10);
            const name = document.getElementById('drawer-name').value;
            const id = drawers.length + 1;
            drawers.push({ id, unitId, name });
            renderOptions(itemDrawer, drawers, drawer => drawer.name);
            drawerForm.reset();
            saveData();
            renderOrgChart();
        });
    
        itemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const drawerId = parseInt(itemDrawer.value, 10);
            const name = document.getElementById('item-material').value;
            const quantity = parseInt(document.getElementById('item-quantity').value, 10);
            const price = parseFloat(document.getElementById('item-price').value);
            const existingItem = items.find(item => item.drawerId === drawerId && item.name === name);
            if (existingItem) {
                existingItem.quantity = quantity;
                existingItem.price = price;
            } else {
                const id = items.length + 1;
                items.push({ id, drawerId, name, quantity, price });
            }
            itemForm.reset();
            saveData();
            renderSummaryTable();
            renderOrgChart();
        });
    
        selectMaterialButton.addEventListener('click', function() {
            materialPopup.style.display = 'block';
        });
    
        closePopupButton.addEventListener('click', function() {
            materialPopup.style.display = 'none';
        });
    
        searchMaterial.addEventListener('input', function() {
            const query = searchMaterial.value.toLowerCase();
            const filteredInventory = inventory.filter(item =>
                item['Nome articolo'].toLowerCase().includes(query)
            );
            renderInventoryTable(filteredInventory);
        });
    
        function renderInventoryTable(data) {
            materialTableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item['Nome articolo']}</td>
                    <td>${item['Categoria']}</td>
                    <td>${item['Prezzo unitario'].replace('€', '').trim()}</td>
                    <td><button class="select-item-button" data-name="${item['Nome articolo']}" data-price="${item['Prezzo unitario'].replace('€', '').trim()}">Seleziona</button></td>
                `;
                materialTableBody.appendChild(row);
            });
    
            document.querySelectorAll('.select-item-button').forEach(button => {
                button.addEventListener('click', function() {
                    const name = this.getAttribute('data-name');
                    const price = parseFloat(this.getAttribute('data-price'));
                    document.getElementById('item-material').value = name;
                    document.getElementById('item-price').value = price;
                    materialPopup.style.display = 'none';
                });
            });
        }
    
        loadInventory();
        initialize();
    });
    

