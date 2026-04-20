
class AudioService {
  private synth: SpeechSynthesis = window.speechSynthesis;

  /**
   * Lit le texte à haute voix en utilisant la synthèse vocale native du navigateur.
   * Filtre les astérisques pour une lecture plus naturelle.
   * @param text Le texte à lire
   * @param onStart Callback au début de la lecture
   * @param onEnd Callback à la fin de la lecture
   */
  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    this.synth.cancel();

    // Suppression des astérisques (*) pour que la voix ne les prononce pas
    const cleanText = text.replace(/\*/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0; // Vitesse professionnelle
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    // Tentative de sélection d'une voix française de meilleure qualité si disponible
    const voices = this.synth.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google')) || 
                   voices.find(v => v.lang.startsWith('fr'));
    
    if (frVoice) {
      utterance.voice = frVoice;
    }

    this.synth.speak(utterance);
  }

  cancel(): void {
    this.synth.cancel();
  }

  // Gardé pour compatibilité de signature si nécessaire ailleurs, mais n'utilise plus d'API
  async getAudioUrl(text: string): Promise<string> {
    console.warn("getAudioUrl est déprécié, utilisez audioService.speak pour le vocal local.");
    return "";
  }
}

export const audioService = new AudioService();
