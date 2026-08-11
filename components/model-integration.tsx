"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Brain, AlertTriangle, CheckCircle, Zap,
  Building2, Lightbulb, Info, ArrowRight, Wallet
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { GovernmentSchemes } from "@/components/government-schemes"
import type { AnalysisResult, ExplainabilityFactor } from "@/types/xai"
import { ExplainabilityTimeline } from "@/components/explainability-timeline"
import { ConfidenceMeter } from "@/components/confidence-meter"
import { ImprovementAdvisor } from "@/components/improvement-advisor"
import { SchemeComparison } from "@/components/scheme-comparison"
import { ScenarioSimulator } from "@/components/scenario-simulator"

interface ModelPredictionProps {
  applicationData?: any
  onPredictionComplete?: (result: AnalysisResult) => void
  initialResult?: AnalysisResult | null
  mode?: "predict" | "view"
  referenceData?: any
}

export function ModelPrediction({
  applicationData,
  onPredictionComplete,
  initialResult,
  mode = "predict",
  referenceData
}: ModelPredictionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    if (initialResult) {
      setPrediction(initialResult)
    }
  }, [initialResult])

  const handlePredict = async () => {
    setIsLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) throw new Error("Authentication error: Session expired")

      const response = await fetch("http://localhost:8000/analyze-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify(applicationData),
      })

      if (!response.ok) throw new Error(`Backend error: ${response.status}`)

      const result = await response.json()

      // Map Backend Response to Canonical AnalysisResult
      const banks = result.bank_suitability || []
      const schemes = result.scheme_recommendations || []

      // Adapt Factors
      const riskFactors = Array.isArray(result.negative_factors)
        ? result.negative_factors.map((f: any) => typeof f === 'string' ? { factor: f, feature: 'unknown', impact: 'medium', direction: 'negative' } : f)
        : []
      const positiveFactors = Array.isArray(result.positive_factors)
        ? result.positive_factors.map((f: any) => typeof f === 'string' ? { factor: f, feature: 'unknown', impact: 'medium', direction: 'positive' } : f)
        : []

      // Canonical Object
      const formattedResult: AnalysisResult & { confidence_score?: number } = {
        applicationId: result.application_id,
        prediction: result.prediction,
        ml_probability: result.ml_probability,
        riskBand: result.risk_band,
        riskScore: result.risk_score,
        positiveFactors: positiveFactors,
        riskFactors: riskFactors,
        decisionSummary: result.decision_summary,
        banks: banks,
        schemes: schemes,
        loanType: applicationData?.loan_type,
        improvementRecommendations: result.improvementRecommendations || [],
        confidence_score: result.confidence_score // Custom field for frontend
      }

      setPrediction(formattedResult)
      onPredictionComplete?.(formattedResult)

    } catch (error: any) {
      console.error("Prediction error:", error)
      alert(`Failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability.toLowerCase()) {
      case 'high': return 'bg-success/5 border-success/30 hover:bg-success/10'
      case 'medium': return 'bg-warning/5 border-warning/30 hover:bg-warning/10'
      case 'low': return 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10'
      default: return 'bg-card'
    }
  }

  const isStructuredFactor = (f: any): f is ExplainabilityFactor => {
    return f && typeof f === 'object' && 'factor' in f
  }

  // ---------------------------------------------------------
  // LOADING / EMPTY STATES
  // ---------------------------------------------------------

  if (mode === 'predict' && !prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Advisor Analysis</span>
          </CardTitle>
          <CardDescription>Get an instant eligibility check and personalized guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePredict} disabled={isLoading} className="w-full bg-primary text-lg h-12">
            {isLoading ? <><Zap className="w-4 h-4 mr-2 animate-spin" /> Analyzing Profile...</> : <><Brain className="w-4 h-4 mr-2" /> Check Eligibility</>}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!prediction) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Analysis data unavailable.</p>
      </div>
    )
  }

  const isApproved = prediction.riskBand === 'low' || prediction.prediction === 'approve' || (prediction.riskScore !== undefined && prediction.riskScore !== null && prediction.riskScore <= 40)

  // ---------------------------------------------------------
  // MAIN RENDER (Strict Data Only)
  // ---------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* SECTION 1: RISK ASSESSMENT */}
      <Card className={`overflow-hidden border-t-4 ${isApproved ? 'border-t-success' : 'border-t-warning'}`}>
        <div className={`p-6 ${isApproved ? 'bg-success/5' : 'bg-warning/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            {isApproved ? <CheckCircle className="w-8 h-8 text-success" /> : <Info className="w-8 h-8 text-warning-foreground" />}
            <div>
              <h2 className="text-2xl font-bold">Risk Assessment</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground font-medium">
                  Approval Chance: <span className="text-primary font-bold">{prediction.riskScore !== undefined && prediction.riskScore !== null ? 100 - prediction.riskScore : "NA"}%</span>
                </span>
                {prediction.riskBand ? (
                  <Badge variant={prediction.riskBand === 'low' ? 'outline' : prediction.riskBand === 'medium' ? 'secondary' : 'destructive'} className="uppercase">
                    {prediction.riskBand} Risk
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex-1">
              <p className="text-foreground text-lg leading-relaxed whitespace-pre-line">
                {prediction.decisionSummary?.replace(/Risk Score: \d+ \([A-Z]+\)\.\s*/, '')}
              </p>
            </div>
            <div className="min-w-[250px]">
              {/* Feature 3: Confidence Meter */}
              <ConfidenceMeter score={(prediction as any).confidence_score || 85} />
            </div>
          </div>
        </div>
      </Card>

      {/* Feature 4: Scenario Simulator (Demo Feature) */}
      <ScenarioSimulator />

      <div className="grid md:grid-cols-2 gap-6">
        {/* SECTION 2 & 3: EXPLAINABILITY TIMELINE */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Factors Influencing Your Result</CardTitle>
          </CardHeader>
          <CardContent>
            <ExplainabilityTimeline
              positiveFactors={prediction.positiveFactors || []}
              negativeFactors={prediction.riskFactors || []}
            />
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: IMPROVEMENT ADVISOR */}
      {prediction.improvementRecommendations && prediction.improvementRecommendations.length > 0 && (
        <ImprovementAdvisor recommendations={prediction.improvementRecommendations} />
      )}

      {/* SECTION 5: SCHEMES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Schemes & Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {prediction.schemes && prediction.schemes.length > 0 ? (
            <>
              <GovernmentSchemes schemes={prediction.schemes} applicationId={prediction.applicationId} referenceData={referenceData} />
              {/* Feature 2: Comparison Table */}
              <SchemeComparison schemes={prediction.schemes} />
            </>
          ) : (
            <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">No applicable government schemes found for this profile currently.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 6: BANKING PARTNERS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Banks Recommended
          </CardTitle>
          <CardDescription>Lenders whose criteria match your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {prediction.banks && prediction.banks.length > 0 ? (
            prediction.banks.map((bank: any, idx: number) => (
              <div key={idx} className={`group p-4 rounded-xl border transition-all ${getSuitabilityColor(bank.suitability)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{bank.bank_name}</div>
                    <div className="text-sm mt-1 flex flex-col gap-1 text-muted-foreground">
                      <div className="flex items-center">
                        <Info className="w-3 h-3 mr-1" /> {bank.reason}
                      </div>
                      {bank.loan_amount && bank.repayment_amount && bank.interest_rate && (
                        <div className="mt-2 text-sm bg-muted/30 p-2 rounded-md border text-foreground w-fit">
                          <span className="font-medium">Loan amount:</span> ₹{bank.loan_amount.toLocaleString()} <span className="text-muted-foreground mx-1">|</span> <span className="font-medium text-primary">Repayment:</span> ₹{bank.repayment_amount.toLocaleString()} <span className="text-muted-foreground mx-1">|</span> <span className="font-medium">Interest:</span> {bank.interest_rate}%
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={bank.suitability === 'high' ? 'bg-success' : bank.suitability === 'medium' ? 'bg-warning' : 'bg-muted text-muted-foreground'}>
                    {bank.suitability.toUpperCase()} Match
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted/20 rounded-lg text-sm text-center border border-dashed">
              <p className="text-muted-foreground">No banks closely match your profile yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
