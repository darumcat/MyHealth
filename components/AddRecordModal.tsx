import React, { useState, useEffect } from 'react';
import { RecordType, BloodTestValue, MedicalRecord, Vitals, BloodTest, Symptom, Vaccination } from '../types';

interface AddRecordModalProps {
  recordType: RecordType;
  recordToEdit?: MedicalRecord | null;
  onClose: () => void;
  onSave: (record: Omit<MedicalRecord, 'id'> | MedicalRecord) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({ recordType, recordToEdit, onClose, onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  
  // Vitals state
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');

  // BloodTest state
  const [testName, setTestName] = useState('');
  const [testValues, setTestValues] = useState<BloodTestValue[]>([{ name: '', value: 0, unit: '', refMin: undefined, refMax: undefined }]);

  // Symptom state
  const [description, setDescription] = useState('');

  // Vaccination state
  const [vaccineName, setVaccineName] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const isEditMode = !!recordToEdit;

  useEffect(() => {
    if (!recordToEdit) return;

    setDate(new Date(recordToEdit.date).toISOString().slice(0, 16));
    setNotes(recordToEdit.notes || '');

    switch (recordToEdit.type) {
      case RecordType.Vitals:
        setSystolic(String(recordToEdit.systolic));
        setDiastolic(String(recordToEdit.diastolic));
        setPulse(String(recordToEdit.pulse));
        setTemperature(String(recordToEdit.temperature));
        setWeight(String(recordToEdit.weight));
        break;
      case RecordType.BloodTest:
        setTestName(recordToEdit.name);
        setTestValues(recordToEdit.values);
        break;
      case RecordType.Symptom:
        setDescription(recordToEdit.description);
        break;
      case RecordType.Vaccination:
        setVaccineName(recordToEdit.name);
        setReminderDate(recordToEdit.reminderDate ? new Date(recordToEdit.reminderDate).toISOString().slice(0, 16) : '');
        break;
    }
  }, [recordToEdit]);


  const handleSave = () => {
    let record: Omit<MedicalRecord, 'id'> | MedicalRecord | null = null;
    const common = { date: new Date(date).toISOString(), notes };
    const baseRecord = isEditMode ? { ...common, id: recordToEdit.id } : common;

    switch (recordType) {
      case RecordType.Vitals: {
        const newRecord: Omit<Vitals, 'id'> | Vitals = { ...baseRecord, type: RecordType.Vitals, systolic: +systolic, diastolic: +diastolic, pulse: +pulse, temperature: +temperature, weight: +weight };
        record = newRecord;
        break;
      }
      case RecordType.BloodTest: {
        const newRecord: Omit<BloodTest, 'id'> | BloodTest = { ...baseRecord, type: RecordType.BloodTest, name: testName, values: testValues.filter(v => v.name) };
        record = newRecord;
        break;
      }
      case RecordType.Symptom: {
        const newRecord: Omit<Symptom, 'id'> | Symptom = { ...baseRecord, type: RecordType.Symptom, description };
        record = newRecord;
        break;
      }
      case RecordType.Vaccination: {
        const newRecord: Omit<Vaccination, 'id'> | Vaccination = { ...baseRecord, type: RecordType.Vaccination, name: vaccineName, reminderDate: reminderDate ? new Date(reminderDate).toISOString() : undefined };
        record = newRecord;
        break;
      }
    }
    if (record) {
      onSave(record);
    }
  };

  const handleBloodValueChange = (index: number, field: keyof BloodTestValue, value: any) => {
    const newValues = [...testValues];
    (newValues[index] as any)[field] = field === 'value' || field === 'refMin' || field === 'refMax' ? (value ? parseFloat(value) : undefined) : value;
    setTestValues(newValues);
  };
  
  const addBloodValueRow = () => {
    setTestValues([...testValues, { name: '', value: 0, unit: '', refMin: undefined, refMax: undefined }]);
  };

  const renderForm = () => {
    switch (recordType) {
      case RecordType.Vitals:
        return (
          <>
            <input type="number" placeholder="Давление сист. (мм рт. ст.)" value={systolic} onChange={e => setSystolic(e.target.value)} required />
            <input type="number" placeholder="Давление диаст. (мм рт. ст.)" value={diastolic} onChange={e => setDiastolic(e.target.value)} required />
            <input type="number" placeholder="Пульс (уд/мин)" value={pulse} onChange={e => setPulse(e.target.value)} required />
            <input type="number" step="0.1" placeholder="Температура (°C)" value={temperature} onChange={e => setTemperature(e.target.value)} required />
            <input type="number" step="0.1" placeholder="Вес (кг)" value={weight} onChange={e => setWeight(e.target.value)} required />
          </>
        );
      case RecordType.BloodTest:
        return (
          <>
            <input type="text" placeholder="Название анализа (напр. Общий анализ крови)" value={testName} onChange={e => setTestName(e.target.value)} required />
            <h4 className="text-sm font-semibold mt-4 mb-2 text-slate-600">Показатели</h4>
            {testValues.map((val, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 p-2 border border-slate-200 rounded-md">
                <input className="col-span-2" type="text" placeholder="Название (гемоглобин)" value={val.name} onChange={e => handleBloodValueChange(i, 'name', e.target.value)} />
                <input type="number" step="any" placeholder="Значение" value={val.value} onChange={e => handleBloodValueChange(i, 'value', e.target.value)} />
                <input className="col-span-2" type="text" placeholder="Ед. (г/л)" value={val.unit} onChange={e => handleBloodValueChange(i, 'unit', e.target.value)} />
                <input type="number" step="any" placeholder="Норма мин." value={val.refMin ?? ''} onChange={e => handleBloodValueChange(i, 'refMin', e.target.value)} />
                <input type="number" step="any" placeholder="Норма макс." value={val.refMax ?? ''} onChange={e => handleBloodValueChange(i, 'refMax', e.target.value)} />
              </div>
            ))}
            <button onClick={addBloodValueRow} className="text-sm text-teal-600 hover:text-teal-800">+ Добавить показатель</button>
          </>
        );
      case RecordType.Symptom:
        return <textarea placeholder="Опишите симптом..." value={description} onChange={e => setDescription(e.target.value)} required />;
      case RecordType.Vaccination:
        return (
          <>
            <input type="text" placeholder="Название прививки" value={vaccineName} onChange={e => setVaccineName(e.target.value)} required />
            <div className="mt-2">
                <label className="text-sm text-slate-600">Дата напоминания (необязательно)</label>
                <input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
            </div>
          </>
        );
      default: return null;
    }
  };
  
  const titles: Record<RecordType, string> = {
      vitals: 'Добавить показатели',
      bloodTest: 'Добавить анализ крови',
      symptom: 'Добавить симптом',
      vaccination: 'Добавить прививку'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{isEditMode ? 'Редактировать запись' : titles[recordType]}</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-slate-600">Дата и время</label>
                    <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                {renderForm()}
                <textarea placeholder="Заметки (необязательно)..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
        </div>
        <div className="bg-slate-50 px-6 py-3 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Отмена</button>
          <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Сохранить</button>
        </div>
      </div>
      <style>{`
        input, textarea {
            display: block;
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.375rem;
            background-color: white;
            color: #1e293b;
        }
        textarea {
            min-height: 80px;
        }
      `}</style>
    </div>
  );
};