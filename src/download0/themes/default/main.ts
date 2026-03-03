import { lang, useImageText, textImageBase } from 'download0/languages'
import { libc_addr } from 'download0/userland'
import { fn, BigInt } from 'download0/types'

(function () {
  include('languages.js')
  log(lang.loadingMainMenu)

  let currentButton = 0
  const buttons: Image[] = []
  const buttonTexts: jsmaf.Text[] = []
  
  // Limpieza y configuración de lienzo
  jsmaf.root.children.length = 0
  jsmaf.root.width = 1920
  jsmaf.root.height = 1080

  // Estilos unificados con config_ui.ts
  new Style({ name: 'white', color: 'white', size: 26, shadowColor: 'black', shadowBlur: 4 })
  new Style({ name: 'gold_ui', color: '#FFD700', size: 28, shadowColor: 'orange', shadowBlur: 8, weight: 'bold' })
  new Style({ name: 'title', color: 'white', size: 36, shadowColor: 'black', shadowBlur: 5 })

  // Fondo a pantalla completa (Zoom 1.01 para eliminar bordes negros)
  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: -10, y: -10, width: 1940, height: 1100,
    scaleX: 1.01, scaleY: 1.01
  })
  jsmaf.root.children.push(background)

  const menuOptions = [
    { label: lang.jailbreak, script: 'loader.js' },
    { label: lang.payloadMenu, script: 'payload_host.js' },
    { label: lang.config, script: 'config_ui.js' },
    { label: lang.exit, script: 'includes/kill_vue.js' }
  ]

  const title = new jsmaf.Text({
    text: 'PS4 11.00 - GOLD EDITION',
    x: 960, y: 150,
    style: 'title',
    align: 'center'
  })
  jsmaf.root.children.push(title)

  function updateHighlight () {
    for (let i = 0; i < buttons.length; i++) {
      if (i === currentButton) {
        buttons[i].opacity = 1.0
        buttons[i].scaleX = 1.03
        buttons[i].scaleY = 1.03
        buttons[i].borderColor = '#FFD700' // Borde dorado
        buttons[i].borderWidth = 4
        buttonTexts[i].style = 'gold_ui'
      } else {
        buttons[i].opacity = 0.7
        buttons[i].scaleX = 1.0
        buttons[i].scaleY = 1.0
        buttons[i].borderColor = 'transparent'
        buttons[i].borderWidth = 0
        buttonTexts[i].style = 'white'
      }
    }
  }

  function createMenu () {
    const startY = 350
    const spacing = 120

    for (let i = 0; i < menuOptions.length; i++) {
      const opt = menuOptions[i]!
      
      const btn = new Image({
        url: 'file:///assets/img/button_over_9.png',
        x: 610, y: startY + (i * spacing),
        width: 700, height: 90
      })
      buttons.push(btn)
      jsmaf.root.children.push(btn)

      const txt = new jsmaf.Text({
        text: opt.label,
        x: 960, y: startY + (i * spacing) + 30,
        style: 'white',
        align: 'center'
      })
      buttonTexts.push(txt)
      jsmaf.root.children.push(txt)
    }
    updateHighlight()
  }

  createMenu()

  const confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14

  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) { // Abajo
      currentButton = (currentButton + 1) % buttons.length
      updateHighlight()
    } else if (keyCode === 4 || keyCode === 7) { // Arriba
      currentButton = (currentButton - 1 + buttons.length) % buttons.length
      updateHighlight()
    } else if (keyCode === confirmKey) {
      const selected = menuOptions[currentButton]!
      if (selected.script === 'loader.js') {
        jsmaf.onKeyDown = null // Desactivar teclas durante el exploit
      }
      
      try {
        if (selected.script === 'loader.js') {
           include('loader.js')
        } else if (selected.script === 'config_ui.js') {
           include('config_ui.js')
        } else {
           // Cargar desde carpeta de temas
           include('themes/default/' + selected.script)
        }
      } catch (e) {
        log('Error: ' + (e as Error).message)
      }
    }
  }

  log(lang.mainMenuLoaded)
})()