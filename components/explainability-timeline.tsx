import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

interface Factor {
    factor: string
    impact: string
}

interface ExplainabilityTimelineProps {
    positiveFactors: Factor[]
    negativeFactors: Factor[]
}

export function ExplainabilityTimeline({ positiveFactors, negativeFactors }: ExplainabilityTimelineProps) {
    return (
        <div className="space-y-4">
            {/* Positive Factors */}
            {positiveFactors.length > 0 && (
                <div className="relative border-l-2 border-green-200 ml-3 space-y-4 pb-2">
                    {positiveFactors.map((factor, idx) => (
                        <div key={`pos-${idx}`} className="relative pl-6">
                            <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                                <Check className="h-2 w-2 text-green-700" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-900">{factor.factor}</span>
                                <span className="text-xs text-green-700/80">Helped your application</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Negative Factors */}
            {negativeFactors.length > 0 && (
                <div className="relative border-l-2 border-red-200 ml-3 space-y-4 pt-2">
                    {negativeFactors.map((factor, idx) => (
                        <div key={`neg-${idx}`} className="relative pl-6">
                            <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                                <X className="h-2 w-2 text-red-700" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-red-900">{factor.factor}</span>
                                <span className="text-xs text-red-700/80">Hurt your application</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {positiveFactors.length === 0 && negativeFactors.length === 0 && (
                <div className="text-sm text-muted-foreground pl-3">No specific factors influenced this decision strongly.</div>
            )}
        </div>
    )
}
