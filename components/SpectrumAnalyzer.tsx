import React, { useRef, useEffect } from 'react';

interface SpectrumAnalyzerProps {
  analyserNode: AnalyserNode | null;
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set a higher resolution for the canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Use a smaller FFT size for a less detailed but potentially smoother/faster visualization
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.85;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.fillStyle = '#21262d'; // bg-gray-800
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      // We only visualize up to a certain frequency, e.g., 16kHz
      const maxFreq = 16000;
      const nyquist = analyserNode.context.sampleRate / 2;
      const maxIndex = Math.floor(bufferLength * maxFreq / nyquist);

      for (let i = 0; i < maxIndex; i++) {
        const v = dataArray[i] / 255.0;
        const barHeight = v * height;

        // Gradient for the bars
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#30363d');
        gradient.addColorStop(0.5, '#58a6ff');
        gradient.addColorStop(1, '#a3cfff');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyserNode]);

  return (
    <div className="bg-gray-800 p-2 rounded-lg">
        <canvas ref={canvasRef} className="w-full h-40 rounded-md"></canvas>
    </div>
  );
};

export default SpectrumAnalyzer;
