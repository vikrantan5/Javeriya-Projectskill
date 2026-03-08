// In your registration form component (e.g., Register.js)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Password length validation
    if (formData.password.length > 72) {
      newErrors.password = 'Password cannot exceed 72 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For password field, enforce max length
    if (name === 'password' && value.length > 72) {
      return; // Don't update if exceeding 72 chars
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = formData;
    
    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors({ general: result.error });
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          maxLength={72} // HTML5 validation
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          {formData.password.length}/72 characters
        </p>
      </div>
      
      <div>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          maxLength={72}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      
      {errors.general && (
        <div className="text-red-500 text-sm">{errors.general}</div>
      )}
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg"
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default Register;