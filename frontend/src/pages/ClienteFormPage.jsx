import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import ErrorNotification from '../components/ErrorNotification';
import styles from './ClienteFormPage.module.css';

export default function ClienteFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { execute, loading, error, clearError } = useApi();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo: 'contable',
    notas_sensibles: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const loadCliente = async () => {
    try {
      const data = await execute(`/api/clientes/${id}`);
      setFormData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        tipo: data.tipo || 'contable',
        notas_sensibles: data.notas_sensibles || ''
      });
    } catch {
      // Error manejado por useApi
    }
  };

  useEffect(() => {
    if (isEditMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCliente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length > 100) {
      errors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'El formato del email no es válido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validate()) return;

    try {
      // Limpiar campos vacíos opcionales para no enviar strings vacíos al backend si espera null o no enviar
      const payload = { ...formData };
      if (!payload.email) payload.email = null;
      if (!payload.telefono) payload.telefono = null;
      if (!payload.notas_sensibles) payload.notas_sensibles = null;

      if (isEditMode) {
        await execute(`/api/clientes/${id}`, {
          method: 'PUT',
          body: payload
        });
        navigate(`/clientes/${id}`);
      } else {
        const response = await execute('/api/clientes', {
          method: 'POST',
          body: payload
        });
        // Asumiendo que el backend retorna el cliente creado con su ID
        if (response && response.id) {
          navigate(`/clientes/${response.id}`);
        } else {
          navigate('/clientes');
        }
      }
    } catch {
      // Error manejado por useApi y mostrado en ErrorNotification
    }
  };

  // Si estamos cargando datos iniciales de edición (no al hacer submit)
  const isInitialLoading = isEditMode && loading && !formData.nombre;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
        <p className={styles.subtitle}>
          {isEditMode ? 'Actualiza la información del cliente.' : 'Registra un nuevo cliente en el sistema.'}
        </p>
      </div>

      <ErrorNotification error={error} onDismiss={clearError} />

      {isInitialLoading ? (
        <div className={styles.loading}>Cargando datos del cliente...</div>
      ) : (
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.label}>Nombre completo *</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className={`${styles.input} ${validationErrors.nombre ? styles.inputError : ''}`}
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                maxLength={100}
              />
              {validationErrors.nombre && <span className={styles.errorText}>{validationErrors.nombre}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="juan.perez@ejemplo.com"
              />
              {validationErrors.email && <span className={styles.errorText}>{validationErrors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefono" className={styles.label}>Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className={styles.input}
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+593 99 123 4567"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tipo" className={styles.label}>Tipo de cliente *</label>
              <select
                id="tipo"
                name="tipo"
                className={styles.select}
                value={formData.tipo}
                onChange={handleChange}
              >
                <option value="contable">Contable</option>
                <option value="medico">Médico</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notas_sensibles" className={styles.label}>Notas sensibles (Confidencial)</label>
              <textarea
                id="notas_sensibles"
                name="notas_sensibles"
                className={styles.textarea}
                value={formData.notas_sensibles}
                onChange={handleChange}
                placeholder="Información confidencial, contraseñas temporales, etc. Esta información se almacenará encriptada."
              />
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnCancel}
                onClick={() => navigate('/clientes')}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading && !isInitialLoading ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
