const $ = (id) => document.getElementById(id);

function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function yen(n) {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return new Intl.NumberFormat("ja-JP").format(Math.round(v));
}

function recomputeTotals() {
  const estimateTotal = document.getElementById("estimateTotal").value;
  if (estimateTotal === "") {
    window.alert("先に見積総額を入力してください。");
    return;
  }
  let subtotal = Math.round((estimateTotal*10)/11);
  let tax = estimateTotal - subtotal;
  document.getElementById("subtotal").value = subtotal;
  document.getElementById("tax").value = tax;
}


function autoCalDvide() {
  let totalAmount = 0;
  const tbody = $("itemsTable").querySelector("tbody");
  let adjustRow = null;
  for (const tr of tbody.querySelectorAll("tr")) {
    const nameEl = tr.querySelector(".name");
    const amountEl = tr.querySelector(".amountInput");
    if (!amountEl) continue;
    const nameValue = (nameEl ? nameEl.value : "").trim();
    if (nameValue === "調整値引き") {
      adjustRow = tr;
      continue;
    }
    totalAmount += Number(amountEl.value) || 0;
  }
  const estimateTotalRaw = document.getElementById("estimateTotal").value;

  if (estimateTotalRaw === "") {
    window.alert("先に見積総額を入力してください。");
    return;
  }

  const estimateTotal = Number(estimateTotalRaw);
  if (!Number.isFinite(estimateTotal)) {
    window.alert("見積総額の数値が不正です。");
    return;
  }

  let subtotal = Math.round((estimateTotal * 10) / 11);

  let diff = totalAmount - subtotal;

  if (diff == 0) {
    window.alert("調整不要です。");
    return;
  }

  const adjustmentValue = -Math.abs(diff);

  // 項目を調整値引きにして表の最後に追加
  const tbodyEl = $("itemsTable").querySelector("tbody");
  const adjustTr = newRow({
    name: "調整値引き",
    unitPrice: "",
    quantity: "",
    amount: adjustmentValue,
    unit: "",
    spec: ""
  });
  tbodyEl.appendChild(adjustTr);
  
}

let staffImageDataUrl = "";
let creatorImageDataUrl = "";

function readImageFile(input, onLoad, onClear) {
  const file = input.files && input.files[0];
  if (!file) {
    onClear();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    onLoad(result);
  };
  reader.readAsDataURL(file);
}

function setPreview(container, dataUrl, label) {
  container.innerHTML = "";
  if (!dataUrl) {
    container.textContent = label;
    container.classList.add("muted");
    return;
  }
  container.classList.remove("muted");
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = label;
  container.appendChild(img);
}

function newRow(data = {}) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="name" placeholder="例）足場仮設工事" value="${data.name ?? ""}"></td>
    <td class="num"><input class="unitPrice" type="number" step="1" value="${data.unitPrice ?? ""}" placeholder="0"></td>
    <td class="num"><input class="quantity" type="number" step="0.01" value="${data.quantity ?? ""}" placeholder="0"></td>
    <td><input class="unit" placeholder="" value="${data.unit ?? ""}"></td>
    <td><input class="spec" placeholder="165" value="${data.spec ?? ""}"></td>
    <td class="num"><input class="amountInput" type="number" step="1" value="${data.amount ?? ""}" placeholder="0"></td>
    <td class="num"><button type="button" class="del">削除</button></td>
  `;

  tr.querySelector(".del").addEventListener("click", () => {
    tr.remove();
  });
  return tr;
}

function collectPayload() {
  const items = [...$("itemsTable").querySelector("tbody").querySelectorAll("tr")].map((tr) => ({
    name: tr.querySelector(".name").value,
    unitPrice: tr.querySelector(".unitPrice").value,
    quantity: tr.querySelector(".quantity").value,
    amount: tr.querySelector(".amountInput").value,
    unit: tr.querySelector(".unit").value,
    spec: tr.querySelector(".spec").value
  })).filter((it) => (it.name || "").trim() !== "" || Number(it.amount));

  const taxRateEl = $("taxRate");
  const taxRoundingEl = $("taxRounding");

  const payload = {
    customer: $("customer").value || "＿＿",
    date: $("date").value || todayISO(),
    taxRate: Number((taxRateEl ? taxRateEl.value : "0.10") || 0.10),
    taxRounding: (taxRoundingEl ? taxRoundingEl.value : "round") || "round",
    items,
    company: $("company") ? $("company").value : "",
    companyMain: $("company_main") ? $("company_main").value : "",
    postId: $("post_id") ? $("post_id").value : "",
    address: $("adres") ? $("adres").value : "",
    tel: $("tel") ? $("tel").value : "",
    phone: $("phone") ? $("phone").value : ""
  };

  const estimateTotal = $("estimateTotal").value;
  if (estimateTotal !== "") payload.estimateTotal = Number(estimateTotal);
  const subtotal = $("subtotal") ? $("subtotal").value : "";
  if (subtotal !== "") payload.subtotal = Number(subtotal);
  const tax = $("tax") ? $("tax").value : "";
  if (tax !== "") payload.tax = Number(tax);
  if (staffImageDataUrl) payload.staffImageDataUrl = staffImageDataUrl;
  if (creatorImageDataUrl) payload.creatorImageDataUrl = creatorImageDataUrl;

  return payload;
}

async function generatePdf() {
  const payload = collectPayload();
  const overlay = $("loadingOverlay");
  const generateButton = $("generate");

  const setLoading = (isLoading) => {
    if (overlay) {
      overlay.classList.toggle("is-visible", isLoading);
      overlay.setAttribute("aria-hidden", isLoading ? "false" : "true");
    }
    if (generateButton) {
      generateButton.disabled = isLoading;
      generateButton.setAttribute("aria-busy", isLoading ? "true" : "false");
    }
    document.body.style.overflow = isLoading ? "hidden" : "";
  };

  setLoading(true);

  try {
    const res = await fetch("/api/estimate/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Request failed.");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "御見積書.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    alert("Error: " + message);
  } finally {
    setLoading(false);
  }
}

function updateCurlExample() {
  const curlEl = $("curlExample");
  if (!curlEl) return;
  const payload = collectPayload();
  const json = JSON.stringify(payload, null, 2);
  curlEl.textContent =
`curl -X POST http://localhost:3000/api/estimate/pdf \\
  -H "Content-Type: application/json" \\
  -d '${json.replaceAll("'", "'\\''")}' \\
  --output estimate.pdf`;
}

async function loadUiDefaults() {
  try {
    const res = await fetch("/api/ui-defaults");
    if (!res.ok) return;
    const data = await res.json();
    if (data.companyMain && !$("company_main").value) $("company_main").value = data.companyMain;
    if (data.company && !$("company").value) $("company").value = data.company;
    if (data.postId && !$("post_id").value) $("post_id").value = data.postId;
    if (data.address && !$("adres").value) $("adres").value = data.address;
    if (data.tel && !$("tel").value) $("tel").value = data.tel;
  } catch (err) {
    // Ignore errors when loading defaults
  }
}

async function loadDefaultImages() {
  try {
    const res = await fetch("/api/ui-default-images");
    if (!res.ok) return;
    const data = await res.json();
    if (data.staff && !staffImageDataUrl) {
      staffImageDataUrl = data.staff;
      setPreview($("staffPreview"), data.staff, "担当者");
    }
    if (data.creator && !creatorImageDataUrl) {
      creatorImageDataUrl = data.creator;
      setPreview($("creatorPreview"), data.creator, "作成者");
    }
  } catch (err) {
    // Ignore errors when loading default images
  }
}

function main() {
  $("date").value = todayISO();

  const tbody = $("itemsTable").querySelector("tbody");
  tbody.appendChild(newRow({ name: "", amount: 0, unit: 0, spec: "" }));

  $("addRow").addEventListener("click", () => tbody.appendChild(newRow()));
  $("generate").addEventListener("click", generatePdf);
  $("auto_dvid").addEventListener("click", () => {
    autoCalDvide();
    updateCurlExample();
  });

  $("auto_calculate").addEventListener("click", () => {
    recomputeTotals();
    updateCurlExample();
  });

  const staffInput = $("staffImage");
  const creatorInput = $("creatorImage");
  const staffPreview = $("staffPreview");
  const creatorPreview = $("creatorPreview");

  loadUiDefaults();
  loadDefaultImages();

  staffInput.addEventListener("change", () => {
    readImageFile(
      staffInput,
      (dataUrl) => {
        staffImageDataUrl = dataUrl;
        setPreview(staffPreview, dataUrl, "担当者");
      },
      () => {
        staffImageDataUrl = "";
        setPreview(staffPreview, "", "未設定");
      }
    );
  });

  creatorInput.addEventListener("change", () => {
    readImageFile(
      creatorInput,
      (dataUrl) => {
        creatorImageDataUrl = dataUrl;
        setPreview(creatorPreview, dataUrl, "作成者");
      },
      () => {
        creatorImageDataUrl = "";
        setPreview(creatorPreview, "", "未設定");
      }
    );
  });

  $("clearStaffImage").addEventListener("click", () => {
    staffInput.value = "";
    staffImageDataUrl = "";
    setPreview(staffPreview, "", "未設定");
  });

  $("clearCreatorImage").addEventListener("click", () => {
    creatorInput.value = "";
    creatorImageDataUrl = "";
    setPreview(creatorPreview, "", "未設定");
  });

  document.body.addEventListener("input", () => updateCurlExample());
  updateCurlExample();

}
main();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Ignore registration failures in unsupported environments.
    });
  });
}
