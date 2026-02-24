import "./globals.css";

export const metadata = {
  title: "레인보우 자격증 | 다문화 가정 자격증 합격 도우미",
  description: "한국어가 서툰 다문화 가정 학생들을 위한 자격증 시험 준비 앱. AI 번역, 단계별 학습, 기출문제 CBT 제공.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script src="https://code.iconify.design/3/3.1.0/iconify.min.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
