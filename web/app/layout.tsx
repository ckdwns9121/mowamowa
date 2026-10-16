import type { Metadata } from "next";
import { Gaegu, Gowun_Dodum } from "next/font/google";
import "./globals.css";

const display = Gaegu({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-display" });
const body = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "모와모와 · 맥북 노치에 사는 치이카와 업무 짝꿍",
  description: "할 일은 맥북 노치에, 집중 친구는 바탕화면에. 노치에 마우스를 올리면 할 일·Jira 티켓·PR 리뷰가 펼쳐지는 macOS 앱.",
  icons: { icon: "/icon.png" },
  openGraph: { title: "모와모와 · MowaMowa", description: "맥북 노치에 사는 작은 치이카와 업무 짝꿍", images: ["/shots/notch-tasks.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
