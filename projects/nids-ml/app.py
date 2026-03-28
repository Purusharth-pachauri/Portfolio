from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import joblib
import os
import sys

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'nids_pipeline.joblib')

try:
    pipe = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    pipe = None

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    if pipe is None:
        return jsonify({'error': 'Model not loaded on server.'}), 500
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided.'}), 400
        
        # Convert dictionary to DataFrame and cast all to string
        # since the model was incorrectly trained with all object dtypes
        df = pd.DataFrame([data]).astype(str)
        
        preds = pipe.predict(df)
        probs = None
        if hasattr(pipe, 'predict_proba'):
            probs = pipe.predict_proba(df)

        prediction_val = int(preds[0])
        # Model labels: 1=attack, 0=normal
        label = 'Attack' if prediction_val == 1 else 'Normal'
        
        score = None
        if probs is not None:
            score = probs[0, 1] if probs.shape[1] > 1 else probs[0, 0]

        return jsonify({
            'prediction': label,
            'is_attack': bool(prediction_val == 1),
            'confidence': float(score) if score is not None else None
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
