import { lang } from 'download0/languages'
import { libc_addr } from 'download0/userland'

(function () {
  jsmaf.root.children.length = 0

  // Estilos idénticos al Main para evitar parpadeos o errores de carga
  new Style({ name: 'white', color: 'white', size: 26, shadowColor: 'black', shadowBlur: 4 })
  new Style({ name: 'gold_ui', color: '#FFD700', size: 28, shadowColor: 'orange', shadowBlur: 8, weight: 'bold' })
  new Style({ name: 'title', color: 'white', size: 36, shadowColor: 'black', shadowBlur: 5 })

  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: 0, y: 0, width: 1920, height: 1080
  })
  jsmaf.root.children.push(background)

  // Título
  jsmaf.root.children.push(new jsmaf.Text({
    text: lang.config,
    x: 960, y: 150,
    style: 'title',
    align: 'center'
  }))

  const configOptions = [
    { key: 'autolapse', label: lang.autoLapse, type: 'bool' },
    { key: 'autopoop', label: lang.autoPoop, type: 'bool' },
    { key: 'autoclose', label: lang.autoClose, type: 'bool' },
    { key: 'jb_behavior', label: lang.jbBehavior, type: 'list', options: [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse] },
    { key: 'back', label: lang.back, type: 'action' }
  ]

  let currentButton = 0
  const buttons: Image[] = []
  const labelTexts: jsmaf.Text[] = []
  const valueTexts: any[] = []

  function updateHighlight() {
    for (let i = 0; i < buttons.length; i++) {
      if (i === currentButton) {
        buttons[i].opacity = 1.0
        buttons[i].borderColor = '#FFD700'
        buttons[i].borderWidth = 4
        labelTexts[i].style = 'gold_ui'
        if (valueTexts[i]) valueTexts[i].style = 'gold_ui'
      } else {
        buttons[i].opacity = 0.7
        buttons[i].borderColor = 'transparent'
        buttons[i].borderWidth = 0
        labelTexts[i].style = 'white'
        if (valueTexts[i]) valueTexts[i].style = 'white'
      }
    }
  }

  // Dibujar UI de configuración
  const startY = 300
  const spacing = 110
  for (let i = 0; i < configOptions.length; i++) {
    const opt = configOptions[i]
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
        text: '...',
        x: 1420, y: startY + (i * spacing) + 28,
        style: 'white',
        align: 'right'
      })
      valueTexts.push(val)
      jsmaf.root.children.push(val)
    } else {
      valueTexts.push(null)
    }
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
      if (configOptions[currentButton].key === 'back') {
        include('themes/default/main.js')
      }
    }
  }
})()