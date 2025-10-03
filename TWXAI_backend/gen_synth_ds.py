# import numpy as np
# import pandas as pd
# import random
# import string

# # Seed for reproducibility
# np.random.seed(42)

# n_safe = 60000
# n_unsafe = 40000
# n_total = n_safe + n_unsafe

# def random_id(size=10):
#     """Generate random alphanumeric LoanID"""
#     return ''.join(random.choices(string.ascii_uppercase + string.digits, k=size))

# def generate_records(n, default_flag):
#     records = []
#     for _ in range(n):
#         LoanID = random_id()

#         # Age distribution: safe slightly older
#         Age = int(np.clip(np.random.normal(50 if default_flag==0 else 45, 10), 21, 80))

#         # Income: unsafe tend to have lower incomes
#         Income = int(np.clip(np.random.normal(80000 if default_flag==0 else 40000, 20000), 10000, 200000))

#         # LoanAmount: unsafe tend to borrow more relative to income
#         if default_flag == 0:
#             LoanAmount = int(np.clip(np.random.normal(Income*0.5, 20000), 5000, 200000))
#         else:
#             LoanAmount = int(np.clip(np.random.normal(Income*1.5, 40000), 5000, 250000))

#         # Credit Score: safe high, unsafe low
#         CreditScore = int(np.clip(np.random.normal(700 if default_flag==0 else 500, 50), 300, 850))

#         # Months Employed: safe more employment history
#         MonthsEmployed = int(np.clip(np.random.normal(80 if default_flag==0 else 20, 30), 0, 360))

#         # NumCreditLines: safe moderate, unsafe fewer or too many
#         NumCreditLines = int(np.clip(np.random.normal(4 if default_flag==0 else 3, 1.5), 1, 15))

#         # Interest Rate: unsafe higher
#         InterestRate = round(np.clip(np.random.normal(8 if default_flag==0 else 15, 4), 2, 30), 2)

#         # Loan Term (months): safe longer, unsafe shorter
#         LoanTerm = int(np.random.choice([12, 24, 36, 48, 60, 72]))

#         # DTI Ratio: safe lower
#         DTIRatio = round(np.clip(np.random.normal(0.3 if default_flag==0 else 0.6, 0.15), 0.05, 1.5), 2)

#         # Categorical fields
#         Education = np.random.choice(["High School", "Associate", "Bachelor's", "Master's", "Doctorate"],
#                                      p=[0.25,0.2,0.35,0.15,0.05] if default_flag==0 else [0.35,0.3,0.25,0.08,0.02])
#         EmploymentType = np.random.choice(["Full-time","Part-time","Unemployed","Self-employed"],
#                                           p=[0.7,0.15,0.05,0.1] if default_flag==0 else [0.4,0.2,0.3,0.1])
#         MaritalStatus = np.random.choice(["Single","Married","Divorced","Widowed"],
#                                          p=[0.3,0.5,0.15,0.05] if default_flag==0 else [0.4,0.3,0.25,0.05])
#         HasMortgage = np.random.choice(["Yes","No"],p=[0.6,0.4] if default_flag==0 else [0.3,0.7])
#         HasDependents = np.random.choice(["Yes","No"],p=[0.5,0.5] if default_flag==0 else [0.6,0.4])
#         LoanPurpose = np.random.choice(["Home","Auto","Education","Other"],
#                                        p=[0.4,0.2,0.1,0.3] if default_flag==0 else [0.1,0.3,0.2,0.4])
#         HasCoSigner = np.random.choice(["Yes","No"],p=[0.4,0.6] if default_flag==0 else [0.2,0.8])

#         Default = default_flag

#         records.append([LoanID, Age, Income, LoanAmount, CreditScore, MonthsEmployed,
#                         NumCreditLines, InterestRate, LoanTerm, DTIRatio, Education,
#                         EmploymentType, MaritalStatus, HasMortgage, HasDependents,
#                         LoanPurpose, HasCoSigner, Default])
#     return records

# # Generate safe & unsafe borrowers
# safe_records = generate_records(n_safe, 0)
# unsafe_records = generate_records(n_unsafe, 1)

# data = safe_records + unsafe_records
# random.shuffle(data)

# columns = ["LoanID","Age","Income","LoanAmount","CreditScore","MonthsEmployed","NumCreditLines",
#            "InterestRate","LoanTerm","DTIRatio","Education","EmploymentType","MaritalStatus",
#            "HasMortgage","HasDependents","LoanPurpose","HasCoSigner","Default"]

# df = pd.DataFrame(data, columns=columns)

# # Save to CSV
# df.to_csv("synthetic_loans.csv", index=False)

# print(df.head())
# print("Generated:", df.shape)
# print("Default=0:", (df['Default']==0).sum(), "Default=1:", (df['Default']==1).sum())


import numpy as np
import pandas as pd
import random
import string

np.random.seed(42)

n_safe = 153209
n_unsafe = 102140
n_total = n_safe + n_unsafe

def random_id(size=10):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=size))

def generate_records(n, default_flag):
    records = []
    for _ in range(n):
        LoanID = random_id()

        # Age overlap & noise
        Age = int(np.clip(np.random.normal(48 if default_flag==0 else 46, 12), 21, 80))

        # Income overlap & noise
        base_income = np.random.normal(70000 if default_flag==0 else 50000, 25000)
        Income = int(np.clip(base_income * np.random.uniform(0.8,1.2), 8000, 250000))

        # LoanAmount overlap & noise
        ratio = 0.7 if default_flag==0 else 1.1
        LoanAmount = int(np.clip(np.random.normal(Income*ratio, 40000)*np.random.uniform(0.8,1.3), 3000, 300000))

        # CreditScore overlap & noise
        CreditScore = int(np.clip(np.random.normal(670 if default_flag==0 else 550, 80), 300, 850))

        # MonthsEmployed overlap
        MonthsEmployed = int(np.clip(np.random.normal(70 if default_flag==0 else 30, 40), 0, 400))

        # NumCreditLines overlap
        NumCreditLines = int(np.clip(np.random.normal(4 if default_flag==0 else 3, 2), 1, 20))

        # Interest Rate with noise
        InterestRate = round(np.clip(np.random.normal(9 if default_flag==0 else 13, 5)*np.random.uniform(0.9,1.2), 1.5, 35), 2)

        LoanTerm = int(np.random.choice([12, 24, 36, 48, 60, 72]))

        # DTI ratio overlap & noise
        DTIRatio = round(np.clip(np.random.normal(0.35 if default_flag==0 else 0.55, 0.2)*np.random.uniform(0.8,1.2), 0.05, 2), 2)

        Education = np.random.choice(["High School","Associate","Bachelor's","Master's","Doctorate"],
                                     p=[0.3,0.25,0.3,0.12,0.03] if default_flag==0 else [0.35,0.3,0.25,0.08,0.02])
        EmploymentType = np.random.choice(["Full-time","Part-time","Unemployed","Self-employed"],
                                          p=[0.65,0.2,0.07,0.08] if default_flag==0 else [0.45,0.2,0.25,0.1])
        MaritalStatus = np.random.choice(["Single","Married","Divorced","Widowed"],
                                         p=[0.35,0.45,0.15,0.05] if default_flag==0 else [0.4,0.3,0.25,0.05])
        HasMortgage = np.random.choice(["Yes","No"],p=[0.55,0.45] if default_flag==0 else [0.4,0.6])
        HasDependents = np.random.choice(["Yes","No"],p=[0.5,0.5] if default_flag==0 else [0.6,0.4])
        LoanPurpose = np.random.choice(["Home","Auto","Education","Other"],
                                       p=[0.35,0.25,0.1,0.3] if default_flag==0 else [0.15,0.3,0.2,0.35])
        HasCoSigner = np.random.choice(["Yes","No"],p=[0.35,0.65] if default_flag==0 else [0.25,0.75])

        records.append([LoanID, Age, Income, LoanAmount, CreditScore, MonthsEmployed,
                        NumCreditLines, InterestRate, LoanTerm, DTIRatio, Education,
                        EmploymentType, MaritalStatus, HasMortgage, HasDependents,
                        LoanPurpose, HasCoSigner, default_flag])
    return records

safe_records = generate_records(n_safe, 0)
unsafe_records = generate_records(n_unsafe, 1)

data = safe_records + unsafe_records
random.shuffle(data)

df = pd.DataFrame(data, columns=[
    "LoanID","Age","Income","LoanAmount","CreditScore","MonthsEmployed","NumCreditLines",
    "InterestRate","LoanTerm","DTIRatio","Education","EmploymentType","MaritalStatus",
    "HasMortgage","HasDependents","LoanPurpose","HasCoSigner","Default"
])

# Flip a small % of labels to mimic bad data
flip_idx = np.random.choice(df.index, size=int(0.03*len(df)), replace=False)
df.loc[flip_idx,'Default'] = 1 - df.loc[flip_idx,'Default']

# Add random outliers
outlier_idx = np.random.choice(df.index, size=int(0.01*len(df)), replace=False)
df.loc[outlier_idx,'Income'] *= np.random.uniform(2,4,size=len(outlier_idx))
df.loc[outlier_idx,'LoanAmount'] *= np.random.uniform(0.1,0.5,size=len(outlier_idx))

df.to_csv("synthetic_loans_noisy.csv", index=False)

print(df.head())
print("Counts:", df['Default'].value_counts())
