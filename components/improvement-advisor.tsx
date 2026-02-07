import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowRight, Wallet, CreditCard, PieChart } from "lucide-react"

interface ImprovementRecommendation {
    recommendation_type: string
    current_value: number
    recommended_value: number
    message: string
}

interface ImprovementAdvisorProps {
    recommendations: ImprovementRecommendation[]
}

export function ImprovementAdvisor({ recommendations }: ImprovementAdvisorProps) {
    if (!recommendations || recommendations.length === 0) return null

    const getIcon = (type: string) => {
        switch (type) {
            case "increase_income":
                return <Wallet className="w-5 h-5 text-green-600" />
            case "improve_credit_score":
                return <CreditCard className="w-5 h-5 text-blue-600" />
            case "reduce_obligations":
                return <PieChart className="w-5 h-5 text-orange-600" />
            default:
                return <TrendingUp className="w-5 h-5 text-primary" />
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    return (
        <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">What Can I Improve?</CardTitle>
                        <p className="text-sm text-muted-foreground">Actionable steps to improve your approval chances</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-secondary/20 rounded-lg space-x-3 transition-colors hover:bg-secondary/40">
                        <div className="mt-1 bg-white p-1.5 rounded-full shadow-sm">
                            {getIcon(rec.recommendation_type)}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{rec.message}</p>
                            <div className="flex items-center mt-2 text-xs text-muted-foreground gap-2">
                                <span className="font-semibold text-red-500">
                                    Current: {rec.recommendation_type.includes("score") ? rec.current_value : formatCurrency(rec.current_value)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="font-semibold text-green-600">
                                    Target: {rec.recommendation_type.includes("score") ? rec.recommended_value : formatCurrency(rec.recommended_value)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
