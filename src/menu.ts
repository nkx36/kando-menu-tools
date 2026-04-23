import path from 'path';
import fs from 'fs';
import { readDir, shellcmd } from "./utils";
import type { CLIOptions, KandoMenuList, MenuListOptions } from "./types";

import type { KandoMenuSettings, KandoRootMenu, KandoSubmenu } from './types/menu';
import { connect } from './socket';



/**
 * Resolve a given path to a menu file.
 * If the path does not start with a slash, it is assumed to be relative to the KANDO_MENU_DIR.
 * If the path does not end with .ts or .json, it is assumed to be a directory and the first .ts or .json file in the directory is used.
 * If the path does not refer to an existing file, an error is thrown.
 * @param {string} name - The path to resolve.
 * @returns {string} - The resolved path.
 */
export function resolvePath(name: string, opt: CLIOptions = { dir: process.env.KANDO_MENU_DIR }): string {
  let _path: string = name
  if (!_path.startsWith("/")) {
    if (!opt.dir) {
      throw new Error("$KANDO_MENU_DIR is not set")
    }
    _path = path.join(opt.dir, /\.[ts|json]$/.test(_path) ? name : `${name}.ts`)
  }
  const stat = fs.statSync(_path);


  const fileType = stat.isFile() ? 'file' : 'directory';
  if (fileType !== 'file') {
    const files = getFiles()
    const existingFile: any = files.find(file => {
      if (_path + ".ts" === file.name) {
        return true
      }
    });
    if (!existingFile) {
      throw new Error("file not found. usage: kando-menu /path/to/menus.(json|ts)")
    }
    _path = path.join(existingFile.path, existingFile.name)
  }
  return _path
}

/**
 * Parse a menu file.
 *
 * @param {string} menuPath - the path to the menu file. This may be a relative or absolute path.
 *   If it is a relative path, it is resolved relative to the directory containing the menus.
 *   If it is an absolute path, it is resolved as-is.
 *
 * @returns {Promise<object>} - a promise that resolves to the parsed menu file.
 *
 * @throws {Error} - if the menu path is invalid or the file does not exist.
 */
export async function parse(menuPath: string): Promise<KandoSubmenu> {

  if (!menuPath) {
    throw new Error("no menu path. usage: kando-menu /path/to/menus.(json|ts)")
  }
  menuPath = resolvePath(menuPath)
  console.log("menuPath: ", res)
  return shellcmd(`bun ${menuPath}`).then(res => {
    return JSON.parse(res)
  }).catch(e => {
    console.log("resolveTSMenu Error: ", e)
  })
}

export async function load(menuPath: string): Promise<string | object> {
  return await parse(menuPath)
}


export async function open(menuPath: string): Promise<void> {
  
  const _menu = await parse(menuPath).catch((err) => {
    console.log(": ", err)
  })
  console.log("_menu: ", _menu)
  return
  const socket = await connect();

  socket.send(JSON.stringify({ type: 'show-menu', menu: _menu }));
  socket.onmessage = (message) => {
    const msg: any = JSON.parse(message.data.toString());
    if (msg.type === 'cancel') {
      socket.close()
      process.exit(0)
    }
  }

  socket.onerror = (error) => {
    console.log("error: ", error)
  }
}

/**
 * Checks whether the given menu path points to a valid menu settings file. The function
 * first tries to read the file content. If the file does not exist or cannot be read,
 * the function will return false. If the content can be parsed as JSON, the function
 * will return true. If the content does not conform to the menu settings schema, the
 * function will return false.
 *
 * @param menuPath The path to the menu settings file to check.
 * @returns A promise that resolves to true if the menu settings file is valid and false
 *   otherwise.
 */
export async function isValid(menuPath: string): Promise<boolean> {
  return await parse(menuPath).then(menu => {

    if (typeof menu === 'object') {
      return true
    }
    try {
      JSON.parse(menu)
      return true
    } catch {
      return false
    }
  }).catch(_e => {
    return false
  })
}

/**
 * Lists all available menu files. Each menu file is represented as an object with two
 * properties: `name` and `path`. The `name` property is the name of the menu file
 * without its extension. The `path` property is the full path to the menu file.
 *
 * @param {MenuListOptions} opt Options for listing the menu files.
 * @param {boolean} [opt.validate=true] If true, the function will validate each menu file
 *   by checking whether it conforms to the menu settings schema. If false, no validation
 *   will be done.
 * @returns {Promise<KandoMenuList[]>} A promise that resolves to an array of objects
 *   representing the found menu files.
 */
export async function list(opt: MenuListOptions = { validate: true }): Promise<KandoMenuList[]> {
  let files = await Promise.all(getFiles().map((file: any) => path.join(file.path, file.name)))
  let res: KandoMenuList[] = []
  for (const file of files) {
    let _valid = (opt.validate) ? await isValid(file) : true
    if (_valid) {
      res.push({ name: path.basename(file).replace(/\.[ts|json]/, ''), path: file })
    }
  }
  return res
}

/**
 * Reads the directory at `KANDO_MENU_DIR` and returns the files
 *
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects representing
 *   the files in the directory.
 */
function getFiles(): fs.Dirent[] {
  if (!process.env.KANDO_MENU_DIR) {
    throw new Error("$KANDO_MENU_DIR is not set")
  }
  return readDir(process.env.KANDO_MENU_DIR)
}

export async function loadKandoMenu(): Promise<KandoMenuSettings> {
  if (!process.env.KANDO_HOME) {
    throw new Error("$KANDO_HOME is not set")
  }
  const menuFile = path.join(process.env.KANDO_HOME, 'menus.json')
  const menuFileContent = await fs.promises.readFile(menuFile, { encoding: 'utf8' })
  const menuFileData = JSON.parse(menuFileContent)
  return menuFileData

}

export async function editKandoMenu(): Promise<void> {
  if (!process.env.KANDO_HOME) {
    throw new Error("$KANDO_HOME is not set")
  }
  const menuFile = path.join(process.env.KANDO_HOME, 'menus.json')
  await shellcmd(`code ${menuFile}`)
}

type MenuOptions = {
  centered?: boolean,
  anchored?: boolean,
  hoverMode?: boolean
  shortcut?: string
  tags?: string[]
}
export async function update(name: string, menuData: string | object, opt: MenuOptions = {}): Promise<void> {
  if (!process.env.KANDO_HOME) {
    throw new Error("$KANDO_HOME is not set")
  }
  const kandoMenu = await loadKandoMenu()
  const exists: KandoRootMenu = kandoMenu.menus.find((m: any) => {
    return m.shortcutID === name
  })
  if (!exists) {
    if (menuData instanceof String) {
      menuData = JSON.parse(menuData.toString())
    }
    if (!(menuData instanceof Object)) {
      throw new Error("menuData must be an object")
    }
    kandoMenu.menus.push({
      root: {
        ...(menuData as KandoSubmenu)
      },
      shortcut: opt?.shortcut,
      shortcutID: name,
      centered: opt?.centered,
      anchored: opt?.anchored,
      hoverMode: opt?.hoverMode,
      tags: [],
    })
  } else {
    for (const key in opt) {
      (exists as any)[key] = opt[key as keyof MenuOptions]
    }
    exists.root = menuData as KandoSubmenu
  }

  return await fs.promises.writeFile(path.join(process.env.KANDO_HOME, 'menus.json'), JSON.stringify(kandoMenu, null, 2))
}
