// --- Client-Side Data Store ---
let tables = []; // Variable to hold API-fetched table data
let menu = []; // Local copy of menu items from the API
let cart = [];
let currentBillingOrderId = null; // Variable to track the currently viewed order ID

/// Function to fetch and display the menu on the Admin Dashboard
async function loadAdminMenu() {
    const menuTableBody = document.getElementById("admin-menu-body");
    if (!menuTableBody) return;
    menuTableBody.innerHTML = ''; // Clear existing rows

    try {
        // Fetch the current menu from the API
        const response = await fetch('api/menu.php');
        const data = await response.json();

        if (data.success) {
            data.menu.forEach(item => {
                const row = document.createElement("tr");
                row.className = 'border-t border-gray-200 dark:border-gray-800';
                row.innerHTML = `
                    <td class="p-4 text-gray-900 dark:text-white">${item.name}</td>
                    <td class="p-4 text-gray-500 dark:text-gray-400">${item.category}</td>
                    <td class="p-4 text-gray-500 dark:text-gray-400">$${parseFloat(item.price).toFixed(2)}</td>
                    <td class="p-4 text-right font-semibold">
                        <a href="#" onclick="openEditMenuModal(${item.item_id}, '${item.name.replace(/'/g, "\\'")}', '${item.category.replace(/'/g, "\\'")}', ${item.price})" class="text-primary hover:underline">Edit</a>
                        <a href="#" onclick="deleteMenuItem(${item.item_id})" class="text-red-500 hover:underline ml-4">Delete</a>
                    </td>
                `;
                menuTableBody.appendChild(row);
            });
        } else {
            console.error('Failed to load menu:', data.message);
        }
    } catch (error) {
        console.error('Network or server error:', error);
    }
}

/**
 * Initializes the Admin dashboard, loading the menu and setting up form handlers.
 */
function initAdmin() {
    loadAdminMenu();

    // Attach listener for the "Add New Menu Item" form
    const menuForm = document.getElementById("menu-form");
    if (menuForm && !menuForm.dataset.listenerAttached) {
        menuForm.addEventListener("submit", async e => {
            e.preventDefault();
            const name = document.getElementById("dish-name").value;
            const price = document.getElementById("dish-price").value;
            const category = document.getElementById("dish-category").value;

            try {
                const response = await fetch('api/menu.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, price, category })
                });
                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    menuForm.reset();
                    loadAdminMenu(); // Reload the table
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error("API Error:", error);
            }
        });
        menuForm.dataset.listenerAttached = 'true';
    }

    // Attach listener for the "Edit Menu Item" modal form
    document.getElementById('edit-menu-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemId = document.getElementById('edit-item-id').value;
        const name = document.getElementById('edit-dish-name').value;
        const category = document.getElementById('edit-dish-category').value;
        const price = document.getElementById('edit-dish-price').value;

        try {
            const response = await fetch('api/menu.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId, name, category, price })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                closeEditMenuModal();
                loadAdminMenu(); // Refresh the menu list
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('API Error:', error);
            alert('An error occurred while trying to save the changes.');
        }
    });
}

/**
 * Initializes the Admin dashboard, loading data and setting up form handlers.
 */
function initAdmin() {
    loadAdminMenu();
    loadStaffList();

    // Attach listener for the "Add New Menu Item" form
    const menuForm = document.getElementById("menu-form");
    if (menuForm && !menuForm.dataset.listenerAttached) {
        menuForm.addEventListener("submit", handleAddMenuItem);
        menuForm.dataset.listenerAttached = 'true';
    }

    // Attach listener for the "Edit Menu Item" modal form
    document.getElementById('edit-menu-form').addEventListener('submit', handleEditMenuItem);

    // Attach listener for the "Add Staff" button
    document.getElementById('add-staff-btn')?.addEventListener('click', () => {
        alert("Please use the Sign Up form on the main homepage to add new staff.");
    });

    // Attach listener for the "Edit Staff" modal form
    document.getElementById('edit-staff-form').addEventListener('submit', handleEditStaff);
}

/**
 * Opens the modal to edit a menu item and populates it with data.
 */
function openEditMenuModal(id, name, category, price) {
    document.getElementById('edit-item-id').value = id;
    document.getElementById('edit-dish-name').value = name;
    document.getElementById('edit-dish-category').value = category;
    document.getElementById('edit-dish-price').value = price;
    document.getElementById('editMenuModal').classList.remove('hidden');
}

/**
 * Closes the edit menu modal.
 */
function closeEditMenuModal() {
    document.getElementById('editMenuModal').classList.add('hidden');
}

/**
 * Fetches and renders the list of staff members on the Admin Dashboard.
 */
async function loadStaffList() {
    const staffTableBody = document.getElementById("staff-table-body");
    if (!staffTableBody) return;
    staffTableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading staff...</td></tr>';

    try {
        const response = await fetch('api/staff.php');
        const data = await response.json();

        if (data.success) {
            staffTableBody.innerHTML = '';
            data.staff.forEach(member => {
                const row = document.createElement("tr");
                row.className = 'border-t border-gray-200 dark:border-gray-800';
                // For now, status is hardcoded as Active. This can be a future feature.
                row.innerHTML = `
                    <td class="p-4 text-gray-900 dark:text-white">${member.username}</td>
                    <td class="p-4 text-gray-500 dark:text-gray-400">${member.role.charAt(0).toUpperCase() + member.role.slice(1)}</td>
                    <td class="p-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">Active</span></td>
                    <td class="p-4 text-primary font-semibold">
                        <a href="#" onclick="openEditStaffModal(${member.staff_id}, '${member.username}', '${member.role}')" class="hover:underline">Edit</a>
                        <a href="#" onclick="deleteStaff(${member.staff_id})" class="text-red-500 hover:underline ml-4">Delete</a>
                    </td>
                `;
                staffTableBody.appendChild(row);
            });
        } else {
            staffTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Staff list API Error:', error);
        staffTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Network Error.</td></tr>`;
    }
}

/**
 * Opens the modal to edit a staff member's role.
 */
function openEditStaffModal(staffId, username, role) {
    document.getElementById('edit-staff-id').value = staffId;
    document.getElementById('edit-staff-username').textContent = username;
    document.getElementById('edit-staff-role').value = role;
    document.getElementById('editStaffModal').classList.remove('hidden');
}

/**
 * Closes the edit staff modal.
 */
function closeEditStaffModal() {
    document.getElementById('editStaffModal').classList.add('hidden');
}

/**
 * Handles the submission of the edit staff form.
 */
async function handleEditStaff(e) {
    e.preventDefault();
    const staffId = document.getElementById('edit-staff-id').value;
    const role = document.getElementById('edit-staff-role').value;

    try {
        const response = await fetch('api/staff.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staffId, role: role })
        });
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            closeEditStaffModal();
            loadStaffList(); // Refresh the list
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('An error occurred while updating the staff role.');
    }
}

/**
 * Handles the deletion of a staff member.
 */
async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
        return;
    }
    const response = await fetch(`api/staff.php?staff_id=${staffId}`, { method: 'DELETE' });
    const data = await response.json();
    alert(data.message);
    if (data.success) {
        loadStaffList(); // Refresh the list
    }
}

// UI functions for the table status modal
function openModal(id, number, status) {
    const modal = document.getElementById("tableModal");
    document.getElementById("modalTableTitle").innerText = "Table " + number;
    
    const btns = document.getElementById("modalButtons");
    btns.innerHTML = "";
    
    if (status === "occupied") {
        btns.innerHTML = `<button onclick="setStatus(${id},'vacant')" class="w-full px-4 py-2 rounded-lg font-semibold bg-primary text-black">Set Vacant</button>`;
    } else if (status === "vacant") {
        btns.innerHTML = `
            <button onclick="setStatus(${id},'occupied')" class="w-full px-4 py-2 rounded-lg font-semibold bg-red-600 text-white">Set Occupied</button>
            <button onclick="setStatus(${id},'reserved')" class="w-full px-4 py-2 rounded-lg font-semibold bg-yellow-500 text-black">Set Reserved</button>`;
    } else if (status === "reserved") {
         btns.innerHTML = `
            <button onclick="setStatus(${id},'occupied')" class="w-full px-4 py-2 rounded-lg font-semibold bg-red-600 text-white">Set Occupied</button>
            <button onclick="setStatus(${id},'vacant')" class="w-full px-4 py-2 rounded-lg font-semibold bg-primary text-black">Set Vacant</button>`;
    }
    modal.classList.remove("hidden");
}

function closeModal(){ document.getElementById("tableModal").classList.add("hidden"); }

/**
 * Updates a table's status via an API PUT request.
 * @param {number} id The table_id from the database.
 * @param {string} status The new status ('vacant', 'occupied', 'reserved').
 */
async function setStatus(id, status){ 
    try {
        const response = await fetch('api/tables.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_id: id, status: status })
        });
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadWaiterTables(); // Reload tables to update UI
            closeModal();
        } else {
            alert("Failed to update status: " + data.message);
        }
    } catch (error) {
        alert("API error updating table status.");
    }
}

/**
 * Handles the deletion of a menu item.
 * @param {number} itemId The ID of the menu item to delete.
 */
async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`api/menu.php?item_id=${itemId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            loadAdminMenu(); // Reload the menu to reflect the deletion
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error("API Error:", error);
        alert('An error occurred while trying to delete the item.');
    }
}

/**
 * Table View: Fetch all tables from the API and render them.
 */
async function loadWaiterTables() {
    const container = document.getElementById("tables-container-body");
    if (!container) return;
    container.innerHTML = "<tr><td colspan='3' class='p-4 text-center'>Loading Tables...</td></tr>";

    try {
        const response = await fetch('api/tables.php');
        const data = await response.json();

        if (data.success) {
            tables = data.tables; // Store the fetched data locally
            container.innerHTML = "";
            tables.forEach(t => {
                const statusColor = t.status === "occupied" ? "text-red-500" : t.status === "reserved" ? "text-yellow-500" : "text-green-500";
                const row = document.createElement("tr");
                row.className = 'border-t border-gray-200 dark:border-gray-800';
                row.innerHTML = `
                    <td class="p-4 text-gray-900 dark:text-white">${t.table_number}</td>
                    <td class="p-4 font-semibold ${statusColor}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</td>
                    <td class="p-4 text-right">
                        <button onclick="openModal(${t.table_id}, '${t.table_number}', '${t.status}')" class="bg-primary text-black font-semibold py-1 px-3 rounded-lg text-sm">Edit Status</button>
                    </td>
                `;
                container.appendChild(row);
            });
        } else {
            container.innerHTML = `<tr><td colspan='3' class='p-4 text-center text-red-500'>Error: ${data.message}</td></tr>`;
        }
    } catch (error) {
        container.innerHTML = `<tr><td colspan='3' class='p-4 text-center text-red-500'>Network error loading tables.</td></tr>`;
        console.error("API Error:", error);
    }
}

/**
 * Generates a bill for an order via the API.
 * @param {number} orderId The ID of the order to bill.
 */
async function printBill(orderId) {
    if (!confirm(`Generate a bill for Order #${orderId}?`)) return;

    try {
        const response = await fetch('api/billing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            // In a real app, you would open a new window with the printable bill.
            console.log("Bill Generated:", data.bill);
        } else {
            alert("Error generating bill: " + data.message);
        }
    } catch (error) {
        console.error("Bill generation API error:", error);
        alert("A network error occurred while generating the bill.");
    }
}

/**
 * Prepares the UI to edit an existing order.
 * @param {number} orderId The ID of the order to edit.
 */
async function editOrder(orderId) {
    alert(`Editing Order #${orderId} is not fully implemented yet. This would load the order into the 'New Order' page.`);
    // Future implementation:
    // 1. Fetch the full order details.
    const response = await fetch(`api/orders.php?order_id=${orderId}`);
    const data = await response.json();

    if (data.success) {
        console.log("Order details to edit:", data.order);
        // 2. Populate the cart with the items from the order.
        // cart = data.order.items;
        // 3. Switch to the 'New Order' page.
        // showPage('waiter-new-order-view', 'waiter');
    }
}

// --- KITCHEN DASHBOARD FUNCTIONS ---

/**
 * Fetches menu from the database and renders it for ordering.
 */
async function loadMenuForOrder() {
    const list = document.getElementById("menuItems");
    if (!list) return;
    list.innerHTML = "Loading Menu...";

    try {
        // Fetching menu from the same API endpoint Admin uses (only GET is allowed)
        const response = await fetch('api/menu.php');
        const data = await response.json();

        if (data.success) {
            menu = data.menu; // Store the full menu locally
            list.innerHTML = "";
            menu.forEach(item=>{
                const div = document.createElement("div");
                div.className="flex justify-between p-2 bg-background-dark/50 rounded";
                // Pass item_id from DB instead of just name
                div.innerHTML = `<span>${item.name} - $${parseFloat(item.price).toFixed(2)}</span> <button class="btn" onclick="addToCart(${item.item_id}, '${item.name}', ${item.price})">Add</button>`;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = "Failed to load menu.";
        }
    } catch (error) {
        list.innerHTML = "Network error loading menu.";
        console.error("API Error:", error);
    }
}

/**
 * Adds an item to the cart or increments its quantity.
 * @param {number} item_id The database ID of the menu item.
 * @param {string} name The name of the item.
 * @param {number} price The price of the item.
 */
function addToCart(item_id, name, price){ 
    const existing = cart.find(i => i.item_id === item_id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ item_id, name, price: parseFloat(price), qty: 1 });
    }
    renderCart(); 
}

/**
 * Renders the current state of the cart to the UI.
 */
function renderCart(){
    const c=document.getElementById("cart");
    if(!c) return;
    c.innerHTML="";
    let total=0;
    
    // Render items with quantity
    cart.forEach((i,idx)=>{
        const itemTotal = i.price * i.qty;
        total += itemTotal;
        c.innerHTML+=`<div class="flex justify-between"><span>${i.qty}x ${i.name}</span> <span>$${itemTotal.toFixed(2)} <button onclick="removeCart(${idx})" class="text-red-500 dark:text-red-400">x</button></span></div>`;
    });
    
    c.innerHTML+=`<div class="mt-2 font-bold border-t border-gray-600 pt-2">Total: $${total.toFixed(2)}</div>`;
}

/**
 * Removes an item from the cart by its index.
 * @param {number} i The index of the item to remove.
 */
function removeCart(i){ 
    cart.splice(i,1); 
    renderCart(); 
}

/**
 * Submits the current cart as a new order to the API.
 */
async function submitOrder(){
    if(cart.length === 0){ alert("Cart empty"); return;}

    // NOTE: This is a simplification. A real system needs a robust way to select the table.
    const table_id = parseInt(document.getElementById('order-table-id-input').value);
    if (!table_id || isNaN(table_id)) {
        alert("Please select a valid table for this order.");
        return;
    }
    const orderNotes = document.getElementById("orderNotes").value;

    const itemsForApi = cart.map(i => ({
        item_id: i.item_id,
        qty: i.qty,
        price: i.price
    }));

    try {
        const response = await fetch('api/orders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_id, items: itemsForApi, notes: orderNotes })
        });
        const data = await response.json();

        if (data.success) {
            alert("Order submitted to kitchen! Order ID: " + data.order_id);
            cart = []; // Clear cart on success
            document.getElementById("orderNotes").value = '';
            document.getElementById('order-table-id-input').value = '';
            // Optionally redirect to active orders view
            showPage('waiter-orders-view', 'waiter');
        } else {
            alert("Order failed: " + data.message);
        }
    } catch (error) {
        alert("Network error: Order submission failed.");
        console.error("API Error:", error);
    }
}

/**
 * Switches the visible sub-page within a role's dashboard and triggers data loading.
 * @param {string} pageId The ID of the page section to show.
 * @param {string} role The role of the user ('waiter' or 'admin').
 */
function showPage(pageId, role) {
    // Hide all pages in the current role
    document.querySelectorAll(`.${role}-page`).forEach(page => page.classList.add('hidden'));

    // Show the requested page
    const newPage = document.getElementById(pageId);
    if (newPage) newPage.classList.remove('hidden');

    // Update navigation links' active state
    document.querySelectorAll(`.${role}-nav-btn`).forEach(link => {
        link.classList.remove('active', 'text-primary', 'font-semibold', 'border-primary');
        link.classList.add('border-transparent');
        if (link.dataset.page === pageId) link.classList.add('active', 'text-primary', 'font-semibold', 'border-primary');
    });

    // API-DRIVEN INITIALIZERS FOR WAITER
    if (pageId === 'waiter-tables-view') loadWaiterTables();
    if (pageId === 'waiter-new-order-view') { loadMenuForOrder(); renderCart(); }
    if (pageId === 'waiter-orders-view') { loadActiveOrders(); }
    if (pageId === 'waiter-reservations-view') { /* renderReservations(); */ } // Placeholder for reservations
}

/**
 * Initializes the waiter dashboard, sets up navigation, and loads the initial view.
 */
function initWaiter() {
    document.querySelectorAll('.waiter-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.target.dataset.page, 'waiter');
        });
    });

    // Set the initial page to be the table view
    showPage('waiter-tables-view', 'waiter');
}

/**
 * Fetches and renders the waiter's view of active orders into a table.
 */
async function loadActiveOrders(){
    const t=document.getElementById("ordersTableBody");
    if(!t) return;
    t.innerHTML="<tr><td colspan='5' class='p-2 text-center'>Loading active orders...</td></tr>";

    try {
        // Use the Kitchen API to read all active orders
        const response = await fetch('api/kitchen.php');
        const data = await response.json();

        if (!data.success) {
            t.innerHTML = `<tr><td colspan='5' class='p-2 text-center text-red-500'>Error: ${data.message}</td></tr>`;
            return;
        }
        
        t.innerHTML = "";
        
        data.orders.forEach(o=>{
            // Items are formatted in the Kitchen API using GROUP_CONCAT, join them back for display
            const itemsString = o.items.join(', ');

            // Action buttons for Waiter
            let actions = '';
            if (o.status === 'pending' || o.status === 'in_progress') {
                 actions = `<span class="text-yellow-500">${o.status.replace('_', ' ')}</span>`;
            } else if (o.status === 'ready') {
                 actions = `<button onclick="updateOrderStatus(${o.order_id}, 'served')" class="btn bg-green-500">Serve</button>`;
            }

            t.innerHTML+=`<tr>
              <td class="p-2">#${o.order_id}</td>
              <td class="p-2">${o.table_number}</td>
              <td class="p-2 text-sm">${itemsString}</td>
              <td class="p-2">${o.status.toUpperCase().replace('_', ' ')}</td>
              <td class="p-2 text-right">${actions}</td>
            </tr>`;
        });
    } catch (error) {
        console.error("Waiter Active Orders API Error:", error);
        t.innerHTML = `<tr><td colspan='5' class='p-2 text-center text-red-500'>Network Error.</td></tr>`;
    }
}

// --- KITCHEN DASHBOARD FUNCTIONS ---

/**
 * Fetches orders from the API and renders them on the Kitchen Dashboard.
 */
async function loadKitchenOrders() {
    const pendingDiv = document.getElementById("kitchen-pending");
    const progressDiv = document.getElementById("kitchen-in-progress");
    const readyDiv = document.getElementById("kitchen-ready");

    if (!pendingDiv || !progressDiv || !readyDiv) return;

    [pendingDiv, progressDiv, readyDiv].forEach(d => d.innerHTML = 'Loading orders...');

    try {
        const response = await fetch('api/kitchen.php');
        const data = await response.json();

        if (!data.success) {
             [pendingDiv, progressDiv, readyDiv].forEach(d => d.innerHTML = 'Error loading orders.');
             return;
        }

        // Clear and rebuild the content sections
        [pendingDiv, progressDiv, readyDiv].forEach(d => d.innerHTML = '');

        data.orders.forEach(order => {
            const orderCard = createKitchenOrderCard(order);
            if (order.status === 'pending') {
                pendingDiv.appendChild(orderCard);
            } else if (order.status === 'in_progress') {
                progressDiv.appendChild(orderCard);
            } else if (order.status === 'ready') {
                readyDiv.appendChild(orderCard);
            }
            // 'served' orders are not shown on the kitchen dashboard
        });

    } catch (error) {
        console.error("Kitchen API Error:", error);
        [pendingDiv, progressDiv, readyDiv].forEach(d => d.innerHTML = 'Network error loading orders.');
    }
}

/**
 * Helper function to create the dynamic HTML card for an order.
 * @param {object} order The order object from the API.
 * @returns {HTMLElement} A div element representing the order card.
 */
function createKitchenOrderCard(order) {
    const card = document.createElement('div');
    const statusClass = order.status === 'in_progress' ? 'bg-[#332419]' : 'bg-[#2C2C2C]';
    
    const itemsList = order.items.map(item => 
        `<p class="text-white text-sm font-medium">${item}</p>`
    ).join('');
    
    let actionButton = '';
    if (order.status === 'pending') {
        actionButton = `<button class="kitchen-action-btn start-cooking-btn" onclick="updateOrderStatus(${order.order_id}, 'in_progress')"><span>Start Cooking</span></button>`;
    } else if (order.status === 'in_progress') {
        actionButton = `<button class="mark-ready-btn kitchen-action-btn" onclick="updateOrderStatus(${order.order_id}, 'ready')"><span>Mark Ready</span></button>`;
    } else if (order.status === 'ready') {
        actionButton = `<div class="text-xs font-medium text-green-400 bg-green-400/20 px-2 py-1 rounded-full">Ready for Service</div>`;
    } else if (order.status === 'served') {
        // This case is for the waiter view, but we handle it here for the shared update function
        actionButton = `<div class="text-xs font-medium text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">Served</div>`;
    }

    card.className = `${statusClass} rounded-xl p-4 space-y-3`;
    card.innerHTML = `
        <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-3 flex-grow">
                <p class="text-sm font-medium text-[#999999]">Order ID: #${order.order_id}</p>
                <p class="text-lg font-bold">Table No: ${order.table_number}</p>
                <div class="flex flex-col gap-2 text-sm text-[#CCCCCC]">${itemsList}</div>
                ${order.order_notes ? `<p class="text-[#c9a892] text-sm pt-3 border-t border-[#483223]"><span class="font-bold text-white">Notes:</span> ${order.order_notes}</p>` : ''}
            </div>
            <div class="flex-shrink-0">${actionButton}</div>
        </div>
    `;
    return card;
}

/**
 * Calls the API to change an order's status.
 * @param {number} order_id The ID of the order to update.
 * @param {string} status The new status ('in_progress', 'ready', or 'served').
 */
async function updateOrderStatus(order_id, status) {
    try {
        const response = await fetch('api/kitchen.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id, status })
        });
        const data = await response.json();

        if (data.success) {
            // Reload the view based on which page is active
            if (document.getElementById('kitchen-dashboard')) {
                loadKitchenOrders();
            } else if (document.getElementById('waiter-dashboard')) { // Waiter is marking as served
                alert(`Order #${order_id} status updated to ${status}.`);
                loadActiveOrders();
            }
        } else {
            alert("Error updating status: " + data.message);
        }
    } catch (error) {
        alert("API error updating status.");
    }
}

/**
 * Initializes the kitchen dashboard.
 */
function initKitchen() {
    // Initial load of the orders:
    loadKitchenOrders();
}

// --- CASHIER DASHBOARD FUNCTIONS ---

/**
 * Renders the main records page for the cashier, fetching data from the API.
 */
async function renderPaymentRecords() {
    const tbody = document.getElementById("records-body");
    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='6' class='px-6 py-4 text-center text-gray-500'>Loading records...</td></tr>";

    try {
        // Fetch orders that are ready for billing
        const response = await fetch('api/billing.php');
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan='6' class='px-6 py-4 text-center text-red-500'>Error: ${data.message}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        if (data.records.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' class='px-6 py-4 text-center text-gray-500'>No occupied tables found.</td></tr>";
            return;
        }

        data.records.forEach(record => {
            // Determine display status. If a bill exists, use its status. Otherwise, it's ready to be billed.
            const status = record.payment_status || "Ready to Bill";
            // Use the bill's total if it exists, otherwise show 0.00.
            const total = record.total_amount || 0.00;
            
            let actionHtml = '';
            if (record.bill_id) {
                actionHtml = `<a href="#" onclick="showBillDetails(${record.order_id}, '${record.payment_status}')" class="text-blue-600 hover:text-blue-800">View Bill</a>`;
            } else {
                actionHtml = `<button onclick="generateBill(${record.order_id})" class="btn bg-green-500 text-xs">Generate Bill</button>`;
            }

            const row = `<tr>
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#${record.order_id}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${record.table_number}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${new Date(record.order_time).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">$${parseFloat(total).toFixed(2)}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${status}</td>
                <td class="px-6 py-4 text-sm text-primary font-semibold">${actionHtml}</td>
              </tr>`;
            tbody.insertAdjacentHTML("beforeend", row);
        });
    } catch (error) {
        console.error("Cashier Records API Error:", error);
        tbody.innerHTML = `<tr><td colspan='6' class='px-6 py-4 text-center text-red-500'>Network Error.</td></tr>`;
    }
}

/**
 * Calls the API to generate a bill for a specific order.
 * @param {number} orderId The ID of the order to generate a bill for.
 */
async function generateBill(orderId) {
    if (!confirm(`Are you sure you want to generate a bill for Order #${orderId}?`)) {
        return;
    }

    try {
        const response = await fetch('api/billing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            renderPaymentRecords(); // Refresh the list to show the new bill total and status
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Generate Bill API Error:", error);
        alert('A network error occurred while trying to generate the bill.');
    }
}

/**
 * Switches to the bill details page and triggers data loading for a specific order.
 * @param {number} orderId The ID of the order to show details for.
 * @param {string} currentStatus The current payment status of the bill.
 */
function showBillDetails(orderId, currentStatus) {
    // Switch the UI view
    showCashierPage('cashier-details'); 
    
    // Fetch and render the specific bill details
    renderBillDetails(orderId, currentStatus);
}

/**
 * Fetches and renders the itemized details for a single bill.
 * @param {number} orderId The ID of the order to render.
 * @param {string} currentStatus The current payment status passed from the previous view.
 */
async function renderBillDetails(orderId, currentStatus) {
    currentBillingOrderId = orderId; // Set the ID for the update button to use
    const billItemsBody = document.getElementById('bill-items');
    const billSummary = document.getElementById('bill-summary');
    const paymentStatusSelect = document.getElementById('payment-status');

    // Clear previous details and show loading state
    billItemsBody.innerHTML = '<tr><td colspan="3" class="py-2 text-center">Loading...</td></tr>';
    billSummary.innerHTML = '';

    try {
        // Fetch the specific order details from the API
        const response = await fetch(`api/orders.php?order_id=${orderId}`);
        const data = await response.json();

        if (!data.success) {
            billItemsBody.innerHTML = `<tr><td colspan="3" class="py-2 text-center text-red-500">Error: ${data.message}</td></tr>`;
            return;
        }

        const order = data.order;

        // Populate header details
        document.getElementById('order-id-details').textContent = `Order ID: #${order.order_id}`;
        document.getElementById('order-table-details').textContent = `Table: ${order.table_number}`;
        document.getElementById('order-date-details').textContent = `Date: ${new Date(order.order_time).toLocaleDateString()}`;

        // Pre-select the current payment status in the dropdown
        paymentStatusSelect.value = currentStatus;

        // Populate the itemized list
        billItemsBody.innerHTML = '';
        let subtotal = 0;
        order.items.forEach(item => {
            const total = item.qty * item.price;
            subtotal += total;
            billItemsBody.innerHTML += `
                <tr class="border-b">
                    <td class="py-2">${item.qty}x ${item.name}</td>
                    <td class="py-2 text-right">$${parseFloat(item.price).toFixed(2)}</td>
                    <td class="py-2 text-right">$${total.toFixed(2)}</td>
                </tr>
            `;
        });

        // Calculate and populate the final summary
        const tax = subtotal * 0.10; // Assuming a 10% tax rate
        const finalTotal = subtotal + tax;
        billSummary.innerHTML = `
            <div class="flex justify-between"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>Tax (10%)</span><span>$${tax.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>$${finalTotal.toFixed(2)}</span></div>
        `;

    } catch (error) {
        console.error('Error fetching bill details:', error);
        billItemsBody.innerHTML = `<tr><td colspan="3" class="py-2 text-center text-red-500">Network Error</td></tr>`;
    }
}

/**
 * Handles the API call to update the payment status of the current bill.
 */
async function handlePaymentUpdate() {
    if (!currentBillingOrderId) {
        alert("Error: No order selected.");
        return;
    }

    const status = document.getElementById("payment-status").value;

    try {
        const response = await fetch('api/billing.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: currentBillingOrderId, status: status })
        });
        const data = await response.json();

        if (data.success) {
            alert(`Payment status for Order #${currentBillingOrderId} updated to: ${status}`);
            // Go back to the records view to show the change
            showCashierPage('cashier-records');
        } else {
            alert("Update Failed: " + data.message);
        }
    } catch (error) {
        console.error("API error during payment update:", error);
        alert("A network error occurred during the payment update.");
    }
}

/**
 * Manages page visibility for the cashier dashboard.
 * @param {string} pageId The ID of the page to show.
 */
function showCashierPage(pageId) {
    document.querySelectorAll('.cashier-page').forEach(page => page.classList.add('hidden'));
    const newPage = document.getElementById(pageId);
    if (newPage) newPage.classList.remove('hidden');

    if (pageId === 'cashier-records') {
        renderPaymentRecords();
    }
}

/**
 * Initializes the cashier dashboard.
 */
function initCashier() {
    // Add event listener for the back button on the details page
    document.getElementById('back-to-records')?.addEventListener('click', () => {
        showCashierPage('cashier-records');
    });
    // Wire up the update button
    const updateBtn = document.getElementById("update-btn");
    if (updateBtn) {
        updateBtn.onclick = handlePaymentUpdate;
    }
    showCashierPage('cashier-records');
}