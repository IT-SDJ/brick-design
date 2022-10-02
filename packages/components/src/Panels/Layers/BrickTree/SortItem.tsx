import React, { memo, useEffect, useState } from 'react';
import { get, isArray, isEmpty, isEqual, map } from 'lodash';
import Collapse, { Panel } from 'rc-collapse';
import {
  useSelector,
  isEqualKey,
  usePrevious,
  ChildNodesType,
  PageConfigType,
  getComponentConfig,
  isContainer,
  NodeProps,
  NodePropsConfigType,
  SelectedInfoBaseType,
  SelectedInfoType,
} from '@brickd/canvas';
import SortTree from './SortTree';
import styles from './index.less';
import Header from './Header';

interface SortItemPropsType {
  isFold?: boolean;
  propChildNodes?: string[];
  specialProps: SelectedInfoBaseType;
  propName?: string;
  nodeProps?: NodeProps;
}

/**
 * 渲染子组件或者属性节点
 * @returns {Array|*}
 */
function renderSortTree(
  props: SortItemPropsType,
  isUnfold: boolean,
  componentName: string,
  nodePropsConfig?: NodePropsConfigType,
  childNodes?: ChildNodesType,
) {
  const { specialProps, propName, nodeProps } = props;

  if (isArray(childNodes) || (!childNodes && !nodePropsConfig)) {
    return (
      <SortTree
        isFold={!isUnfold}
        childNodes={childNodes ? (childNodes as string[]) : []}
        propName={propName}
        specialProps={specialProps}
        nodeProps={nodeProps}
        componentName={componentName}
      />
    );
  }

  /**
   * 处理属性节点子组件
   */
  return map(nodePropsConfig, (nodeProps, propName) => {
    return (
      <SortItem
        {...props}
        propChildNodes={get(childNodes, propName, [])}
        specialProps={specialProps}
        propName={propName}
        key={propName}
        nodeProps={nodeProps}
      />
    );
  });
}

/**
 * 获取组件选中状态
 * @param key
 * @param hoverKey
 * @param selectedKey
 */
export function selectedStatus(
  key: string,
  hoverKey: string | null,
  selectedKey?: string,
) {
  const isSelected = isEqualKey(key, selectedKey);
  /** 是否hover到当前组件 */
  const isHovered = isEqualKey(key, hoverKey);
  return { isHovered, isSelected };
}

export type HookState = {
  selectedInfo: SelectedInfoType;
  pageConfig: PageConfigType;
};

function SortItem(props: SortItemPropsType) {
  const {
    specialProps,
    specialProps: { key, parentPropName, parentKey },
    isFold,
    propName,
    propChildNodes,
  } = props;

  const { selectedInfo, pageConfig } = useSelector([
    'selectedInfo',
    'pageConfig',
  ]);
  const { domTreeKeys: nextSDTKeys } = selectedInfo || {};

  const vDom = pageConfig[key];
  const { childNodes: vDomChildNodes, componentName } = vDom || {};
  const childNodes: ChildNodesType | undefined =
    propChildNodes || vDomChildNodes;

  const [isUnfold, setIsUnfold] = useState(isEmpty(childNodes));
  // 保存子组件dom
  const prevChildNodes = usePrevious<ChildNodesType>(childNodes);

  const prevSDTKeys = usePrevious(nextSDTKeys);

  //新添加组件展开
  useEffect(() => {
    if (!isUnfold && prevChildNodes && !isEqual(prevChildNodes, childNodes)) {
      setIsUnfold(true);
    }
  }, [prevChildNodes, childNodes, isUnfold,setIsUnfold]);

  // 父节点折叠当前节点是展开的就折叠当前节点
  useEffect(() => {
    if (isFold && isUnfold) setIsUnfold(false);
  }, [isFold, isUnfold]);

  useEffect(() => {
    if (
      !isEqual(prevSDTKeys, nextSDTKeys) &&
      nextSDTKeys &&
      isUnfold &&
      !nextSDTKeys.includes(key)
    ) {
      setIsUnfold(false);
    }
  }, [prevSDTKeys, nextSDTKeys, isUnfold]);

  if (!componentName) return null;

  if (
    !isEqual(prevSDTKeys, nextSDTKeys) &&
    nextSDTKeys &&
    !isUnfold &&
    nextSDTKeys.includes(key)
  ) {
    setIsUnfold(true);
  }

  const isContainerComponent = isContainer(componentName);
  const { fatherNodesRule, nodePropsConfig } = getComponentConfig(
    componentName,
  );
  return (
    <div
      className={styles['sort-item']}
      id={key}
      data-special={JSON.stringify({ key, parentPropName, parentKey })}
      data-farules={fatherNodesRule && JSON.stringify(fatherNodesRule)}
      data-name={componentName}
    >
      <Header
        isUnfold={isUnfold}
        specialProps={specialProps}
        propName={propName}
        setIsUnfold={setIsUnfold}
        hasChildNodes={!isEmpty(childNodes)}
        componentName={propName || componentName}
      />
      {isContainerComponent && (
        <Collapse
          activeKey={isUnfold || isEmpty(childNodes) ? '1' : '2'}
          style={{ backgroundColor: '#fff', border: 0, marginLeft: 20 }}
        >
          <Panel
            headerClass={styles['fold-panel-header']}
            showArrow={false}
            key="1"
            style={{ border: 0, padding: 0 }}
          >
            {renderSortTree(
              props,
              isUnfold,
              componentName,
              nodePropsConfig,
              childNodes,
            )}
          </Panel>
        </Collapse>
      )}
    </div>
  );
}

export default memo<SortItemPropsType>(SortItem);
