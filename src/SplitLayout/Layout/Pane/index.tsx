import React, { useContext } from 'react';
import LayoutContext from '../LayoutContext';
import PaneContext from './PaneContext';

type PaneProps = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  content?: React.ReactNode;
  className?: string;
};

const Pane = (props: PaneProps) => {
  // 给 content 暴露 Pane 自己的 context，包括三个方法：垂直分屏；水平分屏；关闭窗口；
  const layoutContext = useContext(LayoutContext);

  const { id, top, left, width, height, content, className } = props;
  const style: React.CSSProperties = {
    top,
    left,
    width,
    height,
    position: 'absolute',
    overflow: 'hidden',
  };

  // 垂直分屏，content 是分屏后新的窗口要显示的内容
  const splitVertical = (content: React.ReactNode) => {
    layoutContext?.splitVertical(id, content);
  };

  const splitHorizontal = (content: React.ReactNode) => {
    layoutContext?.splitHorizontal(id, content);
  };

  const removePane = () => {
    layoutContext?.removePane(id);
  };

  return (
    <PaneContext.Provider
      value={{
        canClose: layoutContext ? layoutContext.unitNumber > 1 : false,
        isUIFirstPane: top === 0 && left === 0, // 位于左上角的 pane 是视觉上的第一个
        splitVertical,
        splitHorizontal,
        removePane,
      }}
    >
      <div data-type="pane" data-unit-id={id} className={className} style={style}>
        {content}
      </div>
    </PaneContext.Provider>
  );
};

export default Pane;
