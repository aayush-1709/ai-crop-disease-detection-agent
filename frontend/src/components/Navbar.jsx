import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Diagnosis', path: '/' },
        { name: 'History', path: '/history_page' },
        { name: 'Tools', path: '/tools' },
        { name: 'User Guide', path: '/user_guide' },
    ];

    return (
        <motion.nav
            className="navbar glass-panel"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{
                margin: '1rem auto',
                width: 'calc(100% - 2rem)',
                maxWidth: '1200px',
                borderRadius: '16px',
                position: 'sticky',
                top: '1rem'
            }}
        >
            <div className="nav-container container" style={{ padding: '0 1rem' }}>
                <Link to="/" className="nav-logo flex-center">
                    <Leaf className="logo-icon text-gradient" size={28} />
                    <span className="logo-text heading-2" style={{ margin: 0 }}>AI Crop Doctor</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links desktop-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            {link.name}
                            {location.pathname === link.path && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="nav-indicator"
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                                        borderRadius: '2px'
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                    <button className="lang-btn flex-center">
                        <Globe size={18} />
                        EN
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="mobile-nav"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
