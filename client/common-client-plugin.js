import twitterIcon from '../assets/images/twitter.svg'
import facebookIcon from '../assets/images/facebook.svg'
import gabIcon from '../assets/images/gab.svg'
import linkedinIcon from '../assets/images/linkedin.svg'
import meweIcon from '../assets/images/mewe.svg'

export { register }

let translate

async function register ({ registerHook, peertubeHelpers }) {
  // Expose required PeerTube Helpers
  translate = peertubeHelpers.translate

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

async function createButton ({ name, sharerLink, inputRef, iconHTML, filters }) {
  const icon = document.createElement('div')
  icon.innerHTML = iconHTML

  const button = document.createElement('a')
  button.target = '_blank'
  button.tabIndex = 0

  const label = await translate('Share on')
  button.title = `${label} ${name}`
  button.classList.add('video-sharing', name.toLowerCase())
  button.appendChild(icon)
  button.innerHTML += name

  const getLink = () => {
    const link = inputRef.value
    button.href = sharerLink + encodeURIComponent(link)
  }

  getLink()

  filters.forEach(filter => {
    filter.addEventListener('change', getLink)
    filter.addEventListener('input', getLink)
  })

  return button
}

async function displayButtons (type) {
  const modalContainer = document.querySelector(`ngb-modal-window .${type}`)

  // my-input-readonly-copy is for backward compatibility
  const inputToggleHiddenElem = modalContainer.querySelector('my-input-toggle-hidden') || modalContainer.querySelector('my-input-readonly-copy')

  const nativeInput = inputToggleHiddenElem.querySelector('input')
  const filters = modalContainer.querySelectorAll('my-peertube-checkbox input, my-timestamp-input input')
  const contentTitle = getContentTitle(type) || ''

  const container = document.createElement('div')
  container.classList.add('video-sharing-container')

  const facebookButton = await createButton({
    name: 'Facebook',
    inputRef: nativeInput,
    sharerLink: 'https://www.facebook.com/sharer/sharer.php?display=page&u=',
    iconHTML: facebookIcon,
    filters
  })

  const gabButton = await createButton({
    name: 'Gab',
    inputRef: nativeInput,
    sharerLink: `https://gab.com/compose?text=${contentTitle}&url=`,
    iconHTML: gabIcon,
    filters
  })

  const twitterButton = await createButton({
    name: 'Twitter',
    inputRef: nativeInput,
    sharerLink: `https://twitter.com/intent/tweet?text=${contentTitle}&url=`,
    iconHTML: twitterIcon,
    filters
  })

  const linkedinButton = await createButton({
    name: 'LinkedIn',
    inputRef: nativeInput,
    sharerLink: `https://www.linkedin.com/shareArticle?mini=true&title=${contentTitle}&url=`,
    iconHTML: linkedinIcon,
    filters
  })

  const meweButton = await createButton({
    name: 'MeWe',
    inputRef: nativeInput,
    sharerLink: 'https://mewe.com/share?link=',
    iconHTML: meweIcon,
    filters
  })

  container.appendChild(facebookButton)
  container.appendChild(twitterButton)
  container.appendChild(gabButton)
  container.appendChild(linkedinButton)
  container.appendChild(meweButton)

  inputToggleHiddenElem.parentElement.insertBefore(container, inputToggleHiddenElem)
}

function getContentTitle (type) {
  if (type === 'video') {
    const nameIntoWatchVideoView = document.querySelector('h1.video-info-name')

    if (nameIntoWatchVideoView !== null) {
      return nameIntoWatchVideoView.innerText
    }
  }

  if (type === 'playlist') {
    const nameIntoWatchPlaylistView = document.querySelector('my-video-watch-playlist .playlist-info .playlist-display-name')
    const nameIntoMyLibraryView = document.querySelector('.playlist-info .miniature a')

    if (nameIntoWatchPlaylistView !== null) {
      // remove badge
      if (nameIntoWatchPlaylistView.querySelector('.badge') !== null) {
        nameIntoWatchPlaylistView.querySelector('.badge').remove()
      }

      return nameIntoWatchPlaylistView.innerText
    }

    if (nameIntoMyLibraryView !== null) {
      return nameIntoMyLibraryView.innerText
    }
  }
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
  const runAction = (target, type) => {
    const selected = target.getAttribute('aria-selected')

    if (selected) {
      displayButtons(type)
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

    runAction(tab, type)

    observer.observe(tab, {
      attributes: true
    })
  }

  if (video) observeTab('video')
  if (playlist) observeTab('playlist')
}
