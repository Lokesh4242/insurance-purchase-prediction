"""
03_predictions_and_hypotheses.py
Uses the best model (KNN, k=5) to:
  1. Predict the specific Age/Salary scenarios from the assignment
  2. Run hypothesis tests by systematically varying age and salary
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

BASE = "/home/claude/insurance_project"

data = pd.read_csv(f"{BASE}/data/Social_Network_Ads.txt")
X = data[['Age', 'EstimatedSalary']]
y = data['Purchased']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

best_model = KNeighborsClassifier(n_neighbors=5)
best_model.fit(X_train_s, y_train)

print(f"Training data range -> Age: {X['Age'].min()}-{X['Age'].max()}, "
      f"Salary: {X['EstimatedSalary'].min()}-{X['EstimatedSalary'].max()}")

# ---------------------------------------------------------------
# SET 1: within/near the training data range ("No Salary" -> treat as 0)
# ---------------------------------------------------------------
set1 = [
    {"Age": 30, "EstimatedSalary": 87000, "label": "Age 30, Salary 87,000"},
    {"Age": 40, "EstimatedSalary": 0, "label": "Age 40, No Salary"},
    {"Age": 40, "EstimatedSalary": 100000, "label": "Age 40, Salary 100,000"},
    {"Age": 50, "EstimatedSalary": 0, "label": "Age 50, No Salary"},
]

# ---------------------------------------------------------------
# SET 2: far outside the training range (extreme extrapolation)
# ---------------------------------------------------------------
set2 = [
    {"Age": 18, "EstimatedSalary": 0, "label": "Age 18, No Salary"},
    {"Age": 22, "EstimatedSalary": 600000, "label": "Age 22, Salary 600,000"},
    {"Age": 35, "EstimatedSalary": 2500000, "label": "Age 35, Salary 2,500,000"},
    {"Age": 60, "EstimatedSalary": 100000000, "label": "Age 60, Salary 100,000,000"},
]

def predict_set(rows, min_sal, max_sal, min_age, max_age):
    out = []
    for r in rows:
        arr = pd.DataFrame([[r["Age"], r["EstimatedSalary"]]], columns=['Age', 'EstimatedSalary'])
        arr_s = scaler.transform(arr)
        pred = best_model.predict(arr_s)[0]
        proba = best_model.predict_proba(arr_s)[0][1]  # P(purchase)
        out_of_range = bool(r["EstimatedSalary"] > max_sal or r["EstimatedSalary"] < min_sal
                             or r["Age"] > max_age or r["Age"] < min_age)
        out.append({
            **r,
            "Prediction": "Purchased" if pred == 1 else "Not Purchased",
            "Probability_of_Purchase": round(float(proba), 4),
            "Out_of_Training_Range": out_of_range
        })
    return out

min_sal, max_sal = X['EstimatedSalary'].min(), X['EstimatedSalary'].max()
min_age, max_age = X['Age'].min(), X['Age'].max()

results_set1 = predict_set(set1, min_sal, max_sal, min_age, max_age)
results_set2 = predict_set(set2, min_sal, max_sal, min_age, max_age)

print("\n=== SET 1 PREDICTIONS ===")
for r in results_set1:
    print(r)

print("\n=== SET 2 PREDICTIONS (extreme values) ===")
for r in results_set2:
    print(r)

with open(f"{BASE}/outputs/predictions.json", "w") as f:
    json.dump({"set1": results_set1, "set2": results_set2}, f, indent=2)

# ---------------------------------------------------------------
# Plot: mark the 8 prediction points on the decision surface
# ---------------------------------------------------------------
X_all_s = scaler.transform(X)
x_min, x_max = X_all_s[:, 0].min() - 1, X_all_s[:, 0].max() + 1
y_min, y_max = X_all_s[:, 1].min() - 1, X_all_s[:, 1].max() + 1
xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.02), np.arange(y_min, y_max, 0.02))
Z = best_model.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

fig, ax = plt.subplots(figsize=(8, 6.5))
from matplotlib.colors import ListedColormap
ax.contourf(xx, yy, Z, cmap=ListedColormap(['#fadbd8', '#d5f5e3']), alpha=0.8)
ax.scatter(X_all_s[:, 0], X_all_s[:, 1], c=y, cmap=ListedColormap(['#e74c3c', '#27ae60']),
           edgecolor='k', s=20, alpha=0.6, label="Training data")

for r in results_set1:
    pt = scaler.transform([[r["Age"], r["EstimatedSalary"]]])
    ax.scatter(pt[0, 0], pt[0, 1], marker='*', s=300, c='blue', edgecolor='black', zorder=5)
    ax.annotate(r["label"].split(",")[0], (pt[0, 0], pt[0, 1]), textcoords="offset points",
                xytext=(8, 8), fontsize=8, fontweight='bold')

ax.set_xlabel("Age (scaled)")
ax.set_ylabel("Estimated Salary (scaled)")
ax.set_title("Assignment Scenario Predictions (Set 1) on KNN Decision Surface")
plt.tight_layout()
plt.savefig(f"{BASE}/plots/04_set1_predictions.png", dpi=150)
plt.close()

# ---------------------------------------------------------------
# Hypothesis testing
# ---------------------------------------------------------------
# H1: Older individuals with higher salaries are more likely to purchase
# H2: Salary has a stronger effect than age on purchase probability
# H3: Very young individuals rarely purchase regardless of salary

ages_range = np.arange(18, 61, 2)
salaries_range = np.arange(15000, 151000, 5000)

prob_grid = np.zeros((len(ages_range), len(salaries_range)))
for i, a in enumerate(ages_range):
    for j, s in enumerate(salaries_range):
        pt = scaler.transform([[a, s]])
        prob_grid[i, j] = best_model.predict_proba(pt)[0][1]

plt.figure(figsize=(9, 6))
im = plt.imshow(prob_grid, aspect='auto', origin='lower', cmap='RdYlGn',
                 extent=[salaries_range.min(), salaries_range.max(), ages_range.min(), ages_range.max()])
plt.colorbar(im, label="Predicted Probability of Purchase")
plt.xlabel("Estimated Salary")
plt.ylabel("Age")
plt.title("Hypothesis Testing: Predicted Purchase Probability by Age & Salary")
plt.tight_layout()
plt.savefig(f"{BASE}/plots/05_hypothesis_heatmap.png", dpi=150)
plt.close()

# Quantify: average effect of age (holding salary mid-range) vs effect of salary (holding age mid-range)
mid_salary = 70000
mid_age = 38

age_effect = []
for a in ages_range:
    pt = scaler.transform([[a, mid_salary]])
    age_effect.append(best_model.predict_proba(pt)[0][1])

salary_effect = []
for s in salaries_range:
    pt = scaler.transform([[mid_age, s]])
    salary_effect.append(best_model.predict_proba(pt)[0][1])

age_swing = max(age_effect) - min(age_effect)
salary_swing = max(salary_effect) - min(salary_effect)

print(f"\nHolding salary at {mid_salary}, probability swing across ages 18-60: {age_swing:.4f}")
print(f"Holding age at {mid_age}, probability swing across salary 15k-150k: {salary_swing:.4f}")

# Young + high salary check (H3)
young_high_salary = scaler.transform([[20, 145000]])
young_high_salary_prob = best_model.predict_proba(young_high_salary)[0][1]
old_high_salary = scaler.transform([[55, 145000]])
old_high_salary_prob = best_model.predict_proba(old_high_salary)[0][1]

print(f"\nAge 20, Salary 145,000 -> P(purchase) = {young_high_salary_prob:.4f}")
print(f"Age 55, Salary 145,000 -> P(purchase) = {old_high_salary_prob:.4f}")

hypothesis_summary = {
    "age_probability_swing_at_mid_salary": round(float(age_swing), 4),
    "salary_probability_swing_at_mid_age": round(float(salary_swing), 4),
    "young_high_salary_prob": round(float(young_high_salary_prob), 4),
    "old_high_salary_prob": round(float(old_high_salary_prob), 4),
}
with open(f"{BASE}/outputs/hypothesis_summary.json", "w") as f:
    json.dump(hypothesis_summary, f, indent=2)

print("\nAll predictions and hypothesis testing complete.")
