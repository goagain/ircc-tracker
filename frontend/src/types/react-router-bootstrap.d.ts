declare module 'react-router-bootstrap' {
  import { ComponentType, ReactNode } from 'react';
  import { LinkProps } from 'react-router-dom';

  export interface LinkContainerProps extends LinkProps {
    children: ReactNode;
  }

  export const LinkContainer: ComponentType<LinkContainerProps>;
} 