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

selectBtn.addEventListener("click", e => { 
  e.stopPropagation(); 
  fileInput.click(); 
});
dropzone.addEventListener("click", e => { 
  if (e.target !== selectBtn) fileInput.click(); 
});
dropzone.addEventListener("keydown", e => { 
  if (e.key === "Enter" || e.key === " ") fileInput.click(); 
});
fileInput.addEventListener("change", () => addFiles([...fileInput.files]));

["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.add("drag");
}));
["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.remove("drag");
}));
dropzone.addEventListener("drop", e => addFiles([...e.dataTransfer.files]));

clearBtn.addEventListener("click", () => {
  items.forEach(x => { 
    if (x.url) URL.revokeObjectURL(x.url); 
    if (x.resultUrl) URL.revokeObjectURL(x.resultUrl); 
  });
  items = []; 
  fileInput.value = ""; 
  render();
});

function addFiles(files) {
  const accepted = files.filter(f => isSupported(f));
  accepted.forEach(file => {
    if (!items.some(x => x.file.name === file.name && x.file.size === file.size && x.file.lastModified === file.lastModified)) {
      items.push({file, url:URL.createObjectURL(file), resultUrl:null, png:null, webp:null, status:"processing"});
    }
  });
  render();
  const start = items.length - accepted.length;
  accepted.forEach((_, i) => processItem(start + i));
}

function isSupported(file) {
  return /^image\/(jpeg|png|webp|gif|bmp|heic|heif)$/.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

async function processItem(index) {
  const item = items[index];
  if (!item) return;
  try {
    const source = await getDecodableSource(item.file);
    const img = await loadImage(source);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", {alpha:true});
    ctx.drawImage(img, 0, 0);
    item.width = img.naturalWidth;
    item.height = img.naturalHeight;
    item.png = await canvasToBlob(canvas, "image/png");
    item.webp = await canvasToBlob(canvas, "image/webp", .92);
    item.resultUrl = URL.createObjectURL(item.png);
    item.status = "done";
    if (source instanceof Blob && source !== item.file) URL.revokeObjectURL(source);
  } catch (err) {
    console.error(err);
    item.status = "error";
  }
  render();
}

async function getDecodableSource(file) {
  if (isHeic(file)) {
    if (typeof heic2any !== "function") throw new Error("HEIC decoder unavailable");
    const converted = await heic2any({ blob:file, toType:"image/png", quality:1 });
    return Array.isArray(converted) ? converted[0] : converted;
  }
  return file;
}

function isHeic(file) {
  return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/i.test(file.name);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
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
  count.textContent = items.length;
  list.innerHTML = "";
  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "file-item";

    const compare = document.createElement("div");
    compare.className = "compare";
    compare.appendChild(previewBox(item.url, "원본"));
    compare.appendChild(previewBox(item.resultUrl || item.url, "메타데이터 제거 후", true));

    const info = document.createElement("div");
    info.className = "file-info";
    const text = document.createElement("div");
    text.innerHTML = `<div class="file-name">${escapeHtml(item.file.name)}</div>
      <div class="file-meta">${formatBytes(item.file.size)}${item.width ? ` · ${item.width}×${item.height}` : ""}${isHeic(item.file) ? " · HEIC 변환" : ""}</div>`;
    const status = document.createElement("div");
    status.className = "status" + (item.status === "error" ? " error" : "");
    status.textContent = item.status === "done" ? "✓ 제거 완료" : item.status === "error" ? "처리 실패" : "처리 중…";
    info.append(text, status);
    row.append(compare, info);
    list.appendChild(row);
  });
  const ready = items.some(x => x.status === "done");
  actions.classList.toggle("hidden", !ready);
}

function previewBox(url, label, result=false) {
  const box = document.createElement("div");
  box.className = "preview-box";
  const tag = document.createElement("span");
  tag.className = "preview-label" + (result ? " result" : "");
  tag.textContent = label;
  const img = document.createElement("img");
  img.className = "preview";
  img.src = url;
  img.alt = label;
  box.append(tag, img);
  return box;
}

async function downloadAll(format) {
  const ready = items.filter(x => x.status === "done" && x[format]);
  if (!ready.length) return;
  const ext = format;
  if (ready.length === 1) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(ready[0][format]);
    a.download = cleanName(ready[0].file.name) + "." + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1200);
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

function cleanName(name) { return name.replace(/\.[^/.]+$/, "") || "image"; }
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024**2) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/1024**2).toFixed(2) + " MB";
}
function dateStamp() { return new Date().toISOString().slice(0,10); }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

render();
