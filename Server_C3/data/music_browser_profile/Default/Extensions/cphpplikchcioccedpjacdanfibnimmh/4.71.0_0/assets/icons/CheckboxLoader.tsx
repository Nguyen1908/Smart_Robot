import React from 'react';
import styled, { keyframes } from 'styled-components';

type Props = {
  height: number | string;
  width: number | string;
};

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const StyledCheckboxLoader = styled.svg<Props>`
  animation: ${spin} 1s linear infinite;
  width: ${({ width }) => width ?? '24'}px;
  height: ${({ height }) => height ?? '24'}px;
`;

const CheckboxLoader: React.FC<Props> = ({ height, width }) => {
  return (
    <StyledCheckboxLoader
      fill="none"
      height={height}
      viewBox="0 0 24 24"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 24C18.627 24 24 18.6274 24 12.001C24.002 5.37258 18.6289 0 12 0C5.37302 0 0 5.37258 0 11.999C0 18.6274 5.37302 24 12 24Z"
        fill="#E8F3EB"
      />
      <path
        d="M6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6"
        stroke="#178733"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </StyledCheckboxLoader>
  );
};

export default CheckboxLoader;
