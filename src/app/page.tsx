"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Share2, Info, Send, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"


const apiUrl = process.env.NEXT_PUBLIC_API_URL

type MessageType = {
  id: number
  sender: "system" | "user"
  content: string
  type?: "text" | "result"
}

export default function HybridNameFinder() {
  const router = useRouter()
  // Step tracking
  const [step, setStep] = useState<"form" | "chat" | "result">("form")

  // Form data (나이, 성별 + 5개의 질문 답변)
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    questionOne: "",
    questionTwo: "",
    questionThree: "",
    questionFour: "",
    questionFive: "",
  })

  // Chat state
  const [messages, setMessages] = useState<MessageType[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  // 서버에서 받을 결과 (여러 이름과 각각의 추천 이유, 추천 횟수, 총 추천 횟수)
  const [result, setResult] = useState<{
    names: string[]
    reasons: Record<string, Record<string, string>>
    namesCount: number[]
    totalCount: number
  }>({
    names: [],
    reasons: {},
    namesCount: [],
    totalCount: 0,
  })

  // 채팅 스크롤 제어 ref
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 질문 목록 (첫 질문은 환영 메시지, 이후 1~5번 질문)
  const questions = [
    { id: 0, content: "안녕! 몇 가지 질문에 답해볼까요? 😊", type: "text" },
    { id: 1, content: "당신의 직업 혹은 희망 직업은 무엇인가요?", type: "text", field: "questionOne" },
    { id: 2, content: "친구가 갑자기 파티에 초대했어요. 당신의 반응은?", type: "text", field: "questionTwo" },
    { id: 3, content: "로또 1등에 당첨됐어요! 가장 먼저 할 일은? ", type: "text", field: "questionThree" },
    { id: 4, content: "과거로 갈 수 있다면 어떤 시대에 가보고 싶어요? ", type: "text", field: "questionFour" },
    { id: 5, content: "이름이 검색되었을 때 SNS에서 잘 나오는 게 좋은가요, 아니면 좀 더 희소한 게 좋은가요? ", type: "text", field: "questionFive" },
  ]

  // Handle form input changes
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle gender selection in form
  const handleGenderSelect = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }))
  }

  // Move from form to chat
  const handleFormSubmit = () => {
    // 나이와 성별이 입력되었는지 확인
    if (!formData.age || !formData.gender) {
      return
    }

    setStep("chat")

    // Initialize chat with welcome message
    setTimeout(() => {
      addMessage(questions[0].content, "system")
      setTimeout(() => {
        addMessage(questions[1].content, "system")
        setCurrentQuestion(1)
        setIsTyping(false)
      }, 1000)
    }, 500)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current && step === "chat") {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, step])

  const addMessage = (content: string, sender: "system" | "user", type: "text" | "result" = "text") => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(), // 혹시 몰라 랜덤값 추가
        sender,
        content,
        type,
      },
    ])
  }

  const handleSendMessage = () => {
    if (!currentInput.trim()) return

    const currentField = questions[currentQuestion].field as keyof typeof formData

    // Add user message
    addMessage(currentInput, "user")
    setFormData((prev) => ({ ...prev, [currentField]: currentInput }))

    setCurrentInput("")
    setIsTyping(true)

    // Move to next question after a short delay
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1

      if (nextQuestion < questions.length) {
        addMessage(questions[nextQuestion].content, "system")
        setCurrentQuestion(nextQuestion)
        setIsTyping(false)
      } else {
        // All questions answered, fetch result
        generateResult()
      }
    }, 1000)
  }

  // 최종 결과 요청
  const generateResult = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/chat/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: formData.age,
          gender: formData.gender,
          questionOne: formData.questionOne,
          questionTwo: formData.questionTwo,
          questionThree: formData.questionThree,
          questionFour: formData.questionFour,
          questionFive: formData.questionFive,
        }),
      })

      if (!response.ok) {
        throw new Error("서버 응답 에러")
      }

      // 서버가 반환하는 JSON 예시:
      // {
      //   "names": ["Asher", "Finn", "Jasper"],
      //   "reasons": {
      //       "Asher": { "나이/시대적 유행": "...", "직업": "...", "MBTI": "..." },
      //       "Finn": { ... },
      //       "Jasper": { ... }
      //   },
      //   "namesCount": [1, 2, 1],
      //   "totalCount": 5
      // }
      const data = await response.json()

      setResult({
        names: data.names || [],
        reasons: data.reasons || {},
        namesCount: data.namesCount || [],
        totalCount: data.totalCount || 0,
      })
    } catch (error) {
      console.error(error)
      // 데모용 fallback (에러 시 임시 데이터)
      setResult({
        names: ["Unknown"],
        reasons: { Unknown: { 오류: "이름 생성 중 오류가 발생했습니다." } },
        namesCount: [1],
        totalCount: 1,
      })
    } finally {
      // 결과 메시지 출력 후, result 화면으로 전환
      setTimeout(() => {
        addMessage("결과가 나왔어요! 🎉", "system")
        setTimeout(() => {
          setStep("result")
        }, 1000)
      }, 1000)
    }
  }

  // 이모티콘으로 간단 평가하는 함수
  const rateResult = (rating: string) => {
    const messages = {
      "😍": "정말 좋아해 주셔서 감사합니다! ❤️",
      "😐": "소중한 의견 감사합니다!",
      "👎": "다음에는 더 좋은 이름을 찾아드릴게요!",
    }
    alert(messages[rating as keyof typeof messages])
  }

  // 공유 (간단히 클립보드 복사)
  const shareResult = () => {
    const shareText = `제가 추천받은 이름은 ${result.names.join(", ")} 입니다!`
    navigator.clipboard.writeText(shareText)
    alert("결과가 클립보드에 복사되었습니다! 친구들과 공유해보세요!")
  }

  // 다시 시작하기
  const resetApp = () => {
    setStep("form")
    setFormData({
      age: "",
      gender: "",
      questionOne: "",
      questionTwo: "",
      questionThree: "",
      questionFour: "",
      questionFive: "",
    })
    setMessages([])
    setCurrentQuestion(0)
    setResult({
      names: [],
      reasons: {},
      namesCount: [],
      totalCount: 0,
    })
  }

  // 엔터키로 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex">
      {/* Ad space - left side (desktop/tablet only) */}
      <div className="hidden md:block w-1/6 p-2">
        <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-sm text-center">광고 공간</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto">
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            네임 플레이
            <Sparkles className="h-5 w-5" />
          </h1>
        </header>

        <main className="flex-1 flex flex-col p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Form UI */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-pink-600">나만의 영어 이름 찾기</h2>
                      <p className="text-gray-600">당신의 상황과 특징에 맞는 영어 이름을 찾아보세요!</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <label htmlFor="age" className="block text-lg font-medium text-gray-700">
                            나이를 알려줘
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>입력하신 나이에 어울리는 이름을 추천해드려요!</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          placeholder="숫자 입력"
                          value={formData.age}
                          onChange={handleFormInputChange}
                          className="text-lg py-6 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-lg font-medium text-gray-700">성별을 선택해줘</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "남성", value: "남성" },
                            { label: "여성", value: "여성" },
                            { label: "중립", value: "중립" },
                          ].map((gender) => (
                            <button
                              key={gender.value}
                              type="button"
                              onClick={() => handleGenderSelect(gender.value)}
                              className={cn(
                                "py-3 px-4 rounded-xl text-lg font-medium transition-all",
                                formData.gender === gender.value
                                  ? "bg-pink-500 text-white"
                                  : "bg-pink-100 text-pink-700 hover:bg-pink-200",
                              )}
                            >
                              {gender.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleFormSubmit}
                      disabled={!formData.age || !formData.gender}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-6 px-6 rounded-full text-lg flex items-center justify-center gap-2"
                    >
                      다음으로 <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Chat UI */}
            {step === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto mb-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
                >
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-4 ${message.sender === "user" ? "flex justify-end" : "flex justify-start"}`}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] p-3 rounded-2xl",
                            message.sender === "user"
                              ? "bg-pink-500 text-white rounded-tr-none"
                              : "bg-gray-200 text-gray-800 rounded-tl-none",
                          )}
                        >
                          <p>{message.content}</p>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start mb-4"
                      >
                        <div className="bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-none">
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0 }}
                              className="w-2 h-2 bg-gray-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.2 }}
                              className="w-2 h-2 bg-gray-500 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.4 }}
                              className="w-2 h-2 bg-gray-500 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value.slice(0, 50))}
                    onKeyPress={handleKeyPress}
                    placeholder="최대 50자까지 입력할 수 있어요!"
                    className="w-full pr-20 py-6 rounded-full bg-white/90 backdrop-blur-sm border-gray-300 focus:border-pink-400 focus:ring-pink-400"
                    disabled={isTyping}
                    maxLength={50}
                  />

                  <span className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-gray-500 select-none">
                    {currentInput.length}/50
                  </span>
                  <Button
                    onClick={handleSendMessage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 p-0 bg-pink-500 hover:bg-pink-600"
                    disabled={isTyping || !currentInput.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Result UI */}
            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="space-y-4"
                    >
                      <h2 className="text-2xl font-bold text-pink-600">추천받은 이름 목록</h2>

                      {/* 이름 목록과 추천 횟수, 이유를 출력 */}
                      <div className="space-y-4">
                        {result.names.map((name, index) => (
                          <div
                            key={name}
                            className="p-4 border border-pink-200 rounded-lg text-left bg-white/90 shadow-sm"
                          >
                            <h3 className="text-xl font-semibold text-pink-600">
                              {name} (총 {result.totalCount} 중 {result.namesCount[index]}번 추천)
                            </h3>
                            <ul className="mt-2 space-y-1 text-gray-700">
                              {Object.entries(result.reasons[name] || {}).map(([reasonKey, reasonValue]) => {
                                const displayValue =
                                  reasonKey === "MBTI" ? `${reasonValue}에 어울리는 이름 입니다.` : reasonValue

                                return (
                                  <li key={reasonKey}>
                                    <strong>{reasonKey}:</strong> {displayValue}
                                  </li>
                                )
                              })}

                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                    >
                      <Button
                        onClick={() => router.push("/name-ranking")}
                        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2"
                      >
                        🔍 다른 추천 이름도 보기
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="space-y-4"
                    >
                      <Button
                        onClick={shareResult}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2"
                      >
                        <Share2 className="h-5 w-5" />
                        이 결과 공유하기
                      </Button>

                      <div className="pt-4">
                        <p className="text-gray-700 mb-3">이 결과, 어떻게 생각하세요?</p>
                        <div className="flex justify-center gap-6">
                          {["😍", "😐", "👎"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => rateResult(emoji)}
                              className="text-4xl transform transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      <Button onClick={resetApp} variant="link" className="text-pink-600 hover:text-pink-800">
                        다시 시작하기
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Ad space - right side (desktop/tablet only) */}
      <div className="hidden md:block w-1/6 p-2">
        <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-sm text-center">광고 공간</p>
        </div>
      </div>
    </div>
  )
}
