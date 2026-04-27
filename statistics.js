// ==================== الكاشير - منطق صفحة الاحصائيات ====================

document.addEventListener('DOMContentLoaded', function() {
    initStatisticsPage();
});

// متغيرات الصفحة
let currentStatsMode = 'day'; // day, month, year
let currentStatsData = null;
let currentDateValue = '';

function initStatisticsPage() {
    // تعيين الوضع الافتراضي (يوم)
    setStatsMode('day');

    // أزرار اختيار نوع الاحصائية
    document.getElementById('stats-day-btn').addEventListener('click', function() {
        setStatsMode('day');
    });

    document.getElementById('stats-month-btn').addEventListener('click', function() {
        setStatsMode('month');
    });

    document.getElementById('stats-year-btn').addEventListener('click', function() {
        setStatsMode('year');
    });

    // زر تحميل الصورة
    document.getElementById('download-stats-image').addEventListener('click', function() {
        if (currentStatsData) {
            downloadStatisticsAsImage(currentStatsData, currentStatsMode, currentDateValue);
        }
    });
}

// تعيين وضع الاحصائية
function setStatsMode(mode) {
    currentStatsMode = mode;
    
    // تحديث أزرار الوضع
    document.getElementById('stats-day-btn').classList.toggle('stats-mode-active', mode === 'day');
    document.getElementById('stats-month-btn').classList.toggle('stats-mode-active', mode === 'month');
    document.getElementById('stats-year-btn').classList.toggle('stats-mode-active', mode === 'year');

    // تحديث الأزرار غير النشطة
    if (mode !== 'day') {
        document.getElementById('stats-day-btn').classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    } else {
        document.getElementById('stats-day-btn').classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }

    if (mode !== 'month') {
        document.getElementById('stats-month-btn').classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    } else {
        document.getElementById('stats-month-btn').classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }

    if (mode !== 'year') {
        document.getElementById('stats-year-btn').classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    } else {
        document.getElementById('stats-year-btn').classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }

    // تحديث حقل اختيار التاريخ
    updateDateSelector();

    // تحديث الجدول
    updateStatisticsTable();
}

// تحديث حقل اختيار التاريخ
function updateDateSelector() {
    const container = document.getElementById('date-selector-container');
    if (!container) return;

    const today = getTodayDate();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    let html = '';

    if (currentStatsMode === 'day') {
        html = `
            <div>
                <label class="block text-sm font-medium mb-2">اختر اليوم</label>
                <input type="date" id="stats-date-input" value="${today}" max="${today}" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        `;
    } else if (currentStatsMode === 'month') {
        const yearMonth = currentYear + '-' + currentMonth;
        html = `
            <div>
                <label class="block text-sm font-medium mb-2">اختر الشهر</label>
                <input type="month" id="stats-month-input" value="${yearMonth}" max="${yearMonth}" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        `;
    } else if (currentStatsMode === 'year') {
        html = `
            <div>
                <label class="block text-sm font-medium mb-2">اختر السنة</label>
                <input type="number" id="stats-year-input" value="${currentYear}" min="2000" max="${currentYear}" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        `;
    }

    container.innerHTML = html;

    // إضافة حدث تغيير التاريخ
    setTimeout(function() {
        if (currentStatsMode === 'day') {
            const dateInput = document.getElementById('stats-date-input');
            if (dateInput) {
                dateInput.addEventListener('change', updateStatisticsTable);
            }
        } else if (currentStatsMode === 'month') {
            const monthInput = document.getElementById('stats-month-input');
            if (monthInput) {
                monthInput.addEventListener('change', updateStatisticsTable);
            }
        } else if (currentStatsMode === 'year') {
            const yearInput = document.getElementById('stats-year-input');
            if (yearInput) {
                yearInput.addEventListener('change', updateStatisticsTable);
            }
        }
    }, 100);
}

// تحديث جدول الاحصائيات
function updateStatisticsTable() {
    let dateValue = '';
    let statsData = null;

    if (currentStatsMode === 'day') {
        const dateInput = document.getElementById('stats-date-input');
        dateValue = dateInput ? dateInput.value : getTodayDate();
        
        if (!dateValue) return;
        
        statsData = getDayStatistics(dateValue);
    } else if (currentStatsMode === 'month') {
        const monthInput = document.getElementById('stats-month-input');
        dateValue = monthInput ? monthInput.value : '';
        
        if (!dateValue) return;
        
        statsData = getMonthStatistics(dateValue);
    } else if (currentStatsMode === 'year') {
        const yearInput = document.getElementById('stats-year-input');
        dateValue = yearInput ? yearInput.value : '';
        
        if (!dateValue) return;
        
        statsData = getYearStatistics(dateValue);
    }

    currentStatsData = statsData;
    currentDateValue = dateValue;

    // عرض الجدول
    renderStatisticsTable(statsData);

    // تفعيل/تعطيل زر التحميل
    const downloadBtn = document.getElementById('download-stats-image');
    if (downloadBtn) {
        if (statsData && statsData.details && statsData.details.length > 0) {
            downloadBtn.disabled = false;
        } else {
            downloadBtn.disabled = true;
        }
    }
}

// عرض جدول الاحصائيات
function renderStatisticsTable(statsData) {
    const noStatsMsg = document.getElementById('no-stats-msg');
    const tableContainer = document.getElementById('stats-table-container');
    const tableHead = document.getElementById('stats-table-head');
    const tableBody = document.getElementById('stats-table-body');
    const totalRow = document.getElementById('stats-total-row');

    if (!noStatsMsg || !tableContainer || !tableHead || !tableBody || !totalRow) return;

    // التحقق من وجود بيانات
    if (!statsData || !statsData.details || statsData.details.length === 0) {
        noStatsMsg.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        return;
    }

    noStatsMsg.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    const settings = getSettings();
    const currency = settings.currency || 'د.ع';

    // بناء رأس الجدول
    let headHTML = '<tr>';
    
    if (currentStatsMode === 'day') {
        headHTML += '<th>تسلسل</th>';
        headHTML += '<th>الزبون</th>';
        headHTML += '<th>عدد المطبوعات</th>';
        headHTML += '<th>الوارد</th>';
        headHTML += '<th>أجور العامل</th>';
    } else if (currentStatsMode === 'month') {
        headHTML += '<th>اليوم</th>';
        headHTML += '<th>عدد المطبوعات</th>';
        headHTML += '<th>الوارد</th>';
        headHTML += '<th>أجور العامل</th>';
    } else if (currentStatsMode === 'year') {
        headHTML += '<th>الشهر</th>';
        headHTML += '<th>عدد المطبوعات</th>';
        headHTML += '<th>الوارد</th>';
        headHTML += '<th>أجور العامل</th>';
    }

    headHTML += '</tr>';
    tableHead.innerHTML = headHTML;

    // بناء صفوف الجدول
    let bodyHTML = '';

    statsData.details.forEach(function(row) {
        bodyHTML += '<tr>';
        
        if (currentStatsMode === 'day') {
            bodyHTML += '<td>' + row.sequence + '</td>';
            bodyHTML += '<td>' + (row.customerName || '-') + '</td>';
            bodyHTML += '<td>' + row.printQty + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.income, currency) + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.workerFee, currency) + '</td>';
        } else if (currentStatsMode === 'month') {
            bodyHTML += '<td>' + row.sequence + '</td>';
            bodyHTML += '<td>' + row.printQty + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.income, currency) + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.workerFee, currency) + '</td>';
        } else if (currentStatsMode === 'year') {
            bodyHTML += '<td>' + row.monthName + '</td>';
            bodyHTML += '<td>' + row.printQty + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.income, currency) + '</td>';
            bodyHTML += '<td>' + formatCurrency(row.workerFee, currency) + '</td>';
        }

        bodyHTML += '</tr>';
    });

    tableBody.innerHTML = bodyHTML;

    // بناء صف المجموع
    let totalHTML = '<div class="text-center font-bold">';
    totalHTML += '📊 المجموع الكلي | ';
    totalHTML += 'عدد المطبوعات: ' + statsData.totals.prints + ' | ';
    totalHTML += 'الوارد: ' + formatCurrency(statsData.totals.income, currency) + ' | ';
    totalHTML += 'أجور العامل: ' + formatCurrency(statsData.totals.workerFees, currency);
    totalHTML += '</div>';

    totalRow.innerHTML = totalHTML;
}