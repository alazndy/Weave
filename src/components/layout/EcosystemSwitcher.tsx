import React, { useState, useRef, useEffect } from "react"
import { LayoutGrid, Package, Share2, Boxes } from "lucide-react"

const apps = [
    {
        name: "T-HUB",
        description: "Unified Project Hub",
        url: "http://localhost:3001",
        icon: LayoutGrid,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        name: "ENV-I",
        description: "Inventory Management",
        url: "http://localhost:3000",
        icon: Package,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    {
        name: "T-WEAVE",
        description: "Technical Design Tool",
        url: "http://localhost:3003",
        icon: Share2,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    }
]

export const EcosystemSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-110' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10'
        }`}
        title="Switch App"
      >
        <Boxes className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-widest">
                    Ecosystem Apps
                </span>
            </div>
            <div className="p-2 space-y-1">
                {apps.map((app) => (
                    <a 
                        key={app.name}
                        href={app.url}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                        <div className={`p-2.5 rounded-xl border ${app.bg} ${app.border} ${app.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                            <app.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col pt-0.5">
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                                {app.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {app.description}
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
      )}
    </div>
  )
}
