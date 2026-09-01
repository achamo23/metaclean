const fileInput = document.getElementById("fileInput");
const selectBtn = document.getElementById("selectBtn");
const dropzone = document.getElementById("dropzone");
const toolbar = document.getElementById("toolbar");
const list = document.getElementById("list");
const actions = document.getElementById("actions");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clearBtn");
const downloadPng = document.getElementById("downloadPng");
const downloadWebp = document.getElementById("downloadWebp");

let items = [];

selectBtn.addEventListener("click", e => { e.stopPropagation(); fileInput.click(); });
dropzone.addEventListener("click", e => { if (e.target !== selectBtn) fileInput.click(); });
dropzone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
fileInput.addEventListener("change", () => addFiles([...fileInput.files]));

["dragenter","dragover"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.add("drag");
}));
["dragleave","drop"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.remove("drag");
}));
dropzone.addEventListener("drop", e => addFiles([...e.dataTransfer.files]));

clearBtn.addEventListener("click", () => {
  items = []; fileInput.value = ""; render();
});

function addFiles(files) {
  const accepted = files.filter(f => /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type));
  accepted.forEach(file => {
    if (!items.some(x => x.file.name === file.name && x.file.size === file.size && x.file.lastModified === file.lastModified)) {
      items.push({file, png:null, webp:null, url:URL.createObjectURL(file), status:"processing"});
    }
  });
  render();
  accepted.forEach((_, i) => processItem(items.length - accepted.length + i));
}

async function processItem(index) {
  const item = items[index];
  if (!item) return;
  try {
    const img = await loadImage(item.file);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", {alpha:true, willReadFrequently:false});
    ctx.drawImage(img, 0, 0);
    item.width = img.naturalWidth;
    item.height = img.naturalHeight;
    item.png = await canvasToBlob(canvas, "image/png");
    item.webp = await canvasToBlob(canvas, "image/webp", .92);
    item.status = "done";
  } catch (err) {
    console.error(err);
    item.status = "error";
    item.error = "브라우저에서 읽을 수 없는 이미지입니다.";
  }
  render();
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode failed")); };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("encode failed")), type, quality);
  });
}

function render() {
  const has = items.length > 0;
  toolbar.classList.toggle("hidden", !has);
  actions.classList.toggle("hidden", !has);
  count.textContent = items.length;
  list.innerHTML = "";
  items.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "file-item";
    const thumb = document.createElement("img");
    thumb.className = "thumb";
    thumb.src = item.url;
    thumb.alt = "";
    const middle = document.createElement("div");
    middle.innerHTML = `<div class="file-name">${escapeHtml(item.file.name)}</div>
      <div class="file-meta">${formatBytes(item.file.size)}${item.width ? ` · ${item.width}×${item.height}` : ""}</div>`;
    const status = document.createElement("div");
    status.className = "status" + (item.status === "error" ? " error" : "");
    status.textContent = item.status === "done" ? "✓ 제거됨" : item.status === "error" ? "처리 실패" : "처리 중…";
    row.append(thumb, middle, status);
    list.appendChild(row);
  });
  const ready = items.some(x => x.status === "done");
  actions.classList.toggle("hidden", !ready);
}

async function downloadAll(format) {
  const ready = items.filter(x => x.status === "done" && x[format]);
  if (!ready.length) return;
  const ext = format === "png" ? "png" : "webp";
  if (ready.length === 1) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(ready[0][format]);
    a.download = cleanName(ready[0].file.name) + "." + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return;
  }
  const zip = new JSZip();
  const used = new Set();
  for (const item of ready) {
    let name = cleanName(item.file.name) + "." + ext;
    let n = 2;
    while (used.has(name)) name = cleanName(item.file.name) + "-" + n++ + "." + ext;
    used.add(name);
    zip.file(name, item[format]);
  }
  const blob = await zip.generateAsync({type:"blob", compression:"DEFLATE"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `metaclean-${ext}-${dateStamp()}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

downloadPng.addEventListener("click", () => downloadAll("png"));
downloadWebp.addEventListener("click", () => downloadAll("webp"));

function cleanName(name) {
  return name.replace(/\.[^/.]+$/, "") || "image";
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024**2) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/1024**2).toFixed(2) + " MB";
}
function dateStamp() {
  return new Date().toISOString().slice(0,10);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

render();
