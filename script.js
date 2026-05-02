document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  const protectedPages = new Set(["record", "report", "reminders", "account", "profile"]);

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const loggedInUser = () => localStorage.getItem("loggedInUser") || "";
  const userKey = (base) => `${base}_${loggedInUser() || "guest"}`;
  const makeId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };
  const todayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setMessage(el, text, type = "") {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("success", "error");
    if (type) el.classList.add(type);
  }

  function requireLogin() {
    if (!protectedPages.has(page) || loggedInUser()) return true;
    const main = $("main");
    if (main) {
      main.innerHTML = `
        <section class="form-card">
          <h2>請先登入</h2>
          <p class="muted">這個頁面需要登入後才能使用。</p>
          <a class="button" href="login.html">前往登入</a>
        </section>
      `;
    }
    return false;
  }

  function renderNav() {
    const nav = $("#navbar");
    if (!nav) return;

    const user = loggedInUser();
    const items = user
      ? [
          ["首頁", "index.html"],
          ["諮詢", "consult.html"],
          ["新增紀錄", "record.html"],
          ["健康報表", "report.html"],
          ["用藥提醒", "reminders.html"],
          ["帳號中心", "account.html"],
        ]
      : [
          ["首頁", "index.html"],
          ["諮詢", "consult.html"],
          ["註冊", "signup.html"],
          ["登入", "login.html"],
        ];

    nav.innerHTML = `<a class="nav-brand" href="index.html">糖尿病健康管理</a>`;
    items.forEach(([label, href]) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      nav.appendChild(a);
    });

    if (user) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "登出";
      btn.addEventListener("click", logout);
      nav.appendChild(btn);
    }
  }

  function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }

  function calcPasswordStrength(pw, username = "", oldPassword = "") {
    const tips = [];
    if (!pw) {
      return { score: 0, percent: 0, label: "尚未輸入", color: "#b42318", tips: ["請輸入密碼"] };
    }

    let score = 0;
    const kinds = [/[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
    const common = new Set(["123456", "12345678", "password", "qwerty", "111111", "abc123", "admin"]);

    if (pw.length >= 8) score += 1;
    else tips.push("至少 8 個字元");
    if (pw.length >= 12) score += 1;
    if (kinds >= 2) score += 1;
    else tips.push("混用英文、數字或符號至少兩種");
    if (kinds >= 3) score += 1;
    if (!common.has(pw.toLowerCase())) score += 1;
    else tips.push("避免使用常見密碼");
    if (username && pw.toLowerCase().includes(username.toLowerCase())) {
      score -= 2;
      tips.push("密碼不應包含帳號");
    }
    if (oldPassword && pw === oldPassword) {
      score -= 2;
      tips.push("新密碼不可與舊密碼相同");
    }

    score = Math.max(0, Math.min(5, score));
    const labels = ["很弱", "偏弱", "普通", "良好", "強", "很強"];
    const colors = ["#b42318", "#b45309", "#ca8a04", "#3b82c4", "#005AB5", "#00498f"];
    return {
      score,
      percent: [0, 25, 50, 70, 85, 100][score],
      label: labels[score],
      color: colors[score],
      tips,
    };
  }

  function meetsPasswordPolicy(pw, username = "", oldPassword = "") {
    const info = calcPasswordStrength(pw, username, oldPassword);
    return pw.length >= 8 && info.score >= 2;
  }

  function mountPasswordMeter(input, context = {}) {
    if (!input || input.dataset.meterMounted) return;
    input.dataset.meterMounted = "1";
    const wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    wrap.innerHTML = `
      <div class="pw-meter"><div class="pw-bar"></div></div>
      <div class="pw-label"></div>
      <div class="pw-tips"></div>
    `;
    input.closest(".input-row")?.insertAdjacentElement("afterend", wrap) || input.insertAdjacentElement("afterend", wrap);

    const bar = $(".pw-bar", wrap);
    const label = $(".pw-label", wrap);
    const tips = $(".pw-tips", wrap);

    const render = () => {
      const ctx = typeof context === "function" ? context() : context;
      const info = calcPasswordStrength(input.value, ctx.username || "", ctx.oldPassword || "");
      bar.style.width = `${info.percent}%`;
      bar.style.background = info.color;
      label.textContent = `密碼強度：${info.label}`;
      tips.innerHTML = info.tips.length ? `<ul>${info.tips.map((tip) => `<li>${escapeHTML(tip)}</li>`).join("")}</ul>` : "";
    };

    input.addEventListener("input", render);
    render();
  }

  function mountPasswordToggle() {
    const btn = $("#btnTogglePwd");
    if (!btn) return;
    const input = $("#password") || $("#newPassword");
    if (!input) return;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "隱藏" : "顯示";
    });
  }

  function initSignup() {
    const form = $("#signupForm");
    if (!form) return;
    const usernameEl = $("#username");
    const passwordEl = $("#password");
    const message = $("#message");
    mountPasswordMeter(passwordEl, () => ({ username: usernameEl.value.trim() }));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = usernameEl.value.trim();
      const password = passwordEl.value;
      const question = $("#securityQuestion").value;
      const answer = $("#securityAnswer").value.trim();
      const users = storage.get("users", {});

      if (!username || !password || !question || !answer) {
        setMessage(message, "請完整填寫註冊資料。", "error");
        return;
      }
      if (users[username]) {
        setMessage(message, "此帳號已存在，請使用其他帳號。", "error");
        return;
      }
      if (!meetsPasswordPolicy(password, username)) {
        setMessage(message, "密碼強度不足，請至少 8 碼並混用不同字元類型。", "error");
        return;
      }

      users[username] = {
        password,
        securityQuestion: question,
        securityAnswer: answer,
        createdAt: new Date().toISOString(),
      };
      storage.set("users", users);
      setMessage(message, "註冊成功，正在前往登入頁。", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 700);
    });
  }

  function initLogin() {
    const form = $("#loginForm");
    if (!form) return;
    const message = $("#loginMessage");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = $("#username").value.trim();
      const password = $("#password").value;
      const users = storage.get("users", {});

      if (users[username]?.password === password) {
        localStorage.setItem("loggedInUser", username);
        setMessage(message, "登入成功，正在前往首頁。", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 500);
      } else {
        setMessage(message, "帳號或密碼錯誤。", "error");
      }
    });
  }

  function initReset() {
    const form = $("#resetForm");
    if (!form) return;
    const message = $("#resetMessage");
    const securitySection = $("#securitySection");
    const newPasswordSection = $("#newPasswordSection");
    const questionText = $("#securityQuestionText");
    const passwordEl = $("#newPassword");
    let resetUser = "";

    mountPasswordMeter(passwordEl, () => ({ username: resetUser }));

    const questionLabels = {
      pet: "你第一隻寵物的名字是什麼？",
      food: "你最喜歡的食物是什麼？",
      movie: "你最喜歡的電影是什麼？",
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = $("#resetUsername").value.trim();
      const users = storage.get("users", {});
      if (!users[username]) {
        setMessage(message, "查無此帳號。", "error");
        return;
      }
      resetUser = username;
      questionText.textContent = questionLabels[users[username].securityQuestion] || "請回答註冊時設定的安全問題";
      securitySection.classList.remove("hidden");
      newPasswordSection.classList.add("hidden");
      setMessage(message, "請回答安全問題。", "success");
    });

    $("#checkAnswerBtn")?.addEventListener("click", () => {
      const users = storage.get("users", {});
      const answer = $("#securityAnswerInput").value.trim();
      if (answer && users[resetUser]?.securityAnswer === answer) {
        newPasswordSection.classList.remove("hidden");
        setMessage(message, "驗證成功，請輸入新密碼。", "success");
      } else {
        setMessage(message, "安全問題答案錯誤。", "error");
      }
    });

    $("#resetPasswordBtn")?.addEventListener("click", () => {
      const users = storage.get("users", {});
      const newPassword = passwordEl.value;
      if (!meetsPasswordPolicy(newPassword, resetUser)) {
        setMessage(message, "密碼強度不足，請重新設定。", "error");
        return;
      }
      users[resetUser].password = newPassword;
      storage.set("users", users);
      setMessage(message, "密碼已更新，請回到登入頁。", "success");
      form.reset();
      $("#securityAnswerInput").value = "";
      passwordEl.value = "";
    });
  }

  function initRecord() {
    const form = $("#recordForm");
    if (!form) return;
    const dateEl = $("#date");
    const message = $("#formMessage");
    const exerciseDetail = $("#exercise_detail");
    const medicationFields = $("#medicationFields");
    const medicationTime = $("#medication_time");
    const medicationName = $("#medication_name");

    dateEl.value = todayISO();

    function syncExercise() {
      const hasExercise = $("input[name='exercise']:checked")?.value === "yes";
      exerciseDetail.classList.toggle("hidden", !hasExercise);
      exerciseDetail.disabled = !hasExercise;
      if (!hasExercise) exerciseDetail.value = "";
    }

    function syncMedication() {
      const hasMedication = $("input[name='medication']:checked")?.value === "yes";
      medicationFields.classList.toggle("hidden", !hasMedication);
      medicationTime.disabled = !hasMedication;
      medicationName.disabled = !hasMedication;
      medicationTime.required = hasMedication;
      if (!hasMedication) {
        medicationTime.value = "";
        medicationName.value = "";
      }
    }

    $$("input[name='exercise']").forEach((radio) => radio.addEventListener("change", syncExercise));
    $$("input[name='medication']").forEach((radio) => radio.addEventListener("change", syncMedication));
    syncExercise();
    syncMedication();

    $("#clearBtn")?.addEventListener("click", () => {
      form.reset();
      dateEl.value = todayISO();
      syncExercise();
      syncMedication();
      setMessage(message, "表單已清除。", "success");
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const record = {
        id: makeId(),
        user: loggedInUser(),
        date: dateEl.value,
        weight: Number($("#weight").value),
        exercise: $("input[name='exercise']:checked").value,
        exercise_detail: exerciseDetail.value.trim(),
        medication: $("input[name='medication']:checked").value,
        medication_time: medicationTime.value,
        medication_name: medicationName.value.trim(),
        bf_glucose: Number($("#bf_glucose").value),
        af_glucose: Number($("#af_glucose").value),
        remark: $("#remark").value.trim(),
        createdAt: new Date().toISOString(),
      };

      const records = storage.get("records", []);
      records.unshift(record);
      storage.set("records", records);
      setMessage(message, "紀錄已儲存。", "success");
      form.reset();
      dateEl.value = todayISO();
      syncExercise();
      syncMedication();
    });
  }

  function getUserRecords() {
    const user = loggedInUser();
    return storage.get("records", []).filter((record) => record.user === user);
  }

  function glucoseStatus(value) {
    const val = Number(value);
    if (!Number.isFinite(val) || val <= 0) return "無資料";
    if (val < 70) return "偏低";
    if (val <= 140) return "正常";
    if (val <= 200) return "偏高";
    return "過高";
  }

  function average(values) {
    const nums = values.map(Number).filter((v) => Number.isFinite(v) && v > 0);
    if (!nums.length) return "-";
    return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
  }

  function initReport() {
    const tbody = $("#reportBody");
    if (!tbody) return;
    const records = getUserRecords().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestFirst = records.slice().reverse();

    const summary = $("#reportSummary");
    if (summary) {
      summary.innerHTML = `
        <article class="summary-card"><span>紀錄筆數</span><strong>${records.length}</strong></article>
        <article class="summary-card"><span>平均飯前血糖</span><strong>${average(records.map((r) => r.bf_glucose))} mg/dL</strong></article>
        <article class="summary-card"><span>平均飯後血糖</span><strong>${average(records.map((r) => r.af_glucose))} mg/dL</strong></article>
      `;
    }

    if (!latestFirst.length) {
      tbody.innerHTML = `<tr><td colspan="8">目前沒有紀錄，請先到「填寫紀錄」新增資料。</td></tr>`;
    } else {
      tbody.innerHTML = latestFirst.map((record) => {
        const exercise = record.exercise === "yes" ? `有${record.exercise_detail ? `：${escapeHTML(record.exercise_detail)}` : ""}` : "沒有";
        const medication = record.medication === "yes"
          ? `${escapeHTML(record.medication_time || "-")}${record.medication_name ? `：${escapeHTML(record.medication_name)}` : ""}`
          : "沒有";
        return `
          <tr>
            <td>${escapeHTML(record.date)}</td>
            <td>${escapeHTML(record.weight ?? "-")}</td>
            <td>${exercise}</td>
            <td>${medication}</td>
            <td>${escapeHTML(record.bf_glucose ?? "-")}</td>
            <td>${escapeHTML(record.af_glucose ?? "-")}</td>
            <td><span class="badge">${glucoseStatus(record.af_glucose)}</span></td>
            <td>${escapeHTML(record.remark || "")}</td>
          </tr>
        `;
      }).join("");
    }

    const canvas = $("#glucoseChart");
    if (canvas && window.Chart) {
      new Chart(canvas, {
        type: "line",
        data: {
          labels: records.map((r) => r.date),
          datasets: [
            {
              label: "飯前血糖",
              data: records.map((r) => r.bf_glucose || null),
              borderColor: "#005AB5",
              backgroundColor: "rgba(0, 90, 181, 0.12)",
              tension: 0.25,
            },
            {
              label: "飯後血糖",
              data: records.map((r) => r.af_glucose || null),
              borderColor: "#4b5563",
              backgroundColor: "rgba(75, 85, 99, 0.12)",
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
          },
          scales: {
            y: {
              title: { display: true, text: "mg/dL" },
              suggestedMin: 60,
            },
          },
        },
      });
    }

    $("#btnExportCSV")?.addEventListener("click", () => {
      if (!latestFirst.length) {
        alert("目前沒有紀錄可以下載。");
        return;
      }
      const header = ["日期", "體重", "運動", "運動內容", "用藥", "用藥時間", "藥物名稱", "飯前血糖", "飯後血糖", "備註"];
      const rows = latestFirst.map((r) => [
        r.date,
        r.weight ?? "",
        r.exercise === "yes" ? "有" : "沒有",
        r.exercise_detail ?? "",
        r.medication === "yes" ? "有" : "沒有",
        r.medication_time ?? "",
        r.medication_name ?? "",
        r.bf_glucose ?? "",
        r.af_glucose ?? "",
        r.remark ?? "",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
      downloadFile("records.csv", csv, "text/csv;charset=utf-8");
    });
  }

  function initConsult() {
    const form = $("#consultForm");
    const list = $("#consultList");
    const latest = $("#latestConsults");

    function renderList(target, limit) {
      if (!target) return;
      const consultations = storage.get("consultations", []);
      const user = loggedInUser();
      const visible = user ? consultations.filter((item) => item.user === user) : consultations.filter((item) => !item.user || item.user === "訪客");
      const data = visible.slice(-limit || undefined).reverse();
      if (!data.length) {
        target.innerHTML = `<p class="muted">目前還沒有留言。</p>`;
        return;
      }
      target.innerHTML = data.map((item) => `
        <article class="consult-item">
          <strong>${escapeHTML(item.question)}</strong>
          <time>${escapeHTML(item.time)}</time>
        </article>
      `).join("");
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = $("#questionInput");
        const question = input.value.trim();
        if (!question) return;
        const consultations = storage.get("consultations", []);
        consultations.push({
          question,
          user: loggedInUser() || "訪客",
          time: new Date().toLocaleString("zh-TW"),
        });
        storage.set("consultations", consultations);
        input.value = "";
        renderList(list);
      });
    }

    renderList(list);
    renderList(latest, 3);
  }

  function initProfile() {
    const form = $("#profileForm");
    if (!form) return;
    const message = $("#profileMessage");
    const profiles = storage.get("userProfiles", {});
    const profile = profiles[loggedInUser()] || {};
    const otherInput = $("#diabetesTypeOther");

    ["name", "email", "phone", "birth", "gender", "treatment", "diagnosisDate", "familyHistory"].forEach((key) => {
      if (profile[key] && form.elements[key]) form.elements[key].value = profile[key];
    });

    if (profile.diabetesType) {
      const radio = $$("input[name='diabetesType']").find((item) => item.value === profile.diabetesType);
      if (radio) {
        radio.checked = true;
      } else {
        $("input[name='diabetesType'][value='其他']").checked = true;
        otherInput.value = profile.diabetesType;
      }
    }

    function syncOther() {
      const checked = $("input[name='diabetesType']:checked")?.value;
      otherInput.classList.toggle("hidden", checked !== "其他");
      otherInput.required = checked === "其他";
      if (checked !== "其他") otherInput.value = "";
    }

    $$("input[name='diabetesType']").forEach((radio) => radio.addEventListener("change", syncOther));
    syncOther();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const selectedType = $("input[name='diabetesType']:checked")?.value;
      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        birth: form.elements.birth.value,
        gender: form.elements.gender.value,
        diabetesType: selectedType === "其他" ? otherInput.value.trim() : selectedType,
        treatment: form.elements.treatment.value.trim(),
        diagnosisDate: form.elements.diagnosisDate.value,
        familyHistory: form.elements.familyHistory.value,
      };
      const profiles = storage.get("userProfiles", {});
      profiles[loggedInUser()] = data;
      storage.set("userProfiles", profiles);
      setMessage(message, "個人資料已儲存。", "success");
      setTimeout(() => {
        window.location.href = "account.html";
      }, 600);
    });
  }

  function initAccount() {
    if (page !== "account") return;
    const profiles = storage.get("userProfiles", {});
    const profile = profiles[loggedInUser()] || {};
    const fields = ["name", "email", "phone", "birth", "gender", "diabetesType", "treatment", "diagnosisDate", "familyHistory"];
    fields.forEach((key) => {
      const el = $(`#${key}`);
      if (el) el.textContent = profile[key] || "尚未填寫";
    });

    $("#profileBtn")?.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
    $("#logoutBtn")?.addEventListener("click", logout);

    const form = $("#changePasswordForm");
    if (!form) return;
    const message = $("#changePasswordMessage");
    mountPasswordMeter($("#newPassword"), () => ({
      username: loggedInUser(),
      oldPassword: $("#oldPassword").value,
    }));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const user = loggedInUser();
      const users = storage.get("users", {});
      const oldPassword = $("#oldPassword").value;
      const newPassword = $("#newPassword").value;
      const confirmPassword = $("#confirmPassword").value;

      if (users[user]?.password !== oldPassword) {
        setMessage(message, "目前密碼不正確。", "error");
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage(message, "兩次輸入的新密碼不一致。", "error");
        return;
      }
      if (!meetsPasswordPolicy(newPassword, user, oldPassword)) {
        setMessage(message, "新密碼強度不足。", "error");
        return;
      }
      users[user].password = newPassword;
      storage.set("users", users);
      form.reset();
      setMessage(message, "密碼已更新。", "success");
    });
  }

  function loadReminders() {
    const user = loggedInUser();
    return storage.get("reminders", []).filter((item) => item.user === user);
  }

  function saveUserReminders(userReminders) {
    const user = loggedInUser();
    const all = storage.get("reminders", []).filter((item) => item.user && item.user !== user);
    storage.set("reminders", [...all, ...userReminders]);
  }

  function initReminders() {
    if (page !== "reminders") return;
    const form = $("#reminderForm");
    const list = $("#remindersList");
    const empty = $("#remindersEmpty");
    const status = $("#notifStatus");
    const everyday = $("#r_everyday");
    const dayInputs = $$("input[name='r_days']");
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

    function updateNotificationStatus() {
      if (!("Notification" in window)) {
        status.textContent = "這個瀏覽器不支援通知。";
      } else {
        status.textContent = `目前通知權限：${Notification.permission}`;
      }
    }

    updateNotificationStatus();

    $("#btnAskPerm")?.addEventListener("click", async () => {
      if ("Notification" in window) await Notification.requestPermission();
      updateNotificationStatus();
    });

    $("#btnTestNotif")?.addEventListener("click", () => {
      showReminderNotice({ title: "測試通知", timeHHMM: new Date().toTimeString().slice(0, 5) });
    });

    everyday?.addEventListener("change", () => {
      dayInputs.forEach((input) => {
        input.checked = everyday.checked;
      });
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const days = dayInputs.filter((input) => input.checked).map((input) => Number(input.value));
      if (!days.length) {
        alert("請至少選擇一天。");
        return;
      }

      const reminders = loadReminders();
      reminders.push({
        id: makeId(),
        user: loggedInUser(),
        title: $("#r_title").value.trim(),
        timeHHMM: $("#r_time").value,
        days,
        enabled: true,
        createdAt: new Date().toISOString(),
      });
      saveUserReminders(reminders);
      form.reset();
      renderReminders();
      renderTodayMeds();
    });

    function renderReminders() {
      const reminders = loadReminders().sort((a, b) => a.timeHHMM.localeCompare(b.timeHHMM));
      empty.classList.toggle("hidden", reminders.length > 0);
      list.innerHTML = reminders.map((item) => `
        <article class="list-item">
          <div>
            <strong>${escapeHTML(item.timeHHMM)} ${escapeHTML(item.title)}</strong>
            <small>${item.days.map((d) => `週${weekdays[d]}`).join("、")}</small>
          </div>
          <div class="button-row">
            <label class="choice"><input type="checkbox" data-action="toggle" data-id="${item.id}" ${item.enabled !== false ? "checked" : ""} />啟用</label>
            <button type="button" class="button secondary" data-action="delete" data-id="${item.id}">刪除</button>
          </div>
        </article>
      `).join("");
    }

    list?.addEventListener("change", (event) => {
      if (event.target.dataset.action !== "toggle") return;
      const reminders = loadReminders();
      const item = reminders.find((r) => r.id === event.target.dataset.id);
      if (item) item.enabled = event.target.checked;
      saveUserReminders(reminders);
      renderTodayMeds();
    });

    list?.addEventListener("click", (event) => {
      if (event.target.dataset.action !== "delete") return;
      const reminders = loadReminders().filter((item) => item.id !== event.target.dataset.id);
      saveUserReminders(reminders);
      renderReminders();
      renderTodayMeds();
    });

    $("#btnExportICS")?.addEventListener("click", () => {
      const reminders = loadReminders();
      if (!reminders.length) {
        alert("目前沒有提醒可以加入行事曆。");
        return;
      }
      const map = { 0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA" };
      const date = todayISO().replace(/-/g, "");
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Diabetes Health//Medication Reminder//ZH-TW"];
      reminders.forEach((item) => {
        const time = item.timeHHMM.replace(":", "");
        lines.push(
          "BEGIN:VEVENT",
          `UID:${item.id}@diabetes-practice`,
          `DTSTART:${date}T${time}00`,
          `RRULE:FREQ=WEEKLY;BYDAY=${item.days.map((day) => map[day]).join(",")}`,
          `SUMMARY:${item.title.replace(/([,;])/g, "\\$1")}`,
          "END:VEVENT",
        );
      });
      lines.push("END:VCALENDAR");
      downloadFile("medication-reminders.ics", lines.join("\r\n"), "text/calendar;charset=utf-8");
    });

    renderReminders();
    renderTodayMeds();
  }

  function getTakenMap() {
    return storage.get(userKey("reminders_taken"), {});
  }

  function saveTakenMap(value) {
    storage.set(userKey("reminders_taken"), value);
  }

  function renderTodayMeds() {
    const mount = $("#todayMeds");
    if (!mount) return;
    const today = new Date().getDay();
    const iso = todayISO();
    const taken = getTakenMap()[iso] || {};
    const reminders = loadReminders()
      .filter((item) => item.enabled !== false && item.days.includes(today))
      .sort((a, b) => a.timeHHMM.localeCompare(b.timeHHMM));

    if (!reminders.length) {
      mount.innerHTML = `<p class="muted">今天沒有已啟用的用藥提醒。</p>`;
      return;
    }

    mount.innerHTML = reminders.map((item) => `
      <label class="list-item">
        <span><strong>${escapeHTML(item.timeHHMM)}</strong> ${escapeHTML(item.title)}</span>
        <input type="checkbox" data-taken-id="${item.id}" ${taken[item.id] ? "checked" : ""} />
      </label>
    `).join("");

    $$("input[data-taken-id]", mount).forEach((input) => {
      input.addEventListener("change", () => {
        const all = getTakenMap();
        all[iso] = all[iso] || {};
        all[iso][input.dataset.takenId] = input.checked;
        saveTakenMap(all);
      });
    });
  }

  function initReminderTicker() {
    if (!loggedInUser()) return;
    const reminders = loadReminders();
    if (!reminders.length) return;

    const bar = document.createElement("div");
    bar.className = "inapp-alert";
    bar.innerHTML = `
      <span id="iaText"></span>
      <button type="button" class="button secondary" id="iaDone">標記已服用</button>
      <button type="button" class="button secondary" id="iaClose">關閉</button>
    `;
    document.body.appendChild(bar);

    const tick = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const weekday = now.getDay();
      const iso = todayISO();
      const taken = getTakenMap()[iso] || {};
      const due = loadReminders().find((item) =>
        item.enabled !== false &&
        item.timeHHMM === hhmm &&
        item.days.includes(weekday) &&
        !taken[item.id]
      );
      if (!due || bar.classList.contains("show")) return;

      $("#iaText", bar).textContent = `用藥提醒：${due.title}（${due.timeHHMM}）`;
      bar.classList.add("show");
      showReminderNotice(due);

      $("#iaDone", bar).onclick = () => {
        const all = getTakenMap();
        all[iso] = all[iso] || {};
        all[iso][due.id] = true;
        saveTakenMap(all);
        bar.classList.remove("show");
        renderTodayMeds();
      };
      $("#iaClose", bar).onclick = () => bar.classList.remove("show");
    };

    tick();
    setInterval(tick, 60000);
  }

  function showReminderNotice(item) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("糖尿病健康管理", {
        body: `${item.timeHHMM} ${item.title}`,
      });
    } else {
      alert(`${item.timeHHMM} ${item.title}`);
    }
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function seedDemoData() {
    const demoUser = "demo";
    const users = storage.get("users", {});
    if (!users[demoUser]) {
      users[demoUser] = {
        password: "Demo1234",
        securityQuestion: "food",
        securityAnswer: "蘋果",
        createdAt: new Date().toISOString(),
      };
      storage.set("users", users);
    }

    const profiles = storage.get("userProfiles", {});
    if (!profiles[demoUser]) {
      profiles[demoUser] = {
        name: "王美惠",
        email: "demo@example.com",
        phone: "0912-345-678",
        birth: "1958-06-12",
        gender: "女性",
        diabetesType: "第二型糖尿病",
        treatment: "飲食控制、規律散步、口服藥",
        diagnosisDate: "2021-03-18",
        familyHistory: "有",
      };
      storage.set("userProfiles", profiles);
    }

    const records = storage.get("records", []);
    if (!records.some((record) => record.user === demoUser)) {
      const demoRecords = [
        ["2026-04-25", 66.8, "yes", "晚餐後散步 25 分鐘", "yes", "08:00", "Metformin", 112, 168, "早餐有吃全麥吐司"],
        ["2026-04-26", 66.7, "yes", "公園散步 30 分鐘", "yes", "08:10", "Metformin", 108, 158, "午餐減少白飯份量"],
        ["2026-04-27", 66.5, "no", "", "yes", "08:05", "Metformin", 118, 176, "晚餐較晚吃"],
        ["2026-04-28", 66.4, "yes", "室內伸展 20 分鐘", "yes", "08:00", "Metformin", 106, 152, "精神狀況良好"],
        ["2026-04-29", 66.3, "yes", "散步 35 分鐘", "yes", "08:15", "Metformin", 102, 148, "飯後血糖較穩定"],
        ["2026-04-30", 66.2, "no", "", "yes", "08:00", "Metformin", 115, 170, "下午有點心"],
        ["2026-05-01", 66.1, "yes", "晚餐後散步 30 分鐘", "yes", "08:05", "Metformin", 104, 150, "飲食控制良好"],
      ].map(([date, weight, exercise, exercise_detail, medication, medication_time, medication_name, bf_glucose, af_glucose, remark], index) => ({
        id: `demo-record-${index + 1}`,
        user: demoUser,
        date,
        weight,
        exercise,
        exercise_detail,
        medication,
        medication_time,
        medication_name,
        bf_glucose,
        af_glucose,
        remark,
        createdAt: `${date}T09:00:00.000Z`,
      }));
      storage.set("records", [...demoRecords, ...records]);
    }

    const reminders = storage.get("reminders", []);
    if (!reminders.some((item) => item.user === demoUser)) {
      storage.set("reminders", [
        ...reminders,
        {
          id: "demo-reminder-breakfast",
          user: demoUser,
          title: "早餐後服藥",
          timeHHMM: "08:00",
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: true,
          createdAt: "2026-04-25T08:00:00.000Z",
        },
        {
          id: "demo-reminder-walk",
          user: demoUser,
          title: "晚餐後散步",
          timeHHMM: "19:30",
          days: [1, 2, 3, 4, 5],
          enabled: true,
          createdAt: "2026-04-25T19:30:00.000Z",
        },
      ]);
    }

    const consultations = storage.get("consultations", []);
    if (!consultations.some((item) => item.user === demoUser)) {
      storage.set("consultations", [
        ...consultations,
        {
          question: "飯後血糖偶爾偏高時，飲食上可以先調整哪些地方？",
          user: demoUser,
          time: "2026/5/1 下午 02:30:00",
        },
        {
          question: "如果當天沒有運動，是否需要增加隔天的活動量？",
          user: demoUser,
          time: "2026/5/1 下午 03:10:00",
        },
      ]);
    }
  }

  seedDemoData();
  renderNav();
  if (!requireLogin()) return;
  mountPasswordToggle();
  initSignup();
  initLogin();
  initReset();
  initRecord();
  initReport();
  initConsult();
  initProfile();
  initAccount();
  initReminders();
  initReminderTicker();
});
