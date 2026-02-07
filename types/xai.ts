// XAI Type Definitions for Explainability and Counterfactual Guidance

export interface ExplainabilityFactor {
    factor: string
    feature: string
    impact: "high" | "medium" | "low"
    direction: "positive" | "negative"
}

export interface ImprovementRecommendation {
    recommendation_type: string
    current_value: number
    recommended_value: number
    message: string
}

export interface BankMatch {
    bank_name: string
    suitability: "high" | "medium" | "low"
    reason: string
}

export interface Scheme {
    scheme_name: string
    description: string
    benefits: string[]
    eligibility_criteria: string[]
    application_link?: string
    url?: string
}

// Canonical Analysis Result (Single Source of Truth)
export interface AnalysisResult {
    applicationId: string
    prediction: string
    ml_probability: number | null
    riskBand: 'low' | 'medium' | 'high' | null
    riskScore: number | null
    positiveFactors: ExplainabilityFactor[]
    riskFactors: ExplainabilityFactor[]
    decisionSummary: string | null
    banks: BankMatch[]
    schemes: Scheme[]
    loanType?: string
    improvementRecommendations: ImprovementRecommendation[]
}
