// buns
// packages = ["chalk@^5.0"]
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import chalk from 'chalk';

export async function findIpcInfoPath(): Promise<string> {
  const system = process.platform;
  const home = process.env.HOME || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');

  if (system === 'win32') {
    const appdata = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appdata, 'kando', 'ipc-info.json');
  } else if (system === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'kando', 'ipc-info.json');
  } else {
    // const flatpakPath = path.join(home, '.var', 'app', 'menu.kando.Kando', 'config', 'kando', 'ipc-info.json');
    // if (fs.existsSync(flatpakPath)) {
    //   console.log("home: ", home)
    //   return flatpakPath;
    // }
    return path.join(home, '.config', 'kando', 'ipc-info.json');
  }
}

export async function connect(opt: Partial<CLIOptions> = {}): Promise<WebSocket> {
  const infoPath = await findIpcInfoPath();
  if (!fs.existsSync(infoPath)) {
    console.log(`ipc-info.json not found at ${infoPath}`);
    return;
  }

  const info: IpcInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

  const port = info.port;
  const apiVersion = info.apiVersion;

  const clientApiVersion = 1;
  if (apiVersion !== clientApiVersion) {
    console.log(`API version mismatch: server=${apiVersion}, client=${clientApiVersion}`);
    return;
  }
  const uri = `ws://127.0.0.1:${port}`;

  try {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws: WebSocket = new WebSocket(uri);


      ws.onopen = (_e: WebSocket.Event) => {
        if (opt.verbose || opt.debug) {
          console.log(`Connected to Kando IPC server at ${uri}`);
        }
        //socket.send()
        resolve(ws)
      }
      ws.onconnect = () => {
        if (opt.verbose || opt.debug) {
          console.log(`Connected to Kando IPC server at ${uri}`);
        }
      }
      ws.onerror = (_error) => {
        //console.log(": ", error)
        reject(`${chalk.yellow("Is Kando running?")}\n Could not connect to Kando IPC server at ${uri}. Try to run Kando first (kando-beta).`)
        if (opt.verbose || opt.debug) {
          console.log(e);
        }
      }
      ws.onclose = () => {
        if (opt.verbose || opt.debug) {
          console.log(`Disconnected from Kando IPC server at ${uri}`);
        }
        resolve(ws)
      }
    })
    //return ws
    // ws.send(JSON.stringify({ type: 'show-menu', menu }));
  } catch  {
    throw new Error(`Could not connect to Kando IPC server at ${uri}: Is Kando running?`);
  }
}
