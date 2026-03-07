import { libc_addr } from 'download0/userland'
import { lang, useImageText, textImageBase } from 'download0/languages'
import { fn, mem, BigInt } from 'download0/types'

if (typeof libc_addr === 'undefined') {
  include('userland.js')
}

if (typeof lang === 'undefined') {
  include('languages.js')
}

(function () {
  log(lang.loadingConfig)

  const fs = {
    write: function (filename: string, content: string, callback: (error: Error | null) => void) {
      const xhr = new jsmaf.XMLHttpRequest()
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && callback) {
          callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'))
        }
      }
      xhr.open('POST', 'file://../download0/' + filename, true)
      xhr.send(content)
    },

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

  const currentConfig: any = {
    autolapse: false,
    autopoop: false,
    autoclose: false,
    music: true, // Esto no se toca, para que el sistema no colapse
    jb_behavior: 0,
    theme: 'default'
  }

  let userPayloads: string[] = []
  let configLoaded = false

  const jbBehaviorLabels = [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse]
  const jbBehaviorImgKeys = ['jbBehaviorAuto', 'jbBehaviorNetctrl', 'jbBehaviorLapse']

  function scanThemes (): string[] {
    const themes: string[] = []
    try {
      fn.register(0x05, 'open_sys', ['bigint', 'bigint', 'bigint'], 'bigint')
      fn.register(0x06, 'close_sys', ['bigint'], 'bigint')
      fn.register(0x110, 'getdents', ['bigint', 'bigint', 'bigint'], 'bigint')

      const themesDir = '/download0/themes'
      const path_addr = mem.malloc(256)
      const buf = mem.malloc(4096)

      for (let i = 0; i < themesDir.length; i++) {
        mem.view(path_addr).setUint8(i, themesDir.charCodeAt(i))
      }
      mem.view(path_addr).setUint8(themesDir.length, 0)

      const fd = fn.open_sys(path_addr, new BigInt(0, 0), new BigInt(0, 0))
      if (!fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
        const count = fn.getdents(fd, buf, new BigInt(0, 4096))
        if (!count.eq(new BigInt(0xffffffff, 0xffffffff)) && count.lo > 0) {
          let offset = 0
          while (offset < count.lo) {
            const d_reclen = mem.view(buf.add(new BigInt(0, offset + 4))).getUint16(0, true)
            const d_type = mem.view(buf.add(new BigInt(0, offset + 6))).getUint8(0)
            const d_namlen = mem.view(buf.add(new BigInt(0, offset + 7))).getUint8(0)
            let name = ''
            for (let i = 0; i < d_namlen; i++) {
              name += String.fromCharCode(mem.view(buf.add(new BigInt(0, offset + 8 + i))).getUint8(0))
            }
            if (d_type === 4 && name !== '.' && name !== '..') {
              themes.push(name)
            }
            offset += d_reclen
          }
        }
        fn.close_sys(fd)
      }
    } catch (e) {
      log('Theme scan failed: ' + (e as Error).message)
    }

    const idx = themes.indexOf('default')
    if (idx > 0) {
      themes.splice(idx, 1)
      themes.unshift('default')
    } else if (idx < 0) {
      themes.unshift('default')
    }

    return themes
  }

  const availableThemes = scanThemes()
  const themeLabels: string[] = availableThemes.map((theme: string) => theme.charAt(0).toUpperCase() + theme.slice(1))
  const themeImgKeys: string[] = availableThemes.map((theme: string) => 'theme' + theme.charAt(0).toUpperCase() + theme.slice(1))

  let currentButton = 0
  const buttons: Image[] = []
  const buttonTexts: jsmaf.Text[] = []
  const buttonMarkers: (Image | null)[] = []
  const buttonOrigPos: { x: number; y: number }[] = []
  const textOrigPos: { x: number; y: number }[] = []
  const valueTexts: Image[] = []

  const normalButtonImg = 'file:///assets/img/button_over_9.png'
  const selectedButtonImg = 'file:///assets/img/button_over_9.png'

  jsmaf.root.children.length = 0

  new Style({ name: 'white', color: 'white', size: 24 })
  new Style({ name: 'title', color: 'white', size: 32 })

  const background = new Image({
    url: 'file:///../download0/img/multiview.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  })
  jsmaf.root.children.push(background)

  const logo = new Image({
    url: 'file:///../download0/img/logo.png',
    x: 1620,
    y: 0,
    width: 300,
    height: 169
  })
  jsmaf.root.children.push(logo)

  if (useImageText) {
    const title = new Image({
      url: textImageBase + 'config.png',
      x: 860,
      y: 100,
      width: 200,
      height: 60
    })
    jsmaf.root.children.push(title)
  } else {
    const title = new jsmaf.Text()
    title.text = lang.config
    title.x = 910
    title.y = 120
    title.style = 'title'
    jsmaf.root.children.push(title)
  }

  // --- BOTÓN DE MÚSICA ELIMINADO DE ESTA LISTA ---
  const configOptions = [
    { key: 'autolapse', label: lang.autoLapse, imgKey: 'autoLapse', type: 'toggle' },
    { key: 'autopoop', label: lang.autoPoop, imgKey: 'autoPoop', type: 'toggle' },
    { key: 'autoclose', label: lang.autoClose, imgKey: 'autoClose', type: 'toggle' },
    { key: 'jb_behavior', label: lang.jbBehavior, imgKey: 'jbBehavior', type: 'cycle' },
    { key: 'theme', label: lang.theme || 'Theme', imgKey: 'theme', type: 'cycle' }
  ]

  const centerX = 960
  const startY = 200
  const buttonSpacing = 120
  const buttonWidth = 400
  const buttonHeight = 80

  for (let i = 0; i < configOptions.length; i++) {
    const configOption = configOptions[i]!
    const btnX = centerX - buttonWidth / 2
    const btnY = startY + i * buttonSpacing

    const button = new Image({
      url: normalButtonImg,
      x: btnX,
      y: btnY,
      width: buttonWidth,
      height: buttonHeight
    })
    buttons.push(button)
    jsmaf.root.children.push(button)

    buttonMarkers.push(null)

    let btnText: Image | jsmaf.Text
    if (useImageText) {
      btnText = new Image({
        url: textImageBase + configOption.imgKey + '.png',
        x: btnX + 20,
        y: btnY + 15,
        width: 200,
        height: 50
      })
    } else {
      btnText = new jsmaf.Text()
      btnText.text = configOption.label
      btnText.x = btnX + 30
      btnText.y = btnY + 28
      btnText.style = 'white'
    }
    buttonTexts.push(btnText as jsmaf.Text)
    jsmaf.root.children.push(btnText)

    if (configOption.type === 'toggle') {
      const checkmark = new Image({
        url: currentConfig[configOption.key as keyof typeof currentConfig] ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png',
        x: btnX + 320,
        y: btnY + 20,
        width: 40,
        height: 40
      })
      valueTexts.push(checkmark)
      jsmaf.root.children.push(checkmark)
    } else {
      let valueLabel: Image | jsmaf.Text
      if (configOption.key === 'jb_behavior') {
        if (useImageText) {
          valueLabel = new Image({
            url: textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png',
            x: btnX + 230,
            y: btnY + 15,
            width: 150,
            height: 50
          })
        } else {
          valueLabel = new jsmaf.Text()
          valueLabel.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0]!
          valueLabel.x = btnX + 250
          valueLabel.y = btnY + 28
          valueLabel.style = 'white'
        }
      } else if (configOption.key === 'theme') {
        const themeIndex = availableThemes.indexOf(currentConfig.theme)
        const displayIndex = themeIndex >= 0 ? themeIndex : 0

        if (useImageText) {
          valueLabel = new Image({
            url: textImageBase + themeImgKeys[displayIndex] + '.png',
            x: btnX + 230,
            y: btnY + 15,
            width: 150,
            height: 50
          })
        } else {
          valueLabel = new jsmaf.Text()
          valueLabel.text = themeLabels[displayIndex] || themeLabels[0]!
          valueLabel.x = btnX + 250
          valueLabel.y = btnY + 28
          valueLabel.style = 'white'
        }
      }
      valueTexts.push(valueLabel as Image)
      jsmaf.root.children.push(valueLabel)
    }

    buttonOrigPos.push({ x: btnX, y: btnY })
    textOrigPos.push({ x: btnText.x, y: btnText.y })
  }

  const backHint = new jsmaf.Text()
  backHint.text = jsmaf.circleIsAdvanceButton ? 'X to go back' : 'O to go back'
  backHint.x = centerX - 60
  backHint.y = startY + configOptions.length * buttonSpacing + 120
  backHint.style = 'white'
  jsmaf.root.children.push(backHint)

  let zoomInInterval: number | null = null
  let zoomOutInterval: number | null = null
  let prevButton = -1

  function easeInOut (t: number) { return (1 - Math.cos(t * Math.PI)) / 2 }

  function animateZoomIn (btn: Image, text: jsmaf.Text, btnOrigX: number, btnOrigY: number, textOrigX: number, textOrigY: number) {
    if (zoomInInterval) jsmaf.clearInterval(zoomInInterval)
    const btnW = buttonWidth, btnH = buttonHeight, startScale = btn.scaleX || 1.0, endScale = 1.1, duration = 175
    let elapsed = 0
    zoomInInterval = jsmaf.setInterval(function () {
      elapsed += 16
      const t = Math.min(elapsed / duration, 1)
      const scale = startScale + (endScale - startScale) * easeInOut(t)
      btn.scaleX = scale; btn.scaleY = scale
      btn.x = btnOrigX - (btnW * (scale - 1)) / 2; btn.y = btnOrigY - (btnH * (scale - 1)) / 2
      text.scaleX = scale; text.scaleY = scale
      text.x = textOrigX - (btnW * (scale - 1)) / 2; text.y = textOrigY - (btnH * (scale - 1)) / 2
      if (t >= 1) { jsmaf.clearInterval(zoomInInterval ?? -1); zoomInInterval = null }
    }, 16)
  }

  function animateZoomOut (btn: Image, text: jsmaf.Text, btnOrigX: number, btnOrigY: number, textOrigX: number, textOrigY: number) {
    if (zoomOutInterval) jsmaf.clearInterval(zoomOutInterval)
    const btnW = buttonWidth, btnH = buttonHeight, startScale = btn.scaleX || 1.1, endScale = 1.0, duration = 175
    let elapsed = 0
    zoomOutInterval = jsmaf.setInterval(function () {
      elapsed += 16
      const t = Math.min(elapsed / duration, 1)
      const scale = startScale + (endScale - startScale) * easeInOut(t)
      btn.scaleX = scale; btn.scaleY = scale
      btn.x = btnOrigX - (btnW * (scale - 1)) / 2; btn.y = btnOrigY - (btnH * (scale - 1)) / 2
      text.scaleX = scale; text.scaleY = scale
      text.x = textOrigX - (btnW * (scale - 1)) / 2; text.y = textOrigY - (btnH * (scale - 1)) / 2
      if (t >= 1) { jsmaf.clearInterval(zoomOutInterval ?? -1); zoomOutInterval = null }
    }, 16)
  }

  function updateHighlight () {
    const prevButtonObj = buttons[prevButton]
    const buttonMarker = buttonMarkers[prevButton]
    if (prevButton >= 0 && prevButton !== currentButton && prevButtonObj) {
      prevButtonObj.url = normalButtonImg
      prevButtonObj.alpha = 0.7
      prevButtonObj.borderColor = 'transparent'
      prevButtonObj.borderWidth = 0
      if (buttonMarker) buttonMarker.visible = false
      animateZoomOut(prevButtonObj, buttonTexts[prevButton]!, buttonOrigPos[prevButton]!.x, buttonOrigPos[prevButton]!.y, textOrigPos[prevButton]!.x, textOrigPos[prevButton]!.y)
    }

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const buttonMarker = buttonMarkers[i]
      const buttonText = buttonTexts[i]
      const buttonOrigPos_ = buttonOrigPos[i]
      const textOrigPos_ = textOrigPos[i]
      if (button === undefined || buttonText === undefined || buttonOrigPos_ === undefined || textOrigPos_ === undefined) continue
      
      if (i === currentButton) {
        button.url = selectedButtonImg
        button.alpha = 1.0
        // --- AQUÍ EL CAMBIO A DORADO NATIVO ---
        button.borderColor = 'rgb(255, 215, 0)'
        button.borderWidth = 4
        if (buttonMarker) buttonMarker.visible = true
        animateZoomIn(button, buttonText, buttonOrigPos_.x, buttonOrigPos_.y, textOrigPos_.x, textOrigPos_.y)
      } else if (i !== prevButton) {
        button.url = normalButtonImg
        button.alpha = 0.7
        button.borderColor = 'transparent'
        button.borderWidth = 0
        button.scaleX = 1.0
        button.scaleY = 1.0
        button.x = buttonOrigPos_.x
        button.y = buttonOrigPos_.y
        buttonText.scaleX = 1.0
        buttonText.scaleY = 1.0
        buttonText.x = textOrigPos_.x
        buttonText.y = textOrigPos_.y
        if (buttonMarker) buttonMarker.visible = false
      }
    }

    prevButton = currentButton
  }

  function updateValueText (index: number) {
    const options = configOptions[index]
    const valueText = valueTexts[index]
    if (!options || !valueText) return
    const key = options.key
    if (options.type === 'toggle') {
      const value = currentConfig[key as keyof typeof currentConfig]
      valueText.url = value ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png'
    } else {
      if (key === 'jb_behavior') {
        if (useImageText) {
          (valueText as Image).url = textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png'
        } else {
          (valueText as jsmaf.Text).text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0]!
        }
      } else if (key === 'theme') {
        const themeIndex = availableThemes.indexOf(currentConfig.theme)
        const displayIndex = themeIndex >= 0 ? themeIndex : 0

        if (useImageText) {
          (valueText as Image).url = textImageBase + themeImgKeys[displayIndex] + '.png'
        } else {
          (valueText as jsmaf.Text).text = themeLabels[displayIndex] || themeLabels[0]!
        }
      }
    }
  }

  function saveConfig () {
    if (!configLoaded) return
    const configData = {
      config: currentConfig,
      payloads: userPayloads
    }
    fs.write('config.json', JSON.stringify(configData, null, 2), function () {})
  }

  function loadConfig () {
    fs.read('config.json', function (err: Error | null, data?: string) {
      if (!err && data) {
        try {
          const configData = JSON.parse(data)
          if (configData.config) {
            currentConfig.autolapse = configData.config.autolapse || false
            currentConfig.autopoop = configData.config.autopoop || false
            currentConfig.autoclose = configData.config.autoclose || false
            currentConfig.music = configData.config.music !== false
            currentConfig.jb_behavior = configData.config.jb_behavior || 0
            if (configData.config.theme && availableThemes.includes(configData.config.theme)) {
              currentConfig.theme = configData.config.theme
            }
          }
          if (configData.payloads && Array.isArray(configData.payloads)) {
            userPayloads = configData.payloads.slice()
          }
        } catch (e) {}
      }
      for (let i = 0; i < configOptions.length; i++) updateValueText(i)
      
      if (currentConfig.music) {
        startBgmIfEnabled()
      } else {
        stopBgm()
      }
      configLoaded = true
    })
  }

  function handleButtonPress () {
    if (currentButton < configOptions.length) {
      const option = configOptions[currentButton]!
      const key = option.key

      if (option.type === 'cycle') {
        if (key === 'jb_behavior') {
          currentConfig.jb_behavior = (currentConfig.jb_behavior + 1) % jbBehaviorLabels.length
        } else if (key === 'theme') {
          const themeIndex = availableThemes.indexOf(currentConfig.theme)
          const nextIndex = ((themeIndex >= 0 ? themeIndex : 0) + 1) % availableThemes.length
          currentConfig.theme = availableThemes[nextIndex]!
        }
      } else {
        const boolKey = key as 'autolapse' | 'autopoop' | 'autoclose'
        currentConfig[boolKey] = !currentConfig[boolKey]

        if (key === 'autolapse' && currentConfig.autolapse) {
          currentConfig.autopoop = false
          for (let i = 0; i < configOptions.length; i++) {
            if (configOptions[i]!.key === 'autopoop') { updateValueText(i); break }
          }
        } else if (key === 'autopoop' && currentConfig.autopoop) {
          currentConfig.autolapse = false
          for (let i = 0; i < configOptions.length; i++) {
            if (configOptions[i]!.key === 'autolapse') { updateValueText(i); break }
          }
        }
      }
      updateValueText(currentButton)
      saveConfig()
    }
  }

  const confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14
  const backKey = jsmaf.circleIsAdvanceButton ? 14 : 13

  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length
      updateHighlight()
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length
      updateHighlight()
    } else if (keyCode === confirmKey) {
      handleButtonPress()
    } else if (keyCode === backKey) {
      saveConfig()
      jsmaf.setTimeout(function () { debugging.restart() }, 100)
    }
  }

  updateHighlight()
  loadConfig()
})()