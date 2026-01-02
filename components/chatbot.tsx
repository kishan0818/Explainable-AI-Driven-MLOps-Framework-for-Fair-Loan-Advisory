"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Bot, User, ExternalLink } from "lucide-react"
// Local definitions to replace deleted mockdata
const governmentSchemes = [
  { id: "mudra", name: "MUDRA Loan", description: "Loans for small businesses" },
  { id: "pmay", name: "PMAY (Housing)", description: "Affordable housing scheme" },
  { id: "cgtsme", name: "CGTMSE", description: "Credit guarantee for MSEs" },
]

const rbiRules = [
  { id: "psl", title: "Priority Sector Lending", description: "Mandatory lending to specific sectors" },
  { id: "kyc", title: "KYC Norms", description: "Know Your Customer specifications" },
]

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

    // Simulate typing delay
    setTimeout(
      () => {
        const response = getChatbotResponse(inputValue)
        let botResponse: Message

        if (response) {
          botResponse = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: response.answer,
            timestamp: new Date(),
            relatedSchemes: response.relatedSchemes,
            relatedRules: response.relatedRules,
          }
        } else {
          // Fallback response with scheme/rule suggestions
          const relevantSchemes = findRelevantSchemes(inputValue)
          const relevantRules = findRelevantRules(inputValue)

          let fallbackContent = "I understand you're asking about loan-related topics. "

          if (relevantSchemes.length > 0) {
            fallbackContent += `I found ${relevantSchemes.length} relevant scheme(s) that might help you. `
          }

          if (relevantRules.length > 0) {
            fallbackContent += `There are also ${relevantRules.length} relevant regulation(s) to consider. `
          }

          if (relevantSchemes.length === 0 && relevantRules.length === 0) {
            fallbackContent +=
              "Could you please rephrase your question? I can help with MUDRA loans, PMAY housing schemes, RBI regulations, loan eligibility, documentation requirements, and more."
          }

          botResponse = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: fallbackContent,
            timestamp: new Date(),
            relatedSchemes: relevantSchemes.slice(0, 3).map((s) => s.id),
            relatedRules: relevantRules.slice(0, 3).map((r) => r.id),
          }
        }

        setMessages((prev) => [...prev, botResponse])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    ) // Random delay between 1-2 seconds
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
        <Card className="absolute bottom-16 right-0 w-96 h-[500px] shadow-2xl border-2 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm">AI Loan Assistant</CardTitle>
                <CardDescription className="text-xs">Ask about schemes, rules & eligibility</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "bot" && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        {message.type === "user" && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">{message.content}</div>
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
                                <Badge key={schemeId} variant="outline" className="text-xs cursor-pointer">
                                  <ExternalLink className="w-2 h-2 mr-1" />
                                  {scheme.name}
                                </Badge>
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
                                <Badge key={ruleId} variant="secondary" className="text-xs cursor-pointer">
                                  <ExternalLink className="w-2 h-2 mr-1" />
                                  {rule.title}
                                </Badge>
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
