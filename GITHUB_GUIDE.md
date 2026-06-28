# 🚀 راهنمای قدم به قدم GitHub Actions

## مرحله ۱: ساخت اکانت GitHub

1. به آدرس **https://github.com** بروید
2. روی **Sign up** کلیک کنید
3. ایمیل، رمز و نام کاربری وارد کنید
4. ایمیل تأیید را چک کنید

---

## مرحله ۲: ساخت Repository جدید

1. بعد از ورود، روی **+** بالا سمت راست کلیک کنید
2. گزینه **New repository** را بزنید
3. تنظیمات:
   - **Repository name:** `InOutZaro`
   - **Description:** `سیستم حضور و غیاب`
   - **Public** را انتخاب کنید (برای استفاده رایگان از Actions)
   - تیک **Add a README file** را بزنید
4. دکمه **Create repository** را بزنید

---

## مرحله ۳: آپلود فایل‌های پروژه

### روش ساده (از طریق مرورگر):

1. در صفحه repository، روی **Add file** کلیک کنید
2. گزینه **Upload files** را بزنید
3. تمام فایل‌های پروژه را Drag & Drop کنید
4. پایین صفحه روی **Commit changes** کلیک کنید

### روش حرفه‌ای (با Git):

```bash
# ۱. نصب Git از git-scm.com

# ۲. باز کردن CMD یا PowerShell در پوشه پروژه

# ۳. اجرای دستورات:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/InOutZaro.git
git push -u origin main
```

⚠️ **YOUR_USERNAME** را با نام کاربری خودتان عوض کنید.

---

## مرحله ۴: تنظیم package.json

مطمئن شوید این بخش‌ها در `package.json` وجود دارد:

```json
{
  "name": "inoutzaro",
  "version": "1.0.0",
  "main": "electron/main.js",
  "author": "Your Name",
  "description": "سیستم حضور و غیاب InOutZaro",
  "build": {
    "appId": "com.inoutzaro.app",
    "productName": "InOutZaro",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "InOutZaro"
    },
    "files": [
      "**/*",
      "!src/**",
      "!*.md"
    ],
    "extraResources": [
      {
        "from": ".next",
        "to": ".next"
      },
      {
        "from": "public",
        "to": "public"
      }
    ]
  }
}
```

---

## مرحله ۵: اجرای خودکار Build

بعد از آپلود فایل‌ها:

1. در GitHub به تب **Actions** بروید
2. اگر workflow را می‌بینید، یعنی همه چیز درست است
3. Build خودکار شروع می‌شود

### اجرای دستی:
1. تب **Actions** را باز کنید
2. از لیست چپ **Build Windows Executable** را بزنید
3. دکمه **Run workflow** را کلیک کنید
4. دوباره **Run workflow** (سبز) را بزنید

---

## مرحله ۶: دانلود فایل exe

1. بعد از اتمام Build (علامت ✅ سبز)
2. روی نام workflow کلیک کنید
3. پایین صفحه بخش **Artifacts** را ببینید
4. روی **InOutZaro-Windows** کلیک کنید
5. فایل ZIP دانلود می‌شود
6. ZIP را باز کنید - فایل `.exe` داخلش است!

---

## ⏱️ زمان Build

- معمولاً **۵ تا ۱۰ دقیقه** طول می‌کشد
- صبور باشید و صفحه را Refresh کنید

---

## 🔧 اگر خطا داد چه کنم؟

1. تب **Actions** را باز کنید
2. روی Build قرمز (❌) کلیک کنید
3. روی **build** کلیک کنید
4. لاگ خطا را بخوانید
5. معمولاً مشکل از:
   - فایل `package.json` ناقص است
   - فایل `electron/main.js` وجود ندارد
   - خطای تایپی در کد

---

## 📁 فایل‌های ضروری

مطمئن شوید این فایل‌ها آپلود شده:

```
InOutZaro/
├── .github/
│   └── workflows/
│       └── build-windows.yml    ✅ ضروری
├── electron/
│   └── main.js                  ✅ ضروری
├── public/
│   ├── fonts/
│   └── icon.png                 ✅ ضروری
├── src/
│   ├── app/
│   ├── components/
│   ├── db/
│   └── lib/
├── package.json                 ✅ ضروری
├── package-lock.json            ✅ ضروری
├── tsconfig.json                ✅ ضروری
├── next.config.ts               ✅ ضروری
└── drizzle.config.json          ✅ ضروری
```

---

## 🎉 تمام!

بعد از دانلود، فایل exe را اجرا کنید و برنامه نصب می‌شود.

---

## ❓ سوالات متداول

**س: چرا باید Public باشد؟**
ج: GitHub Actions برای repo های Private محدودیت دقیقه‌ای دارد، اما Public رایگان است.

**س: آیا سورس کدم لو می‌رود؟**
ج: اگر Public باشد، بله همه می‌توانند ببینند. اگر نگران هستید، Private بسازید (۲۰۰۰ دقیقه رایگان در ماه).

**س: هر بار که Push کنم Build می‌شود؟**
ج: بله، ولی می‌توانید در workflow فقط روی Release تنظیم کنید.

**س: چطور آپدیت بدهم؟**
ج: فایل‌ها را تغییر دهید و Push کنید، خودکار Build جدید می‌شود.
