"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, AlertTriangle, CheckCircle, BarChart3, Download, Eye, Zap } from "lucide-react"

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
      // Call prediction API
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      })

      const result = await response.json()
      if (result.success) {
        setPrediction(result.data)

        // Get SHAP explanation
        const explanationResponse = await fetch("/api/shap/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: result.data.applicationId,
            prediction: result.data.prediction,
            shapValues: result.data.shapValues,
          }),
        })

        const explanationResult = await explanationResponse.json()
        if (explanationResult.success) {
          setExplanation(explanationResult.data)
        }

        // Log audit trail
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: result.data.applicationId,
            userId: "current_user",
            userRole: "system",
            action: "loan_prediction",
            prediction: result.data.prediction,
            confidence: result.data.confidence,
            modelVersion: result.data.modelVersion,
            shapValues: result.data.shapValues,
            rulesApplied: ["RBI001", "RBI002"],
            schemesRecommended: result.data.recommendations,
            complianceFlags: ["PSL_COMPLIANT", "KYC_VERIFIED"],
          }),
        })

        onPredictionComplete?.(result.data)
      }
    } catch (error) {
      console.error("Prediction error:", error)
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
            <CardContent className="space-y-4">
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

              {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Risk Factors</div>
                  <div className="space-y-1">
                    {prediction.riskFactors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <AlertTriangle className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Recommendations</div>
                  <div className="space-y-1">
                    {prediction.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SHAP Explanation */}
          {explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>SHAP Explainability</span>
                </CardTitle>
                <CardDescription>Understand how each factor influenced the decision</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="factors">Key Factors</TabsTrigger>
                    <TabsTrigger value="visual">Visual Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{explanation.explanation.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        <Badge
                          variant={
                            explanation.explanation.riskAssessment.level === "low"
                              ? "default"
                              : explanation.explanation.riskAssessment.level === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {explanation.explanation.riskAssessment.level.toUpperCase()} RISK
                        </Badge>
                      </div>

                      {explanation.explanation.alternativeOptions && explanation.explanation.alternativeOptions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Alternative Schemes</h4>
                          <div className="space-y-2">
                            {explanation.explanation.alternativeOptions && explanation.explanation.alternativeOptions.map((option: any, index: number) => (
                              <div key={index} className="p-2 border rounded text-xs">
                                <div className="font-medium">{option.scheme}</div>
                                <div className="text-muted-foreground">{option.benefits}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="factors" className="space-y-4">
                    <div className="space-y-3">
                      {explanation.explanation.topFactors && explanation.explanation.topFactors.map((factor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm capitalize">{factor.factor}</div>
                            <div className="text-xs text-muted-foreground">{factor.explanation}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium">
                              {factor.impact > 0 ? "+" : ""}
                              {(factor.impact * 100).toFixed(1)}%
                            </div>
                            <div
                              className={`w-2 h-8 rounded ${factor.impact > 0 ? "bg-success" : "bg-destructive"}`}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="visual" className="space-y-4">
                    <div className="space-y-3">
                      {explanation.visualData && explanation.visualData.map((item: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-20 text-sm font-medium capitalize">{item.feature}</div>
                          <div className="flex-1 flex items-center space-x-2">
                            <div className="w-32 bg-muted rounded-full h-2 relative">
                              <div
                                className="absolute top-0 h-2 rounded-full"
                                style={{
                                  backgroundColor: item.color,
                                  width: `${Math.abs(item.shapValue) * 100}%`,
                                  left: item.shapValue < 0 ? `${50 + item.shapValue * 50}%` : "50%",
                                }}
                              ></div>
                            </div>
                            <div className="text-sm text-muted-foreground">{item.featureValue}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Audit Trail
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
