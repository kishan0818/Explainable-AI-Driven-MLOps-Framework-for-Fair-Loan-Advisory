"use client"

import type React from "react"
import { Chatbot } from "@/components/chatbot"
import { ModelPrediction } from "@/components/model-integration"
import { NewApplicationForm } from "@/components/new-application-form"
import { RulesAndSchemesEngine } from "@/components/rules-engine"
import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  PlusCircle,
  BookOpen,
  User,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { useEffect, useCallback } from "react"

export default function UserDashboard() {
  const [view, setView] = useState<'list' | 'new' | 'detail' | 'rules'>('list')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [tempApp, setTempApp] = useState<any>(null) // Phase 3 Fix: Immediate Result

  const [applications, setApplications] = useState<any[]>([])
  const [referenceData, setReferenceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0 })
  const [userEmail, setUserEmail] = useState<string>("")

  // Fetch Logic
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || "")

      // Parallel Fetch: Apps + Reference Data
      const [appRes, refRes] = await Promise.all([
        supabase
          .from('loan_applications')
          .select(`
            *,
            analysis_results!analysis_results_application_id_fkey ( * ),
            bank_suitability ( bank_name, suitability, reason ),
            scheme_recommendations ( scheme_name, reason )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        fetch("http://127.0.0.1:8000/reference-data").then(r => r.json())
      ])

      if (appRes.error) throw appRes.error

      setReferenceData(refRes) // Store reference data (Banks, Schemes, Loan Types)

      const formattedApps = appRes.data?.map(app => {
        const analysis = app.analysis_results?.[0]
        const mlProb = analysis?.ml_probability ?? 0.5
        const prediction = mlProb > 0.5 ? 'approve' : 'reject'

        return {
          id: app.id,
          displayId: app.id.slice(0, 8).toUpperCase(),
          type: app.loan_type?.replace('_', ' ') || 'Loan',
          amount: typeof app.loan_amount === 'number' ? `₹${app.loan_amount.toLocaleString()}` : app.loan_amount,
          status: prediction,
          submittedDate: new Date(app.created_at).toLocaleDateString(),

          // Full Data for Detail View
          fullData: {
            application_id: app.id,
            loan_type: app.loan_type, // Crucial for Context Lookup
            prediction: prediction,
            confidence: mlProb > 0.5 ? mlProb : (1 - mlProb),
            risk_band: analysis?.risk_band || 'medium',
            risk_score: analysis?.risk_score || 50,
            negative_factors: analysis?.negative_factors || [],
            positive_factors: analysis?.positive_factors || [],
            decision_summary: analysis?.decision_summary,
            bank_suitability: app.bank_suitability || [],
            schemes_suggested: app.scheme_recommendations || []
          }
        }
      }) || []

      setApplications(formattedApps)

      // Calculate Stats
      const total = formattedApps.length
      const approved = formattedApps.filter(a => a.status === 'approve').length
      const rejected = formattedApps.filter(a => a.status === 'reject').length
      setStats({ total, approved, rejected })

    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Navigation Handlers
  const handleViewDetail = (appId: string) => {
    setSelectedAppId(appId)
    setView('detail')
  }

  const handleCreateNew = () => {
    setView('new')
  }

  const handleBack = () => {
    setView('list')
    setSelectedAppId(null)
    setTempApp(null) // Clear temp result
  }

  // UPDATED: Immediate Result Flow
  const handleCreationSuccess = (newResult: any) => {
    // Set the temporary result directly to show immediately
    setTempApp(newResult)
    setView('detail')

    // Refresh list in background so it's there when they go back
    fetchDashboardData()
  }

  // --- Render Views ---

  if (view === 'new') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="New Application" userRole="Applicant" />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">New Loan Application</h1>
            <Button variant="ghost" onClick={handleBack}>Cancel</Button>
          </div>
          <NewApplicationForm onPredictionComplete={handleCreationSuccess} />
        </div>
      </div>
    )
  }

  if (view === 'rules') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Rules Engine" userRole="Applicant" />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Rules & Schemes Reference</h1>
            <Button variant="ghost" onClick={handleBack}>Back to Dashboard</Button>
          </div>
          <RulesAndSchemesEngine referenceData={referenceData} />
        </div>
      </div>
    )
  }

  if (view === 'detail') {
    // Phase 3 Fix: Use tempApp if available (immediate result), else find in list
    const selectedApp = tempApp || applications.find(a => a.id === selectedAppId)
    // Normalize data: tempApp is raw result, list item might be wrapper with fullData
    const resultToRender = selectedApp?.fullData || selectedApp

    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Advisor Analysis" userRole="Applicant" />
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={handleBack}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold mt-2">{resultToRender?.loan_type || 'Application'} Review</h1>
            </div>
            <Button onClick={handleCreateNew}>Start New Application</Button>
          </div>

          {resultToRender ? (
            <ModelPrediction
              initialResult={resultToRender}
              mode="view"
              referenceData={referenceData} // Pass Global Context
            />
          ) : (
            <div className="text-center p-8">Loading application details...</div>
          )}
        </div>
      </div>
    )
  }


  // List View (Default)
  return (
    <div className="min-h-screen bg-background">
      <Navbar title="My Dashboard" userRole="Applicant" />
      <div className="p-6 max-w-6xl mx-auto space-y-8">

        {/* Header Stats */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Track your applications and explore schemes.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setView('rules')} variant="outline">
              <BookOpen className="w-4 h-4 mr-2" /> View Rules
            </Button>
            <Button onClick={handleCreateNew} className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
              <PlusCircle className="w-4 h-4 mr-2" /> New Application
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total</div>
              <div className="text-3xl font-bold mt-2">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 border-l-4 border-l-success">
              <div className="text-success text-sm font-medium uppercase tracking-wider">Approved</div>
              <div className="text-3xl font-bold mt-2">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 border-l-4 border-l-destructive">
              <div className="text-destructive text-sm font-medium uppercase tracking-wider">Rejected</div>
              <div className="text-3xl font-bold mt-2">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading applications...</div>
            ) : applications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mb-4 text-muted-foreground">No applications submitted yet.</div>
                  <Button onClick={handleCreateNew}>Submit your first application</Button>
                </CardContent>
              </Card>
            ) : (
              applications.map(app => (
                <Card
                  key={app.id}
                  className="hover:shadow-md transition-all cursor-pointer group border-l-4 items-center"
                  style={{ borderLeftColor: app.status === 'approve' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                  onClick={() => handleViewDetail(app.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {app.status === 'approve' ? <CheckCircle className="text-success" /> : <XCircle className="text-destructive" />}
                      </div>
                      <div>
                        <div className="font-semibold text-lg capitalize">{app.type}</div>
                        <div className="text-sm text-muted-foreground">ID: {app.displayId} • {app.submittedDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-bold">{app.amount}</div>
                        <Badge variant={app.status === 'approve' ? 'default' : 'destructive'}>
                          {app.status === 'approve' ? 'APPROVED' : 'REJECTED'}
                        </Badge>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

