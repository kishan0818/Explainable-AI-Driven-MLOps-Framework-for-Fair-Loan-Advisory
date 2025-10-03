import { type NextRequest, NextResponse } from "next/server"

interface AuditLog {
  id: string
  timestamp: string
  applicationId: string
  userId: string
  userRole: string
  action: string
  prediction: "approve" | "reject"
  confidence: number
  modelVersion: string
  shapValues: any[]
  rulesApplied: string[]
  schemesRecommended: string[]
  humanOverride?: {
    decision: "approve" | "reject"
    reason: string
    officer: string
  }
  complianceFlags: string[]
}

// Mock audit logs storage (in production, this would be a database)
const auditLogs: AuditLog[] = [
  {
    id: "AUDIT001",
    timestamp: "2024-01-20T14:30:00Z",
    applicationId: "APP001",
    userId: "user123",
    userRole: "applicant",
    action: "loan_prediction",
    prediction: "approve",
    confidence: 0.87,
    modelVersion: "RF_SMOTE_v1.2",
    shapValues: [
      { feature: "income", impact: 0.25 },
      { feature: "dtiRatio", impact: 0.15 },
    ],
    rulesApplied: ["RBI001", "RBI003"],
    schemesRecommended: [],
    complianceFlags: ["PSL_COMPLIANT", "KYC_VERIFIED"],
  },
  {
    id: "AUDIT002",
    timestamp: "2024-01-20T13:15:00Z",
    applicationId: "APP002",
    userId: "officer456",
    userRole: "loan_officer",
    action: "manual_review",
    prediction: "reject",
    confidence: 0.92,
    modelVersion: "RF_SMOTE_v1.2",
    shapValues: [
      { feature: "income", impact: -0.15 },
      { feature: "dtiRatio", impact: -0.25 },
    ],
    rulesApplied: ["RBI002"],
    schemesRecommended: ["MUDRA001", "PMAY001"],
    humanOverride: {
      decision: "reject",
      reason: "Insufficient income documentation",
      officer: "John Doe",
    },
    complianceFlags: ["DOCUMENTATION_INCOMPLETE"],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get("applicationId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredLogs = [...auditLogs]

    // Apply filters
    if (applicationId) {
      filteredLogs = filteredLogs.filter((log) => log.applicationId === applicationId)
    }
    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId)
    }
    if (startDate) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= startDate)
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= endDate)
    }

    // Sort by timestamp (newest first) and limit
    filteredLogs = filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        logs: filteredLogs,
        total: filteredLogs.length,
        summary: {
          totalPredictions: auditLogs.length,
          approvals: auditLogs.filter((log) => log.prediction === "approve").length,
          rejections: auditLogs.filter((log) => log.prediction === "reject").length,
          humanOverrides: auditLogs.filter((log) => log.humanOverride).length,
          complianceIssues: auditLogs.filter((log) =>
            log.complianceFlags.some((flag) => flag.includes("INCOMPLETE") || flag.includes("VIOLATION")),
          ).length,
        },
      },
    })
  } catch (error) {
    console.error("Audit log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const logEntry: Omit<AuditLog, "id" | "timestamp"> = await request.json()

    const newLog: AuditLog = {
      id: `AUDIT${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...logEntry,
    }

    // In production, save to database
    auditLogs.push(newLog)

    console.log(`[Audit] New log entry:`, {
      id: newLog.id,
      applicationId: newLog.applicationId,
      action: newLog.action,
      prediction: newLog.prediction,
    })

    return NextResponse.json({
      success: true,
      data: { id: newLog.id },
    })
  } catch (error) {
    console.error("Audit log creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
