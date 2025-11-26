import { useState, useCallback } from 'react';

/**
 * Hook useForm - Manejo simplificado de formularios con validación
 *
 * Reemplaza el patrón repetido en 20+ componentes de:
 * - useState para formData
 * - handleChange functions
 * - Validación manual
 * - Manejo de errores por campo
 *
 * @param {object} initialValues - Valores iniciales del formulario
 * @param {object} validationRules - Reglas de validación por campo
 * @param {function} onSubmit - Función a ejecutar al enviar (opcional)
 *
 * @returns {object} { values, errors, touched, isSubmitting, setValue, setFieldTouched, handleSubmit, reset }
 *
 * @example
 * // Formulario básico
 * const { values, errors, setValue, handleSubmit } = useForm(
 *   { name: '', email: '' },
 *   {
 *     name: { required: true, minLength: 2 },
 *     email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
 *   }
 * );
 *
 * const onSubmit = async (formData) => {
 *   await api.create(formData);
 * };
 *
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input
 *     value={values.name}
 *     onChange={(e) => setValue('name', e.target.value)}
 *   />
 *   {errors.name && <span>{errors.name}</span>}
 * </form>
 *
 * @example
 * // Con validación personalizada
 * const rules = {
 *   password: {
 *     required: true,
 *     minLength: 8,
 *     validate: (value) => /[A-Z]/.test(value),
 *     validateMessage: 'Debe contener al menos una mayúscula'
 *   }
 * };
 */
export const useForm = (initialValues = {}, validationRules = {}, onSubmitCallback = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valida un campo individual
   */
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.requiredMessage || `${fieldName} es requerido`;
    }

    // Pattern (regex)
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.patternMessage || `${fieldName} tiene formato inválido`;
    }

    // Min length
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `${fieldName} debe tener al menos ${rules.minLength} caracteres`;
    }

    // Max length
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `${fieldName} no puede tener más de ${rules.maxLength} caracteres`;
    }

    // Min value (para números)
    if (rules.min !== undefined && value < rules.min) {
      return rules.minMessage || `${fieldName} debe ser al menos ${rules.min}`;
    }

    // Max value (para números)
    if (rules.max !== undefined && value > rules.max) {
      return rules.maxMessage || `${fieldName} no puede ser mayor a ${rules.max}`;
    }

    // Custom validation
    if (rules.validate && value) {
      const isValid = rules.validate(value, values);
      if (!isValid) {
        return rules.validateMessage || `${fieldName} es inválido`;
      }
    }

    // Match (comparar con otro campo)
    if (rules.match && value !== values[rules.match]) {
      return rules.matchMessage || `${fieldName} no coincide`;
    }

    return null;
  }, [validationRules, values]);

  /**
   * Establece el valor de un campo y valida si ya fue tocado
   */
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Validar si el campo ya fue tocado
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [touched, validateField]);

  /**
   * Marca un campo como tocado y valida
   */
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));

    if (isTouched) {
      const error = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [values, validateField]);

  /**
   * Valida todos los campos del formulario
   */
  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    // Marcar todos como tocados
    const allTouched = {};
    Object.keys(validationRules).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);

    return isValid;
  }, [validationRules, values, validateField]);

  /**
   * Maneja el submit del formulario
   */
  const handleSubmit = useCallback((submitCallback) => {
    return async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setIsSubmitting(true);

      try {
        const isValid = validateAll();

        if (isValid) {
          const callback = submitCallback || onSubmitCallback;
          if (callback) {
            await callback(values);
          }
        } else {
          console.log('❌ Formulario inválido:', errors);
        }
      } catch (error) {
        console.error('❌ Error en submit:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateAll, errors, onSubmitCallback]);

  /**
   * Resetea el formulario a valores iniciales
   */
  const reset = useCallback((newValues = null) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Establece múltiples valores a la vez
   */
  const setFieldValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Establece un error manualmente
   */
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    setFieldValues,
    setFieldError,
    handleSubmit,
    validateAll,
    reset,
  };
};

export default useForm;
