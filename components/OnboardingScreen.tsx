import React from 'react';
import { LogoIcon } from './icons';

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <LogoIcon className="w-24 h-24 text-teal-500 mb-6" />
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
        Мой Залог Здоровья
      </h1>
      <p className="text-lg text-slate-600 max-w-xl mb-4">
        Все ваши медицинские данные в одном безопасном месте.
      </p>
      <p className="text-md text-slate-500 max-w-xl mb-8">
        Конфиденциально. Доступно оффлайн. Под вашим контролем.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
      >
        Начать
      </button>
    </div>
  );
};