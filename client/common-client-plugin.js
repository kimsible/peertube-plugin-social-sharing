import servicesJSON from '../assets/services.json'

import { render, html } from 'uhtml'
const icons = import.meta.globEager('../assets/icons/*.svg')

export { register }

let translate, services, showModal

async function register ({ registerHook, peertubeHelpers }) {
  // Expose required PeerTube Helpers
  translate = peertubeHelpers.translate
  showModal = peertubeHelpers.showModal

  // Load settings
  const settings = await peertubeHelpers.getSettings()

  // Filter services
  services = servicesJSON.filter(service => {
    const name = service.label.toLowerCase()

    if (!(name in settings && settings[name])) return false

    service.name = name
    return service
  })

  // Pre-load icons
  for (const service of services) {
    service.icon = await new Promise(resolve => {
      const image = new Image()
      image.onload = () => { resolve(image) }
      image.src = icons[`../assets/icons/${service.name}.svg`].default
    })
  }

  let observer
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      if (observer) {
        observer.disconnect()
      }

      if (/^\/(videos\/watch|w)\/.+/.test(path)) {
        observer = addModalOpenObserver(node => {
          onModalOpen(node, node.querySelector('.video'))

          if (/^\/(videos\/watch\/playlist|w\/p)\/.+/.test(path)) {
            onModalOpen(node, node.querySelector('.playlist'))
          }
        })
      }

      if (/^\/my-(account|library)\/video-playlists/.test(path)) {
        observer = addModalOpenObserver(node => {
          onModalOpen(node, node.querySelector('.playlist'))
        })
      }
    }
  })
}

async function buildButton ({
  name,
  label,
  sharerLink,
  icon,
  customDomain,
  sourceTitle,
  inputFilterElements,
  inputLinkElement
}) {
  // Button title, className, htmlContent
  const prefix = await translate('Share on')
  const title = `${prefix} ${label}`
  const className = `video-sharing ${name}`
  const htmlContent = html`${icon.cloneNode()}${label}`

  // Button link builder
  const buildLink = (sourceLink) => sharerLink
    .replace('%body', encodeURIComponent(sourceTitle))
    .replace('%link', encodeURIComponent(sourceLink))

  let link = buildLink(inputLinkElement.value)

  // Handle onclick action
  let onclick
  if (!customDomain) onclick = () => window.open(link) // Centralized service
  else onclick = () => buildModal({ title, icon: icon.cloneNode(), link }) // Decentralized service

  // Re-build buttonLink for each alteration of the source link to share with a filter
  inputFilterElements.forEach(inputFilter => {
    inputFilter.addEventListener('change', () => { link = buildLink(inputLinkElement.value) })
  })

  return html`<a onclick="${onclick}" title="${title}" class="${className}" target="_blank" tabIndex=0>${htmlContent}</a>`
}

async function buildModal ({ title, icon, link }) {
  let domain

  const observer = addModalOpenObserver(async modal => {
    // Customize modal
    modal.classList.add('custom-domain')
    modal.querySelector('.modal-dialog').classList.remove('modal-lg')

    // Modal confirm button
    const confirm = modal.querySelector('.modal-footer input:last-child')

    // Domain checker
    const isDomain = value => /^https?:\/\/[a-z\d]+\.[a-z]{2,}(\.[a-z]{2,})?\/?$/.test(value)

    // Disable or enable modal share confirm
    const setConfirmUsage = status => {
      if (status) confirm.removeAttribute('disabled')
      else confirm.disabled = true
    }

    // Check domain on keyup (writing and paste)
    const onkeyup = ({ target }) => {
      if (!isDomain(target.value)) setConfirmUsage(false) // disable confirm button
      else (domain = target.value.replace(/\/$/, '')) && setConfirmUsage(true) // trim any last slash and enable confirm button
    }
    // Input custom domain
    const input = html`<input type="text" placeholder="https://domain.org" class="form-control" onkeyup="${onkeyup}" />`

    // Instructions container
    const text = await translate('Enter the instance’s address')
    const paragraph = html`<p>${text}</p>`

    // Disable confirm button on show
    confirm.disabled = true

    // Inject all elements to modal body
    render(modal.querySelector('.modal-body'), html`${icon}${paragraph}${input}`)
  })

  showModal({
    title,
    cancel: {
      value: await translate('Cancel'),
      action: () => { observer.disconnect() }
    },
    confirm: {
      value: await translate('Share'),
      action: () => {
        window.open(`${domain}/${link}`)
        observer.disconnect()
      }
    }
  })
}

async function displayButtons (tabContent) {
  // Get input link element
  const inputLinkElement = tabContent.querySelector('my-input-toggle-hidden input, my-input-readonly-copy input') // my-input-readonly-copy is for backward compatibility

  // Source title to share
  let sourceTitle
  try {
    const content = document.getElementById('content')
    const titleElement = (
      content.querySelector('h1.video-info-name') || // watch video view
      content.querySelector('my-video-watch-playlist .playlist-info .playlist-display-name') || // watch playlist view
      content.querySelector('.playlist-info .miniature a') // my-library playlist view
    )

    if (titleElement.querySelector('.badge') !== null) titleElement.querySelector('.badge').remove() // remove privacy badge

    sourceTitle = titleElement.innerText
  } catch {
    sourceTitle = '' // in case html structure changed return empty string
  }

  // Input filter elements (checkbox and timestamp fields)
  const filtersContainer = tabContent.nextElementSibling
  const inputFilterElements = filtersContainer.querySelectorAll('my-peertube-checkbox input, my-timestamp-input input')

  // Insert buttons to container
  const buttons = []
  for (const service of services) {
    const button = await buildButton({
      ...service,
      sourceTitle,
      inputFilterElements,
      inputLinkElement
    })

    buttons.push(button)
  }

  // Buttons container
  const container = html.node`<div class="video-sharing-container">${buttons}</div>`

  // Insert buttons container
  inputLinkElement.parentElement.insertBefore(container, inputLinkElement)
}

function onModalOpen (node, container) {
  // avoid weird effect of DOM inserting on first modal show
  node.style.opacity = 0
  setTimeout(() => { node.style.opacity = 1 }, 50)

  if (container) {
    const tab = container.querySelector('.nav-tabs').firstChild // first tab
    addTabSelectObserver(tab, onTabSelect)
  }
}

function onTabSelect (node) {
  const tabContent = node.parentElement.nextElementSibling
  displayButtons(tabContent)
}

function addModalOpenObserver (callback) {
  const observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      addedNodes.forEach(node => {
        if (node.localName === 'ngb-modal-window') {
          callback(node)
        }
      })
    }
  })

  observer.observe(document.body, {
    childList: true
  })

  return observer
}

function addTabSelectObserver (target, callback) {
  const onMutation = () => {
    target.getAttribute('aria-selected') === 'true' && callback(target)
  }

  const observer = new MutationObserver(onMutation)

  onMutation() // if target is already selected

  observer.observe(target, {
    attributes: true,
    attributeFilter: ['aria-selected']
  })

  return observer
}
