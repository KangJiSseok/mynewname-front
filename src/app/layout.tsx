import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "네임 플레이 - 나만의 영어 이름 찾기",
  description: "당신의 독특한 성격과 분위기에 맞는 완벽한 영어 이름을 발견하세요!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

