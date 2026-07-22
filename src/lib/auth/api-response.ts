import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === "development" && details ? { details } : {}),
    },
    { status }
  );
}

export function unauthorizedResponse(message = "Não autorizado") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Acesso negado") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function notFoundResponse(message = "Recurso não encontrado") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function rateLimitResponse() {
  return NextResponse.json(
    { success: false, error: "Muitas requisições. Tente novamente mais tarde." },
    { status: 429 }
  );
}
