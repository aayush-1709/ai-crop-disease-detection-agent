import React from 'react';
import { Leaf, Droplets, Sun, Wind, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import './Tools.css';

const Tools = () => {
    const tools = [
        {
            title: 'Fertilizer Calculator',
            description: 'Calculate the exact amount of NPK needed based on your crop and field size.',
            icon: <Sprout size={32} />
        },
        {
            title: 'Water Requirement',
            description: 'Estimate daily water needs based on crop stage and local weather.',
            icon: <Droplets size={32} />
        },
        {
            title: 'Weather Forecast',
            description: 'Get 7-day agricultural weather forecast to plan your activities.',
            icon: <Sun size={32} />
        },
        {
            title: 'Pest Alert System',
            description: 'Receive alerts about common pests in your region based on climate conditions.',
            icon: <Wind size={32} />
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
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
            className="container"
            style={{ padding: '2rem 1.5rem 4rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="heading-1 text-gradient">Agricultural Tools</h1>
                <p className="body-text">Utility calculators and trackers to help you manage your farm better.</p>
            </div>

            <motion.div
                className="tools-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {tools.map((tool, index) => (
                    <motion.div
                        key={index}
                        className="tool-card glass-panel flex-center"
                        style={{ flexDirection: 'column', textAlign: 'center', padding: '2.5rem 2rem' }}
                        variants={cardVariants}
                        whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)' }}
                    >
                        <div className="tool-icon-wrapper flex-center">
                            {tool.icon}
                        </div>
                        <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{tool.title}</h3>
                        <p className="body-text" style={{ marginBottom: '1.5rem' }}>{tool.description}</p>
                        <button className="btn-secondary" style={{ width: '100%' }}>Launch Tool</button>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default Tools;
