export function updateLoadingProgress(progress, text = '') {
  const progressBar = document.getElementById('loading-progress');
  const loadingText = document.getElementById('loading-text');
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  if (loadingText && text) {
    loadingText.textContent = text;
  }
}

export function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

export function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
