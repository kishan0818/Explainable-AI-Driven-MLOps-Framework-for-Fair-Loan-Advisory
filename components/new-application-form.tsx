"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ModelPrediction } from "@/components/model-integration"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
    // Basic
    name: z.string().min(2, "Name is required"),
    age: z.preprocess((val) => Number(val), z.number().min(18).max(100)),
    gender: z.string().min(1, "Gender is required"), // For Rules
    marital_status: z.string().min(1, "Marital Status is required"),
    has_dependents: z.boolean().default(false),

    // Financial
    income: z.preprocess((val) => Number(val), z.number().min(1000, "Income is required")),
    employment_type: z.string().min(1, "Employment type is required"),
    months_employed: z.preprocess((val) => Number(val), z.number().min(0).default(12)),
    caste_category: z.string().optional(),

    // Loan Details
    loan_amount: z.preprocess((val) => Number(val), z.number().min(1000, "Loan amount is required")),
    loan_type: z.string().min(1, "Loan type is required"),
    loan_purpose: z.string().optional(),
    loan_term: z.preprocess((val) => Number(val), z.number().min(6).max(360).default(12)),
    interest_rate: z.preprocess((val) => Number(val), z.number().min(0).max(100).default(10.0)),

    // Credit Profile
    credit_score: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().min(300).max(900).nullable().optional()),
    has_credit_history: z.boolean().default(true),
    num_credit_lines: z.preprocess((val) => Number(val), z.number().min(0).default(0)),
    existing_emi: z.preprocess((val) => Number(val), z.number().min(0).default(0)),
    has_mortgage: z.boolean().default(false),
    has_co_signer: z.boolean().default(false),

    education: z.string().min(1, "Education is required"),
}).refine(data => {
    if (data.has_credit_history && (data.credit_score === null || data.credit_score === undefined)) {
        return false;
    }
    return true;
}, {
    message: "Credit Score is required if history exists",
    path: ["credit_score"]
});

interface NewApplicationFormProps {
    onPredictionComplete: (result: any) => void
}

export function NewApplicationForm({ onPredictionComplete }: NewApplicationFormProps) {
    const [formData, setFormData] = useState<any>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "Applicant",
            age: 30,
            gender: "male",
            marital_status: "single",
            income: 50000,
            employment_type: "salaried",
            months_employed: 24,
            loan_amount: 500000,
            loan_type: "personal",
            loan_term: 24,
            interest_rate: 12.0,
            existing_emi: 0,
            credit_score: 750,
            has_credit_history: true,
            num_credit_lines: 1,
            education: "bachelors",
            has_dependents: false,
            has_mortgage: false,
            has_co_signer: false,
            caste_category: "general"
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const payload = {
            ...values,
            credit_score: values.has_credit_history ? values.credit_score : null,
        }
        setFormData(payload)
    }

    return (
        <div className="space-y-6">
            {!formData ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Application Details</CardTitle>
                        <CardDescription>Enter your complete profile for accurate AI assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* Personal Details */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Age</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="gender" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="transgender">Transgender (Other)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="marital_status" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Marital Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="single">Single</SelectItem>
                                                    <SelectItem value="married">Married</SelectItem>
                                                    <SelectItem value="divorced">Divorced</SelectItem>
                                                    <SelectItem value="widowed">Widowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="education" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Education</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="high_school">High School</SelectItem>
                                                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                                                    <SelectItem value="masters">Master's Degree</SelectItem>
                                                    <SelectItem value="phd">PhD / Doctorate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="caste_category" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category (Optional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="obc">OBC</SelectItem>
                                                    <SelectItem value="sc">SC</SelectItem>
                                                    <SelectItem value="st">ST</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FormField control={form.control} name="has_dependents" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Do you have dependents?
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="border-t my-4" />
                                <h3 className="font-semibold mb-2">Financial & Employment</h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="employment_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employment Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="salaried">Salaried</SelectItem>
                                                    <SelectItem value="self_employed">Self Employed</SelectItem>
                                                    <SelectItem value="business">Business Owner</SelectItem>
                                                    <SelectItem value="unemployed">Unemployed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="months_employed" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Months Employed</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="income" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Income (₹)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="existing_emi" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Monthly EMI (₹)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="border-t my-4" />
                                <h3 className="font-semibold mb-2">Loan Details</h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="loan_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="personal">Personal Loan</SelectItem>
                                                    <SelectItem value="home">Home Loan</SelectItem>
                                                    <SelectItem value="education">Education Loan</SelectItem>
                                                    <SelectItem value="msme">MSME/Business Loan</SelectItem>
                                                    <SelectItem value="agriculture">Agriculture Loan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="loan_term" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Term (Months)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="loan_amount" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Amount (₹)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="interest_rate" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expected Interest Rate (%)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="loan_purpose" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loan Purpose</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Home">Home Purchase/Renovation</SelectItem>
                                                <SelectItem value="Auto">Car/Vehicle</SelectItem>
                                                <SelectItem value="Education">Education</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
                                                <SelectItem value="Personal">Personal/Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="border-t my-4" />
                                <h3 className="font-semibold mb-2">Credit Profile</h3>

                                <FormField
                                    control={form.control}
                                    name="has_credit_history"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Credit History</FormLabel>
                                                <FormDescription>
                                                    Do you have an existing credit score?
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {form.watch("has_credit_history") && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="credit_score" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Credit Score (CIBIL/Experian)</FormLabel>
                                                    <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="num_credit_lines" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Credit Lines</FormLabel>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="has_mortgage" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <div className="space-y-1"><FormLabel>Do you have a mortgage?</FormLabel></div>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="has_co_signer" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <div className="space-y-1"><FormLabel>Do you have a co-signer?</FormLabel></div>
                                        </FormItem>
                                    )} />
                                </div>

                                <Button type="submit" className="w-full">
                                    Check Eligibility
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            ) : (
                <ModelPrediction applicationData={formData} mode="predict" />
            )}
        </div>
    )
}
