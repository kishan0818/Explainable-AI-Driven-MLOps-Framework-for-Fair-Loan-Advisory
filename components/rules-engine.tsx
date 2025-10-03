"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, Shield, Building2, Users, FileText, ExternalLink } from "lucide-react"
import { rbiRules, governmentSchemes, findRelevantSchemes, findRelevantRules } from "@/lib/mockdata"
import type { Rule, Scheme } from "@/lib/mockdata"

export function RulesEngine() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)

  const filteredRules = searchQuery ? findRelevantRules(searchQuery) : rbiRules

  const filteredSchemes = searchQuery ? findRelevantSchemes(searchQuery) : governmentSchemes

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-success text-success-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "business":
        return <Building2 className="w-4 h-4" />
      case "housing":
        return <FileText className="w-4 h-4" />
      case "agriculture":
        return <Users className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search rules, schemes, or regulations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="schemes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schemes">Government Schemes</TabsTrigger>
          <TabsTrigger value="rules">RBI/PSL Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="schemes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredSchemes.map((scheme) => (
              <Card
                key={scheme.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedScheme(scheme)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(scheme.category)}
                      <CardTitle className="text-lg">{scheme.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{scheme.category}</Badge>
                  </div>
                  <CardDescription className="text-sm">{scheme.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Max Amount:</span>
                      <div className="font-medium">{scheme.maxAmount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <div className="font-medium">{scheme.interestRate}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Tenure: {scheme.tenure}</span>
                    <Button size="sm" variant="outline" className="h-6 text-xs bg-transparent">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {filteredRules.map((rule) => (
              <Card
                key={rule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRule(rule)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <CardTitle className="text-lg">{rule.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(rule.priority)}>{rule.priority.toUpperCase()}</Badge>
                      <Badge variant="outline">{rule.category}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">{rule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Key Criteria:</span>
                      <ul className="text-sm mt-1 space-y-1">
                        {rule.criteria.slice(0, 2).map((criteria, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Applicable: {rule.applicableFor.length} entities
                      </span>
                      <Button size="sm" variant="outline" className="h-6 text-xs bg-transparent">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Full Rule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed View Modals */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(selectedScheme.category)}
                  <CardTitle>{selectedScheme.name}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedScheme(null)}>
                  Close
                </Button>
              </div>
              <CardDescription>{selectedScheme.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Max Amount</span>
                  <div className="text-lg font-bold">{selectedScheme.maxAmount}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Interest Rate</span>
                  <div className="text-lg font-bold">{selectedScheme.interestRate}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Tenure</span>
                  <div className="text-lg font-bold">{selectedScheme.tenure}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                <ul className="space-y-1">
                  {selectedScheme.eligibility.map((criteria, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="w-1 h-1 bg-success rounded-full mt-2 flex-shrink-0"></span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Benefits</h4>
                <ul className="space-y-1">
                  {selectedScheme.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Required Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.documents.map((doc, index) => (
                    <Badge key={index} variant="outline">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <CardTitle>{selectedRule.title}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedRule(null)}>
                  Close
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(selectedRule.priority)}>{selectedRule.priority.toUpperCase()}</Badge>
                <Badge variant="outline">{selectedRule.category}</Badge>
              </div>
              <CardDescription>{selectedRule.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Key Criteria</h4>
                <ul className="space-y-1">
                  {selectedRule.criteria.map((criteria, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Applicable For</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRule.applicableFor.map((entity, index) => (
                    <Badge key={index} variant="secondary">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
