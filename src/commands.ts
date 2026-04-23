import path from 'path';
import * as menu from './menu';
import { resolvePath } from './menu';
import { connect } from './socket';
import type { KandoMenuList } from './types';
import { execSync } from 'child_process';
import fs from 'fs';
import type { KandoSubmenu } from './types/menu';
type CommandOptions = {
  verbose?: boolean,
  debug?: boolean,
  json?: boolean,
  help?: boolean
}

export async function editCommand(opt: CommandOptions & { watch?: boolean, menu: string }): Promise<void> {
  try {
    const menuPath = resolvePath(opt.menu)
    execSync(`code ${menuPath}`)
    if (opt.watch) {
      execSync(`devu terminal --command="devu kando:menu show ${opt.menu} --watch"`)
    }

  } catch (error: any) {
    throw new Error(error)
  }
}


export async function showTempMenu(opt: CommandOptions & { watch?: boolean, menu: string }): Promise<any> {
  const result: KandoSubmenu = await menu.parse(resolvePath(opt.menu))
  if (result) {
    //console.log("event change ",result )  
    result.children = [
      ...result.children,
      {
        type: 'command',
        name: "save",
        icon: "save",
        iconTheme: "material-symbols-rounded",
        data: { "command": `devu kando:menu save ${opt.menu}` }
      }
    ]

  }
  //console.log("result: ", result)
  showCommand({ menu: result })
  // console.log("result: ", result)
  return result
}

export async function newCommand(opt: CommandOptions & { watch?: boolean, menu: string }): Promise<void> {
  try {
    if(!process.env.KANDO_MENU_DIR){
      throw new Error("$KANDO_MENU_DIR is not set")
    }
    const menuPath = path.join(process.env.KANDO_MENU_DIR, `${opt.menu}.ts`)

    execSync(`touch ${menuPath} && code ${menuPath}`)
    if (opt.watch) {
      //execSync(`devu terminal --command="devu kando:menu show ${opt.menu} --watch"`)
      fs.watch(menuPath, async (eventType) => {
        if (eventType === 'change') {
          showTempMenu(opt)
        }
      })
    }
    showTempMenu(opt)
  } catch (error:any) {
    throw new Error(error)
  }
}

export async function saveCommand(opt: CommandOptions & { watch?: boolean, menu: string, edit?: boolean }): Promise<void> {
  try {
    if (!opt.menu) {
      let menus = await menu.list()
      for (const m of menus) {
        const res = await menu.load(m.path)
        await menu.update(m.name, res)
      }
    } else {
    }
    if (opt.edit) {
      menu.editKandoMenu()
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

export async function showCommand(opt: CommandOptions & { watch?: boolean, menu: string|KandoSubmenu }): Promise<any> {
  // opt.watch = true
  let _menu
  if (typeof opt.menu === 'object') {
    _menu = opt.menu
  } else {
    _menu = await menu.load(opt.menu).catch(() => {
      //console.log("err: ", err)
      return {
        type: 'submenu',
        name: 'Invalid Menu',
        icon: "error",
        iconTheme: "simple-icons-colored",
      }
    })
  }
  const socket = await connect();
  socket.send(JSON.stringify({ type: 'show-menu', menu: _menu }));
  socket.onmessage = (message) => {
    const msg: any = JSON.parse(message.data.toString());
    if (msg.type === 'cancel') {
      socket.close()
      process.exit(0)
    }
    console.log("msg: ", msg)
  }

  socket.onerror = (error) => {
    console.log("error: ", error)
  }

  if (opt.watch) {
    if(typeof opt.menu !== 'string'){
      throw new Error("opt.menu must be a string")
    }
    return new Promise(() => {
      return fs.watch(resolvePath(opt.menu.toString()), async (eventType) => {

        if (eventType === 'change') {
          socket.close()
          const result = await showCommand({ menu: opt.menu })
          // console.log("result: ", result)
          return result
        }
      })
    })
  }


}
export async function listCommand(opt: CommandOptions): Promise<KandoMenuList[]|string> {
  if (!(opt.verbose || opt.json) && process.env.KANDO_MENUS) {
    return (process.env.KANDO_MENUS||'').split(':').join('\n')
  }
  let files = await menu.list()
  if (opt.json) {
    return JSON.stringify(files, null, 2)
  }
  return files.map(m => {
    if (opt.verbose) {
      return m.name + ' ' + m.path
    }
    return m.name
  }).join('\n')
}