# 糖尿病小護士

## 專案介紹（Description）
本專案是一個專為糖尿病患者設計的前端網頁應用程式，名為「糖尿病小護士」。其核心目標是提供糖尿病衛教資訊，並協助使用者進行自主健康管理。

### 核心功能
- **衛教資訊**
  - 提供糖尿病種類（第一型、第二型、妊娠型等）的科普知識。

- **健康紀錄**
  - 使用者可填寫並儲存體重、餐前後血糖、運動及用藥紀錄。

- **智慧用藥提醒**
  - 具備瀏覽器推播通知。
  - 提供站內橫幅提醒。
  - 支援匯出 `.ics` 行事曆檔案。

- **安全驗證**
  - 註冊與修改密碼時具備密碼強度偵測。
  - 提供安全問題找回機制。

- **數據匯出**
  - 支援將個人健康紀錄匯出為 `.csv` 檔案。

---

## 運行環境需求（Requirement）
- **瀏覽器**：Google Chrome / Microsoft Edge（建議最新版本）
- **Node.js**：14.0.0 以上
- **npm**：隨 Node.js 安裝

---

## 環境檔（.env Setting）
本專案為純前端應用，資料儲存於瀏覽器 `localStorage`，目前無需設定 `.env`。

---

## 在 Local 端的安裝與運行步驟（Build Setup - Local）

### 1. 複製專案
git clone <your-repository-url>

### 2. 安裝依賴
npm install

### 3. 運行專案
- 方式 A：直接開啟 `index.html`
- 方式 B：使用 VS Code Live Server

---

## 在 Server 端的安裝與驗證步驟（Build Setup - Server）

### 部署方式
- GitHub Pages
- Vercel
- 傳統 Web Server

### 驗證方式
1. 開啟網站
2. 確認首頁正常
3. 測試註冊流程

---

## 可提供支援的同仁（Support）
- Kathy1155（呂欣樺）

---

## 注意事項（Warning）

### 數據隱私
使用 `localStorage` 儲存資料，清除瀏覽器或更換裝置會遺失資料。

### 通知權限
需允許瀏覽器通知功能。

---

## 系統架構（System Architecture）

- **UI 層**
  - HTML5 / CSS3

- **邏輯層**
  - Vanilla JavaScript

- **儲存層**
  - LocalStorage

---

## 使用者操作手冊（User Manual）

### 註冊 / 登入
- 密碼需包含大小寫、數字、符號，至少 8 碼

### 填寫紀錄
1. 點選填寫
2. 輸入資料
3. 儲存

### 提醒設定
1. 新增用藥時間
2. 系統會提醒

### 數據管理
- 查看資料
- 匯出 CSV

---

## Function Map
- `calcPasswordStrength()`：密碼強度
- `medsReminderModule()`：提醒邏輯
- `handleRadioGroupChange()`：表單控制
- `btnExportCSV`：匯出 CSV

---

## 測試（Testing）
目前尚未導入測試框架，未來可補強密碼邏輯測試。

---
