import argparse
import sys
import joblib
import pandas as pd


def load_input(file_path=None):
    if file_path:
        if file_path.lower().endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.lower().endswith('.json'):
            return pd.read_json(file_path, lines=True)
        else:
            raise ValueError('Unsupported file format: use .csv or .json')
    else:
        # read single JSON line from stdin
        data = sys.stdin.read()
        try:
            return pd.read_json(data, lines=True)
        except Exception:
            # fallback: try csv parse
            from io import StringIO
            return pd.read_csv(StringIO(data))


def main(model_path, file_path=None):
    pipe = joblib.load(model_path)
    df = load_input(file_path)
    preds = pipe.predict(df)
    probs = None
    if hasattr(pipe, 'predict_proba'):
        probs = pipe.predict_proba(df)

    for i, p in enumerate(preds):
        label = 'attack' if int(p) == 1 else 'normal'
        if probs is not None:
            score = probs[i, 1] if probs.shape[1] > 1 else probs[i, 0]
            print(f'Row {i}: {label} (score={score:.4f})')
        else:
            print(f'Row {i}: {label}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run NIDS detection from saved pipeline')
    parser.add_argument('--model', required=True, help='Path to trained pipeline joblib file')
    parser.add_argument('--file', help='CSV or JSONL file containing feature rows')
    args = parser.parse_args()
    main(args.model, args.file)
