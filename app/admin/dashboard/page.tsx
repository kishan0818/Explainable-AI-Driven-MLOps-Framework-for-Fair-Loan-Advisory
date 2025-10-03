"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Lock,
  Unlock,
} from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { AdvancedAnalytics } from "@/components/advanced-analytics"

export default function AdminDashboard() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Mock data
  const systemStats = {
    totalUsers: 1247,
    activeOfficers: 23,
    totalApplications: 5643,
    systemUptime: 99.8,
    modelAccuracy: 87.2,
    avgProcessingTime: 2.3,
  }

  const recentAlerts = [
    { id: 1, type: "warning", message: "Model accuracy dropped below 85%", time: "2 hours ago" },
    { id: 2, type: "info", message: "System maintenance scheduled", time: "4 hours ago" },
    { id: 3, type: "error", message: "Database connection timeout", time: "6 hours ago" },
  ]

  if (selectedSection === "users") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="User Management" userRole="Administrator" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">User Management</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <UserManagement />
          </div>
        </div>
      </div>
    )
  }

  if (selectedSection === "system") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="System Settings" userRole="Administrator" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">System Settings</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <SystemSettings />
          </div>
        </div>
      </div>
    )
  }

  if (selectedSection === "analytics") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Advanced Analytics" userRole="Administrator" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Advanced Analytics</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
             <LocalAdvancedAnalytics userRole="admin" />
          </div>
        </div>
      </div>
    )
  }

  if (selectedSection === "model") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Model Monitoring" userRole="Administrator" />
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Model Monitoring</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <ModelMonitoring />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Administrator Dashboard" userRole="Administrator" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance mb-2">Administrator Dashboard</h1>
            <p className="text-muted-foreground text-pretty">
              Monitor system performance, manage users, and oversee AI model operations.
            </p>
          </div>

          {/* System Health Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.activeOfficers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalApplications.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{systemStats.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{systemStats.modelAccuracy}%</div>
                <p className="text-xs text-muted-foreground">Current performance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.avgProcessingTime}s</div>
                <p className="text-xs text-muted-foreground">Per application</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Recent Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-warning" />}
                      {alert.type === "error" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                      {alert.type === "info" && <CheckCircle className="w-4 h-4 text-primary" />}
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("users")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>Manage users, roles, and permissions</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("system")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Settings className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-lg">System Settings</CardTitle>
                  <CardDescription>Configure system parameters</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("analytics")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advanced Analytics</CardTitle>
                  <CardDescription>Deep insights and reporting</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => setSelectedSection("model")}
            >
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-lg">Model Monitoring</CardTitle>
                  <CardDescription>AI model performance tracking</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// User Management Component
function UserManagement() {
  const users = [
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      role: "User",
      status: "Active",
      lastLogin: "2024-01-20",
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@example.com",
      role: "Officer",
      status: "Active",
      lastLogin: "2024-01-20",
    },
    { id: 3, name: "Admin User", email: "admin@example.com", role: "Admin", status: "Active", lastLogin: "2024-01-20" },
    { id: 4, name: "Test User", email: "test@example.com", role: "User", status: "Inactive", lastLogin: "2024-01-15" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button className="bg-primary">Add New User</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={user.role === "Admin" ? "default" : user.role === "Officer" ? "secondary" : "outline"}
                  >
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                    {user.status === "Active" ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {user.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">{user.lastLogin}</div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// System Settings Component
function SystemSettings() {
  const [settings, setSettings] = useState({
    autoApproval: false,
    emailNotifications: true,
    maintenanceMode: false,
    dataRetention: 365,
    maxLoanAmount: 5000000,
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="model">Model Config</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto Approval</div>
                  <div className="text-sm text-muted-foreground">
                    Enable automatic loan approvals for high-confidence predictions
                  </div>
                </div>
                <Switch
                  checked={settings.autoApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoApproval: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Send email alerts for system events</div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Maintenance Mode</div>
                  <div className="text-sm text-muted-foreground">Temporarily disable new applications</div>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="30" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="5" />
                </div>
              </div>
              <Button className="bg-primary">Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>Configure AI model parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Confidence Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    defaultValue="0.8"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model Version</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>RF_SMOTE_v1.2</option>
                    <option>RF_SMOTE_v1.1</option>
                    <option>RF_SMOTE_v1.0</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Deploy New Model
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>Manage system backups and data recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Backup Frequency</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Retention Period (days)</label>
                  <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="90" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-primary">Create Backup Now</Button>
                <Button variant="outline">Restore from Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Advanced Analytics Component (Local)
function LocalAdvancedAnalytics({ userRole }) {
  const performanceData = [
    { date: "2024-01-01", accuracy: 85.2, precision: 82.1, recall: 83.5, f1Score: 82.8 },
    { date: "2024-01-02", accuracy: 86.1, precision: 83.2, recall: 84.1, f1Score: 83.6 },
    { date: "2024-01-03", accuracy: 87.3, precision: 84.5, recall: 85.2, f1Score: 84.8 },
    { date: "2024-01-04", accuracy: 86.8, precision: 83.9, recall: 84.7, f1Score: 84.3 },
    { date: "2024-01-05", accuracy: 87.2, precision: 84.1, recall: 85.0, f1Score: 84.5 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Trends</CardTitle>
            <CardDescription>Daily performance metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" name="Accuracy" />
                <Line type="monotone" dataKey="precision" stroke="#10b981" name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#f59e0b" name="Recall" />
                <Line type="monotone" dataKey="f1Score" stroke="#ef4444" name="F1-Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Resource Usage</CardTitle>
            <CardDescription>Current system resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>54%</span>
              </div>
              <Progress value={54} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage Usage</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Network I/O</span>
                <span>23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Model Monitoring Component
function ModelMonitoring() {
  const modelMetrics = [
    { name: "Accuracy", current: 87.2, target: 85.0, trend: "up" },
    { name: "Precision", current: 84.1, target: 82.0, trend: "up" },
    { name: "Recall", current: 85.0, target: 83.0, trend: "stable" },
    { name: "F1-Score", current: 84.5, target: 82.5, trend: "up" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modelMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.current}%</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Target: {metric.target}%</span>
                {metric.trend === "up" && <TrendingUp className="w-3 h-3 text-success" />}
                {metric.trend === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
                {metric.trend === "stable" && <Activity className="w-3 h-3 text-warning" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Deployment History</CardTitle>
          <CardDescription>Recent model versions and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <div className="font-medium">RF_SMOTE_v1.2</div>
                  <div className="text-sm text-muted-foreground">Deployed 2 days ago</div>
                </div>
              </div>
              <div className="text-sm">
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">RF_SMOTE_v1.1</div>
                  <div className="text-sm text-muted-foreground">Deployed 1 week ago</div>
                </div>
              </div>
              <div className="text-sm">
                <Badge variant="outline">Archived</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
