import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, existsSync, unlinkSync, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { extname, join } from 'path';
import type { OutputSize } from './db';

// Model configuration - Default to Gemini 3.1 Flash image generation (Nano Banana)
const DEFAULT_MODEL = 'gemini-3.1-flash-image';

let client: GoogleGenAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return apiKey;
}

export function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = getApiKey();
    const baseUrl = process.env.GEMINI_BASE_URL;
    const options: any = { apiKey };
    
    if (baseUrl) {
      options.httpOptions = { baseUrl };
      
      // Auto-detect if user's baseUrl already contains /v1 or /v1beta to prevent double path injection
      // e.g. https://proxy.com/v1beta + /v1beta = 404
      if (baseUrl.includes('/v1')) {
        options.httpOptions.apiVersion = '';
      }
    }
    
    client = new GoogleGenAI(options);
  }
  return client;
}

export function resetClient(): void {
  client = null;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Read image file and convert to base64
 */
export function readImageAsBase64(filePath: string): string {
  const buffer = readFileSync(filePath);
  return buffer.toString('base64');
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';



// Types for file info
interface FileInfo {
  id: string;
  path: string;
  originalName?: string;
}

/**
 * Generate a text-to-image request
 */
export async function generateTextToImage(
  prompt: string,
  outputSize: OutputSize,
  aspectRatio: AspectRatio,
  temperature: number
): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    contents: prompt,
    config: {
      temperature,
      responseModalities: ['IMAGE'],
      // @ts-ignore - explicitly passing imageConfig to the proxy
      imageConfig: {
        imageSize: outputSize,
        aspectRatio,
      },
    } as any,
  });

  const parts = response?.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image generated in response');
  }
  return imagePart.inlineData.data;
}

/**
 * Generate an image-to-image transformation request
 */
export async function generateImageToImage(
  imagePath: string,
  prompt: string,
  outputSize: OutputSize,
  aspectRatio: AspectRatio = '1:1',
  temperature: number = 1
): Promise<string> {
  const ai = getClient();
  
  if (!existsSync(imagePath)) {
    throw new Error(`missing file: ${imagePath}`);
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: readImageAsBase64(imagePath),
              mimeType: getMimeType(imagePath),
            },
          },
        ],
      },
    ] as any,
    config: {
      temperature,
      responseModalities: ['IMAGE'],
      // @ts-ignore
      imageConfig: {
        imageSize: outputSize,
        aspectRatio,
      },
    } as any,
  });

  const parts = response?.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image generated in response. Full response: ${JSON.stringify(response)}`);
  }
  return imagePart.inlineData.data;
}
