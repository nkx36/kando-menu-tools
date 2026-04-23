  
export type KandoMenuConfig = {
  root: any,
  shortcut: string,
  shortcutID: string,
  centered: boolean,
  anchored: boolean,
  hoverMode: boolean,
  tags: string[]  
}
export type KandoMenuList = {
  name: string;
  path: string;
}

export type MenuListOptions = {
  // filter?: (menu: KandoMenuList) => boolean;
  // sort?: (a: KandoMenuList, b: KandoMenuList) => number;
  validate?: boolean
}

export type CLIOptions = {
  command?: string,
  menu?: string,
  watch?: boolean,
  debug?: boolean,
  dir?: string,
  help?: boolean,
  json?: boolean,
  verbose?: boolean
}