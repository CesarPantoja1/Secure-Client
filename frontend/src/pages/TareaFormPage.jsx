import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import ErrorNotification from '../components/ErrorNotification';
import styles from './TareaFormPage.module.css';

export default function TareaFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const clientesData = await execute('/api/clientes?page_size=100');
        if (clientesData && clientesData.items) {
          setClientes(clientesData.items);
        }
        
        // Si es admin, puede obtener los usuarios para asignarlos
        // Si es empleado, se listarán los disponibles si el endpoint lo permite (actualmente es solo admin)
        if (role === 'admin') {
          const usersData = await execute('/api/admin/users');
          if (usersData && usersData.users) {
            setUsers(usersData.users);
          }
        }
      } catch {
        // Ignorar errores de carga de diccionarios si no tienen permisos
      } finally {
        setLoadingDicts(false);
      }
    };
    
    fetchDictionaries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTarea = async () => {
    try {
      const data = await execute(`/api/tareas/${id}`);
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

  useEffect(() => {
    if (isEditMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTarea();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]);

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
        await execute(`/api/tareas/${id}`, {
          method: 'PUT',
          body: payload
        });
        navigate('/tareas');
      } else {
        await execute('/api/tareas', {
          method: 'POST',
          body: payload
        });
        navigate('/tareas');
      }
    } catch {
      // Error manejado por useApi
    }
  };

  const isInitialLoading = (isEditMode && loading && !formData.titulo) || loadingDicts;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEditMode ? 'Editar Tarea' : 'Nueva Tarea'}</h1>
        <p className={styles.subtitle}>
          {isEditMode ? 'Actualiza los detalles de la tarea.' : 'Asigna una nueva tarea a tu equipo vinculada a un cliente.'}
        </p>
      </div>

      <ErrorNotification error={error} onDismiss={clearError} />

      {isInitialLoading ? (
        <div className={styles.loading}>Cargando datos de la tarea...</div>
      ) : (
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            
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

            <div className={styles.formGroup}>
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

            <div className={styles.formGroup}>
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

            {role === 'admin' && (
              <div className={styles.formGroup}>
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

            <div className={styles.formGroup}>
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

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnCancel}
                onClick={() => navigate('/tareas')}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading && !isInitialLoading ? 'Guardando...' : 'Guardar Tarea'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
