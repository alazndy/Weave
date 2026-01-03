import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
// Assuming we have basic UI components or we can inline styles/classes
// Weave uses standard tailwind.

export function CookieConsent({ onOpenLegal }: { onOpenLegal: (tab: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent-v1');
    if (!consent) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const newPrefs = { essential: true, analytics: true, marketing: true };
    saveConsent(newPrefs);
  };

  const handleDeclineAll = () => {
    const newPrefs = { essential: true, analytics: false, marketing: false };
    saveConsent(newPrefs);
  };

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem('cookie-consent-v1', JSON.stringify(prefs));
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-[9999] w-full max-w-sm"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 text-zinc-100">
            {!showPreferences ? (
              <>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Cookie size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Cookie Preferences</h3>
                    <p className="text-sm text-zinc-400">
                      We use cookies to ensure you get the best experience on Weave. 
                      <button onClick={() => onOpenLegal('privacy')} className="text-emerald-500 hover:underline ml-1">
                        Privacy Policy
                      </button>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeclineAll}
                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={handleAcceptAll}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    Accept All
                  </button>
                </div>
                <button 
                  onClick={() => setShowPreferences(true)}
                  className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Manage Preferences
                </button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
                  Preferences
                  <button onClick={() => setShowPreferences(false)}><X size={16} /></button>
                </h3>
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Essential</span>
                      <span className="text-xs text-zinc-500">Required for app functionality</span>
                    </div>
                    <div className="w-10 h-6 bg-emerald-600/50 rounded-full relative opacity-50 cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Analytics</span>
                      <span className="text-xs text-zinc-500">Help us improve Weave</span>
                    </div>
                    <button 
                         onClick={() => setPreferences(p => ({...p, analytics: !p.analytics}))}
                         className={cn("w-10 h-6 rounded-full relative transition-colors", preferences.analytics ? "bg-emerald-600" : "bg-zinc-700")}
                    >
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", preferences.analytics ? "right-1" : "left-1")} />
                    </button>
                  </div>
                </div>
                <button 
                    onClick={() => saveConsent(preferences)}
                    className="w-full px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                >
                    Save Preferences
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
