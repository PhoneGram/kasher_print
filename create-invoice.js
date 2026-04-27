// ==================== الكاشير - منطق صفحة إنشاء فاتورة ====================

document.addEventListener('DOMContentLoaded', function() {
    initCreateInvoicePage();
});

// متغيرات الصفحة
let invoiceStatus = ''; // paid أو unpaid
let dateMode = 'auto'; // auto أو manual

function initCreateInvoicePage() {
    // تحميل قائمة الزبائن
    loadCustomersList();

    // تعيين التاريخ تلقائياً
    setTodayDate();

    // تفعيل أزرار اختيار الحالة
    setupStatusButtons();

    // تفعيل أزرار زيادة/نقصان العدد
    setupQuantityButtons();

    // تفعيل زر تبديل وضع التاريخ
    setupDateToggle();

    // تحديث المجموع عند تغيير العدد
    document.getElementById('print-qty').addEventListener('change', updateTotalDisplay);
    document.getElementById('increase-qty').addEventListener('click', updateTotalDisplay);
    document.getElementById('decrease-qty').addEventListener('click', updateTotalDisplay);

    // تفعيل حفظ الفاتورة
    document.getElementById('create-invoice-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveInvoice();
    });

    // تحديث عرض المجموع الأولي
    updateTotalDisplay();
}

// تحميل قائمة الزبائن في select
function loadCustomersList() {
    const customers = getCustomers();
    const select = document.getElementById('customer-select');
    
    if (!select) return;

    // الاحتفاظ بالخيار الأول (اختر زبون...)
    select.innerHTML = '<option value="">اختر زبون...</option>';

    if (customers.length === 0) {
        // إضافة خيار تنبيهي
        select.innerHTML += '<option value="" disabled>لا يوجد زبائن - أضف زبوناً أولاً</option>';
    } else {
        customers.forEach(function(customer) {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }
}

// تعيين تاريخ اليوم تلقائياً
function setTodayDate() {
    const dateInput = document.getElementById('invoice-date');
    if (dateInput) {
        dateInput.value = getTodayDate();
        dateInput.disabled = true;
    }
}

// تفعيل أزرار اختيار حالة الفاتورة
function setupStatusButtons() {
    const paidBtn = document.getElementById('status-paid');
    const unpaidBtn = document.getElementById('status-unpaid');
    const statusInput = document.getElementById('invoice-status');

    if (!paidBtn || !unpaidBtn) return;

    paidBtn.addEventListener('click', function() {
        invoiceStatus = 'paid';
        statusInput.value = 'paid';
        
        paidBtn.classList.add('status-btn-active');
        unpaidBtn.classList.remove('status-btn-active');
        
        // إزالة الكلاسات الافتراضية وتطبيق النشط
        paidBtn.classList.remove('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
        unpaidBtn.classList.add('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
        unpaidBtn.classList.remove('bg-red-600', 'text-white');
    });

    unpaidBtn.addEventListener('click', function() {
        invoiceStatus = 'unpaid';
        statusInput.value = 'unpaid';
        
        unpaidBtn.classList.add('status-btn-active');
        paidBtn.classList.remove('status-btn-active');
        
        unpaidBtn.classList.remove('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
        paidBtn.classList.add('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
        paidBtn.classList.remove('bg-green-600', 'text-white');
    });
}

// تفعيل أزرار زيادة ونقصان العدد
function setupQuantityButtons() {
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const qtyInput = document.getElementById('print-qty');

    if (!decreaseBtn || !increaseBtn || !qtyInput) return;

    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value) || 1;
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
            updateTotalDisplay();
        }
    });

    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value) || 0;
        qtyInput.value = currentValue + 1;
        updateTotalDisplay();
    });
}

// تفعيل زر تبديل وضع التاريخ
function setupDateToggle() {
    const toggleBtn = document.getElementById('toggle-date-mode');
    const dateInput = document.getElementById('invoice-date');

    if (!toggleBtn || !dateInput) return;

    toggleBtn.addEventListener('click', function() {
        if (dateMode === 'auto') {
            dateMode = 'manual';
            dateInput.disabled = false;
            toggleBtn.textContent = '🔄 تلقائي';
            dateInput.focus();
        } else {
            dateMode = 'auto';
            dateInput.disabled = true;
            dateInput.value = getTodayDate();
            toggleBtn.textContent = '🔄 يدوي';
        }
    });
}

// تحديث عرض المجموع
function updateTotalDisplay() {
    const qtyInput = document.getElementById('print-qty');
    const totalEl = document.getElementById('total-amount');
    const settings = getSettings();
    const printPrice = settings.printPrice || 1000;

    if (!qtyInput || !totalEl) return;

    const qty = parseInt(qtyInput.value) || 0;
    const total = qty * printPrice;

    totalEl.textContent = formatNumber(total);
}

// حفظ الفاتورة الجديدة
function saveInvoice() {
    // التحقق من اختيار زبون
    const customerSelect = document.getElementById('customer-select');
    const customerId = customerSelect ? customerSelect.value : '';
    
    if (!customerId) {
        showToast('يرجى اختيار زبون', 'error');
        return;
    }

    // التحقق من اختيار حالة الفاتورة
    if (!invoiceStatus) {
        showToast('يرجى اختيار حالة الفاتورة (مدفوعة / غير مدفوعة)', 'error');
        return;
    }

    // الحصول على بيانات الزبون
    const customers = getCustomers();
    const customer = customers.find(function(c) {
        return c.id === customerId;
    });

    if (!customer) {
        showToast('الزبون غير موجود', 'error');
        return;
    }

    // الحصول على عدد المطبوعات
    const printQty = parseInt(document.getElementById('print-qty').value) || 0;
    
    if (printQty <= 0) {
        showToast('يرجى تحديد عدد المطبوعات', 'error');
        return;
    }

    // التحقق من توفر أوراق كافية في المخزون
    const inventory = getInventory();
    if (printQty > inventory.availablePapers) {
        showToast('عدد الأوراق غير كافٍ في المخزون! المتوفر: ' + inventory.availablePapers, 'error');
        return;
    }

    // الحصول على التاريخ
    const dateInput = document.getElementById('invoice-date');
    const date = dateInput ? dateInput.value : getTodayDate();

    // الحصول على الملاحظات
    const notesInput = document.getElementById('invoice-notes');
    const notes = notesInput && notesInput.value.trim() ? notesInput.value.trim() : 'لا يوجد';

    // إنشاء كائن الفاتورة
    const invoice = {
        customerId: customer.id,
        customerName: customer.name,
        printQty: printQty,
        date: date,
        notes: notes,
        status: invoiceStatus
    };

    // حفظ الفاتورة
    const result = addInvoice(invoice);

    if (result) {
        showToast('تم حفظ الفاتورة بنجاح ✅', 'success');
        
        // إعادة تعيين النموذج
        resetForm();
        
        // العودة إلى الصفحة الرئيسية بعد ثانية
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
    }
}

// إعادة تعيين النموذج
function resetForm() {
    document.getElementById('customer-select').value = '';
    document.getElementById('print-qty').value = '1';
    document.getElementById('invoice-notes').value = '';
    document.getElementById('invoice-status').value = '';
    
    invoiceStatus = '';
    
    // إعادة تعيين أزرار الحالة
    const paidBtn = document.getElementById('status-paid');
    const unpaidBtn = document.getElementById('status-unpaid');
    
    if (paidBtn) {
        paidBtn.classList.remove('status-btn-active', 'bg-green-600', 'text-white');
        paidBtn.classList.add('bg-green-100', 'dark:bg-green-900/50', 'text-green-700', 'dark:text-green-300');
    }
    
    if (unpaidBtn) {
        unpaidBtn.classList.remove('status-btn-active', 'bg-red-600', 'text-white');
        unpaidBtn.classList.add('bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-300');
    }

    // إعادة تعيين التاريخ
    if (dateMode === 'manual') {
        dateMode = 'auto';
        const toggleBtn = document.getElementById('toggle-date-mode');
        if (toggleBtn) toggleBtn.textContent = '🔄 يدوي';
    }
    setTodayDate();

    updateTotalDisplay();
}