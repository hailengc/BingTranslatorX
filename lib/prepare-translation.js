// Chromium uses one language pack for both directions of English and Chinese translation.
const setupTranslationLanguages = { sourceLanguage: "en", targetLanguage: "zh" };

async function prepareSelectionTranslation({ signal, onProgress }) {
  const translator = await globalThis.Translator.create({
    ...setupTranslationLanguages,
    signal,
    monitor(monitor) {
      if (onProgress) {
        monitor.addEventListener("downloadprogress", onProgress);
      }
    },
  });
  translator.destroy();
}
