import React, {
  IframeHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  clearHovered,
  PageConfigType,
  DragSourceType,
  STATE_PROPS,
  getStore,
  StateType,
  initPageBrickdState,
  setPageName,
  ROOT,
  addComponent, undo, redo,
} from '@brickd/core';
import ReactDOM from 'react-dom';
import { BrickStore, StaticContextProvider } from '@brickd/hooks';
import { BrickContext } from 'components/BrickProvider';
import { getDragSourceFromKey, getIframe, iframeSrcDoc } from './utils';
import { onDragover } from './common/events';
import Guidelines from './components/Guidelines';
import Distances from './components/Distances';
import Resize from './components/Resize';
import { useSelector } from './hooks/useSelector';
import StateDomainWrapper from './wrappers/StateDomainWrapper';
import styles from './global.less';
import {
  OperateProvider,
  OperateStateType,
} from './components/OperateProvider';

/**
 * 鼠标离开设计区域清除hover状态
 */
interface BrickDesignProps extends IframeHTMLAttributes<any> {
  onLoadEnd?: () => void;
  initState?: Partial<StateType>;
  pageName: string;
  [propName: string]: any;
}

const stateSelector: STATE_PROPS[] = ['pageConfig'];

type BrickdHookState = {
  pageConfig: PageConfigType;
  dragSource: DragSourceType;
};

const controlUpdate = (
  prevState: BrickdHookState,
  nextState: BrickdHookState,
) => {
  const { pageConfig: prevPageConfig } = prevState;
  const { pageConfig } = nextState;
  const nextRootComponent = pageConfig[ROOT];
  const prevRootComponent = prevPageConfig[ROOT];
  return !nextRootComponent || nextRootComponent !== prevRootComponent;
};

function BrickDesign(brickdProps: BrickDesignProps) {
  const { onLoadEnd, pageName, initState, options, ...props } = brickdProps;
  const { pageConfig = {} } = useSelector<BrickdHookState, STATE_PROPS>(
    stateSelector,
    controlUpdate,
  );
  const { platformInfo } = useSelector(['platformInfo']);
  const iframeRef = useRef<HTMLIFrameElement>();
  const rootComponent = pageConfig[ROOT];
  const staticState = useMemo(() => ({ options, pageName }), [
    pageName,
    options,
  ]);

  const onMouseLeave = useCallback((event: Event) => {
    event.stopPropagation();
    clearHovered();
    operateStore.setPageState({
      hoverNode: null,
      operateHoverKey: null,
    });
  }, []);

  const renderComponent = useCallback((pageConfig: PageConfigType) => {
    const rootComponent = pageConfig[ROOT];
    if (!rootComponent) return null;
    const specialProps = { domTreeKeys: [ROOT], key: ROOT, parentKey: '' };
    return (
      <StateDomainWrapper
        {...props}
        onMouseLeave={onMouseLeave}
        specialProps={specialProps}
      />
    );
  }, []);

  const designPage = useMemo(() => renderComponent(pageConfig), [pageConfig]);
  const divContainer = useRef(null);
  const operateStore = useRef<BrickStore<OperateStateType>>(
    new BrickStore<OperateStateType>(),
  ).current;
  const componentMount = useCallback(
    (divContainer, designPage) => {
      ReactDOM.render(
        <StaticContextProvider value={staticState}>
          <OperateProvider value={operateStore}>
            <BrickContext.Provider value={getStore()}>
              {designPage}
              <Distances />
              <Resize />
            </BrickContext.Provider>
          </OperateProvider>
        </StaticContextProvider>,
        divContainer.current,
      );
    },
    [staticState],
  );

  const onDragEnter = useCallback(() => {
    componentMount(
      divContainer,
      renderComponent(getDragSourceFromKey('vDOMCollection', {})),
    );
  }, [componentMount, divContainer]);

  const onDragLeave = useCallback(() => {
    ReactDOM.unmountComponentAtNode(divContainer.current);
  }, [divContainer.current]);

  const onIframeLoad = useCallback(() => {
    const head = document.head.cloneNode(true);
    const { contentDocument } = iframeRef.current;
    contentDocument.head.remove();
    contentDocument.documentElement.insertBefore(head, contentDocument.body);
    divContainer.current = contentDocument.getElementById('dnd-container');
    componentMount(divContainer, designPage);
    onLoadEnd && onLoadEnd();
  }, [
    divContainer.current,
    iframeRef.current,
    designPage,
    onLoadEnd,
    componentMount,
  ]);

  useEffect(() => {
    setPageName(pageName);
    initPageBrickdState(initState);
  }, [pageName]);

  const onDrop = useCallback((e: DragEvent) => {
    e.stopPropagation();
    operateStore.setPageState({ dropNode: null });
    addComponent();
  }, []);

  useEffect(() => {
    iframeRef.current = getIframe();
    const contentWindow = iframeRef.current.contentWindow!;
    function onKeyDown(keyEvent: any) {
      const { key, ctrlKey, shiftKey, metaKey } = keyEvent;
      if (key === 'z' && (ctrlKey || metaKey)) {
        if (!shiftKey) {
          undo();
        } else if (shiftKey) {
          redo();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    contentWindow.addEventListener('dragover', onDragover);
    window.addEventListener('dragover', onDragover);
    contentWindow.addEventListener('drop', onDrop);
    window.addEventListener('drop', onDrop);
    return () => {
      contentWindow.removeEventListener('dragover', onDragover);
      contentWindow.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onDragover);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (rootComponent) return;
    const contentWindow = getIframe()!.contentWindow!;

    contentWindow.addEventListener('dragenter', onDragEnter);
    contentWindow.addEventListener('dragleave', onDragLeave);
    return () => {
      contentWindow.removeEventListener('dragenter', onDragEnter);
      contentWindow.removeEventListener('dragleave', onDragLeave);
    };
  }, [rootComponent, onDragEnter, onDragLeave]);

  useEffect(() => {
    if (divContainer.current) {
      componentMount(divContainer, designPage);
    }
  }, [divContainer.current, componentMount, designPage]);


  useEffect(() => {
    function onMouseWheel(mousewheel:WheelEvent){
      mousewheel.stopPropagation();
      return false;
    }
    window.addEventListener('mousewheel', onMouseWheel);
    return () => {
      window.removeEventListener('mousewheel', onMouseWheel);
    };
  }, []);


  const { size } = platformInfo;
  const style = useMemo(()=>({ width: size[0], height: size[1], transition: 'all 700ms',transform:'scale(0.50, 0.50)' }),[size]);

  return (
    <div
      style={style}
      className={styles['browser-mockup']}
    >
      <Guidelines operateStore={operateStore} />
      <iframe
      id="dnd-iframe"
      style={{ border: 0, width: '100%', height: '100%' }}
      srcDoc={iframeSrcDoc}
      onLoad={onIframeLoad}
      {...props}
    />
    </div>
  );
}

export default memo(BrickDesign);
