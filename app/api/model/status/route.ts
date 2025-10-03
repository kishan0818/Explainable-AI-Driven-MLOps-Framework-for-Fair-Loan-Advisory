import { NextResponse } from "next/server"

// Interface for model status
interface ModelStatus {
  modelVersion: string
  status: "active" | "inactive" | "training" | "error"
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  rocAuc: number
  oobScore: number
  lastUpdated: string
  totalPredictions: number
  todayPredictions: number
  avgProcessingTime: number
  errorRate: number
  features: {
    name: string
    importance: number
    description: string
  }[]
  performanceHistory: {
    date: string
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }[]
}

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    // Try to get real model status from backend
    const response = await fetch(`${BACKEND_URL}/model/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const backendStatus = await response.json()
      return NextResponse.json({
        success: true,
        data: backendStatus,
      })
    } else {
      // Fall back to mock data if backend is not available
      console.warn("Backend not available, using mock model status")
      return await getMockModelStatus()
    }
  } catch (error) {
    console.error("Model status error:", error)
    // Fall back to mock data
    return await getMockModelStatus()
  }
}

// Mock model status fallback
async function getMockModelStatus(): Promise<NextResponse> {
  const modelStatus: ModelStatus = {
    modelVersion: "RF_SMOTE_v1.2_MOCK",
    status: "active",
    accuracy: 87.2,
    precision: 84.1,
    recall: 85.0,
    f1Score: 84.5,
    rocAuc: 92.1,
    oobScore: 87.3,
    lastUpdated: new Date().toISOString(),
    totalPredictions: 15647,
    todayPredictions: 23,
    avgProcessingTime: 2.3,
    errorRate: 0.8,
    features: [
      {
        name: "income",
        importance: 0.23,
        description: "Monthly income of the applicant",
      },
      {
        name: "dtiRatio",
        importance: 0.19,
        description: "Debt-to-income ratio",
      },
      {
        name: "loanAmount",
        importance: 0.16,
        description: "Requested loan amount",
      },
      {
        name: "age",
        importance: 0.12,
        description: "Age of the applicant",
      },
      {
        name: "employmentType",
        importance: 0.11,
        description: "Type of employment",
      },
      {
        name: "loanType",
        importance: 0.09,
        description: "Category of loan requested",
      },
      {
        name: "creditHistory",
        importance: 0.08,
        description: "Credit history score",
      },
      {
        name: "collateral",
        importance: 0.02,
        description: "Collateral availability",
      },
    ],
    performanceHistory: [
      { date: "2024-01-15", accuracy: 86.8, precision: 83.5, recall: 84.2, f1Score: 83.8 },
      { date: "2024-01-16", accuracy: 87.1, precision: 83.9, recall: 84.6, f1Score: 84.2 },
      { date: "2024-01-17", accuracy: 86.9, precision: 83.7, recall: 84.4, f1Score: 84.0 },
      { date: "2024-01-18", accuracy: 87.3, precision: 84.2, recall: 84.8, f1Score: 84.5 },
      { date: "2024-01-19", accuracy: 87.0, precision: 84.0, recall: 84.7, f1Score: 84.3 },
      { date: "2024-01-20", accuracy: 87.2, precision: 84.1, recall: 85.0, f1Score: 84.5 },
    ],
  }

  return NextResponse.json({
    success: true,
    data: modelStatus,
  })
}
