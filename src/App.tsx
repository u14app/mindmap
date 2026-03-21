import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import DocsPage from "./pages/DocsPage";

function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route.startsWith("#/docs")) {
    return <DocsPage />;
  }
  return <LandingPage />;
}

export default App;
