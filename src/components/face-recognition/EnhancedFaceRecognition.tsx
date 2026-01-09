import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CameraOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedFaceRecognitionProps {
  onVerificationComplete: (success: boolean, data?: any) => void;
  employeeId?: string;
  mode?: 'attendance' | 'verification';
  requirePinFallback?: boolean;
}

export function EnhancedFaceRecognition({ 
  onVerificationComplete, 
  employeeId, 
  mode = 'attendance',
  requirePinFallback = true 
}: EnhancedFaceRecognitionProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'scanning' | 'detected' | 'verified' | 'failed'>('idle');
  const [confidence, setConfidence] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Load face-api models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setIsModelLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading face models:', error);
      setErrorMessage('Gagal memuat model pengenalan wajah. Pastikan file model tersedia.');
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setDetectionStatus('scanning');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
    setDetectionStatus('idle');
  };

  const detectFace = async () => {
    if (!videoRef.current || !isModelLoaded) return;

    setIsScanning(true);
    setDetectionStatus('scanning');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const confidenceScore = detection.detection.score;
        setConfidence(Math.round(confidenceScore * 100));

        if (confidenceScore > 0.5) {
          setDetectionStatus('verified');
          onVerificationComplete(true, {
            confidence: confidenceScore,
            descriptor: Array.from(detection.descriptor)
          });
        } else {
          setDetectionStatus('failed');
          setErrorMessage('Confidence terlalu rendah. Silakan coba lagi.');
        }
      } else {
        setDetectionStatus('failed');
        setErrorMessage('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
      }
    } catch (error) {
      console.error('Face detection error:', error);
      setDetectionStatus('failed');
      setErrorMessage('Terjadi kesalahan saat deteksi wajah.');
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = () => {
    switch (detectionStatus) {
      case 'verified': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'scanning': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (detectionStatus) {
      case 'verified': return 'Verifikasi Berhasil';
      case 'failed': return 'Verifikasi Gagal';
      case 'scanning': return 'Memindai...';
      default: return 'Siap';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pengenalan Wajah</span>
          <Badge variant="outline" className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Memuat model pengenalan wajah...</p>
          </div>
        ) : (
          <>
            {/* Camera View */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CameraOff className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <div className="animate-pulse">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <p>Memindai wajah...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Bar */}
            {confidence > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{confidence}%</span>
                </div>
                <Progress value={confidence} className="h-2" />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Status Icons */}
            {detectionStatus === 'verified' && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-medium">Wajah terverifikasi!</span>
              </div>
            )}

            {detectionStatus === 'failed' && (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                <span className="font-medium">Verifikasi gagal</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isCameraActive ? (
                <Button 
                  onClick={startCamera} 
                  className="flex-1"
                  disabled={!isModelLoaded}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Nyalakan Kamera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={detectFace} 
                    className="flex-1"
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Memindai...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Pindai Wajah
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={stopCamera}
                  >
                    <CameraOff className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
