// FILE: demo/src/components/admin/CreateForm.jsx
import { useState } from 'react';
import { X, Save, Loader2, Plus } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './CreateForm.css';

function CreateForm({ 
  activeTab, 
  onClose, 
  onSuccess,
  artists // Truyền thêm dữ liệu cần thiết
}) {
  const [formData, setFormData] = useState(getEmptyFormData());
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const getEmptyFormData = () => {
    switch(activeTab) {
      case 'songs':
        return { title: '', artist: '', duration: '', path: '', avatar: '' };
      case 'users':
        return { username: '', email: '', password: '', role: 'USER' };
      case 'artists':
        return { artistname: '', description: '' };
      case 'albums':
        return { albumname: '', releaseyear: new Date().getFullYear(), idartist: '' };
      case 'genres':
        return { genrename: '' };
      default:
        return {};
    }
  };

  // ... (tương tự như EditForm nhưng với hàm handleSubmit cho tạo mới)

  return (
    <div className="create-form-modal">
      {/* Tương tự như EditForm */}
    </div>
  );
}

export default CreateForm;