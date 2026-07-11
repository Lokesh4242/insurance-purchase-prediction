# Predicting Customer Insurance Purchases — AI Internship Project (IntrnForte)

Author: Lokesh S Gowda
Date: July 10, 2026

## Overview
Compares five classification algorithms (Logistic Regression, KNN, SVM, Decision Tree,
Random Forest) to predict whether a customer will purchase insurance based on Age and
Estimated Salary, using the Social_Network_Ads dataset (400 records).

## Folder structure (as uploaded to GitHub — flat structure)
- Social_Network_Ads.txt — source dataset (Age, EstimatedSalary, Purchased)
- 01_train_and_compare.py — trains all 5 models, builds comparison table + plots
- 02_predictions_and_hypotheses.py — assignment-specific predictions + hypothesis testing
- 03_generate_report.js — generates the final Word report (requires Node + docx package)
- 01_raw_scatter.png, 02_decision_boundaries.png, 03_comparison_bar.png, 04_set1_predictions.png, 05_hypothesis_heatmap.png — all generated figures
- model_comparison.csv / model_comparison.json — comparison table for all 5 classifiers
- predictions.json — prediction outputs for both scenario sets
- hypothesis_summary.json — hypothesis-testing outputs
- Insurance_Purchase_Prediction_Report.docx — the final Word report

## How to reproduce
1. pip install pandas scikit-learn matplotlib --break-system-packages
2. python3 01_train_and_compare.py
3. python3 02_predictions_and_hypotheses.py
4. (optional) node 03_generate_report.js   — regenerates the Word report

## Key result
Best model: KNN (k=5) — 93% test accuracy with negligible train/test overfit gap,
outperforming Logistic Regression, SVM, Decision Tree, and Random Forest on this dataset.

See Insurance_Purchase_Prediction_Report.docx for the full write-up, including
graphical analysis, the assignment's specific prediction scenarios, and hypothesis testing.
