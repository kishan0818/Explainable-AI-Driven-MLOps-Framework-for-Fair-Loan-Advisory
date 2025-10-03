"use client"

import type React from "react"
import { Chatbot } from "@/components/chatbot"
import { ModelPrediction } from "@/components/model-integration"
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

export default function UserDashboard() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Mock data for applications
  const applications = [
    {
      id: "APP001",
      type: "Home Loan",
      amount: "₹25,00,000",
      status: "approved",
      progress: 100,
      submittedDate: "2024-01-15",
    },
    {
      id: "APP002",
      type: "Personal Loan",
      amount: "₹5,00,000",
      status: "under-review",
      progress: 60,
      submittedDate: "2024-01-20",
    },
    {
      id: "APP003",
      type: "Business Loan",
      amount: "₹10,00,000",
      status: "rejected",
      progress: 100,
      submittedDate: "2024-01-10",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground"
      case "rejected":
        return "bg-destructive text-destructive-foreground"
      case "under-review":
        return "bg-warning text-warning-foreground"
      case "waiting-list":
        return "bg-primary text-primary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      case "under-review":
        return <Clock className="w-4 h-4" />
      case "waiting-list":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const dashboardOptions = [
    {
      id: "track",
      title: "Track Application",
      description: "Monitor your loan application progress",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-primary/10 text-primary",
    },
    {
      id: "new",
      title: "New Application",
      description: "Submit a new loan application",
      icon: <PlusCircle className="w-6 h-6" />,
      color: "bg-accent/10 text-accent",
    },
    {
      id: "rules",
      title: "Rules & Schemes Engine",
      description: "Explore RBI rules and government schemes",
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-success/10 text-success",
    },
    {
      id: "profile",
      title: "Profile",
      description: "Update your personal details",
      icon: <User className="w-6 h-6" />,
      color: "bg-warning/10 text-warning",
    },
    {
      id: "status",
      title: "Application Status",
      description: "View detailed application status",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-destructive/10 text-destructive",
    },
  ]

  if (selectedSection === "track") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Track Application" userRole="Loan Applicant" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Application Tracking</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>

            <div className="grid gap-6">
              {applications.map((app) => (
                <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{app.type}</CardTitle>
                        <CardDescription>Application ID: {app.id}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(app.status)}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1 capitalize">{app.status.replace("-", " ")}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-2 font-medium">{app.amount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="ml-2 font-medium">{app.submittedDate}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{app.progress}%</span>
                      </div>
                      <Progress value={app.progress} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex space-x-2 text-xs text-muted-foreground">
                        <span>Submitted</span>
                        <span>→</span>
                        <span>Under Review</span>
                        <span>→</span>
                        <span>Decision</span>
                      </div>
                      {app.status === "approved" && (
                        <Button size="sm" variant="outline">
                          Download SHAP Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Chatbot />
      </div>
    )
  }

  if (selectedSection === "new") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="New Application" userRole="Loan Applicant" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">New Loan Application</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <NewApplicationForm />
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Tips</CardTitle>
                    <CardDescription>Improve your chances of approval</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="font-medium text-sm text-success">Income Documentation</div>
                      <div className="text-xs text-muted-foreground">
                        Provide 6 months of salary slips and bank statements
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="font-medium text-sm text-primary">DTI Ratio</div>
                      <div className="text-xs text-muted-foreground">Keep debt-to-income ratio below 40%</div>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="font-medium text-sm text-warning">Loan Amount</div>
                      <div className="text-xs text-muted-foreground">
                        Consider starting with a smaller amount for better approval chances
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Chatbot />
      </div>
    )
  }

  if (selectedSection === "rules") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Rules & Schemes Engine" userRole="Loan Applicant" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Rules & Schemes Engine</h1>
              <Button variant="outline" onClick={() => setSelectedSection(null)}>
                Back to Dashboard
              </Button>
            </div>
            <RulesAndSchemesEngine />
          </div>
        </div>
        <Chatbot />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="User Dashboard" userRole="Loan Applicant" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance mb-2">Welcome to Your Dashboard</h1>
            <p className="text-muted-foreground text-pretty">
              Manage your loan applications and explore available schemes and rules.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardOptions.map((option) => (
              <Card
                key={option.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                onClick={() => setSelectedSection(option.id)}
              >
                <CardHeader className="text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${option.color} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">1</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">1</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

// Enhanced New Application Form Component with AI Integration
function NewApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    income: "",
    loanType: "",
    loanAmount: "",
    interestRate: "",
    employmentType: "salaried",
  })

  const [showPrediction, setShowPrediction] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPrediction(true)
  }

  const handlePredictionComplete = (result: any) => {
    // Handle prediction result
    console.log("Prediction completed:", result)
    // Could redirect to application status or show success message
  }

  if (showPrediction) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Submitted</CardTitle>
            <CardDescription>Your application is being processed by our AI system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.loanType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium">₹{Number(formData.loanAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="ml-2 font-medium">₹{Number(formData.income).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ModelPrediction
          applicationData={{
            name: formData.name,
            age: Number(formData.age),
            income: Number(formData.income),
            loanAmount: Number(formData.loanAmount),
            loanType: formData.loanType,
            employmentType: formData.employmentType,
          }}
          onPredictionComplete={handlePredictionComplete}
        />

        <Button variant="outline" onClick={() => setShowPrediction(false)} className="w-full">
          Submit Another Application
        </Button>
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Loan Application Form</CardTitle>
        <CardDescription>Fill in your details to apply for a loan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Income (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.income}
                onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Employment Type</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                required
              >
                <option value="salaried">Salaried</option>
                <option value="self-employed">Self Employed</option>
                <option value="business">Business Owner</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Type</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.loanType}
                onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                required
              >
                <option value="">Select loan type</option>
                <option value="home">Home Loan</option>
                <option value="personal">Personal Loan</option>
                <option value="business">Business Loan</option>
                <option value="education">Education Loan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.loanAmount}
                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Interest Rate (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
            Submit Application & Get AI Prediction
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Rules and Schemes Engine Component
function RulesAndSchemesEngine() {
  const [showChatbot, setShowChatbot] = useState(false)

  const schemes = [
    {
      name: "MUDRA Loan",
      description: "Micro Units Development & Refinance Agency loans for small businesses",
      eligibility: "Small business owners, entrepreneurs",
      maxAmount: "₹10 lakhs",
    },
    {
      name: "NABARD Schemes",
      description: "National Bank for Agriculture and Rural Development financing",
      eligibility: "Agricultural and rural development projects",
      maxAmount: "Varies",
    },
    {
      name: "PMAY",
      description: "Pradhan Mantri Awas Yojana for affordable housing",
      eligibility: "First-time home buyers, EWS/LIG/MIG categories",
      maxAmount: "₹12 lakhs subsidy",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>RBI/PSL Guidelines</CardTitle>
            <CardDescription>Reserve Bank of India Priority Sector Lending rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">Agriculture Lending</h4>
              <p className="text-xs text-muted-foreground">Minimum 18% of ANBC for agriculture sector</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">MSME Lending</h4>
              <p className="text-xs text-muted-foreground">7.5% of ANBC for micro enterprises</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">Housing Loans</h4>
              <p className="text-xs text-muted-foreground">Up to ₹35 lakhs in metropolitan areas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Government Schemes</CardTitle>
            <CardDescription>Available loan schemes and subsidies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schemes.map((scheme, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{scheme.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{scheme.description}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Max: {scheme.maxAmount}</span>
                    <Button size="sm" variant="outline" className="h-6 text-xs bg-transparent">
                      Learn More
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowChatbot(!showChatbot)}
          className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>

        {showChatbot && (
          <Card className="absolute bottom-16 right-0 w-80 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI Assistant</CardTitle>
              <CardDescription className="text-xs">Ask about schemes and loan terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-32 bg-muted rounded p-2 text-xs overflow-y-auto">
                <div className="mb-2">
                  <strong>Assistant:</strong> Hello! I can help you understand loan schemes and eligibility criteria.
                  What would you like to know?
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="flex-1 px-2 py-1 text-xs border rounded"
                />
                <Button size="sm" className="text-xs">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
