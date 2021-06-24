import { Action } from 'redux';
import { ActionType, VirtualDOMType } from '@brickd/utils';
import { PropsConfigType } from './ComponentSchemaTypes';

export type PropsNodeType = {
  [propName: string]: string[] | undefined;
};

export type PlainObjectType = { [key: string]: any };

export type ChildNodesType = string[] | PropsNodeType;

export interface ParentNodeInfo {
  parentKey: string;
  parentPropName?: string;
}

export type PropsType = {
  [propName: string]: ActionType | any;
};

export interface SelectedInfoBaseType extends ParentNodeInfo {
  key: string;
  domTreeKeys: string[];
}

export type SelectedInfoType = Omit<SelectedInfoBaseType, 'key'> & {
  selectedKey: string;
  propName?: string;
  props?: any;
  propsConfig: PropsConfigType;
};

export interface DragSourceType extends Partial<ParentNodeInfo> {
  template?: PageConfigType;
  dragKey?: string;
}

export interface DropTargetType {
  dropKey: string;
  propName?: string;
  domTreeKeys: string[];
  childNodeKeys: string[];
}

export type PlatformSizeType = [number, number];

export interface PlatformInfoType {
  platformName?: string;
  size: PlatformSizeType;
}

export interface PageConfigType {
  [key: string]: VirtualDOMType;
}

export interface BrickAction extends Action<string> {
  payload?: any;
}

export type UndoRedoType = Partial<Omit<StateType, 'undo' | 'redo'>>;

export type StateType = {
  pageConfig: PageConfigType;
  selectedInfo: SelectedInfoType | null;
  undo: UndoRedoType[];
  redo: UndoRedoType[];
  hoverKey: null | string;
  platformInfo: PlatformInfoType;
};

export interface BrickDesignStateType {
  layerName: string;
  [pageName: string]: StateType | string;
}
export type STATE_PROPS = keyof StateType;
