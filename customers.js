// ==================== الكاشير - منطق صفحة الزبائن ====================

document.addEventListener('DOMContentLoaded', function() {
    initCustomersPage();
});

function initCustomersPage() {
    // عرض قائمة الزبائن
    displayCustomers();

    // تفعيل زر إضافة زبون جديد
    const addBtn = document.getElementById('add-customer-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            openModal('add-customer-modal');
            document.getElementById('customer-name').focus();
        });
    }

    // تفعيل زر إلغاء الإضافة
    const cancelBtn = document.getElementById('cancel-add-customer');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeModal('add-customer-modal');
            document.getElementById('customer-name').value = '';
        });
    }

    // إغلاق المودال بالنقر خارج المحتوى
    setupModalOutsideClick('add-customer-modal', '.rounded-2xl');

    // تفعيل حفظ زبون جديد
    const form = document.getElementById('add-customer-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewCustomer();
        });
    }
}

// عرض قائمة الزبائن
function displayCustomers() {
    const customers = getCustomers();
    const noCustomersMsg = document.getElementById('no-customers-msg');
    const customersList = document.getElementById('customers-list');

    if (!noCustomersMsg || !customersList) return;

    if (customers.length === 0) {
        noCustomersMsg.classList.remove('hidden');
        customersList.innerHTML = '';
        return;
    }

    noCustomersMsg.classList.add('hidden');

    let html = '';
    customers.forEach(function(customer, index) {
        html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex items-center justify-between hover:shadow-xl transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                        ${customer.name.charAt(0)}
                    </div>
                    <div>
                        <h3 class="font-bold">${customer.name}</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(customer.createdAt.split('T')[0])}</p>
                    </div>
                </div>
                <button class="delete-customer-btn w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors text-lg" data-customer-id="${customer.id}" title="حذف الزبون">
                    🗑️
                </button>
            </div>
        `;
    });

    customersList.innerHTML = html;

    // إضافة أحداث أزرار الحذف
    attachDeleteEvents();
}

// إضافة أحداث حذف الزبائن
function attachDeleteEvents() {
    const deleteButtons = document.querySelectorAll('.delete-customer-btn');
    deleteButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const customerId = this.getAttribute('data-customer-id');
            handleDeleteCustomer(customerId);
        });
    });
}

// حفظ زبون جديد
function saveNewCustomer() {
    const nameInput = document.getElementById('customer-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
        showToast('يرجى إدخال اسم الزبون', 'error');
        return;
    }

    // التحقق من عدم وجود زبون بنفس الاسم
    const customers = getCustomers();
    const exists = customers.some(function(c) {
        return c.name.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
        showToast('يوجد زبون بنفس الاسم بالفعل', 'warning');
        return;
    }

    // إضافة الزبون
    const result = addCustomer({ name: name });

    if (result) {
        showToast('تم إضافة الزبون بنجاح ✅', 'success');
        
        // إعادة تعيين النموذج وإغلاق المودال
        nameInput.value = '';
        closeModal('add-customer-modal');
        
        // تحديث عرض القائمة
        displayCustomers();
    } else {
        showToast('حدث خطأ أثناء إضافة الزبون', 'error');
    }
}

// حذف زبون
function handleDeleteCustomer(customerId) {
    const customers = getCustomers();
    const customer = customers.find(function(c) {
        return c.id === customerId;
    });

    if (!customer) return;

    // التحقق من عدم وجود فواتير مرتبطة بهذا الزبون
    const invoices = getInvoices();
    const hasInvoices = invoices.some(function(inv) {
        return inv.customerId === customerId;
    });

    if (hasInvoices) {
        showToast('لا يمكن حذف الزبون لوجود فواتير مرتبطة به', 'warning');
        return;
    }

    const confirmed = confirm('هل أنت متأكد من حذف الزبون "' + customer.name + '"؟');
    
    if (!confirmed) return;

    const result = deleteCustomer(customerId);

    if (result) {
        showToast('تم حذف الزبون بنجاح ✅', 'success');
        displayCustomers();
    } else {
        showToast('حدث خطأ أثناء حذف الزبون', 'error');
    }
}