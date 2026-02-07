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
      // STRICT: No auto-defaults here. We trust the backend payload structure.
      // If specific fields like bands are missing, we let them fail or be null, but we don't inject constants.

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
      const formattedResult: AnalysisResult = {
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
        improvementRecommendations: result.improvementRecommendations || []
      }

      setPrediction(formattedResult)
      console.log("ModelPrediction: Set Prediction", formattedResult)
      console.log("ModelPrediction: Banks", formattedResult.banks)
      console.log("ModelPrediction: Schemes", formattedResult.schemes)
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

  const isApproved = prediction.prediction === 'approve'

  // ---------------------------------------------------------
  // MAIN RENDER (Strict Data Only)
  // ---------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* SECTION 1: RISK ASSESSMENT (Single Source of Truth) */}
      <Card className={`overflow-hidden border-t-4 ${isApproved ? 'border-t-success' : 'border-t-warning'}`}>
        <div className={`p-6 ${isApproved ? 'bg-success/5' : 'bg-warning/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            {isApproved ? <CheckCircle className="w-8 h-8 text-success" /> : <Info className="w-8 h-8 text-warning-foreground" />}
            <div>
              <h2 className="text-2xl font-bold">Risk Assessment</h2>
              <div className="flex items-center gap-2 mt-1">
                {/* STRICT: Display backend value directly. If null/undefined, it breaks (intended validation), or we show '-' */}
                <span className="text-muted-foreground font-medium">Score: {prediction.riskScore}/100</span>

                {/* STRICT: Badge relies on backend riskBand. no fallback. */}
                {prediction.riskBand ? (
                  <Badge variant={prediction.riskBand === 'low' ? 'outline' : prediction.riskBand === 'medium' ? 'secondary' : 'destructive'} className="uppercase">
                    {prediction.riskBand} Risk
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-foreground text-lg leading-relaxed border-t pt-4 border-black/5">
            {prediction.decisionSummary}
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">

        {/* SECTION 2: WHAT WORKS IN YOUR FAVOR */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-success">
              <CheckCircle className="w-5 h-5 mr-2" /> What Works in Your Favor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const INCLUSION_TERMS = ['transgender', 'sc/st', 'caste', 'women', 'senior', 'weaker section', 'inclusion', 'psl'];
              const filteredPositive = (prediction.positiveFactors || []).filter((f: any) => {
                const text = isStructuredFactor(f) ? f.factor : f;
                const lower = text.toLowerCase();
                return !INCLUSION_TERMS.some(term => lower.includes(term));
              });

              if (filteredPositive.length > 0) {
                return (
                  <ul className="space-y-3">
                    {filteredPositive.map((f: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{isStructuredFactor(f) ? f.factor : f}</span>
                      </li>
                    ))}
                  </ul>
                );
              } else {
                return <p className="text-sm text-muted-foreground italic">No specific positive factors identified.</p>;
              }
            })()}
          </CardContent>
        </Card>

        {/* SECTION 3: ELIGIBILITY GAPS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-warning-foreground">
              <AlertTriangle className="w-5 h-5 mr-2" /> Eligibility Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const INCLUSION_TERMS = ['transgender', 'sc/st', 'caste', 'women', 'senior', 'weaker section', 'inclusion', 'psl'];
              const filteredNegative = (prediction.riskFactors || []).filter((f: any) => {
                const text = isStructuredFactor(f) ? f.factor : f;
                const lower = text.toLowerCase();
                return !INCLUSION_TERMS.some(term => lower.includes(term));
              });

              if (filteredNegative.length > 0) {
                return (
                  <ul className="space-y-3">
                    {filteredNegative.map((f: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <AlertTriangle className="w-4 h-4 text-warning-foreground shrink-0 mt-0.5" />
                        <span>{isStructuredFactor(f) ? f.factor : f}</span>
                      </li>
                    ))}
                  </ul>
                );
              } else {
                return (
                  <div className="flex items-center gap-2 text-success text-sm">
                    <CheckCircle className="w-4 h-4" /> No critical eligibility gaps detected.
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: WHAT YOU CAN DO NEXT */}
      {prediction.improvementRecommendations && prediction.improvementRecommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Lightbulb className="w-5 h-5 mr-2" />
              What You Can Do Next
            </CardTitle>
            <CardDescription>
              Actionable steps to improve your profile's eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prediction.improvementRecommendations.map((rec: any, i: number) => (
              <div key={i} className="p-4 bg-background rounded-lg border shadow-sm hover:shadow-md transition-all">
                <Badge variant="outline" className="mb-2 capitalize bg-muted/50">{rec.recommendation_type?.replace(/_/g, ' ')}</Badge>
                <p className="text-sm font-medium mb-3 min-h-[40px]">{rec.message}</p>

                {(rec.current_value !== undefined && rec.recommended_value !== undefined) && (
                  <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                    <div>
                      <span className="text-muted-foreground block">Current</span>
                      <span className="font-mono font-bold">{rec.current_value}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <div className="text-right">
                      <span className="text-muted-foreground block">Target</span>
                      <span className="font-mono font-bold text-success">{rec.recommended_value}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SECTION 5: SCHEMES & OPPORTUNITIES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Schemes & Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prediction.schemes && prediction.schemes.length > 0 ? (
            <GovernmentSchemes schemes={prediction.schemes} applicationId={prediction.applicationId} referenceData={referenceData} />
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
            Banking Partners
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
                    <div className="text-sm mt-1 flex items-center text-muted-foreground">
                      <Info className="w-3 h-3 mr-1" /> {bank.reason}
                    </div>
                  </div>
                  <Badge className={bank.suitability === 'high' ? 'bg-success' : bank.suitability === 'medium' ? 'bg-warning' : 'bg-muted text-muted-foreground'}>
                    {bank.suitability.toUpperCase()} Match
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            // STRICT: Empty array means no criteria matched.
            <div className="p-4 bg-muted/20 rounded-lg text-sm text-center border border-dashed">
              <p className="text-muted-foreground">No banks closely match your profile yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
