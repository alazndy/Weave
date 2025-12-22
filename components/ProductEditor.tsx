import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { PortDefinition, ProductTemplate, ConnectorType, CONNECTOR_LABELS, PortFlowType, ExternalPart } from '../types';
import { X, Edit2, Crosshair, Plus, Zap, Trash2, ArrowRight, ArrowLeft, ArrowRightLeft, Cable, ArrowDownToLine, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Save, Undo2, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { extractPartListFromImage } from '../services/geminiService';
import { EditorSidebar } from './editor/EditorSidebar';

// Set worker for PDF.js - Ensure this URL is valid or hosted locally if possible, but for now using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

interface ProductEditorProps {
  initialTemplate?: ProductTemplate | null; 
  onSave: (template: ProductTemplate) => void;
  onExtractParts: (parts: ExternalPart[]) => void;
  onCancel: () => void;
  pixelScale?: number; 
}

type EditorMode = 'upload' | 'preprocess' | 'ports';
type ToolType = 'select' | 'eraser' | 'scan' | 'measure';

export const ProductEditor: React.FC<ProductEditorProps> = ({ initialTemplate, onSave, onExtractParts, onCancel, pixelScale = 2 }) => {
  const [mode, setMode] = useState<EditorMode>('upload');
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [description, setDescription] = useState('');
  
  const [visualWidth, setVisualWidth] = useState(200); 
  const [physicalWidth, setPhysicalWidth] = useState(100); 

  const [rawImage, setRawImage] = useState<string | null>(null); 
  const [processedImage, setProcessedImage] = useState<string | null>(null); 
  
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [ports, setPorts] = useState<PortDefinition[]>([]);
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);

  const [tempPortLabel, setTempPortLabel] = useState('Port 1');
  const [tempPortType, setTempPortType] = useState<PortFlowType>('bidirectional');
  const [tempConnectorType, setTempConnectorType] = useState<ConnectorType>('generic');
  const [tempDirection, setTempDirection] = useState<'top'|'bottom'|'left'|'right'>('bottom'); 
  const [tempIsPower, setTempIsPower] = useState(false);
  const [tempIsGround, setTempIsGround] = useState(false); 
  const [tempPowerType, setTempPowerType] = useState<'AC' | 'DC'>('DC');
  const [tempVoltage, setTempVoltage] = useState('');
  const [tempAmperage, setTempAmperage] = useState('');
  const [tempCustomColor, setTempCustomColor] = useState(''); 
  
  const imageRef = useRef<HTMLImageElement>(null);

  // --- PREPROCESS STATE ---
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const overlayRef = useRef<HTMLCanvasElement>(null); 
  const loadedImageRef = useRef<HTMLImageElement | null>(null); 
  const [tool, setTool] = useState<ToolType>('select');
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  
  const [eraserSize, setEraserSize] = useState(20);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  
  const [measurementLine, setMeasurementLine] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null);
  const [showMeasureInput, setShowMeasureInput] = useState(false);
  const [measuredLengthMm, setMeasuredLengthMm] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scannedParts, setScannedParts] = useState<ExternalPart[] | null>(null);

  // --- INITIALIZATION FOR EDITING ---
  useEffect(() => {
    if (initialTemplate) {
        setName(initialTemplate.name);
        setModelNumber(initialTemplate.modelNumber || '');
        setDescription(initialTemplate.description || '');
        setProcessedImage(initialTemplate.imageUrl);
        setPorts(initialTemplate.ports);
        
        if (initialTemplate.physicalWidth) {
            setPhysicalWidth(initialTemplate.physicalWidth);
            setVisualWidth(Math.round(initialTemplate.physicalWidth * pixelScale));
        } else {
            setVisualWidth(initialTemplate.width);
            setPhysicalWidth(parseFloat((initialTemplate.width / pixelScale).toFixed(1)));
        }
        
        // Only skip to ports if we actually have an image
        if (initialTemplate.imageUrl) {
            setMode('ports');
        } else {
            setMode('upload');
        }
    }
  }, [initialTemplate, pixelScale]);

  useEffect(() => {
      if (mode === 'ports' && processedImage && !initialTemplate) {
          if (physicalWidth === 100) { 
             const initPx = 200;
             setVisualWidth(initPx);
             setPhysicalWidth(parseFloat((initPx / pixelScale).toFixed(1)));
          } else {
              setVisualWidth(Math.round(physicalWidth * pixelScale));
          }
      }
  }, [mode, processedImage, pixelScale, initialTemplate]);

  const handlePhysicalWidthChange = (valStr: string) => {
      const val = parseFloat(valStr);
      setPhysicalWidth(val);
      if (!isNaN(val)) {
          setVisualWidth(Math.round(val * pixelScale));
      }
  };

  const handleVisualWidthChange = (valStr: string) => {
      const val = parseFloat(valStr);
      setVisualWidth(val);
      if (!isNaN(val) && pixelScale > 0) {
          setPhysicalWidth(parseFloat((val / pixelScale).toFixed(1)));
      }
  };

  const addToHistory = (imageData: string) => {
      const newHistory = editHistory.slice(0, historyStep + 1);
      newHistory.push(imageData);
      setEditHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (historyStep > 0) {
          const prevIndex = historyStep - 1;
          setHistoryStep(prevIndex);
          setRawImage(editHistory[prevIndex]);
      }
  };

  const handleRedo = () => {
      if (historyStep < editHistory.length - 1) {
          const nextIndex = historyStep + 1;
          setHistoryStep(nextIndex);
          setRawImage(editHistory[nextIndex]);
      }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (mode !== 'preprocess') return;
          
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT') return;

          if (e.ctrlKey || e.metaKey) {
              if (e.key.toLowerCase() === 'z') {
                  e.preventDefault();
                  e.stopPropagation(); 
                  if (e.shiftKey) {
                      handleRedo();
                  } else {
                      handleUndo();
                  }
              } else if (e.key.toLowerCase() === 'y') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRedo();
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, historyStep, editHistory]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); 
        
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          await page.render({ canvasContext: context, viewport: viewport } as any).promise;
          const dataUrl = canvas.toDataURL('image/png');
          setRawImage(dataUrl);
          setEditHistory([dataUrl]);
          setHistoryStep(0);
          setMode('preprocess');
        }
      } catch (err) {
        console.error("PDF Error", err);
        alert("PDF işlenirken hata oluştu.");
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setRawImage(dataUrl);
        setEditHistory([dataUrl]);
        setHistoryStep(0);
        setMode('preprocess');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (mode === 'preprocess' && rawImage) {
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        
        if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, img.width, img.height);
                ctx.drawImage(img, 0, 0);
            }
        }

        if (overlayRef.current) {
            overlayRef.current.width = img.width;
            overlayRef.current.height = img.height;
        }

        renderOverlay();
      };
      img.src = rawImage;
    }
  }, [mode, rawImage]);

  const renderOverlay = () => {
    if (!overlayRef.current) return;
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if ((tool === 'select' || tool === 'scan') && selection) {
        ctx.strokeStyle = '#14b8a6'; 
        ctx.lineWidth = 2 / (canvas.width / canvas.offsetWidth || 1); 
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
        
        ctx.fillStyle = 'rgba(20, 184, 166, 0.2)';
        ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
        ctx.setLineDash([]);
    }

    if (tool === 'measure' && measurementLine) {
        ctx.strokeStyle = '#f97316'; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(measurementLine.start.x, measurementLine.start.y);
        ctx.lineTo(measurementLine.end.x, measurementLine.end.y);
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(measurementLine.start.x, measurementLine.start.y, 4, 0, Math.PI*2);
        ctx.arc(measurementLine.end.x, measurementLine.end.y, 4, 0, Math.PI*2);
        ctx.fill();
    }

    if (tool === 'eraser' && mousePos && !isDragging) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, eraserSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
  };

  useEffect(() => {
      renderOverlay();
  }, [selection, measurementLine, tool, isDragging, mousePos, eraserSize]);

  const rotateImage = (degrees: number) => {
    if (!loadedImageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = loadedImageRef.current;

    canvas.width = img.height;
    canvas.height = img.width;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    const newDataUrl = canvas.toDataURL();
    setRawImage(newDataUrl);
    addToHistory(newDataUrl); 
    setSelection(null);
    setMeasurementLine(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current; 
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setStartPos({ x, y });

    if (tool === 'select' || tool === 'scan') {
        setSelection({ x, y, w: 0, h: 0 });
    } else if (tool === 'measure') {
        setMeasurementLine({ start: {x, y}, end: {x, y} });
        setShowMeasureInput(false);
    } else if (tool === 'eraser') {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x, y, eraserSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayRef.current) return;
    const canvas = overlayRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    setMousePos({ x: currentX, y: currentY });

    if (!isDragging || !startPos) return;

    if (tool === 'select' || tool === 'scan') {
        setSelection({
            x: Math.min(startPos.x, currentX),
            y: Math.min(startPos.y, currentY),
            w: Math.abs(currentX - startPos.x),
            h: Math.abs(currentY - startPos.y)
        });
    } else if (tool === 'measure') {
        setMeasurementLine(prev => prev ? { ...prev, end: { x: currentX, y: currentY } } : null);
    } else if (tool === 'eraser') {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(currentX, currentY, eraserSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    
    if (tool === 'eraser' && canvasRef.current) {
        const newDataUrl = canvasRef.current.toDataURL();
        setRawImage(newDataUrl);
        addToHistory(newDataUrl); 
        
        const newImg = new Image();
        newImg.onload = () => {
            loadedImageRef.current = newImg;
        };
        newImg.src = newDataUrl;

    } else if (tool === 'measure' && measurementLine) {
        const dx = measurementLine.end.x - measurementLine.start.x;
        const dy = measurementLine.end.y - measurementLine.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            setShowMeasureInput(true);
        } else {
            setMeasurementLine(null);
        }
    }
  };
  
  const handleCanvasMouseLeave = () => {
      handleCanvasMouseUp();
      setMousePos(null);
  }

  const applyCalibration = () => {
      if (!measurementLine || !overlayRef.current || !measuredLengthMm) return;
      
      const mm = parseFloat(measuredLengthMm);
      if (isNaN(mm) || mm <= 0) return;

      const dx = measurementLine.end.x - measurementLine.start.x;
      const dy = measurementLine.end.y - measurementLine.start.y;
      const pxDistance = Math.sqrt(dx * dx + dy * dy);

      const totalImageWidthPx = overlayRef.current.width;
      const calculatedPhysicalWidth = (totalImageWidthPx * mm) / pxDistance;

      setPhysicalWidth(parseFloat(calculatedPhysicalWidth.toFixed(1)));
      
      setMeasurementLine(null);
      setShowMeasureInput(false);
      setMeasuredLengthMm('');
      setTool('select'); 
      alert(`Kalibrasyon tamamlandı. Ürün genişliği: ${calculatedPhysicalWidth.toFixed(1)} mm olarak ayarlandı.`);
  };

  const applyCrop = () => {
      if (!selection || !loadedImageRef.current || selection.w < 10 || selection.h < 10) return;
      
      const tempCanvas = document.createElement('canvas');
      const img = loadedImageRef.current;
      
      tempCanvas.width = selection.w;
      tempCanvas.height = selection.h;
      
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);
      
      const newDataUrl = tempCanvas.toDataURL();
      setRawImage(newDataUrl);
      addToHistory(newDataUrl); 
      setSelection(null);
  };
  
  const performScan = async () => {
      if (!selection || !loadedImageRef.current || selection.w < 10 || selection.h < 10) return;
      setIsScanning(true);
      setScannedParts(null);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = selection.w;
      tempCanvas.height = selection.h;
      const ctx = tempCanvas.getContext('2d');
      const img = loadedImageRef.current;

      if (ctx) {
          ctx.drawImage(img, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);
          const imageBase64 = tempCanvas.toDataURL('image/png');
          try {
              const parts = await extractPartListFromImage(imageBase64);
              setScannedParts(parts);
          } catch (e) {
              alert("Tarama başarısız oldu.");
          }
      }
      setIsScanning(false);
  };
  
  const confirmScannedParts = () => {
      if(scannedParts) {
          onExtractParts(scannedParts);
          setScannedParts(null);
          setSelection(null);
          alert(`${scannedParts.length} parça proje listesine eklendi.`);
      }
  }

  const finishPreprocessing = () => {
      if (loadedImageRef.current) {
          const tempCanvas = document.createElement('canvas');
          const img = loadedImageRef.current;
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0);
              setProcessedImage(tempCanvas.toDataURL());
              setMode('ports');
          }
      } else if (canvasRef.current) {
          setProcessedImage(canvasRef.current.toDataURL());
          setMode('ports');
      }
  };

  const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    if (editingPortId) {
      setEditingPortId(null);
      const num = ports.length + 1;
      setTempPortLabel(`Port ${num}`);
      setTempIsPower(false);
      setTempIsGround(false);
      setTempVoltage('');
      setTempAmperage('');
      setTempCustomColor('');
      setTempDirection('bottom');
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPort: PortDefinition = {
      id: crypto.randomUUID(),
      label: tempPortLabel,
      type: tempPortType,
      connectorType: tempConnectorType,
      direction: tempDirection,
      isPower: tempIsPower,
      isGround: tempIsGround,
      powerType: tempIsPower ? tempPowerType : undefined,
      voltage: tempIsPower ? tempVoltage : undefined,
      amperage: tempIsPower ? tempAmperage : undefined,
      customColor: tempCustomColor || undefined,
      x,
      y
    };

    setPorts([...ports, newPort]);
    
    const num = parseInt(tempPortLabel.replace(/\D/g, '')) || 0;
    setTempPortLabel(`Port ${num + 1}`);
  };

  const startEditingPort = (port: PortDefinition) => {
    setEditingPortId(port.id);
    setTempPortLabel(port.label);
    setTempPortType(port.type);
    setTempConnectorType(port.connectorType);
    setTempDirection(port.direction || 'bottom');
    setTempIsPower(port.isPower || false);
    setTempIsGround(port.isGround || false);
    setTempPowerType(port.powerType || 'DC');
    setTempVoltage(port.voltage || '');
    setTempAmperage(port.amperage || '');
    setTempCustomColor(port.customColor || '');
  };

  const updatePort = () => {
    if (!editingPortId) return;

    setPorts(ports.map(p => {
      if (p.id === editingPortId) {
        return {
          ...p,
          label: tempPortLabel,
          type: tempPortType,
          connectorType: tempConnectorType,
          direction: tempDirection,
          isPower: tempIsPower,
          isGround: tempIsGround,
          powerType: tempIsPower ? tempPowerType : undefined,
          voltage: tempIsPower ? tempVoltage : undefined,
          amperage: tempIsPower ? tempAmperage : undefined,
          customColor: tempCustomColor || undefined
        };
      }
      return p;
    }));

    setEditingPortId(null);
    const num = ports.length + 1;
    setTempPortLabel(`Port ${num}`);
    setTempIsPower(false);
    setTempIsGround(false);
    setTempVoltage('');
    setTempAmperage('');
    setTempCustomColor('');
    setTempDirection('bottom');
  };

  const cancelEditing = () => {
    setEditingPortId(null);
    const num = ports.length + 1;
    setTempPortLabel(`Port ${num}`);
    setTempIsPower(false);
    setTempIsGround(false);
    setTempVoltage('');
    setTempAmperage('');
    setTempCustomColor('');
    setTempDirection('bottom');
  };

  const removePort = (id: string) => {
    setPorts(ports.filter(p => p.id !== id));
    if (editingPortId === id) {
      cancelEditing();
    }
  };

  const handleAutoGenerateModel = () => {
      const n = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'GEN';
      const d = description.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DSC';
      const r = Math.floor(100 + Math.random() * 900); 
      setModelNumber(`${n}-${d}-${r}`);
  };

  const handleSave = () => {
    if (!name || !processedImage) return;
    
    let width = visualWidth;
    let height = visualWidth;

    if (imageRef.current) {
       const aspect = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
       height = width / aspect;
    }

    const newTemplate: ProductTemplate = {
      ...(initialTemplate || {}), // Preserve existing properties like envInventoryId
      id: initialTemplate ? initialTemplate.id : crypto.randomUUID(),
      name,
      modelNumber,
      description,
      imageUrl: processedImage,
      width,
      height,
      physicalWidth: physicalWidth,
      ports
    };
    onSave(newTemplate);
  };

  const getConnectorShapeClass = (type: ConnectorType) => {
    if (type.includes('select')) return 'rounded-sm rotate-45';
    if (type.includes('4-pin') || type.includes('sensor') || type.includes('mdr')) return 'rounded-sm';
    return 'rounded-full';
  };
  
  const getDirectionIcon = (dir?: string) => {
      switch(dir) {
          case 'top': return <ChevronUp size={12} className="text-white drop-shadow-md" />;
          case 'bottom': return <ChevronDown size={12} className="text-white drop-shadow-md" />;
          case 'left': return <ChevronLeft size={12} className="text-white drop-shadow-md" />;
          case 'right': return <ChevronRight size={12} className="text-white drop-shadow-md" />;
          default: return null;
      }
  };

  const modalSizeClass = mode === 'upload' 
    ? 'w-full max-w-4xl h-[600px]' 
    : 'w-auto h-auto max-w-[98vw] max-h-[98vh] min-w-[1200px] h-[90vh]'; 

  const getTypeBadge = (type: PortFlowType) => {
      switch(type) {
          case 'input': return <span className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-[10px] font-bold rounded flex items-center gap-1"><ArrowRight size={10}/> GİRİŞ</span>;
          case 'output': return <span className="px-1.5 py-0.5 bg-red-900 text-red-200 text-[10px] font-bold rounded flex items-center gap-1"><ArrowLeft size={10}/> ÇIKIŞ</span>;
          case 'bidirectional': return <span className="px-1.5 py-0.5 bg-teal-900 text-teal-200 text-[10px] font-bold rounded flex items-center gap-1"><ArrowRightLeft size={10}/> ÇİFT</span>;
      }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`glass-panel rounded-3xl flex flex-col shadow-2xl overflow-hidden relative transition-all duration-300 border border-white/20 ${modalSizeClass}`}>
        
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.03] backdrop-blur-3xl shrink-0">
          <h2 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3 drop-shadow-sm">
            {initialTemplate ? <Edit2 className="w-7 h-7 text-teal-400"/> : <Plus className="w-7 h-7 text-teal-400" />} 
            {mode === 'upload' ? 'Görsel Yükleme' : mode === 'preprocess' ? 'Ön İşleme & Kalibrasyon' : initialTemplate ? 'Ürün Düzenle' : 'Port Tanımlama'}
          </h2>
          <div className="flex items-center gap-4">
               {mode === 'ports' && (
                  <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95"
                  >
                  <Save size={18} />
                  Kaydet
                  </button>
              )}
            <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors" title="Kapat" aria-label="Kapat">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <EditorSidebar 
              mode={mode}
              name={name} setName={setName}
              description={description} setDescription={setDescription}
              modelNumber={modelNumber} setModelNumber={setModelNumber}
              handleAutoGenerateModel={handleAutoGenerateModel}
              visualWidth={visualWidth} handleVisualWidthChange={handleVisualWidthChange}
              physicalWidth={physicalWidth} handlePhysicalWidthChange={handlePhysicalWidthChange}
              pixelScale={pixelScale}
              handleFileChange={handleFileChange}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              historyStep={historyStep}
              editHistoryLength={editHistory.length}
              rotateImage={rotateImage}
              tool={tool} setTool={setTool}
              eraserSize={eraserSize} setEraserSize={setEraserSize}
              showMeasureInput={showMeasureInput}
              measuredLengthMm={measuredLengthMm} setMeasuredLengthMm={setMeasuredLengthMm}
              applyCalibration={applyCalibration}
              selection={selection}
              applyCrop={applyCrop}
              isScanning={isScanning}
              performScan={performScan}
              scannedParts={scannedParts}
              confirmScannedParts={confirmScannedParts}
              finishPreprocessing={finishPreprocessing}
              setMode={setMode}
              setRawImage={setRawImage}
              initialTemplate={initialTemplate}
          />

          {/* Right: Interactive Area */}
          <div className="flex-1 bg-black/40 relative overflow-hidden flex items-center justify-center p-8">
             <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-[0.03]"></div>
             
             {mode === 'upload' && (
                 <div className="text-zinc-500 flex flex-col items-center pointer-events-none text-center max-w-md">
                     <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                         <Upload className="w-10 h-10 opacity-30"/>
                     </div>
                     <p className="text-xl font-bold text-white mb-2">Başlamak için Bir Resim Yükleyin</p>
                     <p className="text-sm font-medium">Sol menüyü kullanarak cihazınızdan bir resim veya PDF dosyası seçin.</p>
                 </div>
             )}

             {mode === 'preprocess' && rawImage && (
                 <div className="relative shadow-2xl border border-white/10 rounded-lg overflow-hidden ring-1 ring-white/5 backdrop-blur-sm">
                     {/* Layer 1: Base Image */}
                     <canvas 
                        ref={canvasRef}
                        className="block max-h-[calc(85vh-80px)] max-w-[calc(90vw-26rem)] object-contain bg-zinc-900"
                     />
                     {/* Layer 2: UI Overlay (Tools) */}
                     <canvas
                        ref={overlayRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseLeave}
                        className={`absolute top-0 left-0 w-full h-full object-contain ${tool === 'eraser' ? 'cursor-none' : tool === 'measure' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
                     />
                 </div>
             )}

             {mode === 'ports' && processedImage && (
              <div className="relative shadow-2xl animate-in zoom-in-95 duration-500 group/image border border-white/10 rounded-xl overflow-hidden ring-4 ring-black/20">
                <img 
                  ref={imageRef}
                  src={processedImage} 
                  alt="Work area"
                  onClick={handleImageClick}
                  className="max-h-[calc(85vh-80px)] max-w-[calc(90vw-26rem)] object-contain bg-white block cursor-crosshair"
                  draggable={false}
                />
                {ports.map(p => (
                  <div 
                    key={p.id}
                    onClick={(e) => { e.stopPropagation(); startEditingPort(p); }}
                    onMouseEnter={() => setHoveredPortId(p.id)}
                    onMouseLeave={() => setHoveredPortId(null)}
                    className={`absolute w-6 h-6 shadow-[0_4px_10px_rgba(0,0,0,0.3)] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex items-center justify-center transition-all duration-300 ${getConnectorShapeClass(p.connectorType)} ${
                      editingPortId === p.id 
                        ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 scale-125 z-50' 
                        : hoveredPortId === p.id
                            ? 'scale-125 z-40 border-2 border-white ring-4 ring-white/20'
                            : 'border-2 border-white/80 hover:scale-110'
                    }`}
                    style={{ 
                      left: `${p.x}%`, 
                      top: `${p.y}%`,
                      backgroundColor: p.customColor ? p.customColor : (p.isGround ? '#52525b' : (p.type === 'input' ? '#3b82f6' : p.type === 'output' ? '#ef4444' : '#14b8a6'))
                    }}
                    title={p.label}
                  >
                    <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-inner"></div>
                    
                    <div className="absolute pointer-events-none opacity-100 drop-shadow-md">
                         {getDirectionIcon(p.direction)}
                    </div>
                    
                    {p.isPower && (
                        <div className={`absolute -top-3 -right-3 rounded-full p-1 shadow-lg z-30 border border-white/20 scale-75 ${p.isGround ? 'bg-zinc-800 text-white' : 'bg-amber-400 text-black'}`}>
                             {p.isGround ? <ArrowDownToLine size={12}/> : <Zap size={12} fill="currentColor" />}
                        </div>
                    )}
                    
                    {/* Tooltip on Hover */}
                    <div className={`absolute left-1/2 -translate-x-1/2 -bottom-8 bg-black/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/port:opacity-100 pointer-events-none transition-opacity font-bold border border-white/10 ${hoveredPortId === p.id ? 'opacity-100' : ''}`}>
                        {p.label}
                    </div>
                  </div>
                ))}
            
            {/* Context Menu for Port Editing */}
            {editingPortId && (
                <div 
                    className="absolute z-50 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: `${Math.min(80, Math.max(20, ports.find(p => p.id === editingPortId)?.x || 50))}%`,
                        top: `${Math.min(80, Math.max(20, ports.find(p => p.id === editingPortId)?.y || 50))}%`,
                        transform: 'translate(-50%, 10px)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <h4 className="font-bold text-white text-sm">Port Düzenle</h4>
                        <button onClick={cancelEditing} className="text-zinc-500 hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Etiket</label>
                            <input 
                                type="text" 
                                value={tempPortLabel} 
                                onChange={e => setTempPortLabel(e.target.value)} 
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:border-amber-500 outline-none font-medium"
                                autoFocus
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Tip</label>
                                <select 
                                    value={tempPortType} 
                                    onChange={e => setTempPortType(e.target.value as any)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                                >
                                    <option value="input">Giriş</option>
                                    <option value="output">Çıkış</option>
                                    <option value="bidirectional">Çift Yönlü</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Yön</label>
                                <select 
                                    value={tempDirection} 
                                    onChange={e => setTempDirection(e.target.value as any)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                                >
                                    <option value="bottom">Aşağı</option>
                                    <option value="top">Yukarı</option>
                                    <option value="left">Sola</option>
                                    <option value="right">Sağa</option>
                                </select>
                             </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                             <label className={`flex-1 p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-2 ${tempIsPower ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 font-bold' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}>
                                 <input type="checkbox" checked={tempIsPower} onChange={e => setTempIsPower(e.target.checked)} className="hidden" />
                                 <Zap size={14} fill={tempIsPower ? "currentColor" : "none"}/> Güç
                             </label>
                             <label className={`flex-1 p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-2 ${tempIsGround ? 'bg-zinc-600/30 border-zinc-500 text-zinc-300 font-bold' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}>
                                 <input type="checkbox" checked={tempIsGround} onChange={e => setTempIsGround(e.target.checked)} className="hidden" />
                                 <ArrowDownToLine size={14}/> Toprak
                             </label>
                        </div>
                        
                        {tempIsPower && !tempIsGround && (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                                <input 
                                    type="text" 
                                    placeholder="Voltaj (5V)" 
                                    value={tempVoltage} 
                                    onChange={e => setTempVoltage(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Akım (2A)" 
                                    value={tempAmperage} 
                                    onChange={e => setTempAmperage(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                                />
                            </div>
                        )}

                        <div className="flex gap-2 mt-4 pt-2 border-t border-white/10">
                            <button onClick={updatePort} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-amber-500/20">
                                Kaydet
                            </button>
                            <button onClick={() => removePort(editingPortId!)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};