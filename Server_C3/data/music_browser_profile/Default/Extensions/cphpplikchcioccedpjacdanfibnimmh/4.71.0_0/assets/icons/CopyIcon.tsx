import * as React from 'react';
import styled from 'styled-components';

const Svg = styled.svg`
  width: 12px;
  height: 12px;
`;

function CopyIcon(props) {
  return (
    <Svg fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M2.5 11a.963.963 0 0 1-.706-.294A.963.963 0 0 1 1.5 10V3.5c0-.142.048-.26.144-.356A.484.484 0 0 1 2 3c.142 0 .26.048.356.144A.484.484 0 0 1 2.5 3.5V10h5c.142 0 .26.048.356.144A.484.484 0 0 1 8 10.5c0 .142-.048.26-.144.356A.484.484 0 0 1 7.5 11h-5Zm2-2a.963.963 0 0 1-.706-.294A.963.963 0 0 1 3.5 8V2c0-.275.098-.51.294-.706A.963.963 0 0 1 4.5 1H9c.275 0 .51.098.706.294A.963.963 0 0 1 10 2v6c0 .275-.098.51-.294.706A.963.963 0 0 1 9 9H4.5Zm0-1H9V2H4.5v6Z"
        fill="#7C7C7C"
      />
    </Svg>
  );
}
export default CopyIcon;
