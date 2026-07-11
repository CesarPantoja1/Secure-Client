import { useState } from 'react';
import { Modal } from './layout/Modal';
import { useApi } from '../hooks/useApi';
import ErrorNotification from './ErrorNotification';
import styles from './UserModal.module.css';

export function EditUserModal({ user, onClose, onSuccess }) {
  const { execute, loading, error, clearError } = useApi();
  
  const [formData, setFormData] = useState({
    nombre_completo: user.nombre_completo || '',
    role: user.role || 'empleado',
    activo: user.activo ?? true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (value === 'true' ? true : value === 'false' ? false : value) 
    }));
  };

  const isFormValid = formData.nombre_completo.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      await execute(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: formData
      });
      onSuccess();
    } catch {
      // Manejado por useApi / ErrorNotification
    }
  };

  return (
    <Modal title="Editar Usuario" onClose={onClose}>
      <ErrorNotification error={error} onDismiss={clearError} />
      
      <form onSubmit={handleSubmit}>
        <div className={styles.modalContent}>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo electrónico (No editable)</label>
            <input 
              type="email" 
              value={user.email}
              className={styles.formInput} 
              disabled 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre completo</label>
            <input 
              type="text" 
              name="nombre_completo" 
              value={formData.nombre_completo}
              onChange={handleChange}
              className={styles.formInput} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rol de acceso</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Estado de la cuenta</label>
            <select 
              name="activo" 
              value={formData.activo} 
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value={true}>Activo</option>
              <option value={false}>Suspendido (Sin acceso)</option>
            </select>
          </div>
          
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={!isFormValid || loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
