import React from 'react';
import styles from './ErrorNotification.module.css';

export default function ErrorNotification({ error, onDismiss }) {
  if (!error) return null;

  let type = 'error';
  if (error.status === 429 || error.status === 403) {
    type = 'warning';
  } else if (error.status >= 500) {
    type = 'critical';
  }

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        <p className={styles.message}>{error.message}</p>
        
        {error.errorId && (
          <p className={styles.errorId}>Ref ID: {error.errorId}</p>
        )}
        
        {Array.isArray(error.details) && error.details.length > 0 && (
          <ul className={styles.details}>
            {error.details.map((detail, index) => {
              const text = typeof detail === 'string' ? detail : (detail.msg || detail.message || JSON.stringify(detail));
              return <li key={index}>{text}</li>;
            })}
          </ul>
        )}
      </div>
      
      <button className={styles.closeBtn} onClick={onDismiss} type="button">
        Cerrar
      </button>
    </div>
  );
}
