import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FormCheckTarget } from '../types';
import { getExerciseAnalyzer } from '../services/formAnalysisService';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

// Declare pose-detection on the window object for CDN script access
// Fix: Augment the global Window interface to include tf and poseDetection, resolving TypeScript errors.
declare global {
  interface Window {
    poseDetection: any;
    tf: any;
  }
}

interface Props {
  target: FormCheckTarget;
  onExit: () => void;
}

const FormCheckView: React.FC<Props> = ({ target, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const detectorRef = useRef<any>(null);
  const analyzerRef = useRef(getExerciseAnalyzer(target.exerciseName));

  const [status, setStatus] = useState('loading'); // loading, ready, error
  const [statusMessage, setStatusMessage] = useState('Caricamento AI Coach...');
  const [feedback, setFeedback] = useState<string[]>([]);
  const [repCount, setRepCount] = useState(0);

  const drawSkeleton = useCallback((keypoints: any[], ctx: CanvasRenderingContext2D, badKeypoints: string[] = []) => {
    const adjacentKeyPoints = window.poseDetection.util.getAdjacentPairs(window.poseDetection.SupportedModels.MoveNet);
    
    // Draw connections
    adjacentKeyPoints.forEach((pair: any) => {
        const [i, j] = pair;
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (kp1.score > 0.5 && kp2.score > 0.5) {
            const isBadConnection = badKeypoints.includes(kp1.name) || badKeypoints.includes(kp2.name);
            ctx.beginPath();
            ctx.moveTo(canvasRef.current!.width - kp1.x, kp1.y);
            ctx.lineTo(canvasRef.current!.width - kp2.x, kp2.y);
            ctx.lineWidth = isBadConnection ? 4 : 2;
            ctx.strokeStyle = isBadConnection ? '#ef4444' : '#22d3ee'; // red for bad, cyan for good
            ctx.stroke();
        }
    });

    // Draw keypoints
    keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
            const isBadKeypoint = badKeypoints.includes(keypoint.name);
            ctx.beginPath();
            ctx.arc(canvasRef.current!.width - keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = isBadKeypoint ? '#ef4444' : '#22d3ee';
            ctx.fill();
        }
    });
  }, []);

  const detectPose = useCallback(async (video: HTMLVideoElement) => {
    if (detectorRef.current) {
        const poses = await detectorRef.current.estimatePoses(video);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            if (poses && poses.length > 0) {
                const pose = poses[0];
                const { feedback, repCount, badKeypoints } = analyzerRef.current.analyze(pose.keypoints);
                setFeedback(feedback);
                setRepCount(repCount);
                
                drawSkeleton(pose.keypoints, ctx, badKeypoints);
            }
        }
    }
    animationFrameId.current = requestAnimationFrame(() => detectPose(video));
  }, [drawSkeleton]);


  useEffect(() => {
    const initialize = async () => {
      // 1. Wait for TF.js scripts to be loaded on the window object
      setStatus('loading');
      setStatusMessage('Caricamento librerie AI...');
      
      const scriptsReady = await new Promise<boolean>(resolve => {
        const interval = setInterval(() => {
          if (typeof window.tf !== 'undefined' && typeof window.poseDetection !== 'undefined') {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => { // Timeout after 10 seconds
          clearInterval(interval);
          resolve(false);
        }, 10000);
      });

      if (!scriptsReady) {
        setStatus('error');
        setStatusMessage("Errore nel caricamento delle librerie AI. Controlla la connessione internet e ricarica la pagina.");
        return;
      }

      // 2. Load the MoveNet model
      setStatusMessage('Inizializzazione modello AI...');
      try {
        // Fix: Access tf and poseDetection from the window object to align with the augmented Window interface.
        await window.tf.setBackend('webgl');
        const model = window.poseDetection.SupportedModels.MoveNet;
        const detectorConfig = { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
        detectorRef.current = await window.poseDetection.createDetector(model, detectorConfig);
      } catch (err) {
        console.error("Error loading model: ", err);
        setStatus('error');
        setStatusMessage("Impossibile caricare il modello AI. Il tuo dispositivo o browser potrebbe non essere supportato.");
        return;
      }

      // 3. Set up the camera
      setStatusMessage('Accesso alla fotocamera...');
      let video: HTMLVideoElement | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise(resolve => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => resolve(null);
            }
          });
          await videoRef.current.play();
          video = videoRef.current;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setStatus('error');
        setStatusMessage("Accesso alla fotocamera negato. Controlla i permessi del browser e ricarica la pagina.");
        return;
      }

      // 4. Start pose detection
      if (video && detectorRef.current) {
        setStatus('ready');
        detectPose(video);
      } else {
        setStatus('error');
        setStatusMessage("Errore durante l'inizializzazione. Riprova.");
      }
    };

    initialize();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [detectPose]);

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden border border-slate-700">
      <video ref={videoRef} style={{ transform: 'scaleX(-1)', display: 'none' }} />
      <canvas ref={canvasRef} className="w-full h-auto" />
      
      {status !== 'ready' && 
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
          {status === 'loading' && <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-cyan-400 mb-4"></div>}
          <p className={status === 'error' ? 'text-red-400' : 'text-white'}>{statusMessage}</p>
        </div>
      }

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">IARNOLD VISION COACH</h2>
          <p className="text-cyan-400 text-sm sm:text-base">{target.exerciseName}</p>
        </div>
        <button onClick={onExit} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-700/80 text-white font-semibold rounded-lg hover:bg-slate-600/80 transition-colors text-sm sm:text-base">
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Indietro</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-end gap-2">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-cyan-300 p-3 rounded-lg flex-1">
          <p className="font-semibold text-sm">Feedback:</p>
          <ul className="text-xs sm:text-sm list-disc list-inside">
            {feedback.length > 0 ? feedback.map((fb, i) => <li key={i}>{fb}</li>) : <li>Inizia l'esercizio!</li>}
          </ul>
        </div>
        <div className="text-center bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-2 sm:p-4 rounded-lg">
          <p className="text-white text-sm sm:text-lg font-display tracking-widest">REPS</p>
          <p className="text-4xl sm:text-5xl font-bold text-amber-400">{repCount}</p>
        </div>
      </div>
    </div>
  );
};

export default FormCheckView;
