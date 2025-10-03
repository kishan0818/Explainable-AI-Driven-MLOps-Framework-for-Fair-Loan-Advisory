# TWXAI Integrated Loan Prediction System

## Overview

This project integrates a Next.js frontend with a Python FastAPI backend to create a comprehensive loan prediction system with explainable AI, regulatory compliance, and government scheme recommendations.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   ML Model      │
│   Frontend      │◄──►│   Backend       │◄──►│   (RF+SMOTE)    │
│   (Port 3000)   │    │   (Port 8000)   │    │   + Rules       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### Frontend (Next.js)
- Modern React-based user interface
- Loan application form with comprehensive fields
- Real-time prediction results with SHAP explanations
- Model performance dashboard
- Government scheme recommendations
- Responsive design with Tailwind CSS

### Backend (FastAPI + Python)
- Trained Random Forest + SMOTE model
- RBI/PSL regulatory rules engine
- Government scheme matching engine
- SHAP-based explainability
- Comprehensive API documentation
- Audit logging and compliance tracking

## Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# Windows Batch
start_integrated_system.bat

# Windows PowerShell
.\start_integrated_system.ps1
```

### Option 2: Manual Startup

#### 1. Start Python Backend
```bash
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
python fastapi_backend.py
```

#### 2. Start Next.js Frontend
```bash
npm run dev
```

## Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Backend (FastAPI)
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /model/status` - Model performance metrics
- `POST /predict` - Loan prediction with explanations

### Frontend (Next.js)
- `GET /api/predict` - Proxy to backend prediction
- `GET /api/model/status` - Proxy to backend model status

## Model Details

### Trained Model
- **Algorithm**: Random Forest with SMOTE
- **Performance**: 85.88% accuracy, 92.14% ROC-AUC
- **Features**: 13 selected features after preprocessing
- **Training Data**: ~255k loan applications

### Preprocessing Pipeline
1. Missing value imputation
2. Categorical encoding
3. Feature selection (SelectKBest)
4. SMOTE oversampling for class balance

## Rules Engine

The system applies RBI/PSL regulatory rules including:
- Credit score minimum thresholds
- Debt-to-income ratio limits
- Employment stability requirements
- LTV ratio compliance
- KYC documentation checks
- Anti-money laundering checks

## Government Schemes Integration

Automatically suggests relevant schemes for rejected applicants:
- **MUDRA Yojana** - Micro enterprise loans
- **Stand-Up India** - SC/ST/Women entrepreneurs
- **PMAY** - Affordable housing
- **PM Vidyalaxmi** - Education loans
- **Kisan Credit Card** - Agricultural credit

## Data Flow

1. **User Input**: Applicant fills loan application form
2. **Data Preprocessing**: Backend processes and validates input
3. **Model Prediction**: RF+SMOTE model generates probability scores
4. **Rules Engine**: Regulatory rules are applied
5. **Scheme Matching**: Government schemes are suggested if rejected
6. **Response**: Comprehensive result with explanations returned

## Configuration

### Environment Variables
```bash
# Backend URL (default: http://localhost:8000)
BACKEND_URL=http://localhost:8000
```

### Model Configuration
- Model files are loaded from `TWXAI_backend/results_rf_smote_controlled_pca1_wocs/models/`
- Rules are loaded from `TWXAI_backend/rules.json`
- Schemes are loaded from `TWXAI_backend/schemes.json`

## Development

### Backend Development
```bash
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python fastapi_backend.py
```

### Frontend Development
```bash
npm install
npm run dev
```

### Adding New Rules
Edit `TWXAI_backend/rules.json` to add new regulatory rules.

### Adding New Schemes
Edit `TWXAI_backend/schemes.json` to add new government schemes.

## Testing

### Backend Testing
```bash
cd TWXAI_backend
python -m pytest tests/
```

### Frontend Testing
```bash
npm test
```

### Integration Testing
```bash
# Test prediction endpoint
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 30,
    "income": 50000,
    "loan_amount": 500000,
    "loan_type": "home",
    "employment_type": "salaried"
  }'
```

## Monitoring

### Model Performance
- Real-time accuracy, precision, recall metrics
- Feature importance tracking
- Prediction confidence monitoring
- Error rate tracking

### Compliance Monitoring
- Rules engine audit trail
- Government scheme recommendation tracking
- Fair lending compliance metrics

## Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if Python virtual environment is activated
   - Verify all dependencies are installed
   - Check if port 8000 is available

2. **Frontend not connecting to backend**
   - Verify backend is running on port 8000
   - Check CORS settings in FastAPI
   - Verify BACKEND_URL environment variable

3. **Model not loading**
   - Check if model files exist in the correct directory
   - Verify file permissions
   - Check model metadata format

### Logs
- Backend logs: Console output from FastAPI
- Frontend logs: Browser developer console
- Model logs: Check `TWXAI_backend/results_rf_smote_controlled_pca1_wocs/logs/`

## Security Considerations

- Input validation on both frontend and backend
- CORS configuration for cross-origin requests
- Audit logging for compliance
- Data privacy protection
- Secure model serving

## Performance Optimization

- Model caching for faster predictions
- Async processing for non-blocking operations
- Efficient data preprocessing pipeline
- Optimized API response formats

## Future Enhancements

- Real-time model retraining
- Advanced SHAP visualizations
- Multi-language support
- Mobile application
- Advanced analytics dashboard
- Integration with external credit bureaus

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at http://localhost:8000/docs
3. Check logs for error details
4. Verify system requirements

## License

This project is part of the TWXAI (Transparent, Explainable AI) framework for fair and inclusive loan decision making.
