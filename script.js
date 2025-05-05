// ======================== CONFIGURAÇÃO AZURE ==========================
const subscriptionKey = "2lq6d62WM18MjLN1z9rNNddKM1yK3Db4CzSdaVaZpBYDphSnv7LAJQQJ99BDACZoyfiXJ3w3AAAFACOG71Rz"; // ⛔ Substitua pela sua chave do Azure
const endpoint = "https://amplifica.cognitiveservices.azure.com/";     // ⛔ Substitua pelo seu endpoint completo
// ======================================================================

const video = document.getElementById('webcam');
const canvas = document.getElementById('zoomCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const videoWrapper = document.getElementById('videoWrapper');
const resultado = document.getElementById('resultadoOCR');
const resultbox = document.getElementById('resultbox');
const zoomCanvas = document.getElementById('zoomCanvas');
const contrasteBtn = document.getElementById('contraste');
const fontSizeInc = document.getElementById('+');
const fontSizeDec = document.getElementById('-');
const modoDaltonico = document.getElementById('modoDaltonico');
const accessibilityPanel = document.getElementById('acessibilidade-panel');

let contrasteAtivado = false;
let selection = null;
let isSelecting = false;
let startX = 0;
let startY = 0;
let tamanhoFonteAtual = 16;
let isAmplified = false;

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Erro ao acessar a webcam: " + err);
  }
}

videoWrapper.addEventListener('mousedown', (e) => {
  isSelecting = true;
  const rect = video.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  overlay.style.left = `${startX}px`;
  overlay.style.top = `${startY}px`;
  overlay.style.width = `0px`;
  overlay.style.height = `0px`;
  overlay.style.display = 'block';
});

videoWrapper.addEventListener('mousemove', (e) => {
  if (!isSelecting) return;
  const rect = video.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  const width = currentX - startX;
  const height = currentY - startY;
  overlay.style.left = `${Math.min(startX, currentX)}px`;
  overlay.style.top = `${Math.min(startY, currentY)}px`;
  overlay.style.width = `${Math.abs(width)}px`;
  overlay.style.height = `${Math.abs(height)}px`;
});

videoWrapper.addEventListener('mouseup', (e) => {
  isSelecting = false;
  const rect = video.getBoundingClientRect();
  const endX = e.clientX - rect.left;
  const endY = e.clientY - rect.top;
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  selection = { x, y, width, height };
  capturarEAnalisar(); // Automatically trigger OCR on selection
});

let isDrawing = true; // Variável para controlar o loop de animação

function drawZoomed() {
  // Parar o loop se o canvas não estiver visível
  if (zoomCanvas.style.visibility === 'hidden' || !isDrawing) {
    return;
  }

  // Verificar se o canvas está em um estado válido
  if (!ctx || canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
    requestAnimationFrame(drawZoomed);
    return;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;

  const scaleX = videoWidth / displayWidth;
  const scaleY = videoHeight / displayHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (selection) {
    const sx = selection.x * scaleX;
    const sy = selection.y * scaleY;
    const sWidth = selection.width * scaleX;
    const sHeight = selection.height * scaleY;

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(drawZoomed);
}

function toggleAmpliar() {
  isAmplified = !isAmplified;
  if (isAmplified) {
    resultbox.classList.add('hidden');
    zoomCanvas.style.visibility = 'visible';
    document.getElementById('amp-btn').textContent = 'Voltar';
    isDrawing = true; // Ativar o loop de animação
    drawZoomed(); // Iniciar o loop
  } else {
    resultbox.classList.remove('hidden');
    zoomCanvas.style.visibility = 'hidden';
    document.getElementById('amp-btn').textContent = 'Ampliar';
    isDrawing = false; // Pausar o loop de animação
    // Forçar uma renderização no canvas para garantir que ele esteja pronto para o próximo OCR
    if (selection) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;

      const scaleX = videoWidth / displayWidth;
      const scaleY = videoHeight / displayHeight;

      const sx = selection.x * scaleX;
      const sy = selection.y * scaleY;
      const sWidth = selection.width * scaleX;
      const sHeight = selection.height * scaleY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    }
  }
}

function toggleAmpliar() {
  isAmplified = !isAmplified;
  if (isAmplified) {
    resultbox.classList.add('hidden');
    zoomCanvas.style.visibility = 'visible';
    document.getElementById('amp-btn').textContent = 'Voltar';
  } else {
    resultbox.classList.remove('hidden');
    zoomCanvas.style.visibility = 'hidden';
    document.getElementById('amp-btn').textContent = 'Ampliar';
  }
}

async function capturarEAnalisar() {
  // Verifique se o canvas está pronto
  if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
    resultado.textContent = "Erro: Canvas não está pronto. Tente novamente.";
    return;
  }

  // Forçar renderização do frame atual no canvas
  if (selection) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    const scaleX = videoWidth / displayWidth;
    const scaleY = videoHeight / displayHeight;

    const sx = selection.x * scaleX;
    const sy = selection.y * scaleY;
    const sWidth = selection.width * scaleX;
    const sHeight = selection.height * scaleY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  } else {
    // Se não houver seleção, capturar o vídeo inteiro
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  resultado.textContent = "Analisando com Azure OCR...";

  // Capturar o blob após garantir que o canvas está desenhado
  canvas.toBlob(async function(blob) {
    if (!blob) {
      resultado.textContent = "Erro: Falha ao capturar imagem do canvas.";
      return;
    }

    try {
      const url = `${endpoint}/vision/v3.2/read/analyze`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/octet-stream'
        },
        body: blob
      });

      const operationLocation = response.headers.get("operation-location");
      if (!operationLocation) throw new Error("Falha ao obter operação OCR.");

      let result;
      while (true) {
        const res = await fetch(operationLocation, {
          headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
        });
        const data = await res.json();
        if (data.status === 'succeeded') {
          result = data.analyzeResult.readResults;
          break;
        } else if (data.status === 'failed') {
          throw new Error("Falha na análise OCR.");
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      let textoReconhecido = '';
      for (const page of result) {
        for (const line of page.lines) {
          textoReconhecido += line.text + '\n';
        }
      }

      resultado.textContent = "Texto reconhecido:\n" + textoReconhecido;

    } catch (error) {
      resultado.textContent = "Erro no OCR Azure: " + error.message;
    }
  }, 'image/jpeg', 1.0);
}

async function narrarComAzure(texto) {
  const subscriptionKey = '8USfj4ZObcOCdModY3PgpN20wUDAOv3d7jk3FaSNvPzL8ijFEPIkJQQJ99BDACZoyfiXJ3w3AAAYACOGFlGA'; // sua chave do Azure Speech
  const region = 'brazilsouth';
  const voice = 'pt-BR-FranciscaNeural';

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const ssml = `
    <speak version='1.0' xml:lang='pt-BR'>
      <voice name='${voice}'>
        ${texto}
      </voice>
    </speak>`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'OCRWebApp'
      },
      body: ssml
    });

    if (!response.ok) throw new Error('Erro ao gerar áudio do Azure');

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();

    } catch (err) {
      alert('Erro ao narrar com Azure: ' + err.message);
    }
  }

const btn = document.getElementById('acessibilidade-btn');
const panel = document.getElementById('acessibilidade-panel');

btn.addEventListener('click', () => {
  panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 'block' : 'none';
});

function toggleOpenDyslexic() {
  document.body.classList.toggle('opendyslexic');
}

contrasteBtn.addEventListener('click', () => {
  if (!contrasteAtivado) {
    canvas.style.filter = 'contrast(200%) brightness(120%) grayscale(100%)';
    contrasteAtivado = true;
  } else {
    canvas.style.filter = 'none';
    contrasteAtivado = false;
  }
});

modoDaltonico.addEventListener('click', () => {
  if (!contrasteAtivado) {
    document.body.style.filter = 'saturate(80%) hue-rotate(30deg)';
    contrasteAtivado = true;
  } else {
    document.body.style.filter = 'none';
    contrasteAtivado = false;
  }
});

fontSizeInc.addEventListener('click', () => {
  tamanhoFonteAtual += 2;
  document.body.style.fontSize = `${tamanhoFonteAtual}px`;
});

fontSizeDec.addEventListener('click', () => {
  tamanhoFonteAtual -= 2;
  document.body.style.fontSize = `${tamanhoFonteAtual}px`;
});

function narrarTexto() {
  const texto = resultado.innerText;
  narrarComAzure(texto);
}

async function baixarTexto() {
  const texto = resultado.textContent;
  const tipo = document.getElementById('exportFormat').value;

  if (tipo === 'pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const marginLeft = 10;
    const marginTop = 10;
    const lineHeight = 10;
    const pageHeight = doc.internal.pageSize.height;

    const linhas = doc.splitTextToSize(texto, 180);
    let y = marginTop;

    for (const linha of linhas) {
      if (y + lineHeight > pageHeight - marginTop) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(linha, marginLeft, y);
      y += lineHeight;
    }

    doc.save("ocr_output.pdf");
    return;
  }

  let blob;
  if (tipo === 'txt') {
    blob = new Blob([texto], { type: 'text/plain' });
  } else {
    alert("Formato inválido");
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ocr_output.${tipo}`;
  a.click();
}

startWebcam().then(drawZoomed);
