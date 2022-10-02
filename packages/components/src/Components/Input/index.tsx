import React, {
  useState,
  memo,
  useImperativeHandle,
  forwardRef,
  useRef,
  ReactNode, useEffect,
} from 'react';
import { useForceRender } from '@brickd/hooks';
import styles from './index.less';
import deleteIcon from '../../assets/delete-icon.svg';

export interface InputProps extends React.InputHTMLAttributes<any> {
  onChange?: (v?: any) => void;
  closeStyle?: React.CSSProperties;
  closeAble?: boolean;
  inputClass?: string;
  focusClass?: string;
  addonAfter?: ReactNode;
  addonBefore?: ReactNode;
}
function Input(props: InputProps, ref: any) {
  const {
    type,
    onChange,
    closeStyle,
    closeAble = true,
    className,
    inputClass,
    focusClass,
    defaultValue,
    addonAfter,
    addonBefore,
    value:v,
    ...rest
  } = props;
  const [value, setValue] = useState(v||defaultValue);
  const forceRender = useForceRender();
  const isFocusRef = useRef(false);
  useImperativeHandle(
    ref,
    () => ({
      setValue,
    }),
    [setValue],
  );

  useEffect(()=>{
    if(value===undefined){
      setValue(v);
    }
  },[v,value,setValue]);
  const change = (event: any) => {
    const value = event.target.value;
    setValue(value);
    onChange && onChange(value);
  };

  const clean = (event:any) => {
    event.stopPropagation();
    setValue('');
    onChange && onChange(undefined);
  };

  const onFocus = () => {
    isFocusRef.current = true;
    forceRender();
  };

  const onBlur = () => {
    isFocusRef.current = false;
    setTimeout(forceRender,200);
  };
  return (
    <div
      className={`${styles['container']} ${className} ${
        isFocusRef.current && focusClass
      }`}
    >
      {!!addonBefore && addonBefore}
      <input
        type={type || 'text'}
        className={`${styles['common-input']} ${inputClass}`}
        onBlur={onBlur}
        onFocus={onFocus}
        {...rest}
        onChange={change}
        value={value}
      />
      {!!addonAfter && addonAfter}
      {!!value && isFocusRef.current && closeAble && (
        <img
          src={deleteIcon}
          style={closeStyle}
          onClick={clean}
          className={styles['close-icon']}
        />
      )}
    </div>
  );
}

export default memo(forwardRef(Input));
