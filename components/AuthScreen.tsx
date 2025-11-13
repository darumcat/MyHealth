import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface AuthScreenProps {
  isNewUser: boolean;
  onUnlock: (password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isNewUser, onUnlock, error, isLoading }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewUser && password !== confirmPassword) {
      alert("Пароли не совпадают!");
      return;
    }
    if (password.length < 4) {
      alert("Пароль должен быть не менее 4 символов.");
      return;
    }
    onUnlock(password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <LogoIcon className="w-16 h-16 text-teal-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">
            {isNewUser ? 'Создайте пароль' : 'Добро пожаловать'}
          </h1>
          <p className="text-slate-600 mt-1 text-center">
            {isNewUser
              ? 'Этот пароль шифрует ваши данные. Мы не можем его восстановить.'
              : 'Введите ваш пароль для доступа к данным.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-slate-700 bg-white border-slate-300 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="••••••••"
              required
            />
          </div>
          {isNewUser && (
            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                Подтвердите пароль
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-slate-700 bg-white border-slate-300 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="••••••••"
                required
              />
            </div>
          )}
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 disabled:bg-slate-400 transition-colors"
            >
              {isLoading ? 'Загрузка...' : (isNewUser ? 'Сохранить' : 'Войти')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};