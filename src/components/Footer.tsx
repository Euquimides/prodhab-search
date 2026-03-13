export default function Footer() {

  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Proyecto de Código Abierto creado por:
          </p>
          <div className="flex flex-col items-center gap-2">
            <a
              href="https://www.vasquezdrexler.abogado/"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/logo_light.png"
                alt="Vasquez Drexler — sitio web del autor"
                className="h-12 sm:h-14 w-auto block dark:hidden"
              />
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="h-12 sm:h-14 w-auto hidden dark:block"
              />
            </a>
            <a
              href="https://github.com/Euquimides/privatasearch"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200 active:scale-95 transition-all dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
            <a
              href="/estadisticas"
              className="py-2 -my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Estadísticas
            </a>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <a
              href="/disclaimer"
              className="py-2 -my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Descargo de responsabilidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
