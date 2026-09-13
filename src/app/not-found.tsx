import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-zinc-300">
      <div className="max-w-xl text-center">
        <p className="font-mono text-sm text-blue-400">ERRO 404</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          Esta página não existe.
        </h1>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-zinc-500">
          O endereço pode estar incorreto ou a página pode ter sido removida.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao início
        </Link>
      </div>
    </main>
  );
}
