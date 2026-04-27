// ==================== الكاشير - منطق صفحة المحفظة ====================

document.addEventListener('DOMContentLoaded', function() {
    initWalletPage();
});

// متغيرات لتتبع العملية الحالية
let currentAccount = ''; // main أو worker
let currentTransactionType = ''; // deposit أو withdraw

function initWalletPage() {
    // عرض بيانات المحفظة
    displayWallet();

    // أزرار الإيداع والسحب للحساب الرئيسي
    setupWalletButton('deposit-main-btn', 'main', 'deposit');
    setupWalletButton('withdraw-main-btn', 'main', 'withdraw');
    
    // أزرار الإيداع والسحب لحساب العامل
    setupWalletButton('deposit-worker-btn', 'worker', 'deposit');
    setupWalletButton('withdraw-worker-btn', 'worker', 'withdraw');

    // تفعيل حفظ الحركة
    const form = document.getElementById('wallet-transaction-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveWalletTransaction();
        });
    }

    // تفعيل زر إلغاء العملية
    const cancelBtn = document.getElementById('cancel-transaction');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeModal('wallet-transaction-modal');
            resetTransactionForm();
        });
    }

    // إغلاق المودال بالنقر خارج المحتوى
    setupModalOutsideClick('wallet-transaction-modal', '.rounded-2xl');
}

// عرض بيانات المحفظة
function displayWallet() {
    const balances = getBalances();
    const settings = getSettings();
    const currency = settings.currency || 'د.ع';
    const transactions = getWalletTransactions();

    // تحديث رصيد الحساب الرئيسي
    const mainBalanceEl = document.getElementById('wallet-main-balance');
    if (mainBalanceEl) {
        mainBalanceEl.textContent = formatNumber(balances.main);
    }

    // تحديث رصيد حساب العامل
    const workerBalanceEl = document.getElementById('wallet-worker-balance');
    if (workerBalanceEl) {
        workerBalanceEl.textContent = formatNumber(balances.worker);
    }

    // تحديث عرض العملة
    const currencyMain = document.getElementById('wallet-currency-main');
    if (currencyMain) {
        currencyMain.textContent = currency;
    }

    const currencyWorker = document.getElementById('wallet-currency-worker');
    if (currencyWorker) {
        currencyWorker.textContent = currency;
    }

    // عرض سجل الحركات
    displayTransactions(transactions);
}

// عرض سجل الحركات
function displayTransactions(transactions) {
    const noTransactionsMsg = document.getElementById('no-transactions-msg');
    const transactionsList = document.getElementById('transactions-list');

    if (!noTransactionsMsg || !transactionsList) return;

    if (!transactions || transactions.length === 0) {
        noTransactionsMsg.classList.remove('hidden');
        transactionsList.innerHTML = '';
        return;
    }

    noTransactionsMsg.classList.add('hidden');

    // ترتيب الحركات من الأحدث إلى الأقدم
    const sortedTransactions = sortByDateDesc([...transactions], 'createdAt');

    const settings = getSettings();
    const currency = settings.currency || 'د.ع';

    let html = '';
    sortedTransactions.forEach(function(transaction) {
        html += createTransactionCard(transaction, currency);
    });

    transactionsList.innerHTML = html;
}

// إنشاء بطاقة حركة محفظة
function createTransactionCard(transaction, currency) {
    const accountText = transaction.account === 'main' ? '🏦 الحساب الرئيسي' : '👤 العامل';
    
    let typeText = '';
    let typeColor = '';
    let borderColor = '';
    let bgColor = '';
    let amountPrefix = '';

    if (transaction.type === 'deposit') {
        typeText = '📥 إيداع';
        typeColor = 'text-green-700 dark:text-green-400';
        borderColor = 'border-green-500';
        bgColor = 'bg-green-50 dark:bg-green-900/20';
        amountPrefix = '+';
    } else {
        typeText = '📤 سحب';
        typeColor = 'text-red-700 dark:text-red-400';
        borderColor = 'border-red-500';
        bgColor = 'bg-red-50 dark:bg-red-900/20';
        amountPrefix = '-';
    }

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-r-4 ${borderColor} ${bgColor}">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">${accountText}</span>
                <span class="font-bold ${typeColor}">${typeText}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-lg font-bold">${amountPrefix} ${formatCurrency(transaction.amount, currency)}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">${formatDateTime(transaction.createdAt)}</span>
            </div>
        </div>
    `;
}

// تفعيل أزرار المحفظة
function setupWalletButton(buttonId, account, type) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', function() {
        currentAccount = account;
        currentTransactionType = type;

        // تحديث عنوان المودال
        const titleEl = document.getElementById('modal-transaction-title');
        if (titleEl) {
            const accountText = account === 'main' ? 'الحساب الرئيسي' : 'العامل';
            const typeText = type === 'deposit' ? 'إيداع' : 'سحب';
            const emoji = type === 'deposit' ? '📥' : '📤';
            titleEl.textContent = emoji + ' ' + typeText + ' - ' + accountText;
        }

        // تعيين القيم المخفية
        const accountInput = document.getElementById('transaction-account');
        const typeInput = document.getElementById('transaction-type');
        if (accountInput) accountInput.value = account;
        if (typeInput) typeInput.value = type;

        // إعادة تعيين حقل المبلغ
        const amountInput = document.getElementById('transaction-amount');
        if (amountInput) {
            amountInput.value = '';
            amountInput.focus();
        }

        // فتح المودال
        openModal('wallet-transaction-modal');
    });
}

// حفظ حركة المحفظة
function saveWalletTransaction() {
    const amountInput = document.getElementById('transaction-amount');
    const amount = parseInt(amountInput ? amountInput.value : 0);

    if (!amount || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }

    // التحقق من الرصيد في حالة السحب
    if (currentTransactionType === 'withdraw') {
        const balances = getBalances();
        const currentBalance = currentAccount === 'main' ? balances.main : balances.worker;
        
        if (amount > currentBalance) {
            showToast('الرصيد غير كافٍ! المتوفر: ' + formatNumber(currentBalance), 'error');
            return;
        }
    }

    // إنشاء كائن الحركة
    const transaction = {
        account: currentAccount,
        type: currentTransactionType,
        amount: amount
    };

    // حفظ الحركة
    const result = addWalletTransaction(transaction);

    if (result) {
        showToast('تمت العملية بنجاح ✅', 'success');
        
        // إعادة تعيين النموذج وإغلاق المودال
        closeModal('wallet-transaction-modal');
        resetTransactionForm();
        
        // تحديث عرض المحفظة
        displayWallet();
    } else if (result === false) {
        showToast('الرصيد غير كافٍ!', 'error');
    } else {
        showToast('حدث خطأ أثناء تنفيذ العملية', 'error');
    }
}

// إعادة تعيين نموذج الحركة
function resetTransactionForm() {
    const amountInput = document.getElementById('transaction-amount');
    const accountInput = document.getElementById('transaction-account');
    const typeInput = document.getElementById('transaction-type');

    if (amountInput) amountInput.value = '';
    if (accountInput) accountInput.value = '';
    if (typeInput) typeInput.value = '';

    currentAccount = '';
    currentTransactionType = '';
}