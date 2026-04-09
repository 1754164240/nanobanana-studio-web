import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

function parseEnvFile(): Record<string, string> {
  try {
    if (!fs.existsSync(ENV_PATH)) {
      return {};
    }
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const env: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    return env;
  } catch {
    return {};
  }
}

function writeEnvFile(env: Record<string, string>): void {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(ENV_PATH, content + '\n');
}

// GET - Check if API key exists (returns masked version)
export async function GET() {
  const env = parseEnvFile();
  const apiKey = env.GEMINI_API_KEY || '';
  const baseUrl = env.GEMINI_BASE_URL || '';
  const model = env.GEMINI_MODEL || '';

  if (apiKey) {
    // Return masked version
    const masked = apiKey.slice(0, 4) + '...' + apiKey.slice(-4);
    return NextResponse.json({ hasKey: true, masked, baseUrl, model });
  }

  return NextResponse.json({ hasKey: false, masked: null, baseUrl, model });
}

export async function POST(request: Request) {
  try {
    const { apiKey, baseUrl, model } = await request.json();

    if (apiKey !== undefined && typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }

    if (baseUrl !== undefined && typeof baseUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid Base URL' }, { status: 400 });
    }

    if (model !== undefined && typeof model !== 'string') {
      return NextResponse.json({ error: 'Invalid Model' }, { status: 400 });
    }

    const env = parseEnvFile();
    
    if (apiKey !== undefined) {
      env.GEMINI_API_KEY = apiKey;
      process.env.GEMINI_API_KEY = apiKey;
    }
    
    if (baseUrl !== undefined) {
      if (baseUrl.trim() === '') {
        delete env.GEMINI_BASE_URL;
        delete process.env.GEMINI_BASE_URL;
      } else {
        env.GEMINI_BASE_URL = baseUrl.trim();
        process.env.GEMINI_BASE_URL = baseUrl.trim();
      }
    }
    
    if (model !== undefined) {
      if (model.trim() === '') {
        delete env.GEMINI_MODEL;
        delete process.env.GEMINI_MODEL;
      } else {
        env.GEMINI_MODEL = model.trim();
        process.env.GEMINI_MODEL = model.trim();
      }
    }
    writeEnvFile(env);


    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const env = parseEnvFile();
    delete env.GEMINI_API_KEY;
    delete env.GEMINI_BASE_URL;
    delete env.GEMINI_MODEL;
    writeEnvFile(env);
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_BASE_URL;
    delete process.env.GEMINI_MODEL;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 });
  }
}
