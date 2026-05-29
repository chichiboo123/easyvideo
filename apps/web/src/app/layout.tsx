import type { Metadata } from "next";
import Script from "next/script";
import { buildGoogleFontsHref } from "@/lib/fonts";
import "./globals.css";

const normalizeBasePath = (value: string | undefined) => {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

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
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={buildGoogleFontsHref()} rel="stylesheet" />
        <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
      </head>
      <body>
        {children}
        <Script src={`${basePath}/coi-serviceworker.js`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
