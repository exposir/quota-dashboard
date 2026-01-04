import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fetchAllQuotas } from './services/quotaService'

let mainWindow: BrowserWindow | null = null

// 检测是否为开发模式
const isDev = !app.isPackaged

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    // 开发模式：尝试连接 Vite 开发服务器
    const tryPorts = [5173, 5174, 5175, 5176]
    for (const port of tryPorts) {
      try {
        await mainWindow.loadURL(`http://localhost:${port}`)
        console.log(`Connected to Vite dev server on port ${port}`)
        mainWindow.webContents.openDevTools()
        break
      } catch (e) {
        console.log(`Port ${port} not available, trying next...`)
      }
    }
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC 处理：获取所有配额数据
ipcMain.handle('get-all-quotas', async () => {
  try {
    const quotas = await fetchAllQuotas()
    return { success: true, data: quotas }
  } catch (error) {
    console.error('Error fetching quotas:', error)
    return { success: false, error: String(error) }
  }
})
