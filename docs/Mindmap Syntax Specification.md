# Mindmap Syntax Specification

---

## Basic Syntax

Lines of text that do not begin with the `-` list syntax are treated as **root nodes**. A single mindmap can contain multiple root nodes. The levels of the `-` list syntax define the extension and hierarchy of the node tree.

```mindmap
Machine Learning
- Supervised Learning
  - Classification
  - Regression
  - Decision Trees
- Unsupervised Learning
  - Clustering
  - Dimensionality Reduction

Application Areas
- Natural Language Processing
- Computer Vision
```

## Text Formatting (Leveraging Markdown Inline Syntax)

Node text natively supports Markdown inline formatting:

```mindmap
Machine Learning
- **Supervised Learning**
- *Unsupervised Learning*
- ~~Deprecated Method~~
- `K-Means Algorithm`
- ==Highlighted Topic==
```

| Syntax       | Effect            | Use Case                             |
| ------------ | ----------------- | ------------------------------------ |
| `**text**`   | **Bold**          | Emphasize important nodes            |
| `*text*`     | _Italic_          | Add supplementary notes/descriptions |
| `~~text~~`   | ~~Strikethrough~~ | Deprecated or completed items        |
| `` `text` `` | `Code`            | Technical terms or identifiers       |
| `==text==`   | Highlight         | Highlight key concepts               |

---

## Links and Images (Inheriting Markdown Syntax)

```mindmap
Machine Learning
- [Wikipedia](https://en.wikipedia.org/wiki/ML)
- Architecture Overview ![](./arch.png)
- Resources
  - [Paper](https://arxiv.org/xxx)
  - ![diagram](./flow.png)
```

- `[text](url)` — Node text becomes a clickable hyperlink.
- `![alt](path)` — Embeds an image within a node (if it occupies a single line, the image becomes the node content).

---

## Node Remarks (Blockquote Syntax)

Use `>` to add detailed descriptions to a node, which can be displayed on hover or when expanded:

```mindmap
Machine Learning
- Supervised Learning
  > Learning mapping functions from labeled data
  > Goal is to make predictions on new data
  - Classification
    > Output consists of discrete category labels
  - Regression
    > Output consists of continuous numerical values
```

Remarks are not displayed as sub-nodes; instead, they serve as additional node information (tooltips/sidebar).

---

## Icons and Emojis

Directly use Unicode Emojis anywhere within the node text:

```mindmap
Machine Learning 🤖
- 📊 Supervised Learning
  - 🏷️ Classification
  - 📈 Regression
- 🔍 Unsupervised Learning
  - 🫧 Clustering
  - 📉 Dimensionality Reduction
- 🎮 Reinforcement Learning
```

---

## Task Status (Checkbox Syntax)

Reuses Markdown task list syntax, ideal for project or learning plans:

```mindmap
Learning Plan Q1
- Basic Theory
  - [x] Linear Algebra
  - [x] Probability Theory
  - [-] Optimization Theory
  - [ ] Information Theory
- Practical Projects
  - [x] Handwritten Digit Recognition
  - [-] Text Classification
  - [ ] Image Segmentation
```

| Syntax       | Meaning     | Visual |
| ------------ | ----------- | ------ |
| `- [ ] text` | To Do       | ☐      |
| `- [-] text` | In Progress | ◐      |
| `- [x] text` | Completed   | ☑      |

---

## Comprehensive Example

Combining all the features mentioned above:

```mindmap
- **Supervised Learning**
  > Learning input-to-output mappings from labeled data
  - Classification
    - [x] Logistic Regression
    - [x] SVM
    - [-] Neural Networks
      > Current primary learning focus
      - CNN
      - RNN
  - Regression
    - [x] Linear Regression
    - [ ] Polynomial Regression

- *Unsupervised Learning*
  - Clustering
    - K-Means
    - DBSCAN
  - Dimensionality Reduction
    - PCA
    - t-SNE

- **Reinforcement Learning**
  - [ ] Q-Learning
  - [ ] Policy Gradient

Application Areas
- NLP
  - Transformer Architecture
  - [BERT Paper](https://arxiv.org/abs/1810.04805)
- Computer Vision
  - ![pipeline](./cv-pipeline.png)
  - Object Detection
  - Image Segmentation
```

## Syntax Quick Reference

```
┌─────────────────────────────────────────────────────┐
│ Feature        │ Syntax                              │
├─────────────────────────────────────────────────────┤
│ Root Node      │ Plain text (no leading -)           │
│ Sub-node       │ - text (indentation controls level) │
│ Bold           │ **text**                            │
│ Italic         │ *text*                              │
│ Strikethrough  │ ~~text~~                            │
│ Inline Code    │ `text`                              │
│ Highlight      │ ==text==                            │
│ Link           │ [text](url)                         │
│ Image          │ ![alt](path)                        │
│ Remark         │ > note text                         │
│ Task (Todo)    │ - [ ] text                          │
│ Task (Doing)   │ - [-] text                          │
│ Task (Done)    │ - [x] text                          │
│ Emoji          │ Use Unicode directly 🎉              │
└─────────────────────────────────────────────────────┘
```
