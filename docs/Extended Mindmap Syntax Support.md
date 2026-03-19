# Extended Mindmap Syntax Support

---

## Line/Branch Styles

```mindmap
Machine Learning
- Supervised Learning
  - Classification               %% Standard solid line (default)
  -. Feature Engineering           %% Dotted line (weak relationship/optional)
```

| Syntax | Line Style | Semantics                          |
| ------ | ---------- | ---------------------------------- |
| `-`    | Dotted     | Standard parent-child relationship |
| `-.`   | Dotted     | Weak association / Optional / TBD  |

---

## Multi-line Node Content

```mindmap
Machine Learning
- Supervised Learning
  - Classification
    | **Definition**: Mapping inputs to discrete categories.
    | **Input**: Feature vector X
    | **Output**: Class label Y
  - Regression
    | Continuous output values.
    | Commonly used for prediction scenarios.
```

Lines starting with `|` are appended to the content of the preceding node and rendered as multi-line text within that node.

**Difference from `>` Remarks:**

| Syntax    | Display Mode    | Purpose                                               |
| --------- | --------------- | ----------------------------------------------------- |
| `> text`  | Tooltip / Hover | Supplementary notes; space-saving                     |
| `\| text` | In-node display | Used when the node itself requires multi-line content |

---

## Tags

Use `#tag` to label nodes for easy filtering and categorization:

```mindmap
Tech Stack
- React #frontend #javascript
  - Next.js #framework #ssr
  - Redux #state-management
- Python #backend #ml
  - FastAPI #framework
  - PyTorch #ml #deep-learning
- PostgreSQL #database #backend
```

Tags are rendered as small badges on the node and support filtering or highlighting.

---

## Cross-node Connections (Cross-link)

Use `{#id}` to define node anchors and `-> {#id}` to create cross-branch connections:

```mindmap
System Architecture
- Frontend {#frontend}
  - React
  - API Call -> {#api-gateway}
- Backend
  - API Gateway {#api-gateway}
    - REST
    - GraphQL
  - Data Processing
    - ETL Pipeline -> {#data-warehouse}
- Data Layer
  - Data Warehouse {#data-warehouse}
  - Cache -> {#frontend}
```

Optional annotated connections:

```
- API Call -> {#api-gateway} "HTTP/REST"
```

These are rendered as curved lines or dashed arrows between nodes, accompanied by text labels.

---

## Folding Markers (Effective in Read-only Mode)

Use `+` instead of `-` to indicate that a node is collapsed by default (hiding its child nodes):

```mindmap
Project Structure
- src/
  - components/
    - Button.tsx
    - Modal.tsx
  + utils/          <!-- Collapsed by default -->
    - format.ts
    - validate.ts
  + hooks/           <!-- Collapsed by default -->
    - useAuth.ts
    - useFetch.ts
- README.md
```

- `-` = Expanded (default)
- `+` = Collapsed (click to expand)

---

## Formula Support (LaTeX)

Technical mindmaps often require mathematical formulas:

```mindmap
Loss Functions
- MSE
  | $L = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2$
- Cross Entropy
  | $L = -\sum_{i} y_i \log(\hat{y}_i)$
- KL Divergence
  | $D_{KL}(P \| Q) = \sum P(x) \log\frac{P(x)}{Q(x)}$
```

Supports inline formulas with `$...$` and block-level formulas with `$$...$$`, following standard Markdown math syntax conventions.

---

## Global Configuration (Front Matter)

Controls the overall behavior and styling of the mindmap.

```mindmap
---
direction: right       # right | left | both
theme: auto         # auto | light | dark
---

Machine Learning
- Supervised Learning
- Unsupervised Learning
```

**`direction`** Description:

```
          left ←  [Root]  → right

          ← [Root] →          (both: Classic dual-sided expansion)
         /          \
      left1        right1
      left2        right2
```

---
