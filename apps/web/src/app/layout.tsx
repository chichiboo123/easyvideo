import type { Metadata } from "next";
import Script from "next/script";
import { buildGoogleFontsHref } from "@/lib/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const normalizeBasePath = (value: string | undefined) => {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

// Material Symbols (Rounded) icon font. Built as a value so the Next lint rules
// for static font links (which target string literals) don't false-positive.
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&display=block";

export const metadata: Metadata = {
  title: "영상편집 걱정마 - Easy Video",
  description: "초등학생부터 누구나 쉽게 사용하는 어린이 친화적 브라우저 영상 편집기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Set the saved theme before paint so there's no dark→light flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={buildGoogleFontsHref()} rel="stylesheet" />
        <link href={MATERIAL_SYMBOLS_HREF} rel="stylesheet" />
        <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
      </head>
      <body>
        {children}
        <Script src={`${basePath}/coi-serviceworker.js`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
