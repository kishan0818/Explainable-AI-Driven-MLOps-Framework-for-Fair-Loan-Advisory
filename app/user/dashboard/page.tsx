"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0 })

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

        fetch("http://127.0.0.1:8000/reference-data").then(r => r.json())
      ])

      if (appRes.error) throw appRes.error

      setReferenceData(refRes) // Store reference data (Banks, Schemes, Loan Types)

      const formattedApps = appRes.data?.map(app => {
        const analysis = app.analysis_results?.[0]

        // STRICT: Source of truth is DB.
        // Status is app.status (which includes Bank Suitability logic from backend).
        // Confidence is analysis.ml_probability (exact value).

        const finalStatus = app.status || 'processed'

        // Display Logic only (Visual mapping, not data changing)
        let displayStatus = 'Needs Review'
        if (finalStatus === 'approve') displayStatus = 'Approved'
        if (finalStatus === 'reject') displayStatus = 'Rejected'
        // If technical reject but low risk (rare), keep rejected. 
        // If unknown status, 'Needs Review' is safe default for UI badge.

        return {
          id: app.id,
          displayId: app.id.slice(0, 8).toUpperCase(),
          type: app.loan_type?.replace('_', ' ') || 'Loan',
          amount: typeof app.loan_amount === 'number' ? `₹${app.loan_amount.toLocaleString()}` : app.loan_amount,
          status: finalStatus, // Internal status
          displayStatus: displayStatus, // UI Badge Text only
          submittedDate: new Date(app.created_at).toLocaleDateString(),

          // Full Data for Detail View (Modal)
          fullData: {
            application_id: app.id,
            loan_type: app.loan_type,
            prediction: app.status, // APPROVE / REJECT FROM DB
            // STRICT: Use DB field name exactly, no renaming
            ml_probability: analysis?.ml_probability ?? null,
            risk_band: analysis?.risk_band,
            risk_score: analysis?.risk_score,
            negative_factors: analysis?.negative_factors ?? [],
            positive_factors: analysis?.positive_factors ?? [],
            decision_summary: analysis?.decision_summary,

            // Pass persisted sub-tables directly
            bank_suitability: app.bank_suitability ?? [],
            scheme_recommendations: app.scheme_recommendations ?? [],
          }
        }
      }) || []

      setApplications(formattedApps)

      // Stats
      setStats({
        total: formattedApps.length,
        approved: formattedApps.filter(a => a.displayStatus === 'Approved').length,
        rejected: formattedApps.filter(a => a.displayStatus !== 'Approved').length
      })

    } catch (e: any) {
      console.error("Error fetching dashboard data", e)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-success hover:bg-success/90 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>
      case 'Rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>
      case 'Needs Review':
        return <Badge className="bg-warning hover:bg-warning/90 text-black gap-1"><AlertTriangle className="w-3 h-3" /> Needs Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Immediate Result View (Full Page as mostly distinct flow)
  if (tempApp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Application Review" userRole="Applicant" />
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4 pl-0 hover:bg-transparent">
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
        <div className="container mx-auto p-6 max-w-5xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" onClick={handleBack} className="mb-2 pl-0 hover:bg-transparent">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold capitalize">{selectedApp.type} Application</h1>
              <p className="text-muted-foreground">ID: {selectedApp.displayId} • Submitted on {selectedApp.submittedDate}</p>
            </div>
            {getStatusBadge(selectedApp.displayStatus)}
          </div>

          <ModelPrediction
            initialResult={{
              ...selectedApp.fullData,
              application_id: selectedApp.id
            }}
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
      <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Track your applications and explore schemes.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setView('rules')}>
              <BookOpen className="w-4 h-4 mr-2" /> View Government Rules & Schemes
            </Button>
            <Button onClick={() => setView('new')}>
              <PlusCircle className="w-4 h-4 mr-2" /> New Application
            </Button>
          </div>
        </div>

        {view === 'rules' ? (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setView('list')} className="pl-0"><ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard</Button>
            <RulesAndSchemesEngine referenceData={referenceData} />
          </div>
        ) : view === 'new' ? (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setView('list')} className="pl-0"><ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard</Button>
            <NewApplicationForm onPredictionComplete={handleCreationSuccess} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">TOTAL</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
              </Card>
              <Card className="border-l-4 border-l-success shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-success">APPROVED</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.approved}</div></CardContent>
              </Card>
              <Card className="border-l-4 border-l-destructive shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive">REJECTED / REVIEW</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats.rejected}</div></CardContent>
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
