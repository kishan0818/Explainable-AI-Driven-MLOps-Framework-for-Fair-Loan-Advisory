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

const formSchema = z.object({
    income: z.preprocess((val) => Number(val), z.number().min(1000, "Income is required")),
    loan_amount: z.preprocess((val) => Number(val), z.number().min(1000, "Loan amount is required")),
    existing_emi: z.preprocess((val) => Number(val), z.number().min(0).default(0)),
    loan_type: z.string().min(1, "Loan type is required"),
    employment_type: z.string().min(1, "Employment type is required"),
    credit_score: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().min(300).max(900).nullable().optional()),
    has_credit_history: z.boolean().default(true)
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
            income: 50000,
            loan_amount: 500000,
            existing_emi: 0,
            loan_type: "personal",
            employment_type: "salaried",
            credit_score: 750,
            has_credit_history: true
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Prepare data for prediction
        // If no credit history, force credit_score to null
        const payload = {
            ...values,
            credit_score: values.has_credit_history ? values.credit_score : null,
            // Default hidden fields
            age: 30, // Default for now
            name: "Applicant"
        }
        setFormData(payload)
    }

    return (
        <div className="space-y-6">
            {!formData ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Application Details</CardTitle>
                        <CardDescription>Enter your financial details to check eligibility</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="loan_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loan Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select loan type" />
                                                        </SelectTrigger>
                                                    </FormControl>
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
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="employment_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employment Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="salaried">Salaried</SelectItem>
                                                        <SelectItem value="self_employed">Self Employed</SelectItem>
                                                        <SelectItem value="business">Business Owner</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="income"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Monthly Income (₹)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="loan_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loan Amount (₹)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="existing_emi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Existing Monthly EMI (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>Total EMI you are currently paying</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="p-4 border rounded-lg space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="has_credit_history"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">I have a Credit Score (CIBIL)</FormLabel>
                                                    <FormDescription>
                                                        Disable this if you are a student or first-time borrower
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
                                        <FormField
                                            control={form.control}
                                            name="credit_score"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Credit Score (300-900)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <Button type="submit" size="lg" className="w-full">
                                    Proceed to Prediction
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            ) : (
                /* Prediction Mode Wrapper */
                <ModelPrediction
                    mode="predict"
                    applicationData={formData}
                    onPredictionComplete={onPredictionComplete}
                />
            )}
        </div>
    )
}
