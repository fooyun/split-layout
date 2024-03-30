import { createContext } from 'react';

type PaneContextType = {
  canClose: boolean;
  isUIFirstPane: boolean;
  splitVertical: (content: React.ReactNode) => void;
  splitHorizontal: (content: React.ReactNode) => void;
  removePane: () => void;
};

// 导出 PaneContext 可以被用户的内容元素获取，从而调用相关方法；
const PaneContext = createContext<PaneContextType | null>(null);

export default PaneContext;
