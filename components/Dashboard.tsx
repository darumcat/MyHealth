import React, { useState, useMemo, useEffect } from 'react';
// FIX: RecordType is an enum used as a value, so it must be imported as a value, not a type.
import { RecordType } from '../types';
import type { AppData, MedicalRecord, Vitals, BloodTest } from '../types';
import { AddRecordModal } from './AddRecordModal';
import { AddIcon, BloodIcon, LockIcon, PillIcon, SyringeIcon, VitalsIcon, LogoIcon, PrintIcon, EditIcon, DeleteIcon, HeartIcon, EyeIcon } from './icons';
import { DataChart } from './DataChart';
import { BloodTestChart } from './BloodTestChart';
import { ProfileSection } from './ProfileSection';
import { exportService } from '../lib/export';
import { PressureChart } from './PressureChart';
import { TimePeriodSelector } from './TimePeriodSelector';


interface DashboardProps {
  appData: AppData;
  onUpdateData: (newData: AppData) => Promise<void>;
  onLock: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
}

const getRecordTypeInfo = (type: RecordType) => {
    switch(type) {
        case 'vitals': return { name: 'Показатели', Icon: VitalsIcon };
        case 'bloodTest': return { name: 'Анализы', Icon: BloodIcon };
        case 'symptom': return { name: 'Симптомы', Icon: PillIcon };
        case 'vaccination': return { name: 'Прививки', Icon: SyringeIcon };
        default: return { name: 'Запись', Icon: AddIcon };
    }
}

const filterRecordsByPeriod = (records: MedicalRecord[], period: string): MedicalRecord[] => {
    const now = new Date();
    
    if (period === 'all') {
        return records;
    }

    let startDate: Date;
    const endDate = now; // End date is always now for accurate filtering up to the current moment

    switch (period) {
        case 'day':
            // Last 24 hours from the current time
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week': {
            // From Monday of the current week at 00:00
            const firstDayOfWeek = new Date(now);
            const currentDay = now.getDay(); // Sunday: 0, Monday: 1, ...
            const dayDifference = currentDay === 0 ? 6 : currentDay - 1; // Calculate days to subtract to get to Monday
            firstDayOfWeek.setDate(now.getDate() - dayDifference);
            firstDayOfWeek.setHours(0, 0, 0, 0);
            startDate = firstDayOfWeek;
            break;
        }
        case 'month': {
            // From the 1st of the current month at 00:00
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            break;
        }
        case 'year':
            // From January 1st of the current year at 00:00
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            break;
        default:
             return records;
    }

    return records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
};


const Dashboard: React.FC<DashboardProps> = ({ appData, onUpdateData, onLock, isHighContrast, toggleHighContrast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRecordType, setModalRecordType] = useState<RecordType | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<MedicalRecord | null>(null);
  const [selectedBloodMetric, setSelectedBloodMetric] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const openAddModal = (type: RecordType) => {
    setRecordToEdit(null);
    setModalRecordType(type);
    setIsModalOpen(true);
  };
  
  const openEditModal = (record: MedicalRecord) => {
    setRecordToEdit(record);
    setModalRecordType(record.type);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setRecordToEdit(null);
  }

  const scheduleNotification = async (date: Date, title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
          const now = new Date();
          const timeDiff = date.getTime() - now.getTime();
          if (timeDiff > 0) {
              setTimeout(() => {
                  new Notification(title, { body });
              }, timeDiff);
          }
      } else if ('Notification' in window && Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              scheduleNotification(date, title, body);
          }
      }
  };

  const handleSaveRecord = async (recordData: Omit<MedicalRecord, 'id'> | MedicalRecord) => {
    let updatedRecords: MedicalRecord[];

    if ('id' in recordData) { // It's an update
        updatedRecords = appData.records.map(r => r.id === recordData.id ? recordData : r);
    } else { // It's a new record
        const fullRecord = { ...recordData, id: new Date().toISOString() + Math.random() } as MedicalRecord;
        
        if (fullRecord.type === 'vaccination' && fullRecord.reminderDate) {
          scheduleNotification(new Date(fullRecord.reminderDate), "Напоминание о прививке", `Не забудьте о прививке: ${fullRecord.name}`);
        }
        
        updatedRecords = [...appData.records, fullRecord];
    }

    const updatedData = {
      ...appData,
      records: updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
    await onUpdateData(updatedData);
    closeModal();
  };
  
  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись? Это действие необратимо.')) {
        const updatedRecords = appData.records.filter(r => r.id !== recordId);
        const updatedData = {
          ...appData,
          records: updatedRecords,
        };
        await onUpdateData(updatedData);
    }
  };


  const handleSaveProfile = async (name: string, dob: string) => {
    const updatedData = {
      ...appData,
      userName: name,
      userDob: dob ? new Date(dob).toISOString() : '',
    };
    await onUpdateData(updatedData);
  };
  
  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(appData.records, timePeriod);
  }, [appData.records, timePeriod]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportService.exportToPdf(appData, filteredRecords);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Не удалось экспортировать PDF. Попробуйте еще раз.");
    } finally {
      setIsExporting(false);
    }
  };

  
  const vitalsRecords = filteredRecords.filter(r => r.type === 'vitals') as Vitals[];
  
  const allBloodTestRecords = appData.records.filter(r => r.type === RecordType.BloodTest) as BloodTest[];
  const availableBloodMetrics = useMemo(() => {
    const allMetrics = allBloodTestRecords.flatMap(test => test.values.map(v => v.name.trim())).filter(Boolean);
    return [...new Set(allMetrics)];
  }, [allBloodTestRecords]);

  useEffect(() => {
    if (!selectedBloodMetric && availableBloodMetrics.length > 0) {
      setSelectedBloodMetric(availableBloodMetrics[0]);
    }
    if (availableBloodMetrics.length === 0) {
      setSelectedBloodMetric(null);
    }
  }, [availableBloodMetrics, selectedBloodMetric]);


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-teal-600"/>
            <h1 className="text-xl font-bold text-slate-800">Мой Залог Здоровья</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleHighContrast} className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${isHighContrast ? 'bg-teal-100' : ''}`} aria-label="Режим для слабовидящих">
              <EyeIcon className={`h-6 w-6 transition-colors ${isHighContrast ? 'text-teal-600' : 'text-slate-600'}`} />
            </button>
            <button onClick={onLock} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Заблокировать">
              <LockIcon className="h-6 w-6 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex-grow">
        <div className="flex flex-col sm:flex-row items-stretch gap-2 md:gap-4 mb-6">
            <button onClick={() => openAddModal(RecordType.Vitals)} className="flex-1 p-3 flex items-center justify-center gap-2 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center">
                <VitalsIcon className="h-6 w-6 text-red-500"/>
                <span className="font-semibold text-slate-700">Показатели</span>
            </button>
            <button onClick={() => openAddModal(RecordType.BloodTest)} className="flex-1 p-3 flex items-center justify-center gap-2 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center">
                <BloodIcon className="h-6 w-6 text-rose-500"/>
                <span className="font-semibold text-slate-700">Анализы</span>
            </button>
            <button onClick={() => openAddModal(RecordType.Symptom)} className="flex-1 p-3 flex items-center justify-center gap-2 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center">
                <PillIcon className="h-6 w-6 text-sky-500"/>
                <span className="font-semibold text-slate-700">Симптомы</span>
            </button>
             <button onClick={() => openAddModal(RecordType.Vaccination)} className="flex-1 p-3 flex items-center justify-center gap-2 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center">
                <SyringeIcon className="h-6 w-6 text-indigo-500"/>
                <span className="font-semibold text-slate-700">Прививки</span>
            </button>
        </div>

        <ProfileSection appData={appData} onSaveProfile={handleSaveProfile} />

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Экспорт данных</h2>
            <p className="text-slate-600 mb-4">Сохраните сводку ваших медицинских данных за выбранный период в виде PDF-документа.</p>
            
            <button 
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold rounded-lg shadow hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors disabled:bg-slate-400"
                disabled={isExporting || filteredRecords.length === 0}
            >
                <PrintIcon className="h-5 w-5"/>
                {isExporting ? 'Экспорт...' : 'Сохранить как PDF'}
            </button>
             {filteredRecords.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">Нет данных для экспорта за выбранный период.</p>
             )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-3 sm:mb-0">Аналитика</h2>
                <TimePeriodSelector selectedPeriod={timePeriod} onPeriodChange={setTimePeriod} />
            </div>

            {(appData.records.filter(r => r.type === 'vitals').length > 0 || availableBloodMetrics.length > 0) ? (
                <>
                    {vitalsRecords.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Артериальное давление</h3>
                                <PressureChart data={vitalsRecords} timePeriod={timePeriod} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Прочие показатели</h3>
                                <DataChart data={vitalsRecords} timePeriod={timePeriod} />
                            </div>
                        </div>
                    ) : (
                        appData.records.filter(r => r.type === 'vitals').length > 0 &&
                        <p className="text-slate-500 text-center py-4 mb-6">Нет данных о показателях за выбранный период.</p>
                    )}

                    {availableBloodMetrics.length > 0 && (
                        <div>
                            <hr className="my-6 border-slate-200" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-700 mb-2 sm:mb-0">Анализы крови</h3>
                                <select 
                                    onChange={e => setSelectedBloodMetric(e.target.value)} 
                                    value={selectedBloodMetric || ''}
                                    className="p-2 border border-slate-300 rounded-md bg-white text-slate-800 shadow-sm"
                                >
                                    {availableBloodMetrics.map(metric => <option key={metric} value={metric}>{metric}</option>)}
                                </select>
                            </div>
                            {selectedBloodMetric && <BloodTestChart data={filteredRecords} metricName={selectedBloodMetric} timePeriod={timePeriod} />}
                        </div>
                    )}
                </>
            ) : (
                 <p className="text-slate-500 text-center py-4">Добавьте данные о показателях или анализах крови, чтобы увидеть графики.</p>
            )}
        </div>


        <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">История записей</h2>
            </div>

            {appData.records.length > 0 ? (
                <ul className="space-y-4">
                    {appData.records.map(record => (
                        <li key={record.id} className="p-4 border border-slate-200 rounded-lg">
                           <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 rounded-full">
                                        {React.createElement(getRecordTypeInfo(record.type).Icon, {className: "h-6 w-6 text-teal-600"})}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{getRecordTypeInfo(record.type).name}</p>
                                        <p className="text-sm text-slate-500">{new Date(record.date).toLocaleString('ru-RU')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => openEditModal(record)} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors" aria-label="Редактировать">
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDeleteRecord(record.id)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors" aria-label="Удалить">
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                           </div>
                           <div className="mt-3 pl-12 text-sm text-slate-700">
                               {record.notes && <p className="italic mb-2">"{record.notes}"</p>}
                               {record.type === 'vitals' && <p>Давление: {record.systolic}/{record.diastolic}, Пульс: {record.pulse}, t°: {record.temperature}, Вес: {record.weight}кг</p>}
                               {record.type === 'symptom' && <p>Описание: {record.description}</p>}
                               {record.type === 'vaccination' && <p>Прививка: {record.name}{record.reminderDate && `, Напомнить: ${new Date(record.reminderDate).toLocaleDateString()}`}</p>}
                               {record.type === 'bloodTest' && 
                                <div>
                                    <p className="font-semibold">{record.name}</p>
                                    <ul className="list-disc pl-5 mt-1">
                                    {record.values.map((v, i) => {
                                        const isOutOfRange = (v.refMin != null && v.value < v.refMin) || (v.refMax != null && v.value > v.refMax);
                                        return <li key={i} className={isOutOfRange ? 'text-red-500 font-medium' : ''}>{v.name}: {v.value} {v.unit} {v.refMin != null && v.refMax != null ? `(норма ${v.refMin}-${v.refMax})` : ''}</li>
                                    })}
                                    </ul>
                                </div>
                               }
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <p className="text-slate-500">Пока нет ни одной записи.</p>
                    <p className="text-slate-500 mt-1">Нажмите одну из кнопок выше, чтобы добавить данные.</p>
                </div>
            )}
        </div>
      </main>

      <footer className="py-4 text-center">
        <a 
          href="https://dalink.to/darumcat" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors"
        >
          <HeartIcon className="h-5 w-5 text-red-500" />
          <span>Отблагодарить разработчика</span>
        </a>
      </footer>


      {isModalOpen && modalRecordType && (
        <AddRecordModal
          recordType={modalRecordType}
          recordToEdit={recordToEdit}
          onClose={closeModal}
          onSave={handleSaveRecord}
        />
      )}
    </div>
  );
};

export default Dashboard;