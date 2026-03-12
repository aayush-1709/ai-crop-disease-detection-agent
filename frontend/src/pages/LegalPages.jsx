import React from 'react';

const PageWrapper = ({ title, children }) => (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '800px' }}>
        <h1 className="heading-1 text-gradient" style={{ marginBottom: '2rem' }}>{title}</h1>
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div className="body-text" style={{ color: 'var(--text-dark)' }}>
                {children}
            </div>
        </div>
    </div>
);

export const Privacy = () => (
    <PageWrapper title="Privacy Policy">
        <h2>1. Information We Collect</h2>
        <p style={{ margin: '1rem 0' }}>We collect information you provide directly to us when you use our app, including crop images, location data (if permitted), and diagnostic history.</p>

        <h2 style={{ marginTop: '2rem' }}>2. How We Use Information</h2>
        <p style={{ margin: '1rem 0' }}>We use the information to provide, maintain, and improve our services, including the accuracy of our AI diagnostic models.</p>
    </PageWrapper>
);

export const Terms = () => (
    <PageWrapper title="Terms of Service">
        <h2>1. Acceptance of Terms</h2>
        <p style={{ margin: '1rem 0' }}>By accessing and using AI Crop Doctor, you agree to be bound by these Terms of Service.</p>

        <h2 style={{ marginTop: '2rem' }}>2. Use of Service</h2>
        <p style={{ margin: '1rem 0' }}>You agree to use this service for lawful agricultural purposes only. The app provides automated recommendations that should be verified independently.</p>
    </PageWrapper>
);

export const Disclaimer = () => (
    <PageWrapper title="Disclaimer">
        <h2>Medical & Agricultural Disclaimer</h2>
        <p style={{ margin: '1rem 0' }}>AI Crop Doctor provides automated diagnoses based on machine learning models. While we strive for accuracy, the results are indicative and should not entirely replace professional agricultural advice.</p>

        <p style={{ margin: '1rem 0' }}>Consult local agronomists or agricultural extension officers before applying any chemical treatments to your crops.</p>
    </PageWrapper>
);
