import React from 'react';
import { VERTICAL } from '../unit';

type ResizerProps = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  resizerType: string;
  allowResize: boolean;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement> | undefined;
  className?: string;
};

const Resizer = (props: ResizerProps) => {
  const { id, top, left, width, height, resizerType, allowResize, onMouseDown, className } = props;
  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 2,
    top,
    left,
    width,
    height,
    background: '#666',
  };
  if (!allowResize) {
    style.cursor = 'default';
  }
  if (resizerType === VERTICAL) {
    style.cursor = 'col-resize';
  } else {
    style.cursor = 'row-resize';
  }

  return (
    <div
      className={className}
      data-unit-type="resizer"
      data-unit-id={id}
      data-resizer-type={resizerType}
      style={style}
      onMouseDown={onMouseDown}
    />
  );
};

export default Resizer;
