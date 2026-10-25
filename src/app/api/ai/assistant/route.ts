import { NextRequest, NextResponse } from 'next/server';
import {
  generateAmenAiResponse,
  AMEN_MART_SYSTEM_PROMPT,
  AMEN_MART_COMPANY_FACTS,
  type LiveInventorySnapshot,
} from '@/lib/ai/amenKnowledgeBase';

interface AssistantRequestBody {
  query?: string;
  inventory?: LiveInventorySnapshot;
  pathname?: string;
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    assistantName: 'Amen AI Concierge',
    organization: AMEN_MART_COMPANY_FACTS.officialName,
    managingDirector: AMEN_MART_COMPANY_FACTS.managingDirector,
    location: AMEN_MART_COMPANY_FACTS.location.physical,
    hotlines: `${AMEN_MART_COMPANY_FACTS.contacts.primaryPhone} / ${AMEN_MART_COMPANY_FACTS.contacts.secondaryPhone}`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AssistantRequestBody;
    const rawQuery = (body.query || '').trim();
    const inventory = body.inventory;
    const pathname = body.pathname;

    // Generate structured deterministic response from Amen Mart Knowledge Base & Live Inventory
    const baseResponse = generateAmenAiResponse(rawQuery, inventory, pathname);

    // Optional LLM enrichment if GEMINI_API_KEY is configured in environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && rawQuery.length > 3) {
      try {
        const inventoryContext = inventory
          ? `LIVE INVENTORY COUNTS: ${inventory.auctionLots?.length || 0} Auction Lots, ${inventory.dealershipVehicles?.length || 0} Showroom Vehicles, ${inventory.landParcels?.length || 0} Land Parcels, ${inventory.propertyUnits?.length || 0} Property Units.`
          : '';

        const llmRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: `${AMEN_MART_SYSTEM_PROMPT}\n\n${inventoryContext}\n\nBase Knowledge Reference:\n${baseResponse.answer}`,
                  },
                ],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: rawQuery }],
                },
              ],
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (llmRes.ok) {
          const llmData = (await llmRes.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const enrichedText = llmData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (enrichedText) {
            return NextResponse.json({
              ...baseResponse,
              answer: enrichedText,
            });
          }
        }
      } catch {
        // Silently fall back to the deterministic knowledge engine if offline or API unreachable
      }
    }

    return NextResponse.json(baseResponse);
  } catch (error) {
    console.error('Amen AI Assistant API error:', error);
    const fallback = generateAmenAiResponse('');
    return NextResponse.json(fallback, { status: 200 });
  }
}
