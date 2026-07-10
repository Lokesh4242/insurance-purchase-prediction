# Predicting Customer Insurance Purchases — AI Internship Project (IntrnForte)

Author: Lokesh S Gowda
Date: July 10, 2026

## Overview
Compares five classification algorithms (Logistic Regression, KNN, SVM, Decision Tree,
Random Forest) to predict whether a customer will purchase insurance based on Age and
Estimated Salary, using the Social_Network_Ads dataset (400 records).

## Folder structure
- data/Social_Network_Ads.txt      — source dataset (Age, EstimatedSalary, Purchased)
- code/01_train_and_compare.py     — trains all 5 models, builds comparison table + plots
- code/02_predictions_and_hypotheses.py — assignment-specific predictions + hypothesis testing
- code/03_generate_report.js       — generates the final Word report (requires Node + docx package)
- plots/                           — all generated figures (PNG)
- outputs/                         — comparison tables (CSV/JSON), predictions, hypothesis results,
                                      and the final Word report

## How to reproduce
1. pip install pandas scikit-learn matplotlib --break-system-packages
2. python3 code/01_train_and_compare.py
3. python3 code/02_predictions_and_hypotheses.py
4. (optional) node code/03_generate_report.js   — regenerates the Word report

## Key result
Best model: KNN (k=5) — 93% test accuracy with negligible train/test overfit gap,
outperforming Logistic Regression, SVM, Decision Tree, and Random Forest on this dataset.

See outputs/Insurance_Purchase_Prediction_Report.docx for the full write-up, including
graphical analysis, the assignment's specific prediction scenarios, and hypothesis testing.
