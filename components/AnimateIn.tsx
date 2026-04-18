
import React from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  delay?: string;
  duration?: string;
  from?: string;
  className?: string;
}

const AnimateIn: React.FC<AnimateInProps> = ({
  children,
  delay = '',
  duration = 'duration-300',
  from = 'fade-in',
  className = ''
}) => {
  const animationClasses = `animate-in ${from} ${delay} ${duration} ${className}`;

  return (
    <div className={animationClasses}>
      {children}
    </div>
  );
};

export default AnimateIn;
