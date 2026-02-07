"use client"

import { Building2 } from "lucide-react"

interface RulesAndSchemesEngineProps {
  referenceData?: any
}

export function RulesAndSchemesEngine({ referenceData }: RulesAndSchemesEngineProps) {
  return (
    <div className="text-center p-12 border rounded-lg bg-muted/20 border-dashed animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-center mb-4">
        <Building2 className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Schemes are Contextual</h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        Government schemes and eligibility rules are matched specifically to your profile.
        <br /><br />
        Please <strong>submit a loan application</strong> to view personalized scheme recommendations and eligibility gaps.
      </p>
    </div>
  )
}

// Icon helper needed for button
function XCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
}
