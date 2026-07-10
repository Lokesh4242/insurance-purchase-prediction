"""
02_train_and_compare.py
Trains all 5 classifiers on the Social_Network_Ads dataset, evaluates them,
builds a comparison table, and produces the graphical analysis plots.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import json

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, confusion_matrix, classification_report)

from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

BASE = "/home/claude/insurance_project"

# ---------------------------------------------------------------
# 1. Load data (exact dataset used in Loki's original notebook)
# ---------------------------------------------------------------
data = pd.read_csv(f"{BASE}/data/Social_Network_Ads.txt")

X = data[['Age', 'EstimatedSalary']]
y = data['Purchased']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

# ---------------------------------------------------------------
# 2. Train all 5 classifiers (same hyperparameters as the notebook)
# ---------------------------------------------------------------
models = {
    "Logistic Regression": LogisticRegression(),
    "KNN (k=5)": KNeighborsClassifier(n_neighbors=5),
    "SVM (Linear Kernel)": SVC(kernel='linear', random_state=42, probability=True),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
}

results = []
trained = {}

for name, model in models.items():
    model.fit(X_train_s, y_train)
    trained[name] = model
    y_pred = model.predict(X_test_s)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    # 5-fold-style overfitting check: compare train vs test accuracy
    train_acc = accuracy_score(y_train, model.predict(X_train_s))

    results.append({
        "Model": name,
        "Train Accuracy": round(train_acc, 4),
        "Test Accuracy": round(acc, 4),
        "Precision": round(prec, 4),
        "Recall": round(rec, 4),
        "F1-Score": round(f1, 4),
        "Overfit Gap": round(train_acc - acc, 4),
        "Confusion Matrix": cm.tolist()
    })

results_df = pd.DataFrame(results)
results_df.to_csv(f"{BASE}/outputs/model_comparison.csv", index=False)
print(results_df[["Model", "Train Accuracy", "Test Accuracy", "Precision", "Recall", "F1-Score", "Overfit Gap"]])

with open(f"{BASE}/outputs/model_comparison.json", "w") as f:
    json.dump(results, f, indent=2)

# Pick the best model = highest test accuracy with the smallest overfit gap
# (tie-break: smallest overfit gap wins)
results_df_sorted = results_df.sort_values(
    by=["Test Accuracy", "Overfit Gap"], ascending=[False, True]
)
best_model_name = results_df_sorted.iloc[0]["Model"]
best_model = trained[best_model_name]
print(f"\nBest model selected: {best_model_name}")

# ---------------------------------------------------------------
# 3. Graphical analysis: raw data scatter (Age vs Salary, colored by Purchased)
# ---------------------------------------------------------------
plt.figure(figsize=(7, 5.5))
for cls, color, label in [(0, '#e74c3c', 'Did Not Purchase (0)'), (1, '#27ae60', 'Purchased (1)')]:
    subset = data[data['Purchased'] == cls]
    plt.scatter(subset['Age'], subset['EstimatedSalary'], c=color, label=label,
                edgecolor='k', alpha=0.75, s=35)
plt.xlabel("Age")
plt.ylabel("Estimated Salary")
plt.title("Customer Insurance Purchases by Age and Estimated Salary")
plt.legend()
plt.tight_layout()
plt.savefig(f"{BASE}/plots/01_raw_scatter.png", dpi=150)
plt.close()

# ---------------------------------------------------------------
# 4. Decision boundary plots for all 5 models (2x3 grid)
# ---------------------------------------------------------------
X_all_s = scaler.transform(X)  # scaled full feature set, for boundary range
x_min, x_max = X_all_s[:, 0].min() - 1, X_all_s[:, 0].max() + 1
y_min, y_max = X_all_s[:, 1].min() - 1, X_all_s[:, 1].max() + 1
xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.02),
                      np.arange(y_min, y_max, 0.02))

cmap_light = ListedColormap(['#fadbd8', '#d5f5e3'])
cmap_bold = ListedColormap(['#e74c3c', '#27ae60'])

fig, axes = plt.subplots(2, 3, figsize=(16, 10))
axes = axes.flatten()

for ax, (name, model) in zip(axes, models.items()):
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)
    ax.contourf(xx, yy, Z, cmap=cmap_light, alpha=0.8)
    ax.scatter(X_test_s[:, 0], X_test_s[:, 1], c=y_test, cmap=cmap_bold,
               edgecolor='k', s=25)
    acc = results_df[results_df["Model"] == name]["Test Accuracy"].values[0]
    ax.set_title(f"{name}\nTest Accuracy: {acc:.2%}")
    ax.set_xlabel("Age (scaled)")
    ax.set_ylabel("Estimated Salary (scaled)")

# hide the unused 6th subplot
axes[-1].axis('off')

plt.suptitle("Decision Boundaries — Test Set, All 5 Classifiers", fontsize=15, y=1.00)
plt.tight_layout()
plt.savefig(f"{BASE}/plots/02_decision_boundaries.png", dpi=150, bbox_inches='tight')
plt.close()

# ---------------------------------------------------------------
# 5. Model comparison bar chart
# ---------------------------------------------------------------
plt.figure(figsize=(9, 5.5))
metrics_to_plot = ["Test Accuracy", "Precision", "Recall", "F1-Score"]
x = np.arange(len(models))
width = 0.2
for i, metric in enumerate(metrics_to_plot):
    vals = results_df[metric].values
    plt.bar(x + i * width, vals, width, label=metric)
plt.xticks(x + width * 1.5, results_df["Model"], rotation=15, ha='right')
plt.ylim(0, 1.05)
plt.ylabel("Score")
plt.title("Classifier Comparison — Accuracy, Precision, Recall, F1")
plt.legend()
plt.tight_layout()
plt.savefig(f"{BASE}/plots/03_comparison_bar.png", dpi=150)
plt.close()

print("\nAll plots and comparison files saved.")
print(f"Best model: {best_model_name}")
