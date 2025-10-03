"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Download, RefreshCw } from "lucide-react"

interface AnalyticsProps {
  userRole: "user" | "officer" | "admin"
}

export function AdvancedAnalytics({ userRole }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d")
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for different analytics
  const modelPerformanceData = [
    { date: "2024-01-15", accuracy: 86.8, precision: 83.5, recall: 84.2, f1Score: 83.8, predictions: 45 },
    { date: "2024-01-16", accuracy: 87.1, precision: 83.9, recall: 84.6, f1Score: 84.2, predictions: 52 },
    { date: "2024-01-17", accuracy: 86.9, precision: 83.7, recall: 84.4, f1Score: 84.0, predictions: 38 },
    { date: "2024-01-18", accuracy: 87.3, precision: 84.2, recall: 84.8, f1Score: 84.5, predictions: 61 },
    { date: "2024-01-19", accuracy: 87.0, precision: 84.0, recall: 84.7, f1Score: 84.3, predictions: 47 },
    { date: "2024-01-20", accuracy: 87.2, precision: 84.1, recall: 85.0, f1Score: 84.5, predictions: 55 },
  ]

  const loanVolumeData = [
    { month: "Aug", volume: 2.3, approved: 1.8, rejected: 0.5 },
    { month: "Sep", volume: 2.8, approved: 2.1, rejected: 0.7 },
    { month: "Oct", volume: 3.2, approved: 2.4, rejected: 0.8 },
    { month: "Nov", volume: 2.9, approved: 2.2, rejected: 0.7 },
    { month: "Dec", volume: 3.5, approved: 2.7, rejected: 0.8 },
    { month: "Jan", volume: 4.1, approved: 3.2, rejected: 0.9 },
  ]

  const riskDistributionData = [
    { risk: "Low Risk", count: 156, percentage: 45, color: "#10b981" },
    { risk: "Medium Risk", count: 134, percentage: 38, color: "#f59e0b" },
    { risk: "High Risk", count: 58, percentage: 17, color: "#ef4444" },
  ]

  const featureImportanceData = [
    { feature: "Income", importance: 0.23, description: "Monthly income of applicant" },
    { feature: "DTI Ratio", importance: 0.19, description: "Debt-to-income ratio" },
    { feature: "Loan Amount", importance: 0.16, description: "Requested loan amount" },
    { feature: "Age", importance: 0.12, description: "Age of applicant" },
    { feature: "Employment", importance: 0.11, description: "Employment type and stability" },
    { feature: "Credit History", importance: 0.09, description: "Past credit behavior" },
    { feature: "Loan Type", importance: 0.07, description: "Category of loan" },
    { feature: "Collateral", importance: 0.03, description: "Security provided" },
  ]

  const confidenceDistribution = [
    { range: "0.5-0.6", count: 23, modelDecision: 18, humanOverride: 5 },
    { range: "0.6-0.7", count: 45, modelDecision: 38, humanOverride: 7 },
    { range: "0.7-0.8", count: 78, modelDecision: 71, humanOverride: 7 },
    { range: "0.8-0.9", count: 134, modelDecision: 128, humanOverride: 6 },
    { range: "0.9-1.0", count: 67, modelDecision: 65, humanOverride: 2 },
  ]

  const schemeUtilizationData = [
    { scheme: "MUDRA", applications: 89, approved: 67, utilization: 75 },
    { scheme: "PMAY", applications: 45, approved: 38, utilization: 84 },
    { scheme: "Stand-Up India", applications: 23, approved: 19, utilization: 83 },
    { scheme: "NABARD", applications: 34, approved: 28, utilization: 82 },
  ]

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
              {entry.name.includes("Rate") || entry.name.includes("Accuracy") ? "%" : ""}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="schemes">Scheme Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Model Performance Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">87.2%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +0.3% from last week
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">84.1%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +0.2% from last week
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">85.0%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +0.4% from last week
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">F1-Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">84.5%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +0.3% from last week
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Daily model performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={modelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[80, 90]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy" strokeWidth={2} />
                    <Line type="monotone" dataKey="precision" stroke="#3b82f6" name="Precision" strokeWidth={2} />
                    <Line type="monotone" dataKey="recall" stroke="#f59e0b" name="Recall" strokeWidth={2} />
                    <Line type="monotone" dataKey="f1Score" stroke="#ef4444" name="F1-Score" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Importance */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
                <CardDescription>Impact of each feature on model decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 0.25]} />
                    <YAxis dataKey="feature" type="category" width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="importance" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Confidence vs Override Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Model Confidence vs Human Override</CardTitle>
              <CardDescription>Analysis of decision alignment by confidence level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confidenceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="modelDecision" stackId="a" fill="#10b981" name="Model Decision Followed" />
                  <Bar dataKey="humanOverride" stackId="a" fill="#ef4444" name="Human Override" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          {/* Business Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹4.1Cr</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +17% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">78%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +2% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">2.3s</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="w-3 h-3 mr-1 text-success" />
                  -0.2s from last month
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Loan Volume Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Volume Trends</CardTitle>
                <CardDescription>Monthly loan application and approval volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={loanVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Total Volume (Cr)"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.8}
                      name="Approved (Cr)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Distribution of applications by risk category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          {/* Risk Analysis */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">58</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="w-3 h-3 mr-1 text-success" />
                  -12% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Default Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">2.3%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="w-3 h-3 mr-1 text-success" />
                  -0.5% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Risk Score Avg</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">6.7</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="w-3 h-3 mr-1" />
                  Stable
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">94%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +1% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Factors</CardTitle>
              <CardDescription>Most common factors contributing to loan rejections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { factor: "High DTI Ratio", impact: 34, trend: "up" },
                  { factor: "Insufficient Income", impact: 28, trend: "down" },
                  { factor: "Poor Credit History", impact: 22, trend: "stable" },
                  { factor: "Inadequate Documentation", impact: 16, trend: "down" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="font-medium">{item.factor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{item.impact}% of rejections</span>
                      {item.trend === "up" && <TrendingUp className="w-3 h-3 text-destructive" />}
                      {item.trend === "down" && <TrendingDown className="w-3 h-3 text-success" />}
                      {item.trend === "stable" && <Activity className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schemes" className="space-y-6">
          {/* Government Schemes Analytics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Schemes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Active schemes</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheme Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">191</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +23% this month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">81%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +5% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">79%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  +3% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheme Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Scheme Utilization Analysis</CardTitle>
              <CardDescription>Performance of different government loan schemes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schemeUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scheme" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                  <Bar dataKey="approved" fill="#10b981" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scheme Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Scheme Performance</CardTitle>
              <CardDescription>Comprehensive analysis of scheme effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schemeUtilizationData.map((scheme, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-primary">{scheme.scheme.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{scheme.scheme}</div>
                        <div className="text-sm text-muted-foreground">
                          {scheme.approved}/{scheme.applications} applications approved
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Utilization Rate</div>
                        <div className="font-bold text-lg">{scheme.utilization}%</div>
                      </div>
                      <Badge
                        variant={
                          scheme.utilization > 80 ? "default" : scheme.utilization > 70 ? "secondary" : "outline"
                        }
                      >
                        {scheme.utilization > 80 ? "Excellent" : scheme.utilization > 70 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
