type CommandOptions = {
  command: string
  delayed?: boolean
}
type FileOptions = {
  path: string
}
type HotkeyOptions = {
  hotkey: string
  delayed?: boolean
}
type KeyOptions = {
  type: "keyDown" | "keyUp"
  key: string
  delay: number
}
type MacroOptions = {
  macro: KeyOptions[]
}
type PasteOptions = {
  text: string
}

type UriOptions = {
  uri: string
}
type RedirectOptions = {
  menu: string
}



type MenuItemOptions = {
  submenu: KandoMenuItems
  command: CommandOptions
  file: FileOptions
  hotkey: HotkeyOptions
  macro: MacroOptions
  paste: PasteOptions
  uri: UriOptions
  redirect: RedirectOptions
}

type MenuItem<T extends keyof MenuItemOptions = keyof MenuItemOptions> = {
  type: T
  name: string;
  icon: string;
  iconTheme: string;
}

type KandoMenuItems = {
  [K in keyof MenuItemOptions]?: MenuItem<K> & {
    data: MenuItemOptions[K]
  }
} extends {
  [key: string]: infer T
} ? T : never
export type KandoSubmenu = Omit<MenuItem, "data" | "type"> & {
  type: "submenu"
  children: Array<KandoMenuItems>
}
export type KandoRootMenu = {
  root: KandoSubmenu,
  shortcut?: string,
  shortcutID?: string,
  centered?: boolean,
  anchored?: boolean,
  hoverMode?: boolean,
  tags?: string[]
}
// Types generated from the JSON structure
export type KandoMenuSettings = {
  version: string;
  menus: KandoRootMenu[];
};