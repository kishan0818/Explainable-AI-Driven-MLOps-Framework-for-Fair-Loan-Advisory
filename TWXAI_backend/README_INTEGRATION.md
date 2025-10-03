# 🚀 TWXAI Backend - Integration Branch

## 📋 Overview

This is the **integration branch** of the TWXAI backend, containing the complete FastAPI integration for the loan prediction system. This branch includes all the necessary components to run the backend as a standalone service or integrated with the Next.js frontend.

## 🎯 What's New in Integration Branch

### ✅ Added Files
- `fastapi_backend.py` - Complete FastAPI application
- `test_backend.py` - Backend testing script
- `README_INTEGRATION.md` - This documentation

### 🔧 Enhanced Features
- **FastAPI Integration** - Modern async API framework
- **Model Loading** - Automatic model loading on startup
- **SHAP Integration** - Explainable AI explanations
- **Rules Engine** - Regulatory compliance checking
- **Schemes Engine** - Government scheme suggestions
- **Error Handling** - Comprehensive error management
- **Logging** - Detailed logging for monitoring
- **CORS Support** - Frontend integration ready

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.10+
pip install -r requirements.txt
pip install fastapi uvicorn requests
```

### Running the Backend

#### Option 1: Direct Python
```bash
cd TWXAI_backend
python fastapi_backend.py
```

#### Option 2: Uvicorn
```bash
cd TWXAI_backend
uvicorn fastapi_backend:app --host 0.0.0.0 --port 8000 --reload
```

#### Option 3: Using the startup script
```bash
python start_backend.py
```

### Testing the Backend
```bash
cd TWXAI_backend
python test_backend.py
```

## 📊 API Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Model Status
```http
GET /model/status
```
**Response:**
```json
{
  "model_version": "RF_SMOTE_v1.2",
  "status": "active",
  "accuracy": 87.2,
  "precision": 84.1,
  "recall": 85.0,
  "f1_score": 84.5,
  "roc_auc": 92.1,
  "last_updated": "2024-01-20T10:30:00Z",
  "total_predictions": 15647,
  "today_predictions": 23,
  "avg_processing_time": 2.3,
  "error_rate": 0.8
}
```

### Loan Prediction
```http
POST /predict
Content-Type: application/json

{
  "name": "John Doe",
  "age": 30,
  "income": 50000,
  "loan_amount": 500000,
  "loan_type": "home",
  "employment_type": "salaried",
  "credit_score": 750,
  "dti_ratio": 0.3,
  "months_employed": 24,
  "num_credit_lines": 2,
  "interest_rate": 12.0,
  "loan_term": 24,
  "education": "Bachelor",
  "marital_status": "Single",
  "has_mortgage": false,
  "has_dependents": false,
  "loan_purpose": "Purchase",
  "has_co_signer": false,
  "gender": "male",
  "caste_category": "general",
  "location_type": "urban"
}
```

**Response:**
```json
{
  "application_id": "APP1705742400000",
  "prediction": "approve",
  "confidence": 0.75,
  "probability": {
    "approve": 0.75,
    "reject": 0.25
  },
  "shap_values": [
    {
      "feature": "income",
      "value": 50000,
      "impact": 0.25,
      "description": "High income positively influences approval"
    }
  ],
  "risk_factors": [],
  "recommendations": [
    "Consider government schemes like MUDRA or PMAY based on your profile"
  ],
  "model_version": "RF_SMOTE_v1.2",
  "timestamp": "2024-01-20T10:30:00Z",
  "rules_applied": [
    {
      "rule_id": "credit_score_minimum_threshold",
      "description": "Credit Score minimum thresholds",
      "severity": "hard",
      "applied": true,
      "result": "passed"
    }
  ],
  "schemes_suggested": [
    {
      "id": "pmmy",
      "name": "Pradhan Mantri Mudra Yojana",
      "category": "Micro Enterprise Loans",
      "description": "Collateral-free loans up to ₹20 lakh",
      "benefits": ["Collateral-free credit facility"],
      "url": "https://www.mudra.org.in",
      "match_score": 85
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom port
PORT=8000

# Optional: Custom host
HOST=0.0.0.0

# Optional: Log level
LOG_LEVEL=INFO
```

### Model Configuration
The backend automatically loads:
- Model: `results_rf_smote_controlled_pca1_wocs/models/rf_smote_model.joblib`
- Feature Selector: `results_rf_smote_controlled_pca1_wocs/models/feature_selector.joblib`
- Label Encoders: `results_rf_smote_controlled_pca1_wocs/models/label_encoders.joblib`
- Metadata: `results_rf_smote_controlled_pca1_wocs/models/model_metadata.json`

## 🧪 Testing

### Automated Testing
```bash
python test_backend.py
```

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# Model status
curl http://localhost:8000/model/status

# Prediction (with proper JSON payload)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","age":30,"income":50000,"loan_amount":500000,"loan_type":"home","employment_type":"salaried"}'
```

## 🔍 Monitoring

### Logs
The backend provides detailed logging:
- Model loading status
- Prediction requests and responses
- Error handling and debugging
- Performance metrics

### Metrics
- Total predictions processed
- Daily prediction count
- Average processing time
- Error rate tracking
- Model performance metrics

## 🚀 Integration with Frontend

This backend is designed to work seamlessly with the Next.js frontend:

1. **CORS Configuration** - Allows frontend requests
2. **API Compatibility** - Matches frontend expectations
3. **Error Handling** - Graceful fallbacks
4. **Response Format** - Consistent data structure

### Frontend Integration Steps
1. Start this backend on port 8000
2. Start Next.js frontend on port 3000
3. Frontend automatically connects to backend
4. Fallback to mock data if backend unavailable

## 🛠️ Development

### Adding New Features
1. Modify `fastapi_backend.py`
2. Update `test_backend.py` for testing
3. Test with provided scripts
4. Update documentation

### Model Updates
1. Replace model files in `results_rf_smote_controlled_pca1_wocs/models/`
2. Restart the backend
3. Test with `test_backend.py`
4. Verify API responses

## 📞 Troubleshooting

### Common Issues

1. **Model not loading**
   - Check if model files exist
   - Verify file paths in logs
   - Ensure proper permissions

2. **Port already in use**
   - Kill process using port 8000
   - Use different port with `--port` flag

3. **Import errors**
   - Install all requirements: `pip install -r requirements.txt`
   - Install FastAPI: `pip install fastapi uvicorn`

4. **Prediction errors**
   - Check input data format
   - Verify all required fields
   - Check backend logs for details

### Debug Mode
```bash
uvicorn fastapi_backend:app --reload --log-level debug
```

## 📈 Performance

- **Startup Time**: ~5-10 seconds (model loading)
- **Prediction Time**: ~2-3 seconds per request
- **Memory Usage**: ~500MB (with model loaded)
- **Concurrent Requests**: Supports multiple simultaneous requests

## 🔒 Security

- **Input Validation** - All inputs validated with Pydantic
- **Error Handling** - No sensitive data in error messages
- **CORS Protection** - Configured for specific origins
- **Logging** - Audit trail for all predictions

## 📝 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎉 Success Indicators

The backend is working correctly when:
- ✅ Server starts without errors
- ✅ Model loads successfully
- ✅ Health endpoint returns 200
- ✅ Model status shows active
- ✅ Predictions return valid results
- ✅ All test scripts pass

---

**Branch**: integration  
**Status**: ✅ Production Ready  
**Last Updated**: January 2024
