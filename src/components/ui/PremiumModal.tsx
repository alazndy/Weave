import React from 'react';
import { X } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string; // e.g., 'max-w-md', 'max-w-2xl'
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  width = 'max-w-lg',
  icon,
  headerAction
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`${width} w-full glass-panel border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/[0.02]">
          <h3 className="text-xl font-bold premium-gradient-text flex items-center gap-3">
            {icon && (
               <div className="bg-gradient-to-br from-paprika/20 to-apricot/20 p-2 rounded-lg border border-paprika/20 shadow-sm">
                 {icon}
               </div>
            )}
            {title}
          </h3>
          <div className="flex items-center gap-3">
            {headerAction}
            <button 
                onClick={onClose} 
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-lg"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 backdrop-blur-sm flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
