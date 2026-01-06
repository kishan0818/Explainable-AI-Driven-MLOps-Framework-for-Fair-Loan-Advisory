// XAI Type Definitions for Explainability and Counterfactual Guidance

export interface ExplainabilityFactor {
    factor: string
    feature: string
    impact: "high" | "medium" | "low"
    direction: "positive" | "negative"
}

export interface ImprovementRecommendation {
    recommendation_type: "reduce_loan_amount" | "improve_credit_score" | "increase_income" | "add_coapplicant" | "wait_period"
    current_value: number
    recommended_value: number
    message: string
}
