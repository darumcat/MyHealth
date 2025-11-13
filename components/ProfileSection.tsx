import React, { useState, useEffect } from 'react';
import type { AppData } from '../types';
import { UserIcon } from './icons';

interface ProfileSectionProps {
  appData: AppData;
  onSaveProfile: (name: string, dob: string) => Promise<void>;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ appData, onSaveProfile }) => {
  const [name, setName] = useState(appData.userName || '');
  const [dob, setDob] = useState(appData.userDob ? appData.userDob.split('T')[0] : '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setName(appData.userName || '');
    setDob(appData.userDob ? appData.userDob.split('T')[0] : '');
  }, [appData.userName, appData.userDob]);

  const handleSave = () => {
    onSaveProfile(name, dob);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(appData.userName || '');
    setDob(appData.userDob ? appData.userDob.split('T')[0] : '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-800">Профиль пациента</h2>
        </div>
        {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-sm text-teal-600 hover:text-teal-800 font-semibold">
                Редактировать
            </button>
        )}
      </div>
      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Имя</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                    placeholder="Введите ваше полное имя"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дата рождения</label>
                <input 
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)} 
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                />
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                    Отмена
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                    Сохранить
                </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-slate-700">
            <p><span className="font-semibold">Имя:</span> {appData.userName || 'Не указано'}</p>
            <p><span className="font-semibold">Дата рождения:</span> {appData.userDob ? new Date(appData.userDob).toLocaleDateString('ru-RU') : 'Не указана'}</p>
          </div>
        )}
      </div>
    </div>
  );
};