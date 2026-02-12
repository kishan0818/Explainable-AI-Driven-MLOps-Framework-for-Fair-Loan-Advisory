
try:
    from sklearn.ensemble import RandomForestClassifier
    print("sklearn imported")
    from imblearn.over_sampling import SMOTE
    print("imblearn imported")
except Exception as e:
    print(e)
