
import React from "react";
import "../../app/globals.css";

interface ProgressBarProps {
  progress: number; // 0 to 1
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className }) => (
  <div className={`upload-progress-bar-bg ${className ?? ""}`}>
    <div
      className="upload-progress-bar-fill"
      style={
        {
          "--progress": `${Math.round(progress * 100)}%`,
        } as React.CSSProperties
      }
    />
  </div>
);

export default ProgressBar;
