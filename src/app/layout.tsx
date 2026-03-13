import { Inter } from "next/font/google";
import { SearchProvider } from "@/context/SearchContext";
// @ts-ignore
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "PrivataSearch",
  description: "Buscador de jurisprudencia de protección de datos personales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                if (t !== 'light') {
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
      </body>
    </html>
  );
}
