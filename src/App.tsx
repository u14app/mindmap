import { MindMap } from "./components/MindMap";
import type { MindMapData } from "./components/MindMap";

const demoData: MindMapData = {
  id: "root",
  text: "Machine Learning 🤖",
  children: [
    {
      id: "1",
      text: "**Supervised Learning**",
      remark: "Learning mapping functions from labeled data\nGoal is to make predictions on new data",
      children: [
        { id: "1-1", text: "Classification", taskStatus: "done", remark: "Output consists of discrete category labels" },
        { id: "1-2", text: "Regression", taskStatus: "done", remark: "Output consists of continuous numerical values" },
        { id: "1-3", text: "Decision Trees", taskStatus: "doing" },
      ],
    },
    {
      id: "2",
      text: "*Unsupervised Learning*",
      children: [
        { id: "2-1", text: "`K-Means` Clustering" },
        { id: "2-2", text: "~~PCA~~ Dimensionality Reduction" },
        { id: "2-3", text: "==Association Rules==" },
      ],
    },
    {
      id: "3",
      text: "Reinforcement Learning",
      children: [
        { id: "3-1", text: "Q-Learning", taskStatus: "todo" },
        { id: "3-2", text: "Policy Gradients", taskStatus: "todo" },
      ],
    },
    {
      id: "4",
      text: "Deep Learning",
      children: [
        { id: "4-1", text: "CNN" },
        { id: "4-2", text: "RNN" },
        { id: "4-3", text: "Transformer" },
      ],
    },
    {
      id: "5",
      text: "Application Areas",
      children: [
        { id: "5-1", text: "[NLP](https://en.wikipedia.org/wiki/NLP)" },
        { id: "5-2", text: "Computer Vision" },
        { id: "5-3", text: "Recommendation Systems" },
      ],
    },
  ],
};

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <MindMap data={demoData} />
    </div>
  );
}

export default App;
