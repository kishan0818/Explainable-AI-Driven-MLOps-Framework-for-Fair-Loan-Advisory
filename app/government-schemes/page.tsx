"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Building2, Scale, Info, ExternalLink, ArrowRight } from "lucide-react"
import { SchemeModal } from "@/components/scheme-modal"
import { Navbar } from "@/components/navbar"

// Types
interface Scheme {
    id: string
    name: string
    category: string
    description: string
    eligibility?: any
    required_documents?: string[]
    url?: string
    validity?: string
    benefits?: string[]
    subsidy_or_interest?: string
}

interface Rule {
    id: string
    category: string
    description: string
    loan_types: string[]
    regulatory_source: string
    severity: string
    conditions: any[]
}

export default function GlobalSchemesPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [schemes, setSchemes] = useState<Scheme[]>([])
    const [rules, setRules] = useState<Rule[]>([])
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8000/reference-data")
                const data = await res.json()
                setSchemes(data.schemes || [])

                // Parse Rules: The backend returns "rules" object with "rules" array inside it
                const rawRules = data.rules?.detailed_rules || data.rules?.rules || []
                setRules(rawRules)
            } catch (error) {
                console.error("Failed to fetch reference data", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return <div className="p-8 text-center">Loading Knowledge Base...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar title="Government Schemes & Rules" userRole="Applicant" />

            <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in">

                {/* Back Button */}
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent -ml-2">
                    <Link href="/user/dashboard">
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
                    </Link>
                </Button>

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Government Schemes & Loan Rules</h1>
                    <p className="text-muted-foreground w-full max-w-2xl">
                        Explore official government schemes, subsidies, and regulatory guidelines for various loan categories.
                        <br />
                        <span className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                            * Information is for reference only. Eligibility is determined by lending institutions.
                        </span>
                    </p>
                </div>

                <Tabs defaultValue="schemes" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="schemes">Government Schemes</TabsTrigger>
                        <TabsTrigger value="rules">Loan Categories & Rules</TabsTrigger>
                    </TabsList>

                    {/* SCHEMES TAB */}
                    <TabsContent value="schemes" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schemes.map((scheme, idx) => (
                                <Card key={idx} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <Badge variant="outline" className="mb-2 w-fit">
                                                {scheme.category || "General"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg leading-tight">{scheme.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2">
                                            {scheme.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto pt-0">
                                        <Button
                                            variant="secondary"
                                            className="w-full mt-4 justify-between group"
                                            onClick={() => setSelectedScheme(scheme)}
                                        >
                                            View Details
                                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* RULES TAB */}
                    <TabsContent value="rules" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {rules.map((rule, idx) => (
                                <Card key={idx} className="border-l-4 border-l-primary/50">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="uppercase text-[10px]">
                                                {rule.category?.replace(/_/g, ' ')}
                                            </Badge>
                                            <Badge variant={rule.severity === 'hard' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                                                {rule.severity} Rule
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{rule.description}</CardTitle>
                                        <CardDescription>
                                            Source: {rule.regulatory_source}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted/30 p-3 rounded-md text-sm font-mono text-muted-foreground">
                                            APPLICABLE TO: {rule.loan_types?.join(", ").toUpperCase()} LOANS
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Shared Modal */}
                <SchemeModal
                    scheme={selectedScheme}
                    isOpen={!!selectedScheme}
                    onOpenChange={(open) => !open && setSelectedScheme(null)}
                />
            </div>
        </div>
    )
}
