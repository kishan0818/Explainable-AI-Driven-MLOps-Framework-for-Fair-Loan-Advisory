"""
generate_audit_charts.py
------------------------
Generates high-resolution publication-quality visual charts for the
Fair Loan Advisory Module 10 Checklist Audit Report.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

os.makedirs("charts", exist_ok=True)

# Set common font styling
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#CBD5E1'
plt.rcParams['axes.linewidth'] = 0.8


# -------------------------------------------------------------------------
# Chart 1: Donut Chart - Checklist Completion Status
# -------------------------------------------------------------------------
def create_donut_chart():
    fig, ax = plt.subplots(figsize=(4.5, 4.0), dpi=300)
    
    sizes = [103, 1, 1]
    labels = ['Checked (103)', 'Can add (1)', 'Not needed (1)']
    colors_list = ['#059669', '#D97706', '#64748B']
    
    wedges, texts, autotexts = ax.pie(
        sizes, 
        colors=colors_list, 
        autopct='', 
        startangle=140,
        wedgeprops=dict(width=0.38, edgecolor='white', linewidth=2.5)
    )
    
    # Draw center circle
    centre_circle = plt.Circle((0, 0), 0.62, fc='white')
    ax.add_artist(centre_circle)
    
    # Center text
    ax.text(0, 0.08, "105", ha='center', va='center', fontsize=22, fontweight='bold', color='#0F2942')
    ax.text(0, -0.12, "reviewed", ha='center', va='center', fontsize=11, color='#64748B')
    
    ax.axis('equal')
    
    # Legend
    legend = ax.legend(
        wedges, labels,
        loc="lower center",
        bbox_to_anchor=(0.5, -0.15),
        ncol=3,
        frameon=False,
        fontsize=9,
        handletextpad=0.5,
        columnspacing=1.2
    )
    for text in legend.get_texts():
        text.set_color('#334155')
        text.set_fontweight('bold')
        
    plt.tight_layout()
    output_path = os.path.join("charts", "chart_donut.png")
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Generated: {output_path}")


# -------------------------------------------------------------------------
# Chart 2: Readiness by Section Vertical Bar Chart
# -------------------------------------------------------------------------
def create_readiness_chart():
    fig, ax = plt.subplots(figsize=(7.2, 3.2), dpi=300)
    
    sections = [f"{i}" for i in range(1, 15)]
    percentages = [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 87.5, 100.0, 100.0]
    bar_colors = ['#059669' if p == 100 else '#D97706' for p in percentages]
    
    bars = ax.bar(sections, percentages, color=bar_colors, width=0.58, edgecolor='none')
    
    ax.set_ylim(0, 115)
    ax.set_ylabel("% items checked", fontsize=9, color='#475569', fontweight='bold')
    ax.set_xlabel("Section number", fontsize=9, color='#475569', fontweight='bold')
    
    # Hide top and right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#CBD5E1')
    ax.spines['bottom'].set_color('#CBD5E1')
    
    ax.tick_params(colors='#475569', labelsize=8)
    ax.grid(axis='y', linestyle='--', alpha=0.4, color='#E2E8F0')
    
    # Annotate percentage above bars
    for bar, p in zip(bars, percentages):
        height = bar.get_height()
        label = f"{int(p)}%" if p == 100 else f"{p:.1f}%"
        ax.annotate(
            label,
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 3),
            textcoords="offset points",
            ha='center', va='bottom',
            fontsize=7.5, fontweight='bold',
            color='#065F46' if p == 100 else '#B45309'
        )
        
    plt.tight_layout()
    output_path = os.path.join("charts", "chart_readiness.png")
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Generated: {output_path}")


# -------------------------------------------------------------------------
# Chart 3: Technologies Used Horizontal Bar Chart
# -------------------------------------------------------------------------
def create_tech_stack_chart():
    fig, ax = plt.subplots(figsize=(7.2, 3.2), dpi=300)
    
    categories = [
        "Privacy & Security",
        "LLMOps & Monitoring",
        "Vector DB & RAG",
        "Explainable ML",
        "AI & Agentic",
        "Backend Core",
        "Frontend Portal"
    ]
    
    counts = [5, 6, 4, 5, 6, 5, 4]
    subtitles = [
        "SecurityShield, DPDP Masking, JWT, RBAC, reCAPTCHA",
        "Langfuse, Model Registry, P50/P95/P99, Error Rate, A/B Testing",
        "Supabase PGVector, all-MiniLM-L6-v2, Cross-Scoring Reranker",
        "XGBoost, Tree SHAP, Scikit-Learn, LightGBM, SMOTE",
        "LangGraph, LangChain, NVIDIA NIM LLaMA-3.2, Tenacity, Reflection",
        "FastAPI, Python 3.12, Uvicorn, Pydantic V2, Asyncio",
        "Next.js 14, TypeScript, Tailwind CSS, Lucide Icons"
    ]
    bar_colors = ['#DC2626', '#4F46E5', '#0284C7', '#D97706', '#059669', '#2563EB', '#3B82F6']
    
    y_pos = np.arange(len(categories))
    bars = ax.barh(y_pos, counts, color=bar_colors, height=0.55, edgecolor='none')
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(categories, fontsize=8.5, fontweight='bold', color='#0F2942')
    ax.set_xlabel("Number of integrated libraries & tools", fontsize=8.5, color='#475569', fontweight='bold')
    ax.set_xlim(0, 8.5)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#CBD5E1')
    ax.spines['bottom'].set_color('#CBD5E1')
    ax.tick_params(colors='#475569', labelsize=8)
    ax.grid(axis='x', linestyle='--', alpha=0.4, color='#E2E8F0')
    
    for bar, subtitle in zip(bars, subtitles):
        width = bar.get_width()
        ax.text(
            width + 0.15, bar.get_y() + bar.get_height() / 2,
            subtitle,
            va='center', ha='left',
            fontsize=7, color='#475569', fontstyle='italic'
        )
        
    plt.tight_layout()
    output_path = os.path.join("charts", "chart_tech_stack.png")
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Generated: {output_path}")


# -------------------------------------------------------------------------
# Chart 4: AI Workflow Architecture Diagram
# -------------------------------------------------------------------------
def create_workflow_diagram():
    fig, ax = plt.subplots(figsize=(7.0, 6.2), dpi=300)
    ax.axis('off')
    
    steps = [
        ("Applicant Submission", "User submits income, credit profile & requested loan amount", "#2563EB"),
        ("SecurityShield & DPDP Masking", "Sanitizes prompt injection and redacts Aadhaar, PAN, phone", "#4F46E5"),
        ("LangGraph Planner Node", "Deconstructs query into scheme lookup and policy rules", "#0F2942"),
        ("Dual-Model XGBoost Underwriter", "Predicts default risk probability with Fair Tree SHAP attributions", "#D97706"),
        ("Supabase PGVector Retrieval", "Parallel semantic search for matching government loan schemes", "#0284C7"),
        ("Cross-Scoring RAG Re-ranker", "Filters top-K chunks by lexical and semantic relevance", "#0891B2"),
        ("NVIDIA NIM LLaMA-3.2 Advisor", "Synthesizes contextual guidance, subsidies & interest terms", "#059669"),
        ("Compliance Reflection Auditor", "Independent agent checks grounding, policy limits & fair lending", "#16A34A"),
        ("Human Approval Review Gate", "Underwriter override portal for borderline cases and hard decisions", "#DC2626"),
        ("Structured Advisory Output", "Delivers verified recommendation, portal links & Tree SHAP report", "#0F2942")
    ]
    
    n = len(steps)
    box_height = 0.058
    box_width = 0.88
    x_center = 0.5
    y_start = 0.94
    y_gap = (y_start - 0.04) / (n - 1)
    
    for i, (title, desc, color) in enumerate(steps):
        y = y_start - i * y_gap
        
        # Draw box
        rect = plt.Rectangle(
            (x_center - box_width/2, y - box_height/2),
            box_width, box_height,
            facecolor=color,
            edgecolor='none',
            transform=ax.transAxes,
            clip_on=False,
            zorder=2
        )
        ax.add_patch(rect)
        
        # Add text
        ax.text(
            x_center, y + 0.010,
            title,
            ha='center', va='center',
            color='white',
            fontsize=8.5,
            fontweight='bold',
            transform=ax.transAxes,
            zorder=3
        )
        ax.text(
            x_center, y - 0.012,
            desc,
            ha='center', va='center',
            color='#F1F5F9',
            fontsize=6.8,
            transform=ax.transAxes,
            zorder=3
        )
        
        # Draw arrow to next
        if i < n - 1:
            next_y = y_start - (i + 1) * y_gap
            ax.annotate(
                '',
                xy=(x_center, next_y + box_height/2 + 0.003),
                xytext=(x_center, y - box_height/2 - 0.001),
                arrowprops=dict(arrowstyle="->", color="#94A3B8", lw=1.5),
                transform=ax.transAxes,
                zorder=1
            )
            
    plt.tight_layout()
    output_path = os.path.join("charts", "chart_workflow.png")
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Generated: {output_path}")


if __name__ == "__main__":
    create_donut_chart()
    create_readiness_chart()
    create_tech_stack_chart()
    create_workflow_diagram()
    print("All charts successfully generated!")
