import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Shield, FileText, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as ScrollArea from '@radix-ui/react-scroll-area';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

const PrivacyText = `
## Privacy Policy
**Last Updated: January 3, 2026**

### Introduction
Welcome to Weave. We respect your privacy and are committed to protecting your personal data.

### Data Collection
We collect minimal data necessary for the functionality of the tool:
- **Project Data**: Your diagrams, metadata, and settings.
- **Usage Data**: If analytics are enabled, we track feature usage to improve the tool.

### Local Storage
Weave primarily operates client-side. Your project data is stored in your browser's Local Storage or indexedDB unless you explicitly sync with a cloud provider.

### Contact
privacy@t-ecosystem.com
`;

const KVKKText = `
## KVKK Aydınlatma Metni
**Veri Sorumlusu:** T-Ecosystem

Weave uygulamasını kullanarak, aşağıdaki hususları kabul etmiş sayılırsınız:

1. **Veri İşleme**: Çizimleriniz ve proje verileriniz varsayılan olarak cihazınızda (yerel) saklanır.
2. **Bulut Senkronizasyonu**: Google Drive veya T-Hub entegrasyonunu kullandığınızda, verileriniz ilgili sunuculara aktarılır.
3. **Haklarınız**: KVKK m.11 uyarınca verileriniz üzerinde tam kontrol hakkına sahipsiniz.
`;

const TermsText = `
## Terms of Service

1. **License**: Weave is provided "as is". 
2. **Ownership**: You own the schematics you create.
3. **Usage**: Do not use Weave for illegal purposes.
`;

export function LegalModal({ isOpen, onClose, defaultTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  const getContent = () => {
    switch(activeTab) {
        case 'privacy': return PrivacyText;
        case 'kvkk': return KVKKText;
        case 'terms': return TermsText;
        default: return PrivacyText;
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-[9999]" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b pb-4">
                <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="text-emerald-500" />
                    Legal & Compliance
                </Dialog.Title>
                <Dialog.Close asChild>
                    <button className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Close">
                        <X size={20} />
                    </button>
                </Dialog.Close>
            </div>
            
            <div className="flex flex-1 overflow-hidden pt-4">
                {/* Sidebar */}
                <div className="w-48 flex flex-col gap-2 border-r pr-4">
                    <button 
                        onClick={() => setActiveTab('privacy')}
                        className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'privacy' ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                    >
                        <Shield size={16} /> Privacy Policy
                    </button>
                    <button 
                        onClick={() => setActiveTab('kvkk')}
                        className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'kvkk' ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                    >
                        <FileText size={16} /> KVKK Text
                    </button>
                    <button 
                        onClick={() => setActiveTab('terms')}
                        className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'terms' ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                    >
                        <ScrollText size={16} /> Terms of Use
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 pl-6 overflow-y-auto">
                    <article className="prose dark:prose-invert prose-sm max-w-none">
                        {getContent().split('\n').map((line, i) => {
                             if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                             if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-3 mb-1">{line.replace('### ', '')}</h3>;
                             if (line.startsWith('**') && line.endsWith('**')) return <strong key={i}>{line.replace(/\*\*/g, '')}</strong>;
                             if (line.startsWith('- ')) return <div key={i} className="ml-4 flex items-start text-muted-foreground"><span className="mr-2 shrink-0">•</span><span>{line.replace('- ', '')}</span></div>;
                             if (line.trim().match(/^\d+\./)) return <div key={i} className="mb-2 font-medium">{line}</div>;
                             if (line.trim() === '') return <br key={i} />;
                             return <p key={i} className="mb-2 text-muted-foreground">{line}</p>;
                        })}
                    </article>
                </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
