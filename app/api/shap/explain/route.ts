import { type NextRequest, NextResponse } from "next/server"

interface ShapExplanation {
  applicationId: string
  prediction: "approve" | "reject"
  confidence: number
  explanation: {
    summary: string
    topFactors: {
      factor: string
      impact: number
      value: string
      explanation: string
    }[]
    riskAssessment: {
      level: "low" | "medium" | "high"
      factors: string[]
      mitigation: string[]
    }
    alternativeOptions: {
      scheme: string
      eligibility: string
      benefits: string
    }[]
  }
  visualData: {
    feature: string
    shapValue: number
    featureValue: string
    color: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId, prediction, shapValues } = await request.json()

    if (!applicationId || !prediction || !shapValues) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Generate human-readable explanation
    const topFactors = shapValues
      .sort((a: any, b: any) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5)
      .map((factor: any) => ({
        factor: factor.feature,
        impact: factor.impact,
        value: factor.value.toString(),
        explanation: factor.description,
      }))

    const positiveFactors = topFactors.filter((f) => f.impact > 0)
    const negativeFactors = topFactors.filter((f) => f.impact < 0)

    let summary = ""
    if (prediction === "approve") {
      summary = `Your loan application has been approved with ${Math.round(shapValues.reduce((sum: number, s: any) => sum + Math.max(0, s.impact), 0) * 100)}% positive factors. `
      if (positiveFactors.length > 0) {
        summary += `Key strengths include ${positiveFactors.map((f) => f.factor).join(", ")}. `
      }
      if (negativeFactors.length > 0) {
        summary += `Areas of concern were ${negativeFactors.map((f) => f.factor).join(", ")}, but overall profile is strong.`
      }
    } else {
      summary = `Your loan application was not approved due to ${Math.round(Math.abs(shapValues.reduce((sum: number, s: any) => sum + Math.min(0, s.impact), 0)) * 100)}% risk factors. `
      if (negativeFactors.length > 0) {
        summary += `Primary concerns include ${negativeFactors.map((f) => f.factor).join(", ")}. `
      }
      summary += "However, there are alternative options available."
    }

    // Risk assessment
    const totalNegativeImpact = shapValues.reduce((sum: number, s: any) => sum + Math.min(0, s.impact), 0)
    const riskLevel =
      Math.abs(totalNegativeImpact) > 0.3 ? "high" : Math.abs(totalNegativeImpact) > 0.15 ? "medium" : "low"

    const riskFactors = negativeFactors.map((f) => f.explanation)
    const mitigation = []

    if (negativeFactors.some((f) => f.factor === "income")) {
      mitigation.push("Consider adding a co-applicant with stable income")
    }
    if (negativeFactors.some((f) => f.factor === "dtiRatio")) {
      mitigation.push("Reduce loan amount or extend repayment tenure")
    }
    if (negativeFactors.some((f) => f.factor === "age")) {
      mitigation.push("Provide additional employment stability documentation")
    }

    // Alternative schemes for rejected applications
    const alternativeOptions =
      prediction === "reject"
        ? [
            {
              scheme: "MUDRA Shishu Loan",
              eligibility: "Small business owners, up to ₹50,000",
              benefits: "No collateral, flexible repayment, 8.5-12% interest",
            },
            {
              scheme: "PMAY Credit Subsidy",
              eligibility: "First-time home buyers, income up to ₹18 lakhs",
              benefits: "Interest subsidy up to ₹2.67 lakhs, reduced EMI",
            },
            {
              scheme: "Stand-Up India",
              eligibility: "SC/ST and women entrepreneurs",
              benefits: "₹10 lakhs to ₹1 crore, handholding support",
            },
          ]
        : []

    // Visual data for SHAP plot
    const visualData = shapValues.map((factor: any) => ({
      feature: factor.feature,
      shapValue: factor.impact,
      featureValue: factor.value.toString(),
      color: factor.impact > 0 ? "#10b981" : "#ef4444",
    }))

    const explanation: ShapExplanation = {
      applicationId,
      prediction,
      confidence: Math.random() * 0.3 + 0.7, // Mock confidence
      explanation: {
        summary,
        topFactors,
        riskAssessment: {
          level: riskLevel,
          factors: riskFactors,
          mitigation,
        },
        alternativeOptions,
      },
      visualData,
    }

    return NextResponse.json({
      success: true,
      data: explanation,
    })
  } catch (error) {
    console.error("SHAP explanation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
