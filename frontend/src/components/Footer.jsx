import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Leaf className="logo-icon text-gradient" size={24} />
                            <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 600 }}>AI Crop Doctor</span>
                        </Link>
                        <p className="body-text" style={{ fontSize: '0.875rem' }}>
                            Empowering farmers with instant AI-driven crop disease diagnosis and sustainable solutions.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul>
                            <li><Link to="/">Home Diagnosis</Link></li>
                            <li><Link to="/history_page">Analysis History</Link></li>
                            <li><Link to="/tools">Agri Tools</Link></li>
                            <li><Link to="/user_guide">User Guide</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-heading">Legal</h4>
                        <ul>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms of Service</Link></li>
                            <li><Link to="/disclaimer">Disclaimer</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-heading">Contact</h4>
                        <ul>
                            <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <Mail size={16} className="text-light" />
                                <a href="mailto:support@aicropdoctor.com">support@aicropdoctor.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="body-text flex-center" style={{ fontSize: '0.875rem', margin: 0 }}>
                        Made with <Heart size={16} color="var(--danger-color)" style={{ margin: '0 4px' }} /> for Farmers &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
