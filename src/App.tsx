import { MindMap } from "./components/MindMap";
import type { MindMapData } from "./components/MindMap";
import { DemoHelpButton } from "./DemoHelpButton";
import { DemoShortcutsButton } from "./DemoShortcutsButton";

const demoData: MindMapData = {
  id: "root",
  text: "Machine Learning",
  children: [
    {
      id: "1",
      text: "Supervised Learning",
      children: [
        { id: "1-1", text: "Classification" },
        { id: "1-2", text: "Regression" },
        { id: "1-3", text: "Decision Trees" },
      ],
    },
    {
      id: "2",
      text: "Unsupervised Learning",
      children: [
        { id: "2-1", text: "Clustering" },
        { id: "2-2", text: "Dimensionality Reduction" },
        { id: "2-3", text: "Association Rules" },
      ],
    },
    {
      id: "3",
      text: "Reinforcement Learning",
      children: [
        { id: "3-1", text: "Q-Learning" },
        { id: "3-2", text: "Policy Gradients" },
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
        { id: "5-1", text: "Natural Language Processing" },
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
      <DemoShortcutsButton />
      <DemoHelpButton />
    </div>
  );
}

export default App;
