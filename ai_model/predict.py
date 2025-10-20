# ai_model/predict.py

import sys
import json
import joblib

def predict_fraud():
    """
    Reads user data from stdin, predicts fraud, and prints the result to stdout.
    """
    try:
        input_str = sys.stdin.read()
        data = json.loads(input_str)

        with open("ai_model/fraud_model.pkl", "rb") as f: 
            model = joblib.load(f)

        X_new = [[
            data["num_cancellations"],
            data["num_of_unconfirmed_parcels"],
            data["payment_fail_ratio"]
        ]]

        prediction = model.predict(X_new)[0]
        try:
            probabilities = model.predict_proba(X_new)[0]
            score = probabilities[1] 
        except AttributeError:
            score = float(prediction) 

    
        result = {
            "is_suspicious": bool(prediction),
            "score": round(score, 2) 
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(f"Error in Python script: {str(e)}", file=sys.stderr)
        sys.exit(1) 

if __name__ == "__main__":
    predict_fraud()