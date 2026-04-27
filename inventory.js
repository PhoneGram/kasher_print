// ==================== الكاشير - منطق صفحة المخزون ====================

document.addEventListener('DOMContentLoaded', function() {
    initInventoryPage();
});

// متغير لتتبع حالة حركة المخزون
let inventoryStatus = ''; // purchase أو damage

function initInventoryPage() {
    // عرض بيانات المخزون
    displayInventory();

    // تفعيل زر إضافة حركة مخزون
    const addBtn = document.getElementById('add-inventory-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            openAddInventoryModal();
        });
    }

    // تفعيل أزرار اختيار الحالة
    setupInventoryStatusButtons();

    // تفعيل أزرار زيادة ونقصان العدد
    setupInventoryQuantityButtons();

    // تفعيل حفظ الحركة
    const form = document.getElementById('add-inventory-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInventoryMovement();
        });
    }

    // تفعيل زر إلغاء الإضافة
    const cancelBtn = document.getElementById('cancel-add-inventory');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeModal('add-inventory-modal');
            resetInventoryForm();
        });
    }

    // إغلاق المودال بالنقر خارج المحتوى
    setupModalOutsideClick('add-inventory-modal', '.rounded-2xl');
}

// عرض بيانات المخزون
function displayInventory() {
    const inventory = getInventory();
    const availablePapers = inventory.availablePapers || 0;
    const movements = inventory.movements || [];

    // تحديث عرض الأوراق المتوفرة
    const papersEl = document.getElementById('available-papers');
    if (papersEl) {
        papersEl.textContent = formatNumber(availablePapers);
    }

    // عرض سجل الحركات
    const noInventoryMsg = document.getElementById('no-inventory-msg');
    const inventoryList = document.getElementById('inventory-list');

    if (!noInventoryMsg || !inventoryList) return;

    if (movements.length === 0) {
        noInventoryMsg.classList.remove('hidden');
        inventoryList.innerHTML = '';
        return;
    }

    noInventoryMsg.classList.add('hidden');

    // ترتيب الحركات من الأحدث إلى الأقدم
    const sortedMovements = sortByDateDesc([...movements], 'createdAt');

    let html = '';
    sortedMovements.forEach(function(movement) {
        html += createInventoryCard(movement);
    });

    inventoryList.innerHTML = html;
}

// إنشاء بطاقة حركة مخزون
function createInventoryCard(movement) {
    let statusText = '';
    let statusColor = '';
    let borderColor = '';
    let bgColor = '';

    switch (movement.status) {
        case 'purchase':
            statusText = '🟢 شراء جديد';
            statusColor = 'text-green-700 dark:text-green-400';
            borderColor = 'border-green-500';
            bgColor = 'bg-green-50 dark:bg-green-900/20';
            break;
        case 'damage':
            statusText = '🔴 تلف';
            statusColor = 'text-red-700 dark:text-red-400';
            borderColor = 'border-red-500';
            bgColor = 'bg-red-50 dark:bg-red-900/20';
            break;
        case 'printed':
            statusText = '🟠 مطبوعات';
            statusColor = 'text-orange-700 dark:text-orange-400';
            borderColor = 'border-orange-500';
            bgColor = 'bg-orange-50 dark:bg-orange-900/20';
            break;
        default:
            statusText = movement.status;
            statusColor = 'text-gray-700 dark:text-gray-400';
            borderColor = 'border-gray-500';
            bgColor = 'bg-gray-50 dark:bg-gray-700';
    }

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-r-4 ${borderColor} ${bgColor}">
            <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-lg ${statusColor}">${statusText}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">${formatDate(movement.date)}</span>
            </div>
            <div class="flex items-center justify-between">
                <div>
                    <span class="text-gray-500 dark:text-gray-400">العدد:</span>
                    <span class="font-bold mr-1 text-lg">${movement.quantity}</span>
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500">${formatDateTime(movement.createdAt)}</span>
            </div>
            ${movement.invoiceId ? '<div class="mt-1 text-xs text-gray-400 dark:text-gray-500">مرتبط بفاتورة</div>' : ''}
        </div>
    `;
}

// فتح مودال إضافة حركة مخزون
function openAddInventoryModal() {
    resetInventoryForm();
    openModal('add-inventory-modal');
}

// تفعيل أزرار اختيار حالة المخزون
function setupInventoryStatusButtons() {
    const purchaseBtn = document.getElementById('status-purchase');
    const damageBtn = document.getElementById('status-damage');
    const statusInput = document.getElementById('inventory-status');

    if (!purchaseBtn || !damageBtn) return;

    purchaseBtn.addEventListener('click', function() {
        inventoryStatus = 'purchase';
        statusInput.value = 'purchase';
        
        purchaseBtn.classList.add('status-btn-active');
        damageBtn.classList.remove('status-btn-active');
        
        purchaseBtn.classList.remove('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
        damageBtn.classList.add('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
        damageBtn.classList.remove('bg-red-600', 'text-white');
    });

    damageBtn.addEventListener('click', function() {
        inventoryStatus = 'damage';
        statusInput.value = 'damage';
        
        damageBtn.classList.add('status-btn-active');
        purchaseBtn.classList.remove('status-btn-active');
        
        damageBtn.classList.remove('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
        purchaseBtn.classList.add('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
        purchaseBtn.classList.remove('bg-green-600', 'text-white');
    });
}

// تفعيل أزرار زيادة ونقصان العدد في المخزون
function setupInventoryQuantityButtons() {
    const decreaseBtn = document.getElementById('decrease-inv-qty');
    const increaseBtn = document.getElementById('increase-inv-qty');
    const qtyInput = document.getElementById('inv-qty');

    if (!decreaseBtn || !increaseBtn || !qtyInput) return;

    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value) || 1;
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });

    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value) || 0;
        qtyInput.value = currentValue + 1;
    });
}

// حفظ حركة المخزون
function saveInventoryMovement() {
    // التحقق من اختيار الحالة
    if (!inventoryStatus) {
        showToast('يرجى اختيار الحالة (شراء جديد / تلف)', 'error');
        return;
    }

    // الحصول على العدد
    const qtyInput = document.getElementById('inv-qty');
    const quantity = parseInt(qtyInput ? qtyInput.value : 0);

    if (quantity <= 0) {
        showToast('يرجى تحديد العدد', 'error');
        return;
    }

    // التحقق من توفر أوراق كافية في حالة التلف
    if (inventoryStatus === 'damage') {
        const inventory = getInventory();
        if (quantity > inventory.availablePapers) {
            showToast('عدد الأوراق غير كافٍ! المتوفر: ' + inventory.availablePapers, 'error');
            return;
        }
    }

    // إنشاء كائن الحركة
    const movement = {
        quantity: quantity,
        status: inventoryStatus,
        date: getTodayDate()
    };

    // حفظ الحركة
    const result = addInventoryMovement(movement);

    if (result) {
        showToast('تم حفظ حركة المخزون بنجاح ✅', 'success');
        
        // إعادة تعيين النموذج وإغلاق المودال
        closeModal('add-inventory-modal');
        resetInventoryForm();
        
        // تحديث عرض المخزون
        displayInventory();
    } else {
        showToast('حدث خطأ أثناء حفظ حركة المخزون', 'error');
    }
}

// إعادة تعيين نموذج المخزون
function resetInventoryForm() {
    const qtyInput = document.getElementById('inv-qty');
    const statusInput = document.getElementById('inventory-status');
    
    if (qtyInput) qtyInput.value = '1';
    if (statusInput) statusInput.value = '';
    
    inventoryStatus = '';

    // إعادة تعيين أزرار الحالة
    const purchaseBtn = document.getElementById('status-purchase');
    const damageBtn = document.getElementById('status-damage');

    if (purchaseBtn) {
        purchaseBtn.classList.remove('status-btn-active', 'bg-green-600', 'text-white');
        purchaseBtn.classList.add('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
    }

    if (damageBtn) {
        damageBtn.classList.remove('status-btn-active', 'bg-red-600', 'text-white');
        damageBtn.classList.add('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
    }
}