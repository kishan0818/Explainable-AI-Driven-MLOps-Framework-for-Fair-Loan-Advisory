"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

export default function OfficerDashboard() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Mock data for applications
  const applications = [
    {
      id: "APP001",
      applicantName: "Rajesh Kumar",
      loanType: "Home Loan",
      amount: "₹25,00,000",
      status: "pending",
      modelResult: "Approve",
      modelConfidence: 0.87,
      priority: "high",
      submittedDate: "2024-01-20",
    },
    {
      id: "APP002",
      applicantName: "Priya Sharma",
      loanType: "Personal Loan",
      amount: "₹5,00,000",
      status: "pending",
      modelResult: "Reject",
      modelConfidence: 0.92,
      priority: "medium",
      submittedDate: "2024-01-19",
    },
    {
      id: "APP003",
      applicantName: "Amit Patel",
      loanType: "Business Loan",
      amount: "₹10,00,000",
      status: "approved",
      modelResult: "Approve",
      modelConfidence: 0.78,
      priority: "high",
      submittedDate: "2024-01-18",
    },
    {
      id: "APP004",
      applicantName: "Sunita Gupta",
      loanType: "Education Loan",
      amount: "₹3,00,000",
      status: "rejected",
      modelResult: "Reject",
      modelConfidence: 0.95,
      priority: "low",
      submittedDate: "2024-01-17",
    },
  ]

  const handleApprove = (appId: string) => {
    alert(`Application ${appId} approved`)
  }

  const handleReject = (appId: string) => {
    alert(`Application ${appId} rejected`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground"
      case "rejected":
        return "bg-destructive text-destructive-foreground"
      case "pending":
        return "bg-warning text-warning-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-success text-success-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getModelResultColor = (result: string) => {
    return result === "Approve" ? "text-success" : "text-destructive"
  }

  if (selectedSection === "applications") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Applications Management" userRole="Loan Officer" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Loan Applications</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>

            <div className="grid gap-4">
              {applications
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 }
                  return (
                    priorityOrder[b.priority as keyof typeof priorityOrder] -
                    priorityOrder[a.priority as keyof typeof priorityOrder]
                  )
                })
                .map((app, index) => (
                  <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{app.applicantName}</CardTitle>
                            <CardDescription>
                              {app.id} • {app.loanType} • {app.submittedDate}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(app.priority)}>{app.priority.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(app.status)}>{app.status.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <div className="font-medium">{app.amount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Model Result:</span>
                          <div className={`font-medium ${getModelResultColor(app.modelResult)}`}>{app.modelResult}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <div className="font-medium">{(app.modelConfidence * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium capitalize">{app.status}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Model Confidence</span>
                          <span>{(app.modelConfidence * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={app.modelConfidence * 100} className="h-2" />
                      </div>

                      {app.status === "pending" && (
                        <div className="flex space-x-2 pt-2">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApprove(app.id)}
                            disabled={app.modelResult === "Reject" && app.modelConfidence > 0.8}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(app.id)}
                            disabled={app.modelResult === "Approve" && app.modelConfidence > 0.8}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">
                            View SHAP Analysis
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedSection === "analytics") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Analytics Dashboard" userRole="Loan Officer" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Analytics & Insights</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <AnalyticsDashboard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Loan Officer Dashboard" userRole="Loan Officer" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance mb-2">Loan Officer Dashboard</h1>
            <p className="text-muted-foreground text-pretty">
              Review applications, analyze model predictions, and make informed lending decisions.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">2</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">1</div>
                <p className="text-xs text-muted-foreground">+20% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">87.2%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹43L</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("applications")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">Applications</CardTitle>
                  <CardDescription>Review and process loan applications</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>2 Pending</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>1 Approved</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span>1 Rejected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("analytics")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">Analytics</CardTitle>
                  <CardDescription>View performance metrics and insights</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span>87% Accuracy</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-primary" />
                    <span>156 Processed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  // Mock data for charts
  const approvalRatioData = [
    { month: "Jan", approved: 65, rejected: 35 },
    { month: "Feb", approved: 72, rejected: 28 },
    { month: "Mar", approved: 68, rejected: 32 },
    { month: "Apr", approved: 75, rejected: 25 },
    { month: "May", approved: 71, rejected: 29 },
    { month: "Jun", approved: 78, rejected: 22 },
  ]

  const confidenceVsOverrideData = [
    { confidence: "0.5-0.6", modelDecision: 45, humanOverride: 55 },
    { confidence: "0.6-0.7", modelDecision: 62, humanOverride: 38 },
    { confidence: "0.7-0.8", modelDecision: 78, humanOverride: 22 },
    { confidence: "0.8-0.9", modelDecision: 89, humanOverride: 11 },
    { confidence: "0.9-1.0", modelDecision: 95, humanOverride: 5 },
  ]

  const loanTypeDistribution = [
    { name: "Home Loan", value: 45, color: "#3b82f6" },
    { name: "Personal Loan", value: 25, color: "#10b981" },
    { name: "Business Loan", value: 20, color: "#f59e0b" },
    { name: "Education Loan", value: 10, color: "#ef4444" },
  ]

  const modelPerformanceData = [
    { metric: "Accuracy", value: 87.2, target: 85 },
    { metric: "Precision", value: 82.1, target: 80 },
    { metric: "Recall", value: 83.3, target: 82 },
    { metric: "F1-Score", value: 82.7, target: 81 },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modelPerformanceData.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}%</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Target: {metric.target}%</span>
                {metric.value >= metric.target ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-warning" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval Ratios Over Time</CardTitle>
            <CardDescription>Monthly approval vs rejection rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={approvalRatioData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Confidence vs Human Override</CardTitle>
            <CardDescription>Decision alignment by confidence level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceVsOverrideData}>
                <XAxis dataKey="confidence" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="modelDecision" stroke="#3b82f6" name="Model Decision" />
                <Line type="monotone" dataKey="humanOverride" stroke="#f59e0b" name="Human Override" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Type Distribution</CardTitle>
            <CardDescription>Breakdown by loan categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={loanTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {loanTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest application decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">APP001 - Rajesh Kumar</span>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm">APP004 - Sunita Gupta</span>
                </div>
                <span className="text-xs text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm">APP002 - Priya Sharma</span>
                </div>
                <span className="text-xs text-muted-foreground">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
