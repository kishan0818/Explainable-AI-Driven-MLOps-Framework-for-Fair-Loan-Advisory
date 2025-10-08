// Mock data for the Rules & Schemes Engine and Chatbot

export interface Rule {
  id: string
  category: string
  title: string
  description: string
  criteria: string[]
  applicableFor: string[]
  priority: "high" | "medium" | "low"
}

export interface Scheme {
  id: string
  name: string
  description: string
  eligibility: string[]
  benefits: string[]
  maxAmount: string
  interestRate: string
  tenure: string
  documents: string[]
  category: string
}

export interface ChatResponse {
  question: string
  answer: string
  relatedSchemes?: string[]
  relatedRules?: string[]
}

export const rbiRules: Rule[] = [
  {
    id: "RBI001",
    category: "Priority Sector Lending",
    title: "Agriculture Lending Requirement",
    description: "Banks must allocate minimum 18% of ANBC to agriculture sector",
    criteria: [
      "Minimum 18% of ANBC",
      "Direct and indirect agriculture financing",
      "Small and marginal farmers priority",
    ],
    applicableFor: ["All Scheduled Commercial Banks", "Regional Rural Banks"],
    priority: "high",
  },
  {
    id: "RBI002",
    category: "Priority Sector Lending",
    title: "MSME Lending Requirement",
    description: "7.5% of ANBC must be allocated to micro enterprises",
    criteria: ["7.5% of ANBC for micro enterprises", "Manufacturing and service sectors", "Investment up to ₹25 lakhs"],
    applicableFor: ["All Scheduled Commercial Banks"],
    priority: "high",
  },
  {
    id: "RBI003",
    category: "Housing Finance",
    title: "Priority Sector Housing Loans",
    description: "Housing loans up to ₹35 lakhs in metropolitan areas qualify for priority sector",
    criteria: ["Up to ₹35 lakhs in metro areas", "Up to ₹25 lakhs in other areas", "Individual dwelling units only"],
    applicableFor: ["All Banks", "Housing Finance Companies"],
    priority: "medium",
  },
  {
    id: "RBI004",
    category: "KYC Compliance",
    title: "Customer Due Diligence",
    description: "Mandatory KYC verification for all loan applicants",
    criteria: ["Identity verification", "Address verification", "Income verification", "Risk categorization"],
    applicableFor: ["All Financial Institutions"],
    priority: "high",
  },
]

export const governmentSchemes: Scheme[] = [
  {
    id: "MUDRA001",
    name: "MUDRA Shishu",
    description: "Micro Units Development & Refinance Agency loan for small businesses up to ₹50,000",
    eligibility: [
      "Small business owners",
      "Entrepreneurs starting new ventures",
      "Self-employed individuals",
      "Artisans and craftsmen",
    ],
    benefits: ["No collateral required", "Flexible repayment", "Lower interest rates", "Quick processing"],
    maxAmount: "₹50,000",
    interestRate: "8.5% - 12%",
    tenure: "Up to 5 years",
    documents: ["Aadhaar Card", "PAN Card", "Business Plan", "Bank Statements"],
    category: "Business",
  },
  {
    id: "MUDRA002",
    name: "MUDRA Kishore",
    description: "MUDRA loan for established businesses between ₹50,000 to ₹5 lakhs",
    eligibility: ["Existing business owners", "Manufacturing units", "Service providers", "Trading businesses"],
    benefits: ["Collateral-free loans", "Competitive interest rates", "Easy documentation", "Credit guarantee"],
    maxAmount: "₹5,00,000",
    interestRate: "9% - 14%",
    tenure: "Up to 5 years",
    documents: ["Business Registration", "ITR", "Bank Statements", "Project Report"],
    category: "Business",
  },
  {
    id: "PMAY001",
    name: "PMAY Credit Linked Subsidy",
    description: "Pradhan Mantri Awas Yojana subsidy for first-time home buyers",
    eligibility: [
      "First-time home buyers",
      "EWS/LIG/MIG categories",
      "Annual income up to ₹18 lakhs",
      "No existing house ownership",
    ],
    benefits: ["Interest subsidy up to ₹2.67 lakhs", "Reduced EMI burden", "Faster loan approval", "Tax benefits"],
    maxAmount: "₹12,00,000 (subsidy)",
    interestRate: "6.5% effective rate",
    tenure: "Up to 20 years",
    documents: ["Income Certificate", "Property Documents", "Aadhaar", "PAN Card"],
    category: "Housing",
  },
  {
    id: "NABARD001",
    name: "NABARD Dairy Development",
    description: "National Bank for Agriculture and Rural Development scheme for dairy farming",
    eligibility: ["Dairy farmers", "Rural entrepreneurs", "SHG members", "Cooperative societies"],
    benefits: ["Subsidized interest rates", "Technical support", "Training programs", "Market linkage"],
    maxAmount: "₹10,00,000",
    interestRate: "7% - 9%",
    tenure: "Up to 7 years",
    documents: ["Land Documents", "Project Report", "Veterinary Certificate", "Bank Statements"],
    category: "Agriculture",
  },
  {
    id: "STANDUP001",
    name: "Stand-Up India",
    description: "Loans for SC/ST and women entrepreneurs for greenfield enterprises",
    eligibility: [
      "SC/ST entrepreneurs",
      "Women entrepreneurs",
      "Age 18+ years",
      "Greenfield enterprise in manufacturing/services/trading",
    ],
    benefits: ["Collateral-free loans", "Handholding support", "Credit guarantee", "Skill development"],
    maxAmount: "₹1,00,00,000",
    interestRate: "Base rate + 3% + tenure premium",
    tenure: "Up to 7 years",
    documents: ["Caste Certificate", "Project Report", "Aadhaar", "Educational Certificates"],
    category: "Business",
  },
]

export const chatbotResponses: ChatResponse[] = [
  {
    question: "What is MUDRA loan?",
    answer:
      "MUDRA (Micro Units Development & Refinance Agency) loans are collateral-free loans provided to small businesses and entrepreneurs. There are three categories: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 lakhs), and Tarun (₹5 lakhs to ₹10 lakhs). These loans support micro-enterprises in manufacturing, trading, and service sectors.",
    relatedSchemes: ["MUDRA001", "MUDRA002"],
  },
  {
    question: "What are the eligibility criteria for PMAY?",
    answer:
      "PMAY (Pradhan Mantri Awas Yojana) eligibility includes: 1) First-time home buyer, 2) Annual household income up to ₹18 lakhs, 3) No existing house ownership by any family member, 4) Property should be in your name or jointly with spouse. The scheme provides interest subsidy making home loans more affordable.",
    relatedSchemes: ["PMAY001"],
  },
  {
    question: "My loan application was rejected. What are my options?",
    answer:
      "If your loan was rejected, consider these alternatives: 1) Apply for government schemes like MUDRA, PMAY, or Stand-Up India based on your profile, 2) Improve your credit score and reapply, 3) Consider a co-applicant or guarantor, 4) Explore smaller loan amounts, 5) Check with other lenders. Our AI system can suggest specific schemes based on your rejection reasons.",
    relatedSchemes: ["MUDRA001", "PMAY001", "STANDUP001"],
  },
  {
    question: "What documents are required for business loans?",
    answer:
      "Common documents for business loans include: 1) Business registration/license, 2) PAN and Aadhaar cards, 3) ITR for last 2-3 years, 4) Bank statements (6-12 months), 5) Project report/business plan, 6) Financial statements, 7) Collateral documents (if applicable). Specific requirements vary by lender and loan amount.",
    relatedSchemes: ["MUDRA001", "MUDRA002", "STANDUP001"],
  },
  {
    question: "What is Priority Sector Lending?",
    answer:
      "Priority Sector Lending (PSL) is RBI's directive requiring banks to lend a certain percentage to specific sectors like agriculture (18%), MSME (7.5%), housing, education, and renewable energy. This ensures credit flow to economically important sectors and promotes inclusive growth.",
    relatedRules: ["RBI001", "RBI002", "RBI003"],
  },
  {
    question: "How does the AI model evaluate loan applications?",
    answer:
      "Our AI model uses machine learning algorithms (Random Forest with SMOTE) to analyze 13+ key features including income, loan amount, DTI ratio, employment type, and credit history. It provides explainable decisions using SHAP analysis, showing which factors influenced the decision. The model achieves 87%+ accuracy while ensuring fairness and regulatory compliance.",
  },
  {
    question: "What is SHAP analysis?",
    answer:
      "SHAP (SHapley Additive exPlanations) is an explainable AI technique that shows how each feature contributed to the loan decision. It provides transparent explanations like 'Your high income (+0.3) and stable employment (+0.2) positively influenced approval, while high DTI ratio (-0.1) was a concern.' This ensures transparency and helps applicants understand decisions.",
  },
  {
    question: "What are the interest rates for different loan types?",
    answer:
      "Interest rates vary by loan type and scheme: Home loans: 8.5-11%, Personal loans: 11-24%, Business loans: 9-18%, MUDRA loans: 8.5-14%, PMAY subsidized rate: 6.5% effective. Rates depend on credit score, income, loan amount, and lender policies. Government schemes often offer subsidized rates.",
    relatedSchemes: ["MUDRA001", "PMAY001", "NABARD001"],
  },
]

export function findRelevantSchemes(query: string, userProfile?: any): Scheme[] {
  const queryLower = query.toLowerCase()
  return governmentSchemes.filter(
    (scheme) =>
      scheme.name.toLowerCase().includes(queryLower) ||
      scheme.description.toLowerCase().includes(queryLower) ||
      scheme.category.toLowerCase().includes(queryLower) ||
      scheme.eligibility.some((criteria) => criteria.toLowerCase().includes(queryLower)),
  )
}

export function findRelevantRules(query: string): Rule[] {
  const queryLower = query.toLowerCase()
  return rbiRules.filter(
    (rule) =>
      rule.title.toLowerCase().includes(queryLower) ||
      rule.description.toLowerCase().includes(queryLower) ||
      rule.category.toLowerCase().includes(queryLower),
  )
}

export function getChatbotResponse(query: string): ChatResponse | null {
  const queryLower = query.toLowerCase()
  return (
    chatbotResponses.find((response) => response.question.toLowerCase().includes(queryLower)) ||
    chatbotResponses.find((response) => {
      const keywords = queryLower.split(" ")
      return keywords.some((keyword) => response.question.toLowerCase().includes(keyword))
    }) ||
    null
  )
}
