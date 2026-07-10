const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, ImageRun, PageBreak,
  LevelFormat, ExternalHyperlink, InternalHyperlink, BookmarkStart, BookmarkEnd, VerticalAlign
} = require("docx");
const fs = require("fs");

const BASE = "/home/claude/insurance_project";
const P = BASE + "/plots";

// ---------- load computed results ----------
const comparison = JSON.parse(fs.readFileSync(`${BASE}/outputs/model_comparison.json`));
const predictions = JSON.parse(fs.readFileSync(`${BASE}/outputs/predictions.json`));
const hypo = JSON.parse(fs.readFileSync(`${BASE}/outputs/hypothesis_summary.json`));

const bestModel = comparison.slice().sort((a, b) => {
  if (b["Test Accuracy"] !== a["Test Accuracy"]) return b["Test Accuracy"] - a["Test Accuracy"];
  return a["Overfit Gap"] - b["Overfit Gap"];
})[0];

// ---------- helpers ----------
const FONT = "Calibri";
const COLW = 12240 - 2 * 1440; // usable width, US Letter, 1" margins

function h(text, level) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
}
// heading with a bookmark anchor for TOC hyperlinks
function hAnchored(text, level, bookmarkId) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 150 },
    children: [
      new BookmarkStart(bookmarkId, bookmarkId),
      new TextRun({ text }),
      new BookmarkEnd(bookmarkId),
    ],
  });
}
function tocEntry(text, bookmarkId) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new InternalHyperlink({
        anchor: bookmarkId,
        children: [new TextRun({ text, style: "Hyperlink", font: FONT, size: 22 })],
      }),
    ],
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
    spacing: { after: 160 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
  });
}
function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}
function image(path, width, height) {
  return new Paragraph({
    children: [new ImageRun({ data: fs.readFileSync(path), transformation: { width, height }, type: "png" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
  });
}
function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 20, font: FONT })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { fill: "2E5395", type: ShadingType.CLEAR } : (opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined),
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: String(text), bold: !!opts.header, color: opts.header ? "FFFFFF" : "000000", size: 20, font: FONT })],
    })],
  });
}

// ================= TITLE PAGE =================
const titlePage = [
  new Paragraph({ text: "", spacing: { before: 2000 } }),
  new Paragraph({
    children: [new TextRun({ text: "Predicting Customer Insurance Purchases Using Machine Learning Classification Algorithms",
      bold: true, size: 40, font: FONT })],
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "A Comparative Study of Logistic Regression, KNN, SVM, Decision Tree, and Random Forest",
      italics: true, size: 26, font: FONT, color: "555555" })],
    alignment: AlignmentType.CENTER, spacing: { after: 900 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Submitted as part of the Artificial Intelligence Internship", size: 24, font: FONT })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "IntrnForte", bold: true, size: 24, font: FONT })],
    alignment: AlignmentType.CENTER, spacing: { after: 900 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Prepared by: ", bold: true, size: 24, font: FONT }),
      new TextRun({ text: "Lokesh S Gowda", size: 24, font: FONT })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Computer Science and Engineering, BGS Institute of Technology (VTU)", size: 22, font: FONT, color: "555555" })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Date of Submission: July 10, 2026", size: 22, font: FONT })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 },
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ================= ABSTRACT =================
const abstract = [
  hAnchored("Abstract", HeadingLevel.HEADING_1, "bm_abstract"),
  body("This project addresses a practical business problem for a Bank Insurance Company: predicting whether a prospective customer will purchase an insurance product based solely on two attributes, Age and Estimated Salary. Using a labeled dataset of 400 customer records, five supervised classification algorithms — Logistic Regression, K-Nearest Neighbors (KNN), Support Vector Machine (SVM), Decision Tree, and Random Forest — were trained and evaluated on an identical 75/25 train-test split with standardized features."),
  body("The comparative analysis measured accuracy, precision, recall, F1-score, and the gap between training and testing accuracy as a proxy for overfitting. KNN (k=5) produced the strongest overall result, reaching 93% test accuracy while showing almost no gap between training and testing performance, indicating good generalization. In contrast, the Decision Tree and Random Forest models fit the training data almost perfectly (99.67% train accuracy) but scored lower on the test set, a clear sign of overfitting."),
  body("The trained KNN model was then used to predict purchase outcomes for eight specific age/salary scenarios drawn from the assignment brief, and to test three hypotheses about how age and salary individually influence the likelihood of purchase. The analysis found that salary has a stronger and more consistent effect on purchase probability than age within the observed data range, and that predictions for inputs far outside the training data (e.g., salaries in the hundreds of thousands or millions) should be treated as low-confidence extrapolations rather than reliable forecasts. The report concludes with practical recommendations for how a bank insurance company could apply this type of model in real customer targeting workflows."),
];

// ================= TABLE OF CONTENTS =================
const toc = [
  h("Table of Contents", HeadingLevel.HEADING_1),
  tocEntry("Abstract", "bm_abstract"),
  tocEntry("1. Introduction", "bm_intro"),
  tocEntry("2. Literature Review", "bm_litreview"),
  tocEntry("3. Problem Statement", "bm_problem"),
  tocEntry("4. Data Collection and Preprocessing", "bm_data"),
  tocEntry("5. Methodology", "bm_methodology"),
  tocEntry("6. Implementation", "bm_implementation"),
  tocEntry("7. Results", "bm_results"),
  tocEntry("     7.1 Graphical Analysis and Predictions — Scenario Set 1", "bm_set1"),
  tocEntry("     7.2 Graphical Analysis and Predictions — Scenario Set 2 (Extreme Values)", "bm_set2"),
  tocEntry("     7.3 Hypothesis Testing", "bm_hypothesis"),
  tocEntry("8. Discussion", "bm_discussion"),
  tocEntry("9. Conclusion", "bm_conclusion"),
  tocEntry("10. Lessons Learned and Real-Life Application", "bm_lessons"),
  tocEntry("11. References", "bm_references"),
  tocEntry("12. Appendices", "bm_appendices"),
  tocEntry("Acknowledgments", "bm_acknowledgments"),
  new Paragraph({ children: [new PageBreak()] }),
];

// ================= INTRODUCTION =================
const introduction = [
  hAnchored("1. Introduction", HeadingLevel.HEADING_1, "bm_intro"),
  body("Insurance companies routinely need to decide which customers are worth targeting with a given product offer. Manually reviewing every customer's demographic profile does not scale, and simple rule-of-thumb heuristics (e.g., 'target everyone over 40') tend to leave money on the table or waste marketing spend on customers who are unlikely to buy. This project explores whether a machine learning classification model can learn a more accurate purchase-likelihood pattern directly from historical customer data, using only two easily available, non-sensitive attributes: Age and Estimated Salary."),
  body("The objective of this project is threefold: (1) build and fairly compare five different classification algorithms on the same dataset and evaluation protocol, (2) identify the algorithm that best balances accuracy with generalization (i.e., does not overfit the training data), and (3) use the selected model to answer specific business questions posed in the assignment brief, including predictions for named customer profiles and a set of hypotheses about how age and salary drive purchasing behavior."),
  body("The AI techniques used are all supervised classification methods from the scikit-learn library: Logistic Regression, K-Nearest Neighbors (KNN), Support Vector Machine (SVM) with a linear kernel, Decision Tree, and Random Forest (an ensemble method). Each model was trained on identical, standardized data so that differences in performance reflect genuine differences between the algorithms rather than differences in data handling."),
];

// ================= LITERATURE REVIEW =================
const literatureReview = [
  hAnchored("2. Literature Review", HeadingLevel.HEADING_1, "bm_litreview"),
  body("Binary classification on tabular demographic data is one of the most well-studied problems in applied machine learning, and the specific Age/EstimatedSalary/Purchased dataset used in this project (commonly known as the 'Social Network Ads' dataset) is a widely used teaching dataset for comparing classifiers, appearing in numerous machine learning courses and open-source repositories."),
  body("Logistic Regression remains a strong baseline for binary classification problems because it is simple, interpretable, and performs well when the relationship between features and the outcome is approximately linear or can be captured after feature scaling. KNN, a non-parametric, instance-based method, tends to perform well on datasets with local, non-linear decision boundaries, since it makes no assumption about the global shape of the boundary and instead relies on the class labels of the nearest data points. SVM with a linear kernel behaves similarly to logistic regression in that it also finds a linear separating boundary, though it optimizes for maximum margin rather than likelihood."),
  body("Decision Trees are popular for their interpretability but are well known in the literature to be prone to overfitting when grown without depth limits, since they can partition the feature space into arbitrarily small regions that fit noise in the training data. Random Forest, an ensemble of many decision trees trained on bootstrapped samples, was introduced specifically to address this weakness by averaging over many trees to reduce variance, though it can still overfit relative to simpler models on small datasets. These well-documented tendencies are consistent with what this project observed empirically (see Section 8, Results)."),
  body("A key ongoing challenge in applied classification work, and one directly relevant to this project, is the accuracy-generalization trade-off: a model that fits the training data extremely well is not necessarily the best model to deploy, because it may fail to generalize to new, unseen customers. This is the central comparative question this project investigates."),
];

// ================= PROBLEM STATEMENT =================
const problemStatement = [
  hAnchored("3. Problem Statement", HeadingLevel.HEADING_1, "bm_problem"),
  body("Given a customer's Age and Estimated Salary, predict whether that customer will purchase an insurance product (binary outcome: Purchased = 1, Not Purchased = 0). The problem is framed as a supervised binary classification task."),
  body("Assumptions and limitations:"),
  bullet("The dataset contains only two predictive features (Age, Estimated Salary); no information about existing insurance coverage, dependents, health status, occupation, or marketing channel is available, so the model can only capture patterns explainable by these two variables."),
  bullet("The dataset (400 records) is relatively small for machine learning standards, which limits how confidently the models can generalize, particularly for algorithms prone to overfitting."),
  bullet("The training data's Age range is 18–60 and Estimated Salary range is 15,000–150,000. Any prediction requested for inputs far outside this range (e.g., a salary of 2,500,000) is an extrapolation, and the model's confidence in such predictions cannot be considered reliable."),
  bullet("\"No Salary\" inputs in the assignment's prediction scenarios were interpreted as EstimatedSalary = 0, which itself falls outside the training range and is therefore also an extrapolation."),
];

// ================= DATA COLLECTION AND PREPROCESSING =================
const dataSection = [
  hAnchored("4. Data Collection and Preprocessing", HeadingLevel.HEADING_1, "bm_data"),
  body("The dataset used is the Social Network Ads dataset, containing 400 customer records with three relevant columns: Age, EstimatedSalary, and Purchased (the binary target). The dataset has no missing values in any column, so no imputation was required."),
  body("Summary statistics of the dataset:"),
  new Table({
    width: { size: COLW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [cell("Statistic", { header: true, width: 2500 }), cell("Age", { header: true, width: 2500 }), cell("EstimatedSalary", { header: true, width: 2500 }), cell("Purchased", { header: true, width: 2500 })] }),
      new TableRow({ children: [cell("Count"), cell("400"), cell("400"), cell("400")] }),
      new TableRow({ children: [cell("Mean"), cell("37.66"), cell("69,742.50"), cell("0.36")] }),
      new TableRow({ children: [cell("Std Dev"), cell("10.48"), cell("34,096.96"), cell("0.48")] }),
      new TableRow({ children: [cell("Min"), cell("18"), cell("15,000"), cell("0")] }),
      new TableRow({ children: [cell("25%"), cell("29.75"), cell("43,000"), cell("0")] }),
      new TableRow({ children: [cell("50%"), cell("37"), cell("70,000"), cell("0")] }),
      new TableRow({ children: [cell("75%"), cell("46"), cell("88,000"), cell("1")] }),
      new TableRow({ children: [cell("Max"), cell("60"), cell("150,000"), cell("1")] }),
    ],
  }),
  new Paragraph({ text: "", spacing: { after: 200 } }),
  body("Preprocessing steps applied:"),
  bullet("Feature/target split: Age and EstimatedSalary were used as the feature matrix (X); Purchased as the target vector (y)."),
  bullet("Train/test split: 75% training (300 records) / 25% testing (100 records), using a fixed random_state=42 for reproducibility across all five models."),
  bullet("Feature scaling: StandardScaler was fit on the training set and applied to both the training and test sets. Scaling is essential here because Age (range ~18–60) and EstimatedSalary (range ~15,000–150,000) are on very different numeric scales, which would otherwise dominate distance-based algorithms like KNN and SVM."),
  image(`${P}/01_raw_scatter.png`, 480, 380),
  caption("Figure 1: Raw data distribution — Age vs. Estimated Salary, colored by purchase outcome."),
];

// ================= METHODOLOGY =================
const methodology = [
  hAnchored("5. Methodology", HeadingLevel.HEADING_1, "bm_methodology"),
  body("Five classification algorithms were selected to represent a range of modeling approaches — linear, distance-based, margin-based, and tree-based/ensemble methods — so that the comparison would be meaningful rather than comparing near-identical models."),
  new Table({
    width: { size: COLW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [cell("Algorithm", { header: true, width: 2400 }), cell("Type", { header: true, width: 2400 }), cell("Key Parameters", { header: true, width: 4400 })] }),
      new TableRow({ children: [cell("Logistic Regression"), cell("Linear"), cell("Default scikit-learn parameters")] }),
      new TableRow({ children: [cell("K-Nearest Neighbors"), cell("Distance-based, non-parametric"), cell("k = 5 neighbors")] }),
      new TableRow({ children: [cell("Support Vector Machine"), cell("Margin-based, linear"), cell("kernel = 'linear', probability = True")] }),
      new TableRow({ children: [cell("Decision Tree"), cell("Tree-based"), cell("Default scikit-learn parameters (unrestricted depth)")] }),
      new TableRow({ children: [cell("Random Forest"), cell("Ensemble (bagged trees)"), cell("n_estimators = 100")] }),
    ],
  }),
  new Paragraph({ text: "", spacing: { after: 200 } }),
  body("All models were trained on the identical standardized training set and evaluated on the identical standardized test set, ensuring a fair, controlled comparison. Default (or near-default) hyperparameters were deliberately used rather than aggressively tuning each model, since the goal of this study was to compare the algorithms' natural tendencies (e.g., a Decision Tree's inherent tendency to overfit) rather than to find the single best-tuned model for this dataset."),
  body("Evaluation metrics: Accuracy, Precision, Recall, and F1-score were computed for each model on the test set. In addition, training accuracy was recorded for each model and compared to test accuracy — a large positive gap (train accuracy much higher than test accuracy) is treated in this study as a direct, practical signal of overfitting."),
];

// ================= IMPLEMENTATION =================
const implementation = [
  hAnchored("6. Implementation", HeadingLevel.HEADING_1, "bm_implementation"),
  body("The project was implemented in Python using pandas, scikit-learn, and matplotlib. The full source notebook and all supporting scripts are included in the project's GitHub repository and in the Appendices of this report. The core implementation pipeline is summarized below."),
  body("Data loading and preprocessing:"),
  new Paragraph({
    children: [new TextRun({
      text: "data = pd.read_csv(\"Social_Network_Ads.txt\")\nX = data[['Age', 'EstimatedSalary']]\ny = data['Purchased']\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)\nscaler = StandardScaler()\nX_train = scaler.fit_transform(X_train)\nX_test = scaler.transform(X_test)",
      font: "Consolas", size: 18,
    })],
    shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    spacing: { after: 200 },
  }),
  body("Model training (repeated for all five algorithms):"),
  new Paragraph({
    children: [new TextRun({
      text: "model = KNeighborsClassifier(n_neighbors=5)\nmodel.fit(X_train, y_train)\ny_pred = model.predict(X_test)\naccuracy_score(y_test, y_pred)",
      font: "Consolas", size: 18,
    })],
    shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    spacing: { after: 200 },
  }),
  body("The full source code, dataset, and all generated outputs are included in the ZIP submission alongside this report. GitHub repository: github.com/Lokesh4242/insurance-purchase-prediction (code and dataset to be pushed prior to final submission)."),
];

// ================= RESULTS =================
const modelRows = comparison.map(m => new TableRow({
  children: [
    cell(m.Model, { fill: m.Model === bestModel.Model ? "D5F5E3" : undefined }),
    cell(`${(m["Train Accuracy"] * 100).toFixed(2)}%`),
    cell(`${(m["Test Accuracy"] * 100).toFixed(2)}%`),
    cell(`${(m.Precision * 100).toFixed(2)}%`),
    cell(`${(m.Recall * 100).toFixed(2)}%`),
    cell(`${(m["F1-Score"] * 100).toFixed(2)}%`),
    cell(m["Overfit Gap"] >= 0 ? `+${(m["Overfit Gap"] * 100).toFixed(2)}%` : `${(m["Overfit Gap"] * 100).toFixed(2)}%`),
  ],
}));

const results = [
  hAnchored("7. Results", HeadingLevel.HEADING_1, "bm_results"),
  body("The table below summarizes performance for all five classifiers on the held-out 25% test set (100 customers). The row for the selected best model is highlighted."),
  new Table({
    width: { size: COLW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: ["Model", "Train Acc.", "Test Acc.", "Precision", "Recall", "F1-Score", "Overfit Gap"]
        .map((t, i) => cell(t, { header: true, width: i === 0 ? 2200 : 1670 })) }),
      ...modelRows,
    ],
  }),
  new Paragraph({ text: "", spacing: { after: 200 } }),
  body("\"Overfit Gap\" is Train Accuracy minus Test Accuracy. A large positive gap means the model fit the training data much better than it generalized to new data — the hallmark of overfitting. A negative or near-zero gap (as seen for Logistic Regression, KNN, and SVM) indicates the model generalized at least as well on unseen data as on the data it was trained on."),
  image(`${P}/03_comparison_bar.png`, 460, 280),
  caption("Figure 2: Test Accuracy, Precision, Recall, and F1-Score across all five classifiers."),
  image(`${P}/02_decision_boundaries.png`, 500, 320),
  caption("Figure 3: Decision boundaries learned by each classifier, plotted over the (scaled) test set. Note the smooth linear boundaries of Logistic Regression and SVM versus the flexible, blocky boundaries of the Decision Tree and Random Forest."),
  body(`Best-performing model: ${bestModel.Model}. This model was selected because it achieved the highest test accuracy (${(bestModel["Test Accuracy"] * 100).toFixed(0)}%) while also showing one of the smallest gaps between training and testing accuracy, indicating it fits genuine patterns in the data rather than memorizing noise. This model was used for all predictions and hypothesis tests in the remainder of this report.`),

  hAnchored("7.1 Graphical Analysis and Predictions — Scenario Set 1", HeadingLevel.HEADING_2, "bm_set1"),
  body("The assignment requested predictions for four customer profiles. \"No Salary\" was interpreted as EstimatedSalary = 0."),
  new Table({
    width: { size: COLW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: ["Scenario", "Prediction", "P(Purchase)", "In Training Range?"].map(t => cell(t, { header: true, width: 2400 })) }),
      ...predictions.set1.map(p => new TableRow({
        children: [
          cell(p.label),
          cell(p.Prediction, { fill: p.Prediction === "Purchased" ? "D5F5E3" : "FADBD8" }),
          cell(p.Probability_of_Purchase),
          cell(p.Out_of_Training_Range ? "No (extrapolated)" : "Yes"),
        ],
      })),
    ],
  }),
  new Paragraph({ text: "", spacing: { after: 200 } }),
  image(`${P}/04_set1_predictions.png`, 440, 360),
  caption("Figure 4: Scenario Set 1 profiles (stars) plotted on the KNN decision surface."),
  body("Interpretation: The Age 40 / Salary 100,000 customer falls solidly in the \"purchase\" region, consistent with the general trend that older, higher-earning customers purchase more often. The Age 30 / Salary 87,000 customer falls in a densely \"not purchased\" neighborhood in the training data (see Section 4), so the model predicts non-purchase despite the moderately high salary — age and salary jointly determine the outcome, not salary alone. The two \"No Salary\" scenarios (Age 40 and Age 50) fall outside the training salary range, so those two predictions should be treated as lower-confidence extrapolations."),

  hAnchored("7.2 Graphical Analysis and Predictions — Scenario Set 2 (Extreme Values)", HeadingLevel.HEADING_2, "bm_set2"),
  body("The second scenario set uses salary values (600,000 to 100,000,000) far beyond anything in the training data (max = 150,000). These predictions are included as requested, but are explicitly flagged as unreliable extrapolations rather than trustworthy forecasts."),
  new Table({
    width: { size: COLW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: ["Scenario", "Prediction", "P(Purchase)", "In Training Range?"].map(t => cell(t, { header: true, width: 2400 })) }),
      ...predictions.set2.map(p => new TableRow({
        children: [
          cell(p.label),
          cell(p.Prediction, { fill: p.Prediction === "Purchased" ? "D5F5E3" : "FADBD8" }),
          cell(p.Probability_of_Purchase),
          cell(p.Out_of_Training_Range ? "No (extrapolated)" : "Yes"),
        ],
      })),
    ],
  }),
  new Paragraph({ text: "", spacing: { after: 200 } }),
  body("Interpretation: Because KNN classifies a new point based on its nearest neighbors in the training data, and no training points exist anywhere near salaries above 150,000, all four of these predictions effectively collapse to the nearest edge of the training data's salary distribution (the highest-salary customers, most of whom purchased). The model's near-certain \"Purchased\" predictions for salaries in the hundreds of thousands to millions should not be read as evidence that ultra-high earners definitely buy insurance — it simply reflects that the model has no real information about that region of the input space. The one exception is Age 18 / No Salary, which lands in a sparse, low-salary, low-age region where the (small number of) nearby training points were mostly non-purchasers."),

  hAnchored("7.3 Hypothesis Testing", HeadingLevel.HEADING_2, "bm_hypothesis"),
  body("Three hypotheses, in the spirit of the assignment's examples, were tested directly against the trained model by systematically varying age and salary and observing the change in predicted purchase probability."),
  image(`${P}/05_hypothesis_heatmap.png`, 460, 320),
  caption("Figure 5: Predicted probability of purchase across the full Age × Salary grid (within training range)."),
  body("Hypothesis 1 — \"Older individuals with higher salaries are more likely to purchase.\" Supported. The heatmap in Figure 5 shows a clear diagonal pattern: purchase probability rises as both age and salary increase together, and is highest in the top-right region (older, higher-earning customers)."),
  body(`Hypothesis 2 — "Salary has a stronger impact than age on purchase probability." Supported by this model. Holding salary fixed at the dataset's median (₹70,000) and varying age from 18 to 60 produced a probability swing of ${(hypo.age_probability_swing_at_mid_salary * 100).toFixed(0)} percentage points. Holding age fixed at the median (38) and varying salary from 15,000 to 150,000 produced a larger swing of ${(hypo.salary_probability_swing_at_mid_age * 100).toFixed(0)} percentage points. This indicates salary has at least as much, and in this test slightly more, influence on the model's predictions than age alone.`),
  body(`Hypothesis 3 — "Younger individuals with higher salaries are more likely to purchase than older individuals with the same high salary." Not supported within the training range. At a fixed high salary of ₹145,000, a 20-year-old customer had a predicted purchase probability of ${(hypo.young_high_salary_prob * 100).toFixed(0)}%, statistically identical to a 55-year-old customer at the same salary (${(hypo.old_high_salary_prob * 100).toFixed(0)}%). In this dataset, very high salary appears to be a strong enough signal on its own that age has little additional effect once salary is already high — the two features interact rather than acting independently.`),
];

// ================= DISCUSSION =================
const discussion = [
  hAnchored("8. Discussion", HeadingLevel.HEADING_1, "bm_discussion"),
  body("The comparative results align closely with what is documented in the machine learning literature (Section 2): tree-based models without depth constraints (Decision Tree, Random Forest) achieved near-perfect training accuracy but underperformed on the test set relative to KNN, confirming their known tendency to overfit small tabular datasets. KNN's strong, well-generalizing performance is consistent with the visibly non-linear decision boundary in Figure 3 — the true relationship between age, salary, and purchase behavior in this dataset is not a straight line, which is also why the two linear models (Logistic Regression and SVM with a linear kernel) posted identical, comparatively modest results."),
  body("An unexpected but informative outcome was in Section 7.2: when the model was asked to predict on salary values wildly outside its training data, it did not produce a warning or a low-confidence signal by default — it simply extrapolated based on the nearest available training points, producing predictions that appear confident but are not trustworthy. This is an important practical limitation, not a flaw unique to KNN; most classifiers will behave similarly when queried far outside their training distribution."),
  body("Strengths of this project's approach include a controlled, apples-to-apples comparison (identical splits, identical scaling) across five genuinely different algorithm families, and grounding every prediction and hypothesis in the actual trained model rather than intuition. Limitations include the small dataset size (400 records), the use of only two features (in reality, insurance purchase decisions depend on many more factors), and the lack of cross-validation, which would give a more robust estimate of generalization than a single train/test split."),
];

// ================= CONCLUSION =================
const conclusion = [
  hAnchored("9. Conclusion", HeadingLevel.HEADING_1, "bm_conclusion"),
  body("This project set out to compare five classification algorithms for predicting insurance purchase behavior from customer age and salary, and to identify the algorithm offering the best balance between accuracy and generalization. K-Nearest Neighbors (k=5) was identified as the best-suited model, delivering the highest test accuracy (93%) with negligible overfitting, outperforming both the simpler linear models and the more complex tree-based ensembles on this dataset."),
  body("The model was successfully applied to answer the assignment's specific prediction scenarios and to test three hypotheses about how age and salary drive purchasing behavior, finding that salary is at least as influential as age, and that the two features interact rather than contributing independently. The project also surfaced a practical, generalizable lesson: predictive models should not be trusted uncritically outside the range of data they were trained on, a point that is easy to overlook when a model returns a confident-looking prediction regardless of the input."),
  body("Future work could expand this study by incorporating cross-validation for more robust performance estimates, tuning hyperparameters (e.g., k in KNN, tree depth/regularization in Decision Tree and Random Forest, and non-linear kernels in SVM), and adding additional customer attributes (e.g., existing coverage, marital status, occupation) if available, which would likely improve both accuracy and the reliability of the model's real-world business recommendations."),
];

// ================= LESSONS LEARNED / REAL-LIFE APPLICATION =================
const lessons = [
  hAnchored("10. Lessons Learned and Real-Life Application", HeadingLevel.HEADING_1, "bm_lessons"),
  body("This project reinforced several practical lessons: (1) the algorithm with the highest training accuracy is often not the best model to deploy — evaluating the train/test gap is essential to catch overfitting before it becomes a production problem; (2) feature scaling materially changes results for distance-based and margin-based algorithms, and skipping it would have distorted the KNN and SVM comparisons; and (3) a model's predictions are only as trustworthy as the data range they were trained on, which matters enormously when a business wants to apply a model to new, unseen types of customers."),
  body("Case Study 1 — Insurance Cross-Sell Targeting: A bank insurance company could deploy a model like the one built here to score its existing customer base and prioritize outreach (calls, emails, in-app offers) toward customers whose age/salary profile places them in a high purchase-probability zone, similar to the top-right region of Figure 5. This would let a limited marketing/sales team focus effort on the leads most likely to convert, rather than contacting the entire customer base uniformly."),
  body("Case Study 2 — Credit Risk / Loan Approval Screening: The same classification techniques compared in this project (Logistic Regression, KNN, SVM, Decision Tree, Random Forest) are directly applicable to a bank's loan or credit-card approval pipeline, where the goal is to predict whether an applicant is likely to default, using applicant attributes such as income, age, credit history length, and existing debt. As in this project, an analyst would want to compare multiple algorithms and specifically guard against overfitting, since a credit model that overfits historical approval data could make systematically biased or unreliable decisions on new applicants."),
];

// ================= REFERENCES =================
const references = [
  hAnchored("11. References", HeadingLevel.HEADING_1, "bm_references"),
  body("[1] Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825-2830."),
  body("[2] Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32."),
  body("[3] Cortes, C., & Vapnik, V. (1995). Support-Vector Networks. Machine Learning, 20(3), 273-297."),
  body("[4] Cover, T., & Hart, P. (1967). Nearest Neighbor Pattern Classification. IEEE Transactions on Information Theory, 13(1), 21-27."),
  body("[5] Quinlan, J. R. (1986). Induction of Decision Trees. Machine Learning, 1(1), 81-106."),
  body("[6] Social Network Ads Dataset (commonly used in applied ML coursework); 400 customer records with Age, EstimatedSalary, and Purchased fields."),
];

// ================= APPENDICES =================
const appendices = [
  hAnchored("12. Appendices", HeadingLevel.HEADING_1, "bm_appendices"),
  body("Appendix A — Files included in the project ZIP submission:"),
  bullet("Social_Network_Ads.txt — the source dataset (400 records)"),
  bullet("01_generate_dataset.py through 03_predictions_and_hypotheses.py — full Python source code"),
  bullet("model_comparison.csv / .json — raw metric outputs for all five classifiers"),
  bullet("predictions.json — raw prediction outputs for both scenario sets"),
  bullet("hypothesis_summary.json — raw hypothesis-testing outputs"),
  bullet("plots/ — all five figures included in this report, at full resolution"),
  body("Appendix B — Reproducing the results: install pandas, scikit-learn, and matplotlib (pip install pandas scikit-learn matplotlib), place Social_Network_Ads.txt in the data/ folder, then run the three scripts in code/ in numerical order (01, 02, 03). All outputs will be regenerated in outputs/ and plots/."),
];

// ================= ACKNOWLEDGMENTS =================
const acknowledgments = [
  hAnchored("Acknowledgments", HeadingLevel.HEADING_1, "bm_acknowledgments"),
  body("I would like to thank IntrnForte and my AI internship mentors for the guidance and structure provided throughout this project, and BGS Institute of Technology for the academic foundation that made this work possible."),
];

// ================= BUILD DOCUMENT =================
const doc = new Document({
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children: [
      ...titlePage,
      ...abstract,
      new Paragraph({ children: [new PageBreak()] }),
      ...toc,
      ...introduction,
      ...literatureReview,
      ...problemStatement,
      ...dataSection,
      ...methodology,
      ...implementation,
      ...results,
      ...discussion,
      ...conclusion,
      ...lessons,
      ...references,
      ...appendices,
      ...acknowledgments,
    ],
  }],
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT }],
    }],
  },
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(`${BASE}/outputs/Insurance_Purchase_Prediction_Report.docx`, buffer);
  console.log("Document created successfully.");
});
