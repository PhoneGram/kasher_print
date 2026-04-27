// ==================== الكاشير - تحميل الصور بصيغة A4 ====================

// ==================== تحميل فاتورة كصورة ====================
function downloadInvoiceAsImage(invoice) {
    const settings = getSettings();
    const libraryName = settings.libraryName || '';

    // إنشاء حاوية مؤقتة للصورة
    const container = document.createElement('div');
    container.className = 'download-image-container';
    container.style.cssText = `
        width: 794px;
        background: #ffffff;
        padding: 40px;
        font-family: 'Tajawal', sans-serif;
        color: #111827;
        direction: rtl;
        position: fixed;
        top: -9999px;
        left: -9999px;
    `;

    // بناء هيدر الصورة
    const headerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
            <img src="logo.png" alt="الكاشير" style="width: 64px; height: 64px; object-fit: contain; margin: 0 auto 8px; display: block;" onerror="this.style.display='none'">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #111827;">الكاشير</h2>
            ${libraryName ? '<p style="font-size: 14px; color: #6b7280; margin: 0;">' + libraryName + '</p>' : ''}
        </div>
    `;

    // بناء محتوى الفاتورة
    const statusText = invoice.status === 'paid' ? '✅ مدفوعة' : '❌ غير مدفوعة';
    const statusColor = invoice.status === 'paid' ? '#16a34a' : '#dc2626';
    const currency = settings.currency || 'د.ع';
    const printPrice = settings.printPrice || 1000;
    const totalAmount = (parseInt(invoice.printQty) || 0) * printPrice;

    const contentHTML = `
        <div style="padding: 10px 0;">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px; text-align: center; color: #111827;">فاتورة رقم : ${invoice.invoiceNumber || invoice.id}</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; width: 40%;">الزبون</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${invoice.customerName || '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">عدد المطبوعات</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${invoice.printQty}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">التاريخ</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDate(invoice.date)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">وقت الإنشاء</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDateTime(invoice.createdAt)}</td>
                </tr>
                ${invoice.paidAt ? `
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">تاريخ الدفع</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDateTime(invoice.paidAt)}</td>
                </tr>` : ''}
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">الحالة</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 700;">${statusText}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">المجموع</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 700; font-size: 16px;">${formatCurrency(totalAmount, currency)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700;">الملاحظات</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${invoice.notes || 'لا يوجد'}</td>
                </tr>
            </table>
        </div>
    `;

    // بناء فوتر الصورة
    const footerHTML = `
        <div style="text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">اعداد وتصميم : رضا محمد</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">جميع الحقوق محفوظة ©</p>
        </div>
    `;

    container.innerHTML = headerHTML + contentHTML + footerHTML;
    document.body.appendChild(container);

    // استخدام html2canvas لتحويل الحاوية إلى صورة
    // ملاحظة: يجب إضافة مكتبة html2canvas في صفحات HTML التي تستخدم هذه الدالة
    if (typeof html2canvas !== 'undefined') {
        html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(function(canvas) {
            // تحويل canvas إلى صورة PNG وتحميلها
            const link = document.createElement('a');
            link.download = 'فاتورة-' + (invoice.invoiceNumber || invoice.id) + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // إزالة الحاوية المؤقتة
            document.body.removeChild(container);
        }).catch(function(error) {
            console.error('خطأ في إنشاء الصورة:', error);
            document.body.removeChild(container);
            showToast('حدث خطأ أثناء تحميل الصورة', 'error');
        });
    } else {
        // إذا لم تكن المكتبة محملة
        document.body.removeChild(container);
        showToast('يرجى تحميل مكتبة html2canvas', 'error');
        console.error('مكتبة html2canvas غير محملة');
    }
}

// ==================== تحميل جدول الاحصائيات كصورة ====================
function downloadStatisticsAsImage(statsData, statsMode, dateValue) {
    const settings = getSettings();
    const libraryName = settings.libraryName || '';
    const currency = settings.currency || 'د.ع';

    // إنشاء حاوية مؤقتة للصورة
    const container = document.createElement('div');
    container.className = 'download-image-container';
    container.style.cssText = `
        width: 794px;
        background: #ffffff;
        padding: 40px;
        font-family: 'Tajawal', sans-serif;
        color: #111827;
        direction: rtl;
        position: fixed;
        top: -9999px;
        left: -9999px;
    `;

    // تحديد عنوان الاحصائية
    let statsTitle = '';
    let dateLabel = '';
    
    if (statsMode === 'day') {
        statsTitle = 'احصائيات يوم';
        dateLabel = formatDate(dateValue);
    } else if (statsMode === 'month') {
        statsTitle = 'احصائيات شهر';
        const parts = dateValue.split('-');
        dateLabel = getArabicMonth(parseInt(parts[1])) + ' ' + parts[0];
    } else if (statsMode === 'year') {
        statsTitle = 'احصائيات سنة';
        dateLabel = dateValue;
    }

    // بناء هيدر الصورة
    const headerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
            <img src="logo.png" alt="الكاشير" style="width: 64px; height: 64px; object-fit: contain; margin: 0 auto 8px; display: block;" onerror="this.style.display='none'">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #111827;">الكاشير</h2>
            ${libraryName ? '<p style="font-size: 14px; color: #6b7280; margin: 0;">' + libraryName + '</p>' : ''}
        </div>
    `;

    // بناء رأس الجدول
    let tableHeadColumns = '';
    if (statsMode === 'day') {
        tableHeadColumns = `
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">تسلسل</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">الزبون</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">عدد المطبوعات</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">الوارد</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">أجور العامل</th>
        `;
    } else {
        tableHeadColumns = `
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">تسلسل</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">عدد المطبوعات</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">الوارد</th>
            <th style="padding: 10px 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 700; text-align: center;">أجور العامل</th>
        `;
    }

    // بناء صفوف الجدول
    let tableRows = '';
    if (statsData.details && statsData.details.length > 0) {
        statsData.details.forEach(function(row) {
            if (statsMode === 'day') {
                tableRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.sequence}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.customerName || '-'}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.printQty}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.income, currency)}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.workerFee, currency)}</td>
                    </tr>
                `;
            } else if (statsMode === 'month') {
                tableRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.sequence}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.printQty}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.income, currency)}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.workerFee, currency)}</td>
                    </tr>
                `;
            } else if (statsMode === 'year') {
                tableRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.monthName}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${row.printQty}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.income, currency)}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(row.workerFee, currency)}</td>
                    </tr>
                `;
            }
        });
    }

    // صف المجموع
    let totalRow = '';
    if (statsData.totals) {
        if (statsMode === 'day') {
            totalRow = `
                <tr style="font-weight: 700; background: #eff6ff;">
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;" colspan="2">المجموع</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${statsData.totals.prints}</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(statsData.totals.income, currency)}</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(statsData.totals.workerFees, currency)}</td>
                </tr>
            `;
        } else {
            totalRow = `
                <tr style="font-weight: 700; background: #eff6ff;">
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">المجموع</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${statsData.totals.prints}</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(statsData.totals.income, currency)}</td>
                    <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${formatCurrency(statsData.totals.workerFees, currency)}</td>
                </tr>
            `;
        }
    }

    // بناء محتوى الجدول
    const contentHTML = `
        <div style="padding: 10px 0;">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; text-align: center; color: #111827;">${statsTitle}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px; text-align: center;">${dateLabel}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <thead>
                    <tr>
                        ${tableHeadColumns}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                    ${totalRow}
                </tbody>
            </table>
        </div>
    `;

    // بناء فوتر الصورة
    const footerHTML = `
        <div style="text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">اعداد وتصميم : رضا محمد</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">جميع الحقوق محفوظة ©</p>
        </div>
    `;

    container.innerHTML = headerHTML + contentHTML + footerHTML;
    document.body.appendChild(container);

    // استخدام html2canvas لتحويل الحاوية إلى صورة
    if (typeof html2canvas !== 'undefined') {
        html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(function(canvas) {
            // تحويل canvas إلى صورة PNG وتحميلها
            const link = document.createElement('a');
            link.download = 'احصائيات-' + dateValue + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // إزالة الحاوية المؤقتة
            document.body.removeChild(container);
        }).catch(function(error) {
            console.error('خطأ في إنشاء الصورة:', error);
            document.body.removeChild(container);
            showToast('حدث خطأ أثناء تحميل الصورة', 'error');
        });
    } else {
        document.body.removeChild(container);
        showToast('يرجى تحميل مكتبة html2canvas', 'error');
        console.error('مكتبة html2canvas غير محملة');
    }
}