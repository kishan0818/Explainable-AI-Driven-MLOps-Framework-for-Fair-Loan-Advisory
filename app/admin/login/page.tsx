"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReCAPTCHA from "react-google-recaptcha"

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

    const router = useRouter()

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!recaptchaToken) {
                setError("Please complete the reCAPTCHA verification.")
                setLoading(false)
                return
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.detail || "Login failed")
            }

            const data = await res.json()

            // For local admin, store token in localStorage (not Supabase session)
            if (data.user?.id === "admin-local") {
                // Store admin token in localStorage
                localStorage.setItem("admin_token", data.access_token)
                localStorage.setItem("admin_user", JSON.stringify(data.user))

                router.push("/admin/dashboard")
                router.refresh()
            } else {
                // Regular user: Sync Session to Supabase Client
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token || ""
                })

                if (sessionError) {
                    console.error("Session Sync Error:", sessionError)
                    throw new Error("Failed to establish session")
                }

                router.push("/admin/dashboard")
                router.refresh()
            }

        } catch (err: any) {
            setError(err.message || "An error occurred during authentication")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto shadow-2xl border-slate-800 bg-slate-900 text-slate-100">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
                    <CardDescription className="text-slate-400">
                        Authorized Personnel Only
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-900/50 border-red-900 text-red-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@twxai.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-slate-800 border-slate-700 focus:ring-red-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-slate-800 border-slate-700 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex justify-center py-2">
                            <ReCAPTCHA
                                theme="dark"
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                onChange={(token) => setRecaptchaToken(token)}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading || !recaptchaToken}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Access Dashboard"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-xs text-slate-500">System Governance & MLOps Control</p>
                </CardFooter>
            </Card>
        </div>
    )
}
