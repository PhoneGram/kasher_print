// ==================== الكاشير - منطق صفحة الفواتير ====================

document.addEventListener('DOMContentLoaded', function() {
    initInvoicesPage();
});

// متغير لتتبع الفاتورة المحددة حالياً
let currentInvoice = null;

function initInvoicesPage() {
    // التحقق من وجود فلتر للفواتير غير المدفوعة
    const filterParam = getUrlParameter('filter');
    
    // عرض الفواتير
    displayInvoices(filterParam);

    // تفعيل زر إغلاق المودال
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            closeModal('invoice-modal');
        });
    }

    // إغلاق المودال بالنقر خارج المحتوى
    setupModalOutsideClick('invoice-modal', '.rounded-2xl');

    // تفعيل زر تحميل الفاتورة كصورة
    const downloadBtn = document.getElementById('download-invoice-image');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (currentInvoice) {
                downloadInvoiceAsImage(currentInvoice);
            }
        });
    }
}

// عرض قائمة الفواتير
function displayInvoices(filter) {
    let invoices = getInvoices();
    const noInvoicesMsg = document.getElementById('no-invoices-msg');
    const invoicesList = document.getElementById('invoices-list');

    // تطبيق الفلتر إذا وجد
    if (filter === 'unpaid') {
        invoices = invoices.filter(function(inv) {
            return inv.status === 'unpaid';
        });
    }

    // ترتيب الفواتير من الأحدث إلى الأقدم
    invoices = sortByDateDesc(invoices, 'createdAt');

    // إظهار/إخفاء رسالة عدم وجود فواتير
    if (!noInvoicesMsg || !invoicesList) return;

    if (invoices.length === 0) {
        noInvoicesMsg.classList.remove('hidden');
        invoicesList.innerHTML = '';
        return;
    }

    noInvoicesMsg.classList.add('hidden');

    // بناء قائمة الفواتير
    let html = '';
    invoices.forEach(function(invoice) {
        html += createInvoiceCard(invoice);
    });

    invoicesList.innerHTML = html;

    // إضافة أحداث النقر على الفواتير
    attachInvoiceClickEvents();
}

// إنشاء بطاقة فاتورة
function createInvoiceCard(invoice) {
    const statusClass = invoice.status === 'paid' ? 'border-green-500' : 'border-red-500';
    const statusBg = invoice.status === 'paid' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
    const statusText = invoice.status === 'paid' ? '✅ مدفوعة' : '❌ غير مدفوعة';
    const statusColor = invoice.status === 'paid' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';

    // استخدام المبلغ المخزن داخل الفاتورة
    const totalAmount = invoice.totalAmount || (parseInt(invoice.printQty) || 0) * (invoice.printPrice || 1000);
    const currency = invoice.currency || 'د.ع';

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-r-4 ${statusClass} cursor-pointer hover:shadow-xl transition-shadow invoice-card" data-invoice-id="${invoice.id}">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-lg">فاتورة رقم : ${invoice.invoiceNumber || invoice.id}</h3>
                <span class="text-sm font-bold ${statusColor}">${statusText}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span class="text-gray-500 dark:text-gray-400">الزبون:</span>
                    <span class="font-medium mr-1">${invoice.customerName || '-'}</span>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-400">العدد:</span>
                    <span class="font-medium mr-1">${invoice.printQty}</span>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-400">التاريخ:</span>
                    <span class="font-medium mr-1">${formatDate(invoice.date)}</span>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-400">المجموع:</span>
                    <span class="font-medium mr-1">${formatCurrency(totalAmount, currency)}</span>
                </div>
                ${invoice.paidAt ? `
                <div class="col-span-2">
                    <span class="text-gray-500 dark:text-gray-400">تاريخ الدفع:</span>
                    <span class="font-medium mr-1">${formatDateTime(invoice.paidAt)}</span>
                </div>` : ''}
            </div>

            ${invoice.status === 'unpaid' ? `
            <button class="pay-invoice-btn w-full mt-3 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2 font-bold transition-colors text-sm" data-invoice-id="${invoice.id}">
                💰 دفع الفاتورة
            </button>` : ''}
        </div>
    `;
}

// إضافة أحداث النقر على الفواتير
function attachInvoiceClickEvents() {
    // النقر على بطاقة الفاتورة لفتح التفاصيل
    const invoiceCards = document.querySelectorAll('.invoice-card');
    invoiceCards.forEach(function(card) {
        card.addEventListener('click', function(e) {
            // تجاهل النقر إذا كان على زر الدفع
            if (e.target.classList.contains('pay-invoice-btn')) {
                return;
            }
            
            const invoiceId = this.getAttribute('data-invoice-id');
            openInvoiceDetails(invoiceId);
        });
    });

    // أزرار الدفع
    const payButtons = document.querySelectorAll('.pay-invoice-btn');
    payButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const invoiceId = this.getAttribute('data-invoice-id');
            handlePayInvoice(invoiceId);
        });
    });
}

// فتح نافذة تفاصيل الفاتورة
function openInvoiceDetails(invoiceId) {
    const invoices = getInvoices();
    const invoice = invoices.find(function(inv) {
        return inv.id === invoiceId;
    });

    if (!invoice) return;

    currentInvoice = invoice;

    // استخدام المبالغ المخزنة داخل الفاتورة
    const totalAmount = invoice.totalAmount || (parseInt(invoice.printQty) || 0) * (invoice.printPrice || 1000);
    const currency = invoice.currency || 'د.ع';
    const libraryName = getSettings().libraryName || '';

    // تحديث اسم المكتبة في الهيدر
    const libraryNameEl = document.getElementById('modal-library-name');
    if (libraryNameEl) {
        libraryNameEl.textContent = libraryName || 'الكاشير';
    }

    // بناء تفاصيل الفاتورة
    const detailsEl = document.getElementById('modal-invoice-details');
    if (!detailsEl) return;

    const statusText = invoice.status === 'paid' ? '✅ مدفوعة' : '❌ غير مدفوعة';
    const statusColor = invoice.status === 'paid' ? 'text-green-600' : 'text-red-600';

    detailsEl.innerHTML = `
        <div class="text-center mb-4">
            <h4 class="font-bold text-lg">فاتورة رقم : ${invoice.invoiceNumber || invoice.id}</h4>
        </div>
        
        <div class="space-y-2">
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">الزبون:</span>
                <span class="font-medium">${invoice.customerName || '-'}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">عدد المطبوعات:</span>
                <span class="font-medium">${invoice.printQty}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">سعر المطبوعة:</span>
                <span class="font-medium">${formatCurrency(invoice.printPrice || 1000, currency)}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">التاريخ:</span>
                <span class="font-medium">${formatDate(invoice.date)}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">وقت الإنشاء:</span>
                <span class="font-medium">${formatDateTime(invoice.createdAt)}</span>
            </div>
            ${invoice.paidAt ? `
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">تاريخ الدفع:</span>
                <span class="font-medium">${formatDateTime(invoice.paidAt)}</span>
            </div>` : ''}
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">الحالة:</span>
                <span class="font-bold ${statusColor}">${statusText}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">المجموع:</span>
                <span class="font-bold">${formatCurrency(totalAmount, currency)}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">حصة الحساب الرئيسي:</span>
                <span class="font-medium">${formatCurrency(invoice.mainShare || 0, currency)}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span class="text-gray-500 dark:text-gray-400">حصة العامل:</span>
                <span class="font-medium">${formatCurrency(invoice.workerShare || 0, currency)}</span>
            </div>
            <div class="flex justify-between pb-2">
                <span class="text-gray-500 dark:text-gray-400">الملاحظات:</span>
                <span class="font-medium text-right max-w-xs">${invoice.notes || 'لا يوجد'}</span>
            </div>
        </div>
    `;

    // فتح المودال
    openModal('invoice-modal');
}

// معالجة دفع فاتورة
function handlePayInvoice(invoiceId) {
    const confirmed = confirm('هل أنت متأكد من تحويل هذه الفاتورة إلى مدفوعة؟\n\nسيتم تحديث الأرصدة تلقائياً.');
    
    if (!confirmed) return;

    const result = payInvoice(invoiceId);

    if (result) {
        showToast('تم دفع الفاتورة بنجاح ✅', 'success');
        
        // إعادة تحميل عرض الفواتير
        const filterParam = getUrlParameter('filter');
        displayInvoices(filterParam);
        
        // إغلاق المودال إذا كان مفتوحاً
        closeModal('invoice-modal');
    } else {
        showToast('حدث خطأ أثناء دفع الفاتورة', 'error');
    }
}