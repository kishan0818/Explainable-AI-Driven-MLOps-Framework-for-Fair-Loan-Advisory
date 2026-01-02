"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Brain, AlertTriangle, CheckCircle, BarChart3, Zap,
  Building2, Lightbulb, FileText, Info, ArrowRight, ShieldCheck
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ModelPredictionProps {
  applicationData?: any
  onPredictionComplete?: (result: any) => void
  initialResult?: any
  mode?: "predict" | "view"
  referenceData?: any // Context from bank_loan_data.json
}

export function ModelPrediction({
  applicationData,
  onPredictionComplete,
  initialResult,
  mode = "predict",
  referenceData
}: ModelPredictionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)

  useEffect(() => {
    if (initialResult) {
      mapResultToState(initialResult)
    }
  }, [initialResult])

  const mapResultToState = (result: any) => {
    const approveProb = result.ml_probability !== undefined ? result.ml_probability : (1 - (result.risk_score / 100))
    const rejectProb = 1 - approveProb

    // Sort banks: High suitability first
    const sortedBanks = result.bank_suitability?.sort((a: any, b: any) => {
      const order = { high: 3, medium: 2, low: 1 }
      return (order[b.suitability as keyof typeof order] || 0) - (order[a.suitability as keyof typeof order] || 0)
    })

    const predictionData = {
      applicationId: result.application_id,
      prediction: result.prediction || (approveProb > 0.5 ? 'approve' : 'reject'),
      confidence: result.confidence || (approveProb > 0.5 ? approveProb : rejectProb),
      riskBand: result.risk_band,
      riskScore: result.risk_score,
      modelVersion: "RandomForest_v1",
      loanType: result.loan_type, // Get loan type for context lookup
      probability: { approve: approveProb, reject: rejectProb },
      riskFactors: result.negative_factors || [],
      positiveFactors: result.positive_factors || [],
      banks: sortedBanks || [],
      schemes: result.schemes_suggested || [],
      decisionSummary: result.decision_summary
    }
    setPrediction(predictionData)
  }

  const handlePredict = async () => {
    setIsLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) throw new Error("Authentication error: Session expired")

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify(applicationData),
      })

      if (!response.ok) throw new Error(`Backend error: ${response.status}`)

      const result = await response.json()
      // result now includes application_id, loan_type etc.
      mapResultToState({ ...result, loan_type: applicationData?.loan_type })
      onPredictionComplete?.(result) // Pass full result up for navigation

    } catch (error: any) {
      console.error("Prediction error:", error)
      alert(`Failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-success"
    if (confidence > 0.6) return "text-warning"
    return "text-destructive"
  }

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability.toLowerCase()) {
      case 'high': return 'bg-success/5 border-success/30 hover:bg-success/10'
      case 'medium': return 'bg-warning/5 border-warning/30 hover:bg-warning/10'
      case 'low': return 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10'
      default: return 'bg-card'
    }
  }

  // Lookup Context from Reference Data
  const getLoanContext = () => {
    if (!referenceData?.bank_data?.loan_types || !prediction?.loanType) return null
    return referenceData.bank_data.loan_types.find((l: any) => l.id === prediction.loanType)
  }
  const loanContext = getLoanContext()

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

  if (!prediction) return null

  const isApproved = prediction.prediction === 'approve'

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1. Main Decision Card */}
      <Card className={`overflow-hidden border-t-4 ${isApproved ? 'border-t-success' : 'border-t-warning'}`}>
        <div className={`p-6 ${isApproved ? 'bg-success/10' : 'bg-warning/10'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              {isApproved ? <CheckCircle className="w-6 h-6 mr-2 text-success" /> : <Info className="w-6 h-6 mr-2 text-warning-foreground" />}
              {isApproved ? "Eligible for Approval" : "Needs Profile Improvement"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isApproved
                ? "Your profile matches our primary lending criteria."
                : "Based on current inputs, standard approval is difficult. See options below."}
            </p>
          </div>
          <Badge className={`text-base px-4 py-1 ${isApproved ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}`}>
            {isApproved ? `${(prediction.confidence * 100).toFixed(0)}% Match` : "Eligibility Review"}
          </Badge>
        </div>

        <CardContent className="pt-6 space-y-6">
          {/* Key Factors Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Analysis Summary</h3>
              <p className="text-sm text-balance text-muted-foreground leading-relaxed">
                {prediction.decisionSummary || "Your profile has been analyzed against 15+ banking parameters including income stability, credit history, and debt-to-income ratio."}
              </p>

              <div className="flex gap-2 mt-2">
                {prediction.riskFactors.length === 0 && <Badge variant="outline" className="text-success border-success">No Major Risks</Badge>}
                {prediction.riskFactors.map((r: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-red-50 text-red-700 border-red-100">{r}</Badge>
                ))}
              </div>
            </div>

            {/* Context Accordion */}
            {loanContext && (
              <div className="bg-muted/30 rounded-lg p-1">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline text-sm font-medium">
                      View Eligibility & Documents for {loanContext.name}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-foreground mb-1">Documents</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {loanContext.documents_required?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground mb-1">Eligibility</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {Object.entries(loanContext.eligibility_criteria || {}).map(([k, v]: any, i) => (
                              <li key={i}><span className="capitalize">{k.replace('_', ' ')}</span>: {v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Bank Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Banking Partners
            </CardTitle>
            <CardDescription>
              {prediction.banks.length > 0 ? "Banks that match your profile" : "No direct bank matches found closest to your profile"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.banks.length > 0 ? (
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
              <div className="p-4 bg-muted rounded-lg text-sm text-center">
                Standard bank financing might be limited. Please check government schemes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Government Schemes (Contextual) */}
        <Card className={`h-full ${!isApproved ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-primary" />
              Government Schemes
            </CardTitle>
            <CardDescription>Subsidies and support you may be eligible for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.schemes && prediction.schemes.length > 0 ? (
              prediction.schemes.map((scheme: any, idx: number) => (
                <div key={idx} className="p-4 bg-background rounded-xl border hover:border-primary/50 transition-colors shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><FileText className="w-4 h-4 text-primary" /></div>
                    <div>
                      <div className="font-semibold text-primary">{scheme.scheme_name}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{scheme.reason}</p>
                      <Button variant="link" className="h-auto p-0 text-xs mt-2 text-primary">View Details <ArrowRight className="w-3 h-3 ml-1" /></Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                {isApproved
                  ? "Since you are eligible for standard banking, specific relief schemes are not prioritized."
                  : "No specific government schemes matched this profile."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
