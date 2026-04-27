// ==================== الكاشير - منطق الصفحة الرئيسية ====================

document.addEventListener('DOMContentLoaded', function() {
    initMainPage();
});

function initMainPage() {
    updateMainPageDisplay();
}

// تحديث عرض الصفحة الرئيسية
function updateMainPageDisplay() {
    const balances = getBalances();
    const settings = getSettings();
    const currency = settings.currency || 'د.ع';

    // تحديث رصيد الحساب الرئيسي
    const mainBalanceEl = document.getElementById('main-balance');
    if (mainBalanceEl) {
        mainBalanceEl.textContent = formatNumber(balances.main);
    }

    // تحديث رصيد حساب العامل
    const workerBalanceEl = document.getElementById('worker-balance');
    if (workerBalanceEl) {
        workerBalanceEl.textContent = formatNumber(balances.worker);
    }

    // تحديث العملة المعروضة
    const currencyMain = document.getElementById('currency-display-main');
    if (currencyMain) {
        currencyMain.textContent = currency;
    }

    const currencyWorker = document.getElementById('currency-display-worker');
    if (currencyWorker) {
        currencyWorker.textContent = currency;
    }

    // تحديث عدد مطبوعات اليوم
    const todayPrintsEl = document.getElementById('today-prints');
    if (todayPrintsEl) {
        todayPrintsEl.textContent = getTodayPrints();
    }

    // تحديث عدد مطبوعات الشهر
    const monthPrintsEl = document.getElementById('month-prints');
    if (monthPrintsEl) {
        monthPrintsEl.textContent = getMonthPrints();
    }

    // تحديث عدد غير المدفوعات
    const unpaidCountEl = document.getElementById('unpaid-count');
    if (unpaidCountEl) {
        unpaidCountEl.textContent = getUnpaidCount();
    }
}

// تحديث العرض عند العودة للصفحة الرئيسية
window.addEventListener('pageshow', function(event) {
    if (event.persisted || document.visibilityState === 'visible') {
        updateMainPageDisplay();
    }
});

// تحديث العرض عند التركيز على الصفحة
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        updateMainPageDisplay();
    }
});