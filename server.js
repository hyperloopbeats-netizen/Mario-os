import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '15mb' }));

const HTML_MODULES = new Set([
  'AIM OS Brain',
  'AIM OS V8.4',
  'AIM OSx Sentient Game Generaror',
  'AutoCAD',
  'Face2',
  'PS6 Sun',
  'Sun2',
  'The Sun'
]);

const JSON_MODULES = new Set([
  'AIM Cometic OS V30'
]);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function formatGeminiError(err, fallback) {
  let status = Number(err?.status) || 500;
  let message = String(err?.message || fallback || 'AI request failed.');
  if (message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.code) status = Number(parsed.error.code) || status;
      if (parsed?.error?.message) {
        message = String(parsed.error.message).split('\n')[0];
      }
    } catch {
      // keep original message
    }
  }
  return { status, message };
}

const CAD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    summary: { type: Type.STRING },
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          shape: {
            type: Type.STRING,
            description: 'One of: box, cylinder, sphere, torus, torusKnot, cone, capsule, oct'
          },
          position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          color: { type: Type.STRING },
          emissive: { type: Type.STRING },
          emissiveIntensity: { type: Type.NUMBER },
          metalness: { type: Type.NUMBER },
          roughness: { type: Type.NUMBER },
          opacity: { type: Type.NUMBER },
          spinSpeed: { type: Type.NUMBER }
        },
        required: ['label', 'shape', 'position', 'rotation', 'scale', 'color', 'metalness', 'roughness']
      }
    }
  },
  required: ['name', 'summary', 'parts']
};

const MOVIE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    tagline: { type: Type.STRING },
    moodColor: { type: Type.STRING },
    fogDensity: { type: Type.NUMBER },
    cadAssembly: CAD_RESPONSE_SCHEMA,
    shots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          headline: { type: Type.STRING },
          subline: { type: Type.STRING },
          camera: { type: Type.STRING, description: 'One of: orbit, dolly, crane, hero, sweep' },
          keyColor: { type: Type.STRING },
          rimColor: { type: Type.STRING },
          cadSpinBoost: { type: Type.NUMBER },
          enableCad: { type: Type.BOOLEAN },
          enableSun: { type: Type.BOOLEAN },
          enableMario: { type: Type.BOOLEAN },
          enableGrid: { type: Type.BOOLEAN },
          enablePromo: { type: Type.BOOLEAN }
        },
        required: ['label', 'duration', 'headline', 'subline', 'camera', 'keyColor', 'rimColor', 'enableCad', 'enableSun', 'enableMario', 'enableGrid', 'enablePromo']
      }
    }
  },
  required: ['title', 'tagline', 'moodColor', 'fogDensity', 'cadAssembly', 'shots']
};

app.post('/api/gemini/cad', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
  }
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a 3D system prompt.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Design a detailed, multi-part 3D CAD mechanical or architectural system for: "${prompt}". Compose 6 to 12 distinct interlocking parts centered around origin (y from 0 to 4), with realistic PBR metalness (0..1), roughness (0..1), hex colors, and subtle spinSpeed on moving rotors/rings.`,
      config: {
        systemInstruction: 'You are an industrial 3D CAD systems architect. Output crisp structured JSON matching the schema. Use valid hex color strings like #38bdf8 or #e2e8f0. Keep positions within [-3, 3] on X/Z and [0.2, 4.2] on Y.',
        responseMimeType: 'application/json',
        responseSchema: CAD_RESPONSE_SCHEMA
      }
    });
    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json({ assembly: parsed });
  } catch (err) {
    console.error('Gemini CAD error:', err);
    const formatted = formatGeminiError(err, 'Failed to synthesize 3D CAD system.');
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post('/api/gemini/movie', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
  }
  const prompt = String(req.body?.prompt || '').trim();
  const promoName = String(req.body?.promoName || '').trim();
  const imageDataUrl = typeof req.body?.imageDataUrl === 'string' ? req.body.imageDataUrl : null;

  if (!prompt && !imageDataUrl && !promoName) {
    return res.status(400).json({ error: 'Please provide a movie prompt or upload a promo image/video.' });
  }

  try {
    const parts = [];
    if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
      const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    parts.push({
      text: `Direct a 4-shot cinematic Full HD movie sequence combining 3D Liquid CAD assemblies, the Digital Sun fractal plasma core, the Super Mario 3D hero rig, kinetic terrain grid, and ${promoName ? `the uploaded promo asset "${promoName}"` : 'studio promo screens'}. User prompt: "${prompt || 'Create a sleek black-glass cinematic promo film from the uploaded visual'}". Each shot should be 3 to 5 seconds long with bold cinematic headlines, matching camera choreography (orbit, dolly, crane, hero, sweep), and cohesive lighting colors.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction: 'You are a visionary cinematic director for a real-time 3D WebGL film engine. Return valid JSON matching the schema with 4 distinct sequenced shots and an intricate 6-10 part CAD centerpiece.',
        responseMimeType: 'application/json',
        responseSchema: MOVIE_RESPONSE_SCHEMA
      }
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json({ movie: parsed });
  } catch (err) {
    console.error('Gemini Movie error:', err);
    const formatted = formatGeminiError(err, 'Failed to evoke movie scene.');
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

const TEXT2MOVIE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    tagline: { type: Type.STRING },
    directorNotes: { type: Type.STRING },
    movement: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING, description: 'One of: spline_orbit, parkour_patrol, figure_eight, cinema_glide, zero_g' },
        stiffness: { type: Type.NUMBER },
        damping: { type: Type.NUMBER },
        smoothness: { type: Type.NUMBER },
        pathRadius: { type: Type.NUMBER },
        gaitSpeed: { type: Type.NUMBER },
        easeCurve: { type: Type.STRING, description: 'One of: quintic, cubic, spring' }
      },
      required: ['mode', 'stiffness', 'damping', 'smoothness', 'pathRadius', 'gaitSpeed', 'easeCurve']
    },
    scene: {
      type: Type.OBJECT,
      properties: {
        biome: { type: Type.STRING, description: 'One of: obsidian_studio, solar_foundry, mushroom_twilight, orbital_void, arctic_glass' },
        bgColor: { type: Type.STRING },
        fogColor: { type: Type.STRING },
        fogDensity: { type: Type.NUMBER },
        keyColor: { type: Type.STRING },
        rimColor: { type: Type.STRING },
        gridColor: { type: Type.STRING },
        sunScale: { type: Type.NUMBER }
      },
      required: ['biome', 'bgColor', 'fogColor', 'fogDensity', 'keyColor', 'rimColor', 'gridColor', 'sunScale']
    },
    cadAssembly: CAD_RESPONSE_SCHEMA,
    shots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          headline: { type: Type.STRING },
          subline: { type: Type.STRING },
          camera: { type: Type.STRING, description: 'One of: orbit, dolly, crane, hero, sweep' },
          keyColor: { type: Type.STRING },
          rimColor: { type: Type.STRING },
          cadSpinBoost: { type: Type.NUMBER },
          enableCad: { type: Type.BOOLEAN },
          enableSun: { type: Type.BOOLEAN },
          enableMario: { type: Type.BOOLEAN },
          enableGrid: { type: Type.BOOLEAN },
          enablePromo: { type: Type.BOOLEAN }
        },
        required: ['label', 'duration', 'headline', 'subline', 'camera', 'keyColor', 'rimColor', 'enableCad', 'enableSun', 'enableMario', 'enableGrid', 'enablePromo']
      }
    }
  },
  required: ['title', 'tagline', 'directorNotes', 'movement', 'scene', 'cadAssembly', 'shots']
};

app.post('/api/gemini/text2movie', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
  }
  const prompt = String(req.body?.prompt || '').trim();
  const targetDuration = Math.max(8, Math.min(24, Number(req.body?.duration) || 12));
  if (!prompt) {
    return res.status(400).json({ error: 'Please enter a text prompt to generate a movie.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a unified Text-to-Movie production package for a ${targetDuration}-second 1080p film from this prompt: "${prompt}". Combine: (1) a 4-shot cinema sequence summing to ~${targetDuration}s, (2) a Hybrid Movement config (spline mode, spring stiffness 60..180, damping 8..22, smoothness 0.5..0.95, pathRadius 2.0..5.5, gaitSpeed 0.6..1.8), (3) a Hybrid Scene Designer environment (biome, hex colors, fogDensity 0.012..0.032, sunScale 0.7..1.4), and (4) a 6-to-10 part PBR Liquid CAD assembly centerpiece.`,
      config: {
        systemInstruction: 'You are an integrated film director, movement choreographer, and 3D CAD architect. Return crisp structured JSON matching the schema. Use valid 6-digit hex colors.',
        responseMimeType: 'application/json',
        responseSchema: TEXT2MOVIE_RESPONSE_SCHEMA
      }
    });
    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json({ package: parsed });
  } catch (err) {
    console.error('Gemini Text2Movie error:', err);
    const formatted = formatGeminiError(err, 'Failed to generate movie package.');
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules/three')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/modules', (_req, res) => {
  res.json({
    htmlModules: Array.from(HTML_MODULES),
    jsonModules: Array.from(JSON_MODULES)
  });
});

app.get('/:moduleName', (req, res, next) => {
  const name = req.params.moduleName;
  if (HTML_MODULES.has(name)) {
    const filePath = path.join(__dirname, name);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(filePath);
    }
  }
  if (JSON_MODULES.has(name)) {
    const filePath = path.join(__dirname, name);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.sendFile(filePath);
    }
  }
  next();
});

app.use(express.static(__dirname, { index: 'index.html' }));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`matrix-game-engine listening on http://${HOST}:${PORT}`);
});
