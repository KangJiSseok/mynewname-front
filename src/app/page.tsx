"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Volume2, Share2, Info, Send, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type MessageType = {
  id: number
  sender: "system" | "user"
  content: string
  type?: "text" | "result"
}

export default function HybridNameFinder() {
  // Step tracking
  const [step, setStep] = useState<"form" | "chat" | "result">("form")

  // Form data
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    mbti: "",
    job: "",
    uniqueness: "",
  })

  // Chat state
  const [messages, setMessages] = useState<MessageType[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  // Result state
  const [result, setResult] = useState({
    name: "",
    explanation: "",
  })

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const questions = [
    { id: 0, content: "안녕! 몇 가지 질문에 더 답해볼까요? 😊", type: "text" },
    { id: 1, content: "MBTI가 뭐야?", type: "text", field: "mbti" },
    { id: 2, content: "현재 직업이나 꿈꾸는 직업은?", type: "text", field: "job" },
    { id: 3, content: "너만의 독특한 점은?", type: "text", field: "uniqueness" },
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
        id: Date.now(),
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

    // Move to next question after a delay
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1

      if (nextQuestion < questions.length) {
        addMessage(questions[nextQuestion].content, "system")
        setCurrentQuestion(nextQuestion)
        setIsTyping(false)
      } else {
        // All questions answered, show result
        generateResult()
      }
    }, 1000)
  }

  const generateResult = async () => {
    try {
      // 만약 서버가 http://localhost:8080/api/chat/generate 에서 받는다면:
      const response = await fetch("http://localhost:8080/api/chat/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: formData.age,
          gender: formData.gender,
          mbti: formData.mbti,
          job: formData.job,
          uniqueness: formData.uniqueness,
        }),
      })

      if (!response.ok) {
        throw new Error("서버 응답 에러")
      }

      // 서버가 반환하는 JSON (ChatResponseDto)를 받는다: { name, explanation }
      const data = await response.json()

      // state에 결과를 세팅
      setResult({
        name: data.name || "",
        explanation: data.explanation || "",
      })
    } catch (error) {
      console.error(error)

      // 데모용 fallback (에러 시 임시 이름)
      setResult({
        name: "Unknown",
        explanation: "이름 생성 중 오류가 발생했습니다.",
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

  const playAudio = () => {
    // In a real app, this would play the name pronunciation
    const utterance = new SpeechSynthesisUtterance(result.name)
    window.speechSynthesis.speak(utterance)
  }

  const shareResult = () => {
    // In a real app, this would generate a shareable link
    navigator.clipboard.writeText(`내 영어 이름을 확인해보세요: ${result.name}!`)
    alert("클립보드에 복사되었습니다! 친구들과 공유하세요!")
  }

  const rateResult = (rating: string) => {
    // In a real app, this would send the rating to the server
    const messages = {
      "😍": "정말 좋아해 주셔서 감사합니다! ❤️",
      "😐": "소중한 의견 감사합니다!",
      "👎": "다음에는 더 좋은 이름을 찾아드릴게요!",
    }
    alert(messages[rating as keyof typeof messages])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const resetApp = () => {
    setStep("form")
    setFormData({
      age: "",
      gender: "",
      mbti: "",
      job: "",
      uniqueness: "",
    })
    setMessages([])
    setCurrentQuestion(0)
    setResult({
      name: "",
      explanation: "",
    })
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
                      <p className="text-gray-600">당신의 성격과 특징에 맞는 완벽한 영어 이름을 찾아보세요!</p>
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
                            { label: "남성", value: "male" },
                            { label: "여성", value: "female" },
                            { label: "중립", value: "neutral" },
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
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="pr-12 py-6 rounded-full bg-white/90 backdrop-blur-sm border-gray-300 focus:border-pink-400 focus:ring-pink-400"
                    disabled={isTyping}
                  />
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
                      className="space-y-2"
                    >
                      <h2 className="text-2xl font-bold text-pink-600">당신의 완벽한 이름은...</h2>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                        className="relative"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 opacity-50 blur-xl"></div>
                        </div>
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 relative z-10 py-6">
                          {result.name}
                        </h1>
                      </motion.div>
                      <p className="text-gray-700 italic">{result.explanation}</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="space-y-4"
                    >
                      <Button
                        onClick={playAudio}
                        variant="outline"
                        className="w-full py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2"
                      >
                        <Volume2 className="h-5 w-5" />
                        발음 듣기
                      </Button>

                      <Button
                        onClick={shareResult}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2"
                      >
                        <Share2 className="h-5 w-5" />이 이름 공유하기
                      </Button>

                      <div className="pt-4">
                        <p className="text-gray-700 mb-3">이 이름 어때?</p>
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

