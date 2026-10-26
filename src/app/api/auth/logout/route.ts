import { NextResponse } from "next/server";
import { okResponse } from "@/server/core/result";

export async function POST() {
  const response = NextResponse.json(okResponse({ message: "Desconectado com sucesso." }));
  response.cookies.delete("apex_session");
  return response;
}
