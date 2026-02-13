"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Shield, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReCAPTCHA from "react-google-recaptcha"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  const router = useRouter()
  // const supabase = createClient() - Removed, using imported singleton

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (isSignUp) {
        // Sign Up Logic (Supabase Direct + Captcha Check IF needed or fallback)
        // For Phase 10: Requirement says "User Login" and "Admin Login".
        // Use standard signup for now (without captcha strictness on backend or add it).
        // Let's keep SignUp direct for now to verify Login flow first or add Captcha check here too?
        // Requirement: "Implement Google reCAPTCHA v2 ... on: User Login".

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) throw signUpError

        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: email
          }, { onConflict: 'id' })
        }

        setSuccessMessage("Sign up successful! Please check your email for the verification link.")
        setIsSignUp(false)
      } else {
        // Sign In Logic (VIA BACKEND PROXY for reCAPTCHA)
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

        // Sync Session to Supabase Client (so RLS works)
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token || "" // Backend now returns this
        })

        if (sessionError) {
          console.error("Session Sync Error:", sessionError)
          // fallback?
        }

        // Router Push
        router.push("/user/dashboard")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication")
    } finally {
      setLoading(false)
      // Reset Captcha if needed?
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Explainable AI-Based Loan Advisory System</h1>
              <p className="text-muted-foreground">Bank and Government Schemes</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-balance leading-tight">
              Explainable AI-Based Loan Advisory System
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Advanced MLOps framework ensuring fair, transparent, and inclusive loan decisions with regulatory
              compliance and government scheme integration.
            </p>

            <div className="grid gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">RBI/PSL Compliant</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">SHAP Explainability</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Create an Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Enter your details to register for the platform"
                : "Enter your credentials to access the platform"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="border-green-500 text-green-700 bg-green-50">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {!isSignUp && (
                <div className="flex justify-center py-2">
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} // Test Key default
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !email || !password || (!isSignUp && !recaptchaToken)}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  isSignUp ? "Sign Up" : "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccessMessage(null)
              }}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

