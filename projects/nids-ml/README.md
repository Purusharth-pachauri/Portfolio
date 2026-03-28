# ML-based Network Intrusion Detection System (NIDS)

This repository contains a minimal ML-based Network Intrusion Detection System using the KDD Cup 1999 dataset (via scikit-learn). It provides scripts to train a classifier and run detection on sample inputs.

Important: This is intended as a demonstration and starting point for research or prototyping, not production-ready IDS software.

Quick start

1. Create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Train the model (this will download the KDDCup99 dataset via scikit-learn):

```powershell
python train.py --out models/nids_pipeline.joblib
```

3. Run detection on a CSV of flow features (see `sample_input.csv` for format):

```powershell
python detect.py --model models/nids_pipeline.joblib --file sample_input.csv
```

Files

- `train.py` — trains a pipeline (preprocessing + classifier) and saves the model.
- `detect.py` — loads the saved pipeline and runs inference on CSV/JSON input.
- `utils.py` — helper functions (data loading and preprocessing helpers).
- `sample_input.csv` — an example input row matching features used by the pipeline.
- `models/` — recommended place to save the trained pipeline.

Notes & next steps

- The project uses the KDDCup99 dataset (from `sklearn.datasets.fetch_kddcup99`) for convenience. For modern, higher-fidelity datasets consider `CICIDS2017` or `UNSW-NB15`.
- You should augment/replace features with modern flow features (e.g., from Zeek/netflow) for production use.
- Consider adding online inference, a streaming ingestion pipeline, or an evaluation suite.
