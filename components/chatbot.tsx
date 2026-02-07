"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Bot, User, ExternalLink } from "lucide-react"
// Local definitions to replace deleted mockdata
const governmentSchemes = [
  { id: "mudra", name: "MUDRA Loan", description: "Loans for small businesses", url: "https://www.mudra.org.in" },
  { id: "pmay", name: "PMAY (Housing)", description: "Affordable housing scheme", url: "https://pmay-urban.gov.in" },
  { id: "cgtsme", name: "CGTMSE", description: "Credit guarantee for MSEs", url: "https://www.cgtmse.in" },
]

const rbiRules = [
  { id: "psl", title: "Priority Sector Lending", description: "Mandatory lending to specific sectors", url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12148" },
  { id: "kyc", title: "KYC Norms", description: "Know Your Customer specifications", url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=10292" },
]
// ... (omitted lines)


function getChatbotResponse(input: string) {
  const lowerInput = input.toLowerCase()
  if (lowerInput.includes("mudra")) {
    return {
      answer: "MUDRA loans are designed to support micro-enterprises. They come in three categories: Shishu, Kishore, and Tarun, depending on the loan amount.",
      relatedSchemes: ["mudra"],
      relatedRules: []
    }
  }
  if (lowerInput.includes("pmay") || lowerInput.includes("housing")) {
    return {
      answer: "Pradhan Mantri Awas Yojana (PMAY) aims to provide affordable housing for all. It offers interest subsidies for first-time homebuyers.",
      relatedSchemes: ["pmay"],
      relatedRules: []
    }
  }
  if (lowerInput.includes("document") || lowerInput.includes("paper")) {
    return {
      answer: "Typically, you need ID proof (Aadhar/PAN), address proof, and income proof (salary slips/ITR) for loan applications.",
      relatedSchemes: [],
      relatedRules: ["kyc"]
    }
  }
  return null
}

function findRelevantSchemes(input: string) {
  const lowerInput = input.toLowerCase()
  return governmentSchemes.filter(s => lowerInput.includes(s.name.toLowerCase()) || lowerInput.includes(s.description.toLowerCase()))
}

function findRelevantRules(input: string) {
  const lowerInput = input.toLowerCase()
  return rbiRules.filter(r => lowerInput.includes(r.title.toLowerCase()) || lowerInput.includes(r.description.toLowerCase()))
}

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  relatedSchemes?: string[]
  relatedRules?: string[]
}

interface ChatbotProps {
  className?: string
}

export function Chatbot({ className = "" }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      content:
        "Hello! I'm your AI assistant for loan schemes and regulations. I can help you understand RBI rules, government schemes, and guide you through loan processes. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const [isExpanded, setIsExpanded] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Call Real RAG Backend
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: inputValue }),
      })

      let botResponse: Message

      if (response.ok) {
        const data = await response.json()
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.answer || "I couldn't generate a response.",
          timestamp: new Date(),
          relatedSchemes: data.related_schemes || [],
          relatedRules: data.related_rules || [],
        }
      } else {
        throw new Error("API call failed")
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error("Chat error:", error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I'm having trouble connecting to the server. Please ensure the backend is running.",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getSchemeById = (id: string) => governmentSchemes.find((s) => s.id === id)
  const getRuleById = (id: string) => rbiRules.find((r) => r.id === id)

  const quickQuestions = [
    "What is MUDRA loan?",
    "PMAY eligibility criteria",
    "My loan was rejected",
    "Business loan documents",
    "Priority sector lending",
  ]

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-lg transition-all duration-200 hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`absolute bottom-16 right-0 shadow-2xl border-2 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? "w-[600px] h-[80vh] max-h-[800px]" : "w-96 h-[500px]"
            }`}
        >
          <CardHeader className="pb-3 border-b cursor-pointer" onDoubleClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-sm">AI Loan Assistant</CardTitle>
                  <CardDescription className="text-xs">Ask about schemes, rules & eligibility</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap break-words ${message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "bot" && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        {message.type === "user" && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">{message.content}</div>
                      </div>
                    </div>
                  </div>

                  {/* Related Schemes and Rules */}
                  {message.type === "bot" && (message.relatedSchemes || message.relatedRules) && (
                    <div className="ml-4 space-y-2">
                      {message.relatedSchemes && message.relatedSchemes.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Related Schemes:</div>
                          <div className="flex flex-wrap gap-1">
                            {message.relatedSchemes.map((schemeId) => {
                              const scheme = getSchemeById(schemeId)
                              return scheme ? (
                                <a
                                  key={schemeId}
                                  href={scheme.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-underline"
                                >
                                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent/50 transition-colors">
                                    <ExternalLink className="w-2 h-2 mr-1" />
                                    {scheme.name}
                                  </Badge>
                                </a>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}

                      {message.relatedRules && message.relatedRules.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Related Rules:</div>
                          <div className="flex flex-wrap gap-1">
                            {message.relatedRules.map((ruleId) => {
                              const rule = getRuleById(ruleId)
                              return rule ? (
                                <a
                                  key={ruleId}
                                  href={rule.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-underline"
                                >
                                  <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                                    <ExternalLink className="w-2 h-2 mr-1" />
                                    {rule.title}
                                  </Badge>
                                </a>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg text-sm flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Quick questions:</div>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 bg-transparent"
                      onClick={() => {
                        setInputValue(question)
                        setTimeout(handleSendMessage, 100)
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about loans, schemes, or rules..."
                  className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isTyping}
                />
                <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
