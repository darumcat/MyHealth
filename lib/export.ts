import { AppData, MedicalRecord, RecordType, Vitals, BloodTest, Symptom, Vaccination } from '../types';

function generateHtml(appData: AppData, recordsToExport: MedicalRecord[]): string {
    const { userName, userDob } = appData;

    const styles = `
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 2rem; }
            @media print {
                body { margin: 1.5cm; }
                .no-print { display: none; }
            }
            h1, h2, h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; margin-top: 2em; }
            h1 { font-size: 2em; text-align: center; border-bottom: none; margin-bottom: 1em; }
            h2 { font-size: 1.5em; page-break-after: avoid; }
            h3 { font-size: 1.2em; border-bottom: 1px solid #f1f5f9; }
            table { width: 100%; border-collapse: collapse; margin-top: 1em; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            th, td { border: 1px solid #e2e8f0; padding: 0.5em; text-align: left; word-wrap: break-word; }
            th { background-color: #f8fafc; font-weight: bold; }
            .profile-info { margin-bottom: 2em; padding: 1em; background-color: #f8fafc; border-radius: 8px; text-align: center; }
            .no-data { color: #64748b; font-style: italic; padding: 1em 0; }
            .record-section { margin-bottom: 2.5em; }
            .blood-test-detail { margin-top: 1em; }
            .blood-test-values-table th, .blood-test-values-table td { font-size: 0.9em; }
            .out-of-range { color: #dc2626; font-weight: bold; }
        </style>
    `;

    const profileHtml = `
        <div class="profile-info">
            ${userName ? `<p><strong>Имя:</strong> ${userName}</p>` : ''}
            ${userDob ? `<p><strong>Дата рождения:</strong> ${new Date(userDob).toLocaleDateString('ru-RU')}</p>` : ''}
        </div>
    `;

    const recordsByType = recordsToExport.reduce((acc, record) => {
        if (!acc[record.type]) {
            acc[record.type] = [];
        }
        acc[record.type].push(record);
        return acc;
    }, {} as Record<RecordType, MedicalRecord[]>);
    
    const formatDate = (date: string) => new Date(date).toLocaleString('ru-RU');

    const vitalsHtml = () => {
        const records = (recordsByType.vitals || []) as Vitals[];
        if (records.length === 0) return '';
        return `
            <div class="record-section">
                <h2>Основные показатели</h2>
                <table>
                    <thead><tr><th>Дата</th><th>Давление</th><th>Пульс</th><th>t°C</th><th>Вес (кг)</th><th>Заметки</th></tr></thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td>${formatDate(r.date)}</td>
                                <td>${r.systolic}/${r.diastolic}</td>
                                <td>${r.pulse}</td>
                                <td>${r.temperature}</td>
                                <td>${r.weight}</td>
                                <td>${r.notes || ''}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
    
    const bloodTestsHtml = () => {
        const records = (recordsByType.bloodTest || []) as BloodTest[];
        if (records.length === 0) return '';
        return `
            <div class="record-section">
                <h2>Анализы крови</h2>
                ${records.map(r => `
                    <div class="blood-test-detail">
                        <h3>${r.name} - ${formatDate(r.date)}</h3>
                        ${r.notes ? `<p><em>Заметки: ${r.notes}</em></p>` : ''}
                        <table class="blood-test-values-table">
                            <thead><tr><th>Показатель</th><th>Значение</th><th>Ед.</th><th>Референс</th></tr></thead>
                            <tbody>
                                ${r.values.map(v => {
                                    const isOutOfRange = (v.refMin != null && v.value < v.refMin) || (v.refMax != null && v.value > v.refMax);
                                    const refRange = v.refMin != null && v.refMax != null ? `${v.refMin} - ${v.refMax}` : 'N/A';
                                    return `<tr class="${isOutOfRange ? 'out-of-range' : ''}">
                                        <td>${v.name}</td>
                                        <td>${v.value}</td>
                                        <td>${v.unit}</td>
                                        <td>${refRange}</td>
                                    </tr>`
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const symptomsHtml = () => {
        const records = (recordsByType.symptom || []) as Symptom[];
        if (records.length === 0) return '';
        return `
            <div class="record-section">
                <h2>Симптомы</h2>
                <table>
                    <thead><tr><th>Дата</th><th>Описание</th><th>Заметки</th></tr></thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td>${formatDate(r.date)}</td>
                                <td>${r.description}</td>
                                <td>${r.notes || ''}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const vaccinationsHtml = () => {
        const records = (recordsByType.vaccination || []) as Vaccination[];
        if (records.length === 0) return '';
        return `
            <div class="record-section">
                <h2>Прививки</h2>
                <table>
                    <thead><tr><th>Дата</th><th>Название</th><th>Напоминание</th><th>Заметки</th></tr></thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td>${formatDate(r.date)}</td>
                                <td>${r.name}</td>
                                <td>${r.reminderDate ? new Date(r.reminderDate).toLocaleDateString('ru-RU') : ''}</td>
                                <td>${r.notes || ''}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const noDataHtml = `<p class="no-data">Нет данных для отображения за выбранный период.</p>`;

    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Сводка медицинских данных: ${userName || 'Пациент'}</title>
            ${styles}
        </head>
        <body>
            <h1>Сводка медицинских данных</h1>
            ${profileHtml}
            ${recordsToExport.length > 0 ? 
                vitalsHtml() + bloodTestsHtml() + symptomsHtml() + vaccinationsHtml()
                : noDataHtml
            }
        </body>
        </html>
    `;
}

async function exportToPdf(appData: AppData, recordsToExport: MedicalRecord[]) {
    const htmlContent = generateHtml(appData, recordsToExport);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для экспорта.');
        return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
    }, 250);
}


export const exportService = {
  exportToPdf,
};
