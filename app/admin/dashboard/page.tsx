"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Shield, Activity, FileText, Server, AlertTriangle, Terminal, Star, CheckCircle, Scale, Clock, Award } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [regLogs, setRegLogs] = useState<any[]>([])
    const [mlopsLogs, setMlopsLogs] = useState<any[]>([])
    const [humanEvalStats, setHumanEvalStats] = useState<any>(null)
    const [overrideForm, setOverrideForm] = useState({
        applicationId: "",
        decision: "APPROVED",
        justification: "",
        officerId: "senior_credit_officer"
    })
    const [overrideSubmitting, setOverrideSubmitting] = useState(false)
    const [overrideResult, setOverrideResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check for local admin token first
                const adminToken = localStorage.getItem("admin_token")
                const adminUser = localStorage.getItem("admin_user")

                let token: string

                if (adminToken && adminUser) {
                    // Local admin login
                    token = adminToken
                } else {
                    // Regular Supabase user
                    const { data: { session } } = await supabase.auth.getSession()

                    if (!session) {
                        router.push("/admin/login")
                        return
                    }

                    token = session.access_token
                }

                const headers = {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000"

                // 1. Fetch Stats
                const statsRes = await fetch(`${apiUrl}/admin/stats`, { headers })
                if (statsRes.status === 403) throw new Error("Access Denied: Admin Privileges Required")
                if (!statsRes.ok) throw new Error("Failed to fetch system stats")
                setStats(await statsRes.json())

                // 2. Fetch Regulatory Logs
                const regRes = await fetch(`${apiUrl}/admin/logs/regulatory`, { headers })
                if (regRes.ok) {
                    const data = await regRes.json()
                    setRegLogs(data.logs || [])
                }

                // 3. Fetch MLOps Logs
                const mlopsRes = await fetch(`${apiUrl}/admin/logs/mlops`, { headers })
                if (mlopsRes.ok) {
                    const data = await mlopsRes.json()
                    setMlopsLogs(data.logs || [])
                }

                // 4. Fetch Human Evaluation & Governance Stats (PDF Section 8)
                const humanRes = await fetch(`${apiUrl}/admin/human-eval/stats`, { headers })
                if (humanRes.ok) {
                    const hData = await humanRes.json()
                    setHumanEvalStats(hData)
                }

            } catch (err: any) {
                console.error("Dashboard Error:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    const handleLoanOverrideSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!overrideForm.applicationId || !overrideForm.justification) return
        setOverrideSubmitting(true)
        setOverrideResult(null)
        try {
            const adminToken = localStorage.getItem("admin_token")
            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            }
            if (adminToken) {
                headers["Authorization"] = `Bearer ${adminToken}`
            }
            const apiUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000"
            const res = await fetch(`${apiUrl}/admin/approval/loan-override`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    application_id: overrideForm.applicationId,
                    reviewer_id: overrideForm.officerId,
                    override_decision: overrideForm.decision,
                    justification: overrideForm.justification,
                    mitigating_factors: ["Officer Audit Review", "Credit Governance Approved"]
                })
            })
            if (!res.ok) throw new Error("Failed to record override decision")
            const result = await res.json()
            setOverrideResult({ success: true, message: `Application ${overrideForm.applicationId} ${overrideForm.decision} successfully.` })
            setOverrideForm({ applicationId: "", decision: "APPROVED", justification: "", officerId: "senior_credit_officer" })
        } catch (err: any) {
            setOverrideResult({ success: false, message: err.message || "Override submission failed" })
        } finally {
            setOverrideSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        // Auto-redirect to login if access denied
        if (error.includes("Access Denied") || error.includes("403") || error.includes("401")) {
            // Optional: Add a small delay or just redirect immediately
            // For better UX, show the error briefly or just bounce them.
            // Let's show the error with a login button.
        }

        return (
            <div className="min-h-screen bg-background">
                <Navbar title="Admin Dashboard" userRole="Admin" />
                <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[80vh]">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => router.push("/user/dashboard")}
                            className="text-sm text-primary hover:underline"
                        >
                            Return to User Dashboard
                        </button>
                        <Button
                            onClick={() => router.push("/admin/login")}
                            variant="default"
                        >
                            Login as Admin
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar title="Admin MLOps Dashboard" userRole="System Admin" />

            <main className="container mx-auto p-6 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Governance</h1>
                        <p className="text-muted-foreground">Real-time monitoring of Model Performance, Fairness, and Compliance.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge variant={stats?.drift_alerts > 0 ? "destructive" : "outline"} className="px-3 py-1">
                            Drift Alerts: {stats?.drift_alerts ?? 0}
                        </Badge>
                        <Badge variant={stats?.fairness_alerts > 0 ? "destructive" : "outline"} className="px-3 py-1">
                            Fairness Alerts: {stats?.fairness_alerts ?? 0}
                        </Badge>
                        <Badge variant={stats?.security_alerts > 0 ? "destructive" : "outline"} className="px-3 py-1">
                            Security Alerts: {stats?.security_alerts ?? 0}
                        </Badge>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Active Model</CardTitle>
                            <Activity className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.active_model}</div>
                            <p className="text-xs text-muted-foreground">Version: {stats?.version}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Regulatory Status</CardTitle>
                            <Shield className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">Active</div>
                            <p className="text-xs text-muted-foreground">RBI/PSL Compliance Monitored</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{regLogs.length > 0 ? new Date(regLogs[0].timestamp).toLocaleDateString() : 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                                {regLogs.length > 0 ? `${regLogs[0].changes_detected} Changes Detected` : "No recent audits"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
                            <Server className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Online</div>
                            <p className="text-xs text-muted-foreground">Last Updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'N/A'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">LLM Telemetry (Langfuse)</CardTitle>
                            <Terminal className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.llm_requests ?? 0} Queries</div>
                            <p className="text-xs text-muted-foreground">Avg Latency: {stats?.avg_latency ?? "0.0s"}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Latency Percentiles</CardTitle>
                            <Clock className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">P95: {stats?.p95_latency ?? "0.0s"}</div>
                            <p className="text-xs text-muted-foreground">P50: {stats?.p50_latency ?? "0.0s"} | P99: {stats?.p99_latency ?? "0.0s"}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Agreement & Error Rate</CardTitle>
                            <Scale className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-blue-500">
                                {Math.round((humanEvalStats?.inter_annotator_agreement ?? 1.0) * 100)}% Match
                            </div>
                            <p className="text-xs text-muted-foreground">Error Rate: {stats?.error_rate_percent ?? 0}%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Logs & Governance */}
                <Tabs defaultValue="regulatory" className="space-y-4">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
                        <TabsTrigger value="regulatory">Regulatory Audit Logs</TabsTrigger>
                        <TabsTrigger value="mlops">MLOps Lifecycle Logs</TabsTrigger>
                        <TabsTrigger value="human-eval">Human Evaluation Rubrics</TabsTrigger>
                        <TabsTrigger value="loan-override">Loan Override (HITL)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="regulatory" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Regulatory Intelligence Audit Trail</CardTitle>
                                <CardDescription>Records of automated checks against `schemes.json` and `rules.json`.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full overflow-auto max-h-[500px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Source File</TableHead>
                                                <TableHead>Changes</TableHead>
                                                <TableHead>Hash</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {regLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center">No logs found.</TableCell>
                                                </TableRow>
                                            ) : (
                                                regLogs.map((log, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                                        <TableCell className="font-medium">{log.event_type}</TableCell>
                                                        <TableCell>{log.source_file}</TableCell>
                                                        <TableCell>
                                                            {log.changes_detected > 0 ?
                                                                <Badge variant="destructive">{log.details}</Badge> :
                                                                <span className="text-muted-foreground">No Changes</span>
                                                            }
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{log.new_hash?.substring(0, 8)}...</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mlops" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>MLOps Production Logs</CardTitle>
                                <CardDescription>Model transitions, retraining events, and operational alerts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full overflow-auto max-h-[500px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Event Type</TableHead>
                                                <TableHead>Model Version</TableHead>
                                                <TableHead>Message</TableHead>
                                                <TableHead>Metadata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mlopsLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center">No logs found.</TableCell>
                                                </TableRow>
                                            ) : (
                                                mlopsLogs.map((log, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{log.event_type}</Badge>
                                                        </TableCell>
                                                        <TableCell>{log.model_version}</TableCell>
                                                        <TableCell>{log.message}</TableCell>
                                                        <TableCell className="font-mono text-xs truncate max-w-[200px]">
                                                            {JSON.stringify(log.metadata)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Human Evaluation & Rubrics Tab (PDF Section 8) */}
                    <TabsContent value="human-eval" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Human Evaluation & Agreement Metrics</CardTitle>
                                        <CardDescription>Multi-annotator evaluation scores across 7 quality dimensions and inter-annotator consistency.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-sm px-3 py-1">
                                        Overall Score: {humanEvalStats?.overall_quality_score ?? "5.0"} / 5.0
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {humanEvalStats?.average_scores && Object.entries(humanEvalStats.average_scores).map(([rubric, score]: any) => (
                                        <div key={rubric} className="p-4 rounded-lg border bg-card">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium capitalize">{rubric.replace("_", " ")}</span>
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            </div>
                                            <div className="text-2xl font-bold">{score} <span className="text-xs text-muted-foreground font-normal">/ 5.0</span></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 rounded-lg border bg-muted/40 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h4 className="font-semibold text-sm">Inter-Annotator Agreement Rate</h4>
                                        <p className="text-xs text-muted-foreground">Proportion of matching judgments across dual human reviewers within +/-1 point.</p>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {Math.round((humanEvalStats?.inter_annotator_agreement ?? 1.0) * 100)}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Human Loan Override Tab (PDF Section 1: Human Approval & Section 13) */}
                    <TabsContent value="loan-override" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Human-in-the-Loop Loan Override</CardTitle>
                                <CardDescription>Authorize manual exception or reversal for high-risk or borderline loan applications under RBI fair lending governance.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLoanOverrideSubmit} className="space-y-4 max-w-xl">
                                    {overrideResult && (
                                        <Alert variant={overrideResult.success ? "default" : "destructive"}>
                                            {overrideResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                            <AlertTitle>{overrideResult.success ? "Success" : "Error"}</AlertTitle>
                                            <AlertDescription>{overrideResult.message}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Application ID</label>
                                        <Input
                                            placeholder="e.g. APP-10293"
                                            value={overrideForm.applicationId}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, applicationId: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Override Decision</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={overrideForm.decision}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, decision: e.target.value })}
                                        >
                                            <option value="APPROVED">APPROVE (Override Rejection)</option>
                                            <option value="REJECTED">REJECT (Override Approval)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Credit Officer Justification (Mandatory)</label>
                                        <Textarea
                                            placeholder="Specify mitigating factors, additional collateral, co-signer evaluation, or regulatory exception reasoning..."
                                            value={overrideForm.justification}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, justification: e.target.value })}
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" disabled={overrideSubmitting}>
                                        {overrideSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Submit Official Override Decision
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
