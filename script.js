  // script.js —— 整檔最終版
  document.addEventListener("DOMContentLoaded", function () {
    /*********************************
     * 小工具：密碼強度 & 元件掛載
     *********************************/
    const COMMON_PW = new Set([
      "123456","12345678","123456789","password","qwerty","111111",
      "abc123","123123","iloveyou","000000","admin","welcome"
    ]);

    function calcPasswordStrength(pw, { username = "", oldPassword = "" } = {}) {
      const tips = [];
      if (!pw) return { score: 0, percent: 0, label: "空白", color: "#ef4444", tips: ["請輸入密碼"] };

      const hasLower = /[a-z]/.test(pw);
      const hasUpper = /[A-Z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      const hasSymbol = /[^A-Za-z0-9]/.test(pw);
      const length = pw.length;
      const repeats = /(.)\1{2,}/.test(pw);
      const spaces = /\s/.test(pw);

      let score = 0;
      if (length >= 8) score += 1; else tips.push("長度至少 8 字元");
      if (length >= 12) score += 1;

      const kinds = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
      if (kinds >= 2) score += 1; else tips.push("混用大小寫 / 數字 / 符號");
      if (kinds >= 3) score += 1;

      if (COMMON_PW.has(pw.toLowerCase())) { score -= 2; tips.push("避免常見密碼"); }
      if (repeats) { score -= 1; tips.push("避免連續重複字元"); }
      if (spaces) { score -= 1; tips.push("避免使用空白"); }

      if (username && pw.toLowerCase().includes(String(username).toLowerCase())) {
        score -= 2; tips.push("密碼請勿包含帳號");
      }
      if (oldPassword && pw === oldPassword) {
        score -= 2; tips.push("新密碼不能與舊密碼相同");
      }

      score = Math.max(0, Math.min(5, score));
      const percent = [0, 25, 50, 70, 85, 100][score];
      const palette = ["#ef4444","#f59e0b","#eab308","#22c55e","#16a34a","#15803d"];
      const labels  = ["極弱","弱","普通","良好","強","超強"];
      return { score, percent, color: palette[score], label: labels[score], tips };
    }

    // 送出時的「門檻」判定（至少 8 碼 + 至少兩種類型）
    function meetsPasswordPolicy(pw, { username = "", oldPassword = "" } = {}) {
      if (!pw || pw.length < 8) return false;
      const kinds = [
        /[a-z]/.test(pw),
        /[A-Z]/.test(pw),
        /\d/.test(pw),
        /[^A-Za-z0-9]/.test(pw),
      ].filter(Boolean).length;
      if (kinds < 2) return false;
      if (username && pw.toLowerCase().includes(String(username).toLowerCase())) return false;
      if (oldPassword && pw === oldPassword) return false;
      return true;
    }

    // 在密碼輸入框下方掛密碼強度條（自動避免重複）
    function mountPwMeter(input, ctx = {}) {
      if (!input || input.dataset.pwMeterMounted === "1") return;
      input.dataset.pwMeterMounted = "1";

      const wrap = document.createElement("div");
      wrap.className = "pw-wrap";
      wrap.innerHTML = `
        <div class="pw-meter"><div class="pw-bar"></div></div>
        <div class="pw-label">強度：—</div>
        <div class="pw-tips"></div>
      `;
      input.insertAdjacentElement("afterend", wrap);

      const bar = wrap.querySelector(".pw-bar");
      const label = wrap.querySelector(".pw-label");
      const tipsBox = wrap.querySelector(".pw-tips");

      function render() {
        const info = calcPasswordStrength(input.value, typeof ctx === "function" ? ctx() : ctx);
        bar.style.width = info.percent + "%";
        bar.style.background = info.color;
        label.textContent = `強度：${info.label}`;
        tipsBox.innerHTML = info.tips && info.tips.length
          ? "<ul>" + info.tips.slice(0,3).map(t => `<li>${t}</li>`).join("") + "</ul>"
          : "";
        return info;
      }
      input.addEventListener("input", render);
      render();
      return { render, getInfo: () => calcPasswordStrength(input.value, ctx) };
    }

    /*********************************
     * 共用元素 & 函式（既有）
     *********************************/
    const exerciseRadios = document.querySelectorAll('input[name="exercise"]');
    const exerciseDetail = document.getElementById("exercise_detail");
    const medRadios = document.querySelectorAll('input[name="medication"]');
    const medicationTime = document.getElementById("medication_time");
    const medicationName = document.getElementById("medication_name");
    const clearBtn = document.getElementById("clearBtn");

    function handleRadioGroupChange(radios, detailEl) {
      if (!radios.length || !detailEl) return;
      radios.forEach((radio) => {
        radio.addEventListener("change", function () {
          const checked = document.querySelector(`input[name="${radio.name}"]:checked`);
          detailEl.classList.toggle("hidden", checked.value !== "yes");
          detailEl.disabled = checked.value !== "yes";
          if (detailEl.required !== undefined) detailEl.required = (checked.value === "yes");
        });
      });
      const initiallyChecked = document.querySelector(`input[name="${radios[0].name}"]:checked`);
      if (initiallyChecked) {
        detailEl.classList.toggle("hidden", initiallyChecked.value !== "yes");
        detailEl.disabled = initiallyChecked.value !== "yes";
        if (detailEl.required !== undefined) detailEl.required = (initiallyChecked.value === "yes");
      }
    }

    function toggleMedicationDetail(show) {
      if (!medicationTime || !medicationName) return;
      medicationTime.classList.toggle("hidden", !show);
      medicationName.classList.toggle("hidden", !show);
      medicationTime.disabled = !show;
      medicationName.disabled = !show;
      medicationTime.required = show;
    }

    /*********************************
     * 首頁控制選單（去重版）
     *********************************/
    const navbar = document.getElementById("navbar") || document.querySelector("nav");
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (navbar && loggedInUser) {
      // 隱藏登入/註冊（若有）
      const loginLink = navbar.querySelector('a[href="login.html"]');
      const signupLink = navbar.querySelector('a[href="signup.html"]');
      if (loginLink) loginLink.style.display = "none";
      if (signupLink) signupLink.style.display = "none";

      if (!navbar.querySelector('a[href="record.html"]')) {
        const recordLink = document.createElement("a");
        recordLink.href = "record.html";
        recordLink.textContent = "填寫";
        navbar.appendChild(recordLink);
      }
      if (!navbar.querySelector('a[href="report.html"]')) {
        const reportLink = document.createElement("a");
        reportLink.href = "report.html";
        reportLink.textContent = "紀錄";
        navbar.appendChild(reportLink);
      }
      if (!navbar.querySelector(".avatar-link")) {
        const accountLink = document.createElement("a");
        accountLink.href = "account.html";
        accountLink.className = "avatar-link";
        accountLink.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" alt="帳號" class="avatar">`;
        navbar.appendChild(accountLink);
      }
    }

    /*********************************
     * account.html 登出
     *********************************/
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
      });
    }

    /*********************************
     * record.html 表單
     *********************************/
    const recordForm = document.getElementById("recordForm");
    if (recordForm) {
      const dateInput = document.getElementById("date");
      const weightInput = document.getElementById("weight");
      const bfGlucoseInput = document.getElementById("bf_glucose");
      const afGlucoseInput = document.getElementById("af_glucose");

      handleRadioGroupChange(exerciseRadios, exerciseDetail);

      medRadios.forEach((radio) => {
        radio.addEventListener("change", function () {
          toggleMedicationDetail(this.value === "yes");
        });
      });

      const initiallyCheckedMed = document.querySelector('input[name="medication"]:checked');
      if (initiallyCheckedMed) toggleMedicationDetail(initiallyCheckedMed.value === "yes");

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (confirm("確定要清空表單內容嗎？")) {
            recordForm.reset();
            handleRadioGroupChange(exerciseRadios, exerciseDetail);
            const checkedMed = document.querySelector('input[name="medication"]:checked');
            toggleMedicationDetail(checkedMed && checkedMed.value === "yes");
            alert("表單已清空！");
          }
        });
      }

      recordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const record = {
          date: dateInput.value,
          weight: parseFloat(weightInput.value),
          exercise: document.querySelector('input[name="exercise"]:checked').value,
          exercise_detail: exerciseDetail.value,
          medication: document.querySelector('input[name="medication"]:checked').value,
          medication_time: medicationTime.value,
          medication_name: medicationName.value,
          bf_glucose: parseFloat(bfGlucoseInput.value),
          af_glucose: parseFloat(afGlucoseInput.value),
          remark: document.getElementById("remark").value,
        };

        let records = JSON.parse(localStorage.getItem("records")) || [];
        records.unshift(record);
        localStorage.setItem("records", JSON.stringify(records));

        // 通知框
        const overlay = document.createElement("div");
        overlay.style.cssText = `
          position: fixed; top:0; left:0; width:100%; height:100%;
          background-color: rgba(0,0,0,0.5); display:flex;
          justify-content:center; align-items:center; z-index:9999;
        `;
        const box = document.createElement("div");
        box.style.cssText = `
          background-color:#fff; padding:20px; border-radius:8px;
          text-align:center; min-width:250px;
        `;
        box.innerHTML = `
          <p>資料已儲存成功！</p>
          <button id="okBtn" style="
            padding:8px 16px; border:none; background-color:#4CAF50;
            color:white; border-radius:4px; cursor:pointer;">收到</button>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        document.getElementById("okBtn").addEventListener("click", function () {
          window.location.href = "report.html";
        });
      });
    }

    /*********************************
     * signup.html 註冊（加上強度門檻）
     *********************************/
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      const signupUser = document.getElementById("username");
      const signupPwd  = document.getElementById("password");
      const message = document.getElementById("message");

      // 強度條
      if (signupPwd) {
        mountPwMeter(signupPwd, () => ({ username: signupUser ? signupUser.value : "" }));
      }

      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const username = (signupUser ? signupUser.value : "").trim();
        const password = (signupPwd ? signupPwd.value : "").trim();
        const securityQuestion = document.getElementById("securityQuestion").value;
        const securityAnswer = document.getElementById("securityAnswer").value.trim();

        let users = JSON.parse(localStorage.getItem("users")) || {};

        if (!username || !password) {
          message.textContent = "請輸入帳號與密碼！";
          message.style.color = "red";
          return;
        }

        // 強度門檻
        if (!meetsPasswordPolicy(password, { username })) {
          message.textContent = "密碼太弱，請至少 8 碼並混用大小寫/數字/符號（至少兩種），且不可包含帳號。";
          message.style.color = "red";
          return;
        }

        if (users[username]) {
          message.textContent = "此帳號已被註冊，請換一個！";
          message.style.color = "red";
        } else {
          users[username] = { password, securityQuestion, securityAnswer };
          localStorage.setItem("users", JSON.stringify(users));
          message.textContent = "註冊成功！將自動前往登入頁...";
          message.style.color = "green";
          setTimeout(() => { window.location.href = "login.html"; }, 1000);
        }
      });
    }

    /*********************************
     * login.html 登入
     *********************************/
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const message = document.getElementById("loginMessage");

        let users = JSON.parse(localStorage.getItem("users")) || {};

        if (users[username] && users[username].password === password) {
          localStorage.setItem("loggedInUser", username);
          message.textContent = "登入成功！即將前往首頁...";
          message.style.color = "green";
          setTimeout(() => { window.location.href = "index.html"; }, 1000);
        } else {
          message.textContent = "帳號或密碼錯誤！";
          message.style.color = "red";
        }
      });
    }

    /*********************************
     * 歡迎登入（去重）
     *********************************/
    if (loggedInUser) {
      const header = document.querySelector("header");
      if (header && !header.querySelector(".welcome-msg")) {
        const welcome = document.createElement("div");
        welcome.className = "welcome-msg";
        welcome.textContent = `歡迎回來～ ${loggedInUser}`;
        header.appendChild(welcome);
      }
    }

    /*********************************
     * account.html 顯示個資 & 進入編輯
     *********************************/
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
      const data = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (data.name) document.getElementById("name").textContent = "姓名: " + data.name;
      if (data.email) document.getElementById("email").textContent = "電子郵件: " + data.email;
      if (data.phone) document.getElementById("phone").textContent = "電話: " + data.phone;
      if (data.birth) document.getElementById("birth").textContent = "生日: " + data.birth;
      if (data.gender) document.getElementById("gender").textContent = "性別: " + data.gender;
      if (data.diabetesType) document.getElementById("diabetesType").textContent = "糖尿病類型: " + data.diabetesType;
      if (data.treatment) document.getElementById("treatment").textContent = "目前治療方式: " + data.treatment;
      if (data.diagnosisDate) document.getElementById("diagnosisDate").textContent = "確診糖尿病時間: " + data.diagnosisDate;
      if (data.familyHistory) document.getElementById("familyHistory").textContent = "家族病史: " + data.familyHistory;

      profileBtn.addEventListener("click", function () {
        window.location.href = "profile.html";
      });
    }

    /*********************************
     * profile.html 編輯個資
     *********************************/
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      const diabetesTypeOtherInput = document.getElementById("diabetesTypeOther");
      diabetesTypeOtherInput.style.display = "none";
      diabetesTypeOtherInput.required = false;

      const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (userProfile) {
        if (userProfile.name) profileForm.name.value = userProfile.name;
        if (userProfile.email) profileForm.email.value = userProfile.email;
        if (userProfile.phone) profileForm.phone.value = userProfile.phone;
        if (userProfile.birth) profileForm.birth.value = userProfile.birth;
        if (userProfile.gender) profileForm.gender.value = userProfile.gender;
        if (userProfile.treatment) profileForm.treatment.value = userProfile.treatment;
        if (userProfile.diagnosisDate) profileForm.diagnosisDate.value = userProfile.diagnosisDate;
        if (userProfile.familyHistory) profileForm.familyHistory.value = userProfile.familyHistory;

        if (userProfile.diabetesType) {
          const radios = profileForm.querySelectorAll('input[name="diabetesType"]');
          let matched = false;
          radios.forEach(radio => {
            if (radio.value === userProfile.diabetesType) {
              radio.checked = true;
              matched = true;
            }
          });
          if (!matched) {
            profileForm.querySelector('input[value="其他"]').checked = true;
            diabetesTypeOtherInput.style.display = 'inline-block';
            diabetesTypeOtherInput.value = userProfile.diabetesType;
            diabetesTypeOtherInput.required = true;
          }
        }
      }

      profileForm.querySelectorAll('input[name="diabetesType"]').forEach(radio => {
        radio.addEventListener('change', function() {
          if (this.value === '其他') {
            diabetesTypeOtherInput.style.display = 'inline-block';
            diabetesTypeOtherInput.required = true;
          } else {
            diabetesTypeOtherInput.style.display = 'none';
            diabetesTypeOtherInput.required = false;
            diabetesTypeOtherInput.value = '';
          }
        });
      });

      profileForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const formData = new FormData(profileForm);
        let diabetesType = formData.get("diabetesType");
        if (diabetesType === "其他") diabetesType = formData.get("diabetesTypeOther") || "其他";

        const newProfile = {
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          birth: formData.get("birth"),
          gender: formData.get("gender"),
          diabetesType,
          treatment: formData.get("treatment"),
          diagnosisDate: formData.get("diagnosisDate"),
          familyHistory: formData.get("familyHistory")
        };

        const overlay = document.createElement("div");
        overlay.style.cssText = `
          position: fixed; top:0; left:0; width:100vw; height:100vh;
          background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:9999;`;

        const box = document.createElement("div");
        box.style.cssText = `
          background:#fff; border-radius:8px; padding:30px 24px 16px 24px;
          min-width:320px; max-width:90vw; box-shadow:0 2px 12px rgba(0,0,0,0.18);`;

        box.innerHTML = `
          <h3 style="margin-top:0;">請確認您的資料</h3>
          <div style="text-align:left; font-size:1em; margin-bottom:18px;">
            <p><b>姓名：</b>${newProfile.name}</p>
            <p><b>電子郵件：</b>${newProfile.email}</p>
            <p><b>電話：</b>${newProfile.phone}</p>
            <p><b>生日：</b>${newProfile.birth}</p>
            <p><b>性別：</b>${newProfile.gender}</p>
            <p><b>糖尿病類型：</b>${newProfile.diabetesType}</p>
            <p><b>目前治療方式：</b>${newProfile.treatment}</p>
            <p><b>確診糖尿病時間：</b>${newProfile.diagnosisDate}</p>
            <p><b>家族病史：</b>${newProfile.familyHistory}</p>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:18px;">
            <button id="cancelProfileConfirm" style="padding:8px 18px; background:#ccc; color:#333; border:none; border-radius:4px;">取消</button>
            <button id="okProfileConfirm" style="padding:8px 18px; background:#4CAF50; color:#fff; border:none; border-radius:4px;">確認送出</button>
          </div>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        document.getElementById("cancelProfileConfirm").onclick = () => document.body.removeChild(overlay);
        document.getElementById("okProfileConfirm").onclick = () => {
          localStorage.setItem("userProfile", JSON.stringify(newProfile));
          document.body.removeChild(overlay);
          window.location.href = "account.html";
        };
      });
    }

    /*********************************
     * 修改密碼（加上強度門檻）
     *********************************/
    const changePwdForm = document.getElementById("changePasswordForm");
    if (changePwdForm) {
      // 掛強度條
      const oldPwdInput = document.getElementById("oldPassword");
      const newPwdInput = document.getElementById("newPassword");
      if (newPwdInput) {
        const logged = localStorage.getItem("loggedInUser") || "";
        let currentPassword = "";
        try {
          const users = JSON.parse(localStorage.getItem("users") || "{}");
          if (logged && users[logged]) currentPassword = users[logged].password || "";
        } catch {}
        mountPwMeter(newPwdInput, { username: logged, oldPassword: oldPwdInput ? oldPwdInput.value : currentPassword });
        if (oldPwdInput) oldPwdInput.addEventListener("input", () => newPwdInput.dispatchEvent(new Event("input")));
      }

      changePwdForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const loggedInUser = localStorage.getItem("loggedInUser");
        const messageEl = document.getElementById("changePasswordMessage");

        if (!loggedInUser) {
          messageEl.textContent = "尚未登入，請先登入。";
          messageEl.style.color = "red";
          setTimeout(() => { window.location.href = "login.html"; }, 1000);
          return;
        }

        const oldPwd = document.getElementById("oldPassword").value.trim();
        const newPwd = document.getElementById("newPassword").value.trim();
        const confirmPwd = document.getElementById("confirmPassword").value.trim();

        if (!oldPwd || !newPwd || !confirmPwd) {
          messageEl.textContent = "請填寫所有欄位。";
          messageEl.style.color = "red";
          return;
        }
        if (newPwd !== confirmPwd) {
          messageEl.textContent = "兩次新密碼輸入不一致。";
          messageEl.style.color = "red";
          return;
        }
        if (oldPwd === newPwd) {
          messageEl.textContent = "新密碼不能與舊密碼相同。";
          messageEl.style.color = "red";
          return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || {};
        if (!users[loggedInUser]) {
          messageEl.textContent = "找不到使用者帳號。";
          messageEl.style.color = "red";
          return;
        }

        const currentPassword = users[loggedInUser].password;
        if (currentPassword !== oldPwd) {
          messageEl.textContent = "舊密碼錯誤。";
          messageEl.style.color = "red";
          return;
        }

        // 強度門檻
        if (!meetsPasswordPolicy(newPwd, { username: loggedInUser, oldPassword: oldPwd })) {
          messageEl.textContent = "新密碼太弱：至少 8 碼、混用兩種以上類型，且不可包含帳號或與舊密碼相同。";
          messageEl.style.color = "red";
          return;
        }

        // 更新密碼
        users[loggedInUser].password = newPwd;
        localStorage.setItem("users", JSON.stringify(users));

        messageEl.textContent = "密碼修改成功，請重新登入。";
        messageEl.style.color = "green";

        setTimeout(() => {
          localStorage.removeItem("loggedInUser");
          window.location.href = "login.html";
        }, 1200);
      });
    }

    /*********************************
     * index.html 最新諮詢
     *********************************/
    const box = document.getElementById("latestConsults");
    if (box) {
      let consultations = JSON.parse(localStorage.getItem("consultations")) || [];
      const latest = consultations.slice(-3).reverse();
      if (latest.length === 0) {
        box.textContent = "目前還沒有諮詢問題。";
      } else {
        latest.forEach(c => {
          const div = document.createElement("div");
          div.className = "question";
          div.textContent = c.question;
          box.appendChild(div);
        });
      }
    }

    /*********************************
     * consult.html 載入所有諮詢
     *********************************/
    const form = document.getElementById("consultForm");
    const input = document.getElementById("questionInput");
    const list = document.getElementById("consultList");
    if (form && input && list) {
      let consultations = JSON.parse(localStorage.getItem("consultations")) || [];
      function saveConsultations() {
        localStorage.setItem("consultations", JSON.stringify(consultations));
      }
      function renderList() {
        list.innerHTML = "";
        consultations.slice().reverse().forEach(c => {
          const div = document.createElement("div");
          div.className = "consult-item";
          div.innerHTML = `
            <div class="q">❓ ${c.question}</div>
            <div class="time">${c.time}</div>
            <div class="a">💬 尚未回覆</div>
          `;
          list.appendChild(div);
        });
      }
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const newConsult = { question: text, time: new Date().toLocaleString() };
        consultations.push(newConsult);
        saveConsultations();
        renderList();
        input.value = "";
      });
      renderList();
    }

    /*********************************
     * reset.html 忘記密碼（加強度門檻 + 用 .hidden 控制）
     *********************************/
    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
      const securitySection = document.getElementById("securitySection");
      const securityQuestionText = document.getElementById("securityQuestionText");
      const securityAnswerInput = document.getElementById("securityAnswerInput");
      const checkAnswerBtn = document.getElementById("checkAnswerBtn");

      const newPasswordSection = document.getElementById("newPasswordSection");
      const newPasswordInput = document.getElementById("newPassword");
      const resetPasswordBtn = document.getElementById("resetPasswordBtn");

      const resetMessage = document.getElementById("resetMessage");

      let currentUser = null;

      const QUESTION_TEXT = {
        pet: "你的小學名字是？",
        food: "你最喜歡的食物是？",
        movie: "你最喜歡的電影是？",
      };

      // 掛強度條（顯示時也會即時刷新）
      if (newPasswordInput) {
        const resetUserInput = document.getElementById("resetUsername");
        mountPwMeter(newPasswordInput, () => ({ username: resetUserInput ? resetUserInput.value : "" }));
      }

      // 第一步：輸入帳號，顯示安全問題
      resetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        resetMessage.textContent = "";

        const username = document.getElementById("resetUsername").value.trim();
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        const user = users[username];

        if (!user) {
          resetMessage.textContent = "查無此帳號！";
          resetMessage.style.color = "red";
          securitySection.classList.add("hidden");
          newPasswordSection.classList.add("hidden");
          return;
        }

        currentUser = username;
        securityQuestionText.textContent = QUESTION_TEXT[user.securityQuestion] || "請回答你的安全問題";

        securitySection.classList.remove("hidden");
        newPasswordSection.classList.add("hidden");
        securityAnswerInput.value = "";
        securityAnswerInput.focus();
      });

      // 第二步：檢查答案是否正確
      checkAnswerBtn.addEventListener("click", function () {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        if (!currentUser || !users[currentUser]) return;

        const expected = (users[currentUser].securityAnswer || "").trim().toLowerCase();
        const got = (securityAnswerInput.value || "").trim().toLowerCase();

        if (got && got === expected) {
          resetMessage.textContent = "驗證成功，請輸入新密碼";
          resetMessage.style.color = "green";
          newPasswordSection.classList.remove("hidden");
          newPasswordInput.value = "";
          newPasswordInput.focus();
          newPasswordInput.dispatchEvent(new Event("input")); // 刷新強度條
        } else {
          resetMessage.textContent = "答案錯誤！";
          resetMessage.style.color = "red";
          newPasswordSection.classList.add("hidden");
        }
      });

      // 第三步：設定新密碼（含強度門檻）
      resetPasswordBtn.addEventListener("click", function () {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        const newPassword = (newPasswordInput.value || "").trim();
        if (!currentUser || !users[currentUser]) return;

        if (!meetsPasswordPolicy(newPassword, { username: currentUser })) {
          resetMessage.textContent = "密碼太弱，請至少 8 碼並混用大小寫/數字/符號（至少兩種），且不可包含帳號。";
          resetMessage.style.color = "red";
          return;
        }

        users[currentUser].password = newPassword;
        localStorage.setItem("users", JSON.stringify(users));

        resetMessage.textContent = "密碼已成功重設！請回到登入頁";
        resetMessage.style.color = "green";

        newPasswordSection.classList.add("hidden");
        securitySection.classList.add("hidden");
        resetForm.reset();
      });
    }

    /*************************
 * 吃藥提醒（localStorage + Notification + .ics）
 *************************/
(function medsReminderModule(){
  const LS_KEY = "reminders"; // [{id,title,timeHHMM,days[0-6],enabled,lastFired:'YYYY-MM-DD'}]

  // 登入後自動在 navbar 加「提醒」連結
  const navbar = document.getElementById("navbar") || document.querySelector("nav");
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (navbar && loggedInUser && !navbar.querySelector('a[href="reminders.html"]')) {
    const a = document.createElement("a");
    a.href = "reminders.html";
    a.textContent = "提醒";
    navbar.appendChild(a);
  }

  // 這些元素只有 reminders.html 會存在
  const reminderForm = document.getElementById("reminderForm");
  const listEl = document.getElementById("remindersList");
  const emptyEl = document.getElementById("remindersEmpty");
  const btnAskPerm = document.getElementById("btnAskPerm");
  const btnTestNotif = document.getElementById("btnTestNotif");
  const notifStatus = document.getElementById("notifStatus");
  const btnExportICS = document.getElementById("btnExportICS");

  // 工具
  const pad2 = (n) => (n<10? "0"+n : ""+n);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const nowHHMM = () => { const d=new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const nowWeekday = () => new Date().getDay(); // 0(日)~6(六)

  const loadReminders = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const saveReminders = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  async function ensurePermission(){
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    try { return await Notification.requestPermission(); }
    catch { return Notification.permission; }
  }

  function showNotification(title, body){
    if (!("Notification" in window)) { alert(`${title}\n\n${body}`); return; }
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else {
      alert(`${title}\n\n${body}`);
    }
  }

  // 每分鐘整分檢查
  function startTicker(){
    checkDue();
    const delay = 60000 - (Date.now() % 60000);
    setTimeout(() => { checkDue(); setInterval(checkDue, 60*1000); }, delay);
  }

  function checkDue(){
    const hhmm = nowHHMM();
    const w = nowWeekday();
    const iso = todayISO();
    let arr = loadReminders();
    let changed = false;

    arr.forEach(r => {
      if (!r.enabled) return;
      if (!r.days || r.days.length === 0) return;
      if (r.timeHHMM !== hhmm) return;
      if (!r.days.includes(w)) return;
      if (r.lastFired === iso) return; // 今天已提醒過

      // 觸發一次
      showNotification("吃藥提醒", `${r.title} - 現在 ${r.timeHHMM}`);
      r.lastFired = iso;
      changed = true;
    });

    if (changed) saveReminders(arr);
  }

  // ===== reminders.html 才需要的 UI 綁定 =====
  if (reminderForm && listEl && emptyEl){
    function renderPerm(){
      if (!("Notification" in window)){
        notifStatus.textContent = "瀏覽器不支援通知 API，會改用彈窗；建議使用 Chrome/Edge。";
        return;
      }
      notifStatus.textContent = `通知權限：${Notification.permission}`;
    }
    renderPerm();

    btnAskPerm?.addEventListener("click", async () => {
      const p = await ensurePermission();
      renderPerm();
      if (p === "granted") showNotification("太好了！", "已開啟通知權限。");
    });

    btnTestNotif?.addEventListener("click", () => {
      showNotification("測試通知", "這是一則測試訊息 ✅");
    });

    // 勾「每天」會全選星期
    const chkEveryday = document.getElementById("r_everyday");
    chkEveryday?.addEventListener("change", () => {
      const boxes = document.querySelectorAll('input[name="r_days"]');
      boxes.forEach(b => b.checked = chkEveryday.checked);
    });

    reminderForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("r_title").value.trim();
      const time = document.getElementById("r_time").value;
      const days = [...document.querySelectorAll('input[name="r_days"]:checked')].map(b => parseInt(b.value,10));

      if (!title || !time || days.length===0){
        alert("請輸入標題、選擇時間與至少一個星期。");
        return;
      }

      const r = {
        id: Date.now().toString(36),
        title,
        timeHHMM: time,
        days,
        enabled: true,
        lastFired: null,
      };
      const arr = loadReminders();
      arr.push(r);
      saveReminders(arr);
      reminderForm.reset();
      renderList();
    });

    function renderList(){
      const arr = loadReminders();
      emptyEl.style.display = arr.length ? "none" : "block";
      listEl.innerHTML = "";

      const dayName = (d) => ["週日","週一","週二","週三","週四","週五","週六"][d];

      arr.forEach(r => {
        const item = document.createElement("div");
        item.className = "item";
        item.innerHTML = `
          <input type="checkbox" class="switch" ${r.enabled ? "checked": ""} title="啟用/停用">
          <div class="meta">
            <div><b>${r.title}</b> <span class="badge">${r.timeHHMM}</span></div>
            <div class="muted">${r.days.map(dayName).join("、")}</div>
          </div>
          <button class="btn secondary btn-del">刪除</button>
        `;

        // 啟用/停用
        const sw = item.querySelector(".switch");
        sw.addEventListener("change", () => {
          const arr = loadReminders();
          const idx = arr.findIndex(x => x.id === r.id);
          if (idx >= 0){ arr[idx].enabled = sw.checked; saveReminders(arr); }
        });

        // 刪除
        item.querySelector(".btn-del").addEventListener("click", () => {
          if (!confirm("確定刪除這個提醒？")) return;
          const arr = loadReminders().filter(x => x.id !== r.id);
          saveReminders(arr);
          renderList();
        });

        listEl.appendChild(item);
      });
    }

    // 匯出 .ics（全部提醒）
    btnExportICS?.addEventListener("click", () => {
      const reminders = loadReminders();
      if (!reminders.length){ alert("沒有提醒可匯出。"); return; }

      const bydayMap = { 0:"SU",1:"MO",2:"TU",3:"WE",4:"TH",5:"FR",6:"SA" };
      const now = new Date();
      const y = now.getFullYear(), m = pad2(now.getMonth()+1), d = pad2(now.getDate());
      let ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-/Diabetes Helper/Meds Reminder/TW"
      ];

      reminders.forEach(r => {
        const hh = r.timeHHMM.slice(0,2), mm = r.timeHHMM.slice(3,5);
        const DTSTART = `${y}${m}${d}T${hh}${mm}00`;
        const BYDAY = r.days.map(n => bydayMap[n]).join(",");
        const uid = `${r.id}@diabetes-helper`;

        ics.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTART:${DTSTART}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY}`,
          `SUMMARY:${String(r.title + "（吃藥提醒）").replace(/([,;])/g,"\\$1")}`,
          "END:VEVENT"
        );
      });

      ics.push("END:VCALENDAR");
      const blob = new Blob([ics.join("\r\n")], {type:"text/calendar;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "meds-reminders.ics"; a.click();
      URL.revokeObjectURL(url);
    });

    renderList();
    startTicker();
  } else {
    // 即使不在 reminders.html，仍啟動背景檢查（頁面開著就會提醒）
    startTicker();
  }
})();

/* ========== 站內橫幅提醒（頁面開著就有用） ========== */
(function inAppBanner(){
  // 建橫幅
  const bar = document.createElement('div');
  bar.className = 'inapp-alert';
  bar.innerHTML = `
    <span id="iaText">到時間囉！</span>
    <button id="iaSnooze" class="btn secondary">稍後 10 分</button>
    <button id="iaDone" class="btn primary">已服用</button>
    <button id="iaClose" class="btn secondary">忽略</button>
  `;
  document.body.appendChild(bar);
  const iaText  = bar.querySelector('#iaText');
  const btnDone = bar.querySelector('#iaDone');
  const btnClose= bar.querySelector('#iaClose');
  const btnSnooze = bar.querySelector('#iaSnooze');

  const LS_REMINDERS = "reminders";            // 提醒清單
  const LS_TAKEN     = "reminders_taken";      // { 'YYYY-MM-DD': { id: true } }
  const LS_SNOOZE    = "reminder_snoozed";     // { 'YYYY-MM-DD HH:MM': true }

  // ---- 小工具 ----
  const pad2 = n => n<10 ? "0"+n : ""+n;
  const todayISO = () => new Date().toISOString().slice(0,10);
  const nowHHMM  = () => { const d=new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const nowKeyMin= () => new Date().toISOString().slice(0,16); // YYYY-MM-DD HH:MM

  const loadJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); } catch { return def; } };
  const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const loadReminders = () => loadJSON(LS_REMINDERS, []);
  const loadTaken     = () => loadJSON(LS_TAKEN, {});
  const saveTaken     = (o) => saveJSON(LS_TAKEN, o);
  const loadSnooze    = () => loadJSON(LS_SNOOZE, {});
  const saveSnooze    = (o) => saveJSON(LS_SNOOZE, o);

  let currentR = null;

  function tick(){
    const arr = loadReminders();
    if (!arr.length) return;

    // 打盹：這分鐘被延後就不彈
    const snoozed = loadSnooze();
    if (snoozed[nowKeyMin()]) return;

    const hhmm = nowHHMM();
    const w = new Date().getDay();             // 0-6
    const iso = todayISO();
    const taken = loadTaken()[iso] || {};

    // 找第一個「到點、啟用、今天該吃、且今天尚未標註已服用」
    const due = arr.find(r =>
      r.enabled !== false &&
      r.timeHHMM === hhmm &&
      Array.isArray(r.days) && r.days.includes(w) &&
      !taken[r.id]
    );

    if (due) {
      currentR = due;
      iaText.textContent = `吃藥提醒：${due.title}（${due.timeHHMM}）`;
      bar.classList.add('show');

      // 標題閃爍
      const orig = document.title;
      let count=0; const t = setInterval(()=>{
        document.title = (count++%2===0) ? '⏰ 吃藥提醒！' : orig;
      }, 800);

      // 關閉
      btnClose.onclick = () => { bar.classList.remove('show'); clearInterval(t); document.title = orig; };

      // 稍後 10 分鐘
      btnSnooze.onclick = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 10);
        const key = d.toISOString().slice(0,16); // 到分鐘
        const all = loadSnooze();
        all[key] = true;
        saveSnooze(all);
        bar.classList.remove('show'); clearInterval(t); document.title = orig;
      };

      // 已服用：標記今天 + 寫一筆到 records
      btnDone.onclick = () => {
        // 1) 標記今天已服用
        const all = loadTaken();
        all[iso] = all[iso] || {};
        all[iso][currentR.id] = true;
        saveTaken(all);

        // 2) 寫入一筆用藥紀錄（讓 report 看得到）
        try {
          const now = new Date();
          const rec = {
            date: iso,
            weight: null,
            exercise: "no",
            exercise_detail: "",
            medication: "yes",
            medication_time: now.toTimeString().slice(0,5),  // HH:MM
            medication_name: currentR ? currentR.title : "未指定",
            bf_glucose: null,
            af_glucose: null,
            remark: "提醒勾選（站內）"
          };
          const records = loadJSON("records", []);
          records.unshift(rec);
          saveJSON("records", records);
        } catch(e) { console.warn("寫入用藥紀錄失敗", e); }

        bar.classList.remove('show'); clearInterval(t); document.title = orig;
      };
    }
  }

  // 每分鐘整點檢查
  function start(){
    tick();
    const delay = 60000 - (Date.now() % 60000);
    setTimeout(()=>{ tick(); setInterval(tick, 60000); }, delay);
  }
  start();
})();


/* ========== 今日清單（顯示今天該吃哪些，打勾就記錄） ========== */
(function todayChecklist(){
  const mount = document.getElementById('todayMeds');
  if (!mount) return;

  const LS_KEY = "reminders";
  const TAKEN_KEY = "reminders_taken";
  const pad2 = n => n<10? "0"+n : ""+n;
  const todayISO = () => new Date().toISOString().slice(0,10);
  const weekday = () => new Date().getDay();

  const loadReminders = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const loadTaken = () => JSON.parse(localStorage.getItem(TAKEN_KEY) || "{}");
  const saveTaken = obj => localStorage.setItem(TAKEN_KEY, JSON.stringify(obj));

  function render(){
    const arr = loadReminders().filter(r => r.enabled !== false && r.days?.includes(weekday()));
    arr.sort((a,b)=> a.timeHHMM.localeCompare(b.timeHHMM));

    const iso = todayISO();
    const taken = loadTaken()[iso] || {};

    if (!arr.length) { mount.innerHTML = '<div class="muted">今天沒有排定提醒。</div>'; return; }

    mount.innerHTML = arr.map(r => `
      <label style="display:flex;align-items:center;gap:10px;margin:6px 0;">
        <input type="checkbox" data-id="${r.id}" ${taken[r.id] ? 'checked' : ''}>
        <span><b>${r.timeHHMM}</b>－${r.title}</span>
      </label>
    `).join('');

    mount.querySelectorAll('input[type="checkbox"]').forEach(chk=>{
      chk.addEventListener('change', ()=>{
        const all = loadTaken();
        all[iso] = all[iso] || {};
        all[iso][chk.dataset.id] = chk.checked;
        saveTaken(all);
      });
    });
  }

  render();
  // 每 5 分鐘刷新一次（跨頁或新增提醒時保持同步）
  setInterval(render, 5*60*1000);
})();

  // ---- 密碼顯示/隱藏通用
  (function(){
    const input = document.getElementById("password") || document.getElementById("newPassword");
    const btn = document.getElementById("btnTogglePwd");
    if (input && btn) {
      btn.addEventListener("click", ()=>{
        const on = input.type === "password";
        input.type = on ? "text" : "password";
        btn.textContent = on ? "隱藏" : "顯示";
      });
    }
  })();

  // ---- 匯出 records 為 CSV
(function(){
  const btn = document.getElementById("btnExportCSV");
  if (!btn) return;
  btn.addEventListener("click", ()=>{
    const rows = JSON.parse(localStorage.getItem("records") || "[]");
    if (!rows.length) { alert("目前沒有紀錄可匯出。"); return; }
    const header = ["日期","體重","運動","運動說明","用藥","用藥時間","藥名","餐前血糖","餐後血糖","備註"];
    const csv = [header]
      .concat(rows.map(r=>[
        r.date, r.weight ?? "", r.exercise ?? "", r.exercise_detail ?? "",
        r.medication ?? "", r.medication_time ?? "", r.medication_name ?? "",
        r.bf_glucose ?? "", r.af_glucose ?? "", (r.remark ?? "").replace(/\n/g," ")
      ]))
      .map(row => row.map(x => `"${String(x).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "records.csv"; a.click();
    URL.revokeObjectURL(url);
  });
})();



  });
