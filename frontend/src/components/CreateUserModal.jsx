import { useState } from 'react';
import { Modal } from './layout/Modal';
import { useApi } from '../hooks/useApi';
import ErrorNotification from './ErrorNotification';
import styles from './UserModal.module.css';

export function CreateUserModal({ onClose, onSuccess }) {
  const { execute, loading, error, clearError } = useApi();
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    role: 'empleado'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.nombre_completo.trim() && 
                      formData.email.trim() && 
                      formData.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      await execute('/api/admin/users', {
        method: 'POST',
        body: formData
      });
      onSuccess();
    } catch {
      // El error es manejado y expuesto por useApi, por lo que ErrorNotification lo renderizará
    }
  };

  return (
    <Modal title="Nuevo Usuario" onClose={onClose}>
      <ErrorNotification error={error} onDismiss={clearError} />
      
      <form onSubmit={handleSubmit}>
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre completo</label>
            <input 
              type="text" 
              name="nombre_completo" 
              value={formData.nombre_completo}
              onChange={handleChange}
              className={styles.formInput} 
              placeholder="Ej. Juan Pérez"
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo electrónico</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              className={styles.formInput} 
              placeholder="juan@empresa.com"
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña temporal</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password}
              onChange={handleChange}
              className={styles.formInput} 
              placeholder="Mínimo 8 caracteres"
              minLength="8"
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
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={!isFormValid || loading}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
