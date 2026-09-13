import Link from "next/link";

interface BreadcrumbsProps {
  current: string;
}

export function Breadcrumbs({ current }: BreadcrumbsProps) {
  return (
    <nav aria-label="Navegação estrutural" className="mb-8 text-sm text-zinc-500">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-blue-400">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-zinc-300">
          {current}
        </li>
      </ol>
    </nav>
  );
}
