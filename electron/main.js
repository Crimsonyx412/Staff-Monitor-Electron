const {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Tray,
  Menu,
  screen,
  dialog,
  powerMonitor,
  net,
} = require('electron')
const { exec } = require('child_process')
const path = require('path')
const url = require('url')
const keytar = require('keytar')
const AutoLaunch = require('auto-launch')
const os = require('os')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const electron = require('electron')
const axios = require('axios')
const FormData = require('form-data')
const { v4: uuidv4 } = require('uuid')
// const sharp = require('sharp');
const { createCanvas, Image } = require('@napi-rs/canvas')

const autoLaunch = new AutoLaunch({
  name: 'StaffMonitor',
  path: app.getPath('exe'),
})
let mainWindow,
  loadingWindow,
  activityBar,
  trayIcon,
  isLogged = false
//var iconpath = path.join(__dirname, '../public/assets/trayicon.ico') // path of y
var iconpath = process.env.ELECTRON_START_URL
  ? path.join(__dirname, '../public/assets/trayicon.ico')
  : path.join(process.resourcesPath, 'public/assets/trayicon.ico') // path of y
// Register and start hook
const { uIOhook } = require('uiohook-napi')

uIOhook.start()
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'false'

// keytar.deletePassword('app', 'userinfo');
// keytar.deletePassword('app', 'settings');
function createTrayIcon() {
  let appIcon = new Tray(iconpath)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: function () {
        mainWindow.show()
      },
    },
    {
      label: 'Exit',
      click: () => {
        app.isQuiting = true
        uIOhook.stop()
        app.quit()
      },
    },
  ])

  appIcon.on('double-click', function (event) {
    mainWindow.show()
  })

  appIcon.setContextMenu(contextMenu)
  return appIcon
}

function createAppMenu(showLogout = false) {
  const template = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'Logout',
          click: async () => {
            if (!isLogged) {
              return
            }

            const choice = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              defaultId: 0,
              cancelId: 1,
              buttons: ['Yes', 'No'],
              title: 'staffmonitor',
              message: 'Log out?',
            })

            if (choice.response === 0) {
              mainWindow?.webContents.send('LogoutMnuClick')
              activityBar?.webContents.send('fromMainWindow', {
                working: false,
                name: '',
                startInterval: 0,
              })
              activityBar?.hide()
              isLogged = false
            }
          },
        },
        {
          label: 'Exit',
          click: async () => {
            const choice = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              defaultId: 0,
              cancelId: 1,
              buttons: ['Yes', 'No'],
              title: 'staffmonitor',
              message: 'Do you want to exit the application?',
            })

            if (choice.response === 0) {
              app.isQuiting = true
              uIOhook.stop()
              app.quit()
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      click: async () => {
        shell.openExternal('https://staffmonitor.app')
      },
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createAppWindow() {
  const width = 1200,
    height = 800
  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true,
    })

  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    resizable: false,
    icon: iconpath,
  })

  mainWindow.webContents.once('dom-ready', () => {
    // get access token
    mainWindow.show()
    loadingWindow.close()
    // create Tray Icon
    trayIcon = createTrayIcon()
    //send mouse click and key press event per action triggered.
    uIOhook.on('click', (event) => {
      mainWindow?.webContents.send('mouseclick', event)
    })
    uIOhook.on('keydown', (event) => {
      mainWindow?.webContents.send('keydown', event)
    })
  })

  mainWindow.webContents.on('new-window', (_, url) => {
    _.preventDefault()
    const protocol = require('url').parse(url).protocol
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
  })

  mainWindow.loadURL(startUrl)
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.on('close', async function (event) {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()

      const { visibility } = await getAppSettings()

      if ((visibility === 'true' || visibility === true) && isLogged === true) {
        activityBar.show()
        activityBar.blur()
        activityBar.setOverlayIcon(null, '')
      } else {
        activityBar.hide()
      }
    }

    return false
  })

  mainWindow.on('minimize', async function (event) {
    event.preventDefault()
    mainWindow.hide()

    const { visibility } = await getAppSettings()
    if ((visibility === 'true' || visibility === true) && isLogged === true) {
      activityBar.show()
      activityBar.blur()
      //mainWindow.setOverlayIcon(null, '')
    } else {
      activityBar.hide()
    }
  })

  //////////////////////////------ACTIVITY BAR---/////////////////////////////////
  const screenWidth = screen.getPrimaryDisplay().workAreaSize.width
  const screenHeight = screen.getPrimaryDisplay().workAreaSize.height
  activityBar = new BrowserWindow({
    show: false,
    width: 500,
    height: 30,
    minWidth: 500,
    minHeight: 30,
    transparent: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      devTools: false,
    },
    resizable: false,
    icon: iconpath,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
  })

  activityBar.setAlwaysOnTop(true, 'screen')
  activityBar.setPosition((screenWidth - 500) / 2, screenHeight - 30)

  //force the height of the window to 30px.
  activityBar.setShape([
    {
      x: 0,
      y: 0,
      width: 500,
      height: 30,
    },
  ])

  //activityBar.setBackgroundColor('#00000000')
  activityBar.webContents.on('before-input-event', (event, input) => {
    if (
      input.type === 'keyDown' &&
      ((input.key === 'R' && input.control) ||
        (input.key === 'r' && input.control))
    ) {
      event.preventDefault()
    }
  })

  activityBar.webContents.once('dom-ready', () => {
    const secret = keytar.getPassword('app', 'userinfo')
    secret.then((result) => {
      if (result) {
        setTimeout(() => {
          activityBar.webContents.send('subWindowAutoLogin', JSON.parse(result))
        }, 2000)
      }
    })
    // activityBar.show()
  })
  activityBar.webContents.on('new-window', (_, url) => {
    _.preventDefault()
    const protocol = require('url').parse(url).protocol
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
  })
  const activityUrl =
    process.env.ELECTRON_ACTIVITY_URL ||
    url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true,
    })
  activityBar.loadURL(activityUrl)
  activityBar.on('closed', function () {
    activityBar = null
  })

  activityBar.on('show', function (event) {
    //Hide taskbar icon
    activityBar.setSkipTaskbar(true)

    try {
      //Remove the background of the body to use the transparent property of the browser window.
      const css = `
            body {
                font-family: 'Montserrat';
                font-style: normal;
                background-color: transparent;
            }
            `
      activityBar?.webContents.executeJavaScript(`
                function disableBackground(){
                    const style = document.createElement('style')
                    style.innerHTML = ${JSON.stringify(css)}
                    document.head.appendChild(style)
                    return true
                }

                disableBackground()
            `)
    } catch (error) {
      console.log('Error', error.message)
    }
  })

  activityBar.setSkipTaskbar(true)
}

function createWindow() {
  Menu.setApplicationMenu(null)
  setInitialAppSettings()

  const width = 1200,
    height = 800

  loadingWindow = new BrowserWindow({
    show: false,
    width,
    height,
    icon: iconpath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  })
  const loadingUrl = process.env.ELECTRON_START_URL
    ? url.format({
        pathname: path.join(__dirname, '../public/loading.html'),
        protocol: 'file:',
        slashes: true,
      })
    : url.format({
        pathname: path.join(__dirname, '../loading.html'),
        protocol: 'file:',
        slashes: true,
      })

  loadingWindow.loadURL(loadingUrl)
  loadingWindow.show()
  loadingWindow.setOverlayIcon(null, '')
}
app.on('ready', () => {
  //It is detected when the computer comes out of hibernation.
  powerMonitor.on('resume', () => {
    if (!isLogged) {
      return
    }

    try {
      setTimeout(async () => {
        const secret = JSON.parse(await keytar.getPassword('app', 'userinfo'))
        //If the 'remember' option is enabled, refreshes the token.
        if (secret.refresh) {
          mainWindow?.webContents.send('refreshtoken_on_resume', secret)
        } else {
          //If the 'remember' option is disabled, returns to the login screen.
          mainWindow?.webContents.send('LogoutMnuClick')
          activityBar?.webContents.send('fromMainWindow', {
            working: false,
            name: '',
            startInterval: 0,
          })
          activityBar?.hide()
          isLogged = false
        }
      }, 2000)
    } catch (error) {
      console.log(error)
    }
  })

  //create main window
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    uIOhook.stop()
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('createAppWindow', async (event, data) => {
  createAppMenu()
  createAppWindow()
})

// save accessToken
ipcMain.on('saveAccessToken', async (event, data) => {
  try {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.access
    await keytar.setPassword('app', 'userinfo', JSON.stringify(data))
    activityBar.webContents.send('subWindowAutoLogin', data)
  } catch (error) {
    console.log(error)
  }
})

ipcMain.on('logged', (event, data) => {
  isLogged = true
})

ipcMain.on('removeAccessToken', (event, data) => {
  keytar.deletePassword('app', 'userinfo')
})

ipcMain.on('getUserInfo', async (event) => {
  const secret = await keytar.getPassword('app', 'userinfo')
  event.sender.send('userinfo', JSON.parse(secret))
})

ipcMain.on('showMainWindow', () => {
  mainWindow.setAlwaysOnTop(true)
  mainWindow.show()
  mainWindow.setAlwaysOnTop(false)
})

ipcMain.on('closeWindow', () => {
  activityBar.hide()
})

// send data to sub window
ipcMain.on('sendDataToSubWindow', (event, data) => {
  activityBar.webContents.send('fromMainWindow', data)
})

// send data to sub window
ipcMain.on('sendDataToSubWindowBreakStatus', (event, data) => {
  activityBar.webContents.send('fromMainWindowBreakStatus', data)
})

// send data to main window
ipcMain.on('sendDataToMainWindow', (event, data) => {
  mainWindow.webContents.send('fromSubWindow', data)
})

// save app settings
ipcMain.on('saveAppSettings', (event, data) => {
  keytar.setPassword('app', 'settings', JSON.stringify(data))
  if (data.startup === true || data.startup === 'true') {
    autoLaunch.isEnabled().then((isEnabled) => {
      if (!isEnabled) autoLaunch.enable()
    })
  } else {
    autoLaunch.isEnabled().then((isEnabled) => {
      if (isEnabled) autoLaunch.disable()
    })
  }
})

ipcMain.on('getAppSettings', (event) => {
  const secret = keytar.getPassword('app', 'settings')
  secret.then((result) => {
    event.sender.send('appSettings', result)
  })
})

ipcMain.on('showActivityBar', async () => {
  const { visibility } = await getAppSettings()
  if (visibility === 'true' || visibility === true) {
    activityBar.show()
    activityBar.blur()
  } else activityBar.hide()
})

ipcMain.on('getInternetStatus', async (event) => {
  const internetStatus = await testInternetConnection()
  event.sender.send('InternetStatus', internetStatus)
})

function testInternetConnection(timeout = 5000) {
  return new Promise((resolve) => {
    const request = net.request('https://panel.staffmonitor.app/')

    const timeoutId = setTimeout(() => {
      resolve(false) // Timeout reached, resolve with false
    }, timeout)

    request.on('response', (response) => {
      clearTimeout(timeoutId) // Clear the timeout since we got a response
      resolve(response.statusCode === 200)
    })

    request.on('error', () => {
      clearTimeout(timeoutId) // Clear the timeout in case of an error
      resolve(false)
    })

    request.end()
  })
}

async function setInitialAppSettings() {
  const settings = await getAppSettings()
  if (!settings) {
    keytar.setPassword(
      'app',
      'settings',
      JSON.stringify({
        visibility: true,
        startup: false,
        isRemind: true,
        days: [1, 2, 3, 4, 5],
        mins: '15',
        time_from: '2014-08-18T00:00:00',
        time_to: '2014-08-18T00:15:00',
      })
    )
  }
}

function getAppSettings() {
  return new Promise((resolve) => {
    const secret = keytar.getPassword('app', 'settings')
    secret
      .then((result) => {
        if (result) resolve(JSON.parse(result))
        else resolve(null)
      })
      .catch(() => {
        resolve(null)
      })
  })
}

const userInfo = os.userInfo()
ipcMain.on('getBrowerHistory', (event, data) => {
  // Copying the file to a the same name
  let timeId = setTimeout(async () => {
    let dbPath = path.resolve(
      userInfo.homedir,
      'AppData/Local/Google/Chrome/User Data/Default/History'
    )
    let tempDb = os.tmpdir() + '/History'
    await addChromeURL(dbPath, tempDb, data)

    dbPath = path.resolve(
      userInfo.homedir,
      'AppData/Roaming/Mozilla/Firefox/Profiles/default/places.sqlite'
    )
    tempDb = os.tmpdir() + '/places.sqlite'
    await addFirefoxURL(dbPath, tempDb, data)

    event.sender.send(
      'getBrowerHistory',
      data.filter(
        (item) =>
          item.type === 'application' ||
          (item.type === 'website' && item.name !== '')
      )
    )

    clearTimeout(timeId)
  }, 5000)

  //
})

const uploadFile = async (
  fileName,
  session,
  mouseCnt,
  keyCnt,
  parentid = null
) => {
  const data = new FormData()
  const filePath = path.join(os.tmpdir(), fileName)

  if (parentid) data.append('parent', parentid)

  let mClick = Math.floor(mouseCnt / 3)
  let kClick = Math.floor(keyCnt / 3)
  const file = fs.readFileSync(filePath)

  data.append('file', file, {
    filename: fileName,
    contentType: 'image/jpeg',
  })
  data.append('screencast', 1)
  data.append('name', fileName)
  data.append('clockId', session ? session.id : null)
  data.append(`mouseStat`, mClick >= 50 ? 50 : mClick)
  data.append(`keyboardStat`, kClick >= 50 ? 50 : kClick)

  let config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }

  return axios.post('https://panel.staffmonitor.app/api/files', data, config)
}

////
ipcMain.on('captureScreenshot', async (event, data) => {
  const { desktopCapturer } = electron
  const { blurScreencasts, session, mouseCnt, keyCnt } = data
  const isBlur = blurScreencasts
  const displays = screen.getAllDisplays()
  const { width: maxWidth, height: maxHeight } = displays.reduce(
    (acc, display) => {
      const { width, height } = display.workAreaSize

      return {
        width: Math.max(acc.width, width),
        height: Math.max(acc.height, height),
      }
    },
    { width: 0, height: 0 }
  )

  // Get sources for windows and screens, and set the thumbnail size to the maximum width and height determined above.
  desktopCapturer
    .getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: maxWidth, height: maxHeight },
    })
    .then(async (sources) => {
      const fileNames = []
      // Loop through the retrieved sources.
      for (const source of sources) {
        if (
          source.name !== 'Entire screen' &&
          !source.name.startsWith('Screen ')
        )
          continue
        const fileName = `${uuidv4()}.jpg`
        // Find the display corresponding to the source and set the screen width and height based on the display work area size or the maximum width and height determined above.
        const display = displays.find((item) => item.id === source.display_id)
        const screenWidth = display ? display.workAreaSize.width : maxWidth
        const screenHeight = display ? display.workAreaSize.height : maxHeight
        const outputPath = path.join(os.tmpdir(), fileName)

        try {
          const image = new Image()
          const base64Data = source.thumbnail
            .toDataURL()
            .replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          image.src = buffer
          const canvas = createCanvas(screenWidth, screenHeight)
          const ctx = canvas.getContext('2d')
          ctx.filter = isBlur ? 'blur(6px)' : 'blur(0px)' // apply a 10px blur effect
          ctx.drawImage(image, 0, 0, screenWidth, screenHeight)
          const imageDataURL = canvas.toDataURL('image/jpeg', 0.3)

          // Write the converted image data to a file
          fs.writeFileSync(
            outputPath,
            imageDataURL.replace(/^data:image\/jpeg;base64,/, ''),
            'base64'
          )
          fileNames.push(fileName)
        } catch (error) {
          console.error(error)
        }
      }

      try {
        // Upload the first file in the array to a server using the `uploadFile` function and the remaining files in the array to the same server using the ID of the first file.
        const res = await uploadFile(fileNames[0], session, mouseCnt, keyCnt)
        fileNames
          .slice(1)
          .forEach((item) =>
            uploadFile(item, session, mouseCnt, keyCnt, res.data.id)
          )
      } catch (error) {
        console.error('fileUpload:', error)
      }
    })
})

//console.log("test:",removeWwwFromUrl(url.parse("https://www.google.com/")))

function removeWwwFromUrl(parsedUrl) {
  const { hostname, protocol, pathname, search, hash } = parsedUrl

  const modifiedHostname = hostname.replace(/^www\./i, '')

  const modifiedUrl = `${protocol}//${modifiedHostname}${pathname || ''}${
    search || ''
  }${hash || ''}`

  return modifiedUrl
}

async function addChromeURL(src, dest, data) {
  /* try {
         const db = new sqlite3(dest, { verbose: console.log });
         const rows = await db.prepare(`SELECT visits.visit_time, urls.title, urls.url FROM visits JOIN urls ON urls.id = visits.url ORDER BY visits.visit_time DESC LIMIT 150`).all();
 
         data.forEach(element => {
             let find = rows.find(item => element.nameDetail.indexOf(item.title) !== -1)
 
             if (find) {
                 element.url = removeWwwFromUrl(url.parse(find.url));
                 let urlData =url.parse(removeWwwFromUrl(url.parse(find.url))).host
                 element.name = `${urlData}`;
             }
         });
 
         db.close();
 
         return data;
 
     } catch (err) {
         console.error(err.message);
     }*/

  return new Promise(async (resolve) => {
    try {
      fs.writeFileSync(dest, fs.readFileSync(src))
    } catch {
      return []
    }

    let db = new sqlite3.Database(dest, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message)
      }
    })

    db.all(
      `SELECT visits.visit_time, urls.title, urls.url FROM visits JOIN urls ON urls.id = visits.url ORDER BY visits.visit_time DESC LIMIT 150`,
      [],
      (err, rows) => {
        if (err) {
          throw err
        }
        data.forEach((element) => {
          let find = rows.find(
            (item) => element.nameDetail.indexOf(item.title) !== -1
          )
          if (find) {
            element.url = find.url
            let urlData = url.parse(find.url)
            element.name = `${urlData.host}`
          }
        })

        db.close(() => {
          // if (fs.existsSync(dest))
          //     fs.unlinkSync(dest)
          resolve(data)
        })
      }
    )
  })
}

async function addFirefoxURL(src, dest, data) {
  /*try {
        fs.writeFileSync(dest, fs.readFileSync(src));
    } catch {
        return []
    }

    try {
        const db = new sqlite3(dest, { verbose: console.log });
        const rows = await db.prepare(`SELECT url, title FROM moz_places ORDER BY last_visit_date DESC LIMIT 150`).all();

        data.forEach(element => {
            let find = rows.find(item => element.nameDetail.indexOf(item.title) !== -1)
            if (find) {
                element.url = removeWwwFromUrl( url.parse(find.url));
                //let urlData = url.parse(find.url)
                let urlData =url.parse(removeWwwFromUrl(url.parse(find.url))).host
                element.name = `${urlData}`;
            }
        });

        db.close();

        return data;

    } catch (err) {
        console.error(err.message);
    }*/

  return new Promise((resolve) => {
    try {
      fs.writeFileSync(dest, fs.readFileSync(src))
    } catch {
      return resolve([])
    }

    let db = new sqlite3.Database(dest, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message)
      }
    })

    db.all(
      `SELECT url, title FROM moz_places ORDER BY last_visit_date DESC LIMIT 150`,
      [],
      (err, rows) => {
        if (err) {
          throw err
        }
        data.forEach((element) => {
          let find = rows.find(
            (item) => element.nameDetail.indexOf(item.title) !== -1
          )
          if (find) {
            element.url = find.url
            let urlData = url.parse(find.url)
            element.name = `${urlData.host}`
          }
        })

        db.close(() => {
          // if (fs.existsSync(dest))
          //     fs.unlinkSync(dest)
          resolve(data)
        })
      }
    )
  })
}

ipcMain.on('getFakescreenshot', async (event, data) => {
  const { session, mouseCnt, keyCnt } = data
  const pathAsset = process.env.ELECTRON_START_URL
    ? path.join(__dirname, '../public/assets/screenshot_disabled.jpg')
    : path.join(process.resourcesPath, 'public/assets/screenshot_disabled.jpg')
  const img = fs.readFileSync(pathAsset).toString('base64')
  const fileName = `${uuidv4()}.jpg`
  const outputPath = path.join(os.tmpdir(), fileName)
  fs.writeFileSync(outputPath, img, 'base64')
  await uploadFile(fileName, session, mouseCnt, keyCnt)
})

ipcMain.on('onGetInstalledBrowsers', async (event, _) => {
  const browsers = await getInstalledBrowsers()
  event.sender.send('installedBrowsers', [...browsers, 'Vivaldi', 'Safari'])
})

function getInstalledBrowsers() {
  return new Promise((resolve, reject) => {
    const command =
      'reg query "HKEY_LOCAL_MACHINE\\Software\\Clients\\StartMenuInternet" /s'
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject('Error al ejecutar el comando:', error)
        return
      }

      const regex =
        /HKEY_LOCAL_MACHINE\\Software\\Clients\\StartMenuInternet\\([^\\]+)/g
      const matches = stdout.match(regex)

      if (matches) {
        const uniqueBrowsers = [
          ...new Set(
            matches.map((match) => {
              //match.replace(regex, '$1')
              let name = match.replace(regex, '$1').trim()

              // Verificar el caso especial de Brave
              if (name.toLowerCase().includes('brave')) {
                name = 'Brave Browser'
              }

              return name.split('-')[0]
            })
          ),
        ]
        resolve(uniqueBrowsers)
      } else {
        resolve([])
      }
    })
  })
}
