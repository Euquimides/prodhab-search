import { Inter } from "next/font/google";
import Script from "next/script";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "PrivataSearch",
  description: "Buscador de jurisprudencia de protección de datos personales de la PRODHAB (Costa Rica)",
  openGraph: {
    title: "PrivataSearch",
    description: "Buscador de jurisprudencia de protección de datos personales de la PRODHAB (Costa Rica)",
    type: "website",
    locale: "es_CR",
  },
  twitter: {
    card: "summary",
    title: "PrivataSearch",
    description: "Buscador de jurisprudencia de protección de datos personales de la PRODHAB (Costa Rica)",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning: la clase de modo oscuro es inyectada por script inline antes de la hidratación
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Precargar índice de resoluciones */}
        <link
          rel="preload"
          href="/indice-resoluciones-prodhab.json"
          as="fetch"
          type="application/json"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('ps_theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(l) {
                if (l.search[1] === '/') {
                  var decoded = l.search.slice(1).split('&').map(function(s) {
                    return s.replace(/~and~/g, '&');
                  });
                  window.history.replaceState(
                    null, null,
                    l.pathname.slice(0, -1) + decoded[0] +
                    (decoded[1] ? '?' + decoded[1] : '') +
                    l.hash
                  );
                }
              }(window.location));
            `,
          }}
        />
      </head>
      <body>
        <SearchProvider>{children}</SearchProvider>
        <Script
          src="https://chat.crafterq.ai/embed.js"
          data-q-id="019e6736-9b8d-759d-a527-7ddf26988800"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
