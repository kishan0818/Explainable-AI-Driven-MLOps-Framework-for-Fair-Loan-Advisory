import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export function ScenarioSimulator() {
    const [income, setIncome] = useState([50000])
    const [loanAmount, setLoanAmount] = useState([500000])
    const [isSimulating, setIsSimulating] = useState(false)
    const [result, setResult] = useState<{ chance: number, message: string, color: string } | null>(null)

    const handleSimulate = () => {
        setIsSimulating(true)
        setResult(null)

        setTimeout(() => {
            // Simple logic: Loan <= 5x Annual Income is safe
            const monthlyIncome = income[0]
            const requestedLoan = loanAmount[0]
            const annualIncome = monthlyIncome * 12

            // Calculate a "Safe Limit"
            const safeLimit = annualIncome * 5

            // Ratio
            let chance = 0
            if (safeLimit >= requestedLoan) {
                // High chance area
                // e.g. safe = 30L, req = 10L -> factor = 3. 
                // Normalize to 70-98%
                const headroom = (safeLimit - requestedLoan) / safeLimit
                chance = 70 + (headroom * 25)
            } else {
                // Low chance area
                const deficit = (requestedLoan - safeLimit) / requestedLoan
                chance = 70 - (deficit * 50)
            }

            // Cap
            chance = Math.min(Math.max(chance, 10), 98)
            const finalChance = Math.round(chance)

            let message = ""
            let color = ""

            if (finalChance >= 75) {
                message = "High probability of approval! Your income comfortably supports this loan amount."
                color = "text-green-600"
            } else if (finalChance >= 40) {
                message = "Moderate chance. You might need a co-signer or a longer tenure."
                color = "text-amber-600"
            } else {
                message = "Low probability. Consider reducing the loan amount or adding income sources."
                color = "text-red-600"
            }

            setResult({
                chance: finalChance,
                message,
                color
            })
            setIsSimulating(false)
        }, 1500)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    return (
        <Card className="border-2 border-dashed border-primary/20 shadow-sm bg-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Loan Simulator</CardTitle>
                        <CardDescription>See how changing numbers affects your chances</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <label className="text-sm font-medium">Monthly Income</label>
                        <span className="text-sm font-bold text-primary">{formatCurrency(income[0])}</span>
                    </div>
                    <Slider
                        defaultValue={[50000]}
                        max={300000}
                        step={1000}
                        value={income}
                        onValueChange={setIncome}
                        className="cursor-pointer"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between">
                        <label className="text-sm font-medium">Loan Amount</label>
                        <span className="text-sm font-bold text-primary">{formatCurrency(loanAmount[0])}</span>
                    </div>
                    <Slider
                        defaultValue={[500000]}
                        max={5000000}
                        step={50000}
                        value={loanAmount}
                        onValueChange={setLoanAmount}
                        className="cursor-pointer"
                    />
                </div>

                <Button onClick={handleSimulate} className="w-full" disabled={isSimulating}>
                    {isSimulating ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Simulating...
                        </>
                    ) : (
                        "Run Simulation"
                    )}
                </Button>

                {/* Result Area */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 p-4 bg-background rounded-lg border shadow-sm text-center">
                        <div className="flex justify-center mb-2">
                            {result.chance >= 75 ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : result.chance >= 40 ? (
                                <Zap className="w-8 h-8 text-amber-500" />
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            )}
                        </div>
                        <div className="text-3xl font-bold mb-1">{result.chance}%</div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-2">Estimated Approval Chance</div>
                        <p className={`text-sm font-medium ${result.color}`}>
                            {result.message}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
