"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, FileText, Shield, Info, Wallet } from "lucide-react"

interface LoanTypeModalProps {
    loan: any
    trigger?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

export function LoanTypeModal({ loan, trigger, isOpen, onOpenChange }: LoanTypeModalProps) {
    if (!loan) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wide">
                            {loan.id?.replace(/_/g, ' ') || "Loan Category"}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        {loan.name}
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        {loan.description || "Detailed information about this loan category."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Section 1: Overview Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold flex items-center mb-2">
                                <Info className="w-4 h-4 mr-2 text-blue-600" /> Best Suited For
                            </h4>
                            <p className="text-sm text-muted-foreground">{loan.best_for || "General purpose financing"}</p>
                        </div>
                        <div className="p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold flex items-center mb-2">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Key Features
                            </h4>
                            <ul className="text-sm list-disc list-inside text-muted-foreground">
                                <li>Competitive interest rates</li>
                                <li>Flexible repayment tenure</li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 2: Eligibility Criteria */}
                    <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center"><Shield className="w-5 h-5 mr-2" /> Eligibility Criteria</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            {loan.eligibility_criteria && Object.entries(loan.eligibility_criteria).map(([key, value]: any, i: number) => (
                                <div key={i} className="flex flex-col border p-3 rounded-lg bg-card">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Documents */}
                    {loan.documents_required && (
                        <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center"><FileText className="w-5 h-5 mr-2" /> Required Documents</h4>
                            <div className="flex flex-wrap gap-2">
                                {loan.documents_required.map((doc: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-2 text-sm font-normal border bg-muted/50">
                                        {doc}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end">
                        <Button onClick={() => onOpenChange?.(false)}>Close Details</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
