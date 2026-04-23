import * as path from 'path';

import * as utils from './utils';
import * as menu from './menu';
import { connect } from './socket';
export {
  menu, utils
}


export type KandomenuOptions = {
  showmenu?: boolean
}
/**
 * Define a menu from a configuration object.
 *
 * @param {any} [config] - The configuration object.
 * @param {KandomenuOptions} [options] - Options for the menu.
 * @param {boolean} [options.showmenu] - If true, the menu will be shown immediately after defining.
 */
export async function defineMenu(config?: any, options?: KandomenuOptions): Promise<void> {
  const menuFile = process.argv[1]
  console.log(": ", menuFile)
  if (!menuFile) {
    throw new Error("No menu file specified")
  }
  const menuName = path.basename(menuFile).replace(/\.[ts|json]/, '')

  if (options?.showmenu) {
    const socket = await connect();

    socket.send(JSON.stringify({ type: 'show-menu', menu: config }));
    socket.onmessage = (message) => {
      const msg: any = JSON.parse(message.data.toString());
      // console.log(": ", msg)
      
      if (msg.type === 'cancel-menu') {
        socket.close()
        // process.exit(0)

      }
    }

    socket.onerror = (error) => {
      console.log("error: ", error)
    }
  }
  // return await menu.open(menuFile).then(() => {
  //   console.log(": ", menuName)
  // }).catch(err => {
  //   console.log("err: ", err)
  // })
}
  //return menu.defineMenu(options);






export type * from './types'
