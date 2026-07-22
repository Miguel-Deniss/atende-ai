import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Falha ao inicializar cliente Supabase" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Supabase connection error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
