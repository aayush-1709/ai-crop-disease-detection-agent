import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Loader, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './History.css';

const API_URL = 'http://127.0.0.1:5000';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${API_URL}/history`);
            setHistory(response.data.history || []);
        } catch (err) {
            setError('Failed to fetch history. Ensure Firebase is configured and backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Unknown date';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <motion.div
            className="history-container container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="history-header">
                <h1 className="heading-1 text-gradient">Diagnosis History</h1>
                <p className="body-text">Review your past plant disease diagnoses and track your crop's health over time.</p>
            </div>

            {error && (
                <div className="error-alert" style={{ marginBottom: '2rem' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-state flex-center" style={{ minHeight: '300px', flexDirection: 'column' }}>
                    <Loader className="spin" size={48} color="var(--primary-color)" />
                    <p style={{ marginTop: '1rem' }} className="text-light">Loading history...</p>
                </div>
            ) : history.length === 0 ? (
                <motion.div
                    className="empty-state glass-panel flex-center"
                    style={{ minHeight: '300px', flexDirection: 'column' }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <Clock size={64} color="var(--text-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h2 className="heading-2">No History Yet</h2>
                    <p className="body-text">Diagnose some plants to see your history here.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="history-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {history.map((item, index) => (
                        <motion.div
                            key={index}
                            className="history-card glass-panel"
                            variants={cardVariants}
                            whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)' }}
                        >
                            {item.image_base64 && (
                                <div className="history-image">
                                    <img src={`data:image/jpeg;base64,${item.image_base64}`} alt="Diagnosed leaf" />
                                </div>
                            )}
                            <div className="history-content">
                                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                    <h3 className="disease-name" style={{ fontSize: '1.25rem', margin: 0 }}>
                                        {item.predicted_class_name?.replace(/_/g, ' ')}
                                    </h3>
                                    <span className="confidence-badge">
                                        {item.confidence?.toFixed(1)}% Confidence
                                    </span>
                                </div>
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                    <Clock size={14} />
                                    <span>{formatDate(item.timestamp)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default History;
