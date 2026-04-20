
import React from 'react';
import { User } from '../types';
import { Answers } from './common/formDefinitions';
import EmbeddedForm from './EmbeddedForm';

interface InteractiveModalProps {
  title: string;
  formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service';
  user: User;
  onClose: () => void;
  imageUrl?: string | string[];
  isBlurredImage?: boolean;
  description?: string;
  price?: string;
  onComplete?: (answers: Answers) => void;
  initialAnswers?: Answers;
}

const InteractiveModal: React.FC<InteractiveModalProps> = (props) => {
  return (
    <EmbeddedForm 
        {...props} 
    />
  );
};

export default InteractiveModal;
