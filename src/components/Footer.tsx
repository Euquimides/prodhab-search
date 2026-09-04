import Image from "next/image";
import Link from "next/link";

export default function Footer() {

  return (
    <footer className="border-t border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Un proyecto de código abierto de
          </p>
          <div className="flex flex-col items-center gap-2">
            <a
              href="https://www.vasquezdrexler.abogado/"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo_light.png"
                alt="Vasquez Drexler, sitio web del autor"
                width={160}
                height={56}
                className="h-12 sm:h-14 w-auto block dark:hidden"
              />
              <Image
                src="/logo.png"
                alt="Vasquez Drexler"
                aria-hidden="true"
                width={160}
                height={56}
                className="h-12 sm:h-14 w-auto hidden dark:block"
              />
            </a>
            <a
              href="https://github.com/Euquimides/privatasearch"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center bg-neutral-100/80 rounded-lg px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200/80 active:scale-95 transition-all dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              GitHub
            </a>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} · Licencia MIT
            </p>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <Link
              href="/formularios"
              className="py-3 -my-3 sm:py-2 sm:-my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Formularios
            </Link>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <Link
              href="/estadisticas"
              className="py-3 -my-3 sm:py-2 sm:-my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Estadísticas
            </Link>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <Link
              href="/grafo"
              className="py-3 -my-3 sm:py-2 sm:-my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Red de citas
            </Link>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <Link
              href="/disclaimer"
              className="py-3 -my-3 sm:py-2 sm:-my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Descargo de responsabilidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
