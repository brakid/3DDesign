import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Gallery } from './pages/Gallery';
import { DesignViewer } from './pages/DesignViewer';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/design/:id" element={<DesignViewer />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
