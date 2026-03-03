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

  const configOptions = [
    { key: 'autolapse', label: lang.autoLapse, type: 'bool' },
    { key: 'autopoop', label: lang.autoPoop, type: 'bool' },
    { key: 'autoclose', label: lang.autoClose, type: 'bool' },
    { key: 'jb_behavior', label: lang.jbBehavior, type: 'list', options: [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse] },
    { key: 'theme', label: lang.theme, type: 'string' },
    { key: 'back', label: lang.back, type: 'action' }
  ]

  let currentConfig: any = {
    autolapse: false,
    autopoop: false,
    autoclose: false,
    music: false,
    jb_behavior: 0,
    theme: 'default'
  }

  let currentButton = 0
  const buttons: Image[] = []
  const labelTexts: jsmaf.Text[] = []
  const valueTexts: jsmaf.Text[] = []

  // --- SOLUCIÓN DE LETRAS Y PANTALLA ---
  jsmaf.root.children.length = 0
  jsmaf.root.width = 1920
  jsmaf.root.height = 1080

  // Definir estilos con nombres estándar para que la PS4 no se confunda
  new Style({ name: 'white', color: 'white', size: 26, shadowColor: 'black', shadowBlur: 4 })
  new Style({ name: 'gold_ui', color: '#FFD700', size: 28, shadowColor: 'orange', shadowBlur: 8, weight: 'bold' })
  new Style({ name: 'title', color: 'white', size: 36, shadowColor: 'black', shadowBlur: 5 })

  // Fondo con ajuste de pantalla completa (Zoom 1.01)
  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: -10, y: -10, width: 1940, height: 1100, // Ligeramente más grande
    scaleX: 1.01, scaleY: 1.01
  })
  jsmaf.root.children.push(background)

  const title = new jsmaf.Text({
    text: lang.config,
    x: 960, y: 150,
    style: 'title',
    align: 'center'
  })
  jsmaf.root.children.push(title)

  function updateValueText (index: number) {
    const opt = configOptions[index]!
    if (opt.type === 'action') return
    let valStr = ''
    if (opt.type === 'bool') valStr = currentConfig[opt.key] ? 'ON' : 'OFF'
    else if (opt.type === 'list') valStr = opt.options[currentConfig[opt.key]]
    else if (opt.type === 'string') valStr = currentConfig[opt.key]
    valueTexts[index]!.text = valStr
  }

  function updateHighlight () {
    for (let i = 0; i < buttons.length; i++) {
      if (i === currentButton) {
        buttons[i].opacity = 1.0
        buttons[i].scaleX = 1.03
        buttons[i].scaleY = 1.03
        buttons[i].borderColor = '#FFD700' 
        buttons[i].borderWidth = 4
        labelTexts[i].style = 'gold_ui'
        if (valueTexts[i]) valueTexts[i].style = 'gold_ui'
      } else {
        buttons[i].opacity = 0.7
        buttons[i].scaleX = 1.0
        buttons[i].scaleY = 1.0
        buttons[i].borderColor = 'transparent'
        buttons[i].borderWidth = 0
        labelTexts[i].style = 'white'
        if (valueTexts[i]) valueTexts[i].style = 'white'
      }
    }
  }

  function saveConfig () {
    fs.write('config.json', JSON.stringify({ config: currentConfig, payloads: [] }, null, 4), function (err) {
      if (err) log('Error saving config')
    })
  }

  function createUI () {
    const startY = 300
    const spacing = 110 
    for (let i = 0; i < configOptions.length; i++) {
      const opt = configOptions[i]!
      const btn = new Image({
        url: 'file:///assets/img/button_over_9.png',
        x: 460, y: startY + (i * spacing),
        width: 1000, height: 85
      })
      buttons.push(btn)
      jsmaf.root.children.push(btn)

      const label = new jsmaf.Text({
        text: opt.label,
        x: 500, y: startY + (i * spacing) + 28,
        style: 'white'
      })
      labelTexts.push(label)
      jsmaf.root.children.push(label)

      if (opt.type !== 'action') {
        const val = new jsmaf.Text({
          text: '',
          x: 1420, y: startY + (i * spacing) + 28,
          style: 'white',
          align: 'right'
        })
        valueTexts.push(val)
        jsmaf.root.children.push(val)
        updateValueText(i)
      } else {
        valueTexts[index] = null as any
      }
    }
    updateHighlight()
  }

  fs.read('config.json', function (err, data) {
    if (!err && data) {
      try {
        const parsed = JSON.parse(data)
        if (parsed.config) currentConfig = parsed.config
      } catch (e) {}
    }
    createUI()
  })

  const confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length
      updateHighlight()
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length
      updateHighlight()
    } else if (keyCode === confirmKey) {
      const opt = configOptions[currentButton]!
      if (opt.key === 'back') {
        include('themes/' + (currentConfig.theme || 'default') + '/main.js')
      } else if (opt.type === 'bool') {
        currentConfig[opt.key] = !currentConfig[opt.key]
        if (opt.key === 'autolapse' && currentConfig.autolapse) currentConfig.autopoop = false
        else if (opt.key === 'autopoop' && currentConfig.autopoop) currentConfig.autolapse = false
        for(let j=0; j<configOptions.length; j++) updateValueText(j)
        saveConfig()
      } else if (opt.type === 'list') {
        currentConfig[opt.key] = (currentConfig[opt.key] + 1) % opt.options.length
        updateValueText(currentButton)
        saveConfig()
      }
    }
  }
})()