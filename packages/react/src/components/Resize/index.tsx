import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  PageConfigType,
  resizeChange,
  ResizePayload,
  ROOT,
  SelectedInfoType,
  STATE_PROPS,
} from '@brickd/core';

import { get, map } from 'lodash';
import { Item } from './Item';
import styles from './index.less';
import { useSelector } from '../../hooks/useSelector';
import {
  formatUnit,
  generateCSS,
  getElementInfo,
  getIframe,
  setPosition,
  showBaseboard,
} from '../../utils';
import ActionSheet from '../ActionSheet';
import { useOperate } from '../../hooks/useOperate';
import { DEFAULT_ANIMATION } from '../../common/constants';

type ResizeState = {
  selectedInfo: SelectedInfoType;
  hoverKey: string | null;
  pageConfig: PageConfigType;
};

export enum Direction {
  top = 'top',
  right = 'right',
  bottom = 'bottom',
  left = 'left',
  topRight = 'topRight',
  bottomRight = 'bottomRight',
  bottomLeft = 'bottomLeft',
  topLeft = 'topLeft',
}

const controlUpdate = (prevState: ResizeState, nextState: ResizeState) => {
  const { selectedInfo, pageConfig, hoverKey } = nextState;
  return (
    prevState.selectedInfo !== selectedInfo ||
    (selectedInfo &&
      (prevState.pageConfig !== pageConfig || prevState.hoverKey !== hoverKey))
  );
};

type OriginSizeType = {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number | null;
  minHeight: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
  direction: Direction;
};

function Resize() {
  const iframe = useRef(getIframe()).current;
  const { selectedInfo, hoverKey, pageConfig } = useSelector<
    ResizeState,
    STATE_PROPS
  >(['selectedInfo', 'pageConfig', 'hoverKey'], controlUpdate);
  const { getOperateState, setSubscribe, setOperateState } = useOperate();
  const { selectedKey, propName } = selectedInfo || {};
  const resizeRef = useRef<any>();
  const originSizeRef = useRef<OriginSizeType>();
  const sizeResultRef = useRef<ResizePayload>({});
  const widthRef = useRef<any>();
  const heightRef = useRef<any>();
  const baseboardRef = useRef<HTMLDivElement | any>();
  const actionSheetRef = useRef<any>();
  const [isOut, setIsOut] = useState<boolean>(true);
  const { props, childNodes } = pageConfig[selectedKey] || {};
  let { width, height } = get(props, 'style', {
    width: 'auto',
    height: 'auto',
  });
  width = width || 'auto';
  height = height || 'auto';

  const setSelectedBorder = useCallback((css = '') => {
    const {
      selectedNode,
      operateSelectedKey,
      isModal,
      radiusChangePosition,
    } = getOperateState();
    if (selectedNode && operateSelectedKey) {
      const { left, top, width, height } = getElementInfo(
        selectedNode,
        iframe,
        isModal,
      );
      // if(width===0||height===0){
      //   selectedNode.className
      // }
      if (top <= 14 && isOut) {
        setIsOut(false);
      } else if (top > 14 && !isOut) {
        setIsOut(true);
      }
      resizeRef.current.style.cssText =
        generateCSS(left, top, width, height) + css;
      radiusChangePosition(left, top, width, height, css);

      setPosition([resizeRef.current], isModal);
    }
  }, []);

  const resizeChangePosition = useCallback((left: number, top: number) => {
    resizeRef.current.style.cssText =
      generateCSS(left, top) + `transition:none;`;
    // actionSheetRef.current.setShow(false);
  }, []);

  useEffect(() => {
    const contentWindow = iframe!.contentWindow!;
    setOperateState({ resizeChangePosition, actionSheetRef });
    contentWindow.addEventListener('mouseup', onMouseUp);
    contentWindow.addEventListener('mousemove', onMouseMove);
    contentWindow.addEventListener('mouseleave', onMouseUp);
    return () => {
      contentWindow.removeEventListener('mouseup', onMouseUp);
      contentWindow.removeEventListener('mousemove', onMouseMove);
      contentWindow.removeEventListener('mousemove', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const contentWindow = iframe!.contentWindow!;
    const changeSize = () =>
      setSelectedBorder(`transition:${DEFAULT_ANIMATION};`);
    const unSubscribe = setSubscribe(changeSize);
    contentWindow.addEventListener('resize', changeSize);
    contentWindow.addEventListener('animationend', changeSize);
    return () => {
      unSubscribe();
      contentWindow.removeEventListener('resize', changeSize);
      contentWindow.removeEventListener('animationend', changeSize);
    };
  }, []);

  if (!selectedKey && resizeRef.current) {
    resizeRef.current.style.display = 'none';
  }

  const onMouseUp = useCallback(() => {
    const { selectedNode } = getOperateState();
    originSizeRef.current = undefined;
    baseboardRef.current!.style.display = 'none';
    resizeRef.current.style.pointerEvents = 'none';
    resizeRef.current.style.transition = DEFAULT_ANIMATION;
    selectedNode && (selectedNode.style.transition = DEFAULT_ANIMATION);
    resizeChange(sizeResultRef.current);
    sizeResultRef.current = {};
  }, []);

  const onMouseMove = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    const { selectedNode } = getOperateState();
    if (originSizeRef.current) {
      const { clientX, clientY } = event;
      const { x, y, direction, height, width } = originSizeRef.current;
      let offsetY = 0;
      let offsetX = 0;
      switch (direction) {
        case Direction.left:
          offsetX = x - clientX;
          break;
        case Direction.right:
          offsetX = clientX - x;
          break;
        case Direction.top:
          offsetY = y - clientY;
          break;
        case Direction.bottom:
          offsetY = clientY - y;
          break;
        case Direction.topLeft:
          offsetY = y - clientY;
          offsetX = x - clientX;
          break;
        case Direction.topRight:
          offsetY = y - clientY;
          offsetX = clientX - x;
          break;
        case Direction.bottomLeft:
          offsetX = x - clientX;
          offsetY = clientY - y;
          break;
        case Direction.bottomRight:
          offsetY = clientY - y;
          offsetX = clientX - x;
          break;
      }
      const heightResult = height + offsetY;
      const widthResult = width + offsetX;
      const {
        minWidth,
        maxHeight,
        maxWidth,
        minHeight,
      } = originSizeRef.current;
      selectedNode!.style.transition = 'none';
      if (
        offsetX !== 0 &&
        (minWidth === null || widthResult >= minWidth) &&
        (maxWidth === null || widthResult <= maxWidth)
      ) {
        sizeResultRef.current.width = `${widthResult}px`;
        selectedNode!.style.width = `${widthResult}px`;
      }
      if (
        offsetY !== 0 &&
        (minHeight === null || heightResult >= minHeight) &&
        (maxHeight === null || heightResult <= maxHeight)
      ) {
        sizeResultRef.current.height = `${heightResult}px`;
        selectedNode.style.height = `${heightResult}px`;
      }
      showSize(sizeResultRef.current.width, sizeResultRef.current.height);
      setSelectedBorder('pointer-events: auto; transition:none;');
      showBaseboard(iframe, baseboardRef.current);
    }
  }, []);

  const showSize = useCallback((width?: string, height?: string) => {
    if (width) {
      widthRef.current.innerHTML = width;
    }
    if (height) {
      heightRef.current.innerHTML = height;
    }
  }, []);

  const onResizeStart = useCallback(function (
    event: React.MouseEvent<HTMLSpanElement>,
    direction: Direction,
  ) {
    const { selectedNode } = getOperateState();
    if (event.nativeEvent && iframe) {
      const { contentWindow } = iframe!;
      const {
        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
      } = contentWindow!.getComputedStyle(selectedNode);
      originSizeRef.current = {
        x: event.nativeEvent.clientX,
        y: event.nativeEvent.clientY,
        direction,
        width: formatUnit(width)!,
        height: formatUnit(height)!,
        minWidth: formatUnit(minWidth),
        minHeight: formatUnit(minHeight),
        maxWidth: formatUnit(maxWidth),
        maxHeight: formatUnit(maxHeight),
      };
      showBaseboard(iframe, baseboardRef.current);
    }
  },
  []);

  return (
    <>
      <div className={styles['border-container']} ref={resizeRef}>
        {false&&<ActionSheet
          ref={actionSheetRef}
          isOut={isOut}
          hasChildNodes={propName ? !!get(childNodes, propName) : !!childNodes}
          isRoot={selectedKey === ROOT}
          keyValue={selectedKey}
        />}
        {map(Direction, (direction) => (
          <Item
            onResizeStart={onResizeStart}
            direction={direction}
            key={direction}
          />
        ))}

        <div
          className={hoverKey ? styles['tip-hidden'] : styles['size-tip-width']}
          ref={widthRef}
        >
          {width}
        </div>
        <div
          className={
            hoverKey ? styles['tip-hidden'] : styles['size-tip-height']
          }
          ref={heightRef}
        >
          {height}
        </div>
      </div>
      <div
        ref={baseboardRef}
        id="brick-design-baseboard"
        className={styles['baseboard']}
      />
    </>
  );
}

export default memo(Resize);
