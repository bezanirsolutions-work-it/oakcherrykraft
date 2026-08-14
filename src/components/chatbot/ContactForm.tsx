import { useState } from 'react';
import { Button } from '../ui/Button';

interface ContactFormProps {
  onSubmit: (details: { name: string; phone: string; email: string }) => Promise<void>;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

// Email validation regex matching the Supabase constraint
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function ContactForm({ onSubmit, isLoading = false }: ContactFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const newErrors: FormErrors = { ...errors };
    
    if (field === 'name' && !name.trim()) {
      newErrors.name = 'Name is required';
    } else if (field === 'name') {
      delete newErrors.name;
    }

    if (field === 'phone' && !phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (field === 'phone') {
      delete newErrors.phone;
    }

    if (field === 'email' && !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (field === 'email' && email.trim() && !EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (field === 'email') {
      delete newErrors.email;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    } catch (err) {
      console.error('Failed to submit contact form', err);
      setErrors({ name: 'Failed to connect. Please try again.' });
    }
  };

  const isValid = name.trim() && phone.trim() && email.trim() && EMAIL_REGEX.test(email);

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <p className="text-sm font-medium text-bark mb-3">
          Before we connect you with our team, please share your contact details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name Field */}
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-bark mb-1">
            Full Name
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur('name')}
            className="w-full px-3 py-2 text-sm border border-bark/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oak-500/50 focus:border-oak-500"
          />
          {touched.name && errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-bark mb-1">
            Phone Number
          </label>
          <input
            id="contact-phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => handleBlur('phone')}
            className="w-full px-3 py-2 text-sm border border-bark/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oak-500/50 focus:border-oak-500"
          />
          {touched.phone && errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-bark mb-1">
            Email Address
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            className="w-full px-3 py-2 text-sm border border-bark/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-oak-500/50 focus:border-oak-500"
          />
          {touched.email && errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Error message for other errors */}
        {errors.name && !touched.name && (
          <p className="text-xs text-red-600">{errors.name}</p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full"
          variant="primary"
        >
          {isLoading ? 'Connecting...' : 'Continue to Live Chat'}
        </Button>
      </form>
    </div>
  );
}
