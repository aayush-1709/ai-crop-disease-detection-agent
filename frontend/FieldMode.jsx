import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './FieldMode.css';

const FieldMode = () => {
    const videoRef = useRef(null);
    const [model, setModel] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadModel();
    }, []);

    const loadModel = async () => {
        try {
            console.log('Loading MobileNet model...');
            const loadedModel = await mobilenet.load();
            setModel(loadedModel);
            setIsModelLoading(false);
            console.log('Model loaded successfully.');
        } catch (err) {
            console.error('Failed to load model:', err);
            setError('Failed to load offline model. Please check your connection initially.');
            setIsModelLoading(false);
        }
    };

    const startCamera = async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Prefer back camera
                audio: false
            });
            videoRef.current.srcObject = stream;
            
            // Wait for video to be ready
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
                setIsCameraActive(true);
                detectFrame();
            };
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please allow permissions.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
    };

    const detectFrame = async () => {
        if (!videoRef.current || !model || videoRef.current.paused || videoRef.current.ended) {
            return;
        }

        try {
            // Classify the image.
            const predictions = await model.classify(videoRef.current);
            setPredictions(predictions);

            // Loop
            requestAnimationFrame(detectFrame);
        } catch (err) {
            console.error('Detection error:', err);
        }
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const toggleFieldMode = () => {
        if (isCameraActive) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    if (error) {
        return (
            <div className="field-mode-error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="field-mode-container">
            <div className="status-bar">
                <div className={`indicator ${isModelLoading ? 'loading' : 'ready'}`}>
                    {isModelLoading ? 'Loading AI Brain...' : 'AI Ready (Offline Mode)'}
                </div>
            </div>

            <div className="camera-view">
                {!isCameraActive && !isModelLoading && (
                    <div className="start-prompt">
                        <i className="fas fa-camera"></i>
                        <p>Point at a crop leaf to diagnose</p>
                        <button className="primary-btn" onClick={startCamera}>
                            Start Field Mode
                        </button>
                    </div>
                )}
                
                <video 
                    ref={videoRef} 
                    className={`video-feed ${isCameraActive ? 'active' : ''}`} 
                    playsInline 
                    muted 
                />
                
                {isCameraActive && (
                    <div className="overlay-controls">
                        <button className="stop-btn" onClick={stopCamera}>
                            Stop Scanner
                        </button>
                    </div>
                )}
            </div>

            {isCameraActive && predictions.length > 0 && (
                <div className="predictions-panel">
                    <h3>Real-time Analysis</h3>
                    {predictions.map((pred, idx) => (
                        <div key={idx} className="prediction-item">
                            <span className="label">{pred.className}</span>
                            <div className="confidence-wrapper">
                                <div 
                                    className="confidence-fill" 
                                    style={{ width: `${pred.probability * 100}%` }}
                                ></div>
                            </div>
                            <span className="score">{Math.round(pred.probability * 100)}%</span>
                        </div>
                    ))}
                    <div className="note">
                        <small>Note: Using MobileNet (General). Fine-tuning required for specific crops.</small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldMode;
