import React, { memo, forwardRef, useState, useImperativeHandle } from 'react';
import styles from './index.less';
import configs, { ACTIONS } from './configs';

interface ActionSheetProps {
  isOut: boolean;
  hasChildNodes: boolean;
  isRoot: boolean;
  keyValue?: string;
}

function ActionSheet(props: ActionSheetProps, ref: any) {
  const { isOut, isRoot, hasChildNodes, keyValue } = props;
  const [show, setShow] = useState(true);
  useImperativeHandle(
    ref,
    () => ({
      setShow,
    }),
    [setShow],
  );

  if (!show) return null;
  return (
    <div
      className={styles['container']}
      style={isOut ? { top: -19 } : { bottom: -19 }}
    >
      <div className={styles['action-btn']}>{keyValue}</div>
      {configs.map((config) => {
        const { icon, action, type } = config;
        if (isRoot && type === ACTIONS.copy) return null;
        if (!hasChildNodes && type === ACTIONS.clear) return null;
        return (
          <div className={styles['action-btn']} onClick={action} key={type}>
            <img src={icon} className={styles['action-icon']} />
          </div>
        );
      })}
    </div>
  );
}

export default memo(forwardRef(ActionSheet));
