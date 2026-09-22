import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Upload } from './pages/Upload';
import { Success } from './pages/Success';
import { GetFile } from './pages/GetFile';
import { Error as ErrorPage } from './pages/Error';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0a0d14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/success" element={<Success />} />
            <Route path="/get" element={<GetFile />} />
            <Route path="/get/:transferCode" element={<GetFile />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<Navigate to="/error" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
