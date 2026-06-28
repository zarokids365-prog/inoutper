# راهنمای ساخت فایل اجرایی InOutZaro برای ویندوز

## پیش‌نیازها

1. **Node.js نسخه 18 یا بالاتر**
   - دانلود از: https://nodejs.org
   - نسخه LTS را نصب کنید

2. **Git** (اختیاری)
   - دانلود از: https://git-scm.com

---

## روش اول: استفاده از Electron (توصیه شده)

### مرحله ۱: آماده‌سازی پروژه

```bash
# وارد پوشه پروژه شوید
cd InOutZaro

# نصب وابستگی‌ها
npm install

# نصب Electron و ابزارهای ساخت
npm install --save-dev electron electron-builder concurrently wait-on
```

### مرحله ۲: ایجاد فایل Electron

فایل `electron/main.js` را بسازید:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    title: 'InOutZaro - سیستم حضور و غیاب',
  });

  // در حالت توسعه
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // در حالت تولید - اجرای سرور Next.js
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // اجرای سرور Next.js
  server = spawn('npm', ['run', 'start'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
  });

  // صبر برای بالا آمدن سرور
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  if (server) server.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

### مرحله ۳: تنظیم package.json

این بخش را به `package.json` اضافه کنید:

```json
{
  "main": "electron/main.js",
  "build": {
    "appId": "com.inoutzaro.app",
    "productName": "InOutZaro",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerLanguages": ["fa_IR", "en_US"],
      "language": "1065"
    },
    "files": [
      "**/*",
      "!src/**",
      "!node_modules/.cache/**"
    ],
    "extraResources": [
      {
        "from": ".next",
        "to": ".next"
      }
    ]
  },
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder --win"
  }
}
```

### مرحله ۴: ساخت فایل اجرایی

```bash
# ساخت پروژه Next.js
npm run build

# ساخت فایل exe
npm run electron:build
```

فایل نصب در پوشه `dist` ساخته می‌شود.

---

## روش دوم: استفاده از Tauri (سبک‌تر و سریع‌تر)

Tauri فایل‌های کوچک‌تری تولید می‌کند (۱۰-۲۰ مگابایت به جای ۱۵۰+ مگابایت Electron)

### نصب Rust
```bash
# ویندوز - از PowerShell اجرا کنید:
winget install Rustlang.Rustup
```

### نصب Tauri
```bash
npm install --save-dev @tauri-apps/cli
npm run tauri init
npm run tauri build
```

---

## روش سوم: نسخه Portable (بدون نصب)

اگر می‌خواهید بدون Electron کار کنید:

### استفاده از pkg
```bash
npm install -g pkg

# ساخت سرور standalone
pkg . --targets node18-win-x64 --output InOutZaro.exe
```

---

## استفاده از SQLite به جای PostgreSQL (برای نسخه آفلاین)

برای نسخه کاملاً آفلاین، دیتابیس را به SQLite تغییر دهید:

```bash
npm install better-sqlite3 drizzle-orm
npm uninstall pg
```

سپس `src/db/index.ts` را تغییر دهید:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'inoutzaro.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);
```

---

## سرویس‌های آنلاین برای ساخت

### ۱. GitHub Actions (رایگان)
1. پروژه را در GitHub آپلود کنید
2. فایل `.github/workflows/build.yml` بسازید:

```yaml
name: Build Windows App

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm run electron:build
      - uses: actions/upload-artifact@v3
        with:
          name: windows-app
          path: dist/*.exe
```

### ۲. AppVeyor (رایگان برای پروژه‌های عمومی)
- https://www.appveyor.com
- به GitHub متصل شوید و خودکار build می‌کند

### ۳. Codemagic
- https://codemagic.io
- پشتیبانی از Electron و Flutter

---

## ساختار نهایی پروژه

```
InOutZaro/
├── electron/
│   └── main.js
├── public/
│   ├── fonts/
│   └── icon.ico
├── src/
│   ├── app/
│   ├── components/
│   ├── db/
│   └── lib/
├── package.json
└── ...
```

---

## نکات مهم

1. **آیکون برنامه**: فایل `icon.ico` با ابعاد 256x256 در پوشه public قرار دهید
2. **امضای دیجیتال**: برای انتشار عمومی، گواهی Code Signing بگیرید
3. **آنتی‌ویروس**: فایل‌های ساخته شده با Electron ممکن است False Positive بدهند
4. **حجم فایل**: Electron حدود ۱۵۰ مگابایت، Tauri حدود ۱۵ مگابایت

---

## پشتیبانی

برای سوالات بیشتر:
- Electron Docs: https://www.electronjs.org/docs
- Tauri Docs: https://tauri.app/v1/guides/
- Next.js Docs: https://nextjs.org/docs
