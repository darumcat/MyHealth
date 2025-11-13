import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { OnboardingScreen } from './components/OnboardingScreen';
import { cryptoService } from './lib/crypto';
import { dbService } from './lib/db';
import type { AppData } from './types';

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
  
  const handleLock = () => {
    setCryptoKey(null);
    setData(null);
    setAuthError(null);
    setAppState(AppState.Auth);
  };

  const toggleHighContrast = () => setIsHighContrast(prev => !prev);

  const renderContent = () => {
    switch (appState) {
      case AppState.Loading:
        return <div className="flex items-center justify-center min-h-screen bg-slate-100 text-slate-800">Загрузка...</div>;
      case AppState.Onboarding:
        return <OnboardingScreen onStart={() => setAppState(AppState.Auth)} />;
      case AppState.Auth:
        return <AuthScreen isNewUser={isNewUser} onUnlock={handleUnlock} error={authError} isLoading={isLoading} />;
      case AppState.Dashboard:
        if (data) {
          return (
            <Dashboard 
              appData={data} 
              onUpdateData={handleUpdateData} 
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
    </div>
  );
};

export default App;