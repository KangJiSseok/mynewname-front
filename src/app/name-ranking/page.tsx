// app/names/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL

type NameData = {
  name: string
  count: number
}

type NameResponse = {
  content: NameData[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export default function NameRankingPage() {
  const [names, setNames] = useState<NameData[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchData = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/names?page=${page}&size=10&sort=count,desc`)
      const data: NameResponse = await res.json()
      setNames(data.content)
      setTotalPages(data.totalPages)
      setPage(data.number)
    } catch (error) {
      console.error("이름 데이터를 불러오는 중 오류 발생", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(0)
  }, [])

  const goToPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchData(newPage)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">
          다른 추천 이름 보기
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">불러오는 중...</p>
        ) : (
          <ul className="divide-y divide-pink-100">
            {names.map((item, index) => (
              <li
                key={item.name}
                className="flex items-center justify-between py-4 px-2 hover:bg-pink-50 rounded-lg transition-all"
              >
                <span className="font-semibold text-lg text-gray-700">
                  {index + 1 + page * 10}. {item.name}
                </span>
                <span className="text-sm text-pink-600 font-medium">
                  추천 횟수: {item.count}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between mt-6">
          <Button
            onClick={() => goToPage(page - 1)}
            disabled={page === 0 || loading}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 이전
          </Button>
          <span className="text-sm text-gray-600 self-center">
            Page {page + 1} / {totalPages}
          </span>
          <Button
            onClick={() => goToPage(page + 1)}
            disabled={page + 1 >= totalPages || loading}
            variant="outline"
          >
            다음 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </main>
  )
}
