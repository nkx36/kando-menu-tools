

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

import chalk from "chalk";
import { type CLIOptions } from './types';


export function getUsageOptions(defaults?: Partial<CLIOptions>): CLIOptions {
  const opt: CLIOptions = { ...defaults }
  Object.keys(process.env).filter((key: string) => key.startsWith('usage_')).forEach((key, _value) => {

    (opt as any)[key.replace('usage_', '')] = process.env[key]
  })
  return opt
}


export function showError(title: string = 'command error', error: Error, opt?: any): void {
  let str = chalk.red(centerText(title))
  if (opt?.verbose) {
    str = "\n" + error
  } else {
    str += "\n " + (error.message || error)
    if (error.stack) {
      str += "\n" + chalk.gray(`${error.stack.split('\n')[1]}`)
      chalk.gray(`${error.stack.split('\n')[1]}`)
    }
  }
  console.log(str, "\n", "\r" + chalk.red(centerText('-')))
}

type LogOptions = {
  verbose?: boolean
  title?: string
}
export function log(title: string | LogOptions, message: any, ...args: any): void {
  if (typeof title === 'object') {
    const opt = title
    title = opt.title || 'log'
  }
  let str = chalk.yellow(centerText(title))
  if (typeof message === 'object') {
    str += "\n" + chalk.gray(JSON.stringify(message, null, 2))
  } else {
    str += "\n " + message
  }
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'object') {
      str += " " + chalk.gray(JSON.stringify(args[i], null, 2))
      continue
    }
    str += "\n " + chalk.gray(args[i])
  }
  console.log(str, "\n", "\r" + chalk.yellow(centerText('-')))
}


export function centerText(str: string, char: string = '-', len: number = 80): string {
  const centerStr = str.padStart(Math.floor((len - str.length) / 2) + str.length, char).padEnd(len, char);
  return centerStr;
}
export async function shellcmd(cmd: string, opt: CLIOptions = {}): Promise<any> {
  return await new Promise((resolve, reject) => {
    if (opt.verbose || opt.debug) { console.log(`Running command: ${cmd}`) }

    exec(`${cmd}`, (error, stdout, stderr) => {

      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(stderr);
        return;
      }
      try {
        resolve(stdout);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function readDir(dir: string): fs.Dirent[] {
  return fs.readdirSync(dir, { withFileTypes: true })
}

/**
 * Update .env file with environment variables that start with given filter.
 * 
 * @param {string} [filter="KANDO_"] - filter to apply to environment variables
 * @param {string} [dir=process.cwd()] - directory where .env file is located
 */
export function updateEnvFile(filter: string = "KANDO_", dir: string = process.cwd()): void {
  //
  const envFile = path.join(dir, '.env');
  let strenv = ''
  try {
    const env = fs.readFileSync(envFile, 'utf8');
    strenv = env;
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      console.error(e);
      process.exit(1);
    }
  }
  Object.keys(process.env).filter(key => key.startsWith(filter)).forEach((key, _value) => {
    strenv += `${key}="${process.env[key]}"\n`
  })
  if (strenv.length > 0) {
    strenv += '\n'
    fs.writeFileSync(envFile, strenv, { encoding: 'utf8', flag: 'w' });
  }
}