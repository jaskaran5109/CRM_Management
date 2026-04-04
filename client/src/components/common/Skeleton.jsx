import React from "react";
import "./Skeleton.css";

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="skeleton-card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 6, cols = 8 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div className="skeleton-cell skeleton-cell-header" key={i} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="skeleton-table-row" key={rowIndex}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div className="skeleton-cell" key={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = ({ height = "260px" }) => {
  return <div className="skeleton-chart" style={{ height }} />;
};

export const FormSkeleton = ({ rows = 5 }) => {
  return (
    <div className="skeleton-form">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-form-row" key={index}>
          <div className="skeleton-label" />
          <div className="skeleton-input" />
        </div>
      ))}
    </div>
  );
};

export default {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
};
