
import React, { useState, useEffect } from 'react';
import { AudioSettings, NoiseType } from './types';
import { useAudioEngine, setupAudioGraph } from './hooks/useAudioEngine';
import { audioBufferToWav } from './utils/wavUtils';
import Slider from './components/Slider';
import SegmentedControl from './components/SegmentedControl';
import ToggleSwitch from './components/ToggleSwitch';
import ControlSection from './components/ControlSection';
import SpectrumAnalyzer from './components/SpectrumAnalyzer';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M6.32 5.013C5.587 4.536 4.667 5.05 4.667 5.92v8.16c0 .87 1.08 1.348 1.76.848l6.75-4.08c.65-.393.65-1.353 0-1.746l-6.857-4.13z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M6 5h2v10H6V5zm6 0h2v10h-2V5z" /></svg>;
const PlaybackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NoiseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0m-12.728 0l12.728 12.728" /></svg>;
const ToneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const RoutingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const ABIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const PresetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const SpectrumIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 18v-4M8 18V6M12 18v-8M16 18V2M20 18v-6" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;


const initialSettings: AudioSettings = {
  noise: { type: 'white', level: -20, highShelfGain: 0, highShelfFreq: 4000, isNotchEnabled: false, notchFreq: 4000, notchWidth: 500 },
  tone: { 
    frequency: 6500, 
    gain: -30, 
    isFmEnabled: false,
    fmFreq: 10,
    fmDepth: 50,
    areHarmonicsEnabled: false,
    isBeatToneEnabled: false,
    beatRate: 5 
  },
  bandEmphasis: { frequency: 8000, q: 20, gain: 0 },
  routing: { pan: 0, balance: 0 },
  master: { isNoiseEnabled: true, isToneEnabled: true },
};

type Preset = { name: string; settings: AudioSettings };
const LOCAL_STORAGE_KEY = 'tinnitus-matcher-presets';

export const createNoiseBuffer = (ctx: BaseAudioContext, type: NoiseType, durationSeconds: number) => {
    const bufferSize = durationSeconds * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'blue') { // Differentiated white noise
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (white - lastOut) * 0.5;
          lastOut = white;
        }
    } else if (type === 'violet') { // Twice differentiated
      let lastIn = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const blue = white - lastIn;
        data[i] = (blue - lastOut) * 0.5;
        lastOut = blue;
        lastIn = white;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
        if (data[i] > 1.0) data[i] = 1.0;
        if (data[i] < -1.0) data[i] = -1.0;
      }
    }
    return buffer;
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AudioSettings>(initialSettings);
  const [isRendering, setIsRendering] = useState(false);
  
  const { isPlaying, startAudio, stopAudio, analyserNode, isNotchEmulated } = useAudioEngine(settings);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [abState, setAbState] = useState<{
      a: Preset | null;
      b: Preset | null;
      active: 'a' | 'b';
  }>({ a: null, b: null, active: 'a' });

  // Load presets from localStorage on initial render
  useEffect(() => {
    try {
        const savedPresets = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedPresets) {
            setPresets(JSON.parse(savedPresets));
        } else {
            const defaultPresets: Preset[] = [
                {
                    name: 'Hiss Base',
                    settings: { ...initialSettings, master: { isNoiseEnabled: true, isToneEnabled: false }, noise: { type: 'brown', level: -15, highShelfGain: -6, highShelfFreq: 5000, isNotchEnabled: false, notchFreq: 4000, notchWidth: 500 }}
                },
                {
                    name: 'Tone + Whistle',
                    settings: { ...initialSettings, master: { isNoiseEnabled: false, isToneEnabled: true }, tone: { ...initialSettings.tone, frequency: 8000, gain: -25, isFmEnabled: true, fmFreq: 8, fmDepth: 80 }}
                },
                { name: 'Slot 3', settings: initialSettings },
                { name: 'Slot 4', settings: initialSettings },
                { name: 'Slot 5', settings: initialSettings },
            ];
            setPresets(defaultPresets);
        }
    } catch (error) {
        console.error("Failed to load presets from localStorage", error);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (presets.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
    }
  }, [presets]);

  const handleSettingChange = <K extends keyof AudioSettings, V extends AudioSettings[K]>(
    category: K,
    newValues: Partial<V>
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], ...newValues },
    }));
  };

  const handleLoadPreset = (preset: Preset) => {
    setSettings(preset.settings);
  };
  
  const handleSavePreset = (index: number) => {
    const newPresets = [...presets];
    newPresets[index] = { ...newPresets[index], settings: settings };
    setPresets(newPresets);
    alert(`Preset '${newPresets[index].name}' saved!`);
  };

  const handleRenamePreset = (index: number, newName: string) => {
    const newPresets = [...presets];
    newPresets[index] = { ...newPresets[index], name: newName };
    setPresets(newPresets);
  };

  const handleSetAB = (slot: 'a' | 'b', preset: Preset) => {
    setAbState(prev => ({...prev, [slot]: preset}));
  };

  const handleSwitchAB = (slot: 'a' | 'b') => {
    const targetPreset = slot === 'a' ? abState.a : abState.b;
    if (targetPreset) {
        setSettings(targetPreset.settings);
        setAbState(prev => ({...prev, active: slot}));
    } else {
        alert(`Slot ${slot.toUpperCase()} is not set. Assign a preset to it first.`);
    }
  };
  
  const handleExportWav = async () => {
    setIsRendering(true);
    try {
        const EXPORT_DURATION = 30; // seconds
        const SAMPLE_RATE = 44100;
        const offlineCtx = new OfflineAudioContext(2, SAMPLE_RATE * EXPORT_DURATION, SAMPLE_RATE);

        const noiseBuffer = createNoiseBuffer(offlineCtx, settings.noise.type, EXPORT_DURATION);
        const noiseSrc = offlineCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        
        const graphNodes = setupAudioGraph(offlineCtx, settings, noiseSrc);

        // Connect the final node of the graph to the offline context's destination
        graphNodes.finalNode.connect(offlineCtx.destination);
        
        // Manually apply all settings one-time for rendering
        const now = 0;
        const { noise, tone, bandEmphasis, routing, master } = settings;
        
        // Apply master & routing
        graphNodes.noiseGain.gain.setValueAtTime(master.isNoiseEnabled ? Math.pow(10, noise.level / 20) : 0, now);
        graphNodes.toneGain.gain.setValueAtTime(master.isToneEnabled ? Math.pow(10, tone.gain / 20) : 0, now);
        graphNodes.panner.pan.setValueAtTime(routing.pan, now);
        const noiseBalance = Math.cos((routing.balance + 1) * Math.PI / 4);
        const toneBalance = Math.sin((routing.balance + 1) * Math.PI / 4);
        graphNodes.noiseBalanceGain.gain.setValueAtTime(noiseBalance, now);
        graphNodes.toneBalanceGain.gain.setValueAtTime(toneBalance, now);

        // Apply noise settings
        graphNodes.highShelf.gain.setValueAtTime(noise.highShelfGain, now);
        graphNodes.highShelf.frequency.setValueAtTime(noise.highShelfFreq, now);

        // Apply notch settings, accounting for emulation
        const isNotchReallyEnabled = noise.isNotchEnabled && master.isNoiseEnabled;
        const q = noise.notchFreq / noise.notchWidth;
        graphNodes.notch.frequency.setValueAtTime(noise.notchFreq, now);
        graphNodes.notch.Q.setValueAtTime(Math.max(0.0001, q), now);
        if (graphNodes.isNotchEmulated) {
            graphNodes.notch.type = 'peaking';
            graphNodes.notch.gain.setValueAtTime(isNotchReallyEnabled ? -40 : 0, now);
        } else {
            graphNodes.notch.type = isNotchReallyEnabled ? 'notch' : 'allpass';
        }

        // Apply tone settings
        graphNodes.toneSrc.frequency.setValueAtTime(tone.frequency, now);
        if (master.isToneEnabled && tone.isFmEnabled) {
            graphNodes.modOsc.frequency.setValueAtTime(tone.fmFreq, now);
            graphNodes.modGain.gain.setValueAtTime(tone.fmDepth, now);
        } else {
            graphNodes.modGain.gain.setValueAtTime(0, now);
        }
        if (master.isToneEnabled && tone.areHarmonicsEnabled) {
            graphNodes.harmonic2Osc.frequency.setValueAtTime(tone.frequency * 2, now);
            graphNodes.harmonic3Osc.frequency.setValueAtTime(tone.frequency * 3, now);
            graphNodes.harmonic2Gain.gain.setValueAtTime(0.15, now);
            graphNodes.harmonic3Gain.gain.setValueAtTime(0.15, now);
        }
        if (master.isToneEnabled && tone.isBeatToneEnabled) {
             graphNodes.beatOsc.frequency.setValueAtTime(tone.frequency + tone.beatRate, now);
             graphNodes.beatGain.gain.setValueAtTime(1.0, now);
        } else {
             graphNodes.beatGain.gain.setValueAtTime(0, now);
        }
        
        // Apply band emphasis
        graphNodes.peaking.frequency.setValueAtTime(bandEmphasis.frequency, now);
        graphNodes.peaking.Q.setValueAtTime(bandEmphasis.q, now);
        graphNodes.peaking.gain.setValueAtTime(bandEmphasis.gain, now);

        // Start all sources for rendering
        Object.values(graphNodes).forEach((node: any) => {
            if (node.start) node.start(0);
        });

        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = audioBufferToWav(renderedBuffer);
        
        // Trigger download
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'tinnitus_match.wav';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

    } catch (error) {
        console.error("Failed to export WAV file:", error);
        alert("An error occurred during rendering. Please try again.");
    } finally {
        setIsRendering(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            Tinnitus Matcher
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Craft your soundscape to match and understand your tinnitus.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ControlSection title="Real-time Spectrum" icon={<SpectrumIcon />} className="lg:sticky lg:top-8">
                <SpectrumAnalyzer analyserNode={analyserNode} />
            </ControlSection>

            <ControlSection title="Presets & A/B" icon={<PresetIcon />}>
                {/* A/B Switcher */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-300 mb-3 text-center">A/B Comparison</h3>
                    <div className="flex items-center justify-center space-x-4">
                        <span className="text-gray-400 font-mono text-sm w-1/3 text-right truncate">A: {abState.a?.name ?? 'Not Set'}</span>
                        <div className="flex w-24 bg-gray-900 rounded-md p-1">
                            <button onClick={() => handleSwitchAB('a')} className={`w-1/2 text-center text-sm font-bold py-2 rounded transition-colors duration-200 ${abState.active === 'a' ? 'bg-blue-accent text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}>A</button>
                            <button onClick={() => handleSwitchAB('b')} className={`w-1/2 text-center text-sm font-bold py-2 rounded transition-colors duration-200 ${abState.active === 'b' ? 'bg-blue-accent text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}>B</button>
                        </div>
                        <span className="text-gray-400 font-mono text-sm w-1/3 text-left truncate">B: {abState.b?.name ?? 'Not Set'}</span>
                    </div>
                </div>
                {/* Preset Slots */}
                <div className="space-y-4">
                    {presets.map((preset, index) => (
                        <div key={index} className="bg-gray-800 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-3">
                            <input 
                                type="text" 
                                value={preset.name}
                                onChange={(e) => handleRenamePreset(index, e.target.value)}
                                className="bg-gray-700 text-white font-semibold rounded px-3 py-2 w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-accent"
                            />
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <button onClick={() => handleLoadPreset(preset)} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded transition-colors">Load</button>
                                <button onClick={() => handleSavePreset(index)} className="bg-green-accent/80 hover:bg-green-accent text-white text-sm font-bold py-2 px-3 rounded transition-colors">Save</button>
                                <button onClick={() => handleSetAB('a', preset)} className="bg-blue-accent/30 border border-blue-accent/50 hover:bg-blue-accent/50 text-blue-accent text-sm font-bold py-1 px-2 rounded transition-colors">Set A</button>
                                <button onClick={() => handleSetAB('b', preset)} className="bg-blue-accent/30 border border-blue-accent/50 hover:bg-blue-accent/50 text-blue-accent text-sm font-bold py-1 px-2 rounded transition-colors">Set B</button>
                            </div>
                        </div>
                    ))}
                </div>
            </ControlSection>

            <ControlSection title="Export Audio" icon={<ExportIcon />}>
                <div className="flex items-center justify-center">
                    <button 
                        onClick={handleExportWav}
                        disabled={isRendering}
                        className="w-full max-w-sm bg-blue-accent hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                         {isRendering ? 'Rendering...' : 'Export 30s WAV File'}
                    </button>
                </div>
            </ControlSection>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ControlSection title="Playback Controls" icon={<PlaybackIcon />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <button
                        onClick={isPlaying ? stopAudio : startAudio}
                        className={`w-full text-lg font-bold py-4 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-3
                        ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-accent hover:bg-green-500 text-white'}`}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        <span>{isPlaying ? 'STOP' : 'START'}</span>
                    </button>
                    <div className="flex flex-col gap-3">
                         <ToggleSwitch label="Noise Component" enabled={settings.master.isNoiseEnabled} onChange={(e) => handleSettingChange('master', { isNoiseEnabled: e })} />
                         <ToggleSwitch label="Tone Component" enabled={settings.master.isToneEnabled} onChange={(e) => handleSettingChange('master', { isToneEnabled: e })} />
                    </div>
                </div>
            </ControlSection>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ControlSection title="1. Noise Base" icon={<NoiseIcon />}>
                    <SegmentedControl label="Тип шума" options={[{value: 'white', label: 'White'}, {value: 'blue', label: 'Blue'}, {value: 'violet', label: 'Violet'}, {value: 'brown', label: 'Brown'}]} value={settings.noise.type} onChange={v => handleSettingChange('noise', { type: v })}/>
                    <Slider label="Уровень шума" value={settings.noise.level} onChange={v => handleSettingChange('noise', { level: v })} min={-60} max={0} step={0.5} unit="dB" />
                    <Slider label="High-shelf фильтр (slope)" value={settings.noise.highShelfGain} onChange={v => handleSettingChange('noise', { highShelfGain: v })} min={-12} max={12} step={0.5} unit="dB" />
                    <Slider label="High-shelf Cutoff" value={settings.noise.highShelfFreq} onChange={v => handleSettingChange('noise', { highShelfFreq: v })} min={500} max={8000} step={50} unit="Hz" />
                    <div className="border-t border-gray-700 pt-6 mt-6">
                        <ToggleSwitch label="Enable Notch Filter" enabled={settings.noise.isNotchEnabled} onChange={(e) => handleSettingChange('noise', { isNotchEnabled: e })} />
                        {isNotchEmulated && settings.noise.isNotchEnabled && (
                            <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-xs rounded-md">
                                <p><strong>Compatibility Note:</strong> Your browser doesn't fully support the notch filter. An emulation is being used which may sound slightly different.</p>
                            </div>
                        )}
                        {settings.noise.isNotchEnabled && (
                            <div className="mt-6 space-y-6">
                                <Slider label="Notch Freq" value={settings.noise.notchFreq} onChange={v => handleSettingChange('noise', { notchFreq: v })} min={2000} max={8000} step={50} unit="Hz" />
                                <Slider label="Notch Width" value={settings.noise.notchWidth} onChange={v => handleSettingChange('noise', { notchWidth: v })} min={200} max={1000} step={10} unit="Hz" />
                            </div>
                        )}
                    </div>
                </ControlSection>

                <ControlSection title="2. Tone Overlay" icon={<ToneIcon />}>
                    <Slider label="Основная частота" value={settings.tone.frequency} onChange={v => handleSettingChange('tone', { frequency: v })} min={2000} max={12000} step={10} unit="Hz" />
                    <Slider label="Громкость тона" value={settings.tone.gain} onChange={v => handleSettingChange('tone', { gain: v })} min={-60} max={0} step={0.5} unit="dB" />
                    
                    <div className="border-t border-gray-700 pt-6 mt-6 space-y-4">
                        <ToggleSwitch label="Pulsating Whistle (FM)" enabled={settings.tone.isFmEnabled} onChange={(e) => handleSettingChange('tone', { isFmEnabled: e })} />
                        {settings.tone.isFmEnabled && (
                            <div className="pl-4 border-l-2 border-blue-accent/30 space-y-6">
                                <Slider label="Modulation Freq" value={settings.tone.fmFreq} onChange={v => handleSettingChange('tone', { fmFreq: v })} min={5} max={20} step={0.5} unit="Hz" />
                                <Slider label="Modulation Depth" value={settings.tone.fmDepth} onChange={v => handleSettingChange('tone', { fmDepth: v })} min={0} max={200} step={1} unit="Hz" />
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-700 pt-6 mt-6 space-y-4">
                        <ToggleSwitch label="Dirty Tone (Harmonics)" enabled={settings.tone.areHarmonicsEnabled} onChange={(e) => handleSettingChange('tone', { areHarmonicsEnabled: e })} />
                    </div>
                    <div className="border-t border-gray-700 pt-6 mt-6 space-y-4">
                        <ToggleSwitch label="Beat Interference" enabled={settings.tone.isBeatToneEnabled} onChange={(e) => handleSettingChange('tone', { isBeatToneEnabled: e })} />
                        {settings.tone.isBeatToneEnabled && (
                            <div className="pl-4 border-l-2 border-blue-accent/30 space-y-6">
                                <Slider label="Beat Rate" value={settings.tone.beatRate} onChange={v => handleSettingChange('tone', { beatRate: v })} min={1} max={10} step={0.1} unit="Hz" />
                            </div>
                        )}
                    </div>
                </ControlSection>

                <ControlSection title="3. Band Emphasis" icon={<FilterIcon />}>
                    <Slider label="Середина полосы" value={settings.bandEmphasis.frequency} onChange={v => handleSettingChange('bandEmphasis', { frequency: v })} min={1000} max={12000} step={50} unit="Hz" />
                    <Slider label="Q-factor (ширина)" value={settings.bandEmphasis.q} onChange={v => handleSettingChange('bandEmphasis', { q: v })} min={5} max={30} step={0.5} />
                    <Slider label="Gain" value={settings.bandEmphasis.gain} onChange={v => handleSettingChange('bandEmphasis', { gain: v })} min={-12} max={12} step={0.5} unit="dB" />
                </ControlSection>

                <ControlSection title="4. Ear Routing" icon={<RoutingIcon />}>
                    <Slider label="Панорама (L/R)" value={settings.routing.pan} onChange={v => handleSettingChange('routing', { pan: v })} min={-1} max={1} step={0.05} />
                    <Slider label="Баланс (Noise/Tone)" value={settings.routing.balance} onChange={v => handleSettingChange('routing', { balance: v })} min={-1} max={1} step={0.05} />
                </ControlSection>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;