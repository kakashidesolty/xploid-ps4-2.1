import { lang } from 'download0/languages'

(function () {
  include('languages.js')
  
  jsmaf.root.children.length = 0
  
  // Estilos con nombres estándar para que siempre se vean
  new Style({ name: 'white', color: 'white', size: 26, shadowColor: 'black', shadowBlur: 4 })
  new Style({ name: 'gold_ui', color: '#FFD700', size: 28, shadowColor: 'orange', shadowBlur: 8, weight: 'bold' })
  new Style({ name: 'title', color: 'white', size: 36, shadowColor: 'black', shadowBlur: 5 })

  // Fondo con tus coordenadas originales (Las que SI te funcionaban)
  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: 0, y: 0, width: 1920, height: 1080
  })
  jsmaf.root.children.push(background)

  let currentButton = 0
  const buttons: Image[] = []
  const buttonTexts: jsmaf.Text[] = []

  const menuOptions = [
    { label: lang.jailbreak, script: 'loader.js' },
    { label: lang.payloadMenu, script: 'payload_host.js' },
    { label: lang.config, script: 'config_ui.js' },
    { label: lang.exit, script: 'includes/kill_vue.js' }
  ]

  jsmaf.root.children.push(new jsmaf.Text({
    text: 'PS4 11.00 - GOLD EDITION',
    x: 960, y: 150,
    style: 'title',
    align: 'center'
  }))

  function updateHighlight() {
    for (let i = 0; i < buttons.length; i++) {
      if (i === currentButton) {
        buttons[i].opacity = 1.0
        buttons[i].borderColor = '#FFD700' 
        buttons[i].borderWidth = 4
        buttonTexts[i].style = 'gold_ui'
      } else {
        buttons[i].opacity = 0.7
        buttons[i].borderColor = 'transparent'
        buttons[i].borderWidth = 0
        buttonTexts[i].style = 'white'
      }
    }
  }

  const startY = 350
  const spacing = 120
  for (let i = 0; i < menuOptions.length; i++) {
    const btn = new Image({
      url: 'file:///assets/img/button_over_9.png',
      x: 610, y: startY + (i * spacing),
      width: 700, height: 90
    })
    buttons.push(btn)
    jsmaf.root.children.push(btn)

    const txt = new jsmaf.Text({
      text: menuOptions[i].label,
      x: 960, y: startY + (i * spacing) + 30,
      style: 'white',
      align: 'center'
    })
    buttonTexts.push(txt)
    jsmaf.root.children.push(txt)
  }

  updateHighlight()

  const confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length
      updateHighlight()
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length
      updateHighlight()
    } else if (keyCode === confirmKey) {
      const sel = menuOptions[currentButton].script
      if (sel === 'loader.js') include('loader.js')
      else if (sel === 'config_ui.js') include('config_ui.js')
      else include('themes/default/' + sel)
    }
  }
})()