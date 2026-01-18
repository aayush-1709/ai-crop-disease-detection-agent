import React from 'react';
import ReactDOM from 'react-dom/client';
import FieldMode from './FieldMode';

// Look for the element in index.html
const rootElement = document.getElementById('field-mode-root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <FieldMode />
        </React.StrictMode>
    );
} else {
    // Optional: Only log if we expect it to be there, or silently fail if it's conditional
    console.log('Field Mode root element not found. React app not mounted.');
}
