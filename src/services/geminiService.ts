import { cablePairs } from '../utils/junctions';
import i18n, { appLanguage } from '../i18n';


import { GoogleGenAI, Type } from "@google/genai";
import { Connection, ProductInstance, ProductTemplate, CONNECTOR_LABELS, ExternalPart, Junction } from "../types";

// The key is supplied by the user at runtime (App Settings) and never bundled
// into the build, where it would be readable by anyone with the app.
const MODEL = "gemini-2.5-flash";
export const missingKeyMessage = () => i18n.t('ai.missingKey');

const clientCache = new Map<string, GoogleGenAI>();
const getClient = (apiKey: string) => {
  let client = clientCache.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, client);
  }
  return client;
};

export const analyzeSchematic = async (
  apiKey: string | undefined,
  instances: ProductInstance[],
  connections: Connection[],
  templates: ProductTemplate[],
  junctions: Junction[] = []
) => {
  if (!apiKey) {
    return {
      summary: missingKeyMessage(),
      warnings: [i18n.t('ai.disabled')]
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
    cabling: cablePairs(connections, new Set(junctions.map(j => j.id))).map(pair => {
      const conn = connections.find(c => c.id === pair.id);
      const fromInst = instances.find(i => i.id === pair.from.instanceId);
      const toInst = instances.find(i => i.id === pair.to.instanceId);
      const fromTemplate = templates.find(t => t.id === fromInst?.templateId);
      const toTemplate = templates.find(t => t.id === toInst?.templateId);
      
      const fromPort = fromTemplate?.ports.find(p => p.id === pair.from.portId);
      const toPort = toTemplate?.ports.find(p => p.id === pair.to.portId);

      return {
        cableLabel: pair.label || "No Label",
        viaJunction: pair.via,
        cableColor: conn?.color || "Default",
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
    You are an expert technical drawing, automation and electrical engineer.
    Below are the devices and cable connections of a system, as JSON.

    Pay special attention to:
    1. Physical connector compatibility: for example, a 4-pin cable does not fit a 2-pin socket.
    2. Electrical power compatibility (very important):
       - Voltage mismatches: for example, a 12V device on a 24V source.
       - Power type mismatches: for example, a DC device on an AC source.
    3. Cable labels: does each label match the purpose of the port it connects to?

    Data: ${JSON.stringify(systemData, null, 2)}

    Analyse this system and answer with the given JSON schema:
    1. A short technical summary of what the system does (summary).
    2. A list of possible connection errors, such as input-to-input or wrong voltage (warnings).

    Write the answer in ${appLanguage() === 'en' ? 'English' : 'Turkish'}.
  `;

  try {
    const response = await getClient(apiKey).models.generateContent({
      model: MODEL,
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
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      summary: i18n.t('ai.failed'),
      warnings: [i18n.t('ai.retry')]
    };
  }
};

export const extractPartListFromImage = async (apiKey: string | undefined, imageData: string): Promise<ExternalPart[]> => {
    if (!apiKey) throw new Error(missingKeyMessage());

    // Remove header if present (data:image/png;base64,...)
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const prompt = `
      Analyse the parts list (Bill of Materials / BOM) of the technical drawing in the picture.
      Recognise the table structure and read its rows.
      Typical columns are "No", "Description" and "Qty"; they can be in any language.

      Return a JSON object:
      {
        "parts": [
          { "name": "Part name", "count": 1 }
        ]
      }

      Keep part names exactly as written. If a quantity is missing, use 1.
      Read only the rows of the table, not its headings.
    `;

    try {
        const response = await getClient(apiKey).models.generateContent({
            model: MODEL,
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
        return (result.parts || []).map((p: { name: string; count: unknown }) => ({
            id: crypto.randomUUID(),
            name: p.name,
            count: Number(p.count) || 1
        }));

    } catch (error) {
        console.error("BOM Extraction error:", error);
        throw error;
    }
};
