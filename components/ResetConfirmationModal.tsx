
import React from 'react';

interface ResetConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm text-center p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Вы уверены?</h3>
        <p className="text-slate-600 mb-6">
          Все ваши данные будут безвозвратно удалены. Это действие нельзя отменить.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};
