"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText } from "lucide-react"
import { SchemeModal } from "@/components/scheme-modal"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"



interface GovernmentSchemesProps {
    schemes: any[]
    applicationId?: string
    referenceData?: any
}

export function GovernmentSchemes({ schemes, applicationId, referenceData }: GovernmentSchemesProps) {
    const [selectedScheme, setSelectedScheme] = useState<any>(null)
    const [dbSchemes, setDbSchemes] = useState<any[]>([])

    useEffect(() => {
        if ((!schemes || schemes.length === 0) && applicationId) {
            supabase
                .from("scheme_recommendations")
                .select("*")
                .eq("application_id", applicationId)
                .order("created_at", { ascending: true })
                .then(({ data, error }) => {
                    if (!error && data) {
                        setDbSchemes(data)
                    }
                })
        }
    }, [applicationId, schemes])



    const activeSchemes = schemes?.length ? schemes : dbSchemes

    if (!activeSchemes || activeSchemes.length === 0) {

        return (
            <div className="text-center p-6 border rounded-lg bg-muted/20 border-dashed text-muted-foreground">
                No specific government schemes recommended for this profile currently.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recommended Government Schemes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSchemes.map((scheme: any, idx: number) => (
                    <div
                        key={idx}
                        className="p-3 bg-card rounded-lg border hover:border-primary/50 transition-all shadow-sm cursor-pointer group hover:bg-muted/50"
                        onClick={() => setSelectedScheme({
                            ...scheme,
                            // Robust matching: ID or Name
                            ...referenceData?.schemes?.find((s: any) =>
                                (s.id && s.id === scheme.scheme_id) ||
                                (s.name && s.name === scheme.scheme_name) ||
                                (s.scheme_name && s.scheme_name === scheme.scheme_name)
                            )
                        })}
                    >
                        <div className="font-semibold text-base group-hover:text-primary transition-colors flex items-center justify-between">
                            {scheme.scheme_name}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </div>
                        {scheme.reason && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {scheme.reason}
                            </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
                                View Details
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>

            {/* Internal Modal Handling */}
            <SchemeModal
                scheme={selectedScheme}
                isOpen={!!selectedScheme}
                onOpenChange={(open) => !open && setSelectedScheme(null)}
            />
        </div>
    )
}
