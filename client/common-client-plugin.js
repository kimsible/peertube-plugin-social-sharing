import servicesJSON from '../assets/services.json'
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
          onModalOpen(node.querySelector('.video'))

          if (/^\/(videos\/watch\/playlist|w\/p)\/.+/.test(path)) {
            onModalOpen(node.querySelector('.playlist'))
          }
        })
      }

      if (/^\/my-(account|library)\/video-playlists/.test(path)) {
        observer = addModalOpenObserver(node => {
          onModalOpen(node.querySelector('.playlist'))
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
  // Button structure
  const button = document.createElement('a')
  button.classList.add('video-sharing', name)
  button.target = '_blank'
  button.tabIndex = 0

  // Button icon
  button.appendChild(icon)

  // Button title and label
  const titlePrefix = await translate('Share on')
  button.title = `${titlePrefix} ${label}`
  button.innerHTML += label

  // Button link builder
  const buildButtonLink = (sourceLink) => sharerLink
    .replace('%body', encodeURIComponent(sourceTitle))
    .replace('%link', encodeURIComponent(sourceLink))

  // Custom domain like Fediverse, WordPress
  if (customDomain) {
    let href = buildButtonLink(inputLinkElement.value)
    const instructionsText = await translate('Enter the instance’s address')
    const cancelLabel = await translate('Cancel')
    const shareLabel = await translate('Share')

    // Input custom domain
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'https://domain.org'
    input.classList.add('form-control')

    // Instructions container
    const paragraph = document.createElement('p')
    paragraph.innerText = instructionsText

    button.addEventListener('click', () => {
      const observer = addModalOpenObserver(modalElement => {
        // Customize modal
        const modalDialogElement = modalElement.querySelector('.modal-dialog')
        modalDialogElement.classList.remove('modal-lg')
        modalDialogElement.classList.add('custom-domain')

        // Inject all elements to modal body
        const modalBodyElement = modalElement.querySelector('.modal-body')
        modalBodyElement.appendChild(icon)
        modalBodyElement.appendChild(paragraph)
        modalBodyElement.appendChild(input)

        // Disable modal share button
        const shareButtonElement = modalDialogElement.querySelector('.modal-footer input:last-child')
        shareButtonElement.disabled = true

        // Domain checker
        const domainChecker = () => {
          if (/^https?:\/\/[a-z\d]+\.[a-z]{2,}(\.[a-z]{2,})?\/?$/.test(input.value)) {
            shareButtonElement.removeAttribute('disabled')
          } else {
            shareButtonElement.disabled = true
          }
        }

        // Run if input already filled
        domainChecker()

        // Run on keyup (writing and paste)
        input.addEventListener('keyup', domainChecker)
      }, true)

      showModal({
        title: button.title,
        content: '',
        close: false,
        cancel: { value: cancelLabel, action: () => { observer.disconnect() } },
        confirm: {
          value: shareLabel,
          action: () => {
            observer.disconnect()
            const domain = input.value.replace(/\/$/, '') // trim any last slash
            window.open(`${domain}/${href}`)
          }
        }
      })
    })

    // Re-build buttonLink for each alteration of the source link to share with a filter
    inputFilterElements.forEach(inputFilter => {
      inputFilter.addEventListener('change', () => { href = buildButtonLink(inputLinkElement.value) })
    })
  } else {
    button.href = buildButtonLink(inputLinkElement.href)

    // Re-build buttonLink for each alteration of the source link to share with a filter
    inputFilterElements.forEach(inputFilter => {
      inputFilter.addEventListener('change', () => { button.href = buildButtonLink(inputLinkElement.value) })
    })
  }

  return button
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

  // Buttons container
  const container = document.createElement('div')

  // Insert buttons to container
  for (const service of services) {
    const button = await buildButton({
      ...service,
      sourceTitle,
      inputFilterElements,
      inputLinkElement
    })

    container.appendChild(button)
  }

  container.classList.add('video-sharing-container')

  // Insert buttons container
  inputLinkElement.parentElement.insertBefore(container, inputLinkElement)
}

function onModalOpen (container) {
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
