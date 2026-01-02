import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
                    <CardDescription>
                        We've sent you a verification link. Please verify your email address to access the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Once verified, you can sign in to your account.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/">Back to Sign In</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
