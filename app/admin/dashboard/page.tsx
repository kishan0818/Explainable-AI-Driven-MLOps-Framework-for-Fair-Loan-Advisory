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
import { Loader2, Shield, Activity, FileText, Server, AlertTriangle } from "lucide-react"

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [regLogs, setRegLogs] = useState<any[]>([])
    const [mlopsLogs, setMlopsLogs] = useState<any[]>([])
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

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

            } catch (err: any) {
                console.error("Dashboard Error:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

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
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                            <p className="text-xs text-muted-foreground">Last Updated: {new Date(stats?.last_updated).toLocaleTimeString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Logs */}
                <Tabs defaultValue="regulatory" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="regulatory">Regulatory Audit Logs</TabsTrigger>
                        <TabsTrigger value="mlops">MLOps Lifecycle Logs</TabsTrigger>
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
                </Tabs>
            </main>
        </div>
    )
}
