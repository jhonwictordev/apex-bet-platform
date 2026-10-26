import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();
    const { providerCode, apiKey, apiSecret, endpointUrl, environment } = body;

    if (!providerCode) {
      return NextResponse.json(errResponse("Código do provedor é obrigatório."), { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { code: providerCode },
      include: { credentials: true },
    });

    if (!provider) {
      return NextResponse.json(errResponse("Provedor não encontrado."), { status: 404 });
    }

    const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        status: isConfigured ? "CONFIGURED" : "AWAITING_CREDENTIALS",
        credentials: {
          upsert: {
            create: {
              apiKey: apiKey || null,
              apiSecret: apiSecret || null,
              endpointUrl: endpointUrl || null,
              environment: environment || "SANDBOX",
            },
            update: {
              ...(apiKey !== undefined ? { apiKey } : {}),
              ...(apiSecret !== undefined ? { apiSecret } : {}),
              ...(endpointUrl !== undefined ? { endpointUrl } : {}),
              ...(environment !== undefined ? { environment } : {}),
              testStatus: "UNTESTED",
            },
          },
        },
      },
    });

    await recordAuditLog({
      actorId: admin.userId,
      actorRole: admin.role,
      action: "UPDATE_PROVIDER_CREDENTIALS",
      entity: "PROVIDER",
      entityId: provider.id,
      details: {
        providerCode,
        environment,
        hasKey: Boolean(apiKey),
      },
    });

    return NextResponse.json(
      okResponse({ success: true }, `Credenciais de sandbox para ${provider.name} atualizadas com sucesso.`)
    );
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}
