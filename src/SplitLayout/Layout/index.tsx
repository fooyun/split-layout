/* eslint-disable @typescript-eslint/comma-dangle */
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import LayoutContext from './LayoutContext';
import Pane from './Pane';
import Resizer from './Resizer';
import {
  isPane,
  isResizer,
  LayoutUnit,
  PaneUnit,
  ResizerUnit,
  VerticalResizerUnit,
  HorizontalResizerUnit,
  removeUnitFromListByIds,
  VERTICAL,
  HORIZONTAL,
  SplitType,
} from './unit';
import './index.css';

const getEventPosition = (event: MouseEvent, type: string) => {
  return type === VERTICAL ? event.clientX : event.clientY;
};

// 注意：这里只判断能不能基于拖拽更新位置，不能修改原有的 unit 数据
const shouldUpdateResizerPosition = (
  resizerUnit: ResizerUnit,
  positionDelta: number,
  containerWidth: number,
  containerHeight: number,
  paneMinWidth: number,
  paneMinHeight: number
) => {
  if (resizerUnit.resizerType === VERTICAL) {
    // 垂直分隔线，拖动时修改左右两侧的 pane/resizer 的大小和位置
    // positionDelta 为正表示分隔线向右移动，向左则为负值
    const newResizerLeft = resizerUnit.left + positionDelta;

    // 左右移动，拖拽条的左右边界超出容器边界
    if (newResizerLeft < 0 || newResizerLeft + resizerUnit.width > containerWidth) {
      return false;
    }
    // 分隔线左侧的所有 pane 不能超出最小宽度限制
    for (const leftUnit of resizerUnit.leftSide) {
      if (leftUnit.width + positionDelta < paneMinWidth) {
        return false;
      }
    }
    // 分隔线右侧的所有 pane 不能超出最小宽度限制：注意左右两侧针对 positionDelta 是相反的加减。
    for (const rightUnit of resizerUnit.rightSide) {
      if (rightUnit.width - positionDelta < paneMinWidth) {
        return false;
      }
    }
  } else {
    // 水平分隔线，拖动时修改上下两侧的 pane/resizer 的大小和位置
    // positionDelta 为正表示分隔线向下移动，向上则为负值
    const newResizerTop = resizerUnit.top + positionDelta;
    // 上下移动，拖拽条的上下边界超过容器边界
    if (newResizerTop < 0 || newResizerTop + resizerUnit.height > containerHeight) {
      return false;
    }
    // 分隔线上侧的所有 pane 不能超出最小高度限制
    for (const topUnit of resizerUnit.topSide) {
      if (topUnit.height + positionDelta < paneMinHeight) {
        return false;
      }
    }
    // 分隔线下侧的所有 pane 不能超出最小高度限制：注意上下两侧针对 positionDelta 是相反的加减
    for (const bottomUnit of resizerUnit.bottomSide) {
      if (bottomUnit.height - positionDelta < paneMinHeight) {
        return false;
      }
    }
  }

  return true;
};

// 布局容器，相对定位
// 内部所有的子区域，采用绝对定位，包括分屏 pane 和 分隔线 resizer，均位于布局容器下，同层级；
// 对一个 pane 进行分屏时，源 pane 的大小和位置发生变化，同时会增加一个 resizer 和一个新的 pane；
// pane 大小变化的途径：1. 它被分隔，被分隔后大小减半；2. 拖动挨着它的 resizer，相邻的 pane 大小变化；3. 窗口大小变化，所有 pane 的大小发生变化

// 另外需要注意：
// 垂直分隔时：A => A |1| B => (A |2| C) |1| B ，先后分隔两次，A 和 B 之间最开始有一条分隔线 1，后面 A 被继续分隔后，A 和 B 已经不直接挨着了。分隔线1已经成为了 C 和 B 之间的分隔线。
// 虽然分隔线的左右的邻居不是固定的，但是对于一个 pane，总有一条分隔线是为了分隔它，该分隔线的一侧只有该 pane。

// pane 的 上下左右 4个 side 要么是容器边界 null 或者是 resizer；
// resizer 的左右（垂直时），是一个或多个 pane/resizer；resizer 的上下（水平时），是一个或多个 pane/resizer；
// 因为 resizer 也有宽度和高度，在 pane 分隔/关闭/拖动时，要重新计算大小；

// 参数
// split: 初始分隔方式，所有子元素默认如何排列；vertical 垂直分屏；horizontal 水平分屏
// allowResize: 是否允许拖拽调整
// verticalResizerWidth: 垂直分隔线的宽度
// horizontalResizerHeight: 水平分隔线的高度
// paneMinWidth: pane 的最小宽度，拖拽时使用；
// paneMinHeight: pane 的最小高度，拖拽时使用；

type SplitLayoutProps = {
  children?: React.ReactNode;
  split?: SplitType;
  allowResize?: boolean;
  verticalResizerWidth?: number;
  horizontalResizerHeight?: number;
  paneMinWidth?: number;
  paneMinHeight?: number;
  className?: string;
  paneClassName?: string;
  resizerClassName?: string;
};

const SplitLayout: React.FunctionComponent<SplitLayoutProps> = (props) => {
  const {
    children,
    split = VERTICAL,
    allowResize = true,
    verticalResizerWidth = 2,
    horizontalResizerHeight = 2,
    paneMinWidth = 0,
    paneMinHeight = 0,
    className = '',
    paneClassName = '',
    resizerClassName = '',
  } = props;

  if (split !== VERTICAL && split !== HORIZONTAL) {
    throw new Error('split method must be vertical or horizontal.');
  }

  // 针对宽度/高度，要限制它们不能小于 0
  if (
    verticalResizerWidth < 0 ||
    horizontalResizerHeight < 0 ||
    paneMinWidth < 0 ||
    paneMinHeight < 0
  ) {
    throw new Error('Height and width must not be less than 0.');
  }

  const ref = useRef<HTMLDivElement>(null); // 布局容器 dom
  const [containerWidth, setContainerWidth] = useState(0); // 布局容器宽度
  const [containerHeight, setContainerHeight] = useState(0); // 布局容器高度
  const [units, setUnits] = useState<LayoutUnit[]>([]); // 内部的单元（包括分屏窗口/分隔线）
  const [dragResizerId, setDragResizerId] = useState('');
  const [position, setPosition] = useState(0); // 拖拽初始位置
  const [dragActive, setDragActive] = useState(false); // 拖拽是否开始

  // 垂直分屏（左右）
  const splitVertical = (srcUnitId: string, content: React.ReactNode) => {
    const newUnits = [...units];
    const srcUnit = units.find((unit) => srcUnitId === unit.id) as PaneUnit;

    // 开始分屏：
    // a. width(src) + width(resizer) + width(dest) = old_width(src)
    // b. width(src) = width(dest)
    const newPaneWidth = (srcUnit.width - verticalResizerWidth) / 2;

    // 1. 调整源 pane 宽度
    srcUnit.width = newPaneWidth;

    // 2. 新增一个分屏 pane（右侧）
    const destUnit = new PaneUnit({
      top: srcUnit.top,
      left: srcUnit.left + srcUnit.width + verticalResizerWidth,
      width: newPaneWidth,
      height: srcUnit.height,
      content,
    });
    newUnits.push(destUnit);

    // 3. 新增垂直分隔线
    const resizerUnit = new VerticalResizerUnit({
      top: srcUnit.top,
      left: srcUnit.left + srcUnit.width,
      width: verticalResizerWidth,
      height: srcUnit.height,
    });
    newUnits.push(resizerUnit);

    const addedUnit = [destUnit, resizerUnit];

    // 更新位置关系
    // 1. 新 resizer 左右两侧更新
    resizerUnit.leftSide = [srcUnit];
    resizerUnit.rightSide = [destUnit];
    // 2. 新 pane 在 老 pane 右侧，其他边均和老 pane 相同；
    destUnit.leftSide = resizerUnit;
    destUnit.rightSide = srcUnit.rightSide;
    destUnit.topSide = srcUnit.topSide;
    destUnit.bottomSide = srcUnit.bottomSide;
    // 新 pane 上侧/右侧/下侧如果有 resizer，也要调整位置关系；左侧是本次新增的 resizer
    if (destUnit.rightSide) {
      // 右侧 resizer 增加了左侧相邻新 pane
      destUnit.rightSide.leftSide = removeUnitFromListByIds(destUnit.rightSide.leftSide, [
        srcUnitId,
      ]);
      // 右侧 resizer 增加了左侧相邻新 pane
      destUnit.rightSide.leftSide.push(destUnit);
    }
    if (destUnit.topSide) {
      destUnit.topSide.bottomSide.push(...addedUnit); // 上下相邻的 resizer 则是新增了 resizer 和 pane
    }
    if (destUnit.bottomSide) {
      destUnit.bottomSide.topSide.push(...addedUnit);
    }

    // 3. 老 pane 右侧变成新的 resizer，其他没有变化
    srcUnit.rightSide = resizerUnit;

    setUnits(newUnits);
  };

  // 水平分屏（上下）
  const splitHorizontal = (srcUnitId: string, content: React.ReactNode) => {
    const newUnits = [...units];
    const srcUnit = units.find((unit) => srcUnitId === unit.id) as PaneUnit;

    // 开始分屏：
    // a. height(src) + height(resizer) + height(dest) = old_height(src)
    // b. height(src) = height(dest)
    const newPaneHeight = (srcUnit.height - horizontalResizerHeight) / 2;

    // 1. 调整源 pane 高度
    srcUnit.height = newPaneHeight;

    // 2. 新增一个分屏 pane（下方）
    const destUnit = new PaneUnit({
      top: srcUnit.top + srcUnit.height + horizontalResizerHeight,
      left: srcUnit.left,
      width: srcUnit.width,
      height: newPaneHeight,
      content,
    });
    newUnits.push(destUnit);

    // 3. 新增水平分隔线
    const resizerUnit = new HorizontalResizerUnit({
      top: srcUnit.top + srcUnit.height,
      left: srcUnit.left,
      width: srcUnit.width,
      height: horizontalResizerHeight,
    });
    newUnits.push(resizerUnit);

    const addedUnit = [destUnit, resizerUnit];

    // 更新位置关系
    // 新 resizer 上下两侧更新
    resizerUnit.topSide = [srcUnit];
    resizerUnit.bottomSide = [destUnit];
    // 新 pane 更新
    destUnit.topSide = resizerUnit;
    destUnit.leftSide = srcUnit.leftSide;
    destUnit.bottomSide = srcUnit.bottomSide;
    destUnit.rightSide = srcUnit.rightSide;
    // 新 pane 右侧/下侧/左侧如果有 resizer，也要调整位置关系；上侧是本次新增的 resizer
    if (destUnit.rightSide) {
      destUnit.rightSide.leftSide.push(...addedUnit);
    }
    if (destUnit.leftSide) {
      destUnit.leftSide.rightSide.push(...addedUnit);
    }
    if (destUnit.bottomSide) {
      destUnit.bottomSide.topSide = removeUnitFromListByIds(destUnit.bottomSide.topSide, [
        srcUnitId,
      ]);
      destUnit.bottomSide.topSide.push(destUnit);
    }

    // 老 pane 下方变成新 resizer
    srcUnit.bottomSide = resizerUnit;

    setUnits(newUnits);
  };

  // 关闭一个 pane：
  // 1. 如果是垂直分隔，那么将其删除后空余的宽度，分配到分隔线另一侧的 pane 和 resizer；同时调整该 pane 上下左右 resizer 相邻的位置关系。
  // 2. 如果是水平分隔，那么将其删除后空余的高度，分配到分隔线另一侧的 pane 和 resizer；同时调整该 pane 上下左右 resizer 相邻的位置关系。
  const removePane = (srcUnitId: string) => {
    // 少于一个 pane 和 resizer，不能关闭
    if (units.length <= 1) {
      console.log('pane can not be closed beacause number of nane is less or equals then 1');
      return;
    }

    // 当前 pane
    const srcUnit = units.find((unit) => srcUnitId === unit.id) as PaneUnit;
    // 查看当前 pane 四边，哪个 resizer 的一侧只有该 pane ，则将宽度调整到 resizer 的另一侧
    const { topSide, rightSide, bottomSide, leftSide } = srcUnit;

    // 目标 resizer，当前 pane 被分隔的 resizer，如果 pane 数量大于1，则必然存在
    let destResizer = null;

    if (leftSide && leftSide.rightSide.length === 1 && leftSide.rightSide.includes(srcUnit)) {
      // 垂直分隔线，分隔线在 left，将 left 方向的 pane 和 resizer 宽度增加
      destResizer = leftSide;

      const freeWidth = srcUnit.width + leftSide.width;
      const otherSideUnit = leftSide.leftSide;
      otherSideUnit.forEach((unit) => {
        unit.width += freeWidth;
        // 因为已经识别是垂直分隔线，那么垂直分隔线左侧会包含：pane 和 水平方向的 resizer (垂直线和水平线会交汇)
        // 针对水平分隔线的左右两侧的相邻位置，我们不关心，只关心其上下侧；垂直则反之；
        if (isPane(unit)) {
          // 老 pane 删除后:
          // 1. 老 pane 左侧的 pane 和 resizer 将紧挨着老 pane 右侧的分隔线
          // 2. 老 pane 是经过左分隔线产生，显然，其 老 pane 和其左侧相对的 pane 是拥有相同的上下侧边界，所以无需变化。
          // 3. 老 pane 左侧无变化
          // 综上，只需调整对侧 pane 的右侧边界。
          (unit as PaneUnit).rightSide = srcUnit.rightSide;
        }
        if (srcUnit.rightSide) {
          srcUnit.rightSide.leftSide.push(unit);
        }
      });
    } else if (
      rightSide &&
      rightSide.leftSide.length === 1 &&
      rightSide.leftSide.includes(srcUnit)
    ) {
      // 分隔线在 right，将 right 方向的 pane 宽度增加
      destResizer = rightSide;

      const freeWidth = srcUnit.width + rightSide.width;
      const otherSideUnit = rightSide.rightSide;
      otherSideUnit.forEach((unit) => {
        unit.left -= freeWidth;
        unit.width += freeWidth;
        if (isPane(unit)) {
          (unit as PaneUnit).leftSide = srcUnit.leftSide;
        }
        if (srcUnit.leftSide) {
          srcUnit.leftSide.rightSide.push(unit);
        }
      });
    } else if (topSide && topSide.bottomSide.length === 1 && topSide.bottomSide.includes(srcUnit)) {
      // 分隔线在 top，将 top 方向的 pane 高度增加
      destResizer = topSide;

      const freeHeight = srcUnit.height + topSide.height;
      const otherSideUnit = topSide.topSide;
      otherSideUnit.forEach((unit) => {
        unit.height += freeHeight;
        if (isPane(unit)) {
          (unit as PaneUnit).bottomSide = srcUnit.bottomSide;
        }
        if (srcUnit.bottomSide) {
          srcUnit.bottomSide.topSide.push(unit);
        }
      });
    } else if (
      bottomSide &&
      bottomSide.topSide.length === 1 &&
      bottomSide.topSide.includes(srcUnit)
    ) {
      // 分隔线在 bottom，将 bottom 方向的 pane 高度增加
      destResizer = bottomSide;

      const freeHeight = srcUnit.height + bottomSide.height;
      const otherSideUnit = bottomSide.bottomSide;
      otherSideUnit.forEach((unit) => {
        unit.top -= freeHeight;
        unit.height += freeHeight;
        if (isPane(unit)) {
          (unit as PaneUnit).topSide = srcUnit.topSide;
        }
        if (srcUnit.topSide) {
          srcUnit.topSide.bottomSide.push(unit);
        }
      });
    }

    if (!destResizer) {
      return;
    }

    const idListToRemove = [srcUnitId, destResizer.id];

    // 前面已经处理了所有新增的位置关系，继续调整 resizer 位置关系：
    // 关闭一个窗口后，它要从相邻的 resizer 中被移除
    // 实际上：如果一个 pane 被删除，那么就要删除这个 pane 对应的一个 resizer （如前面逻辑：这个 resizer 存在且某一侧只有 pane 一个）
    // 如果对应的这个 resizer 在 pane 左侧，那么只需要 上侧/右侧/下侧 的 resizer 删除和这个 pane 的关系。因为左侧这个 resizer 本来就要被删除。
    // 以下为了统一简单处理，从4个方向都进行了删除。
    if (topSide) {
      topSide.bottomSide = removeUnitFromListByIds(topSide.bottomSide, idListToRemove);
    }
    if (bottomSide) {
      bottomSide.topSide = removeUnitFromListByIds(bottomSide.topSide, idListToRemove);
    }
    if (leftSide) {
      leftSide.rightSide = removeUnitFromListByIds(leftSide.rightSide, idListToRemove);
    }
    if (rightSide) {
      rightSide.leftSide = removeUnitFromListByIds(rightSide.leftSide, idListToRemove);
    }

    const newUnits = removeUnitFromListByIds(units, idListToRemove);

    setUnits(newUnits);
  };

  const initPane = () => {
    if (!ref.current) {
      return;
    }

    const { width: newContainerWidth, height: newContainerHeight } =
      ref.current.getBoundingClientRect();

    const childNumber = React.Children.count(children);
    if (childNumber) {
      const paneNumber = childNumber; // 几个子元素，就是几个分屏窗口，每个子元素显示到一个窗口；
      const resizerNumber = paneNumber - 1; // 分隔线的个数比分屏窗口少一个；

      // 垂直分隔时：
      if (split === VERTICAL) {
        const totalPaneWidth = newContainerWidth - resizerNumber * verticalResizerWidth;
        const initWidth = totalPaneWidth / paneNumber;
        const newUnits: LayoutUnit[] = [];

        let prevResizer: ResizerUnit | null = null;
        React.Children.forEach(children, (child, index) => {
          const isFirstPane = index === 0; // index 从 0 开始
          const isLastPane = index + 1 === paneNumber;

          const paneUnit = new PaneUnit({
            top: 0,
            left: index * initWidth + (isFirstPane ? 0 : verticalResizerWidth), // 不是第一个 pane 还要加上 resizer 的宽度
            width: initWidth,
            height: newContainerHeight,
            content: child,
          });
          newUnits.push(paneUnit);
          // 更新位置关系
          if (prevResizer) {
            paneUnit.leftSide = prevResizer;
            prevResizer.rightSide = [paneUnit];
          }

          // 不是最后一个，分屏窗口，后面就有一个垂直分隔线
          if (!isLastPane) {
            const resizerUnit = new VerticalResizerUnit({
              top: 0,
              left: (index + 1) * initWidth,
              width: verticalResizerWidth,
              height: newContainerHeight,
            });
            newUnits.push(resizerUnit);

            // 更新位置关系
            paneUnit.rightSide = resizerUnit;
            resizerUnit.leftSide = [paneUnit];

            // 更新 resizer 记录
            prevResizer = resizerUnit;
          }
        });

        setUnits(newUnits);
      } else {
        // 水平分隔：相同逻辑：高度平分，中间加分隔线
        const totalPaneHeight = newContainerHeight - resizerNumber * horizontalResizerHeight;
        const initHeight = totalPaneHeight / paneNumber;
        const newUnits: LayoutUnit[] = [];

        let prevResizer: ResizerUnit | null = null;
        React.Children.forEach(children, (child, index) => {
          const isFirstPane = index === 0; // index 从 0 开始
          const isLastPane = index + 1 === paneNumber;

          const paneUnit = new PaneUnit({
            top: index * initHeight + (isFirstPane ? 0 : horizontalResizerHeight), // 不是第一个 pane 还要加上 resizer 的高度
            left: 0,
            width: newContainerWidth,
            height: initHeight,
            content: child,
          });
          newUnits.push(paneUnit);
          // 更新位置关系
          if (prevResizer) {
            paneUnit.topSide = prevResizer;
            prevResizer.bottomSide = [paneUnit];
          }

          // 不是最后一个，分屏窗口，后面就有一个垂直分隔线
          if (!isLastPane) {
            const resizerUnit = new HorizontalResizerUnit({
              top: (index + 1) * initHeight,
              left: 0,
              width: newContainerWidth,
              height: horizontalResizerHeight,
            });
            newUnits.push(resizerUnit);

            // 更新位置关系
            paneUnit.bottomSide = resizerUnit;
            resizerUnit.topSide = [paneUnit];

            // 更新 resizer 记录
            prevResizer = resizerUnit;
          }

          setUnits(newUnits);
        });
      }
    }
  };

  // 分隔线移动时，要调整所有被影响的分屏窗口和分隔线；
  // 注意拖动时的一些约束：影响到的 pane 可能有最小尺寸；分隔线也不能被拖出布局容器，任何一个不满足，则不能被通过。
  const onResizerDrag = (srcResizerId: string, positionDelta: number) => {
    const newUnits = [...units];
    const srcResizerUnit = newUnits.find((unit) => srcResizerId === unit.id) as ResizerUnit;

    const shouldUpdate = shouldUpdateResizerPosition(
      srcResizerUnit,
      positionDelta,
      containerWidth,
      containerHeight,
      paneMinWidth,
      paneMinHeight
    );
    if (!shouldUpdate) {
      return;
    }

    if (srcResizerUnit.resizerType === VERTICAL) {
      srcResizerUnit.left += positionDelta;
      srcResizerUnit.leftSide.forEach((unit) => {
        unit.width += positionDelta;
      });
      srcResizerUnit.rightSide.forEach((unit) => {
        unit.left += positionDelta; // 右侧的，向左移动，宽度反向变化；
        unit.width -= positionDelta;
      });
    } else {
      srcResizerUnit.top += positionDelta;
      srcResizerUnit.topSide.forEach((unit) => {
        unit.height += positionDelta;
      });
      srcResizerUnit.bottomSide.forEach((unit) => {
        unit.top += positionDelta;
        unit.height -= positionDelta;
      });
    }

    setUnits(newUnits);
  };

  const onMouseDown = (event: MouseEvent, resizerId: string) => {
    const srcResizerUnit = units.find((unit) => resizerId === unit.id) as ResizerUnit;
    const currentPosition = getEventPosition(event, srcResizerUnit.resizerType);

    setDragResizerId(resizerId);
    setDragActive(true);
    setPosition(currentPosition);
  };

  const onWindowResize = (newContainerWidth: number, newContainerHeight: number) => {
    // window 大小变化时，平均分配变化量，到指定方向的所有单元；其中分隔线只改变位置，分屏窗口的位置和大小都要变化；
    // 各个组件按照比例缩放：
    // 比如窗口宽度减少：100px，那么所有的 pane 和 所有的水平 resizer 的宽度按照各自原有宽度的占比，按比例缩小；
    // 比如窗口高度减少：100px，那么所有的 pane 和 所有的垂直 resizer 的高度按照各自原有的高度占比，按比例缩小；

    const widthDelta = newContainerWidth - containerWidth;
    const heightDelta = newContainerHeight - containerHeight;

    // 对于 pane，调整宽高和坐标
    // 对于 水平 resizer，调整宽度，调整纵坐标
    // 对于 垂直 resizer，调整高度，调整宽度

    const newUnits = [...units];

    newUnits.forEach((unit) => {
      if (widthDelta !== 0) {
        // 宽度变化
        // pane 的宽度按照原有占比，重新计算新宽度，重新计算 left 坐标
        // 垂直 resizer 按照原有占比，重新计算新的 left 坐标，宽度不变
        // 水平 resizer 的宽度按照原有占比，重新计算新宽度，重新计算 left 坐标
        if (isPane(unit)) {
          unit.width = (unit.width / containerWidth) * newContainerWidth;
          unit.left = (unit.left / containerWidth) * newContainerWidth;
        } else {
          if ((unit as ResizerUnit).resizerType === VERTICAL) {
            unit.left = (unit.left / containerWidth) * newContainerWidth;
          } else {
            unit.width = (unit.width / containerWidth) * newContainerWidth;
            unit.left = (unit.left / containerWidth) * newContainerWidth;
          }
        }
      }
      if (heightDelta !== 0) {
        // 高度变化
        // pane 的高度按照原有占比，重新计算新高度，重新计算 top 坐标
        // 垂直 resizer 按照原有占比，重新计算新高度/新 top 坐标
        // 水平 resizer 按照原有占比，重新计算新 top 坐标，高度不变
        if (isPane(unit)) {
          unit.height = (unit.height / containerHeight) * newContainerHeight;
          unit.top = (unit.top / containerHeight) * newContainerHeight;
        } else {
          if ((unit as ResizerUnit).resizerType === VERTICAL) {
            unit.height = (unit.height / containerHeight) * newContainerHeight;
            unit.top = (unit.top / containerHeight) * newContainerHeight;
          } else {
            unit.top = (unit.top / containerHeight) * newContainerHeight;
          }
        }
      }
    });

    setUnits(newUnits);
  };

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const { width, height } = ref.current.getBoundingClientRect();
    setContainerWidth(width);
    setContainerHeight(height);
  }, []);

  // 初始化
  useLayoutEffect(() => {
    initPane();
  }, []);

  // 拖拽
  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (allowResize && dragActive) {
        const srcResizerUnit = units.find((unit) => dragResizerId === unit.id) as ResizerUnit;
        const currentPosition = getEventPosition(event, srcResizerUnit.resizerType);
        const positionDelta = currentPosition - position;

        onResizerDrag(dragResizerId, positionDelta);
        setPosition(currentPosition);
      }
    };

    const onMouseUp = () => {
      setDragActive(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [allowResize, dragActive, position, dragResizerId, units]);

  useLayoutEffect(() => {
    const onResize = () => {
      if (!ref.current) {
        return;
      }
      const { width: newContainerWidth, height: newContainerHeight } =
        ref.current.getBoundingClientRect();
      if (newContainerWidth !== containerWidth || newContainerHeight !== containerHeight) {
        onWindowResize(newContainerWidth, newContainerHeight);
        setContainerWidth(newContainerWidth);
        setContainerHeight(newContainerHeight);
      }
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [containerWidth, containerHeight, units]);

  const layoutStyle: React.CSSProperties = {
    position: 'relative',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <LayoutContext.Provider
      value={{
        containerWidth,
        containerHeight,
        unitNumber: units.length, // 小于 1 时不可关闭
        splitVertical,
        splitHorizontal,
        removePane,
      }}
    >
      <div
        ref={ref}
        className={`split-layout ${className}`}
        data-width={containerWidth}
        data-height={containerHeight}
        style={layoutStyle}
      >
        {units.map((unit) => {
          const { id } = unit;
          if (isPane(unit)) {
            return <Pane key={id} className={paneClassName} {...unit} />;
          }
          if (isResizer(unit)) {
            return (
              <Resizer
                key={id}
                className={resizerClassName}
                {...(unit as ResizerUnit)}
                allowResize={allowResize}
                onMouseDown={(event: React.MouseEvent) => onMouseDown(event.nativeEvent, id)}
              />
            );
          }
          return null;
        })}
      </div>
    </LayoutContext.Provider>
  );
};

export default SplitLayout;
