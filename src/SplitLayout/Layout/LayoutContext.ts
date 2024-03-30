import React, { createContext } from 'react';

type LayoutContext = {
  containerWidth: number;
  containerHeight: number;
  unitNumber: number;
  splitVertical: (id: string, content: React.ReactNode) => void;
  splitHorizontal: (id: string, content: React.ReactNode) => void;
  removePane: (id: string) => void;
};

const LayoutContext = createContext<LayoutContext | null>(null);

export default LayoutContext;
