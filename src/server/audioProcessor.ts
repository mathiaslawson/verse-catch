export class AudioProcessor {
  constructor() {
   
  }

  async processAudio(audioBuffer: ArrayBuffer): Promise<string> {
  
    return `Processed audio of ${audioBuffer.byteLength} bytes`;
  }
}
