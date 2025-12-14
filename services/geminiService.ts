

import { GoogleGenAI, Type } from "@google/genai";
import { Connection, ProductInstance, ProductTemplate, CONNECTOR_LABELS, ExternalPart } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeSchematic = async (
  instances: ProductInstance[],
  connections: Connection[],
  templates: ProductTemplate[]
) => {
  if (!apiKey) {
    return {
      summary: "API Key eksik. Lütfen ortam değişkenlerini kontrol edin.",
      warnings: ["AI analizi devre dışı."]
    };
  }

  // Prepare data context for the model
  const systemData = {
    devices: instances.map(inst => {
      const t = templates.find(t => t.id === inst.templateId);
      return {
        instanceId: inst.id,
        name: t?.name || "Unknown Device",
        position: { x: inst.x, y: inst.y }
      };
    }),
    cabling: connections.map(conn => {
      const fromInst = instances.find(i => i.id === conn.fromInstanceId);
      const toInst = instances.find(i => i.id === conn.toInstanceId);
      const fromTemplate = templates.find(t => t.id === fromInst?.templateId);
      const toTemplate = templates.find(t => t.id === toInst?.templateId);
      
      const fromPort = fromTemplate?.ports.find(p => p.id === conn.fromPortId);
      const toPort = toTemplate?.ports.find(p => p.id === conn.toPortId);

      return {
        cableLabel: conn.label || "No Label",
        cableColor: conn.color || "Default",
        fromDevice: fromTemplate?.name,
        fromPort: fromPort?.label,
        fromPortType: fromPort?.type,
        fromPortPower: fromPort?.isPower ? {
            type: fromPort.powerType,
            voltage: fromPort.voltage,
            amps: fromPort.amperage
        } : null,
        fromConnector: fromPort?.connectorType ? CONNECTOR_LABELS[fromPort.connectorType] : "Generic",
        
        toDevice: toTemplate?.name,
        toPort: toPort?.label,
        toPortType: toPort?.type,
        toPortPower: toPort?.isPower ? {
            type: toPort.powerType,
            voltage: toPort.voltage,
            amps: toPort.amperage
        } : null,
        toConnector: toPort?.connectorType ? CONNECTOR_LABELS[toPort.connectorType] : "Generic"
      };
    })
  };

  const prompt = `
    Sen uzman bir teknik çizim, otomasyon ve elektrik mühendisisin. 
    Aşağıda JSON formatında bir sistemin cihazları ve kablo bağlantıları verilmiştir.
    
    Özellikle şunlara dikkat et:
    1. Fiziksel Konnektör Uyumluluğu: Örneğin 4 pinli kablo 2 pinli sokete takılamaz.
    2. Elektriksel Güç Uyumluluğu (Çok Önemli):
       - Voltaj uyumsuzlukları: Örn. 24V kaynağa 12V cihaz bağlanmış mı?
       - Güç Tipi uyumsuzlukları: Örn. AC kaynağa DC cihaz bağlanmış mı?
    3. Kablo Etiketleri: Etiket, bağlandığı portun amacına uygun mu?
    
    Veri: ${JSON.stringify(systemData, null, 2)}

    Lütfen bu sistemi analiz et ve aşağıdaki JSON şemasında bir çıktı üret:
    1. Sistemin ne yaptığına dair kısa bir teknik özet (summary).
    2. Olası bağlantı hataları (giriş-giriş çakışması, voltaj hatası vb.) listesi (warnings).
    
    Yanıtın dili Türkçe olmalıdır.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            warnings: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Boş yanıt alındı.");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini analiz hatası:", error);
    return {
      summary: "Analiz sırasında bir hata oluştu.",
      warnings: ["Lütfen bağlantılarınızı kontrol edip tekrar deneyin."]
    };
  }
};

export const extractPartListFromImage = async (imageData: string): Promise<ExternalPart[]> => {
    if (!apiKey) {
        console.error("API Key missing");
        return [];
    }

    // Remove header if present (data:image/png;base64,...)
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const prompt = `
      Görüntüdeki teknik resim parça listesini (Bill of Materials / BOM) analiz et.
      Tablo yapısını tanı ve satırları çıkar.
      Genellikle şu sütunlar olur: "No", "Parça Adı/Description", "Adet/Qty".
      
      Çıktı olarak bir JSON nesnesi döndür:
      {
        "parts": [
          { "name": "Parça ismi", "count": 1 }
        ]
      }
      
      Eğer miktar (count) belirtilmemişse varsayılan olarak 1 kabul et.
      Sadece tablo içindeki verileri al. Başlıkları alma.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        parts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    count: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        const result = JSON.parse(text);
        
        // Map to internal structure with IDs
        return (result.parts || []).map((p: any) => ({
            id: crypto.randomUUID(),
            name: p.name,
            count: Number(p.count) || 1
        }));

    } catch (error) {
        console.error("BOM Extraction error:", error);
        throw error;
    }
};