import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import ErrorNotification from './ErrorNotification';
import styles from './TareaFormModal.module.css';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function TareaFormModal({ isOpen, onClose, onSuccess, tareaId = null }) {
  const isEditMode = Boolean(tareaId);
  const { role } = useAuth();
  const { execute, loading, error, clearError } = useApi();

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    cliente_id: '',
    estado: 'pendiente',
    prioridad: 'media',
    asignado_a: '',
    fecha_limite: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [clientes, setClientes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDicts, setLoadingDicts] = useState(true);

  // Prevenir scroll en el body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchDictionaries = async () => {
      try {
        const clientesData = await execute('/api/clientes?page_size=100');
        if (clientesData && clientesData.items) {
          setClientes(clientesData.items);
        }
        
        if (role === 'admin') {
          const usersData = await execute('/api/admin/users');
          if (usersData && usersData.users) {
            setUsers(usersData.users);
          }
        }
      } catch {
        // Ignorar errores de diccionarios
      } finally {
        setLoadingDicts(false);
      }
    };
    
    fetchDictionaries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      const loadTarea = async () => {
        try {
          const data = await execute(`/api/tareas/${tareaId}`);
          setFormData({
            titulo: data.titulo || '',
            descripcion: data.descripcion || '',
            cliente_id: data.cliente_id || '',
            estado: data.estado || 'pendiente',
            prioridad: data.prioridad || 'media',
            asignado_a: data.asignado_a || '',
            fecha_limite: data.fecha_limite ? data.fecha_limite.substring(0, 10) : ''
          });
        } catch {
          // Error manejado por useApi
        }
      };
      loadTarea();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        titulo: '',
        descripcion: '',
        cliente_id: '',
        estado: 'pendiente',
        prioridad: 'media',
        asignado_a: '',
        fecha_limite: ''
      });
      setValidationErrors({});
      clearError();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, tareaId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es obligatorio';
    } else if (formData.titulo.length > 255) {
      errors.titulo = 'El título no puede exceder 255 caracteres';
    }

    if (!formData.cliente_id) {
      errors.cliente_id = 'Debes asociar la tarea a un cliente';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validate()) return;

    try {
      const payload = { ...formData };
      if (!payload.descripcion) payload.descripcion = null;
      if (!payload.asignado_a) payload.asignado_a = null;
      if (!payload.fecha_limite) payload.fecha_limite = null;

      if (isEditMode) {
        await execute(`/api/tareas/${tareaId}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        await execute('/api/tareas', {
          method: 'POST',
          body: payload
        });
      }
      onSuccess();
    } catch {
      // Error manejado por useApi
    }
  };

  const isInitialLoading = (isEditMode && loading && !formData.titulo) || loadingDicts;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <div className={styles.titleGroup}>
            <h2>{isEditMode ? 'Editar tarea' : 'Nueva tarea'}</h2>
            <p>Los campos marcados con * son obligatorios.</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar modal">
            <XIcon />
          </button>
        </div>

        <div className={styles.modalBody}>
          <ErrorNotification error={error} onDismiss={clearError} />

          {isInitialLoading ? (
            <div className={styles.loading}>Cargando datos...</div>
          ) : (
            <form id="tarea-form" onSubmit={handleSubmit}>
              
              <div className={styles.formGroup}>
                <label htmlFor="titulo" className={styles.label}>Título de la tarea *</label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  className={`${styles.input} ${validationErrors.titulo ? styles.inputError : ''}`}
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej. Revisión de contrato anual"
                  maxLength={255}
                />
                {validationErrors.titulo && <span className={styles.errorText}>{validationErrors.titulo}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cliente_id" className={styles.label}>Cliente asociado *</label>
                <select
                  id="cliente_id"
                  name="cliente_id"
                  className={`${styles.select} ${validationErrors.cliente_id ? styles.inputError : ''}`}
                  value={formData.cliente_id}
                  onChange={handleChange}
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {validationErrors.cliente_id && <span className={styles.errorText}>{validationErrors.cliente_id}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="descripcion" className={styles.label}>Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className={styles.textarea}
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Detalles sobre lo que hay que hacer en esta tarea..."
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="estado" className={styles.label}>Estado</label>
                  <select
                    id="estado"
                    name="estado"
                    className={styles.select}
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="prioridad" className={styles.label}>Prioridad</label>
                  <select
                    id="prioridad"
                    name="prioridad"
                    className={styles.select}
                    value={formData.prioridad}
                    onChange={handleChange}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                {role === 'admin' && (
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label htmlFor="asignado_a" className={styles.label}>Asignar a responsable</label>
                    <select
                      id="asignado_a"
                      name="asignado_a"
                      className={styles.select}
                      value={formData.asignado_a}
                      onChange={handleChange}
                    >
                      <option value="">-- Sin asignar --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre_completo || u.email}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="fecha_limite" className={styles.label}>Fecha límite</label>
                  <input
                    id="fecha_limite"
                    name="fecha_limite"
                    type="date"
                    className={styles.input}
                    value={formData.fecha_limite}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </form>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button 
            type="button" 
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="tarea-form"
            className={styles.btnSubmit}
            disabled={loading || isInitialLoading}
          >
            {loading && !isInitialLoading ? 'Guardando...' : 'Guardar tarea'}
          </button>
        </div>

      </div>
    </div>
  );
}
