import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/theme-provider";
import LanguageProvider from "@/components/language-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SplashScreen from "@/components/splash-screen";

export const metadata: Metadata = {
  title: {
    default: "CHY · Dev",
    template: "%s — CHY · Dev",
  },
  description: "个人技术博客 & 项目展示 — 但积跬步，莫问前程。",
};

// Prevent flash of wrong theme before JS loads
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Default to dark if no preference stored
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)] bg-grid transition-colors duration-400">
        <ThemeProvider>
          <LanguageProvider>
            <SplashScreen />
            <Header />
            <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10">
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
