import Link from "next/link";
import Footer from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <div className="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <DarkModeToggle />
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 md:py-12 flex-1">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          ← Volver al buscador
        </Link>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Descargo de Responsabilidad
        </h1>
        <div className="text-neutral-800 dark:text-neutral-200 text-base leading-relaxed max-w-prose">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-0 mb-3">
            Información General
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            PrivataSearch es un proyecto de código abierto desarrollado de forma
            independiente con fines académicos. Este buscador no tiene
            afiliación oficial con la Agencia de Protección de Datos de los
            Habitantes (PRODHAB) ni con ninguna entidad gubernamental de Costa
            Rica.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Naturaleza, Precisión y Actualización de Datos
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            La información contenida en este buscador proviene de resoluciones
            públicas y despersonalizadas emitidas por PRODHAB. Aunque se busca
            incluir todas las resoluciones disponibles públicamente, pueden
            existir omisiones o retrasos en la actualización del índice. Por
            tanto, se recomienda verificar siempre con las fuentes oficiales.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Limitación de Responsabilidad
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            PrivataSearch se proporciona "tal cual" sin garantías de ningún
            tipo, ya sean expresas o implícitas. Los desarrolladores no asumen
            responsabilidad alguna por errores, omisiones o interpretaciones
            incorrectas de la información presentada. El usuario entiende que
            esta es una herramienta de consulta y referencia que no acredita en
            forma alguna, eficacia o validez de las resoluciones que sean
            accedidas a través de la misma. El uso de este buscador es bajo el
            propio riesgo del usuario.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Privacidad y Datos
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Este proyecto no recopila datos personales de los usuarios. No
            utiliza cookies de seguimiento ni análisis. Las resoluciones
            incluidas ya están despersonalizadas en su versión pública original
            según lo dispuesto por la legislación costarricense vigente.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Cambios en el Descargo de Responsabilidad
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Los desarrolladores se reservan el derecho de modificar este
            descargo de responsabilidad en cualquier momento. Se recomienda a
            los usuarios revisar periódicamente esta sección para estar
            informados sobre cualquier cambio.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Contacto
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Para reportar errores, inexactitudes o solicitar actualizaciones,
            por favor abra un issue en el repositorio de GitHub.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">
            Aceptación de Términos
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Al utilizar PrivataSearch, usted acepta los términos y condiciones
            establecidos en este descargo de responsabilidad.
          </p>

          <p className="mt-10 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-6">
            Última actualización: {new Date().toLocaleDateString("es-CR")}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
