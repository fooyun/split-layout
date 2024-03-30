/* eslint-disable @typescript-eslint/no-explicit-any */

const idGenerator = (namespace: string) => {
  let id = 0;
  return () => {
    return `${namespace}-${id++}`;
  };
};

const getUnitId = idGenerator('unit');

const getPaneId = idGenerator('pane');

const getResizerId = idGenerator('resizer');

export const isPane = (unit: LayoutUnit) => {
  return unit.type === 'pane';
};

export const isResizer = (unit: LayoutUnit) => {
  return unit.type === 'resizer';
};

export const removeUnitFromListByIds = (unitList: LayoutUnit[], idList: string[]) => {
  return unitList.filter((unit) => {
    return !idList.includes(unit.id);
  });
};

export type LayoutUnitProps = {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
};

export class LayoutUnit {
  id: string;
  type: string;
  top: number;
  left: number;
  width: number;
  height: number;

  constructor(props: LayoutUnitProps) {
    const { top = 0, left = 0, width = 0, height = 0 } = props || {};

    this.id = getUnitId();
    this.type = 'unit';
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
  }
}

export type PaneUnitProps = LayoutUnitProps & {
  content: any;
};

export class PaneUnit extends LayoutUnit {
  content?: any;
  topSide: null | ResizerUnit;
  rightSide: null | ResizerUnit;
  bottomSide: null | ResizerUnit;
  leftSide: null | ResizerUnit;

  constructor(props: PaneUnitProps) {
    super(props);

    const { content } = props || {};

    this.id = getPaneId();
    this.type = 'pane';
    this.content = content;

    // 周围的边界或者 resizer
    this.topSide = null; // null 表示时边界
    this.rightSide = null;
    this.bottomSide = null;
    this.leftSide = null;
  }
}

export const VERTICAL = 'vertical';

export const HORIZONTAL = 'horizontal';

export type SplitType = typeof VERTICAL | typeof HORIZONTAL;

// 拖拽条，分为垂直和水平，是从自身的显示方向来说的；
export type ResizerUnitProps = LayoutUnitProps;

export class ResizerUnit extends LayoutUnit {
  resizerType: SplitType;
  topSide: LayoutUnit[];
  bottomSide: LayoutUnit[];
  rightSide: LayoutUnit[];
  leftSide: LayoutUnit[];

  constructor(props: ResizerUnitProps) {
    super(props);

    this.id = getResizerId();
    this.type = 'resizer';
    this.resizerType = VERTICAL;

    // 两侧的 pane：水平分，上下同时出现；垂直分，左右同时出现；每一侧可能有多个 pane 或者 resizer 紧挨着
    this.topSide = [];
    this.bottomSide = [];
    this.rightSide = [];
    this.leftSide = [];
  }
}

// 垂直拖拽条
export class VerticalResizerUnit extends ResizerUnit {
  constructor(props: ResizerUnitProps) {
    super(props);
    this.resizerType = VERTICAL;
  }
}

// 水平拖拽条
export class HorizontalResizerUnit extends ResizerUnit {
  constructor(props: ResizerUnitProps) {
    super(props);
    this.resizerType = HORIZONTAL;
  }
}
