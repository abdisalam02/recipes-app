import React, { useEffect } from 'react';

const AddRecipePage: React.FC = () => {
  const [autoFetchImage, setAutoFetchImage] = React.useState(true);
  const [formData, setFormData] = React.useState({ image: '' });
  const [debouncedTitle, setDebouncedTitle] = React.useState('');
  const [fetchDefaultImage, setFetchDefaultImage] = React.useState(() => () => {});

  useEffect(() => {
    if (autoFetchImage && !formData.image?.trim()) {
      fetchDefaultImage();
    }
  }, [debouncedTitle, autoFetchImage, formData.image, fetchDefaultImage]);

  return (
    // Rest of the component code
  );
};

export default AddRecipePage; 