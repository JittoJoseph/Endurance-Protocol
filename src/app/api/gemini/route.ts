import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  generateCompactPrompt,
  generateNarrativePrompt,
  getFallbackSummary,
} from '@/lib/gemini';
import { GeminiPromptPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptType, payload } = body as {
      promptType: 'compact' | 'narrative';
      payload: GeminiPromptPayload;
    };

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, return fallback
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using fallback');
      return NextResponse.json({
        summary: getFallbackSummary(payload),
        cached: true,
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Generate appropriate prompt
    const prompt =
      promptType === 'compact'
        ? generateCompactPrompt(payload)
        : generateNarrativePrompt(payload);

    // Try gemini-2.5-flash-lite first (lighter, faster)
    try {
      const liteModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await liteModel.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return NextResponse.json({
        summary,
        cached: false,
        model: 'flash-lite',
      });
    } catch (liteError) {
      console.warn('Flash-lite overloaded, falling back to flash:', liteError);
      
      // Fallback to gemini-2.5-flash
      const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await flashModel.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return NextResponse.json({
        summary,
        cached: false,
        model: 'flash',
      });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return generic fallback on error
    return NextResponse.json(
      {
        summary: '• High-energy impact event detected.\n• Significant regional destruction expected.\n• Immediate evacuation recommended.\n• Emergency response coordination critical.',
        cached: true,
        error: 'Gemini API unavailable',
      },
      { status: 200 } // Still return 200 with fallback
    );
  }
}
