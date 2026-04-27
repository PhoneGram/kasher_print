// ==================== الكاشير - المكونات المشتركة (هيدر وفوتر) ====================

// ==================== تحميل الهيدر ====================
function loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    const currentPage = window.location.pathname.split('/').pop();
    const isSettingsPage = currentPage === 'settings.html';

    const headerHTML = `
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="flex items-center justify-between h-full px-4">
                <!-- الشعار واسم الموقع -->
                <a href="index.html" class="flex items-center gap-2 no-underline">
                    <img src="logo.png" alt="الكاشير" class="w-10 h-10 object-contain" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%233b82f6%22 width=%2240%22 height=%2240%22 rx=%228%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22 font-weight=%22bold%22>ك</text></svg>'; this.onerror=null;">
                    <h1 class="text-lg font-bold text-gray-900 dark:text-white">الكاشير</h1>
                </a>

                <!-- الأزرار -->
                <div class="flex items-center gap-2">
                    <!-- زر تبديل الوضع الداكن -->
                    <button id="dark-mode-toggle" class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xl" title="تبديل الوضع">
                        <span id="dark-mode-icon">🌙</span>
                    </button>

                    <!-- زر الإعدادات / الشاشة الرئيسية -->
                    <a id="settings-btn" href="${isSettingsPage ? 'index.html' : 'settings.html'}" class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xl" title="${isSettingsPage ? 'الشاشة الرئيسية' : 'الإعدادات'}">
                        <span>${isSettingsPage ? '🏠' : '⚙️'}</span>
                    </a>
                </div>
            </div>
        </header>
    `;

    headerContainer.innerHTML = headerHTML;

    // إضافة حدث تبديل الوضع الداكن
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const isDark = toggleDarkMode();
            updateDarkModeIcon(isDark);
        });
    }

    // تحديث أيقونة الوضع الداكن
    const settings = getSettings();
    updateDarkModeIcon(settings.darkMode || false);
}

// تحديث أيقونة الوضع الداكن
function updateDarkModeIcon(isDark) {
    const icon = document.getElementById('dark-mode-icon');
    if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
    }
}

// ==================== تحميل الفوتر ====================
function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    const inventory = getInventory();
    const availablePapers = inventory.availablePapers || 0;
    
    let warningHTML = '';
    
    if (availablePapers >= 1 && availablePapers <= 7) {
        warningHTML = `
            <div class="fixed bottom-[68px] left-0 right-0 z-30 bg-red-500 text-white text-center py-2 px-4 text-sm font-bold shadow-lg">
                ⚠️ تنبيه: وصل المخزون إلى ${availablePapers} أوراق فقط
            </div>
        `;
    } else if (availablePapers === 0) {
        warningHTML = `
            <div class="fixed bottom-[68px] left-0 right-0 z-30 bg-red-600 text-white text-center py-2 px-4 text-sm font-bold shadow-lg">
                🚨 تحذير: المخزون فارغ تماماً!
            </div>
        `;
    }

    // إزالة شريط التحذير القديم إذا وجد
    const oldWarning = document.getElementById('inventory-warning');
    if (oldWarning) {
        oldWarning.remove();
    }

    // إضافة شريط التحذير خارج الفوتر (في body مباشرة)
    if (warningHTML) {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'inventory-warning';
        warningDiv.innerHTML = warningHTML;
        document.body.appendChild(warningDiv);
    }

    // الفوتر الطبيعي يبقى كما هو
    const footerHTML = `
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">برمجة وتصميم : رضا محمد</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">جميع الحقوق محفوظة © 2026</p>
        </footer>
    `;

    footerContainer.innerHTML = footerHTML;
}

// ==================== تهيئة الصفحة ====================
function initPage() {
    // تطبيق الوضع الداكن
    initDarkMode();

    // تحميل الهيدر
    loadHeader();

    // تحميل الفوتر
    loadFooter();

    // تسجيل Service Worker
    registerServiceWorker();

    // تحديث عرض العملة
    updateCurrencyDisplay();
}

// ==================== تنفيذ عند تحميل الصفحة ====================
document.addEventListener('DOMContentLoaded', function() {
    initPage();
});