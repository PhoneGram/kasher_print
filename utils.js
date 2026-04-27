// ==================== الكاشير - دوال مساعدة ====================

// ==================== تنسيق التاريخ والوقت ====================

// الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// الحصول على الوقت الحالي بصيغة HH:MM
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return hours + ':' + minutes;
}

// الحصول على التاريخ والوقت الحاليين
function getCurrentDateTime() {
    return getTodayDate() + ' ' + getCurrentTime();
}

// تنسيق التاريخ للعرض (YYYY-MM-DD -> DD/MM/YYYY)
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
}

// تنسيق التاريخ والوقت للعرض
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const parts = dateTimeStr.split(' ');
    const date = formatDate(parts[0]);
    const time = parts[1] || '';
    return date + ' ' + time;
}

// الحصول على اسم الشهر بالعربية
function getArabicMonth(monthNumber) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthNumber - 1] || monthNumber;
}

// الحصول على عدد أيام الشهر
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// ==================== تنسيق الأرقام والمبالغ ====================

// تنسيق المبلغ مع العملة
function formatCurrency(amount, currencySymbol) {
    if (!currencySymbol) currencySymbol = 'د.ع';
    const formattedAmount = Number(amount).toLocaleString('en-US');
    return formattedAmount + ' ' + currencySymbol;
}

// تنسيق المبلغ فقط بدون عملة
function formatNumber(number) {
    return Number(number).toLocaleString('en-US');
}

// ==================== حساب المبالغ ====================

// حساب إجمالي الفاتورة
function calculateInvoiceTotal(printQty, printPrice) {
    return (parseInt(printQty) || 0) * (parseInt(printPrice) || 1000);
}

// حساب حصة الحساب الرئيسي
function calculateMainShare(totalAmount, mainPercentage) {
    return Math.floor(totalAmount * (mainPercentage || 75) / 100);
}

// حساب حصة العامل
function calculateWorkerShare(totalAmount, mainPercentage) {
    const mainShare = calculateMainShare(totalAmount, mainPercentage);
    return totalAmount - mainShare;
}

// ==================== التحقق من صحة البيانات ====================

// التحقق من أن القيمة رقم صحيح
function isValidNumber(value) {
    const num = parseInt(value);
    return !isNaN(num) && num > 0;
}

// التحقق من أن التاريخ صالح
function isValidDate(dateStr) {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

// ==================== التعامل مع DOM ====================

// عرض رسالة تأكيد
function showConfirmDialog(title, message, onConfirm) {
    const result = confirm(title + '\n\n' + message);
    if (result && onConfirm) {
        onConfirm();
    }
    return result;
}

// عرض إشعار مؤقت
function showToast(message, type) {
    // إزالة أي إشعار سابق
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    
    let bgColor = 'bg-blue-500';
    let icon = 'ℹ️';
    
    if (type === 'success') {
        bgColor = 'bg-green-500';
        icon = '✅';
    } else if (type === 'error') {
        bgColor = 'bg-red-500';
        icon = '❌';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-500';
        icon = '⚠️';
    }

    toast.className = 'fixed bottom-24 left-4 right-4 z-50 ' + bgColor + ' text-white rounded-xl px-4 py-3 text-center font-bold shadow-lg transition-all duration-300';
    toast.style.maxWidth = '400px';
    toast.style.margin = '0 auto';
    toast.textContent = icon + ' ' + message;

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(function() {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 2500);
}

// ==================== التعامل مع المودالات ====================

// فتح مودال
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

// إغلاق مودال
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

// إغلاق المودال عند النقر خارج المحتوى
function setupModalOutsideClick(modalId, contentSelector) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.addEventListener('click', function(event) {
        const content = modal.querySelector(contentSelector || '.rounded-2xl');
        if (content && !content.contains(event.target)) {
            closeModal(modalId);
        }
    });
}

// ==================== التعامل مع URL Parameters ====================

// الحصول على قيمة parameter من URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ==================== تحديث واجهة المستخدم ====================

// تحديث عرض العملة في جميع العناصر
function updateCurrencyDisplay() {
    const settings = getSettings();
    const currency = settings.currency || 'د.ع';
    
    const currencyElements = document.querySelectorAll('[id*="currency"]');
    currencyElements.forEach(function(el) {
        if (el.tagName === 'INPUT') return;
        el.textContent = currency;
    });
}

// تحديث عرض الأرصدة
function updateBalancesDisplay() {
    const balances = getBalances();
    const settings = getSettings();
    const currency = settings.currency || 'د.ع';

    // تحديث عناصر العرض في الصفحة الرئيسية
    const mainBalanceEl = document.getElementById('main-balance');
    const workerBalanceEl = document.getElementById('worker-balance');
    const todayPrintsEl = document.getElementById('today-prints');
    const monthPrintsEl = document.getElementById('month-prints');
    const unpaidCountEl = document.getElementById('unpaid-count');

    if (mainBalanceEl) {
        mainBalanceEl.textContent = formatNumber(balances.main);
    }
    if (workerBalanceEl) {
        workerBalanceEl.textContent = formatNumber(balances.worker);
    }
    if (todayPrintsEl) {
        todayPrintsEl.textContent = getTodayPrints();
    }
    if (monthPrintsEl) {
        monthPrintsEl.textContent = getMonthPrints();
    }
    if (unpaidCountEl) {
        unpaidCountEl.textContent = getUnpaidCount();
    }
}

// ==================== دوال التطبيق ====================

// تطبيق الوضع الداكن
function applyDarkMode(enabled) {
    if (enabled) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// تهيئة الوضع الداكن من الإعدادات
function initDarkMode() {
    const settings = getSettings();
    applyDarkMode(settings.darkMode || false);
}

// تبديل الوضع الداكن
function toggleDarkMode() {
    const settings = getSettings();
    const newMode = !settings.darkMode;
    settings.darkMode = newMode;
    saveSettings(settings);
    applyDarkMode(newMode);
    return newMode;
}

// ==================== تسجيل Service Worker ====================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('تم تسجيل Service Worker بنجاح:', registration.scope);
            })
            .catch(function(error) {
                console.log('فشل تسجيل Service Worker:', error);
            });
    }
}

// ==================== دوال البحث والتصفية ====================

// البحث في مصفوفة حسب قيمة حقل
function searchInArray(array, field, query) {
    if (!query) return array;
    const lowerQuery = query.toLowerCase();
    return array.filter(function(item) {
        const value = item[field];
        if (!value) return false;
        return value.toString().toLowerCase().includes(lowerQuery);
    });
}

// ترتيب المصفوفة حسب التاريخ (الأحدث أولاً)
function sortByDateDesc(array, dateField) {
    return array.sort(function(a, b) {
        const dateA = new Date(a[dateField] || a.createdAt || 0);
        const dateB = new Date(b[dateField] || b.createdAt || 0);
        return dateB - dateA;
    });
}