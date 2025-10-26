class NoiseGeneratorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._type = 'white';
    this.lastOut = {
      brown: 0.0,
      blue: 0.0,
      violet: {
        lastIn: 0.0,
        lastOut: 0.0,
      }
    };
    this.port.onmessage = (event) => {
      if (event.data.type) {
        this._type = event.data.type;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    
    for (let i = 0; i < channel.length; i++) {
      switch (this._type) {
        case 'white':
          channel[i] = Math.random() * 2 - 1;
          break;
        case 'brown':
          const white_br = Math.random() * 2 - 1;
          this.lastOut.brown = (this.lastOut.brown + (0.02 * white_br)) / 1.02;
          channel[i] = this.lastOut.brown * 3.5;
          // Clamp to avoid clipping
          if (channel[i] > 1.0) channel[i] = 1.0;
          if (channel[i] < -1.0) channel[i] = -1.0;
          break;
        case 'blue':
          const white_bl = Math.random() * 2 - 1;
          channel[i] = (white_bl - this.lastOut.blue) * 0.5;
          this.lastOut.blue = white_bl;
          break;
        case 'violet':
          const white_v = Math.random() * 2 - 1;
          const blue = white_v - this.lastOut.violet.lastIn;
          channel[i] = (blue - this.lastOut.violet.lastOut) * 0.5;
          this.lastOut.violet.lastOut = blue;
          this.lastOut.violet.lastIn = white_v;
          break;
        default:
          channel[i] = Math.random() * 2 - 1;
      }
    }
    
    // If there are more channels, copy the first channel's data to them.
    for (let c = 1; c < output.length; c++) {
        output[c].set(channel);
    }

    return true;
  }
}

registerProcessor('noise-generator-processor', NoiseGeneratorProcessor);
