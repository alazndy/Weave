import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { PremiumModal } from '../ui/PremiumModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="text-amber-500 w-5 h-5" />}
      width="max-w-md"
      footer={
        <>
            <button 
                onClick={onClose} 
                className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
            >
                İptal
            </button>
            <button 
                onClick={onConfirm} 
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 flex items-center gap-2 transition-transform active:scale-95"
            >
                <Trash2 className="w-4 h-4" />
                Evet, Temizle
            </button>
        </>
      }
    >
      <div className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed font-medium">
        {message}
      </div>
    </PremiumModal>
  );
};
