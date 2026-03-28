import pandas as pd
import numpy as np
from sklearn.datasets import fetch_kddcup99


def load_kdd_dataframe(subset='SA', percent10=False):
    """Fetch KDDCup99 dataset and return as pandas DataFrame.

    subset: used by fetch_kddcup99; default 'SA' (same as sklearn examples).
    percent10: if True, load the 10% sample (faster but smaller).
    """
    data = fetch_kddcup99(subset=subset, percent10=percent10, as_frame=True)
    X = data.data.copy()
    for col in X.columns:
        if X[col].dtype == object and isinstance(X[col].iloc[0], bytes):
            X[col] = X[col].str.decode('utf-8')
    y = data.target.copy()
    # Ensure string labels
    y = y.astype(str)
    # Map to binary: 0=normal, 1=attack
    y = y.apply(lambda v: 0 if 'normal' in v else 1)
    return X, y


def get_feature_columns():
    """Return the feature columns used by the KDD dataframe.
    """
    # fetch a small sample to obtain columns
    X, _ = load_kdd_dataframe(subset='SA', percent10=True)
    return list(X.columns)


def sample_input_frame(n=1):
    """Return a small DataFrame sample for inference example."""
    X, _ = load_kdd_dataframe(subset='SA', percent10=True)
    return X.sample(n=n, random_state=42).reset_index(drop=True)
