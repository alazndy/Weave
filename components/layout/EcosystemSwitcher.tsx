
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
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
        title="Switch App"
      >
        <Boxes className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl">
            <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase font-bold tracking-wider bg-black/20">
                Ecosystem Apps
            </div>
            <div className="p-1">
                {apps.map((app) => (
                    <a 
                        key={app.name}
                        href={app.url}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <div className={`p-2 rounded-lg border ${app.bg} ${app.border} ${app.color} group-hover:scale-105 transition-transform`}>
                            <app.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-100 group-hover:text-white">
                                {app.name}
                            </span>
                            <span className="text-[10px] text-zinc-500">
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
