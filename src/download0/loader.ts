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

// MÚSICA TOTALMENTE DESHABILITADA
/*
if (typeof startBgmIfEnabled === 'function') {
  startBgmIfEnabled()
}
*/

const is_jailbroken = checkJailbroken()
const themeFolder = (typeof CONFIG !== 'undefined' && typeof CONFIG.theme === 'string') ? CONFIG.theme : 'default'

function is_exploit_complete () {
  fn.register(24, 'getuid', [], 'bigint')
  fn.register(585, 'is_in_sandbox', [], 'bigint')
  try {
    const uid = fn.getuid()
    const sandbox = fn.is_in_sandbox()
    if (!uid.eq(0) || !sandbox.eq(0)) {
      return false
    }
  } catch (e) {
    return false
  }
  return true
}

function write64 (addr: BigInt, val: BigInt | number) {
  mem.view(addr).setBigInt(0, new BigInt(val), true)
}

function read8 (addr: BigInt) {
  return mem.view(addr).getUint8(0)
}

function malloc (size: number) {
  return mem.malloc(size)
}

function get_fwversion () {
  const buf = malloc(0x8)
  const size = malloc(0x8)
  write64(size, 0x8)
  if (sysctlbyname('kern.sdk_version', buf, size, 0, 0)) {
    const byte1 = Number(read8(buf.add(2)))
    const byte2 = Number(read8(buf.add(3)))
    const version = byte2.toString(16) + '.' + byte1.toString(16).padStart(2, '0')
    return version
  }
  return null
}

const FW_VERSION: string | null = get_fwversion()

if (FW_VERSION === null) {
  log('ERROR: Failed to determine FW version')
  throw new Error('Failed to determine FW version')
}

const compare_version = (a: string, b: string) => {
  const a_arr = a.split('.')
  const amaj = Number(a_arr[0])
  const amin = Number(a_arr[1])
  const b_arr = b.split('.')
  const bmaj = Number(b_arr[0])
  const bmin = Number(b_arr[1])
  return amaj === bmaj ? amin - bmin : amaj - bmaj
}

if (!is_jailbroken) {
  const jb_behavior = (typeof CONFIG !== 'undefined' && typeof CONFIG.jb_behavior === 'number') ? CONFIG.jb_behavior : 0
  utils.notify(FW_VERSION + ' Detected!')
  let use_lapse = false

  if (jb_behavior === 1) {
    log('JB Behavior: NetControl (forced)')
    include('netctrl_c0w_twins.js')
  } else if (jb_behavior === 2) {
    log('JB Behavior: Lapse (forced)')
    use_lapse = true
    lapse()
  } else {
    log('JB Behavior: Auto Detect')
    if (compare_version(FW_VERSION, '7.00') >= 0 && compare_version(FW_VERSION, '12.02') <= 0) {
      use_lapse = true
      lapse()
    } else if (compare_version(FW_VERSION, '12.50') >= 0 && compare_version(FW_VERSION, '13.00') <= 0) {
      include('netctrl_c0w_twins.js')
    }
  }

  if (use_lapse) {
    const start_time = Date.now()
    const max_wait_seconds = 5
    const max_wait_ms = max_wait_seconds * 1000

    while (!is_exploit_complete()) {
      const elapsed = Date.now() - start_time
      if (elapsed > max_wait_ms) {
        log('ERROR: Timeout waiting for exploit to complete (' + max_wait_seconds + ' seconds)')
        throw new Error('Lapse failed! restart and try again...')
      }
      const poll_start = Date.now()
      while (Date.now() - poll_start < 500) {}
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
      throw e
    }
  }
} else {
  utils.notify('Already Jailbroken!')
  try { include('themes/' + themeFolder + '/main.js') } catch (e) {}
}

export function run_binloader () {
  log('Initializing binloader...')
  try {
    binloader_init()
    log('Binloader initialized and running!')
  } catch (e) {
    throw e
  }
}