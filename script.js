const supermarketListDiv = document.getElementById('supermarket-list');
const manualForm = document.getElementById('manual-supermarket-form');
const manualNameInput = document.getElementById('manual-name');
const manualCityInput = document.getElementById('manual-city');
const scanButton = document.getElementById('scan-button');
const resultDiv = document.getElementById('result');

let selectedSupermarket = null;

async function getLocation() {
  if (!navigator.geolocation) {
    resultDiv.textContent = 'Geolocalizzazione non supportata dal browser.';
    manualForm.classList.remove('hidden');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    resultDiv.textContent = `Posizione: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Cerco supermercati...`;
    await findSupermarkets(latitude, longitude);
  }, () => {
    resultDiv.textContent = 'Permesso geolocalizzazione negato o errore.';
    manualForm.classList.remove('hidden');
  });
}

async function findSupermarkets(lat, lon) {
  const radiusMeters = 500;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radiusMeters},${lat},${lon})[shop=supermarket];out;`;

  try {
    const response = await fetch(overpassUrl);
    const data = await response.json();
    if (data.elements.length > 0) {
      supermarketListDiv.innerHTML = '';
      data.elements.forEach((el) => {
        const btn = document.createElement('button');
        btn.textContent = el.tags.name || 'Supermercato senza nome';
        btn.className = 'block w-full text-left px-3 py-2 rounded mb-1 bg-gray-100 hover:bg-gray-200';
        btn.onclick = () => selectSupermarket(el.tags.name || 'Supermercato senza nome');
        supermarketListDiv.appendChild(btn);
      });
      manualForm.classList.add('hidden');
    } else {
      resultDiv.textContent = 'Nessun supermercato trovato nel raggio di 500m. Inserisci manualmente.';
      manualForm.classList.remove('hidden');
    }
  } catch (e) {
    resultDiv.textContent = 'Errore nel recupero supermercati. Inserisci manualmente.';
    manualForm.classList.remove('hidden');
  }
}

function selectSupermarket(name) {
  selectedSupermarket = name;
  resultDiv.textContent = `Supermercato selezionato: ${name}`;
  scanButton.disabled = false;
  manualForm.classList.add('hidden');
  supermarketListDiv.innerHTML = '';
}

manualForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = manualNameInput.value.trim();
  const city = manualCityInput.value.trim();
  if (name && city) {
    selectedSupermarket = `${name}, ${city}`;
    resultDiv.textContent = `Supermercato inserito: ${selectedSupermarket}`;
    scanButton.disabled = false;
    manualForm.classList.add('hidden');
    supermarketListDiv.innerHTML = '';
  } else {
    alert('Inserisci nome e città');
  }
});

scanButton.addEventListener('click', async () => {
  if (!selectedSupermarket) {
    alert('Seleziona prima un supermercato');
    return;
  }

  resultDiv.textContent = 'Apro la fotocamera per la scansione barcode...';

  const codeReader = new ZXing.BrowserBarcodeReader();
  try {
    const result = await codeReader.decodeOnceFromVideoDevice(undefined, 'video');
    codeReader.reset();
    const barcode = result.text;
    resultDiv.innerHTML = `Barcode rilevato: <strong>${barcode}</strong><br>` +
      `<label for="price-input">Inserisci il prezzo (€):</label> ` +
      `<input id="price-input" type="number" step="0.01" min="0" class="border p-1 rounded w-24" /> ` +
      `<button id="save-price" class="ml-2 bg-blue-600 text-white px-3 py-1 rounded">Salva</button>`;

    document.getElementById('save-price').onclick = () => {
      const priceInput = document.getElementById('price-input');
      const price = parseFloat(priceInput.value);
      if (isNaN(price) || price <= 0) {
        alert('Inserisci un prezzo valido');
        return;
      }
      resultDiv.textContent = `Prezzo €${price.toFixed(2)} salvato per barcode ${barcode} al supermercato ${selectedSupermarket}.`;
      // Qui inseriremo il salvataggio sul DB (fase successiva)
    };
  } catch (err) {
    resultDiv.textContent = 'Nessun barcode rilevato, riprova.';
  }
});

// Creo un video element visibile per la scansione
const video = document.createElement('video');
video.setAttribute('id', 'video');
video.style.width = '100%';
video.style.height = 'auto';
video.style.maxWidth = '400px';
video.style.borderRadius = '8px';
video.style.marginTop = '1rem';
document.body.appendChild(video);

// Avvio la geolocalizzazione all'apertura
getLocation();
