export const metadata = {
  title: 'LearnConnect',
  description: 'TYT, AYT, LGS ve uluslararası sınavlar için AI destekli eğitim portalı',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
