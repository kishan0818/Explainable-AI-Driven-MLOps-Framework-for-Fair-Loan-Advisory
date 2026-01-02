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
import { CheckCircle2, ExternalLink, FileText, IndianRupee, Info } from "lucide-react"

interface SchemeModalProps {
    scheme: any
    trigger?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

export function SchemeModal({ scheme, trigger, isOpen, onOpenChange }: SchemeModalProps) {
    if (!scheme) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            {scheme.category || "Government Scheme"}
                        </Badge>
                        {scheme.validity && <span className="text-xs text-muted-foreground">Valid till: {scheme.validity}</span>}
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight decoration-primary/20 underline decoration-2 underline-offset-4">
                        {scheme.name || scheme.scheme_name}
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        {scheme.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Section 1: Financials */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold flex items-center mb-2">
                                <IndianRupee className="w-4 h-4 mr-2 text-green-600" /> Loan & Subsidy
                            </h4>
                            <div className="text-sm space-y-2">
                                <p><strong>Max Amount:</strong> {scheme.eligibility?.loan_amount || "Refer to guidelines"}</p>
                                <p><strong>Subsidy:</strong> {scheme.subsidy_or_interest || "N/A"}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold flex items-center mb-2">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" /> Beneficiaries
                            </h4>
                            <p className="text-sm">
                                {scheme.eligibility?.beneficiaries || "See detailed criteria"}
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Eligibility Criteria */}
                    <div>
                        <h4 className="font-semibold text-lg mb-3">Eligibility Criteria</h4>
                        <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside text-sm text-muted-foreground">
                            {scheme.eligibility && Object.entries(scheme.eligibility).map(([key, value]: any, i: number) => {
                                if (key === 'loan_amount' || key === 'beneficiaries') return null; // Already shown
                                return (
                                    <li key={i} className="leading-snug">
                                        <span className="font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Section 3: Documents */}
                    {scheme.required_documents && (
                        <div>
                            <h4 className="font-semibold text-lg mb-3">Required Documents</h4>
                            <div className="flex flex-wrap gap-2">
                                {scheme.required_documents.map((doc: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1 font-normal text-sm">
                                        <FileText className="w-3 h-3 mr-2 opacity-50" /> {doc}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end">
                        {scheme.url && (
                            <Button asChild className="gap-2">
                                <a href={scheme.url} target="_blank" rel="noopener noreferrer">
                                    Visit Official Website <ExternalLink className="w-4 h-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
