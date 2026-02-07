import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ShieldCheck } from "lucide-react"

interface ConfidenceMeterProps {
    score: number
}

export function ConfidenceMeter({ score }: ConfidenceMeterProps) {
    // Color logic
    let colorClass = "[&_[data-slot=progress-indicator]]:bg-red-500"
    if (score >= 80) colorClass = "[&_[data-slot=progress-indicator]]:bg-green-500"
    else if (score >= 50) colorClass = "[&_[data-slot=progress-indicator]]:bg-yellow-500"

    return (
        <div className="flex items-center space-x-3 p-3 bg-secondary/10 rounded-lg border">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">AI Confidence</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3 h-3 text-muted-foreground/70" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Indicates how reliable this analysis is based on the data you provided. Fill more optional fields to increase confidence.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <span className="text-sm font-bold">{score}%</span>
                </div>
                <Progress value={score} className={`h-2 ${colorClass}`} />
            </div>
        </div>
    )
}
