
import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { OnboardingScreen } from './components/OnboardingScreen';
import { cryptoService } from './lib/crypto';
import { dbService } from './lib/db';
import type { AppData, MedicalRecord } from './types';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';

enum AppState {
  Loading,
  Onboarding,
  Auth,
  Dashboard,
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Loading);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);

  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => localStorage.getItem('highContrast') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrast', String(isHighContrast));
  }, [isHighContrast]);
  
  const resetAppState = () => {
    setCryptoKey(null);
    setData(null);
    setAuthError(null);
    setIsLoading(false);
    setIsNewUser(true);
    setAppState(AppState.Onboarding);
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      const hasData = await dbService.hasData();
      if (hasData) {
        setIsNewUser(false);
        setAppState(AppState.Auth);
      } else {
        setIsNewUser(true);
        setAppState(AppState.Onboarding);
      }
    };
    checkUserStatus();
  }, []);

  const handleUnlock = useCallback(async (password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const key = await cryptoService.deriveKey(password);
      if (isNewUser) {
        const initialData: AppData = { records: [], userName: '', userDob: '' };
        const encryptedData = await cryptoService.encryptData(key, initialData);
        await dbService.saveEncryptedData(encryptedData);
        setData(initialData);
        setIsNewUser(false);
      } else {
        const encryptedData = await dbService.getEncryptedData();
        if (!encryptedData) throw new Error("Данные не найдены.");
        const decryptedData = await cryptoService.decryptData<AppData>(key, encryptedData);
        setData(decryptedData);
      }
      setCryptoKey(key);
      setAppState(AppState.Dashboard);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isNewUser]);

  const handleUpdateData = useCallback(async (updatedData: AppData) => {
    if (!cryptoKey) {
      console.error("No crypto key available for update");
      setAppState(AppState.Auth);
      return;
    }
    try {
      setData(updatedData);
      const encryptedData = await cryptoService.encryptData(cryptoKey, updatedData);
      await dbService.saveEncryptedData(encryptedData);
    } catch (error) {
        console.error("Failed to save data:", error);
        alert("Не удалось сохранить данные. Пожалуйста, попробуйте еще раз.");
    }
  }, [cryptoKey]);
  
    const handleExportData = async () => {
        setIsLoading(true);
        try {
            const encryptedData = await dbService.getEncryptedData();
            if (!encryptedData) {
                throw new Error("Нет данных для экспорта.");
            }
            
            const backupObject = {
                appName: 'MyHealthPledgeBackup',
                version: 1,
                encryptedData,
            };

            const backupJson = JSON.stringify(backupObject, null, 2);
            const blob = new Blob([backupJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `health-data-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Не удалось экспортировать данные.";
            alert(`Ошибка экспорта: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportData = async (fileContent: string) => {
        if (!cryptoKey || !data) {
            alert("Ошибка: Ключ шифрования не найден. Попробуйте перезайти в приложение.");
            return;
        }
        setIsLoading(true);
        try {
            const backup = JSON.parse(fileContent);
            if (backup.appName !== 'MyHealthPledgeBackup' || !backup.encryptedData) {
                throw new Error("Неверный формат файла резервной копии.");
            }

            const importedData = await cryptoService.decryptData<AppData>(cryptoKey, backup.encryptedData);

            // Merge records
            const combinedRecords = [...data.records, ...importedData.records];
            const uniqueRecordsMap = new Map<string, MedicalRecord>();
            combinedRecords.forEach(record => {
                uniqueRecordsMap.set(record.id, record);
            });
            const mergedRecords = Array.from(uniqueRecordsMap.values())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Merge profile info (imported data takes precedence if it exists and not empty)
            const mergedUserName = importedData.userName || data.userName;
            const mergedUserDob = importedData.userDob || data.userDob;
            
            const updatedData: AppData = {
                ...data,
                userName: mergedUserName,
                userDob: mergedUserDob,
                records: mergedRecords,
            };

            await handleUpdateData(updatedData);
            alert("Данные успешно импортированы и объединены!");

        } catch (error) {
            console.error("Import failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Не удалось импортировать данные.";
            alert(`Ошибка импорта: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

  const handleLock = () => {
    setCryptoKey(null);
    setData(null);
    setAuthError(null);
    setAppState(AppState.Auth);
  };

  const handleResetRequest = () => {
    setIsResetConfirmVisible(true);
  };

  const confirmReset = async () => {
      setIsResetConfirmVisible(false);
      try {
          await dbService.clearData();
          resetAppState();
      } catch (error) {
          console.error("Failed to clear data:", error);
          alert("Не удалось удалить данные. Пожалуйста, попробуйте еще раз.");
      }
  };

  const toggleHighContrast = () => setIsHighContrast(prev => !prev);

  const renderContent = () => {
    switch (appState) {
      case AppState.Loading:
        return <div className="flex items-center justify-center min-h-screen bg-slate-100 text-slate-800">Загрузка...</div>;
      case AppState.Onboarding:
        return <OnboardingScreen onStart={() => setAppState(AppState.Auth)} />;
      case AppState.Auth:
        return <AuthScreen isNewUser={isNewUser} onUnlock={handleUnlock} error={authError} isLoading={isLoading} onReset={handleResetRequest} />;
      case AppState.Dashboard:
        if (data) {
          return (
            <Dashboard 
              appData={data} 
              onUpdateData={handleUpdateData} 
              onExportData={handleExportData}
              onImportData={handleImportData}
              onLock={handleLock}
              isHighContrast={isHighContrast}
              toggleHighContrast={toggleHighContrast}
            />
          );
        }
        handleLock(); 
        return null;
      default:
        return <div className="text-slate-800">Что-то пошло не так</div>;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      {renderContent()}
      {isResetConfirmVisible && (
        <ResetConfirmationModal
          onConfirm={confirmReset}
          onCancel={() => setIsResetConfirmVisible(false)}
        />
      )}
    </div>
  );
};

export default App;
