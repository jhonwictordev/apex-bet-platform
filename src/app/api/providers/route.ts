import { NextResponse } from "next/server";
import { GameIntegrationGateway } from "@/server/modules/providers/gateway";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET() {
  try {
    const providers = await GameIntegrationGateway.listAllProvidersStatus();
    return NextResponse.json(okResponse(providers));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
