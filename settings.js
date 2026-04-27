// ==================== الكاشير - منطق صفحة الإعدادات ====================

document.addEventListener('DOMContentLoaded', function() {
    initSettingsPage();
});

function initSettingsPage() {
    // تحميل الإعدادات الحالية
    loadSettings();

    // تفعيل شريط النسبة المئوية
    setupPercentageSlider();

    // تفعيل حفظ الإعدادات
    const form = document.getElementById('settings-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSaveSettings();
        });
    }

    // تفعيل زر تحميل البيانات
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportData();
            showToast('تم تحميل البيانات بنجاح ✅', 'success');
        });
    }

    // تفعيل زر استرداد البيانات
    const importBtn = document.getElementById('import-data-btn');
    const fileInput = document.getElementById('import-file-input');
    
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            handleImportData(e);
        });
    }

    // تفعيل زر إعادة التعيين
    const resetBtn = document.getElementById('reset-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            openModal('reset-confirm-modal');
        });
    }

    // أزرار نافذة تأكيد إعادة التعيين
    const cancelResetBtn = document.getElementById('cancel-reset');
    const confirmResetBtn = document.getElementById('confirm-reset');

    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', function() {
            closeModal('reset-confirm-modal');
        });
    }

    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', function() {
            handleResetData();
        });
    }

    // إغلاق المودال بالنقر خارج المحتوى
    setupModalOutsideClick('reset-confirm-modal', '.rounded-2xl');
}

// تحميل الإعدادات في النموذج
function loadSettings() {
    const settings = getSettings();

    const libraryNameInput = document.getElementById('library-name');
    const printPriceInput = document.getElementById('print-price');
    const currencyInput = document.getElementById('currency-symbol');
    const mainPercentageInput = document.getElementById('main-percentage');
    const mainPercentageDisplay = document.getElementById('main-percentage-display');
    const workerPercentageDisplay = document.getElementById('worker-percentage-display');

    if (libraryNameInput) libraryNameInput.value = settings.libraryName || '';
    if (printPriceInput) printPriceInput.value = settings.printPrice || 1000;
    if (currencyInput) currencyInput.value = settings.currency || 'د.ع';
    
    const mainPercentage = settings.mainPercentage || 75;
    if (mainPercentageInput) mainPercentageInput.value = mainPercentage;
    if (mainPercentageDisplay) mainPercentageDisplay.textContent = mainPercentage;
    if (workerPercentageDisplay) workerPercentageDisplay.textContent = 100 - mainPercentage;
}

// تفعيل شريط النسبة المئوية
function setupPercentageSlider() {
    const slider = document.getElementById('main-percentage');
    const mainDisplay = document.getElementById('main-percentage-display');
    const workerDisplay = document.getElementById('worker-percentage-display');

    if (!slider || !mainDisplay || !workerDisplay) return;

    slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        mainDisplay.textContent = value;
        workerDisplay.textContent = 100 - value;
    });
}

// حفظ الإعدادات
function handleSaveSettings() {
    const libraryNameInput = document.getElementById('library-name');
    const printPriceInput = document.getElementById('print-price');
    const currencyInput = document.getElementById('currency-symbol');
    const mainPercentageInput = document.getElementById('main-percentage');

    const libraryName = libraryNameInput ? libraryNameInput.value.trim() : '';
    const printPrice = printPriceInput ? parseInt(printPriceInput.value) : 1000;
    const currency = currencyInput ? currencyInput.value.trim() : 'د.ع';
    const mainPercentage = mainPercentageInput ? parseInt(mainPercentageInput.value) : 75;

    // التحقق من صحة البيانات
    if (!printPrice || printPrice <= 0) {
        showToast('يرجى إدخال سعر مطبوعة صحيح', 'error');
        return;
    }

    if (!currency) {
        showToast('يرجى إدخال العملة', 'error');
        return;
    }

    if (mainPercentage < 0 || mainPercentage > 100) {
        showToast('يرجى إدخال نسبة صحيحة بين 0 و 100', 'error');
        return;
    }

    // حفظ الإعدادات
    const settings = {
        libraryName: libraryName,
        printPrice: printPrice,
        currency: currency,
        mainPercentage: mainPercentage
    };

    const result = saveSettings(settings);

    if (result) {
        showToast('تم حفظ الإعدادات بنجاح ✅', 'success');
        
        // تحديث عرض العملة في الصفحة
        updateCurrencyDisplay();
        
        // العودة للصفحة الرئيسية بعد ثانية
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
}

// استيراد البيانات من ملف JSON
function handleImportData(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    const confirmed = confirm('سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟');
    
    if (!confirmed) {
        // إعادة تعيين input file
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const jsonStr = e.target.result;
            const result = importData(jsonStr);

            if (result) {
                showToast('تم استرداد البيانات بنجاح ✅', 'success');
                
                // إعادة تحميل الإعدادات
                loadSettings();
                
                // تحديث الصفحة بعد فترة
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showToast('الملف غير صالح أو تالف', 'error');
            }
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            showToast('حدث خطأ أثناء استيراد البيانات', 'error');
        }
    };

    reader.onerror = function() {
        showToast('حدث خطأ أثناء قراءة الملف', 'error');
    };

    reader.readAsText(file);
}

// إعادة تعيين جميع البيانات
function handleResetData() {
    const result = resetAllData();

    if (result) {
        showToast('تم إعادة تعيين جميع البيانات بنجاح ✅', 'success');
        
        // إغلاق نافذة التأكيد
        closeModal('reset-confirm-modal');
        
        // إعادة تحميل الإعدادات
        loadSettings();
        
        // العودة للصفحة الرئيسية بعد فترة
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showToast('حدث خطأ أثناء إعادة التعيين', 'error');
    }
}