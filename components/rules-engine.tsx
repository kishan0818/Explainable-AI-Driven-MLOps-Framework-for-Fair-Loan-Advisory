"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, Shield, Building2, Users, FileText, ExternalLink } from "lucide-react"

interface RulesAndSchemesEngineProps {
  referenceData?: any
}

export function RulesAndSchemesEngine({ referenceData }: RulesAndSchemesEngineProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  // Use passed referenceData or fallback (empty)
  const schemes = referenceData?.schemes || []
  // We can construct "Rules" from loan types or other data if available, 
  // or keeps using some static data if "Rules" aren't in reference-data yet.
  // For now, let's assume 'rules' might be in bank_data or we just show schemes + loan types acting as rules.

  const loanTypes = referenceData?.bank_data?.loan_types || []

  // Filter Logic
  const filteredSchemes = schemes.filter((s: any) =>
    s.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLoanTypes = loanTypes.filter((l: any) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "business": return <Building2 className="w-4 h-4" />
      case "housing": return <FileText className="w-4 h-4" />
      case "agriculture": return <Users className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search schemes, loan types, or eligibility rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="schemes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schemes">Government Schemes</TabsTrigger>
          <TabsTrigger value="rules">Loan Categories & Rules</TabsTrigger>
        </TabsList>

        {/* 1. Government Schemes Tab */}
        <TabsContent value="schemes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredSchemes.length > 0 ? filteredSchemes.map((scheme: any, idx: number) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => setSelectedItem({ ...scheme, type: 'scheme' })}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <CardTitle className="text-lg">{scheme.scheme_name}</CardTitle>
                    </div>
                    <Badge variant="outline">{scheme.category}</Badge>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">{scheme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Max: {scheme.max_amount}</span>
                    <Button variant="ghost" size="sm" className="h-6">Details <ExternalLink className="w-3 h-3 ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center p-8 text-muted-foreground col-span-2">No schemes found matching your search.</div>
            )}
          </div>
        </TabsContent>

        {/* 2. Rules / Loan Types Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {filteredLoanTypes.length > 0 ? filteredLoanTypes.map((loan: any, idx: number) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedItem({ ...loan, type: 'loan' })}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <CardTitle className="text-lg">{loan.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="uppercase">{loan.id.replace('_', ' ')}</Badge>
                  </div>
                  <CardDescription className="text-sm">{loan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Requires: {loan.documents_required?.slice(0, 3).join(", ")}...
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center p-8 text-muted-foreground">No loan rules found.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal / Slide-over */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedItem.type === 'scheme' ? <FileText className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-primary" />}
                  <CardTitle>{selectedItem.scheme_name || selectedItem.name}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}><XCircle className="w-5 h-5" /></Button>
              </div>
              <CardDescription>{selectedItem.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dynamic Content based on Type */}
              {selectedItem.type === 'scheme' ? (
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                    <div><span className="text-muted-foreground text-sm">Max Amount</span><div className="font-semibold">{selectedItem.max_amount}</div></div>
                    <div><span className="text-muted-foreground text-sm">Interest Subsidy</span><div className="font-semibold">{selectedItem.subsidy || "N/A"}</div></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Eligibility</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      {selectedItem.eligibility?.map((e: string, i: number) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Eligibility Criteria</h4>
                    <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-2">
                      {Object.entries(selectedItem.eligibility_criteria || {}).map(([k, v]: any, i) => (
                        <div key={i} className="flex justify-between border-b last:border-0 pb-1 last:pb-0 border-muted-foreground/10">
                          <span className="capitalize">{k.replace('_', ' ')}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Required Documents</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.documents_required?.map((d: string, i: number) => (
                        <Badge key={i} variant="secondary">{d}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedItem(null)}>Close Details</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Icon helper needed for button
function XCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
}
