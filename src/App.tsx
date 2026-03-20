import { useState } from "react";
import { MindMap } from "./components/MindMap";
import { allPlugins } from "./components/MindMap/plugins";

const basicMarkdown = `Machine Learning 🤖
- **Supervised Learning**
  > Learning mapping functions from labeled data
  > Goal is to make predictions on new data
  - [x] Classification
    > Output consists of discrete category labels
  - [x] Regression
    > Output consists of continuous numerical values
  - [-] Decision Trees
- *Unsupervised Learning*
  - \`K-Means\` Clustering
  - ~~PCA~~ Dimensionality Reduction
  - ==Association Rules==
- Reinforcement Learning
  - [ ] Q-Learning
  - [ ] Policy Gradients
- Deep Learning
  - CNN
  - RNN
  - Transformer
- Application Areas
  - [NLP](https://en.wikipedia.org/wiki/NLP)
  - Computer Vision
  - Recommendation Systems`;

const advancedMarkdown = `---
direction: right
theme: light
---

System Architecture
- Frontend {#frontend}
  - React #framework #frontend
    | Component-based UI library
    | Virtual DOM for performance
  - API Call -> {#api-gateway} "HTTP/REST"
  - State Management #state
    | Redux / Zustand
-. Design System
  - Figma #design
  - Storybook #docs
  - $T_{total} = T_{extract} + T_{transform} + T_{load}$
- Backend
  - API Gateway {#api-gateway}
    | REST & GraphQL endpoints
    | Rate limiting & auth
    - REST
    - GraphQL
  - Data Processing
    - ETL Pipeline -> {#data-warehouse}
- Data Layer
  - Data Warehouse {#data-warehouse}
    | Enterprise data storage
    | Supports OLAP queries
  - Cache -> {#frontend} "Redis"
+ Infrastructure
  - [x] AWS #cloud
  - [-] Docker #containerization
  - [ ] CI/CD #devops`;

function App() {
  const [demo, setDemo] = useState<"basic" | "advanced">("basic");

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Demo selector - top left */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 100,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 8,
          padding: "2px 4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 14,
        }}
      >
        <select
          value={demo}
          onChange={(e) => setDemo(e.target.value as "basic" | "advanced")}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 14,
            cursor: "pointer",
            outline: "none",
            padding: "6px 8px",
            color: "#333",
          }}
        >
          <option value="basic">Basic Syntax</option>
          <option value="advanced">Advanced Syntax</option>
        </select>
      </div>

      <MindMap
        key={demo}
        markdown={demo === "basic" ? basicMarkdown : advancedMarkdown}
        plugins={demo === "advanced" ? allPlugins : undefined}
        // readonly={demo === "advanced"}
      />
    </div>
  );
}

export default App;
