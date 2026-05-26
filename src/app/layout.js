import "./globals.css";

export const metadata = {
    title: 'Rainbow Licence — 다문화 학생을 위한 한국 자격증 학습',
    description: '한식조리·미용·제과 등 한국 국가기술자격증을 5개 언어로 학습. 다문화 학교 NEXT SCHOOL과 함께.',
    openGraph: {
        title: 'Rainbow Licence',
        description: '다문화 학생을 위한 한국 자격증 학습 도구',
        type: 'website',
        locale: 'ko_KR',
        siteName: 'Rainbow Licence',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Rainbow Licence',
        description: '다문화 학생을 위한 한국 자격증 학습 도구',
    },
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <script src="https://code.iconify.design/3/3.1.0/iconify.min.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
