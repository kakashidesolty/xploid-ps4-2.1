import { libc_addr } from 'download0/userland'
import { lang, useImageText, textImageBase } from 'download0/languages'
import { fn, mem, BigInt } from 'download0/types'

if (typeof libc_addr === 'undefined') { include('userland.js') }
if (typeof lang === 'undefined') { include('languages.js') }

(function () {
  const fs = {
    write: function (filename: string, content: string, callback: (error: Error | null) => void) {
      const xhr = new jsmaf.XMLHttpRequest()
      xhr.onreadystatechange = function () { if (xhr.readyState === 4 && callback) { callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed')) } }
      xhr.open('POST', 'file://../download0/' + filename, true)
      xhr.send(content)
    },
    read: function (filename: string, callback: (error: Error | null, data?: string) => void) {
      const xhr = new jsmaf.XMLHttpRequest()
      xhr.onreadystatechange = function () { if (xhr.readyState === 4 && callback) { callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'), xhr.responseText) } }
      xhr.open('GET', 'file://../download0/' + filename, true)
      xhr.send()
    }
  }

  const currentConfig: any = {
    autolapse: false, autopoop: false, autoclose: false, autoclose_delay: 0,
    music: false, jb_behavior: 0, theme: 'default'
  }

  let userPayloads: string[] = []
  let configLoaded = false

  const jbBehaviorLabels = [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse]
  const jbBehaviorImgKeys = ['jbBehaviorAuto', 'jbBehaviorNetctrl', 'jbBehaviorLapse']

  function scanThemes (): string[] { return ['default'] } // Simplificado para estabilidad

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
  new Style({ name: 'gold_ui', color: '#FFD700', size: 26, weight: 'bold', shadowColor: 'rgba(0,0,0,0.8)', shadowBlur: 4 })
  new Style({ name: 'title', color: 'white', size: 32 })

  // FONDO SECUNDARIO - ¡Aquí puedes cambiar el nombre de la imagen si quieres otra distinta!
  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: 0, y: 0, width: 1920, height: 1080
  })
  jsmaf.root.children.push(background)

  const logo = new Image({ url: 'file:///../download0/img/logo.png', x: 1620, y: 0, width: 300, height: 169 })
  jsmaf.root.children.push(logo)

  const title = new jsmaf.Text()
  title.text = lang.config
  title.x = 910
  title.y = 120
  title.style = 'title'
  jsmaf.root.children.push(title)

  // AQUÍ ELIMINÉ LA MÚSICA DE LA LISTA
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
  
  // ¡MANTENER EN 400 PARA QUE NO SE DEFORMEN!
  const buttonWidth = 400 
  const buttonHeight = 80

  for (let i = 0; i < configOptions.length; i++) {
    const configOption = configOptions[i]!
    const btnX = centerX - buttonWidth / 2
    const btnY = startY + i * buttonSpacing

    const button = new Image({
      url: normalButtonImg, x: btnX, y: btnY, width: buttonWidth, height: buttonHeight
    })
    buttons.push(button)
    jsmaf.root.children.push(button)
    buttonMarkers.push(null)

    let btnText = new jsmaf.Text()
    btnText.text = configOption.label
    btnText.x = btnX + 30
    btnText.y = btnY + 28
    btnText.style = 'white'
    
    buttonTexts.push(btnText)
    jsmaf.root.children.push(btnText)

    if (configOption.type === 'toggle') {
      const checkmark = new Image({
        url: currentConfig[configOption.key] ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png',
        x: btnX + 320, y: btnY + 20, width: 40, height: 40
      })
      valueTexts.push(checkmark)
      jsmaf.root.children.push(checkmark)
    } else {
      let valueLabel = new jsmaf.Text()
      if (configOption.key === 'jb_behavior') {
        valueLabel.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0]!
      } else if (configOption.key === 'theme') {
        valueLabel.text = themeLabels[0]!
      }
      valueLabel.x = btnX + 250
      valueLabel.y = btnY + 28
      valueLabel.style = 'white'
      valueTexts.push(valueLabel)
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
    if (prevButton >= 0 && prevButton !== currentButton && prevButtonObj) {
      prevButtonObj.url = normalButtonImg
      prevButtonObj.alpha = 0.7
      prevButtonObj.borderColor = 'transparent'
      prevButtonObj.borderWidth = 0
      buttonTexts[prevButton]!.style = 'white'
      if(valueTexts[prevButton] instanceof jsmaf.Text) (valueTexts[prevButton] as jsmaf.Text).style = 'white'
      animateZoomOut(prevButtonObj, buttonTexts[prevButton]!, buttonOrigPos[prevButton]!.x, buttonOrigPos[prevButton]!.y, textOrigPos[prevButton]!.x, textOrigPos[prevButton]!.y)
    }

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i], buttonText = buttonTexts[i], buttonOrigPos_ = buttonOrigPos[i], textOrigPos_ = textOrigPos[i]
      if (button === undefined || buttonText === undefined || buttonOrigPos_ === undefined || textOrigPos_ === undefined) continue
      
      if (i === currentButton) {
        button.url = selectedButtonImg
        button.alpha = 1.0
        // ESTILO DORADO
        button.borderColor = '#FFD700'
        button.borderWidth = 4
        buttonText.style = 'gold_ui'
        if(valueTexts[i] instanceof jsmaf.Text) (valueTexts[i] as jsmaf.Text).style = 'gold_ui'
        animateZoomIn(button, buttonText, buttonOrigPos_.x, buttonOrigPos_.y, textOrigPos_.x, textOrigPos_.y)
      } else if (i !== prevButton) {
        button.url = normalButtonImg
        button.alpha = 0.7
        button.borderColor = 'transparent'
        button.borderWidth = 0
        button.scaleX = 1.0; button.scaleY = 1.0
        button.x = buttonOrigPos_.x; button.y = buttonOrigPos_.y
        buttonText.scaleX = 1.0; buttonText.scaleY = 1.0
        buttonText.x = textOrigPos_.x; buttonText.y = textOrigPos_.y
        buttonText.style = 'white'
        if(valueTexts[i] instanceof jsmaf.Text) (valueTexts[i] as jsmaf.Text).style = 'white'
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
      const value = currentConfig[key]
      valueText.url = value ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png'
    } else {
      if (key === 'jb_behavior') {
        (valueText as jsmaf.Text).text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0]
      }
    }
  }

  function saveConfig () {
    if (!configLoaded) return
    const configData = {
      config: {
        autolapse: currentConfig.autolapse, autopoop: currentConfig.autopoop,
        autoclose: currentConfig.autoclose, autoclose_delay: currentConfig.autoclose_delay,
        music: false, jb_behavior: currentConfig.jb_behavior, theme: currentConfig.theme
      }, payloads: userPayloads
    }
    fs.write('config.json', JSON.stringify(configData, null, 2), function () {})
  }

  function loadConfig () {
    fs.read('config.json', function (err: Error | null, data?: string) {
      if (!err && data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.config) {
            currentConfig.autolapse = parsed.config.autolapse || false
            currentConfig.autopoop = parsed.config.autopoop || false
            currentConfig.autoclose = parsed.config.autoclose || false
            currentConfig.jb_behavior = parsed.config.jb_behavior || 0
          }
        } catch (e) {}
      }
      for (let i = 0; i < configOptions.length; i++) updateValueText(i)
      configLoaded = true
    })
  }

  const confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14
  const backKey = jsmaf.circleIsAdvanceButton ? 14 : 13

  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) { currentButton = (currentButton + 1) % buttons.length; updateHighlight() }
    else if (keyCode === 4 || keyCode === 7) { currentButton = (currentButton - 1 + buttons.length) % buttons.length; updateHighlight() }
    else if (keyCode === confirmKey) {
      const option = configOptions[currentButton]!
      if (option.type === 'cycle') {
        if (option.key === 'jb_behavior') currentConfig.jb_behavior = (currentConfig.jb_behavior + 1) % jbBehaviorLabels.length
      } else {
        currentConfig[option.key] = !currentConfig[option.key]
        if (option.key === 'autolapse' && currentConfig.autolapse) currentConfig.autopoop = false
        if (option.key === 'autopoop' && currentConfig.autopoop) currentConfig.autolapse = false
      }
      for (let i = 0; i < configOptions.length; i++) updateValueText(i)
      saveConfig()
    } else if (keyCode === backKey) {
      saveConfig()
      jsmaf.setTimeout(function () { debugging.restart() }, 100)
    }
  }

  updateHighlight()
  loadConfig()
})()