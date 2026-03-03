import { libc_addr } from 'download0/userland'
import { fn, mem, BigInt, utils } from 'download0/types'
import { sysctlbyname } from 'download0/kernel'
import { lapse } from 'download0/lapse'
import { binloader_init } from 'download0/binloader'
import { checkJailbroken } from 'download0/check-jailbroken'

if (jsmaf.loader_has_run) {
  throw new Error('loader already ran')
}
jsmaf.loader_has_run = true

// Now load userland and lapse
// Check if libc_addr is defined
if (typeof libc_addr === 'undefined') {
  include('userland.js')
}
include('binloader.js')
include('lapse.js')
include('kernel.js')
include('check-jailbroken.js')
log('All scripts loaded')

export function show_success (immediate?: boolean) {
  if (immediate) {
    jsmaf.root.children.push(bg_success)
    log('Showing Success Image...')
  } else {
    setTimeout(() => {
      jsmaf.root.children.push(bg_success)
      log('Showing Success Image...')
    }, 2000)
  }
}

// MODIFICACIÓN: Se ha comentado la ejecución de la música de fondo
// para que no suene al cargar el exploit o el menú.
/*
if (typeof startBgmIfEnabled === 'function') {
  startBgmIfEnabled()
}
*/

const is_jailbroken = checkJailbroken()

const bg_success = new Image({
  url: 'file:///../download0/img/bg_success.png',
  x: 0,
  y: 0,
  width: 1920,
  height: 1080
})

let themeFolder = 'default'
let use_lapse = true

const fs = {
  read: function (filename: string, callback: (error: Error | null, data?: string) => void) {
    const xhr = new jsmaf.XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && callback) {
        callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'), xhr.responseText)
      }
    }
    xhr.open('GET', 'file://../download0/' + filename, true)
    xhr.send()
  }
}

fs.read('config.json', (err, data) => {
  if (!err && data) {
    try {
      const config = JSON.parse(data).config
      if (config.theme) themeFolder = config.theme
      if (config.jb_behavior === 1) use_lapse = false
    } catch (e) { }
  }

  if (!is_jailbroken) {
    if (use_lapse) {
      log('Starting Lapse exploit...')
      lapse()
    } else {
      log('Starting NetControl exploit...')
      include('netctrl_c0w_twins.js')
    }

    const start_time = Date.now()
    const max_wait_seconds = 60
    const max_wait_ms = max_wait_seconds * 1000

    while (!checkJailbroken()) {
      if (Date.now() - start_time > max_wait_ms) {
        log('ERROR: Timeout waiting for exploit to complete (' + max_wait_seconds + ' seconds)')
        throw new Error('Lapse failed! restart and try again...')
      }

      // Poll every 500ms
      const poll_start = Date.now()
      while (Date.now() - poll_start < 500) {
        // Busy wait
      }
    }
    const total_wait = ((Date.now() - start_time) / 1000).toFixed(1)
    log('Exploit completed successfully after ' + total_wait + ' seconds')
  }

  if (use_lapse) {
    log('Initializing binloader...')
    try {
      binloader_init()
      log('Binloader initialized and running!')
    } catch (e) {
      log('ERROR: Failed to initialize binloader')
      throw e
    }
  }
})

export function run_binloader () {
  log('Initializing binloader...')
  binloader_init()
}
