import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "영상편집 걱정마 - Easy Video",
  description: "초등학생도 쉽게 사용하는 어린이 친화적 브라우저 영상 편집기",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Nanum+Gothic:wght@400;700;800&family=Do+Hyeon&family=Gowun+Dodum&family=Black+Han+Sans&family=Roboto:wght@400;500;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Inter:wght@400;600;700&family=Oswald:wght@400;500;700&family=Lobster&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* Registers coi-serviceworker to add COOP/COEP headers for
            SharedArrayBuffer (FFmpeg.wasm) on GitHub Pages. */}
        <Script src="/coi-serviceworker.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
