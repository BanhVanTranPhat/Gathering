import { DM_Sans } from 'next/font/google'
import "./globals.css";
import Layout from '@/components/Layout/Layout'

const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173")

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "The Gathering",
  description: "The Gathering - Virtual Co-Working Space",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.className}>
      <body>
        <Layout>
            {children}
        </Layout>
      </body>
    </html>
  );
}
