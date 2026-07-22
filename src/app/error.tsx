"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Erro interno do servidor</h1>
          <p className="text-gray-500 mb-8">
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>
          <button
            onClick={reset}
            className="px-8 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
