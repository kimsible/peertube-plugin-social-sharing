import twitterIcon from '../assets/images/twitter.svg'
import facebookIcon from '../assets/images/facebook.svg'

async function register ({ registerHook }) {
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      if (/^\/videos\/watch/.test(path)) {
        try {
          // Get Share button div element
          const share = await waitForRendering('my-video-watch .video-actions .action-button:nth-child(3)')

          share.addEventListener('click', async () => {
            try {
              if (/playlist/.test(path)) {
                await displayButtons('playlist')
              }
              await createTabObserver()
            } catch (error) {
              console.error(error)
            }
          })
        } catch (error) {
          console.error(error)
        }
      }
    }
  })
}

async function waitForRendering (selector) {
   // Waiting for DOMContent updated with a timeout of 5 seconds
   await new Promise((resolve, reject) => {
     const timeout = setTimeout(() => {
       clearInterval(interval)
       reject(new Error('No element found'))
     }, 5000)

     // Waiting for component in DOM
     const interval = setInterval(() => {
       if (document.querySelector(selector) !== null) {
         clearTimeout(timeout)
         clearInterval(interval)
         resolve()
       }
     }, 10)
   })

  return document.querySelector(selector)
}

function createButton ({ name, sharerLink, inputRef, iconHTML }) {
  const icon = document.createElement('span')
  icon.innerHTML = iconHTML

  const text = document.createElement('span')
  text.innerText = `Share on ${name}`

  const button = document.createElement('a')
  button.target = '_blank'
  button.classList.add('video-sharing', 'fade')
  button.appendChild(icon)
  button.appendChild(text)
  button.addEventListener('click', () => {
    inputRef.dispatchEvent(new Event('click'))

    const videoLink = inputRef.value
    button.href = sharerLink + videoLink
  })

  return button
}

async function displayButtons (type) {
  const inputReadOnlyCopy = await waitForRendering(`ngb-modal-window .${type} my-input-readonly-copy`)
  const nativeInput = inputReadOnlyCopy.querySelector('input')

  const facebookButton = createButton({
    name: 'Facebook',
    inputRef: nativeInput,
    sharerLink: 'https://www.facebook.com/sharer/sharer.php?u=',
    iconHTML: facebookIcon
  })

  const twitterButton = createButton({
    name: 'Twitter',
    inputRef: nativeInput,
    sharerLink: 'https://twitter.com/intent/tweet?url=',
    iconHTML: twitterIcon
  })

  inputReadOnlyCopy.parentElement.insertBefore(facebookButton, inputReadOnlyCopy)
  inputReadOnlyCopy.parentElement.insertBefore(twitterButton, inputReadOnlyCopy)
}

async function createTabObserver () {
  const runAction = async target => {
    try {
      const selected = target.getAttribute('aria-selected')

      if (selected) {
        await displayButtons('video')
      }

    } catch (error) {
      console.error(error)
    }
  }


  const nav = await waitForRendering('ngb-modal-window .video .nav')
  const tab = nav.querySelectorAll('.nav-link')[0]

  await runAction(tab)

  const observer = new MutationObserver(async mutations => {
    for (const mutation of mutations) {
      const {
        type,
        attributeName,
        target
      } = mutation

      if ((type === 'attributes') && (attributeName === 'aria-selected') && (target.getAttribute('aria-selected') === 'true')) {
        await runAction(target)
      }
    }
  })

  observer.observe(tab, {
    attributes: true
  })
}

export {
  register
}
