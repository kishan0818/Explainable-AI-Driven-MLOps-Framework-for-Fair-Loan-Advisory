# 🚀 Quick Start Guide - TWXAI Integrated System

## Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- All dependencies installed (see below)

## 🎯 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
# Install Python dependencies
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install fastapi uvicorn requests

# Install Node.js dependencies (from root directory)
cd ..
npm install
```

### Step 2: Start the System
**Option A: Automated (Recommended)**
```bash
# Windows Batch
start_integrated_system.bat

# Windows PowerShell
.\start_integrated_system.ps1
```

**Option B: Manual**
```bash
# Terminal 1: Start Backend
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
python fastapi_backend.py

# Terminal 2: Start Frontend
npm run dev
```

### Step 3: Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# Test backend manually
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
python test_backend.py
```

### Frontend Issues
```bash
# Check if frontend is running
curl http://localhost:3000

# Restart frontend
npm run dev
```

### Common Problems
1. **Port 8000 in use**: Kill process using port 8000
2. **Port 3000 in use**: Kill process using port 3000
3. **Model not loading**: Check if model files exist in `TWXAI_backend/results_rf_smote_controlled_pca1_wocs/models/`

## 📊 Test the System

### Test Backend
```bash
cd TWXAI_backend
.\venv\Scripts\Activate.ps1
python test_backend.py
```

### Test Frontend
1. Go to http://localhost:3000
2. Fill out the loan application form
3. Submit and check the prediction results

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Backend shows: "Model loaded successfully!"
- ✅ Frontend loads without errors
- ✅ API calls return prediction results
- ✅ SHAP explanations are displayed
- ✅ Government schemes are suggested

## 📞 Need Help?

1. Check the logs in the terminal windows
2. Verify all dependencies are installed
3. Ensure ports 3000 and 8000 are available
4. Check the comprehensive documentation in `INTEGRATION_README.md`
