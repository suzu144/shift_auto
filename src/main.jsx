import React from 'react';
import { createRoot } from 'react-dom/client';
import ShiftScheduler from './ShiftScheduler.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ShiftScheduler />
  </React.StrictMode>
);
