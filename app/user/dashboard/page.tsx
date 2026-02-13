"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Chatbot } from "@/components/chatbot"
import { PlusCircle, Loader2, ArrowRight, Wallet, Building2, CheckCircle2, AlertTriangle, XCircle, Eye, BookOpen } from "lucide-react"
import { NewApplicationForm } from "@/components/new-application-form"
import { ModelPrediction } from "@/components/model-integration"
import { RulesAndSchemesEngine } from "@/components/rules-engine"

export default function UserDashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'list' | 'new' | 'rules' | 'detail'>('list')
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [referenceData, setReferenceData] = useState<any>(null)
  const [tempApp, setTempApp] = useState<any | null>(null) // State for immediate result after creation
  const [stats, setStats] = useState({ total: 0, eligible: 0, review: 0 })

  const fetchDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserEmail(user.email || "")

    try {
      setIsLoading(true)
      // Parallel Fetch: Apps + Reference Data
      const [appRes, refRes] = await Promise.all([
        supabase
          .from('loan_applications')
          .select(`
              *,
              analysis_results ( * ),
              bank_suitability ( * ),
              scheme_recommendations ( * )
            `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        fetch("http://localhost:8000/reference-data").then(r => r.json())
      ])

      if (appRes.error) throw appRes.error

      setReferenceData(refRes) // Store reference data (Banks, Schemes, Loan Types)

      const formattedApps = appRes.data?.map(app => {
        // Handle both Array (1:N) and Object (1:1) responses from Supabase
        let analysis = null;
        if (Array.isArray(app.analysis_results)) {
          analysis = app.analysis_results[0];
        } else if (app.analysis_results) {
          analysis = app.analysis_results;
        }

        // DEBUG: Log analysis to find missing risk_score
        if (analysis) {
          console.log(`[Dashboard] App ${app.id.slice(0, 4)} Analysis Raw:`, analysis)
        } else {
          console.log(`[Dashboard] App ${app.id.slice(0, 4)} Analysis Missing! (Raw: ${JSON.stringify(app.analysis_results)})`)
        }

        // STRICT: Source of truth is DB.
        // Status is app.status (which includes Bank Suitability logic from backend).
        // Confidence is analysis.ml_probability (exact value).

        const finalStatus = app.status || 'processed'

        // Display Logic (Visual mapping)
        let displayStatus = 'Needs Improvement' // Default fallback
        // Check "Good" conditions: Approved OR Low Risk OR High Score
        if (finalStatus === 'approve' || (analysis?.risk_score !== undefined && analysis.risk_score <= 40)) {
          displayStatus = 'Eligible'
        }
        // If unknown status, 'Analysis Complete' is safe default for UI badge.

        return {
          id: app.id,
          displayId: app.id.slice(0, 8).toUpperCase(),
          type: app.loan_type?.replace('_', ' ') || 'Loan',
          amount: typeof app.loan_amount === 'number' ? `₹${app.loan_amount.toLocaleString()}` : app.loan_amount,
          status: finalStatus, // Internal status
          displayStatus: displayStatus, // UI Badge Text only
          submittedDate: new Date(app.created_at).toLocaleDateString(),
          schemeCount: app.scheme_recommendations?.length || 0,

          // Full Data for Detail View (Modal)
          // STRICT MAPPING: Must match AnalysisResult interface bit-for-bit
          fullData: {
            applicationId: app.id,
            loanType: app.loan_type,
            prediction: app.status,
            ml_probability: analysis?.ml_probability,
            riskBand: analysis?.risk_band,
            riskScore: analysis?.risk_score,

            // Structured Factors
            riskFactors: (analysis?.negative_factors ?? []).map((f: any) =>
              typeof f === 'string' ? { factor: f, feature: 'unknown', impact: 'medium', direction: 'negative' } : f
            ),
            positiveFactors: (analysis?.positive_factors ?? []).map((f: any) =>
              typeof f === 'string' ? { factor: f, feature: 'unknown', impact: 'medium', direction: 'positive' } : f
            ),
            decisionSummary: analysis?.decision_summary,

            // Sub-tables
            banks: app.bank_suitability ?? [],
            schemes: app.scheme_recommendations ?? [],
            improvementRecommendations: app.improvement_recommendations ?? []
          }
        }
      }) || []

      setApplications(formattedApps)

      // Stats
      setStats({
        total: formattedApps.length,
        eligible: formattedApps.filter(a => a.status === 'approve' || (a.fullData.riskScore !== undefined && a.fullData.riskScore !== null && a.fullData.riskScore <= 40)).length,
        review: formattedApps.filter(a => a.status !== 'approve' && (a.fullData.riskScore === undefined || a.fullData.riskScore === null || a.fullData.riskScore > 40)).length
      })

    } catch (e: any) {
      // console.error("Error fetching dashboard data", e) // Clean logs
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleCreationSuccess = (newApp: any) => {
    setTempApp(newApp) // Show the Result View immediately
    fetchDashboardData() // Refresh list in bg
  }

  const handleBack = () => {
    setTempApp(null)
    setSelectedApp(null)
    setView('list')
  }

  const handleViewDetail = (app: any) => {
    setSelectedApp(app)
    setView('detail')
  }

  const getStatusBadge = (status: string, riskBand?: string) => {
    // Priority: Check specific status strings first
    if (status === 'Eligible' || status === 'approve') {
      return <Badge className="bg-success hover:bg-success/90 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Eligible</Badge>
    }

    // Needs Improvement (Orange)
    if (status.includes('Improvement') || status === 'reject') {
      return <Badge className="bg-warning hover:bg-warning/90 text-black gap-1"><AlertTriangle className="w-3 h-3" /> Needs Improvement</Badge>
    }

    // Fallback based on risk band if status is generic
    if (riskBand) {
      const band = riskBand.toLowerCase()
      if (band === 'low') return <Badge className="bg-success hover:bg-success/90 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Eligible</Badge>
      if (band === 'medium' || band === 'high') return <Badge className="bg-warning hover:bg-warning/90 text-black gap-1"><AlertTriangle className="w-3 h-3" /> Needs Improvement</Badge>
    }

    return <Badge variant="secondary">{status}</Badge>
  }

  // Immediate Result View (Full Page as mostly distinct flow)
  if (tempApp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Application Review" userRole="Applicant" />
        <div className="w-full px-4 md:px-6 space-y-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4 pl-0 hover:bg-transparent mt-5">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
          </Button>
          <ModelPrediction initialResult={tempApp} mode="view" referenceData={referenceData} />
        </div>
        <Chatbot />
      </div>
    )
  }

  // Detail View (Full Page)
  if (view === 'detail' && selectedApp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Application Details" userRole="Applicant" />
        <div className="w-full px-4 md:px-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" onClick={handleBack} className="mb-2 pl-0 hover:bg-transparent mt-5">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold capitalize">{selectedApp.type} Application</h1>
              <p className="text-muted-foreground">ID: {selectedApp.displayId} • Submitted on {selectedApp.submittedDate}</p>
            </div>
            {getStatusBadge(selectedApp.status, selectedApp.fullData.risk_band)}
          </div>

          <ModelPrediction
            initialResult={selectedApp.fullData}
            mode="view"
            referenceData={referenceData}
          />
        </div>
        <Chatbot />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="My Dashboard" userRole="Applicant" />
      <div className="w-full px-4 md:px-6 space-y-8 animate-in fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mt-6">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Track your applications and explore schemes.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/government-schemes">
                <BookOpen className="w-4 h-4 mr-2" /> View Government Rules & Schemes
              </Link>
            </Button>
            <Button onClick={() => setView('new')}>
              <PlusCircle className="w-4 h-4 mr-2" /> New Application
            </Button>
          </div>
        </div>

        {view === 'rules' ? (
          <div className="space-y-6 mt-5">
            <Button variant="ghost" onClick={() => setView('list')} className="pl-0"><ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard</Button>
            <RulesAndSchemesEngine referenceData={referenceData} />
          </div>
        ) : view === 'new' ? (
          <div className="space-y-6 mt-5">
            <Button variant="ghost" onClick={() => setView('list')} className="pl-0"><ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard</Button>
            <NewApplicationForm onPredictionComplete={handleCreationSuccess} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">TOTAL APPLICATIONS</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
              </Card>
              <Card className="border-l-4 border-l-success shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-success">ELIGIBLE</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.eligible}</div></CardContent>
              </Card>
              <Card className="border-l-4 border-l-warning shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-warning-foreground">NEEDS IMPROVEMENT</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.review}</div></CardContent>
              </Card>
            </div>

            {/* Application List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
              {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : applications.length > 0 ? (
                <div className="grid gap-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="group flex flex-col md:flex-row items-center justify-between p-4 bg-card border rounded-lg hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleViewDetail(app)}
                    >
                      {/* Left Side: Details */}
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                          {app.type.toLowerCase().includes('home') ? <Building2 className="w-5 h-5" /> :
                            app.type.toLowerCase().includes('agriculture') ? <Wallet className="w-5 h-5" /> :
                              <Wallet className="w-5 h-5" />}
                        </div>
                        <div className="min-w-[150px]">
                          <div className="font-semibold text-lg capitalize">{app.type}</div>
                          <div className="text-sm text-muted-foreground font-mono">{app.displayId}</div>
                        </div>
                        <div className="hidden md:block h-8 w-[1px] bg-border mx-2"></div>
                        <div className="font-semibold text-lg text-foreground/80 min-w-[100px]">
                          {app.amount}
                        </div>
                        {/* Scheme Indicator */}
                        {app.schemeCount > 0 && (
                          <Badge variant="outline" className="ml-4 bg-primary/5 text-primary border-primary/20 gap-1 hidden md:inline-flex">
                            <Building2 className="w-3 h-3" /> {app.schemeCount} Schemes
                          </Badge>
                        )}
                      </div>

                      {/* Right Side: Status and Action */}
                      <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                        {getStatusBadge(app.displayStatus)}
                        <Button variant="outline" size="sm" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Details <Eye className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 border rounded-lg bg-muted/20 border-dashed">
                  <h3 className="text-lg font-medium">No applications found</h3>
                  <p className="text-muted-foreground mb-4">Start your first loan application to see AI recommendations</p>
                  <Button onClick={() => setView('new')}>Start New Application</Button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <Chatbot />
    </div>
  )
}
