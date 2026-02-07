import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle } from "lucide-react"

interface Scheme {
    scheme_name: string
    url?: string
    reason?: string
}

interface SchemeComparisonProps {
    schemes: Scheme[]
}

export function SchemeComparison({ schemes }: SchemeComparisonProps) {
    if (!schemes || schemes.length === 0) return null

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                        <CheckCircle className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Scheme Comparison</CardTitle>
                        <p className="text-sm text-muted-foreground">Compare your eligible schemes</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Scheme Name</TableHead>
                            <TableHead>Why Recommended</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schemes.map((scheme, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{scheme.scheme_name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{scheme.reason}</TableCell>
                                <TableCell className="text-right">
                                    {scheme.url ? (
                                        <a href={scheme.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline text-sm">
                                            Apply <ExternalLink className="ml-1 w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">Info Only</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
