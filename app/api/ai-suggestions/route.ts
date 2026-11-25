/**
 * AI Suggestions API Route - Clean and secure Gemini API integration
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import {
  getGeminiService,
  type AISuggestionResponse,
} from "@/lib/geminiService";

// Rate limiting configuration (lib/rateLimit.ts – Upstash эсвэл санах ой)
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SEC = 60 * 60; // 1 hour

/**
 * Validate origin for CORS
 */
function validateOrigin(origin: string | null): boolean {
  // Allow requests without origin (same-origin, direct navigation)
  if (!origin) return true;

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  
  // Allowlist тохируулаагүй бол зөвхөн dev дээр зөвшөөрнө
  if (allowedOrigins.length === 0) return process.env.NODE_ENV !== "production";
  
  return allowedOrigins.includes(origin);
}

/**
 * POST /api/ai-suggestions - Generate AI-powered suggestions
 */
export async function POST(request: NextRequest) {
  try {
    // Origin validation
    const origin = request.headers.get("origin");
    if (!validateOrigin(origin)) {
      return NextResponse.json(
        { error: "Origin not allowed", success: false },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `ai-suggest:${getClientIp(request)}`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_SEC
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later.", success: false },
        { 
          status: 429,
          headers: {
            "Retry-After": "3600",
            "X-RateLimit-Limit": RATE_LIMIT_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
          }
        }
      );
    }

    // Generate suggestion
    const geminiService = getGeminiService();
    const result: AISuggestionResponse = await geminiService.generateSuggestion();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate suggestion. Please try again later.", success: false },
        { status: 500 }
      );
    }

    // Success response
    const responseHeaders: Record<string, string> = {
      "X-RateLimit-Limit": RATE_LIMIT_REQUESTS.toString(),
      "X-RateLimit-Remaining": (rateLimitResult.remaining || 0).toString(),
      "Cache-Control": "no-store",
    };

    if (origin) {
      responseHeaders["Access-Control-Allow-Origin"] = origin;
    }

    return NextResponse.json(
      {
        suggestion: result.suggestion,
        success: true,
      },
      { headers: responseHeaders }
    );
    
  } catch (error) {
    console.error('AI suggestions generation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: "Internal server error. Please try again later.", success: false },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  
  if (!validateOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return new NextResponse(null, { status: 200, headers });
}
