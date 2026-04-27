// ==================== الكاشير - إدارة التخزين localStorage ====================

const STORAGE_KEY = 'al-kasher-data';

// ==================== البيانات الافتراضية ====================
const DEFAULT_DATA = {
    settings: {
        libraryName: '',
        printPrice: 1000,
        currency: 'د.ع',
        mainPercentage: 75,
        darkMode: false
    },
    balances: {
        main: 0,
        worker: 0
    },
    customers: [],
    invoices: [],
    inventory: {
        availablePapers: 0,
        movements: []
    },
    walletTransactions: []
};

// ==================== دوال القراءة والكتابة ====================

// تحميل جميع البيانات
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('خطأ في قراءة البيانات:', e);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// حفظ جميع البيانات
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        return false;
    }
}

// تحديث جزئي للبيانات
function updateData(key, value) {
    const data = loadData();
    data[key] = value;
    return saveData(data);
}

// ==================== دوال مساعدة ====================

// الحصول على الإعدادات
function getSettings() {
    return loadData().settings;
}

// حفظ الإعدادات
function saveSettings(settings) {
    const data = loadData();
    data.settings = { ...data.settings, ...settings };
    return saveData(data);
}

// الحصول على الأرصدة
function getBalances() {
    return loadData().balances;
}

// حفظ الأرصدة
function saveBalances(balances) {
    const data = loadData();
    data.balances = balances;
    return saveData(data);
}

// الحصول على الزبائن
function getCustomers() {
    return loadData().customers;
}

// حفظ الزبائن
function saveCustomers(customers) {
    return updateData('customers', customers);
}

// إضافة زبون جديد
function addCustomer(customer) {
    const customers = getCustomers();
    customer.id = Date.now().toString();
    customer.createdAt = new Date().toISOString();
    customers.push(customer);
    return saveCustomers(customers);
}

// حذف زبون
function deleteCustomer(id) {
    const customers = getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    return saveCustomers(filtered);
}

// الحصول على الفواتير
function getInvoices() {
    return loadData().invoices;
}

// حفظ الفواتير
function saveInvoices(invoices) {
    return updateData('invoices', invoices);
}

// إضافة فاتورة جديدة
function addInvoice(invoice) {
    const invoices = getInvoices();
    invoice.id = Date.now().toString();
    invoice.invoiceNumber = generateInvoiceNumber();
    invoice.createdAt = new Date().toISOString();
    
    // حفظ السعر والتقسيم داخل الفاتورة (حتى لا تتأثر بتغيير الإعدادات لاحقاً)
    const settings = getSettings();
    invoice.printPrice = settings.printPrice || 1000;
    invoice.currency = settings.currency || 'د.ع';
    invoice.mainPercentage = settings.mainPercentage || 75;
    
    // حساب المبالغ وتخزينها داخل الفاتورة
    const qty = parseInt(invoice.printQty) || 0;
    const total = invoice.printPrice * qty;
    invoice.totalAmount = total;
    invoice.mainShare = Math.floor(total * invoice.mainPercentage / 100);
    invoice.workerShare = total - invoice.mainShare;
    
    // إذا كانت مدفوعة، أضف تاريخ الدفع
    if (invoice.status === 'paid') {
        invoice.paidAt = new Date().toISOString();
    } else {
        invoice.paidAt = null;
    }
    
    invoices.unshift(invoice);
    
    // تحديث المخزون تلقائياً (خصم المطبوعات)
    if (invoice.printQty && parseInt(invoice.printQty) > 0) {
        const data = loadData();
        data.inventory.availablePapers = Math.max(0, (data.inventory.availablePapers || 0) - parseInt(invoice.printQty));
        
        // إضافة حركة مخزون تلقائية
        const movement = {
            id: Date.now().toString() + '_print',
            quantity: parseInt(invoice.printQty),
            status: 'printed',
            date: invoice.date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            invoiceId: invoice.id
        };
        data.inventory.movements.unshift(movement);
        
        // إذا كانت الفاتورة مدفوعة، حدّث الأرصدة
        if (invoice.status === 'paid') {
            updateBalancesFromInvoice(invoice, data);
        }
        
        saveData(data);
    }
    
    return saveInvoices(invoices);
}

// تحديث حالة فاتورة إلى مدفوعة
function payInvoice(invoiceId) {
    const data = loadData();
    const invoice = data.invoices.find(inv => inv.id === invoiceId);
    
    if (invoice && invoice.status === 'unpaid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        
        // تحديث الأرصدة باستخدام المبالغ المخزنة داخل الفاتورة
        updateBalancesFromInvoice(invoice, data);
        
        saveData(data);
        return true;
    }
    return false;
}

// تحديث الأرصدة من فاتورة مدفوعة (تستخدم المبالغ المخزنة داخل الفاتورة)
function updateBalancesFromInvoice(invoice, data) {
    if (!data) data = loadData();
    
    // استخدام المبالغ المخزنة داخل الفاتورة نفسها
    const mainShare = invoice.mainShare || 0;
    const workerShare = invoice.workerShare || 0;
    
    data.balances.main = (data.balances.main || 0) + mainShare;
    data.balances.worker = (data.balances.worker || 0) + workerShare;
}

// توليد رقم فاتورة تسلسلي
function generateInvoiceNumber() {
    const invoices = getInvoices();
    if (invoices.length === 0) return '1';
    const maxNum = Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber) || 0));
    return (maxNum + 1).toString();
}

// الحصول على المخزون
function getInventory() {
    return loadData().inventory;
}

// حفظ المخزون
function saveInventory(inventory) {
    return updateData('inventory', inventory);
}

// إضافة حركة مخزون
function addInventoryMovement(movement) {
    const data = loadData();
    movement.id = Date.now().toString();
    movement.createdAt = new Date().toISOString();
    
    const qty = parseInt(movement.quantity);
    
    if (movement.status === 'purchase') {
        data.inventory.availablePapers = (data.inventory.availablePapers || 0) + qty;
    } else if (movement.status === 'damage') {
        data.inventory.availablePapers = Math.max(0, (data.inventory.availablePapers || 0) - qty);
    }
    
    data.inventory.movements.unshift(movement);
    return saveData(data);
}

// الحصول على حركات المحفظة
function getWalletTransactions() {
    return loadData().walletTransactions;
}

// إضافة حركة محفظة (إيداع أو سحب)
function addWalletTransaction(transaction) {
    const data = loadData();
    transaction.id = Date.now().toString();
    transaction.createdAt = new Date().toISOString();
    
    const amount = parseInt(transaction.amount);
    
    if (transaction.type === 'deposit') {
        if (transaction.account === 'main') {
            data.balances.main = (data.balances.main || 0) + amount;
        } else {
            data.balances.worker = (data.balances.worker || 0) + amount;
        }
    } else if (transaction.type === 'withdraw') {
        if (transaction.account === 'main') {
            if ((data.balances.main || 0) >= amount) {
                data.balances.main = (data.balances.main || 0) - amount;
            } else {
                return false; // رصيد غير كافٍ
            }
        } else {
            if ((data.balances.worker || 0) >= amount) {
                data.balances.worker = (data.balances.worker || 0) - amount;
            } else {
                return false; // رصيد غير كافٍ
            }
        }
    }
    
    data.walletTransactions.unshift(transaction);
    return saveData(data);
}

// تصدير البيانات كـ JSON
function exportData() {
    const data = loadData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'الكاشير-بيانات-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// استيراد البيانات من ملف JSON
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // التحقق من صحة بنية البيانات
        if (!data.settings || !data.balances || !data.invoices || !data.customers || !data.inventory || !data.walletTransactions) {
            throw new Error('بنية البيانات غير صالحة');
        }
        
        return saveData(data);
    } catch (e) {
        console.error('خطأ في استيراد البيانات:', e);
        return false;
    }
}

// إعادة تعيين جميع البيانات
function resetAllData() {
    return saveData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
}

// ==================== دوال الاحصائيات ====================

// الحصول على عدد مطبوعات اليوم
function getTodayPrints() {
    const invoices = getInvoices();
    const today = new Date().toISOString().split('T')[0];
    return invoices
        .filter(inv => inv.date === today)
        .reduce((sum, inv) => sum + (parseInt(inv.printQty) || 0), 0);
}

// الحصول على عدد مطبوعات الشهر
function getMonthPrints() {
    const invoices = getInvoices();
    const now = new Date();
    const yearMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    return invoices
        .filter(inv => inv.date && inv.date.startsWith(yearMonth))
        .reduce((sum, inv) => sum + (parseInt(inv.printQty) || 0), 0);
}

// الحصول على عدد الفواتير غير المدفوعة
function getUnpaidCount() {
    const invoices = getInvoices();
    return invoices.filter(inv => inv.status === 'unpaid').length;
}

// الحصول على فواتير غير مدفوعة
function getUnpaidInvoices() {
    const invoices = getInvoices();
    return invoices.filter(inv => inv.status === 'unpaid');
}

// الحصول على إحصائيات ليوم محدد
function getDayStatistics(date) {
    const invoices = getInvoices();
    const settings = getSettings();
    
    const dayInvoices = invoices.filter(inv => inv.date === date && inv.status === 'paid');
    
    let totalPrints = 0;
    let totalIncome = 0;
    let totalWorkerFees = 0;
    
    const invoiceDetails = dayInvoices.map((inv, index) => {
        const qty = parseInt(inv.printQty) || 0;
        // استخدام المبالغ المخزنة داخل الفاتورة
        const amount = inv.totalAmount || (qty * (inv.printPrice || settings.printPrice || 1000));
        const workerFee = inv.workerShare || Math.floor(amount * (100 - (inv.mainPercentage || settings.mainPercentage || 75)) / 100);
        
        totalPrints += qty;
        totalIncome += amount;
        totalWorkerFees += workerFee;
        
        return {
            sequence: index + 1,
            customerName: inv.customerName || '-',
            printQty: qty,
            income: amount,
            workerFee: workerFee,
            invoiceId: inv.id
        };
    });
    
    return {
        details: invoiceDetails,
        totals: {
            prints: totalPrints,
            income: totalIncome,
            workerFees: totalWorkerFees
        }
    };
}

// الحصول على إحصائيات لشهر محدد
function getMonthStatistics(yearMonth) {
    const invoices = getInvoices();
    const settings = getSettings();
    
    const monthInvoices = invoices.filter(inv => inv.date && inv.date.startsWith(yearMonth) && inv.status === 'paid');
    
    // تجميع حسب الأيام
    const daysMap = {};
    monthInvoices.forEach(inv => {
        const day = inv.date.split('-')[2];
        if (!daysMap[day]) {
            daysMap[day] = { prints: 0, income: 0, workerFees: 0 };
        }
        const qty = parseInt(inv.printQty) || 0;
        const amount = inv.totalAmount || (qty * (inv.printPrice || settings.printPrice || 1000));
        const workerFee = inv.workerShare || Math.floor(amount * (100 - (inv.mainPercentage || settings.mainPercentage || 75)) / 100);
        
        daysMap[day].prints += qty;
        daysMap[day].income += amount;
        daysMap[day].workerFees += workerFee;
    });
    
    const [year, month] = yearMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    const dayDetails = [];
    let totalPrints = 0;
    let totalIncome = 0;
    let totalWorkerFees = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dayKey = String(d).padStart(2, '0');
        const data = daysMap[dayKey] || { prints: 0, income: 0, workerFees: 0 };
        
        dayDetails.push({
            sequence: d,
            printQty: data.prints,
            income: data.income,
            workerFee: data.workerFees
        });
        
        totalPrints += data.prints;
        totalIncome += data.income;
        totalWorkerFees += data.workerFees;
    }
    
    return {
        details: dayDetails,
        totals: {
            prints: totalPrints,
            income: totalIncome,
            workerFees: totalWorkerFees
        }
    };
}

// الحصول على إحصائيات لسنة محددة
function getYearStatistics(year) {
    const invoices = getInvoices();
    const settings = getSettings();
    
    const yearInvoices = invoices.filter(inv => inv.date && inv.date.startsWith(year) && inv.status === 'paid');
    
    // تجميع حسب الأشهر
    const monthsMap = {};
    yearInvoices.forEach(inv => {
        const month = inv.date.substring(5, 7);
        if (!monthsMap[month]) {
            monthsMap[month] = { prints: 0, income: 0, workerFees: 0 };
        }
        const qty = parseInt(inv.printQty) || 0;
        const amount = inv.totalAmount || (qty * (inv.printPrice || settings.printPrice || 1000));
        const workerFee = inv.workerShare || Math.floor(amount * (100 - (inv.mainPercentage || settings.mainPercentage || 75)) / 100);
        
        monthsMap[month].prints += qty;
        monthsMap[month].income += amount;
        monthsMap[month].workerFees += workerFee;
    });
    
    const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const monthDetails = [];
    let totalPrints = 0;
    let totalIncome = 0;
    let totalWorkerFees = 0;
    
    for (let m = 1; m <= 12; m++) {
        const monthKey = String(m).padStart(2, '0');
        const data = monthsMap[monthKey] || { prints: 0, income: 0, workerFees: 0 };
        
        monthDetails.push({
            sequence: m,
            monthName: arabicMonths[m - 1],
            printQty: data.prints,
            income: data.income,
            workerFee: data.workerFees
        });
        
        totalPrints += data.prints;
        totalIncome += data.income;
        totalWorkerFees += data.workerFees;
    }
    
    return {
        details: monthDetails,
        totals: {
            prints: totalPrints,
            income: totalIncome,
            workerFees: totalWorkerFees
        }
    };
}