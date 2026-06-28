const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let server;

// تنظیم مسیر برای حالت production
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    title: 'InOutZaro - سیستم حضور و غیاب',
    backgroundColor: '#0d0d0d',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // خطای لود صفحه
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 1000);
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = isDev ? '.' : path.join(process.resourcesPath, 'app');
    
    server = spawn('npm', ['run', 'start'], {
      cwd: serverPath,
      shell: true,
      env: {
        ...process.env,
        PORT: '3000',
      },
    });

    server.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('Ready') || data.toString().includes('started')) {
        resolve();
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    server.on('error', (err) => {
      reject(err);
    });

    // Timeout
    setTimeout(resolve, 5000);
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox('خطا', 'خطا در راه‌اندازی سرور: ' + err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (server) {
    server.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.kill('SIGTERM');
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// جلوگیری از باز شدن چند نسخه
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
