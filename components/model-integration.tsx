"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, AlertTriangle, CheckCircle, BarChart3, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ModelPredictionProps {
  applicationData: any
  onPredictionComplete?: (result: any) => void
}

export function ModelPrediction({ applicationData, onPredictionComplete }: ModelPredictionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [explanation, setExplanation] = useState<any>(null)

  const handlePredict = async () => {
    setIsLoading(true)
    try {
      // Get auth token strictly as requested
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
        console.error("Session Error:", sessionError)
        throw new Error("Authentication error: Session expired or missing")
      }

      console.log("JWT being sent:", session.access_token)

      // Call Real FastAPI Backend
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(applicationData),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication error: Unauthorized access to backend")
        }
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()

      // Map Backend Response to UI State
      const approveProb = 1 - (result.risk_score / 100)
      const rejectProb = result.risk_score / 100
      const bestBank = result.bank_suitability?.[0]

      const predictionData = {
        applicationId: result.application_id,
        prediction: result.prediction,
        confidence: result.confidence,
        modelVersion: "RandomForest_v1",
        probability: {
          approve: approveProb,
          reject: rejectProb
        },
        riskFactors: result.negative_factors || [],
        positiveFactors: result.positive_factors || [],
        recommendations: result.positive_factors || [], // For compatibility
        bestBank: bestBank
      }

      setPrediction(predictionData)

      setExplanation({
        explanation: {
          summary: `Risk Band: ${result.risk_band}. Logic based on credit history, income to debt ratio, employment stability, and rules engine.`,
          riskAssessment: {
            level: result.risk_band.toLowerCase(),
            score: result.risk_score
          },
          topFactors: [
            ...(result.negative_factors?.map((f: string) => ({ factor: f, type: "negative", impact: "High Risk" })) || []),
            ...(result.positive_factors?.map((f: string) => ({ factor: f, type: "positive", impact: "Strength" })) || [])
          ],
          alternativeOptions: result.schemes_suggested?.map((s: any) => ({
            scheme: s.name,
            benefits: s.description
          })) || []
        },
        visualData: []
      })

      onPredictionComplete?.(result)

    } catch (error: any) {
      console.error("Prediction error details:", error)
      if (error.message.includes("Authentication")) {
        alert("Authentication error. Please log in again.")
      } else {
        alert(`Failed to process application: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPredictionColor = (pred: string) => {
    return pred === "approve" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-success"
    if (confidence > 0.6) return "text-warning"
    return "text-destructive"
  }

  return (
    <div className="space-y-6">
      {!prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Model Prediction</span>
            </CardTitle>
            <CardDescription>
              Get instant loan decision using our RandomForest + SMOTE model with explainable AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePredict} disabled={isLoading} className="w-full bg-primary">
              {isLoading ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Processing Application...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {prediction && (
        <div className="space-y-6">
          {/* Prediction Result */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prediction Result</CardTitle>
                <Badge className={getPredictionColor(prediction.prediction)}>
                  {prediction.prediction === "approve" ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1" />
                  )}
                  {prediction.prediction.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                Application ID: {prediction.applicationId} • Model: {prediction.modelVersion}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                    {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Approve Probability</div>
                  <div className="text-2xl font-bold text-success">
                    {(prediction.probability.approve * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reject Probability</div>
                  <div className="text-2xl font-bold text-destructive">
                    {(prediction.probability.reject * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Model Confidence</span>
                  <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={prediction.confidence * 100} className="h-2" />
              </div>

              {/* Bank Suitability Display */}
              {prediction.bestBank && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    🏦
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Best-fit Bank Recommendation</div>
                    <div className="text-sm text-blue-700">
                      <span className="font-bold">{prediction.bestBank.bank_name}</span> – {prediction.bestBank.suitability} Suitability
                    </div>
                  </div>
                </div>
              )}

              {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-destructive mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Negative Factors (Risks)
                  </div>
                  <div className="space-y-1">
                    {prediction.riskFactors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                        <span>• {factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prediction.positiveFactors && prediction.positiveFactors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-success mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Positive Factors (Strengths)
                  </div>
                  <div className="space-y-1">
                    {prediction.positiveFactors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                        <span>• {factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Key Decision Factors */}
          {explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Key Decision Factors (Model + Rules Based)</span>
                </CardTitle>
                <CardDescription>Transparent breakdown of the decision logic</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="factors" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="factors">Decision Factors</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{explanation.explanation.summary}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Badge variant="outline">{explanation.explanation.riskAssessment.level.toUpperCase()} RISK BAND</Badge>
                      <span className="text-sm text-muted-foreground">Score: {explanation.explanation.riskAssessment.score}/100</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="factors" className="space-y-4">
                    <div className="space-y-3">
                      {explanation.explanation.topFactors && explanation.explanation.topFactors.map((factor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{factor.factor}</div>
                            <div className="text-xs text-muted-foreground">{factor.type === 'positive' ? 'Supporting Approval' : 'Contributing to Risk'}</div>
                          </div>
                          <Badge variant={factor.type === 'positive' ? 'default' : 'destructive'}>
                            {factor.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
