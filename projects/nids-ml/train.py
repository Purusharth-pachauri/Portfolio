import argparse
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

from utils import load_kdd_dataframe


def build_pipeline(categorical_cols, numeric_cols):
    cat = Pipeline(steps=[('ohe', OneHotEncoder(handle_unknown='ignore'))])
    num = Pipeline(steps=[('scale', StandardScaler())])
    pre = ColumnTransformer(transformers=[
        ('cat', cat, categorical_cols),
        ('num', num, numeric_cols)
    ])

    clf = RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced')
    pipe = Pipeline(steps=[('pre', pre), ('clf', clf)])
    return pipe


def main(out_path):
    print('Loading dataset (this may download the KDDCup99 dataset via scikit-learn)...')
    X, y = load_kdd_dataframe(subset='SA', percent10=True)
    # identify categorical and numeric columns
    categorical_cols = [c for c in X.columns if X[c].dtype == object]
    numeric_cols = [c for c in X.columns if X[c].dtype != object]

    print('Columns:', len(X.columns), 'cat:', len(categorical_cols), 'num:', len(numeric_cols))
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pipe = build_pipeline(categorical_cols, numeric_cols)
    print('Training...')
    pipe.fit(X_train, y_train)

    print('Evaluating...')
    y_pred = pipe.predict(X_test)
    print(classification_report(y_test, y_pred, digits=4))
    print('Confusion matrix:\n', confusion_matrix(y_test, y_pred))

    out_dir = Path(out_path).parent
    if out_dir and not out_dir.exists():
        out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, out_path)
    print('Saved pipeline to', out_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train NIDS pipeline')
    parser.add_argument('--out', default='models/nids_pipeline.joblib', help='Output path for the trained pipeline')
    args = parser.parse_args()
    main(args.out)
