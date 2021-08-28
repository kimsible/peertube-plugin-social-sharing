import servicesJSON from '../assets/services.json'

export { register }

let translate, services

async function register ({ registerHook, peertubeHelpers }) {
  // Expose required PeerTube Helpers
  translate = peertubeHelpers.translate

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
    service.sourceIcon = await import(/* webpackChunkName: "[request]" */ `../assets/icons/${service.name}.svg`).then(module => module.default)
  }

  let onModalOpenObserver
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      if (onModalOpenObserver) {
        onModalOpenObserver.disconnect()
      }

      if (/^\/(videos\/watch|w)\/.+/.test(path)) {
        onModalOpenObserver = onModalOpen(() => {
          createTabObserver({ video: true, playlist: /^\/(videos\/watch|w\/p)\/.+/.test(path) })
        })
      } else if (/^\/my-(account|library)\/video-playlists/.test(path)) {
        onModalOpenObserver = onModalOpen(() => {
          createTabObserver({ playlist: true })
        })
      }
    }
  })
}

async function buildButton ({
  name,
  label,
  sharerLink,
  sourceIcon,
  sourceTitle,
  sourceLink,
  inputFilterElements
}) {
  // Button structure
  const button = document.createElement('a')
  button.classList.add('video-sharing', name)
  button.target = '_blank'
  button.tabIndex = 0

  // Button icon
  const icon = document.createElement('div')
  icon.innerHTML = sourceIcon
  button.appendChild(icon)

  // Button title and label
  const titlePrefix = await translate('Share on')
  button.title = `${titlePrefix} ${label}`
  button.innerHTML += label

  // Button link builder
  const buildButtonLink = () => {
    button.href = sharerLink
      .replace('%body', encodeURIComponent(sourceTitle))
      .replace('%link', encodeURIComponent(sourceLink))
  }

  buildButtonLink()

  // Re-build buttonLink for each alteration of the source link to share with a filter
  inputFilterElements.forEach(inputFilter => {
    inputFilter.addEventListener('change', buildButtonLink)
    inputFilter.addEventListener('input', buildButtonLink)
  })

  return button
}

async function displayButtons (contentType) {
  const modalContainer = document.querySelector(`ngb-modal-window .${contentType}`)

  // Get input link element
  const inputLinkElement = (
    modalContainer.querySelector('my-input-toggle-hidden') ||
    modalContainer.querySelector('my-input-readonly-copy') // my-input-readonly-copy is for backward compatibility
  ).querySelector('input')

  // Source title to share
  let sourceTitle
  try {
    const titleElement = (
      document.querySelector('h1.video-info-name') || // watch video view
      document.querySelector('my-video-watch-playlist .playlist-info .playlist-display-name') || // watch playlist view
      document.querySelector('.playlist-info .miniature a') // my-library playlist view
    )

    if (titleElement.querySelector('.badge') !== null) titleElement.querySelector('.badge').remove() // remove privacy badge

    sourceTitle = titleElement.innerText
  } catch {
    sourceTitle = '' // in case html structure changed return empty string
  }

  // Source link to share
  const sourceLink = inputLinkElement.value

  // Input filter elements (checkbox and timestamp fields)
  const inputFilterElements = modalContainer.querySelectorAll('my-peertube-checkbox input, my-timestamp-input input')

  // Buttons container
  const container = document.createElement('div')

  // Insert buttons to container
  for (const service of services) {
    const button = await buildButton({
      ...service,
      sourceTitle,
      sourceLink,
      inputFilterElements
    })

    container.appendChild(button)
  }

  container.classList.add('video-sharing-container')

  // Insert buttons container
  inputLinkElement.parentElement.insertBefore(container, inputLinkElement)
}

function onModalOpen (callback) {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const { type, addedNodes } = mutation

      if (type === 'childList') {
        addedNodes.forEach(addedNode => {
          if (addedNode.localName === 'ngb-modal-window') {
            if (document.querySelector('ngb-modal-window .video') || document.querySelector('ngb-modal-window .playlist')) {
              callback()
            }
          }
        })
      }
    }
  })

  observer.observe(document.body, {
    childList: true
  })

  return observer
}

function createTabObserver ({ video, playlist }) {
  const runAction = (target, contentType) => {
    const selected = target.getAttribute('aria-selected')

    if (selected) {
      displayButtons(contentType)
    }
  }

  const observeTab = async (contentType) => {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const { type, attributeName, target } = mutation

        if ((type === 'attributes') && (attributeName === 'aria-selected') && (target.getAttribute('aria-selected') === 'true')) {
          runAction(target, contentType)
        }
      }
    })

    const nav = document.querySelector(`ngb-modal-window .${contentType} .nav`)
    const tab = nav.querySelectorAll('.nav-link')[0]

    runAction(tab, contentType)

    observer.observe(tab, {
      attributes: true
    })
  }

  if (video) observeTab('video')
  if (playlist) observeTab('playlist')
}
