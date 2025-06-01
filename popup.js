'use strict';
let isRunning = false;

function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 4000);
}

function updateButtonStates() {
  const startButton = document.getElementById('startAuto');
  const stopButton = document.getElementById('stopAuto');
  
  if (isRunning) {
    startButton.disabled = true;
    startButton.classList.add('loading');
    stopButton.disabled = false;
    stopButton.classList.remove('loading');
  } else {
    startButton.disabled = false;
    startButton.classList.remove('loading');
    stopButton.disabled = true;
    stopButton.classList.add('loading');
  }
}

function updateWordCount() {
  const wordListTextarea = document.getElementById('wordList');
  const wordCountDiv = document.getElementById('wordCount');
  
  const words = wordListTextarea.value
    .split('\n')
    .map(word => word.trim())
    .filter(word => word.length > 0);
  
  wordCountDiv.textContent = `${words.length} mot${words.length > 1 ? 's' : ''}`;
}

function autoSave() {
  const wordListTextarea = document.getElementById('wordList');
  const words = wordListTextarea.value;
  
  chrome.storage.local.set({ savedWords: words }).catch((error) => {
    console.error('Erreur sauvegarde auto:', error);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const wordListTextarea = document.getElementById('wordList');
  const startButton = document.getElementById('startAuto');
  const stopButton = document.getElementById('stopAuto');

  chrome.storage.local.get(['savedWords']).then((result) => {
    if (result.savedWords) {
      wordListTextarea.value = result.savedWords;
      updateWordCount();
    }
  }).catch((error) => {
    console.error('Erreur lors du chargement:', error);
  });

  wordListTextarea.addEventListener('input', () => {
    updateWordCount();
    autoSave();
  });

  // Démarrer l'auto-fill
  startButton.addEventListener('click', async () => {
    const words = wordListTextarea.value
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    if (words.length === 0) {
      showStatus('⚠️ Veuillez entrer au moins un mot', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('pedantix.certitudes.org') && !tab.url.includes('cemantix.certitudes.org')) {
  showStatus('⚠️ Veuillez ouvrir Pedantix ou Cemantix dans l\'onglet actuel', 'error');
  return;
}

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'startAutoFill',
        words: words
      });

      if (response && response.success) {
        isRunning = true;
        updateButtonStates();
        showStatus(`🚀 Auto-fill démarré avec ${words.length} mots`, 'success');
      } else {
        showStatus('❌ Erreur lors du démarrage', 'error');
      }

    } catch (error) {
      console.error('Erreur:', error);
      showStatus('❌ Erreur: Assurez-vous d\'être sur Pedantix', 'error');
    }
  });

  // Arrêter l'auto-fill
  stopButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'stopAutoFill'
      });

      isRunning = false;
      updateButtonStates();
      showStatus('⏹️ Auto-fill arrêté', 'success');

    } catch (error) {
      console.error('Erreur stop:', error);
      showStatus('❌ Erreur lors de l\'arrêt', 'error');
    }
  });

  // État initial
  updateButtonStates();
  updateWordCount();
});
