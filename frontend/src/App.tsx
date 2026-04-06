import { useState } from "react";
import FileUpload from "./components/FileUpload";
import ChatWindow from "./components/ChatWindow";
import "./App.css";

type AppState = "upload" | "chat";

export default function App() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [filename, setFilename] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleUploaded(name: string, docSuggestions: string[]) {
    console.log("Upload complete:", name, docSuggestions);
    setFilename(name);
    setSuggestions(docSuggestions);
    setAppState("chat");
  }

  function handleNewDocument() {
    setAppState("upload");
    setFilename("");
    setSuggestions([]);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">DocuChat</span>
        </div>
        <p className="tagline">
          Ask questions. Get answers. From your documents.
        </p>
      </header>

      <main className="main">
        {appState === "upload" ? (
          <div className="upload-section">
            <div className="upload-hero">
              <h1>
                Drop your PDF.
                <br />
                Start asking.
              </h1>
              <p>
                Upload any document and ask questions about it in plain English.
              </p>
            </div>
            <FileUpload onUploaded={handleUploaded} />
          </div>
        ) : (
          <div className="chat-section">
            <div className="chat-header">
              <span className="file-badge">◈ {filename}</span>
              <button
                className="new-doc"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNewDocument();
                }}
              >
                + New document
              </button>
            </div>
            <ChatWindow suggestions={suggestions} />
          </div>
        )}
      </main>
    </div>
  );
}
