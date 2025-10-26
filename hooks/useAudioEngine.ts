import { useRef, useEffect, useState, useCallback } from 'react';
import { AudioSettings } from '../types';

const dbToLinear = (db: number) => Math.pow(10, db / 20);

export const setupAudioGraph = (ctx: BaseAudioContext, settings: AudioSettings, noiseSrc: AudioNode) => {
    // --- MASTER & ROUTING ---
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    
    const panner = ctx.createStereoPanner();
    panner.connect(analyser);

    // --- NOISE CHAIN ---
    const highShelf = ctx.createBiquadFilter();
    const peaking = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    const noiseBalanceGain = ctx.createGain();
    
    // Compatibility-aware Notch Filter setup
    const notch = ctx.createBiquadFilter();
    let isNotchEmulated = false;
    try {
        notch.type = 'notch';
        if (notch.type !== 'notch') throw new Error('Silent fail for notch type');
    } catch (e) {
        isNotchEmulated = true;
        notch.type = 'peaking';
        console.warn("Browser compatibility: Native 'notch' filter not supported. Emulating with a 'peaking' filter. Characteristics may differ.");
    }

    highShelf.type = 'highshelf';
    peaking.type = 'peaking';
    
    noiseSrc.connect(highShelf).connect(peaking).connect(notch).connect(noiseGain).connect(noiseBalanceGain).connect(panner);
    
    // --- TONE CHAIN (MODULAR) ---
    const toneSummingNode = ctx.createGain();
    const toneGain = ctx.createGain(); // This is the main level control
    const toneBalanceGain = ctx.createGain();

    toneSummingNode.connect(toneGain).connect(toneBalanceGain).connect(panner);
    
    // Main Tone
    const toneSrc = ctx.createOscillator();
    toneSrc.type = 'sine';
    toneSrc.connect(toneSummingNode);

    // FM Tone
    const modOsc = ctx.createOscillator();
    const modGain = ctx.createGain();
    modOsc.connect(modGain).connect(toneSrc.frequency);

    // Harmonics
    const harmonic2Osc = ctx.createOscillator();
    const harmonic2Gain = ctx.createGain();
    harmonic2Osc.type = 'sine';
    harmonic2Gain.gain.value = 0;
    harmonic2Osc.connect(harmonic2Gain).connect(toneSummingNode);

    const harmonic3Osc = ctx.createOscillator();
    const harmonic3Gain = ctx.createGain();
    harmonic3Osc.type = 'sine';
    harmonic3Gain.gain.value = 0;
    harmonic3Osc.connect(harmonic3Gain).connect(toneSummingNode);

    // Beat Tone
    const beatOsc = ctx.createOscillator();
    const beatGain = ctx.createGain();
    beatOsc.type = 'sine';
    beatGain.gain.value = 0;
    beatOsc.connect(beatGain).connect(toneSummingNode);
    
    return {
        analyser, panner,
        noiseSrc, highShelf, peaking, notch, isNotchEmulated, noiseGain, noiseBalanceGain,
        toneSummingNode, toneGain, toneBalanceGain,
        toneSrc, modOsc, modGain,
        harmonic2Osc, harmonic2Gain, harmonic3Osc, harmonic3Gain,
        beatOsc, beatGain,
        finalNode: analyser,
    };
};

export const useAudioEngine = (settings: AudioSettings) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>({});
  
  const activeNoiseTypeRef = useRef<AudioSettings['noise']['type'] | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isNotchEmulated, setIsNotchEmulated] = useState(false);
  
  const stopAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          audioContextRef.current = ctx;

          // Robustly load the worklet by fetching it, creating a blob, and using an object URL.
          // This avoids server pathing and configuration issues.
          let processorUrl;
          try {
            const response = await fetch('/audio/noise-generator-processor.js');
            if (!response.ok) {
              throw new Error(`Failed to fetch worklet script: ${response.status} ${response.statusText}`);
            }
            const processorCode = await response.text();
            const blob = new Blob([processorCode], { type: 'application/javascript' });
            processorUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.error("Could not load AudioWorklet processor script.", e);
            throw e; // Propagate error to the outer catch block
          }

          await ctx.audioWorklet.addModule(processorUrl);
          URL.revokeObjectURL(processorUrl); // Clean up the object URL once loaded

          const noiseWorkletNode = new AudioWorkletNode(ctx, 'noise-generator-processor');
          noiseWorkletNode.port.postMessage({ type: settings.noise.type });
          activeNoiseTypeRef.current = settings.noise.type;

          const graphNodes = setupAudioGraph(ctx, settings, noiseWorkletNode);
          if (graphNodes.isNotchEmulated) {
              setIsNotchEmulated(true);
          }
          graphNodes.finalNode.connect(ctx.destination);
          nodesRef.current = graphNodes;
          
          // Start all sources that need starting (worklet starts automatically)
          Object.values(graphNodes).forEach((node: any) => {
              if (node.start) node.start();
          });
      }
      
      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }
      setIsPlaying(true);
    } catch (error) {
        console.error("Failed to start audio engine:", error);
        alert("Could not start audio. Your browser may not support AudioWorklets, or the processor file failed to load.");
        setIsPlaying(false);
    }
  }, [settings]);


  // Effect for updating all params
  useEffect(() => {
    const { noise, tone, bandEmphasis, routing, master } = settings;
    const ctx = audioContextRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes.noiseSrc) return;

    const now = ctx.currentTime;
    
    // --- MASTER & ROUTING ---
    if(nodes.noiseGain) nodes.noiseGain.gain.linearRampToValueAtTime(master.isNoiseEnabled ? dbToLinear(noise.level) : 0, now + 0.05);
    if(nodes.toneGain) nodes.toneGain.gain.linearRampToValueAtTime(master.isToneEnabled ? dbToLinear(tone.gain) : 0, now + 0.05);
    if(nodes.panner) nodes.panner.pan.linearRampToValueAtTime(routing.pan, now + 0.05);
    if (nodes.noiseBalanceGain && nodes.toneBalanceGain) {
        const noiseBalance = Math.cos((routing.balance + 1) * Math.PI / 4);
        const toneBalance = Math.sin((routing.balance + 1) * Math.PI / 4);
        nodes.noiseBalanceGain.gain.linearRampToValueAtTime(noiseBalance, now + 0.05);
        nodes.toneBalanceGain.gain.linearRampToValueAtTime(toneBalance, now + 0.05);
    }

    // --- NOISE SETTINGS ---
    if(nodes.highShelf) {
        nodes.highShelf.gain.linearRampToValueAtTime(noise.highShelfGain, now + 0.05);
        nodes.highShelf.frequency.linearRampToValueAtTime(noise.highShelfFreq, now + 0.05);
    }
    
    if (noise.type !== activeNoiseTypeRef.current) {
        if (nodes.noiseSrc.port) { // Check if it's a worklet node with a port
            nodes.noiseSrc.port.postMessage({ type: noise.type });
        }
        activeNoiseTypeRef.current = noise.type;
    }

    if (nodes.notch) {
        const isNotchReallyEnabled = noise.isNotchEnabled && master.isNoiseEnabled;
        const q = noise.notchFreq / noise.notchWidth;
        nodes.notch.frequency.linearRampToValueAtTime(noise.notchFreq, now + 0.05);
        nodes.notch.Q.linearRampToValueAtTime(Math.max(0.0001, q), now + 0.05);

        if (nodes.isNotchEmulated) {
            // Emulated mode: use peaking filter with negative gain to cut, or 0 gain to disable.
            nodes.notch.type = 'peaking';
            const targetGain = isNotchReallyEnabled ? -40 : 0;
            nodes.notch.gain.linearRampToValueAtTime(targetGain, now + 0.05);
        } else {
            // Native mode: switch type between 'notch' and 'allpass' to enable/disable.
            const targetType = isNotchReallyEnabled ? 'notch' : 'allpass';
            if (nodes.notch.type !== targetType) {
                nodes.notch.type = targetType;
            }
        }
    }
    
    // --- TONE SETTINGS ---
    if(nodes.toneSrc) {
      nodes.toneSrc.frequency.linearRampToValueAtTime(tone.frequency, now + 0.05);
    }

    if (nodes.modOsc && nodes.modGain) {
        const isFmReallyEnabled = master.isToneEnabled && tone.isFmEnabled;
        nodes.modOsc.frequency.linearRampToValueAtTime(tone.fmFreq, now + 0.05);
        nodes.modGain.gain.linearRampToValueAtTime(isFmReallyEnabled ? tone.fmDepth : 0, now + 0.05);
    }

    if (nodes.harmonic2Osc && nodes.harmonic2Gain && nodes.harmonic3Osc && nodes.harmonic3Gain) {
        const areHarmonicsReallyEnabled = master.isToneEnabled && tone.areHarmonicsEnabled;
        const harmonicGain = areHarmonicsReallyEnabled ? 0.15 : 0;
        nodes.harmonic2Osc.frequency.linearRampToValueAtTime(tone.frequency * 2, now + 0.05);
        nodes.harmonic3Osc.frequency.linearRampToValueAtTime(tone.frequency * 3, now + 0.05);
        nodes.harmonic2Gain.gain.linearRampToValueAtTime(harmonicGain, now + 0.05);
        nodes.harmonic3Gain.gain.linearRampToValueAtTime(harmonicGain, now + 0.05);
    }

    if (nodes.beatOsc && nodes.beatGain) {
        const isBeatReallyEnabled = master.isToneEnabled && tone.isBeatToneEnabled;
        nodes.beatOsc.frequency.linearRampToValueAtTime(tone.frequency + tone.beatRate, now + 0.05);
        nodes.beatGain.gain.linearRampToValueAtTime(isBeatReallyEnabled ? 1.0 : 0, now + 0.05);
    }
    
    // --- BAND EMPHASIS ---
    if(nodes.peaking) {
        nodes.peaking.frequency.linearRampToValueAtTime(bandEmphasis.frequency, now + 0.05);
        nodes.peaking.Q.linearRampToValueAtTime(bandEmphasis.q, now + 0.05);
        nodes.peaking.gain.linearRampToValueAtTime(bandEmphasis.gain, now + 0.05);
    }

  }, [settings]);
  
  return { isPlaying, startAudio, stopAudio, analyserNode: nodesRef.current.analyser, isNotchEmulated };
};
