export type NoiseType = 'white' | 'blue' | 'violet' | 'brown';

export interface NoiseSettings {
  type: NoiseType;
  level: number; // -60 to 0 dB
  highShelfGain: number; // -12 to +12 dB
  highShelfFreq: number; // 500 to 8000 Hz
  isNotchEnabled: boolean;
  notchFreq: number; // 2000 to 8000 Hz
  notchWidth: number; // 200 to 1000 Hz
}

export interface ToneSettings {
  frequency: number; // 2000 to 12000 Hz
  gain: number; // -60 to 0 dB
  
  isFmEnabled: boolean;
  fmFreq: number; // 5 to 20 Hz
  fmDepth: number; // 0 to 200 Hz

  areHarmonicsEnabled: boolean;

  isBeatToneEnabled: boolean;
  beatRate: number; // 1 to 10 Hz
}

export interface BandEmphasisSettings {
  frequency: number; // 1000 to 12000 Hz
  q: number; // 5 to 30
  gain: number; // -12 to +12 dB
}

export interface RoutingSettings {
  pan: number; // -1 (L) to +1 (R)
  balance: number; // -1 (Noise) to +1 (Tone)
}

export interface MasterSettings {
  isNoiseEnabled: boolean;
  isToneEnabled: boolean;
}

export interface AudioSettings {
  noise: NoiseSettings;
  tone: ToneSettings;
  bandEmphasis: BandEmphasisSettings;
  routing: RoutingSettings;
  master: MasterSettings;
}
