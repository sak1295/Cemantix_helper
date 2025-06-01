'use strict';

let autoFillState = {
  isRunning: false,
  wordQueue: [],
  currentIndex: 0,
  timeoutId: null
};

// Configuration
const CONFIG = {
  DELAY_BETWEEN_WORDS: 200, // 3 secondes entre chaque mot
  SUBMIT_DELAY: 50,
  MAX_RETRIES: 3
};

function findPedantixElements() {
  return {
    inputField: document.querySelector('#guess') || 
                document.querySelector('input[type="text"]') ||
                document.querySelector('input'),
    submitButton: document.querySelector('#guess-btn') || 
                  document.querySelector('button[type="submit"]'),
    form: document.querySelector('#form') || document.querySelector('form'),
    errorElement: document.querySelector('.error, #error'),
    successElement: document.querySelector('.success, #success')
  };
}

function isGameFinished() {
  return false;
}

function submitWord(word) {
  return new Promise((resolve) => {
    console.log(`--- DÉBUT submitWord pour: "${word}" ---`);
    
    const input = document.querySelector('#guess') || 
                  document.querySelector('input[type="text"]') ||
                  document.querySelector('input');
    
    if (!input) {
      console.error('AUCUN champ de saisie trouvé');
      resolve(false);
      return;
    }

    console.log(`Saisie instantanée du mot: "${word}"`);
    input.focus();
    input.value = word;
    
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Soumission immédiate
    setTimeout(() => {
      console.log('🚀 Soumission immédiate');
      
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      input.dispatchEvent(enterEvent);
      
      const submitBtn = document.querySelector('#guess-btn') || 
                       document.querySelector('button[type="submit"]') ||
                       document.querySelector('button');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
      
      const form = input.closest('form') || document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
      
      console.log('--- FIN submitWord ---');
      resolve(true);
    }, 50);
  });
}

async function processNextWord() {
  console.log('=== DÉBUT processNextWord ===');
  console.log('État actuel:', {
    isRunning: autoFillState.isRunning,
    currentIndex: autoFillState.currentIndex,
    totalWords: autoFillState.wordQueue.length,
    wordQueue: autoFillState.wordQueue,
    gameFinished: isGameFinished(),
    currentURL: window.location.href
  });

  if (!autoFillState.isRunning) {
    console.log('❌ Auto-fill arrêté (pas en cours)');
    return;
  }

  if (autoFillState.currentIndex >= autoFillState.wordQueue.length) {
    console.log('✅ Auto-fill terminé (tous les mots traités)');
    stopAutoFill();
    return;
  }

  const word = autoFillState.wordQueue[autoFillState.currentIndex];
  console.log(`🎯 Traitement du mot ${autoFillState.currentIndex + 1}/${autoFillState.wordQueue.length}: "${word}"`);
  const success = await submitWord(word);
  
  if (success) {
    console.log(`✅ Mot "${word}" traité avec succès`);
    autoFillState.currentIndex++;
    scheduleNextWord();
  } else {
    console.error(`❌ Échec pour "${word}", passage au suivant`);
    autoFillState.currentIndex++;
    scheduleNextWord();
  }
}

function scheduleNextWord() {
  console.log(`⏰ Programmation du prochain mot dans ${CONFIG.DELAY_BETWEEN_WORDS}ms`);
  if (autoFillState.isRunning) {
    autoFillState.timeoutId = setTimeout(processNextWord, CONFIG.DELAY_BETWEEN_WORDS);
  }
}

function startAutoFill(words) {
  console.log('🚀 DÉMARRAGE AUTO-FILL');
  
  if (autoFillState.isRunning) {
    console.log('Arrêt de l\'auto-fill précédent');
    stopAutoFill();
  }

  autoFillState.isRunning = true;
  autoFillState.wordQueue = [...words];
  autoFillState.currentIndex = 0;
  autoFillState.timeoutId = null;

  console.log(`Démarrage avec ${words.length} mots:`, words);

  const elements = findPedantixElements();
  console.log('Éléments Pedantix détectés:', {
    inputField: !!elements.inputField,
    submitButton: !!elements.submitButton,
    form: !!elements.form
  });
  
  setTimeout(processNextWord, 100); 
  
  return true;
}

function stopAutoFill() {
  console.log('⏹️ ARRÊT AUTO-FILL');
  autoFillState.isRunning = false;
  
  if (autoFillState.timeoutId) {
    clearTimeout(autoFillState.timeoutId);
    autoFillState.timeoutId = null;
    console.log('Timeout annulé');
  }
  
  return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message reçu:', request);

  try {
    if (request.action === 'startAutoFill') {
      const success = startAutoFill(request.words);
      sendResponse({ success, message: 'Auto-fill démarré' });
      
    } else if (request.action === 'stopAutoFill') {
      const success = stopAutoFill();
      sendResponse({ success, message: 'Auto-fill arrêté' });
      
    } else {
      sendResponse({ success: false, message: 'Action inconnue' });
    }
  } catch (error) {
    console.error('Erreur dans onMessage:', error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM chargé, vérification Pedantix...');
  const elements = findPedantixElements();
  console.log('Éléments trouvés:', {
    inputField: elements.inputField,
    submitButton: elements.submitButton,
    form: elements.form,
    url: window.location.href
  });
});

console.log('🎯 Pedantix Auto Fill content script initialisé');
