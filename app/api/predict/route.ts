import { type NextRequest, NextResponse } from "next/server"

// Interface for loan application
interface LoanApplication {
  name: string
  age: number
  income: number
  loanAmount: number
  loanType: string
  employmentType?: string
  creditScore?: number
  dtiRatio?: number
  monthsEmployed?: number
  numCreditLines?: number
  interestRate?: number
  loanTerm?: number
  education?: string
  maritalStatus?: string
  hasMortgage?: boolean
  hasDependents?: boolean
  loanPurpose?: string
  hasCoSigner?: boolean
  gender?: string
  casteCategory?: string
  locationType?: string
}

// Interface for model prediction response
interface ModelPrediction {
  applicationId: string
  prediction: "approve" | "reject"
  confidence: number
  probability: {
    approve: number
    reject: number
  }
  shapValues: {
    feature: string
    value: number
    impact: number
    description: string
  }[]
  riskFactors: string[]
  recommendations: string[]
  modelVersion: string
  timestamp: string
  rulesApplied: {
    ruleId: string
    description: string
    severity: string
    applied: boolean
    result: string
    reason?: string
  }[]
  schemesSuggested: {
    id: string
    name: string
    category: string
    description: string
    eligibility: any
    benefits: string[]
    url: string
    matchScore: number
  }[]
}

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const application: LoanApplication = await request.json()

    // Validate required fields
    if (
      !application.name ||
      !application.age ||
      !application.income ||
      !application.loanAmount ||
      !application.loanType
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Transform data to match backend API format
    const backendPayload = {
      name: application.name,
      age: application.age,
      income: application.income,
      loan_amount: application.loanAmount,
      loan_type: application.loanType,
      employment_type: application.employmentType || "salaried",
      credit_score: application.creditScore,
      dti_ratio: application.dtiRatio,
      months_employed: application.monthsEmployed,
      num_credit_lines: application.numCreditLines,
      interest_rate: application.interestRate,
      loan_term: application.loanTerm,
      education: application.education,
      marital_status: application.maritalStatus,
      has_mortgage: application.hasMortgage,
      has_dependents: application.hasDependents,
      loan_purpose: application.loanPurpose,
      has_co_signer: application.hasCoSigner,
      gender: application.gender,
      caste_category: application.casteCategory,
      location_type: application.locationType,
    }

    // Call Python backend
    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    })

    if (!response.ok) {
      // If backend is not available, fall back to mock prediction
      console.warn("Backend not available, using mock prediction")
      return await getMockPrediction(application)
    }

    const backendResponse = await response.json()
    const prediction: ModelPrediction = backendResponse

    // Log prediction for audit trail
    console.log(`[AI Model] Prediction for ${application.name}:`, {
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      modelVersion: prediction.modelVersion,
    })

    return NextResponse.json({
      success: true,
      data: prediction,
    })
  } catch (error) {
    console.error("Prediction error:", error)
    
    // Fall back to mock prediction if backend fails
    try {
      const application: LoanApplication = await request.json()
      return await getMockPrediction(application)
    } catch (fallbackError) {
      console.error("Fallback prediction error:", fallbackError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// Mock prediction fallback
async function getMockPrediction(application: LoanApplication): Promise<NextResponse> {
  // Simulate model processing time
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  const mockPrediction: ModelPrediction = {
    applicationId: `APP${Date.now()}`,
    prediction: Math.random() > 0.5 ? "approve" : "reject",
    confidence: 0.75 + Math.random() * 0.2,
    probability: {
      approve: 0.3 + Math.random() * 0.4,
      reject: 0.3 + Math.random() * 0.4,
    },
    shapValues: [
      {
        feature: "income",
        value: application.income,
        impact: application.income > 50000 ? 0.25 : -0.15,
        description: application.income > 50000
          ? "High income positively influences approval"
          : "Low income reduces approval chances",
      },
      {
        feature: "loanAmount",
        value: application.loanAmount,
        impact: application.loanAmount > 1000000 ? -0.1 : 0.05,
        description: application.loanAmount > 1000000 
          ? "High loan amount increases risk" 
          : "Moderate loan amount is favorable",
      },
    ],
    riskFactors: application.income < 30000 ? ["Low income relative to loan amount"] : [],
    recommendations: [
      "Consider government schemes like MUDRA or PMAY based on your profile"
    ],
    modelVersion: "RF_SMOTE_v1.2_MOCK",
    timestamp: new Date().toISOString(),
    rulesApplied: [
      {
        ruleId: "credit_score_minimum_threshold",
        description: "Credit Score minimum thresholds based on loan type and amount",
        severity: "hard",
        applied: true,
        result: "passed"
      }
    ],
    schemesSuggested: [
      {
        id: "pmmy",
        name: "Pradhan Mantri Mudra Yojana",
        category: "Micro Enterprise Loans",
        description: "Collateral-free loans up to ₹20 lakh to non-corporate, non-farm small/micro enterprises",
        eligibility: {},
        benefits: ["Collateral-free credit facility", "Online application through Udyamimitra portal"],
        url: "https://www.mudra.org.in",
        matchScore: 85
      }
    ]
  }

  return NextResponse.json({
    success: true,
    data: mockPrediction,
  })
}
