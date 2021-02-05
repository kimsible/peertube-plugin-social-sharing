import twitterIcon from '../assets/images/twitter.svg'
import facebookIcon from '../assets/images/facebook.svg'

async function register ({ registerHook }) {
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      if (/^\/videos\/watch/.test(path)) {
        onModalOpen(() => {
          createTabObserver({ video: true, playlist: /playlist/.test(path) })
        })
      }

      if (/^\/my-account\/video-playlists/.test(path)) {
        onModalOpen(() => {
          createTabObserver({ playlist: true })
        })
      }
    }
  })
}

function createButton({ name, sharerLink, inputRef, iconHTML, filters }) {
  const icon = document.createElement('span')
  icon.innerHTML = iconHTML

  const button = document.createElement('a')
  button.target = '_blank'
  button.tabIndex = 0
  button.title = `Share on ${name}`
  button.classList.add('video-sharing', name.toLowerCase())
  button.appendChild(icon)

  const getLink = () => {
    const videoLink = inputRef.value
    button.href = sharerLink + videoLink
  }

  getLink()

  filters.forEach(filter => {
    filter.addEventListener('change', getLink)
    filter.addEventListener('input', getLink)
  })

  return button
}

function displayButtons(type) {
  const modalContainer = document.querySelector(`ngb-modal-window .${type}`)
  // my-input-readonly-copy is for backward compatibility
  const inputToggleHidenElem = modalContainer.querySelector('my-input-toggle-hidden') || modalContainer.querySelector('my-input-readonly-copy')
  const nativeInput = inputToggleHidenElem.querySelector('input')
  const filters = modalContainer.querySelectorAll('my-peertube-checkbox input, my-timestamp-input input')

  // If buttons already injected remove them
  const buttonsContainers = inputToggleHidenElem.parentElement.querySelectorAll('.video-sharing-container')
  buttonsContainers.forEach(buttonsContainer => {
    buttonsContainer.remove()
  })

  const container = document.createElement('div')
  container.classList.add('video-sharing-container')


  const facebookButton = createButton({
    name: 'Facebook',
    inputRef: nativeInput,
    sharerLink: 'https://www.facebook.com/sharer/sharer.php?display=page&u=',
    iconHTML: facebookIcon,
    filters
  })

  const twitterButton = createButton({
    name: 'Twitter',
    inputRef: nativeInput,
    sharerLink: 'https://twitter.com/intent/tweet?url=',
    iconHTML: twitterIcon,
    filters
  })

  container.appendChild(facebookButton)
  container.appendChild(twitterButton)

  inputToggleHidenElem.parentElement.insertBefore(container, inputToggleHidenElem)
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
}

function createTabObserver ({ video, playlist }) {
  const runAction = target => {
    const selected = target.getAttribute('aria-selected')

    if (selected) {
      if (video) displayButtons('video')
      if (playlist) displayButtons('playlist')
    }
  }

  const observeTab = async type => {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const { type, attributeName, target } = mutation

        if ((type === 'attributes') && (attributeName === 'aria-selected') && (target.getAttribute('aria-selected') === 'true')) {
          runAction(target)
        }
      }
    })

    const nav = document.querySelector(`ngb-modal-window .${type} .nav`)
    const tab = nav.querySelectorAll('.nav-link')[0]

    runAction(tab)

    observer.observe(tab, {
      attributes: true
    })
  }

  if (video) observeTab('video')
  if (playlist) observeTab('playlist')
}

export {
  register
}
