
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] no-print">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl w-[450px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-500 w-6 h-6" />
          {title}
        </h3>
        <p className="text-zinc-300 text-base mb-8 leading-relaxed font-medium">{message}</p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-800 rounded hover:bg-zinc-700"
          >
            İptal
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-bold shadow-lg shadow-red-900/20 flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Evet, Temizle
          </button>
        </div>
      </div>
    </div>
  );
};
